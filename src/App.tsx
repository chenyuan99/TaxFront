import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { AccountantDashboard } from './components/AccountantDashboard';
import { TermsOfService } from './components/TermsOfService';
import { Privacy } from './components/Privacy';
import { Contact } from './components/Contact';
import { Profile } from './components/Profile';
import { About } from './components/About';
import { TaxCalculator } from './components/TaxCalculator';
import { TaxForms } from './components/TaxForms';
import { CookieBanner } from './components/CookieBanner';
import { auth } from './firebase';
import { User } from 'firebase/auth';
import { Chat }  from "./components/Chat.tsx";

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
            <Routes>
                <Route path="terms" element={<TermsOfService />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="contact" element={<Contact />} />
                <Route path="about" element={<About />} />
                <Route path="calculator" element={<TaxCalculator />} />
                <Route path="forms" element={<TaxForms />} />
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
            <Chat />
            <CookieBanner />
        </BrowserRouter>
    );
}