"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { useSyncActiveSession } from "@/hooks/useSyncActiveSession";
import { useQueryClient } from '@tanstack/react-query';
import { fetchSessions } from '@/hooks/useSessionsQuery';
import { fetchGoals } from '@/hooks/useGoalsQuery';

// ✅ Explicit type alias
type AuthContextType = {
    user: FirebaseUser | null;
    loading: boolean;
};

// ✅ Create context with type
// const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    // We must ensure this hook only runs *after* the user is set. (user?.uid is undefined initially)
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if(currentUser){
                setUser(currentUser);
                setIsAuthReady(true);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- THIS IS PRE-FETCHING HOOK ---
    useEffect(() => {
        // Run this only when the user object is available
        if (user?.uid) {
            console.log("User logged in. Pre-fetching data for offline use...");

            // Pre-fetch sessions to prime the cache
            queryClient.prefetchQuery({
                queryKey: ['sessions', user.uid],
                queryFn: () => fetchSessions(user.uid),
            });

            // Pre-fetch goals to prime the cache
            queryClient.prefetchQuery({
                queryKey: ['goals', user.uid],
                queryFn: () => fetchGoals(user.uid),
            });
        }
    }, [user, queryClient]); // Runs once when 'user' becomes available

    // This syncs our Zustand store with Firestore in real-time
    // and handles cross-device updates.
    useSyncActiveSession(isAuthReady ? user : null);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ Hook with proper typing
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
