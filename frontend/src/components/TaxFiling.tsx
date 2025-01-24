import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, FileText, DollarSign, Building, User, Home, Briefcase, Save, Send } from 'lucide-react';

interface TaxForm {
    personalInfo: {
        firstName: string;
        lastName: string;
        ssn: string;
        dateOfBirth: string;
        occupation: string;
    };
    contactInfo: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        phone: string;
        email: string;
    };
    incomeInfo: {
        wagesAmount: string;
        interestAmount: string;
        dividendsAmount: string;
        businessIncome: string;
        rentalIncome: string;
        otherIncome: string;
    };
    deductionsInfo: {
        mortgageInterest: string;
        charitableDonations: string;
        studentLoanInterest: string;
        medicalExpenses: string;
        stateLocalTaxes: string;
        retirementContributions: string;
    };
}

export function TaxFiling() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<TaxForm>({
        personalInfo: {
            firstName: '',
            lastName: '',
            ssn: '',
            dateOfBirth: '',
            occupation: ''
        },
        contactInfo: {
            address: '',
            city: '',
            state: '',
            zipCode: '',
            phone: '',
            email: ''
        },
        incomeInfo: {
            wagesAmount: '',
            interestAmount: '',
            dividendsAmount: '',
            businessIncome: '',
            rentalIncome: '',
            otherIncome: ''
        },
        deductionsInfo: {
            mortgageInterest: '',
            charitableDonations: '',
            studentLoanInterest: '',
            medicalExpenses: '',
            stateLocalTaxes: '',
            retirementContributions: ''
        }
    });

    const handleInputChange = (section: keyof TaxForm, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const formatCurrency = (value: string) => {
        const number = value.replace(/[^\d.]/g, '');
        const parts = number.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log('Form submitted:', formData);
    };

    const renderProgressBar = () => {
        const steps = ['Personal Information', 'Contact Details', 'Income', 'Deductions'];
        return (
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {steps.map((step, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index + 1)}
                            className={`flex-1 text-sm font-medium ${
                                currentStep === index + 1
                                    ? 'text-blue-600'
                                    : currentStep > index + 1
                                        ? 'text-green-600'
                                        : 'text-gray-400'
                            }`}
                        >
                            {step}
                        </button>
                    ))}
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                </div>
            </div>
        );
    };

    const renderPersonalInfo = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                        type="text"
                        value={formData.personalInfo.firstName}
                        onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                        type="text"
                        value={formData.personalInfo.lastName}
                        onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Social Security Number</label>
                <input
                    type="password"
                    value={formData.personalInfo.ssn}
                    onChange={(e) => handleInputChange('personalInfo', 'ssn', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Occupation</label>
                    <input
                        type="text"
                        value={formData.personalInfo.occupation}
                        onChange={(e) => handleInputChange('personalInfo', 'occupation', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );

    const renderContactInfo = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <input
                    type="text"
                    value={formData.contactInfo.address}
                    onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                        type="text"
                        value={formData.contactInfo.city}
                        onChange={(e) => handleInputChange('contactInfo', 'city', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                        type="text"
                        value={formData.contactInfo.state}
                        onChange={(e) => handleInputChange('contactInfo', 'state', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                        type="text"
                        value={formData.contactInfo.zipCode}
                        onChange={(e) => handleInputChange('contactInfo', 'zipCode', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                        type="tel"
                        value={formData.contactInfo.phone}
                        onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        type="email"
                        value={formData.contactInfo.email}
                        onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );

    const renderIncomeInfo = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Wages and Salary</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.incomeInfo.wagesAmount}
                            onChange={(e) => handleInputChange('incomeInfo', 'wagesAmount', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Income</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.incomeInfo.interestAmount}
                            onChange={(e) => handleInputChange('incomeInfo', 'interestAmount', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Dividend Income</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.incomeInfo.dividendsAmount}
                            onChange={(e) => handleInputChange('incomeInfo', 'dividendsAmount', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Business Income</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.incomeInfo.businessIncome}
                            onChange={(e) => handleInputChange('incomeInfo', 'businessIncome', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Rental Income</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.incomeInfo.rentalIncome}
                            onChange={(e) => handleInputChange('incomeInfo', 'rentalIncome', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Other Income</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.incomeInfo.otherIncome}
                            onChange={(e) => handleInputChange('incomeInfo', 'otherIncome', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDeductionsInfo = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mortgage Interest</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.deductionsInfo.mortgageInterest}
                            onChange={(e) => handleInputChange('deductionsInfo', 'mortgageInterest', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Charitable Donations</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.deductionsInfo.charitableDonations}
                            onChange={(e) => handleInputChange('deductionsInfo', 'charitableDonations', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Student Loan Interest</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.deductionsInfo.studentLoanInterest}
                            onChange={(e) => handleInputChange('deductionsInfo', 'studentLoanInterest', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Medical Expenses</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.deductionsInfo.medicalExpenses}
                            onChange={(e) => handleInputChange('deductionsInfo', 'medicalExpenses', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">State & Local Taxes</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.deductionsInfo.stateLocalTaxes}
                            onChange={(e) => handleInputChange('deductionsInfo', 'stateLocalTaxes', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Retirement Contributions</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.deductionsInfo.retirementContributions}
                            onChange={(e) => handleInputChange('deductionsInfo', 'retirementContributions', formatCurrency(e.target.value))}
                            className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

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

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-center mb-6">
                        <FileText className="h-8 w-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">File Your Taxes</h1>
                    </div>

                    {renderProgressBar()}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {currentStep === 1 && renderPersonalInfo()}
                        {currentStep === 2 && renderContactInfo()}
                        {currentStep === 3 && renderIncomeInfo()}
                        {currentStep === 4 && renderDeductionsInfo()}

                        <div className="flex justify-between pt-6">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Previous
                                </button>
                            )}
                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Tax Return
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}