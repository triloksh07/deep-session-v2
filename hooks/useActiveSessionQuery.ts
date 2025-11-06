import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

// This is the data structure in '/active_sessions/{userId}'
export interface ActiveSession {
  title: string;
  type: string;
  notes: string;
  sessionStartTime: string; // ISO string
  onBreak: boolean;
  breaks: { start: string; end?: string }[];
  isActive: boolean;
}

export const useActiveSessionQuery = () => {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const user = auth.currentUser;
  
  useEffect(() => {
    const userId = user?.uid;
    if (!userId) {
      setSession(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'active_sessions', userId);
    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSession(docSnap.data() as ActiveSession);
        } else {
          setSession(null); // No active session
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error("Error in useActiveSessionQuery:", err);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user]); // Re-run when user changes

  return { data: session, isLoading: loading, isError: !!error, error };
};