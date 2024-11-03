import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">TaxFront</span>
                        </div>
                        <p className="mt-4 text-gray-600 text-sm">
                            Simplifying tax document management with secure, intelligent solutions.
                        </p>
                        <div className="mt-4 flex space-x-4">
                            <a href="https://facebook.com" className="text-gray-400 hover:text-gray-500">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="https://twitter.com" className="text-gray-400 hover:text-gray-500">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="https://linkedin.com" className="text-gray-400 hover:text-gray-500">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="https://instagram.com" className="text-gray-400 hover:text-gray-500">
                                <Instagram className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link to="/about" className="text-gray-600 hover:text-gray-900">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-600 hover:text-gray-900">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link to="/calculator" className="text-gray-600 hover:text-gray-900">
                                    Tax Calculator
                                </Link>
                            </li>
                            <li>
                                <Link to="/forms" className="text-gray-600 hover:text-gray-900">
                                    Tax Forms
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Support</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link to="/help" className="text-gray-600 hover:text-gray-900">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-gray-600 hover:text-gray-900">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <a href="mailto:support@taxfront.com" className="text-gray-600 hover:text-gray-900">
                                    Email Support
                                </a>
                            </li>
                            <li>
                                <a href="tel:1-800-TAX-FRONT" className="text-gray-600 hover:text-gray-900">
                                    1-800-TAX-FRONT
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link to="/privacy" className="text-gray-600 hover:text-gray-900">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-600 hover:text-gray-900">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/security" className="text-gray-600 hover:text-gray-900">
                                    Security
                                </Link>
                            </li>
                            <li>
                                <Link to="/compliance" className="text-gray-600 hover:text-gray-900">
                                    Compliance
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        © {currentYear} TaxFront. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}