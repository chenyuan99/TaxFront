import { app, auth, db } from '../firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

/**
 * Web push registration (Firebase Cloud Messaging).
 *
 * The in-app bell only updates tabs that are open. FCM covers the case the bell
 * cannot: the user closed the tab and the extraction finished afterwards.
 *
 * Messages are data-only, so nothing is displayed in the foreground — an open
 * tab already learns about the notification through the Firestore listener, and
 * `firebase-messaging-sw.js` renders the background case.
 */
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

/**
 * FCM's own default scope. Registering the messaging worker here keeps it clear
 * of the app-shell worker at `/`, so the two coexist instead of replacing each
 * other.
 */
const SW_SCOPE = '/firebase-cloud-messaging-push-scope';
const SW_PATH = '/firebase-messaging-sw.js';

export type PushPermission = 'unsupported' | 'unconfigured' | 'default' | 'granted' | 'denied';

/**
 * Reports whether push can be offered at all, and if so where the user stands.
 * `unconfigured` means the deployment has no VAPID key — the browser supports
 * push, we just cannot ask for it.
 */
export async function getPushPermission(): Promise<PushPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (!(await isSupported().catch(() => false))) return 'unsupported';
    if (!VAPID_KEY) return 'unconfigured';
    return Notification.permission as 'default' | 'granted' | 'denied';
}

/**
 * A service worker cannot read `import.meta.env`, so the Firebase config it
 * needs rides along on its script URL. Registering it by hand (rather than
 * letting the SDK auto-register) is what makes that possible.
 */
async function registerMessagingWorker(): Promise<ServiceWorkerRegistration> {
    const { apiKey, projectId, messagingSenderId, appId } = app.options;
    const params = new URLSearchParams({
        apiKey: String(apiKey ?? ''),
        projectId: String(projectId ?? ''),
        messagingSenderId: String(messagingSenderId ?? ''),
        appId: String(appId ?? ''),
    });

    return navigator.serviceWorker.register(`${SW_PATH}?${params}`, { scope: SW_SCOPE });
}

/**
 * Asks for notification permission, then registers this device's FCM token.
 *
 * Must be called from a user gesture — browsers reject (and Chrome penalises)
 * permission prompts that fire on page load.
 *
 * Returns the resulting permission state so the caller can render it.
 */
export async function enablePush(): Promise<PushPermission> {
    const current = await getPushPermission();
    if (current === 'unsupported' || current === 'unconfigured' || current === 'denied') {
        return current;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return permission as 'default' | 'denied';

    await registerToken();
    return 'granted';
}

/**
 * Re-registers this device's token when permission was already granted in an
 * earlier session. FCM tokens rotate, and a stale row means a silent device, so
 * this runs on every load for an already-opted-in user. It is a no-op
 * otherwise, and never prompts.
 */
export async function refreshPushToken(): Promise<void> {
    if ((await getPushPermission()) !== 'granted') return;

    try {
        await registerToken();
    } catch (error) {
        console.error('Could not refresh push token:', error);
    }
}

async function registerToken(): Promise<void> {
    const registration = await registerMessagingWorker();
    const token = await getToken(getMessaging(app), {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
    });
    if (token) await saveToken(token);
}

/**
 * Stores the token under its owner, keyed by the token itself so re-registering
 * the same device refreshes the row instead of piling up duplicates. The
 * backend prunes rows that FCM later reports as dead.
 */
async function saveToken(token: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await setDoc(
        doc(db, 'users', user.uid, 'fcmTokens', token),
        {
            token,
            userAgent: navigator.userAgent,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}
