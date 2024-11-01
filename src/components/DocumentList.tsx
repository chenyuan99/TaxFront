import React from 'react';
import { format } from 'date-fns';
import { FileText, Archive, Clock } from 'lucide-react';
import type { TaxDocument } from '../types/document';

interface DocumentListProps {
    documents: TaxDocument[];
    onArchive: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onArchive }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'processed':
                return <FileText className="text-green-500" />;
            case 'archived':
                return <Archive className="text-gray-500" />;
            default:
                return <Clock className="text-yellow-500" />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                {getStatusIcon(doc.status)}
                                <span className="ml-2 text-sm text-gray-900">{doc.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                    doc.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                  {doc.status}
                </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                                onClick={() => onArchive(doc.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                            >
                                Archive
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};