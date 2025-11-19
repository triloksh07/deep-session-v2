// lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
// NEW: Import the new functions for Firestore initialization
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Authentication
const auth = getAuth(app);

// Check if we are in the browser before initializing analytics
if (typeof window !== 'undefined') {
    getAnalytics(app);
    // Export analytics only on the client-side
    // You can then import it conditionally in your components if needed
}

// --- NEW & IMPROVED WAY TO INITIALIZE FIRESTORE ---
// This replaces getFirestore() and enableIndexedDbPersistence()
// It sets up the database with offline caching from the start.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
    })
});

// Export the services you'll need
export { db, auth };

