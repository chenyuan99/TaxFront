import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { runAccountantAgent } from "./flows/accountant";
import { runAuditorAgent } from "./flows/auditor";

initializeApp();

const GOOGLE_GENAI_API_KEY = defineSecret("GOOGLE_GENAI_API_KEY");

// ---------------------------------------------------------------------------
// AI agent functions (Gen 2 — higher memory, longer timeout)
// ---------------------------------------------------------------------------

export const runAccountant = onCall(
  { secrets: [GOOGLE_GENAI_API_KEY], memory: "1GiB", timeoutSeconds: 300, cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

    const { userId, filingStatus, task } = request.data as Record<string, string>;
    if (!userId) throw new HttpsError("invalid-argument", "userId is required");

    process.env.GOOGLE_GENAI_API_KEY = GOOGLE_GENAI_API_KEY.value();
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
  { secrets: [GOOGLE_GENAI_API_KEY], memory: "1GiB", timeoutSeconds: 300, cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated");

    const { userId, task } = request.data as Record<string, string>;
    if (!userId) throw new HttpsError("invalid-argument", "userId is required");

    process.env.GOOGLE_GENAI_API_KEY = GOOGLE_GENAI_API_KEY.value();
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
// Firestore trigger: mark new documents as processed
// ---------------------------------------------------------------------------

export const processNewTaxDocument = onDocumentCreated("taxDocuments/{documentId}", async (event) => {
  const document = event.data;
  if (!document) return;

  await document.ref.update({
    processedAt: new Date().toISOString(),
    status: "processed",
  });
});
