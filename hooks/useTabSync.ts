// lib/hooks/useTabSync.ts

import { useEffect } from 'react';
import { useSessionStore } from '@/store/oldMainSessionStore';

const STORAGE_KEY = 'deep-session-v0-timer-storage'; // Must match the name in your persist config

export function useTabSync() {
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        console.log('Storage changed in another tab. Syncing state...');
        // This tells Zustand to re-read its state from the updated localStorage
        useSessionStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
}