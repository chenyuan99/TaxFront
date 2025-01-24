import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

type Job = {
    id: string;
    documentId: string;
    documentName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
    error?: string;
    result?: any;
};

export function Jobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const jobsQuery = query(
            collection(db, 'jobs'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Job));
            setJobs(jobsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleProcessJob = async (job: Job) => {
        if (job.status === 'processing') return;

        try {
            await api.processDocument(job.documentId);
        } catch (error) {
            console.error('Error processing job:', error);
        }
    };

    const getStatusIcon = (status: Job['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-5 w-5 text-gray-500" />;
            case 'processing':
                return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-500" />;
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Processing Jobs</h1>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {jobs.map((job) => (
                            <div 
                                key={job.id} 
                                className="p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(job.status)}
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {job.documentName}
                                            </h3>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <span className="text-sm text-gray-500">
                                                    Created: {new Date(job.createdAt).toLocaleString()}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-sm text-gray-500">
                                                    Status: {job.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        {job.status === 'pending' && (
                                            <button
                                                onClick={() => handleProcessJob(job)}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Process
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedJob(job)}
                                            className="text-sm text-indigo-600 hover:text-indigo-900"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>

                                {job.error && (
                                    <div className="mt-2 text-sm text-red-600">
                                        Error: {job.error}
                                    </div>
                                )}
                            </div>
                        ))}

                        {jobs.length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                No processing jobs found
                            </div>
                        )}
                    </div>
                </div>

                {/* Job Details Modal */}
                {selectedJob && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-medium">Job Details</h2>
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <span className="sr-only">Close</span>
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Document Name</h3>
                                    <p className="mt-1">{selectedJob.documentName}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                    <div className="mt-1 flex items-center space-x-2">
                                        {getStatusIcon(selectedJob.status)}
                                        <span>{selectedJob.status}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                                    <p className="mt-1">
                                        {new Date(selectedJob.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                    <p className="mt-1">
                                        {new Date(selectedJob.updatedAt).toLocaleString()}
                                    </p>
                                </div>

                                {selectedJob.error && (
                                    <div>
                                        <h3 className="text-sm font-medium text-red-500">Error</h3>
                                        <p className="mt-1 text-red-600">{selectedJob.error}</p>
                                    </div>
                                )}

                                {selectedJob.result && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Result</h3>
                                        <pre className="mt-1 bg-gray-50 p-4 rounded-md overflow-auto">
                                            {JSON.stringify(selectedJob.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
