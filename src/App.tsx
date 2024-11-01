import React, {useEffect, useState} from 'react';
import {Auth} from './components/Auth';
import {Dashboard} from './components/Dashboard';
import {auth} from './firebase';
import {User} from 'firebase/auth';

function App() {
    const [user, setUserS] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUserS(user);
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

    return user ? <Dashboard/> : <Auth/>;
}

export default App;