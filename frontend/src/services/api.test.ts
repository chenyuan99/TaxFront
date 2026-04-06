/**
 * End-to-end API client tests.
 *
 * Strategy: mock global fetch so tests run offline, then assert that:
 *  - the correct URL / method / headers are sent
 *  - the response is parsed and returned with the right shape
 *  - auth errors and timeouts are handled
 *
 * Response fixtures are typed against the generated OpenAPI schema so a
 * schema change that breaks the client will surface here at compile-time.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { components } from '../api/schema.d.ts';
import { api } from './api';

// ── helpers ────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, status = 200) {
    global.fetch = vi.fn().mockResolvedValueOnce({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
    } as Response);
}

function lastFetchCall() {
    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const [url, options] = calls[calls.length - 1] as [string, RequestInit];
    return { url, options };
}

const BASE = 'https://us-central1-taxfront-1e142.cloudfunctions.net';

// ── fixtures (typed against generated schema) ─────────────────────────────

const userProfileFixture: components['schemas']['UserProfile'] = {
    name: 'Jane Doe',
    taxId: '123-45-6789',
    businessType: 'sole_proprietor',
};

const taxDocumentFixture: components['schemas']['TaxDocument'] = {
    id: 'doc-001',
    name: 'W2_2024.pdf',
    type: 'application/pdf',
    size: 204800,
    uploadDate: '2024-04-01T12:00:00Z',
    url: 'https://storage.googleapis.com/taxfront/users/uid1/W2_2024.pdf',
    path: 'users/uid1/W2_2024.pdf',
    status: 'processed',
    metadata: {
        name: 'Jane Doe',
        tax_id: '123-45-6789',
        income: 85000,
        tax_due: 12000,
        tax_year: '2024',
        filing_status: 'single',
        extraction_success: true,
    },
};

const taxSummaryFixture: components['schemas']['TaxSummary'] = {
    totalDocuments: 3,
    lastUpdated: '2024-04-01T12:00:00Z',
    documentTypes: { 'application/pdf': 3 },
    processingStatus: { processed: 2, pending: 1, error: 0 },
    recentDocuments: [taxDocumentFixture],
};

const processingResultFixture: components['schemas']['ProcessingResult'] = {
    success: true,
    documentId: 'doc-001',
    metadata: taxDocumentFixture.metadata,
};

const documentStatusFixture: components['schemas']['DocumentStatusResponse'] = {
    status: 'processed',
    metadata: taxDocumentFixture.metadata,
};

// ── tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

describe('api.createUserProfile', () => {
    it('POSTs to /create_user_profile with the profile body', async () => {
        mockFetch('Profile updated successfully');

        await api.createUserProfile(userProfileFixture);

        const { url, options } = lastFetchCall();
        expect(url).toBe(`${BASE}/create_user_profile`);
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual(userProfileFixture);
    });

    it('includes Bearer token in Authorization header', async () => {
        mockFetch('Profile updated successfully');

        await api.createUserProfile(userProfileFixture);

        const { options } = lastFetchCall();
        const headers = options.headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer mock-firebase-jwt');
    });
});

describe('api.getTaxDocuments', () => {
    it('GETs /get_tax_documents and returns documents array', async () => {
        mockFetch({ documents: [taxDocumentFixture] });

        const result = await api.getTaxDocuments();

        const { url, options } = lastFetchCall();
        expect(url).toBe(`${BASE}/get_tax_documents`);
        expect(options.method).toBe('GET');
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0].id).toBe('doc-001');
        expect(result.documents[0].status).toBe('processed');
    });

    it('document metadata fields are correctly typed and returned', async () => {
        mockFetch({ documents: [taxDocumentFixture] });

        const result = await api.getTaxDocuments();
        const doc = result.documents[0];

        expect(doc.metadata?.income).toBe(85000);
        expect(doc.metadata?.tax_year).toBe('2024');
        expect(doc.metadata?.extraction_success).toBe(true);
    });
});

describe('api.getTaxSummary', () => {
    it('GETs /get_tax_summary and returns summary', async () => {
        mockFetch(taxSummaryFixture);

        const result = await api.getTaxSummary();

        const { url } = lastFetchCall();
        expect(url).toBe(`${BASE}/get_tax_summary`);
        expect(result.totalDocuments).toBe(3);
        expect(result.processingStatus.processed).toBe(2);
        expect(result.processingStatus.pending).toBe(1);
        expect(result.recentDocuments).toHaveLength(1);
    });
});

describe('api.processDocument', () => {
    it('POSTs to /process_document with documentId', async () => {
        mockFetch(processingResultFixture);

        const result = await api.processDocument('doc-001');

        const { url, options } = lastFetchCall();
        expect(url).toBe(`${BASE}/process_document`);
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual({ documentId: 'doc-001' });
        expect(result.success).toBe(true);
        expect(result.documentId).toBe('doc-001');
    });

    it('returns failure result when processing fails', async () => {
        const failResult: components['schemas']['ProcessingResult'] = {
            success: false,
            documentId: 'doc-001',
            error: 'OCR extraction failed',
        };
        mockFetch(failResult);

        const result = await api.processDocument('doc-001');
        expect(result.success).toBe(false);
        expect(result.error).toBe('OCR extraction failed');
    });
});

describe('api.getDocumentStatus', () => {
    it('GETs /get_document_status with documentId as query param', async () => {
        mockFetch(documentStatusFixture);

        const result = await api.getDocumentStatus('doc-001');

        const { url } = lastFetchCall();
        expect(url).toBe(`${BASE}/get_document_status?documentId=doc-001`);
        expect(result.status).toBe('processed');
        expect(result.metadata?.income).toBe(85000);
    });

    it('encodes special characters in documentId', async () => {
        mockFetch(documentStatusFixture);

        await api.getDocumentStatus('doc/with spaces&special=chars');

        const { url } = lastFetchCall();
        expect(url).toContain('documentId=doc%2Fwith%20spaces%26special%3Dchars');
    });

    it('returns pending status for unprocessed document', async () => {
        mockFetch({ status: 'pending' } as components['schemas']['DocumentStatusResponse']);

        const result = await api.getDocumentStatus('doc-pending');
        expect(result.status).toBe('pending');
        expect(result.metadata).toBeUndefined();
    });
});

describe('error handling', () => {
    it('throws when API returns non-2xx status', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 401,
            text: () => Promise.resolve('Unauthorized'),
        } as Response);

        await expect(api.getTaxDocuments()).rejects.toThrow('API call failed: Unauthorized');
    });

    it('throws timeout error when request is aborted', async () => {
        global.fetch = vi.fn().mockRejectedValueOnce(
            Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' }),
        );

        await expect(api.getTaxDocuments()).rejects.toThrow('Request timeout after 30 seconds');
    });

    it('throws when no user is logged in', async () => {
        // Temporarily override the firebase mock to return no user
        const { auth } = await import('../firebase');
        const original = auth.currentUser;
        (auth as { currentUser: typeof auth.currentUser | null }).currentUser = null;

        await expect(api.getTaxDocuments()).rejects.toThrow('No user logged in');

        (auth as { currentUser: typeof auth.currentUser | null }).currentUser = original;
    });
});
