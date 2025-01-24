import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Activity } from 'lucide-react';

export function Navigation() {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const navItems = [
        {
            name: 'Dashboard',
            path: '/',
            icon: Home
        },
        {
            name: 'Documents',
            path: '/documents',
            icon: FileText
        },
        {
            name: 'Jobs',
            path: '/jobs',
            icon: Activity
        }
    ];

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                                    isActive(item.path)
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <item.icon className="h-5 w-5 mr-2" />
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
