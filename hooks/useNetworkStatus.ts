// hooks/useNetworkStatus.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const OFFLINE_TOAST_ID = 'network-status-toast';

export const useNetworkStatus = () => {
  // We use state just to hold the value, but the toast is the main goal
  const [isOnline, setIsOnline] = useState(true);

  // Use useCallback to ensure functions are stable
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    // Show a persistent error toast
    toast.error('You are offline', {
      id: OFFLINE_TOAST_ID,
      duration: Infinity, // Stays until dismissed or network returns
    });
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    // Show a success toast that replaces the offline one
    toast.success('You are back online!', {
      id: OFFLINE_TOAST_ID,
      duration: 3000,
    });
  }, []);

  useEffect(() => {
    // 1. Check initial status on mount
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        handleOffline();
      }
    }

    // 2. Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]); // Run only once

  return isOnline;
};