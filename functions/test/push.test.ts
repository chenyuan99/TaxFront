/**
 * Tests for FCM fan-out.
 *
 * Both Firestore and Messaging are stubbed, so the suite covers the parts that
 * actually bite in production: token pruning, chunking, and the guarantee that
 * a push failure never escapes to fail the job that triggered it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import type { Messaging } from "firebase-admin/messaging";
import { sendPushToUser } from "../src/push";

// ── stubs ──────────────────────────────────────────────────────────────────

function makeDb(tokensByUser: Record<string, string[]>, opts: { readThrows?: boolean } = {}) {
  const deleted: string[] = [];

  const tokensRef = (userId: string) => ({
    doc: (token: string) => ({ __token: token, __userId: userId }),
    async get() {
      if (opts.readThrows) throw new Error("permission-denied");
      return { docs: (tokensByUser[userId] ?? []).map((token) => ({ id: token })) };
    },
  });

  const db = {
    collection: (_path: string) => ({
      doc: (userId: string) => ({ collection: () => tokensRef(userId) }),
    }),
    batch: () => ({
      delete(ref: { __token: string }) {
        deleted.push(ref.__token);
      },
      async commit() {
        /* deletions are recorded eagerly above */
      },
    }),
  };

  return { db: db as unknown as Firestore, deleted };
}

type SendResult = { success: boolean; error?: { code: string } };

function makeMessaging(perCall: SendResult[][]) {
  const sendEachForMulticast = vi.fn(async () => {
    const responses = perCall.shift() ?? [];
    return { responses, successCount: 0, failureCount: 0 };
  });
  return {
    messaging: { sendEachForMulticast } as unknown as Messaging,
    sendEachForMulticast,
  };
}

const PAYLOAD = { title: "Document processed", body: "w2.pdf finished.", link: "/jobs", tag: "doc-1" };

const ok: SendResult = { success: true };
const dead: SendResult = { success: false, error: { code: "messaging/registration-token-not-registered" } };
const transient: SendResult = { success: false, error: { code: "messaging/internal-error" } };

// ── tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("sendPushToUser", () => {
  it("sends a data-only message to every registered token", async () => {
    const { db } = makeDb({ "user-1": ["t1", "t2"] });
    const { messaging, sendEachForMulticast } = makeMessaging([[ok, ok]]);

    const outcome = await sendPushToUser(db, messaging, "user-1", PAYLOAD);

    expect(outcome).toEqual({ sent: 2, failed: 0, pruned: 0 });
    const request = sendEachForMulticast.mock.calls[0][0] as Record<string, unknown>;
    expect(request.tokens).toEqual(["t1", "t2"]);
    expect(request.data).toEqual({
      title: "Document processed",
      body: "w2.pdf finished.",
      link: "/jobs",
      tag: "doc-1",
    });
    // A `notification` block would make the browser render its own copy on top
    // of the one the service worker shows.
    expect(request).not.toHaveProperty("notification");
  });

  it("does not call FCM when the user has no devices registered", async () => {
    const { db } = makeDb({ "user-1": [] });
    const { messaging, sendEachForMulticast } = makeMessaging([]);

    const outcome = await sendPushToUser(db, messaging, "user-1", PAYLOAD);

    expect(outcome).toEqual({ sent: 0, failed: 0, pruned: 0 });
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it("prunes permanently dead tokens but keeps ones that failed transiently", async () => {
    const { db, deleted } = makeDb({ "user-1": ["good", "gone", "flaky"] });
    const { messaging } = makeMessaging([[ok, dead, transient]]);

    const outcome = await sendPushToUser(db, messaging, "user-1", PAYLOAD);

    expect(outcome).toEqual({ sent: 1, failed: 2, pruned: 1 });
    expect(deleted).toEqual(["gone"]);
  });

  it("chunks past the 500-token multicast limit", async () => {
    const tokens = Array.from({ length: 501 }, (_, i) => `t${i}`);
    const { db } = makeDb({ "user-1": tokens });
    const { messaging, sendEachForMulticast } = makeMessaging([
      Array(500).fill(ok),
      [ok],
    ]);

    const outcome = await sendPushToUser(db, messaging, "user-1", PAYLOAD);

    expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
    expect((sendEachForMulticast.mock.calls[0][0] as { tokens: string[] }).tokens).toHaveLength(500);
    expect((sendEachForMulticast.mock.calls[1][0] as { tokens: string[] }).tokens).toEqual(["t500"]);
    expect(outcome.sent).toBe(501);
  });

  it("swallows a send failure — push must never fail the job that triggered it", async () => {
    const { db } = makeDb({ "user-1": ["t1"] });
    const messaging = {
      sendEachForMulticast: vi.fn().mockRejectedValue(new Error("FCM unavailable")),
    } as unknown as Messaging;

    const outcome = await sendPushToUser(db, messaging, "user-1", PAYLOAD);

    expect(outcome).toEqual({ sent: 0, failed: 1, pruned: 0 });
  });

  it("swallows a token lookup failure", async () => {
    const { db } = makeDb({}, { readThrows: true });
    const { messaging, sendEachForMulticast } = makeMessaging([]);

    const outcome = await sendPushToUser(db, messaging, "user-1", PAYLOAD);

    expect(outcome).toEqual({ sent: 0, failed: 0, pruned: 0 });
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it("omits the tag when the caller does not supply one", async () => {
    const { db } = makeDb({ "user-1": ["t1"] });
    const { messaging, sendEachForMulticast } = makeMessaging([[ok]]);

    await sendPushToUser(db, messaging, "user-1", { title: "t", body: "b", link: "/jobs" });

    const request = sendEachForMulticast.mock.calls[0][0] as { data: Record<string, string> };
    expect(request.data).not.toHaveProperty("tag");
  });
});
