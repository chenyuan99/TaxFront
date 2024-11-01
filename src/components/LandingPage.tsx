import React from 'react';
import { Shield, FileCheck, Clock, ArrowRight, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {Chat} from "./Chat.tsx";

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed w-full z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">TaxFront</span>
                        </div>
                        <button
                            onClick={onGetStarted}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                                <h1>
                  <span className="block text-base font-semibold tracking-wide text-blue-600 uppercase">
                    Welcome to TaxFront
                  </span>
                                    <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                    <span className="block text-gray-900">Smart Tax Management</span>
                    <span className="block text-blue-600">For Modern Business</span>
                  </span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                                    Streamline your tax documentation process with intelligent organization, real-time professional support, and bank-level security.
                                </p>
                                <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                                    <button
                                        onClick={onGetStarted}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                                    >
                                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                                <div className="relative mx-auto w-full rounded-lg shadow-xl lg:max-w-md overflow-hidden group">
                                    <img
                                        className="w-full rounded-lg transform transition-transform group-hover:scale-105 duration-300"
                                        src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=600"
                                        alt="Professional tax management"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative p-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-6 hover:shadow-lg transition-shadow">
                                    <Shield className="w-8 h-8 text-blue-600" />
                                    <div className="space-y-2">
                                        <p className="text-slate-800 font-medium">Enterprise Security</p>
                                        <p className="text-slate-600 text-sm">Military-grade encryption and secure document storage</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative p-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-6 hover:shadow-lg transition-shadow">
                                    <Users className="w-8 h-8 text-blue-600" />
                                    <div className="space-y-2">
                                        <p className="text-slate-800 font-medium">Expert Guidance</p>
                                        <p className="text-slate-600 text-sm">Direct access to certified tax professionals</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group sm:col-span-2 lg:col-span-1">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative p-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-6 hover:shadow-lg transition-shadow">
                                    <Sparkles className="w-8 h-8 text-blue-600" />
                                    <div className="space-y-2">
                                        <p className="text-slate-800 font-medium">Smart Features</p>
                                        <p className="text-slate-600 text-sm">AI-powered organization and instant document retrieval</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Chat/>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex items-center">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <span className="ml-2 text-gray-900">© 2024 TaxFront. All rights reserved.</span>
                        </div>
                        <div className="flex space-x-6">
                            <Link to="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</Link>
                            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}