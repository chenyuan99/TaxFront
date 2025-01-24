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
    const [archivingDocId, setArchivingDocId] = useState<string | null>(null);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [selectedDocToArchive, setSelectedDocToArchive] = useState<TaxDocument | null>(null);

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

    const handleArchiveClick = (doc: TaxDocument) => {
        setSelectedDocToArchive(doc);
        setShowArchiveConfirm(true);
    };

    const handleArchive = async () => {
        if (!selectedDocToArchive || !auth.currentUser) return;
        
        try {
            setArchivingDocId(selectedDocToArchive.id);
            
            // Delete from Firestore
            const docRef = doc(db, 'taxDocuments', selectedDocToArchive.id);
            await deleteDoc(docRef);

            // Delete from Storage if URL exists
            if (selectedDocToArchive.url) {
                const storageRef = ref(storage, selectedDocToArchive.url);
                await deleteObject(storageRef);
            }

            // Update local state
            setDocuments(prev => prev.filter(d => d.id !== selectedDocToArchive.id));
            
            // Close modal and reset states
            setShowArchiveConfirm(false);
            setSelectedDocToArchive(null);
        } catch (error) {
            console.error('Archive error:', error);
        } finally {
            setArchivingDocId(null);
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
                                        {doc.url && (
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <svg 
                                                    className="h-4 w-4 mr-1.5" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                                                    />
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                                                    />
                                                </svg>
                                                View
                                            </a>
                                        )}
                                        {doc.status === 'pending' && (
                                            <button
                                                onClick={() => handleProcessDocument(doc.id)}
                                                disabled={processingDocId === doc.id}
                                                className={`px-3 py-1 text-sm rounded-md ${
                                                    processingDocId === doc.id
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                } inline-flex items-center`}
                                            >
                                                {processingDocId === doc.id ? (
                                                    <>
                                                        <svg 
                                                            className="animate-spin h-4 w-4 mr-1.5" 
                                                            fill="none" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle 
                                                                className="opacity-25" 
                                                                cx="12" 
                                                                cy="12" 
                                                                r="10" 
                                                                stroke="currentColor" 
                                                                strokeWidth="4"
                                                            />
                                                            <path 
                                                                className="opacity-75" 
                                                                fill="currentColor" 
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg 
                                                            className="h-4 w-4 mr-1.5" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                strokeWidth={2} 
                                                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                                                            />
                                                            <path 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                strokeWidth={2} 
                                                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                                            />
                                                        </svg>
                                                        Process
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleArchiveClick(doc)}
                                            disabled={archivingDocId === doc.id}
                                            className={`inline-flex items-center px-3 py-1 text-sm font-medium ${
                                                archivingDocId === doc.id
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                            }`}
                                        >
                                            <svg 
                                                className="h-4 w-4 mr-1.5" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                                />
                                            </svg>
                                            {archivingDocId === doc.id ? 'Archiving...' : 'Archive'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                                    <p className="mt-1 text-sm text-gray-500">Upload a document to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Archive Confirmation Modal */}
            {showArchiveConfirm && selectedDocToArchive && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg font-medium text-gray-900">Archive Document</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to archive "{selectedDocToArchive.name}"? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={!!archivingDocId}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                                    archivingDocId
                                        ? 'bg-red-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                }`}
                            >
                                {archivingDocId ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Archiving...
                                    </>
                                ) : (
                                    'Archive'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowArchiveConfirm(false);
                                    setSelectedDocToArchive(null);
                                }}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Chat />
        </div>
    );
}