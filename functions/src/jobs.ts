/**
 * Backend-owned job records and the notifications they emit.
 *
 * Long-running work (document extraction today, agent runs later) happens in a
 * Firestore trigger with no HTTP response to return to. The job record *is* the
 * channel: the backend writes progress to `jobs/{jobId}`, and on a terminal
 * state it also writes a `notifications/{id}` row. The frontend holds an
 * `onSnapshot` listener on both, so a completion reaches an open tab as a push
 * rather than something it has to poll for.
 *
 * A completion writes the job update and its notification in one transaction, so
 * the frontend can never observe a finished job without its notification, and a
 * redelivered trigger cannot notify twice.
 */
import type { Firestore, Transaction } from "firebase-admin/firestore";

export const JOBS_COLLECTION = "jobs";
export const NOTIFICATIONS_COLLECTION = "notifications";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type NotificationType = "job_completed" | "job_failed";

export interface CreateJobInput {
  userId: string;
  documentId: string;
  documentName: string;
}

/**
 * Opens a job for a document upload.
 *
 * The job id is the document id: `processNewTaxDocument` fires once per
 * document, and a deterministic id keeps a retried invocation from opening a
 * second job for the same upload.
 */
export async function createJob(db: Firestore, input: CreateJobInput): Promise<string> {
  const now = new Date().toISOString();
  const jobId = input.documentId;

  await db.collection(JOBS_COLLECTION).doc(jobId).set({
    userId: input.userId,
    documentId: input.documentId,
    documentName: input.documentName,
    status: "pending" satisfies JobStatus,
    createdAt: now,
    updatedAt: now,
  });

  return jobId;
}

/** Marks a job as running. Not a terminal state, so no notification is sent. */
export async function markJobProcessing(db: Firestore, jobId: string): Promise<void> {
  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    status: "processing" satisfies JobStatus,
    updatedAt: new Date().toISOString(),
  });
}

/** Closes a job as succeeded and notifies its owner. */
export async function completeJob(
  db: Firestore,
  jobId: string,
  result?: Record<string, unknown>
): Promise<void> {
  await finishJob(db, jobId, "completed", {
    ...(result !== undefined && { result }),
  });
}

/** Closes a job as failed and notifies its owner with the reason. */
export async function failJob(db: Firestore, jobId: string, error: string): Promise<void> {
  await finishJob(db, jobId, "failed", { error });
}

/**
 * Writes the terminal job state and its notification atomically.
 *
 * The job is read inside the transaction because the notification carries the
 * document name, and because a job that has already finished must not notify
 * twice — `onDocumentCreated` delivers at least once, so the guard has to hold
 * against a redelivery that overlaps the first run.
 */
async function finishJob(
  db: Firestore,
  jobId: string,
  status: Extract<JobStatus, "completed" | "failed">,
  patch: Record<string, unknown>
): Promise<void> {
  const jobRef = db.collection(JOBS_COLLECTION).doc(jobId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(jobRef);
    if (!snapshot.exists) return;

    const job = snapshot.data() ?? {};
    if (job.status === "completed" || job.status === "failed") return;

    const now = new Date().toISOString();
    transaction.update(jobRef, { ...patch, status, updatedAt: now });

    const userId: string | undefined = job.userId;
    if (userId) {
      queueNotification(db, transaction, {
        userId,
        jobId,
        documentId: job.documentId,
        documentName: job.documentName,
        status,
        error: typeof patch.error === "string" ? patch.error : undefined,
        createdAt: now,
      });
    }
  });
}

interface NotificationInput {
  userId: string;
  jobId: string;
  documentId?: string;
  documentName?: string;
  status: Extract<JobStatus, "completed" | "failed">;
  error?: string;
  createdAt: string;
}

function queueNotification(db: Firestore, transaction: Transaction, input: NotificationInput): void {
  const label = input.documentName ?? "Your document";
  const succeeded = input.status === "completed";

  transaction.set(db.collection(NOTIFICATIONS_COLLECTION).doc(), {
    userId: input.userId,
    jobId: input.jobId,
    type: (succeeded ? "job_completed" : "job_failed") satisfies NotificationType,
    title: succeeded ? "Document processed" : "Document processing failed",
    message: succeeded
      ? `${label} finished processing.`
      : `${label} could not be processed: ${input.error ?? "unknown error"}`,
    read: false,
    createdAt: input.createdAt,
    ...(input.documentId !== undefined && { documentId: input.documentId }),
    ...(input.documentName !== undefined && { documentName: input.documentName }),
  });
}
