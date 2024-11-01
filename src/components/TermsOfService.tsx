import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export function TermsOfService() {
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

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white shadow rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

                    <div className="space-y-6 text-gray-600">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                            <p>
                                Welcome to TaxFront. By using our service, you agree to these terms. Please read them carefully. These Terms of Service ("Terms") govern your access to and use of TaxFront's services, including our website, mobile applications, and any software provided on or in connection with TaxFront services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Using our Services</h2>
                            <p className="mb-4">
                                You must follow any policies made available to you within the Services. You may use our Services only as permitted by law. We may suspend or stop providing our Services to you if you do not comply with our terms or policies or if we are investigating suspected misconduct.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You must be at least 18 years old to use our Services</li>
                                <li>You must provide accurate and complete information when creating an account</li>
                                <li>You are responsible for maintaining the security of your account credentials</li>
                                <li>You must not misuse our Services or help anyone else do so</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Privacy & Security</h2>
                            <p>
                                TaxFront's privacy policy explains how we treat your personal data and protect your privacy when you use our Services. By using our Services, you agree that TaxFront can use such data in accordance with our privacy policies. We maintain strict security measures to protect your information, including advanced encryption and secure data storage.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Your Content</h2>
                            <p>
                                Our Services allow you to upload, submit, store, send or receive content. You retain ownership of any intellectual property rights that you hold in that content. When you upload, submit, store, send or receive content to or through our Services, you give TaxFront a worldwide license to use, host, store, reproduce, modify, create derivative works, communicate, publish, publicly perform, publicly display and distribute such content.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Software in our Services</h2>
                            <p>
                                When a Service requires or includes downloadable software, this software may update automatically on your device once a new version or feature is available. Some Services may let you adjust your automatic update settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Modifying and Terminating our Services</h2>
                            <p>
                                We are constantly changing and improving our Services. We may add or remove functionalities or features, and we may suspend or stop a Service altogether. You can stop using our Services at any time. TaxFront may also stop providing Services to you, or add or create new limits to our Services at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Liability for our Services</h2>
                            <p>
                                When permitted by law, TaxFront and its suppliers and distributors will not be responsible for lost profits, revenues, or data, financial losses or indirect, special, consequential, exemplary, or punitive damages.
                            </p>
                        </section>

                        <section className="border-t pt-6">
                            <p className="text-sm text-gray-500">
                                Last updated: March 14, 2024
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}