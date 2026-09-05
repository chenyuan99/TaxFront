/**
 * Tests for the backend job/notification writers.
 *
 * A tiny in-memory Firestore stub stands in for the real client: the helpers
 * only ever touch `collection().doc()`, `get/set/update`, and `runTransaction`,
 * so the stub can be exact about what the frontend will end up reading.
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import {
  JOBS_COLLECTION,
  NOTIFICATIONS_COLLECTION,
  completeJob,
  createJob,
  failJob,
  markJobProcessing,
} from "../src/jobs";

// ── in-memory Firestore stub ───────────────────────────────────────────────

type Store = Record<string, Record<string, Record<string, unknown>>>;

function makeDb() {
  const store: Store = {};
  let autoId = 0;

  const docRef = (path: string, id: string) => ({
    __path: path,
    __id: id,
    async set(data: Record<string, unknown>) {
      (store[path] ??= {})[id] = { ...data };
    },
    async update(data: Record<string, unknown>) {
      const existing = store[path]?.[id];
      if (!existing) throw new Error(`No document to update at ${path}/${id}`);
      store[path][id] = { ...existing, ...data };
    },
    async get() {
      const data = store[path]?.[id];
      return { exists: data !== undefined, id, data: () => data };
    },
  });

  const db = {
    collection: (path: string) => ({
      doc: (id?: string) => docRef(path, id ?? `auto-${++autoId}`),
    }),
    // Writes are buffered and flushed on success, mirroring the real thing
    // closely enough that an early return leaves nothing behind.
    runTransaction: async (fn: (transaction: unknown) => Promise<void>) => {
      const ops: Array<() => Promise<void>> = [];
      await fn({
        get: (ref: ReturnType<typeof docRef>) => ref.get(),
        set(ref: ReturnType<typeof docRef>, data: Record<string, unknown>) {
          ops.push(() => ref.set(data));
        },
        update(ref: ReturnType<typeof docRef>, data: Record<string, unknown>) {
          ops.push(() => ref.update(data));
        },
      });
      for (const op of ops) await op();
    },
  };

  return {
    db: db as unknown as Firestore,
    jobs: () => store[JOBS_COLLECTION] ?? {},
    notifications: () => Object.values(store[NOTIFICATIONS_COLLECTION] ?? {}),
  };
}

// ── tests ──────────────────────────────────────────────────────────────────

const INPUT = { userId: "user-1", documentId: "doc-1", documentName: "w2.pdf" };

let ctx: ReturnType<typeof makeDb>;

beforeEach(() => {
  ctx = makeDb();
});

describe("createJob", () => {
  it("keys the job by document id so a retried trigger reuses it", async () => {
    const first = await createJob(ctx.db, INPUT);
    const second = await createJob(ctx.db, INPUT);

    expect(first).toBe("doc-1");
    expect(second).toBe(first);
    expect(Object.keys(ctx.jobs())).toEqual(["doc-1"]);
  });

  it("opens the job pending, owned by the uploader, with no notification yet", async () => {
    const jobId = await createJob(ctx.db, INPUT);

    expect(ctx.jobs()[jobId]).toMatchObject({
      userId: "user-1",
      documentId: "doc-1",
      documentName: "w2.pdf",
      status: "pending",
    });
    expect(ctx.notifications()).toHaveLength(0);
  });
});

describe("markJobProcessing", () => {
  it("advances the status without notifying — it is not a terminal state", async () => {
    const jobId = await createJob(ctx.db, INPUT);
    await markJobProcessing(ctx.db, jobId);

    expect(ctx.jobs()[jobId].status).toBe("processing");
    expect(ctx.notifications()).toHaveLength(0);
  });
});

describe("completeJob", () => {
  it("stores the result and notifies the owner", async () => {
    const jobId = await createJob(ctx.db, INPUT);
    await markJobProcessing(ctx.db, jobId);
    await completeJob(ctx.db, jobId, { documentType: "W-2", fieldsExtracted: 6 });

    expect(ctx.jobs()[jobId]).toMatchObject({
      status: "completed",
      result: { documentType: "W-2", fieldsExtracted: 6 },
    });

    const [notification] = ctx.notifications();
    expect(notification).toMatchObject({
      userId: "user-1",
      jobId,
      documentId: "doc-1",
      documentName: "w2.pdf",
      type: "job_completed",
      read: false,
    });
    expect(notification.message).toContain("w2.pdf");
  });

  it("does not notify twice when the trigger is retried after success", async () => {
    const jobId = await createJob(ctx.db, INPUT);
    await completeJob(ctx.db, jobId, { documentType: "W-2" });
    await completeJob(ctx.db, jobId, { documentType: "W-2" });

    expect(ctx.notifications()).toHaveLength(1);
  });

  it("ignores a job that no longer exists", async () => {
    await expect(completeJob(ctx.db, "missing", {})).resolves.toBeUndefined();
    expect(ctx.notifications()).toHaveLength(0);
  });
});

describe("failJob", () => {
  it("records the reason and carries it into the notification message", async () => {
    const jobId = await createJob(ctx.db, INPUT);
    await failJob(ctx.db, jobId, "Gemini extraction failed: quota exceeded");

    expect(ctx.jobs()[jobId]).toMatchObject({
      status: "failed",
      error: "Gemini extraction failed: quota exceeded",
    });

    const [notification] = ctx.notifications();
    expect(notification.type).toBe("job_failed");
    expect(notification.message).toContain("quota exceeded");
  });

  it("cannot overwrite a job that already completed", async () => {
    const jobId = await createJob(ctx.db, INPUT);
    await completeJob(ctx.db, jobId, {});
    await failJob(ctx.db, jobId, "late failure");

    expect(ctx.jobs()[jobId].status).toBe("completed");
    expect(ctx.notifications()).toHaveLength(1);
  });
});
