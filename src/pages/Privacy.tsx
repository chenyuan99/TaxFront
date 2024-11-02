import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock } from 'lucide-react';

export function Privacy() {
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
    <div className="flex items-center mb-8">
    <Lock className="h-8 w-8 text-blue-600 mr-3" />
    <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
    </div>

    <div className="space-y-6 text-gray-600">
    <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
    <div className="space-y-4">
        <p>We collect information to provide better services to our users:</p>
    <ul className="list-disc pl-5 space-y-2">
        <li>Account information (name, email, phone number)</li>
    <li>Tax documents and related information</li>
    <li>Usage data and interaction with our services</li>
    <li>Device information and logs</li>
    </ul>
    </div>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
    <p className="mb-4">We use the information we collect to:</p>
    <ul className="list-disc pl-5 space-y-2">
        <li>Provide and maintain our services</li>
    <li>Process and organize your tax documents</li>
    <li>Improve and personalize your experience</li>
    <li>Communicate with you about our services</li>
    <li>Detect and prevent fraud or abuse</li>
    </ul>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data Security</h2>
    <p className="mb-4">
        We implement robust security measures to protect your information:
        </p>
        <ul className="list-disc pl-5 space-y-2">
        <li>End-to-end encryption for document storage and transmission</li>
    <li>Regular security audits and penetration testing</li>
    <li>Secure data centers with 24/7 monitoring</li>
    <li>Employee access controls and security training</li>
    </ul>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
    <p>
    We do not sell your personal information. We may share your information only in the following circumstances:
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2">
        <li>With your explicit consent</li>
    <li>To comply with legal obligations</li>
    <li>With service providers who assist in our operations</li>
    <li>In connection with a business merger or acquisition</li>
    </ul>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>
    <p className="mb-4">You have the right to:</p>
    <ul className="list-disc pl-5 space-y-2">
        <li>Access your personal information</li>
    <li>Correct inaccurate data</li>
    <li>Request deletion of your data</li>
    <li>Export your data</li>
    <li>Opt-out of marketing communications</li>
    </ul>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookie Policy</h2>
    <p>
    We use cookies and similar technologies to provide and improve our services. You can control cookie preferences through your browser settings. Essential cookies required for basic site functionality cannot be disabled.
    </p>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
    <p>
    Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
    </p>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to This Policy</h2>
    <p>
    We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
    </p>
    </section>

    <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
    <p>
    If you have any questions about this Privacy Policy, please contact us at:
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
    <p className="text-sm">Email: privacy@taxfront.com</p>
    <p className="text-sm">Phone: 1-800-TAX-FRONT</p>
    <p className="text-sm">Address: 123 Privacy Way, Suite 100, San Francisco, CA 94105</p>
    </div>
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