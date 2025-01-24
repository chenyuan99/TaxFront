export interface Client {
    id: string;
    name: string;
    email: string;
    documentsCount: number;
    lastActivity: Date;
    status: 'active' | 'pending' | 'inactive';
}

export interface Accountant {
    id: string;
    name: string;
    email: string;
    clientsCount: number;
    lastActivity: Date;
    status: 'active' | 'inactive';
}

export interface UserProfile {
    displayName: string;
    email: string;
    phone: string;
    notifications: {
        email: boolean;
        sms: boolean;
        documents: boolean;
        updates: boolean;
    };
    subscription: 'basic' | 'professional' | 'enterprise';
}