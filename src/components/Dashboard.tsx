import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Upload, LogOut } from 'lucide-react';
import { Chat } from './Chat';
import { DocumentList } from './DocumentList';
import type { TaxDocument } from '../types/document';

export function Dashboard() {
    const [documents, setDocuments] = useState<TaxDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, `users/${user.uid}/documents`),
            orderBy('uploadDate', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                uploadDate: doc.data().uploadDate.toDate(),
            })) as TaxDocument[];
            setDocuments(docs);
        });

        return () => unsubscribe();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const user = auth.currentUser;
        if (!user) return;

        setUploading(true);
        setUploadError('');

        try {
            const storageRef = ref(storage, `users/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            await addDoc(collection(db, `users/${user.uid}/documents`), {
                name: file.name,
                type: file.type,
                uploadDate: new Date(),
                url,
                year: new Date().getFullYear(),
                status: 'pending'
            });
        } catch (error) {
            setUploadError('Failed to upload document. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleArchive = async (docId: string) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const docRef = doc(db, `users/${user.uid}/documents/${docId}`);
            await deleteDoc(docRef);

            const document = documents.find(d => d.id === docId);
            if (document?.url) {
                const storageRef = ref(storage, document.url);
                await deleteObject(storageRef);
            }
        } catch (error) {
            console.error('Archive error:', error);
        }
    };

    const handleSignOut = () => {
        auth.signOut();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tax Documents</h1>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex items-center justify-center w-full">
                        <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
                            <Upload className="w-8 h-8 text-blue-500" />
                            <span className="mt-2 text-base leading-normal">
                {uploading ? 'Uploading...' : 'Select a document to upload'}
              </span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    {uploadError && (
                        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                    )}
                </div>

                <DocumentList documents={documents} onArchive={handleArchive} />
            </div>
            <Chat />
        </div>
    );
}