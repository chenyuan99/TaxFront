import { db } from '../firebase';
import {
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';

/**
 * Notifications are written by the Cloud Functions that run background jobs —
 * the client never creates them, it only listens and marks them read. The
 * `onSnapshot` listener is the push channel: when `processNewTaxDocument`
 * finishes, the row lands here without the tab polling for it.
 */
export type NotificationType = 'job_completed' | 'job_failed';

export type AppNotification = {
    id: string;
    userId: string;
    jobId: string;
    documentId?: string;
    documentName?: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
};

/** Enough to fill the dropdown without pulling a user's whole history. */
const FEED_LIMIT = 50;

class NotificationService {
    private notificationsCollection = collection(db, 'notifications');

    /**
     * Streams the user's most recent notifications. Returns the unsubscribe
     * function — callers must invoke it on unmount.
     */
    subscribeToUserNotifications(
        userId: string,
        onUpdate: (notifications: AppNotification[]) => void,
        onError: (error: Error) => void
    ) {
        const feedQuery = query(
            this.notificationsCollection,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(FEED_LIMIT)
        );

        return onSnapshot(
            feedQuery,
            (snapshot) => {
                onUpdate(
                    snapshot.docs.map((snap) => ({
                        id: snap.id,
                        ...snap.data(),
                    } as AppNotification))
                );
            },
            onError
        );
    }

    async markAsRead(notificationId: string): Promise<void> {
        await updateDoc(doc(this.notificationsCollection, notificationId), { read: true });
    }

    /**
     * Marks a batch of notifications read in one round trip. Already-read rows
     * are skipped so "mark all read" on a settled feed is a no-op.
     */
    async markAllAsRead(notifications: AppNotification[]): Promise<void> {
        const unread = notifications.filter((notification) => !notification.read);
        if (unread.length === 0) return;

        const batch = writeBatch(db);
        for (const notification of unread) {
            batch.update(doc(this.notificationsCollection, notification.id), { read: true });
        }
        await batch.commit();
    }
}

export const notificationService = new NotificationService();

export function countUnread(notifications: AppNotification[]): number {
    return notifications.filter((notification) => !notification.read).length;
}
