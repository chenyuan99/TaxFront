/// <reference types="vite/client" />

declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID: string;
    readonly VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: string;
    /** Optional — unset ships the app without web push. */
    readonly VITE_FIREBASE_VAPID_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
