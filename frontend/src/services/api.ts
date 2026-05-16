import { auth, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import type { components, operations } from '../api/schema.d.ts';

const FUNCTIONS_BASE_URL = 'https://us-central1-taxfront-1e142.cloudfunctions.net';
const REQUEST_TIMEOUT = 30000;
let cachedToken: { value: string; expiry: number } | null = null;

// Re-export generated types for use across the app
export type UserProfile = components['schemas']['UserProfile'];
export type TaxDocument = components['schemas']['TaxDocument'];
export type TaxSummary = components['schemas']['TaxSummary'];
export type ProcessingResult = components['schemas']['ProcessingResult'];
export type DocumentMetadata = components['schemas']['DocumentMetadata'];
export type DocumentStatusResponse = components['schemas']['DocumentStatusResponse'];
export type AgentRequest = components['schemas']['AgentRequest'];
export type AccountantAgentRequest = components['schemas']['AccountantAgentRequest'];
export type AgentResponse = components['schemas']['AgentResponse'];

async function getIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }

    const now = Date.now();
    if (cachedToken && cachedToken.expiry - 300000 > now) {
        return cachedToken.value;
    }

    const token = await user.getIdToken(true);
    cachedToken = {
        value: token,
        expiry: now + 3600000,
    };

    return token;
}

async function callFunction<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<T> {
    const token = await getIdToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            mode: 'cors',
            signal: controller.signal,
            ...(data && { body: JSON.stringify(data) }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${errorText}`);
        }

        return response.json() as Promise<T>;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${REQUEST_TIMEOUT / 1000} seconds`);
            }
            throw error;
        }
        throw new Error('Unknown error occurred');
    } finally {
        clearTimeout(timeoutId);
    }
}

export const api = {
    createUserProfile: (profile: UserProfile) =>
        callFunction<string>('/create_user_profile', 'POST', profile),

    getTaxDocuments: () =>
        callFunction<operations['getTaxDocuments']['responses'][200]['content']['application/json']>(
            '/get_tax_documents',
        ),

    getTaxSummary: () =>
        callFunction<TaxSummary>('/get_tax_summary'),

    processDocument: (documentId: string) =>
        callFunction<ProcessingResult>('/process_document', 'POST', { documentId }),

    getDocumentStatus: (documentId: string) =>
        callFunction<DocumentStatusResponse>(`/get_document_status?documentId=${encodeURIComponent(documentId)}`),

    runAccountant: async (data: { filingStatus: string; task: string }) => {
        const callable = httpsCallable(functions, 'runAccountant');
        const result = await callable({
            ...data,
            userId: auth.currentUser?.uid
        });
        return result.data as AgentResponse;
    },

    runAuditor: async (data: { task: string }) => {
        const callable = httpsCallable(functions, 'runAuditor');
        const result = await callable({
            ...data,
            userId: auth.currentUser?.uid
        });
        return result.data as AgentResponse;
    }
};
