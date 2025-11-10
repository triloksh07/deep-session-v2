import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Removed 'auth'
import { useSessionStore } from '@/store/sessionStore';
import { User } from 'firebase/auth'; // Import User type

// 1. Accept the User object
export const useSyncActiveSession = (user: User | null) => {
  const syncState = useSessionStore((state) => state._syncState);

  useEffect(() => {
    // 2. Get uid from the object
    const userId = user?.uid;

    if (!userId) {
      syncState({
        isActive: false,
        sessionStartTime: null,
        onBreak: false,
        breaks: [],
        title: '',
        type: '',
        notes: ''
      });
      return;
    }

    // This doc path ('active_sessions/{userId}') is the key
    const docRef = doc(db, 'active_sessions', userId);

    // This listens to both server changes (cross-sync)
    // AND local offline cache changes.
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        syncState(docSnap.data());
      } else {
        // Doc was deleted (session ended), reset the store
        syncState({
          isActive: false,
          sessionStartTime: null,
          onBreak: false,
          breaks: [],
          title: '',
          type: '',
          notes: ''
        });
      }
    });

    return () => unsubscribe(); // Cleanup

  }, [user, syncState]); // 3. Depend on the user object
};