import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface TaxProfile {
    // Personal Information
    firstName: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
    occupation: string;

    // Contact Information
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;

    // Filing Status
    filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household' | 'qualifying_widow';
    residencyStatus?: '' | 'citizen' | 'resident_alien' | 'nonresident_alien';
    residencyTaxYear?: number;
    claimsExemptPresenceDays?: boolean;
    spouseName?: string;
    spouseSSN?: string;

    // Dependents
    hasDependents: boolean;
    numberOfDependents: number;

    // Income Sources
    employmentIncome: boolean;
    selfEmploymentIncome: boolean;
    rentalIncome: boolean;
    investmentIncome: boolean;
    cryptoIncome: boolean;
    otherIncome: boolean;

    // Tax Situations
    hasHealthInsurance: boolean;
    hasMortgage: boolean;
    hasStudentLoans: boolean;
    hasCharitableDonations: boolean;
    hasRetirementAccounts: boolean;
    hasForeignAccounts: boolean;
    hasStockOptions: boolean;

    // Preferences
    preferredLanguage: string;
    receiveUpdates: boolean;
}

const defaultProfile: TaxProfile = {
    firstName: '',
    lastName: '',
    ssn: '',
    dateOfBirth: '',
    occupation: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: 'single',
    hasDependents: false,
    numberOfDependents: 0,
    employmentIncome: false,
    selfEmploymentIncome: false,
    rentalIncome: false,
    investmentIncome: false,
    cryptoIncome: false,
    otherIncome: false,
    hasHealthInsurance: false,
    hasMortgage: false,
    hasStudentLoans: false,
    hasCharitableDonations: false,
    hasRetirementAccounts: false,
    hasForeignAccounts: false,
    hasStockOptions: false,
    preferredLanguage: 'English',
    receiveUpdates: true
};

export function Profile() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<TaxProfile>(defaultProfile);
    const [presenceDays, setPresenceDays] = useState(['', '', '']);
    const [residencyYearInput, setResidencyYearInput] = useState<string>();
    const residencyYear = profile.residencyTaxYear ?? new Date().getFullYear() - 1;
    const countableDays = presenceDays.map(Number);
    const validDays = Number.isInteger(residencyYear) && presenceDays.every((value, index) => {
        const year = residencyYear - index;
        const maxDays = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1 ? 366 : 365;
        return value !== '' && Number.isInteger(countableDays[index])
            && countableDays[index] >= 0 && countableDays[index] <= maxDays;
    });
    const weightedSixths = 6 * countableDays[0] + 2 * countableDays[1] + countableDays[2];
    const meetsPresenceTest = countableDays[0] >= 31 && weightedSixths >= 6 * 183;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                await loadProfile(user.uid);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadProfile = async (userId: string) => {
        try {
            const docRef = doc(db, 'userProfiles', userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data() as TaxProfile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            await setDoc(doc(db, 'userProfiles', user.uid), { ...profile, residencyTaxYear: residencyYear });
            setMessage({ type: 'success', text: 'Profile saved successfully' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Failed to save profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setProfile(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>;
    }

    if (!user) {
        return <div className="text-center py-12">Please sign in to view your profile.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Tax Profile</h1>

                {message && (
                    <div className={`mb-4 p-4 rounded-md ${
                        message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={profile.firstName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={profile.lastName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SSN</label>
                                <input
                                    type="password"
                                    name="ssn"
                                    value={profile.ssn}
                                    onChange={handleChange}
                                    placeholder="XXX-XX-XXXX"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={profile.dateOfBirth}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filing Status */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Filing Status</h2>
                        <div className="space-y-4">
                            <select
                                name="filingStatus"
                                value={profile.filingStatus}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="single">Single</option>
                                <option value="married_joint">Married Filing Jointly</option>
                                <option value="married_separate">Married Filing Separately</option>
                                <option value="head_household">Head of Household</option>
                                <option value="qualifying_widow">Qualifying Widow(er)</option>
                            </select>
                        </div>
                    </div>

                    <fieldset className="bg-white shadow rounded-lg p-6 space-y-4">
                        <legend className="text-xl font-semibold text-gray-900">U.S. Tax Residency</legend>
                        <label className="block">
                            Tax year
                            <input
                                className="block rounded-md border-gray-300"
                                type="number" min="1902" max="2200" required value={residencyYearInput ?? residencyYear}
                                onChange={(event) => {
                                    setResidencyYearInput(event.target.value);
                                    setProfile({
                                        ...profile,
                                        residencyTaxYear: event.target.valueAsNumber,
                                        residencyStatus: '',
                                        claimsExemptPresenceDays: false,
                                    });
                                    setPresenceDays(['', '', '']);
                                }}
                            />
                        </label>
                        <label className="block">
                            Confirmed tax residency status
                            <select
                                className="block rounded-md border-gray-300"
                                name="residencyStatus" value={profile.residencyStatus ?? ''} onChange={handleChange}
                            >
                                <option value="">Select status</option>
                                <option value="citizen">U.S. citizen</option>
                                <option value="resident_alien">Resident alien</option>
                                <option value="nonresident_alien">Nonresident alien</option>
                            </select>
                        </label>
                        {profile.residencyStatus && (
                            <p>Typical federal return for this status{' '}
                                {profile.residencyStatus === 'nonresident_alien'
                                    ? <a className="underline" href="https://www.irs.gov/forms-pubs/about-form-1040-nr">Form 1040-NR</a>
                                    : <a className="underline" href="https://www.irs.gov/forms-pubs/about-form-1040">Form 1040</a>}.</p>
                        )}
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox" name="claimsExemptPresenceDays"
                                checked={profile.claimsExemptPresenceDays ?? false} onChange={handleChange}
                            />
                            I am excluding days as an exempt individual for this tax year
                        </label>
                        {profile.claimsExemptPresenceDays && <p>Review <a className="underline" href="https://www.irs.gov/forms-pubs/about-form-8843">Form 8843</a> for your excluded days.</p>}
                        <h3 className="font-semibold">Substantial Presence Test</h3>
                        <p>Enter countable U.S. days after any applicable exclusions. The green card test, treaties, and other exceptions can affect your residency.</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {presenceDays.map((days, index) => (
                                <label key={index}>
                                    {Number.isInteger(residencyYear) ? residencyYear - index : "Year"} countable days
                                    <input
                                        className="block w-full rounded-md border-gray-300"
                                        type="number" min="0" max="366" value={days}
                                        onChange={(event) => setPresenceDays(presenceDays.map(
                                            (value, position) => position === index ? event.target.value : value
                                        ))}
                                    />
                                </label>
                            ))}
                        </div>
                        {validDays && (
                            <p role="status">
                                {(weightedSixths / 6).toFixed(2)} weighted days.
                                {' '}{meetsPresenceTest ? 'Meets' : 'Does not meet'} the day-count requirements.
                            </p>
                        )}
                    </fieldset>

                    {/* Income Sources */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Income Sources</h2>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="employmentIncome"
                                        checked={profile.employmentIncome}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Employment Income (W-2)</label>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="selfEmploymentIncome"
                                        checked={profile.selfEmploymentIncome}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Self-Employment Income (1099-NEC)</label>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="investmentIncome"
                                        checked={profile.investmentIncome}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Investment Income (1099-B, 1099-DIV)</label>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="cryptoIncome"
                                        checked={profile.cryptoIncome}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Cryptocurrency Transactions</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tax Situations */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Situations</h2>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="hasHealthInsurance"
                                        checked={profile.hasHealthInsurance}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Health Insurance (1095-A, B, or C)</label>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="hasMortgage"
                                        checked={profile.hasMortgage}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Mortgage Interest (1098)</label>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="hasStudentLoans"
                                        checked={profile.hasStudentLoans}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Student Loan Interest (1098-E)</label>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="hasRetirementAccounts"
                                        checked={profile.hasRetirementAccounts}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Retirement Accounts (5498, 1099-R)</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                                saving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Profile'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}