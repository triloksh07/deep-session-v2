// hooks/useAuth.ts

'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Your firebase config

interface AuthState {
  user: User | null;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  // Start in a loading state *until* Firebase has confirmed the user.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // This callback fires on:
      // 1. Initial page load (with cached user OR null)
      // 2. Login
      // 3. Logout
      
      if (user) {
        // User is logged in (from cache or live)
        setUser(user);
      } else {
        // User is not logged in
        setUser(null);
      }

      // --- THIS IS THE FIX ---
      // We only set loading to false *after* this first check
      // has completed.
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty array ensures this only runs once on mount

  return { user, loading };
};