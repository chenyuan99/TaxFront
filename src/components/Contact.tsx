import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, Phone, MapPin, MessageSquare, Send } from 'lucide-react';

export function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');

        // Simulate form submission
        setTimeout(() => {
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">TaxFront</span>
                        </div>
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white shadow rounded-lg p-8">
                        <div className="flex items-center mb-8">
                            <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
                            <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a subject</option>
                                    <option value="support">Technical Support</option>
                                    <option value="billing">Billing Question</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {status === 'sending' ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Sending...
                                    </div>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </button>

                            {status === 'success' && (
                                <div className="bg-green-50 text-green-800 rounded-md p-4">
                                    Thank you for your message. We'll get back to you soon!
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="bg-red-50 text-red-800 rounded-md p-4">
                                    There was an error sending your message. Please try again.
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white shadow rounded-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <Mail className="h-6 w-6 text-blue-600 mt-1" />
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900">Email</h3>
                                        <p className="mt-1 text-gray-600">support@taxfront.com</p>
                                        <p className="text-gray-600">sales@taxfront.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Phone className="h-6 w-6 text-blue-600 mt-1" />
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                                        <p className="mt-1 text-gray-600">Support: 1-800-TAX-FRONT</p>
                                        <p className="text-gray-600">Sales: 1-800-TAX-SALE</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900">Office</h3>
                                        <p className="mt-1 text-gray-600">
                                            123 Tax Street, Suite 100<br />
                                            San Francisco, CA 94105<br />
                                            United States
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Hours</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Monday - Friday</span>
                                    <span className="text-gray-900">9:00 AM - 6:00 PM EST</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Saturday</span>
                                    <span className="text-gray-900">10:00 AM - 4:00 PM EST</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sunday</span>
                                    <span className="text-gray-900">Closed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}