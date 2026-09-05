/**
 * Tests for the notification feed client.
 *
 * `firebase/firestore` is mocked so the suite runs offline. The listener is
 * captured from the fake `onSnapshot` and driven by hand, which is the only way
 * to assert what the UI actually receives when the backend pushes a row.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const onSnapshot = vi.fn();
const updateDoc = vi.fn().mockResolvedValue(undefined);
const batchUpdate = vi.fn();
const batchCommit = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/firestore', () => ({
    collection: (_db: unknown, path: string) => ({ path }),
    doc: (parent: { path: string }, id: string) => ({ path: parent.path, id }),
    query: (...parts: unknown[]) => ({ parts }),
    where: (field: string, op: string, value: unknown) => ({ clause: 'where', field, op, value }),
    orderBy: (field: string, direction: string) => ({ clause: 'orderBy', field, direction }),
    limit: (count: number) => ({ clause: 'limit', count }),
    onSnapshot: (...args: unknown[]) => onSnapshot(...args),
    updateDoc: (...args: unknown[]) => updateDoc(...args),
    writeBatch: () => ({ update: batchUpdate, commit: batchCommit }),
}));

import { notificationService, countUnread, type AppNotification } from './notificationService';

// ── helpers ────────────────────────────────────────────────────────────────

function notification(overrides: Partial<AppNotification> = {}): AppNotification {
    return {
        id: 'n1',
        userId: 'user-1',
        jobId: 'doc-1',
        documentId: 'doc-1',
        documentName: 'w2.pdf',
        type: 'job_completed',
        title: 'Document processed',
        message: 'w2.pdf finished processing.',
        read: false,
        createdAt: '2026-09-05T10:00:00.000Z',
        ...overrides,
    };
}

function snapshotOf(items: AppNotification[]) {
    return {
        docs: items.map(({ id, ...rest }) => ({ id, data: () => rest })),
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    onSnapshot.mockReturnValue(() => undefined);
});

// ── tests ──────────────────────────────────────────────────────────────────

describe('subscribeToUserNotifications', () => {
    it('queries the caller\'s own rows, newest first, capped', () => {
        notificationService.subscribeToUserNotifications('user-1', vi.fn(), vi.fn());

        const builtQuery = onSnapshot.mock.calls[0][0] as { parts: Array<Record<string, unknown>> };
        expect(builtQuery.parts).toContainEqual({
            clause: 'where', field: 'userId', op: '==', value: 'user-1',
        });
        expect(builtQuery.parts).toContainEqual({
            clause: 'orderBy', field: 'createdAt', direction: 'desc',
        });
        expect(builtQuery.parts).toContainEqual({ clause: 'limit', count: 50 });
    });

    it('hands the caller notifications with their document ids attached', () => {
        const onUpdate = vi.fn();
        notificationService.subscribeToUserNotifications('user-1', onUpdate, vi.fn());

        const listener = onSnapshot.mock.calls[0][1] as (snap: unknown) => void;
        listener(snapshotOf([notification(), notification({ id: 'n2', read: true })]));

        expect(onUpdate).toHaveBeenCalledWith([
            expect.objectContaining({ id: 'n1', read: false, type: 'job_completed' }),
            expect.objectContaining({ id: 'n2', read: true }),
        ]);
    });

    it('forwards listener errors instead of throwing', () => {
        const onError = vi.fn();
        notificationService.subscribeToUserNotifications('user-1', vi.fn(), onError);

        const errorHandler = onSnapshot.mock.calls[0][2] as (error: Error) => void;
        errorHandler(new Error('permission-denied'));

        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'permission-denied' }));
    });

    it('returns the unsubscribe function from onSnapshot', () => {
        const unsubscribe = vi.fn();
        onSnapshot.mockReturnValue(unsubscribe);

        const returned = notificationService.subscribeToUserNotifications('user-1', vi.fn(), vi.fn());
        expect(returned).toBe(unsubscribe);
    });
});

describe('markAsRead', () => {
    it('flips a single row to read', async () => {
        await notificationService.markAsRead('n1');

        expect(updateDoc).toHaveBeenCalledWith(
            expect.objectContaining({ path: 'notifications', id: 'n1' }),
            { read: true }
        );
    });
});

describe('markAllAsRead', () => {
    it('batches only the unread rows', async () => {
        await notificationService.markAllAsRead([
            notification({ id: 'n1', read: false }),
            notification({ id: 'n2', read: true }),
            notification({ id: 'n3', read: false }),
        ]);

        expect(batchUpdate).toHaveBeenCalledTimes(2);
        expect(batchUpdate.mock.calls.map((call) => (call[0] as { id: string }).id)).toEqual(['n1', 'n3']);
        expect(batchCommit).toHaveBeenCalledOnce();
    });

    it('skips the round trip when nothing is unread', async () => {
        await notificationService.markAllAsRead([notification({ read: true })]);

        expect(batchCommit).not.toHaveBeenCalled();
    });
});

describe('countUnread', () => {
    it('counts only unread rows', () => {
        expect(countUnread([
            notification({ id: 'n1', read: false }),
            notification({ id: 'n2', read: true }),
            notification({ id: 'n3', read: false }),
        ])).toBe(2);
    });
});
