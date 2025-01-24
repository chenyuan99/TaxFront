import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Calculator, DollarSign, Percent, RefreshCw } from 'lucide-react';

interface TaxBracket {
    min: number;
    max: number | null;
    rate: number;
}

export function TaxCalculator() {
    const [income, setIncome] = useState<string>('');
    const [filingStatus, setFilingStatus] = useState<string>('single');
    const [calculatedTax, setCalculatedTax] = useState<number | null>(null);
    const [effectiveRate, setEffectiveRate] = useState<number | null>(null);

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

    const calculateTax = () => {
        const incomeNum = parseFloat(income.replace(/,/g, ''));
        if (isNaN(incomeNum)) return;

        let totalTax = 0;
        const brackets = taxBrackets[filingStatus];

        brackets.forEach((bracket, index) => {
            const prevMax = index > 0 ? brackets[index - 1].max! : 0;
            const taxableInBracket = Math.min(
                incomeNum > bracket.min ? incomeNum - bracket.min : 0,
                bracket.max ? bracket.max - bracket.min : incomeNum - bracket.min
            );

            if (taxableInBracket > 0) {
                totalTax += (taxableInBracket * bracket.rate) / 100;
            }
        });

        setCalculatedTax(Math.round(totalTax));
        setEffectiveRate(Math.round((totalTax / incomeNum) * 1000) / 10);
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
                            <div className="mt-8 p-6 bg-gray-50 rounded-lg space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Estimated Federal Tax</h3>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">
                                        ${calculatedTax.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Effective Tax Rate</h3>
                                    <div className="flex items-center mt-1">
                                        <Percent className="h-5 w-5 text-gray-400 mr-1" />
                                        <p className="text-2xl font-semibold text-gray-900">{effectiveRate}%</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-sm text-gray-500 mt-6">
                            <p>* This calculator provides estimates based on 2024 federal tax brackets.</p>
                            <p>* State and local taxes are not included in these calculations.</p>
                            <p>* For accurate tax advice, please consult a tax professional.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}