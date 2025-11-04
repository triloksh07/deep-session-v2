'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase'; // Make sure you're exporting auth from your firebase.js
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signOut,
    User
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
    Settings
    , LogOut
} from 'lucide-react';
import Image from 'next/image';

// Create the providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export default function AuthComponent() {
    // State to hold the current user object
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // This is the most important listener. It runs when the component mounts
    // and whenever the user's sign-in state changes.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Function to handle the sign-in process
    const handleSignIn = async (provider: 'google' | 'github') => {
        const authProvider = provider === 'google' ? googleProvider : githubProvider;
        try {
            const result = await signInWithPopup(auth, authProvider);
            const loggedInUser = result.user;

            // --- Save user data to Firestore ---
            // This creates a 'users' collection where you can store extra info
            // about your users. It's great for profiles, settings, etc.
            const userRef = doc(db, "users", loggedInUser.uid);
            await setDoc(userRef, {
                uid: loggedInUser.uid,
                email: loggedInUser.email,
                displayName: loggedInUser.displayName,
                photoURL: loggedInUser.photoURL,
                lastLogin: new Date()
            }, { merge: true }); // merge: true prevents overwriting existing data

            console.log("User signed in and data saved to Firestore.");

        } catch (error) {
            console.error(`Error during sign-in with ${provider}:`, error);
        }
    };

    // Function to handle sign-out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log("User signed out.");
        } catch (error) {
            console.error("Error during sign-out:", error);
        }
    };

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="border border-[#8A2BE2]/20 bg-[#1E1E1E] rounded-xl p-6 shadow-lg text-white w-full max-w-sm">
            {user ? (
                // --- Logged-In View: User Profile Card ---
                <div className="space-y-2 ">
                    {/* Header: Avatar and Name */}
                    <div className="flex items-center justify-between mb-6 [w-80%]">
                        <div className="[w-80%] flex items-center space-x-4">
                            <div className="relative">
                                {user.photoURL ? (
                                    <Image
                                        src={user.photoURL}
                                        alt={user.displayName || "User avatar"}
                                        className="w-12 h-12 rounded-full"
                                        width={50}
                                        height={48}
                                    />

                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-[#8A2BE2]/20 flex items-center justify-center">
                                        <span className="text-xl font-bold text-[#8A2BE2]">{user.displayName}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Welcome back,</p>
                                <h2 className="text-xl font-bold">{user.displayName}</h2>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {/* <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><Settings size={20} /></button> */}
                            <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><LogOut size={20} /></button>
                        </div>
                    </div>
                </div>
            ) : (
                // --- Logged-Out View ---
                <div className="max-w-sm space-y-4">
                    <h2 className="text-xl font-semibold text-center">Join DeepSession</h2>
                    <button onClick={() => handleSignIn('google')} className="w-full bg-blue-600/90 text-white font-bold py-2.5 rounded-lg hover:bg-blue-600 transition-colors">
                        Sign in with Google
                    </button>
                    <button onClick={() => handleSignIn('github')} className="w-full bg-gray-700/90 text-white font-bold py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
                        Sign in with GitHub
                    </button>
                </div>
            )}
        </div>
    );
}
