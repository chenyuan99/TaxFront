import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB6gJ0vRwC0QBvuCjU5Fb0AFQmIpruPpRk",
    authDomain: "taxfront-1e142.firebaseapp.com",
    projectId: "taxfront-1e142",
    storageBucket: "taxfront-1e142.firebasestorage.app",
    messagingSenderId: "615133823642",
    appId: "1:615133823642:web:73a11183935442946bd523",
    measurementId: "G-JB2D6RQ1ND"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);