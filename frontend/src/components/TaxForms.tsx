import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, FileText, Search, ExternalLink, Info } from 'lucide-react';

interface TaxForm {
    id: string;
    name: string;
    description: string;
    category: 'individual' | 'business' | 'employment' | 'specialized';
    deadline: string;
    commonUses: string[];
}

export function TaxForms() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const forms: TaxForm[] = [
        {
            id: '1040',
            name: 'Form 1040: U.S. Individual Income Tax Return',
            description: 'The main tax form for individual taxpayers to report annual income and calculate tax liability.',
            category: 'individual',
            deadline: 'April 15',
            commonUses: [
                'Report wages and salary income',
                'Report self-employment income',
                'Claim tax deductions and credits',
                'Calculate total tax liability'
            ]
        },
        {
            id: '1040-SR',
            name: 'Form 1040-SR: U.S. Tax Return for Seniors',
            description: 'A simplified version of Form 1040 designed for taxpayers age 65 and older.',
            category: 'individual',
            deadline: 'April 15',
            commonUses: [
                'Report retirement income',
                'Report Social Security benefits',
                'Claim age-related tax benefits',
                'Calculate tax with larger print format'
            ]
        },
        {
            id: 'W-2',
            name: 'Form W-2: Wage and Tax Statement',
            description: 'Reports annual wages earned and taxes withheld from an employer.',
            category: 'employment',
            deadline: 'January 31',
            commonUses: [
                'Report annual wages',
                'Show federal tax withholding',
                'Report Social Security and Medicare wages',
                'Document state tax withholding'
            ]
        },
        {
            id: '1099-NEC',
            name: 'Form 1099-NEC: Nonemployee Compensation',
            description: 'Reports payments made to independent contractors and freelancers.',
            category: 'business',
            deadline: 'January 31',
            commonUses: [
                'Report freelance income',
                'Document contractor payments',
                'Report self-employment earnings',
                'Show business service payments'
            ]
        },
        {
            id: '1099-MISC',
            name: 'Form 1099-MISC: Miscellaneous Income',
            description: 'Reports various types of income payments not covered by other 1099 forms.',
            category: 'business',
            deadline: 'January 31',
            commonUses: [
                'Report rent payments',
                'Document royalty payments',
                'Report prizes and awards',
                'Show other income types'
            ]
        },
        {
            id: '1099-INT',
            name: 'Form 1099-INT: Interest Income',
            description: 'Reports interest earned from banks, investments, and other sources.',
            category: 'individual',
            deadline: 'January 31',
            commonUses: [
                'Report bank interest',
                'Document investment interest',
                'Show bond interest earnings',
                'Report tax-exempt interest'
            ]
        },
        {
            id: '1099-DIV',
            name: 'Form 1099-DIV: Dividends and Distributions',
            description: 'Reports dividend payments and capital gain distributions from investments.',
            category: 'individual',
            deadline: 'January 31',
            commonUses: [
                'Report stock dividends',
                'Document mutual fund distributions',
                'Show capital gain distributions',
                'Report qualified dividends'
            ]
        },
        {
            id: 'Schedule C',
            name: 'Schedule C: Profit or Loss from Business',
            description: 'Reports income and expenses from a sole proprietorship business.',
            category: 'business',
            deadline: 'April 15',
            commonUses: [
                'Report business income',
                'Document business expenses',
                'Calculate net profit/loss',
                'Report home office deductions'
            ]
        },
        {
            id: 'Schedule E',
            name: 'Schedule E: Supplemental Income and Loss',
            description: 'Reports income from rental properties, partnerships, and S corporations.',
            category: 'specialized',
            deadline: 'April 15',
            commonUses: [
                'Report rental income',
                'Document partnership earnings',
                'Show S corporation income',
                'Report estate/trust income'
            ]
        },
        {
            id: '8829',
            name: 'Form 8829: Expenses for Business Use of Your Home',
            description: 'Calculates deductions for business use of a home.',
            category: 'specialized',
            deadline: 'April 15',
            commonUses: [
                'Calculate home office deduction',
                'Document workspace expenses',
                'Report utility allocations',
                'Show home business costs'
            ]
        }
    ];

    const filteredForms = forms.filter(form => {
        const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || form.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[#00395D] mb-2">Tax Forms Guide</h1>
                            <p className="text-gray-600">
                                Find and understand the tax forms you need for your situation.
                            </p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#00395D] hover:text-[#00AAFF] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search forms by name or description..."
                                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-[#00AAFF] focus:border-[#00AAFF] bg-white shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <select
                                className="w-full border border-gray-300 rounded-lg py-3 pl-4 pr-8 focus:ring-[#00AAFF] focus:border-[#00AAFF] bg-white shadow-sm"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="individual">Individual Tax Forms</option>
                                <option value="business">Business Tax Forms</option>
                                <option value="employment">Employment Forms</option>
                                <option value="specialized">Specialized Forms</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {filteredForms.map((form) => (
                            <div
                                key={form.id}
                                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <FileText className="h-5 w-5 text-[#00AAFF] mr-2" />
                                            <h3 className="text-lg font-semibold text-[#00395D]">
                                                {form.name}
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">{form.description}</p>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#E5F4FF] text-[#00395D]">
                                        Due: {form.deadline}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-[#00395D] mb-2 flex items-center">
                                        <Info className="h-4 w-4 mr-1" />
                                        Common Uses
                                    </h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {form.commonUses.map((use, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center text-sm text-gray-600"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00AAFF] mr-2"></span>
                                                {use}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <a
                                        href={`https://www.irs.gov/forms-pubs/about-form-${form.id.toLowerCase()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-[#00AAFF] hover:text-[#00395D] transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        View Official Form
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredForms.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
                            <p className="text-gray-600">
                                Try adjusting your search or filter to find what you're looking for.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}