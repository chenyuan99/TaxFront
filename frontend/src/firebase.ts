import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Exported so `pushService` can read the resolved config back out when it
// hands the messaging service worker its parameters.
export const app = initializeApp(firebaseConfig);

// In dev, emit a debug token to the console; register it once in
// Firebase Console → App Check → Apps → <app> → Manage debug tokens.
if (import.meta.env.DEV) {
    (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// App Check needs a reCAPTCHA Enterprise site key. Handed an empty one it
// throws from inside the reCAPTCHA library — an unhandled rejection with a
// stack in minified third-party code and no hint at the cause, which is how a
// deploy shipped with the key unset went unnoticed. Skip initialisation when
// it is missing and say so, the same way `pushService` treats its VAPID key:
// App Check turns itself back on as soon as the key is configured.
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;

if (appCheckSiteKey) {
    initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
    });
} else {
    console.warn(
        'App Check is disabled: VITE_RECAPTCHA_ENTERPRISE_SITE_KEY is not set. ' +
        'Requests are unprotected — set the key to enable it.'
    );
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

const ai = getAI(app, { backend: new GoogleAIBackend() });
export const geminiModel = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });
