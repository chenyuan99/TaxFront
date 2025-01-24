import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Upload, LogOut, RefreshCcw } from 'lucide-react';
import { Chat } from './Chat';
import { DocumentList } from './DocumentList';
import { api, TaxDocument, TaxSummary } from '../services/api';

// Types
type UploadStatus = {
    step: string;
    success?: boolean;
    error?: string;
    details?: string;
    timestamp?: string;
};

type UploadTask = {
    id: string;
    name: string;
    file: File;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    url?: string;
    metadata?: any;
};

export function Dashboard() {
    // State Management
    const [documents, setDocuments] = useState<TaxDocument[]>([]);
    const [summary, setSummary] = useState<TaxSummary | null>(null);
    const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingDocId, setProcessingDocId] = useState<string | null>(null);

    // Utility Functions
    const addUploadStatus = (status: UploadStatus) => {
        setUploadStatus(prev => [...prev, { 
            ...status, 
            timestamp: new Date().toISOString() 
        }]);
        if (status.error) {
            console.error(`Upload Error at ${status.step}:`, status.error);
        }
    };

    const updateTaskStatus = (taskId: string, updates: Partial<UploadTask>) => {
        setUploadTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
        ));
    };

    // Data Fetching
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

    // File Upload Pipeline
    const createUploadTask = (file: File): UploadTask => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        file,
        status: 'pending',
        progress: 0
    });

    const uploadToStorage = async (task: UploadTask): Promise<string> => {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const timestamp = Date.now();
        const cleanFileName = task.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `users/${user.uid}/${timestamp}_${cleanFileName}`;
        
        const storageRef = ref(storage, path);
        const metadata = {
            contentType: task.file.type,
            customMetadata: {
                originalName: task.name,
                uploadedBy: user.uid,
                uploadTime: new Date().toISOString()
            }
        };

        const uploadResult = await uploadBytes(storageRef, task.file, metadata);
        return await getDownloadURL(uploadResult.ref);
    };

    const createFirestoreDocument = async (task: UploadTask, url: string) => {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        return await addDoc(collection(db, 'taxDocuments'), {
            name: task.name,
            originalName: task.file.name,
            type: task.file.type,
            size: task.file.size,
            uploadDate: new Date().toISOString(),
            url,
            userId: user.uid,
            status: 'pending'
        });
    };

    const processDocument = async (docId: string) => {
        const result = await api.processDocument(docId);
        if (!result.success) {
            throw new Error(result.error || 'Processing failed');
        }
        return result;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            addUploadStatus({
                step: 'File Selection',
                success: false,
                error: 'No file selected'
            });
            return;
        }

        if (!auth.currentUser) {
            addUploadStatus({
                step: 'Authentication Check',
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        // Create new upload task
        const task = createUploadTask(file);
        setUploadTasks(prev => [...prev, task]);

        try {
            // Step 1: Prepare upload
            addUploadStatus({
                step: 'Preparing Upload',
                success: true,
                details: `File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB, Type: ${file.type}`
            });
            updateTaskStatus(task.id, { status: 'uploading', progress: 10 });

            // Step 2: Upload to Storage
            addUploadStatus({
                step: 'Uploading to Storage',
                details: 'Starting file upload to Firebase Storage'
            });
            const url = await uploadToStorage(task);
            updateTaskStatus(task.id, { progress: 70 });
            
            addUploadStatus({
                step: 'Storage Upload Complete',
                success: true,
                details: 'File uploaded successfully'
            });

            // Step 3: Create Firestore Document
            addUploadStatus({
                step: 'Creating Document Record',
                details: 'Adding document metadata to Firestore'
            });
            const docRef = await createFirestoreDocument(task, url);
            updateTaskStatus(task.id, { 
                status: 'completed', 
                progress: 100,
                url: url
            });

            addUploadStatus({
                step: 'Document Record Created',
                success: true,
                details: `Document ID: ${docRef.id}`
            });

            // Refresh document list
            await fetchData();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            updateTaskStatus(task.id, { 
                status: 'error', 
                error: errorMessage 
            });
            addUploadStatus({
                step: 'Upload Failed',
                success: false,
                error: errorMessage
            });
            console.error('Upload error:', error);
        }
    };

    const handleProcessDocument = async (docId: string) => {
        if (processingDocId) return; // Prevent multiple processing
        
        setProcessingDocId(docId);
        try {
            const result = await processDocument(docId);
            addUploadStatus({
                step: 'Processing Complete',
                success: true,
                details: 'Document processed successfully'
            });
            await fetchData(); // Refresh the document list
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addUploadStatus({
                step: 'Processing Failed',
                success: false,
                error: errorMessage
            });
            console.error('Processing error:', error);
        } finally {
            setProcessingDocId(null);
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

            await fetchData();
        } catch (error) {
            console.error('Archive error:', error);
        }
    };

    const handleSignOut = () => {
        auth.signOut();
    };

    // Render Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Main Render
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tax Documents</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchData}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {summary && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-lg font-medium mb-4">Document Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Total Documents</p>
                                <p className="text-2xl font-semibold">{summary.totalDocuments}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Last Updated</p>
                                <p className="text-2xl font-semibold">
                                    {summary.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString() : 'Never'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Document Types</p>
                                <div className="text-sm">
                                    {Object.entries(summary.documentTypes).map(([type, count]) => (
                                        <div key={type} className="flex justify-between">
                                            <span>{type}:</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium">Upload Documents</h2>
                        {uploadTasks.length > 0 && (
                            <div className="flex items-center text-sm text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                Uploading...
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center w-full">
                        <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
                            <Upload className="w-8 h-8 text-blue-500" />
                            <span className="mt-2 text-base leading-normal">
                                {uploadTasks.length > 0 ? 'Uploading...' : 'Select a document to upload'}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept=".pdf,.png,.jpg,.jpeg"
                                disabled={uploadTasks.length > 0}
                            />
                        </label>
                    </div>

                    {/* Document List with Process Button */}
                    <div className="mt-8">
                        <h3 className="text-lg font-medium mb-4">Uploaded Documents</h3>
                        <div className="space-y-4">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{doc.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Status: {doc.status}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {doc.status === 'pending' && (
                                            <button
                                                onClick={() => handleProcessDocument(doc.id)}
                                                disabled={processingDocId === doc.id}
                                                className={`px-3 py-1 text-sm rounded-md ${
                                                    processingDocId === doc.id
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                            >
                                                {processingDocId === doc.id ? 'Processing...' : 'Process'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleArchive(doc.id)}
                                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upload Status Timeline */}
                    {uploadStatus.length > 0 && (
                        <div className="mt-6 border rounded-lg overflow-hidden bg-white">
                            <div className="bg-gray-50 px-4 py-2 border-b">
                                <h3 className="text-sm font-medium text-gray-700">Upload Progress</h3>
                            </div>
                            <div className="divide-y">
                                {uploadStatus.map((status, index) => (
                                    <div key={index} className="px-4 py-3">
                                        <div className="flex items-center">
                                            {status.success === undefined ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2" />
                                            ) : status.success ? (
                                                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-gray-900">{status.step}</p>
                                                    {status.timestamp && (
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(status.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {status.details && (
                                                    <p className="text-xs text-gray-500 mt-1">{status.details}</p>
                                                )}
                                                {status.error && (
                                                    <p className="text-xs text-red-600 mt-1">{status.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Chat />
        </div>
    );
}