// Create a new file: src/components/AuthProvider.js

'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AuthComponent from './AuthComponent'; // Your login UI

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-[#121212] text-white">Loading...</div>;
    }

    // If there is no user, show the login page (your AuthComponent)
    if (!user) {
        return <AuthComponent />;
    }

    // If there IS a user, show the main app
    return children;
}