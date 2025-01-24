import React from 'react';
import { Archive } from 'lucide-react';
import { TaxDocument } from '../services/api';

interface DocumentListProps {
    documents: TaxDocument[];
    onArchive: (id: string) => void;
}

export function DocumentList({ documents, onArchive }: DocumentListProps) {
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
                {documents.map((doc) => (
                    <li key={doc.id}>
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">{doc.type.slice(0, 2).toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {doc.type}
                                        </h3>
                                        <div className="mt-1 flex items-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                doc.status === 'processed' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : doc.status === 'error'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                            </span>
                                            <span className="ml-2 flex-shrink-0 text-sm text-gray-500">
                                                {new Date(doc.uploadDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => onArchive(doc.id)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
                {documents.length === 0 && (
                    <li className="px-4 py-8">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">No documents found</p>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    );
}