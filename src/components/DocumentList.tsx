import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Archive, Clock, Search, Filter } from 'lucide-react';
import type { TaxDocument } from '../types/document';

interface DocumentListProps {
    documents: TaxDocument[];
    onArchive: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents = [], onArchive }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');

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

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'all' || doc.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
        const matchesYear = selectedYear === 'all' || doc.year?.toString() === selectedYear;
        return matchesSearch && matchesType && matchesStatus && matchesYear;
    });

    const documentTypes = ['all', ...new Set(documents.map(doc => doc.type).filter(Boolean))];
    const statusTypes = ['all', 'pending', 'processed', 'archived'];
    const years = ['all', ...new Set(documents.map(doc => doc.year?.toString()).filter(Boolean))].sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {documentTypes.filter(type => type !== 'all').map((type) => (
                                <option key={`type-${type}`} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            {statusTypes.filter(status => status !== 'all').map((status) => (
                                <option key={`status-${status}`} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="all">All Years</option>
                            {years.filter(year => year !== 'all').map((year) => (
                                <option key={`year-${year}`} value={year}>
                                    Tax Year {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

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
                    {filteredDocuments.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                No documents found
                            </td>
                        </tr>
                    ) : (
                        filteredDocuments.map((doc) => (
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
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};