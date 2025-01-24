import { auth } from '../firebase';

const FUNCTIONS_BASE_URL = 'https://us-central1-taxfront-1e142.cloudfunctions.net';
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout
let cachedToken: { value: string; expiry: number } | null = null;

async function getIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }

    // Check if we have a cached token that's still valid (with 5-minute buffer)
    const now = Date.now();
    if (cachedToken && cachedToken.expiry - 300000 > now) {
        return cachedToken.value;
    }

    // Get a fresh token
    const token = await user.getIdToken(true);
    
    // Cache the token with its expiry time
    // Firebase tokens typically expire in 1 hour (3600000 ms)
    cachedToken = {
        value: token,
        expiry: now + 3600000
    };
    
    return token;
}

async function callFunction(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    const token = await getIdToken();
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
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

        return response.json();
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${REQUEST_TIMEOUT/1000} seconds`);
            }
            throw error;
        }
        throw new Error('Unknown error occurred');
    } finally {
        clearTimeout(timeoutId);
    }
}

export interface UserProfile {
    name: string;
    taxId: string;
    businessType: string;
}

export interface TaxDocument {
    id: string;
    name: string;
    originalName?: string;
    type: string;
    size: number;
    uploadDate: string;
    url: string;
    path: string;
    status: 'pending' | 'processed' | 'error';
    metadata?: {
        name?: string;
        tax_id?: string;
        income?: number;
        tax_due?: number;
        tax_year?: string;
        filing_status?: string;
        confidence_scores?: Record<string, number>;
        parser_version?: string;
        processing_timestamp?: string;
        extraction_success?: boolean;
    };
    error?: string;
}

export interface TaxSummary {
    totalDocuments: number;
    lastUpdated: string | null;
    documentTypes: Record<string, number>;
    processingStatus: {
        processed: number;
        pending: number;
        error: number;
    };
    recentDocuments: TaxDocument[];
}

export interface ProcessingResult {
    success: boolean;
    documentId: string;
    error?: string;
    metadata?: TaxDocument['metadata'];
}

export const api = {
    // User Profile
    createUserProfile: async (profile: UserProfile) => {
        return callFunction('/create_user_profile', 'POST', profile);
    },

    // Tax Documents
    getTaxDocuments: async () => {
        return callFunction('/get_tax_documents') as Promise<{ documents: TaxDocument[] }>;
    },

    // Tax Summary
    getTaxSummary: async () => {
        return callFunction('/get_tax_summary') as Promise<TaxSummary>;
    },

    // Document Processing
    processDocument: async (documentId: string) => {
        return callFunction('/process_document', 'POST', { documentId }) as Promise<ProcessingResult>;
    },

    // Document Status
    getDocumentStatus: async (documentId: string) => {
        return callFunction('/get_document_status', 'GET', { documentId }) as Promise<{
            status: TaxDocument['status'];
            metadata?: TaxDocument['metadata'];
            error?: string;
        }>;
    }
};
