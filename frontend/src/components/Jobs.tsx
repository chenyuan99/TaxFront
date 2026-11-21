import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { jobService, type Job } from '../services/jobService';

export function Jobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        let unsubscribeJobs: (() => void) | undefined;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            unsubscribeJobs?.();
            unsubscribeJobs = undefined;

            if (!user) {
                setJobs([]);
                setLoading(false);
                return;
            }

            unsubscribeJobs = jobService.subscribeToUserJobs(
                user.uid,
                (jobsList) => {
                    setJobs(jobsList);
                    setLoading(false);
                },
                (error) => {
                    console.error('Error fetching jobs:', error);
                    setLoading(false);
                }
            );
        });

        return () => {
            unsubscribeJobs?.();
            unsubscribeAuth();
        };
    }, []);

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

    const getStatusBadge = (status: Job['status']) => {
        const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize';
        switch (status) {
            case 'pending':
                return <span className={`${base} bg-gray-100 text-gray-700`}>Pending</span>;
            case 'processing':
                return <span className={`${base} bg-blue-100 text-blue-700`}>Processing</span>;
            case 'completed':
                return <span className={`${base} bg-green-100 text-green-700`}>Completed</span>;
            case 'failed':
                return <span className={`${base} bg-red-100 text-red-700`}>Failed</span>;
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
                                                {getStatusBadge(job.status)}
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(job.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
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
                            <div className="p-12 text-center">
                                <Clock className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-900">No jobs yet</p>
                                <p className="text-sm text-gray-500 mt-1">Upload a document and processing starts automatically — you'll be notified here when it finishes.</p>
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
                                        {getStatusBadge(selectedJob.status)}
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
                                        <h3 className="text-sm font-medium text-gray-500">Extraction Result</h3>
                                        <dl className="mt-1 bg-gray-50 p-4 rounded-md grid grid-cols-2 gap-y-2 text-sm">
                                            <dt className="text-gray-500">Document type</dt>
                                            <dd>{selectedJob.result.documentType ?? 'unknown'}</dd>
                                            <dt className="text-gray-500">Tax year</dt>
                                            <dd>{selectedJob.result.taxYear ?? '—'}</dd>
                                            <dt className="text-gray-500">Fields extracted</dt>
                                            <dd>{selectedJob.result.fieldsExtracted ?? 0}</dd>
                                        </dl>
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
