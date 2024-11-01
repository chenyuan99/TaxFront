import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 transform transition-transform duration-300">
            <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
                            <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                                Learn more
                            </a>
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleDecline}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Accept
                        </button>
                        <button
                            onClick={handleDecline}
                            className="text-gray-400 hover:text-gray-500 sm:hidden"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}