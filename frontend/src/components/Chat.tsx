import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

export function Chat() {
    const [isOpen, setIsOpen] = useState(false);
    const [user] = useAuthState(auth);

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50 ${
                    isOpen ? 'bg-[#00395D] rotate-90' : 'bg-[#00AAFF] hover:bg-[#00395D]'
                }`}
                aria-label="Chat with us"
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <MessageSquare className="h-6 w-6 text-white" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-100">
                    {/* Chat Header */}
                    <div className="p-6 bg-[#00395D] text-white rounded-t-lg">
                        <h3 className="text-xl font-light">How can we help?</h3>
                        <p className="text-sm mt-2 text-[#99B8CC] font-light">
                            We're here to assist you with your tax questions
                        </p>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 h-[400px] p-6 overflow-y-auto bg-gray-50">
                        <div className="text-center">
                            {user ? (
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <h4 className="font-medium text-[#00395D] mb-2">Welcome to Tax Support</h4>
                                        <p className="text-gray-600 text-sm">
                                            Our team is ready to help you with your tax-related questions.
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Average response time: <span className="font-medium">2-3 minutes</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                    <p className="text-gray-600 mb-3">Please sign in to start chatting</p>
                                    <button 
                                        className="bg-[#00AAFF] text-white px-4 py-2 rounded hover:bg-[#00395D] transition-colors"
                                        onClick={() => {/* Add your sign-in logic */}}
                                    >
                                        Sign In
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Input */}
                    {user && (
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent text-gray-700 placeholder-gray-400"
                                />
                                <button
                                    className="p-3 bg-[#00AAFF] text-white rounded-lg hover:bg-[#00395D] transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 px-1">
                                Press Enter to send your message
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}