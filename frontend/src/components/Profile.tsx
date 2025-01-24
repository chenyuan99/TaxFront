import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Shield, ArrowLeft, User, Mail, Lock, Bell, CreditCard, Settings, Save} from 'lucide-react';
import {auth, db} from '../firebase';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {UserProfile} from '../types/users';


export function Profile() {
    const [profile, setProfile] = useState<UserProfile>({
        displayName: '',
        email: '',
        phone: '',
        notifications: {
            email: true,
            sms: true,
            documents: true,
            updates: false
        },
        subscription: 'basic'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'billing'>('profile');

    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile({
                        ...docSnap.data() as UserProfile,
                        email: user.email || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setIsSaving(true);
        try {
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, profile);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationChange = (key: keyof UserProfile['notifications']) => {
        setProfile(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600"/>
                            <span className="ml-2 text-xl font-bold text-gray-900">TaxFront</span>
                        </div>
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white shadow rounded-lg">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-6 py-4 text-sm font-medium flex items-center space-x-2 border-b-2 ${
                                    activeTab === 'profile'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <User className="w-4 h-4"/>
                                <span>Profile</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`px-6 py-4 text-sm font-medium flex items-center space-x-2 border-b-2 ${
                                    activeTab === 'notifications'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Bell className="w-4 h-4"/>
                                <span>Notifications</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`px-6 py-4 text-sm font-medium flex items-center space-x-2 border-b-2 ${
                                    activeTab === 'billing'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <CreditCard className="w-4 h-4"/>
                                <span>Billing</span>
                            </button>
                        </nav>
                    </div>

                    <div className="p-8">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        {isEditing ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.displayName}
                                            onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                                            disabled={!isEditing}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                            disabled={!isEditing}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>

                                    {isEditing && (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div
                                                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2"/>
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                                <div className="space-y-4">
                                    {Object.entries(profile.notifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Receive notifications
                                                    about {key === 'updates' ? 'product updates' : key}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleNotificationChange(key as keyof UserProfile['notifications'])}
                                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                                    value ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                            >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Billing Information</h2>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
                                            <p className="text-sm text-gray-500 capitalize">{profile.subscription}</p>
                                        </div>
                                        <Link
                                            to="/"
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Upgrade Plan
                                        </Link>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                                    <button
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                        <CreditCard className="w-4 h-4 mr-2"/>
                                        Add Payment Method
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}