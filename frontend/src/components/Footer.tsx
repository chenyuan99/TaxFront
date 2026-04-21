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
                            <Shield className="h-8 w-8 text-primary" />
                            <span className="ml-2 text-xl font-bold text-primary">TaxFront</span>
                        </div>
                        <p className="mt-4 text-dark text-sm">
                            Simplifying tax document management with secure, intelligent solutions.
                        </p>
                        <div className="mt-4 flex space-x-4">
                            <a href="https://facebook.com" className="text-gray-400 hover:text-primary">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="https://twitter.com" className="text-gray-400 hover:text-primary">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="https://linkedin.com" className="text-gray-400 hover:text-primary">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="https://instagram.com" className="text-gray-400 hover:text-primary">
                                <Instagram className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-dark tracking-wider uppercase">Company</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link to="/about" className="text-gray-600 hover:text-primary">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-600 hover:text-primary">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-dark tracking-wider uppercase">Support</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link to="/help" className="text-gray-600 hover:text-primary">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-gray-600 hover:text-primary">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <a href="mailto:support@taxfront.com" className="text-gray-600 hover:text-primary">
                                    Email Support
                                </a>
                            </li>
                            <li>
                                <a href="tel:1-800-TAX-FRONT" className="text-gray-600 hover:text-primary">
                                    1-800-TAX-FRONT
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-dark tracking-wider uppercase">Legal</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link to="/privacy" className="text-gray-600 hover:text-primary">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-600 hover:text-primary">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <a href="https://github.com/chenyuan99/TaxFront/blob/main/SECURITY.md" 
                                   className="text-gray-600 hover:text-primary"
                                   target="_blank"
                                   rel="noopener noreferrer">
                                    Security
                                </a>
                            </li>
                            <li>
                                <Link to="/compliance" className="text-gray-600 hover:text-primary">
                                    Compliance
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8">
                    <p className="text-gray-400 text-sm text-center">
                        &copy; {currentYear} TaxFront. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}