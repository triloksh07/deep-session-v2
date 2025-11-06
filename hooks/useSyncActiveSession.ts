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

    const docRef = doc(db, 'active_sessions', userId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        syncState(docSnap.data());
      } else {
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

    return () => unsubscribe();
    
  }, [user, syncState]); // 3. Depend on the user object
};