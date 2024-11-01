import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { FileText, Users, Clock, Filter, Search, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import type { TaxDocument } from '../types/document';

interface Client {
    id: string;
    name: string;
    email: string;
    documentsCount: number;
    lastActivity: Date;
    status: 'active' | 'pending' | 'inactive';
}

export function AccountantDashboard() {
    const [clients, setClients] = useState<Client[]>([]);
    const [documents, setDocuments] = useState<TaxDocument[]>([]);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    const stats = {
        totalClients: clients.length,
        pendingDocuments: documents.filter(d => d.status === 'pending').length,
        processedToday: documents.filter(d => {
            const today = new Date();
            const docDate = new Date(d.uploadDate);
            return d.status === 'processed' &&
                docDate.getDate() === today.getDate() &&
                docDate.getMonth() === today.getMonth() &&
                docDate.getFullYear() === today.getFullYear();
        }).length
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Simulated data fetch
                const mockClients: Client[] = [
                    {
                        id: '1',
                        name: 'John Smith',
                        email: 'john@example.com',
                        documentsCount: 5,
                        lastActivity: new Date(),
                        status: 'active'
                    },
                    {
                        id: '2',
                        name: 'Sarah Johnson',
                        email: 'sarah@example.com',
                        documentsCount: 3,
                        lastActivity: new Date(Date.now() - 86400000),
                        status: 'pending'
                    },
                    // Add more mock clients as needed
                ];
                setClients(mockClients);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
                    <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Welcome back, {auth.currentUser?.email}
            </span>
                        <button
                            onClick={() => auth.signOut()}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalClients}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Documents</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.pendingDocuments}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Processed Today</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.processedToday}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                            <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
                            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search clients..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Client
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Documents
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Activity
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
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {client.name.charAt(0)}
                            </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                                <div className="text-sm text-gray-500">{client.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.documentsCount} documents</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {client.lastActivity.toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {client.lastActivity.toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${client.status === 'active' ? 'bg-green-100 text-green-800' :
                          client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}`}>
                        {client.status}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            onClick={() => setSelectedClient(client.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}