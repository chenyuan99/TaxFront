import * as React from 'react';
import { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { format } from 'date-fns';
import { FileText, Trash2, Upload, LogOut } from 'lucide-react';

interface TaxDocument {
    id: string;
    name: string;
    type: string;
    uploadDate: Date;
    url: string;
    tags: string[];
}

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

        const tags = ['personal information', 'tax document', 'Y2024'];

        setUploading(true);
        setUploadError('');

        try {
            const storageRef = ref(storage, `users/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            console.info('Upload info:', url);

            await addDoc(collection(db, `users/${user.uid}/documents`), {
                name: file.name,
                type: file.type,
                uploadDate: new Date(),
                url,
                tags,
            });
        } catch (error) {
            setUploadError('Failed to upload document. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (taxDocument: TaxDocument) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await deleteDoc(doc(db, `users/${user.uid}/documents/${taxDocument.id}`));
            const storageRef = ref(storage, taxDocument.url);
            await deleteObject(storageRef);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleSignOut = () => {
        auth.signOut();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">TaxFront</h1>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                        <LogOut className="w-4 h-4 mr-2"/>
                        Sign out
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex items-center justify-center w-full">
                        <label
                            className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
                            <Upload className="w-8 h-8 text-blue-500"/>
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

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="min-w-full divide-y divide-gray-200">
                        {documents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No documents uploaded yet
                            </div>
                        ) : (
                            <div className="bg-white divide-y divide-gray-200">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-6 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center">
                                            <FileText className="w-6 h-6 text-blue-500 mr-3"/>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {doc.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Uploaded on {format(doc.uploadDate, 'PPP')}
                                                </p>
                                                <div className="text-sm text-gray-500">
                                                    {doc.tags.map((tag, index) => (
                                                        <span key={index}
                                                              className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                            >
                                                View
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                className="text-sm font-medium text-red-600 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}