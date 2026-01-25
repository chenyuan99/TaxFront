import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { Auth } from './components/Auth.tsx';
import { Register } from './components/Register.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AccountantDashboard } from './components/AccountantDashboard.tsx';
import { TermsOfService } from './components/TermsOfService.tsx';
import { Privacy } from './components/Privacy.tsx';
import { Contact } from './components/Contact.tsx';
import { Profile } from './components/Profile.tsx';
import { About } from './components/About.tsx';
import { TaxCalculator } from './components/TaxCalculator.tsx';
import { TaxForms } from './components/TaxForms.tsx';
import { TaxQuestionnaire } from './components/TaxQuestionnaire';
import { CookieBanner } from './components/CookieBanner.tsx';
import { auth } from './firebase.ts';
import { User } from 'firebase/auth';
import { Chat }  from "./components/Chat.tsx";
import {Footer} from "./components/Footer.tsx";
import { StorageTest } from "./components/StorageTest.tsx";
import { Jobs } from './components/Jobs.tsx';
import { Navbar } from './components/Navbar.tsx';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAccountant, setIsAccountant] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            setIsAccountant(user?.email?.includes('accountant') || false);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
                {user && <Navbar />}
                <main className="pb-8">
                    <Routes>
                        <Route path="/login" element={<Auth />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="terms" element={<TermsOfService />} />
                        <Route path="privacy" element={<Privacy />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="about" element={<About />} />
                        <Route path="calculator" element={<TaxCalculator />} />
                        <Route path="forms" element={<TaxForms />} />
                        <Route path="questionnaire" element={
                            user ? (
                                <TaxQuestionnaire
                                    userId={user.uid}
                                    onComplete={(data) => {
                                        console.log('Questionnaire completed:', data);
                                        // Handle completion - could redirect to dashboard or show confirmation
                                    }}
                                    onSave={(data) => {
                                        console.log('Questionnaire auto-saved:', data);
                                    }}
                                    language="both"
                                />
                            ) : (
                                <Auth />
                            )
                        } />
                        <Route path="storage-test" element={<StorageTest />} />
                        <Route path="jobs" element={user ? <Jobs /> : <Auth />} />
                        <Route path="profile" element={user ? <Profile /> : <Auth />} />
                        <Route
                            path="*"
                            element={
                                user ? (
                                    isAccountant ? <AccountantDashboard /> : <Dashboard />
                                ) : (
                                    <Auth />
                                )
                            }
                        />
                    </Routes>
                </main>
                <Chat />
                <Footer />
                <CookieBanner />
                <Analytics />
            </div>
        </BrowserRouter>
    );
}