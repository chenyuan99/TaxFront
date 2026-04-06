// Global test setup — runs before every test file

// Mock Firebase auth so api.ts doesn't need a real Firebase app
vi.mock('../firebase', () => ({
    auth: {
        currentUser: {
            getIdToken: vi.fn().mockResolvedValue('mock-firebase-jwt'),
        },
    },
}));
