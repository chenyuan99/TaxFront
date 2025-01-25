import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { User, LogOut, LayoutDashboard, Briefcase, Bug, Menu, X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const user = auth.currentUser;

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Jobs', href: '/jobs', icon: Briefcase },
        { name: 'Calculator', href: '/calculator', icon: null },
        { name: 'Forms', href: '/forms', icon: null },
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
                            <span className="text-xl font-bold text-[#00AAFF]">TaxFront</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                                        location.pathname === item.href
                                            ? 'text-[#00395D] border-b-2 border-[#00395D]'
                                            : 'text-gray-500 hover:text-[#00395D] hover:border-[#00AAFF]'
                                    }`}
                                >
                                    {item.icon ? (
                                        <item.icon className="w-4 h-4 mr-2" />
                                    ) : (
                                        <svg
                                            className="w-4 h-4 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            {item.name === 'Calculator' ? (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            ) : (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            )}
                                        </svg>
                                    )}
                                    {item.name}
                                </Link>
                            ))}
                            <a
                                href="https://github.com/chenyuan99/TaxFront/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-[#00395D] hover:border-[#00AAFF]"
                            >
                                <Bug className="w-4 h-4 mr-2" />
                                Tickets
                            </a>
                            <a
                                href="https://github.com/chenyuan99/TaxFront/blob/main/CHANGELOG.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-[#00395D] hover:border-[#00AAFF]"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Changelog
                            </a>
                        </div>
                    </div>

                    {/* Right side menu */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        <button
                            type="button"
                            className="p-1 rounded-full text-gray-400 hover:text-[#00395D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]"
                        >
                            <span className="sr-only">View notifications</span>
                            <Bell className="h-6 w-6" />
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF] rounded-full"
                            >
                                <div className="h-9 w-9 rounded-full bg-[#E5F4FF] flex items-center justify-center hover:bg-[#CCE9FF] transition-colors">
                                    <User className="h-5 w-5 text-[#00395D]" />
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
                                        <div className="h-10 w-10 rounded-full bg-[#E5F4FF] flex items-center justify-center">
                                            <User className="h-6 w-6 text-[#00395D]" />
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
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-[#00395D] hover:bg-[#E5F4FF] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00AAFF]"
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
                                key={item.name}
                                to={item.href}
                                className={`block pl-3 pr-4 py-2 text-base font-medium ${
                                    location.pathname === item.href
                                        ? 'bg-[#E5F4FF] border-[#00395D] text-[#00395D]'
                                        : 'border-transparent text-gray-500 hover:bg-[#E5F4FF] hover:border-[#00AAFF] hover:text-[#00395D]'
                                }`}
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="flex items-center">
                                    {item.icon ? (
                                        <item.icon className="h-5 w-5 mr-2" />
                                    ) : (
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            {item.name === 'Calculator' ? (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            ) : (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            )}
                                        </svg>
                                    )}
                                    {item.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-[#E5F4FF] flex items-center justify-center">
                                    <User className="h-6 w-6 text-[#00395D]" />
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-[#00395D] truncate">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <button
                                onClick={handleSignOut}
                                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-[#00395D] hover:bg-[#E5F4FF]"
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
