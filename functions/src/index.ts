import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { runAccountantAgent } from "./flows/accountant";
import { runAuditorAgent } from "./flows/auditor";
import { extractTaxDocument } from "./flows/extractor";
import { NOTIFICATIONS_COLLECTION, completeJob, createJob, failJob, markJobProcessing } from "./jobs";
import { sendPushToUser } from "./push";

initializeApp();

// ---------------------------------------------------------------------------
// AI agent functions (Gen 2 — higher memory, longer timeout)
// ---------------------------------------------------------------------------

export const runAccountant = onCall(
  { memory: "1GiB", timeoutSeconds: 300, cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

    const { userId, filingStatus, task } = request.data as Record<string, string>;
    if (!userId) throw new HttpsError("invalid-argument", "userId is required");

    const db = getFirestore();

    try {
      const output = await runAccountantAgent(db, { userId, filingStatus, task });
      return { status: "ok", userId, output };
    } catch (err) {
      throw new HttpsError("internal", (err as Error).message);
    }
  }
);

export const runAuditor = onCall(
  { memory: "1GiB", timeoutSeconds: 300, cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

    const { userId, task } = request.data as Record<string, string>;
    if (!userId) throw new HttpsError("invalid-argument", "userId is required");

    const db = getFirestore();

    try {
      const output = await runAuditorAgent(db, { userId, task });
      return { status: "ok", userId, output };
    } catch (err) {
      throw new HttpsError("internal", (err as Error).message);
    }
  }
);

// ---------------------------------------------------------------------------
// Firestore CRUD functions (lightweight, no AI)
// ---------------------------------------------------------------------------

export const createUserProfile = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

  const data = request.data as Record<string, unknown>;
  const required = ["name", "taxId", "businessType"];
  for (const field of required) {
    if (!data[field]) throw new HttpsError("invalid-argument", `Missing required field: ${field}`);
  }

  data.updatedAt = new Date().toISOString();
  await getFirestore().collection("users").doc(request.auth.uid).set(data, { merge: true });
  return { message: "Profile updated successfully" };
});

export const getTaxDocuments = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

  const db = getFirestore();
  const snapshot = await db
    .collection("taxDocuments")
    .where("userId", "==", request.auth.uid)
    .orderBy("uploadDate", "desc")
    .limit(100)
    .get();

  const documents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return { documents };
});

export const getTaxSummary = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

  const db = getFirestore();
  const snapshot = await db
    .collection("taxDocuments")
    .where("userId", "==", request.auth.uid)
    .orderBy("uploadDate", "desc")
    .limit(100)
    .get();

  let totalDocuments = 0;
  const documentTypes: Record<string, number> = {};
  let lastUpdated: string | null = null;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    totalDocuments++;
    const docType: string = data.type ?? "unknown";
    documentTypes[docType] = (documentTypes[docType] ?? 0) + 1;
    const uploadDate: string = data.uploadDate;
    if (uploadDate && (!lastUpdated || uploadDate > lastUpdated)) lastUpdated = uploadDate;
  }

  return { totalDocuments, documentTypes, lastUpdated };
});

// ---------------------------------------------------------------------------
// Firestore trigger: extract structured data from newly uploaded tax documents
// ---------------------------------------------------------------------------

export const processNewTaxDocument = onDocumentCreated(
  { document: "taxDocuments/{documentId}", timeoutSeconds: 300, memory: "512MiB" },
  async (event) => {
    const document = event.data;
    if (!document) return;

    const data = document.data();
    const url: string | undefined = data?.url;
    const name: string = data?.name ?? data?.originalName ?? "document.pdf";
    const mimeType: string = data?.type ?? "";
    const userId: string | undefined = data?.userId;

    const db = getFirestore();

    // The job record is how this trigger reports back: it has no HTTP response
    // to return to, so progress and the final outcome are pushed to the client
    // through `jobs` and `notifications` instead. A document with no owner
    // still gets extracted, it just has nobody to notify.
    const jobId = userId
      ? await createJob(db, { userId, documentId: document.id, documentName: name })
      : null;

    if (!url) {
      const error = "No download URL in document record — cannot extract data";
      await document.ref.update({
        status: "error",
        errorMessage: error,
        processedAt: new Date().toISOString(),
      });
      if (jobId) await failJob(db, jobId, error);
      return;
    }

    if (jobId) await markJobProcessing(db, jobId);

    const result = await extractTaxDocument(db, document.id, url, name, mimeType);
    if (!jobId) return;

    if (result.ok) {
      await completeJob(db, jobId, {
        documentType: result.documentType,
        taxYear: result.taxYear,
        fieldsExtracted: result.fieldsExtracted,
      });
    } else {
      await failJob(db, jobId, result.error);
    }
  }
);

// ---------------------------------------------------------------------------
// Firestore trigger: fan a new notification out to the user's devices via FCM
// ---------------------------------------------------------------------------

/**
 * Push runs off the notification row rather than inline in the job, so any
 * future code that writes a notification gets web push for free — and a failed
 * send retries on its own without re-running the extraction that produced it.
 */
export const pushNewNotification = onDocumentCreated(
  { document: `${NOTIFICATIONS_COLLECTION}/{notificationId}`, timeoutSeconds: 60 },
  async (event) => {
    const notification = event.data;
    if (!notification) return;

    const data = notification.data();
    const userId: string | undefined = data?.userId;
    if (!userId) return;

    const outcome = await sendPushToUser(getFirestore(), getMessaging(), userId, {
      title: data.title ?? "TaxFront",
      body: data.message ?? "",
      link: "/jobs",
      tag: data.jobId,
    });

    if (outcome.failed > 0 || outcome.pruned > 0) {
      console.warn(
        `Push for notification ${notification.id}: sent=${outcome.sent} failed=${outcome.failed} pruned=${outcome.pruned}`
      );
    }
  }
);
