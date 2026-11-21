/**
 * Web push delivery for notifications, via Firebase Cloud Messaging.
 *
 * The in-app bell is driven by an `onSnapshot` listener and only reaches tabs
 * that are already open. FCM covers the rest: a user who closed the tab still
 * gets told when their document finished processing.
 *
 * Messages are **data-only** on purpose. A `notification` payload is rendered by
 * the browser itself, which would both duplicate what the service worker shows
 * and take click handling out of our hands; data-only lets
 * `firebase-messaging-sw.js` own both.
 */
import type { Firestore } from "firebase-admin/firestore";
import type { Messaging } from "firebase-admin/messaging";

/** Registration tokens live under the owning user: `users/{uid}/fcmTokens/{token}`. */
export const FCM_TOKENS_SUBCOLLECTION = "fcmTokens";

/** `sendEachForMulticast` accepts at most 500 tokens per call. */
const MULTICAST_LIMIT = 500;

/**
 * FCM reports these when a token belongs to an uninstalled app, a cleared site,
 * or a browser that revoked permission. They are permanent — the row is dead
 * weight and every later send would fail the same way, so we drop it.
 */
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

export interface PushPayload {
  title: string;
  body: string;
  /** In-app path opened when the notification is clicked. */
  link: string;
  /** Collapses repeat pushes about the same job into one notification. */
  tag?: string;
}

export interface PushOutcome {
  sent: number;
  failed: number;
  pruned: number;
}

/**
 * Sends `payload` to every device the user has registered, pruning the tokens
 * FCM reports as permanently dead.
 *
 * Never throws: push is best-effort and must not fail the job that triggered
 * it. Callers get the counts and can log them.
 */
export async function sendPushToUser(
  db: Firestore,
  messaging: Messaging,
  userId: string,
  payload: PushPayload
): Promise<PushOutcome> {
  const outcome: PushOutcome = { sent: 0, failed: 0, pruned: 0 };

  let tokens: string[];
  try {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection(FCM_TOKENS_SUBCOLLECTION)
      .get();
    tokens = snapshot.docs.map((doc) => doc.id);
  } catch (err) {
    console.error(`Could not read FCM tokens for ${userId}:`, (err as Error).message);
    return outcome;
  }

  if (tokens.length === 0) return outcome;

  // Data values must be strings — FCM rejects any other type.
  const data: Record<string, string> = {
    title: payload.title,
    body: payload.body,
    link: payload.link,
    ...(payload.tag !== undefined && { tag: payload.tag }),
  };

  for (let i = 0; i < tokens.length; i += MULTICAST_LIMIT) {
    const chunk = tokens.slice(i, i + MULTICAST_LIMIT);

    let responses;
    try {
      ({ responses } = await messaging.sendEachForMulticast({ tokens: chunk, data }));
    } catch (err) {
      console.error(`FCM send failed for ${userId}:`, (err as Error).message);
      outcome.failed += chunk.length;
      continue;
    }

    const dead: string[] = [];
    responses.forEach((response, index) => {
      if (response.success) {
        outcome.sent++;
        return;
      }
      outcome.failed++;
      if (response.error && DEAD_TOKEN_CODES.has(response.error.code)) dead.push(chunk[index]);
    });

    outcome.pruned += await pruneTokens(db, userId, dead);
  }

  return outcome;
}

async function pruneTokens(db: Firestore, userId: string, tokens: string[]): Promise<number> {
  if (tokens.length === 0) return 0;

  const tokensRef = db.collection("users").doc(userId).collection(FCM_TOKENS_SUBCOLLECTION);
  try {
    const batch = db.batch();
    for (const token of tokens) batch.delete(tokensRef.doc(token));
    await batch.commit();
    return tokens.length;
  } catch (err) {
    console.error(`Could not prune FCM tokens for ${userId}:`, (err as Error).message);
    return 0;
  }
}
