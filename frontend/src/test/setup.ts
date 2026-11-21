// Global test setup — runs before every test file

// Mock the Firebase app so services under test don't need real credentials.
// `db` is an opaque handle here — tests that touch Firestore mock the
// `firebase/firestore` functions themselves and assert on the arguments.
vi.mock('../firebase', () => ({
    auth: {
        currentUser: {
            getIdToken: vi.fn().mockResolvedValue('mock-firebase-jwt'),
        },
    },
    db: { __mock: 'firestore' },
}));
