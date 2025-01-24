import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, LayoutDashboard, Activity, Bell } from 'lucide-react';
import { auth } from '../firebase';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const user = auth.currentUser;

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Jobs', href: '/jobs', icon: Activity },
    ];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isActive = (path: string) => location.pathname === path;

    const handleSignOut = () => {
        auth.signOut();
        setIsProfileOpen(false);
    };

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Desktop Navigation */}
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-indigo-600">TaxFront</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={`${
                                        isActive(item.href)
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    <item.icon className="h-5 w-5 mr-2" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right side menu */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        <button
                            type="button"
                            className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">View notifications</span>
                            <Bell className="h-6 w-6" />
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
                            >
                                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 transition-colors">
                                    <User className="h-5 w-5 text-indigo-600" />
                                </div>
                            </button>

                            {/* Dropdown menu */}
                            <div
                                className={`${
                                    isProfileOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'
                                } transition ease-out duration-100 origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50`}
                            >
                                <div className="px-4 py-3 space-y-1">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <User className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {user?.email}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {user?.emailVerified ? 'Verified Account' : 'Unverified Account'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="py-1">
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        Your Profile
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <X className="block h-6 w-6" />
                            ) : (
                                <Menu className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`${
                                    isActive(item.href)
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="flex items-center">
                                    <item.icon className="h-5 w-5 mr-2" />
                                    {item.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-500" />
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-gray-800 truncate">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <button
                                onClick={handleSignOut}
                                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            >
                                <div className="flex items-center">
                                    <LogOut className="h-5 w-5 mr-2" />
                                    Sign out
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
