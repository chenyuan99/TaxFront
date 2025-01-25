import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Calculator, DollarSign, Percent, RefreshCw } from 'lucide-react';

interface TaxBracket {
    min: number;
    max: number | null;
    rate: number;
}

interface StateTax {
    name: string;
    rate: number;
    type: 'flat' | 'progressive';
    brackets?: TaxBracket[];
}

export function TaxCalculator() {
    const [income, setIncome] = useState<string>('');
    const [filingStatus, setFilingStatus] = useState<string>('single');
    const [selectedState, setSelectedState] = useState<string>('');
    const [calculatedTax, setCalculatedTax] = useState<number | null>(null);
    const [stateTax, setStateTax] = useState<number | null>(null);
    const [effectiveRate, setEffectiveRate] = useState<number | null>(null);
    const [stateEffectiveRate, setStateEffectiveRate] = useState<number | null>(null);
    const [showDetails, setShowDetails] = useState<boolean>(false);

    const taxBrackets: Record<string, TaxBracket[]> = {
        single: [
            { min: 0, max: 11000, rate: 10 },
            { min: 11001, max: 44725, rate: 12 },
            { min: 44726, max: 95375, rate: 22 },
            { min: 95376, max: 182100, rate: 24 },
            { min: 182101, max: 231250, rate: 32 },
            { min: 231251, max: 578125, rate: 35 },
            { min: 578126, max: null, rate: 37 }
        ],
        joint: [
            { min: 0, max: 22000, rate: 10 },
            { min: 22001, max: 89450, rate: 12 },
            { min: 89451, max: 190750, rate: 22 },
            { min: 190751, max: 364200, rate: 24 },
            { min: 364201, max: 462500, rate: 32 },
            { min: 462501, max: 693750, rate: 35 },
            { min: 693751, max: null, rate: 37 }
        ],
        head: [
            { min: 0, max: 15700, rate: 10 },
            { min: 15701, max: 59850, rate: 12 },
            { min: 59851, max: 95350, rate: 22 },
            { min: 95351, max: 182100, rate: 24 },
            { min: 182101, max: 231250, rate: 32 },
            { min: 231251, max: 578100, rate: 35 },
            { min: 578101, max: null, rate: 37 }
        ]
    };

    const stateTaxes: Record<string, StateTax> = {
        CA: { name: 'California', rate: 13.3, type: 'progressive' },
        NY: { name: 'New York', rate: 10.9, type: 'progressive' },
        TX: { name: 'Texas', rate: 0, type: 'flat' },
        FL: { name: 'Florida', rate: 0, type: 'flat' },
        IL: { name: 'Illinois', rate: 4.95, type: 'flat' },
        MA: { name: 'Massachusetts', rate: 5, type: 'flat' },
        NJ: { name: 'New Jersey', rate: 10.75, type: 'progressive' },
        PA: { name: 'Pennsylvania', rate: 3.07, type: 'flat' },
        WA: { name: 'Washington', rate: 0, type: 'flat' },
        VA: { name: 'Virginia', rate: 5.75, type: 'progressive' },
    };

    const calculateTax = () => {
        const incomeNum = parseFloat(income.replace(/,/g, ''));
        if (isNaN(incomeNum)) return;

        // Calculate Federal Tax
        let totalTax = 0;
        const brackets = taxBrackets[filingStatus];
        let bracketDetails: { rate: number; amount: number }[] = [];

        brackets.forEach((bracket, index) => {
            const prevMax = index > 0 ? brackets[index - 1].max! : 0;
            const taxableInBracket = Math.min(
                incomeNum > bracket.min ? incomeNum - bracket.min : 0,
                bracket.max ? bracket.max - bracket.min : incomeNum - bracket.min
            );

            if (taxableInBracket > 0) {
                const taxInBracket = (taxableInBracket * bracket.rate) / 100;
                totalTax += taxInBracket;
                bracketDetails.push({ rate: bracket.rate, amount: taxInBracket });
            }
        });

        // Calculate State Tax
        let totalStateTax = 0;
        if (selectedState && stateTaxes[selectedState]) {
            const stateTaxInfo = stateTaxes[selectedState];
            if (stateTaxInfo.type === 'flat') {
                totalStateTax = (incomeNum * stateTaxInfo.rate) / 100;
            } else {
                // Simplified progressive calculation for states
                totalStateTax = (incomeNum * stateTaxInfo.rate) / 100;
            }
        }

        setCalculatedTax(Math.round(totalTax));
        setStateTax(Math.round(totalStateTax));
        setEffectiveRate(Math.round((totalTax / incomeNum) * 1000) / 10);
        setStateEffectiveRate(Math.round((totalStateTax / incomeNum) * 1000) / 10);
    };

    const formatCurrency = (value: string) => {
        const number = value.replace(/[^\d.]/g, '');
        const parts = number.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setIncome(formatCurrency(value));
    };

    const reset = () => {
        setIncome('');
        setCalculatedTax(null);
        setEffectiveRate(null);
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

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-center mb-6">
                        <Calculator className="h-8 w-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">Federal Tax Calculator</h1>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filing Status
                                </label>
                                <select
                                    value={filingStatus}
                                    onChange={(e) => setFilingStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="single">Single</option>
                                    <option value="joint">Married Filing Jointly</option>
                                    <option value="head">Head of Household</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State of Residence
                                </label>
                                <select
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a state</option>
                                    {Object.entries(stateTaxes).map(([code, info]) => (
                                        <option key={code} value={code}>
                                            {info.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Annual Taxable Income
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={income}
                                    onChange={handleIncomeChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={calculateTax}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Calculate Tax
                            </button>
                            <button
                                onClick={reset}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset
                            </button>
                        </div>

                        {calculatedTax !== null && (
                            <div className="mt-8 space-y-6">
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Federal Tax Summary</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Estimated Federal Tax</h3>
                                            <p className="mt-1 text-3xl font-bold text-gray-900">
                                                ${calculatedTax.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Federal Tax Rate</h3>
                                            <div className="flex items-center mt-1">
                                                <Percent className="h-5 w-5 text-gray-400 mr-1" />
                                                <p className="text-2xl font-semibold text-gray-900">{effectiveRate}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedState && stateTax !== null && (
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-4">State Tax Summary</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500">Estimated State Tax</h3>
                                                <p className="mt-1 text-3xl font-bold text-gray-900">
                                                    ${stateTax.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500">State Tax Rate</h3>
                                                <div className="flex items-center mt-1">
                                                    <Percent className="h-5 w-5 text-gray-400 mr-1" />
                                                    <p className="text-2xl font-semibold text-gray-900">
                                                        {stateEffectiveRate}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Total Tax Burden</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Total Estimated Tax</h3>
                                            <p className="mt-1 text-3xl font-bold text-gray-900">
                                                ${(calculatedTax + (stateTax || 0)).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Combined Tax Rate</h3>
                                            <div className="flex items-center mt-1">
                                                <Percent className="h-5 w-5 text-gray-400 mr-1" />
                                                <p className="text-2xl font-semibold text-gray-900">
                                                    {((effectiveRate || 0) + (stateEffectiveRate || 0)).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm space-y-2">
                                    <p className="text-gray-900">
                                        <span className="font-semibold">Federal Tax Notes:</span>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>Based on 2024 federal tax brackets</li>
                                            <li>Calculations assume standard deduction</li>
                                            <li>Does not include credits or additional deductions</li>
                                        </ul>
                                    </p>
                                    {selectedState && (
                                        <p className="text-gray-900">
                                            <span className="font-semibold">State Tax Notes:</span>
                                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                                <li>
                                                    {stateTaxes[selectedState].type === 'flat'
                                                        ? `${stateTaxes[selectedState].name} has a flat tax rate of ${stateTaxes[selectedState].rate}%`
                                                        : `${stateTaxes[selectedState].name} has a progressive tax system with rates up to ${stateTaxes[selectedState].rate}%`}
                                                </li>
                                                <li>Local taxes and special assessments are not included</li>
                                                <li>Actual rates may vary based on specific circumstances</li>
                                            </ul>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="text-sm text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900 mb-2">Important Disclaimers:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>This calculator provides estimates only and should not be used as tax advice.</li>
                                <li>For accurate tax calculations, please consult a tax professional.</li>
                                <li>Tax rates and brackets are subject to change.</li>
                                <li>Additional taxes and fees may apply based on your specific situation.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}