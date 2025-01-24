import { auth } from '../firebase';

const FUNCTIONS_BASE_URL = 'https://us-central1-taxfront-1e142.cloudfunctions.net';

async function getIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }
    return user.getIdToken();
}

async function callFunction(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    const token = await getIdToken();
    const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

export interface UserProfile {
    name: string;
    taxId: string;
    businessType: string;
}

export interface TaxDocument {
    id: string;
    type: string;
    uploadDate: string;
    status: string;
}

export interface TaxSummary {
    totalDocuments: number;
    lastUpdated: string | null;
    documentTypes: Record<string, number>;
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
};
