import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Upload, LogOut, RefreshCcw } from 'lucide-react';
import { Chat } from './Chat';
import { DocumentList } from './DocumentList';
import { api, TaxDocument, TaxSummary } from '../services/api';

export function Dashboard() {
    const [documents, setDocuments] = useState<TaxDocument[]>([]);
    const [summary, setSummary] = useState<TaxSummary | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [docsResponse, summaryResponse] = await Promise.all([
                api.getTaxDocuments(),
                api.getTaxSummary()
            ]);
            setDocuments(docsResponse.documents);
            setSummary(summaryResponse);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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

            // Refresh data after upload
            await fetchData();
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

            // Refresh data after archive
            await fetchData();
        } catch (error) {
            console.error('Archive error:', error);
        }
    };

    const handleSignOut = () => {
        auth.signOut();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tax Documents</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchData}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign out
                        </button>
                    </div>
                </div>

                {summary && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Document Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Total Documents</p>
                                <p className="text-2xl font-bold">{summary.totalDocuments}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Last Updated</p>
                                <p className="text-2xl font-bold">
                                    {summary.lastUpdated 
                                        ? new Date(summary.lastUpdated).toLocaleDateString()
                                        : 'Never'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Document Types</p>
                                <div className="space-y-1">
                                    {Object.entries(summary.documentTypes).map(([type, count]) => (
                                        <div key={type} className="flex justify-between">
                                            <span>{type}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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