// olf v2 useTimerMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useSessionStore, SessionInfo } from '@/store/sessionStore';
import { nanoid } from 'nanoid';
// We also need our v0 adapter logic
import { adaptSessionsForAnalytics } from '@/lib/adapter'; // Assuming this function exists

// Helper
const getRefs = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user authenticated");
  const activeSessionRef = doc(db, 'active_sessions', user.uid);
  return { user, activeSessionRef };
};

// --- START SESSION ---
export const useStartSessionMutation = () => {
  const startSessionClient = useSessionStore((state) => state.startSession);
  
  return useMutation({
    mutationFn: async (info: SessionInfo) => {
      const { activeSessionRef } = getRefs();
      const startTime = new Date().toISOString();
      const newState = { ...info, isActive: true, onBreak: false, breaks: [], sessionStartTime: startTime };
      
      // 1. Optimistic UI update
      startSessionClient(info, startTime); 
      // 2. Server write (will retry on failure)
      await setDoc(activeSessionRef, newState);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      console.error("Start session failed:", error);
      // We'd add rollback logic here
    },
  });
};

// --- TOGGLE BREAK ---
export const useToggleBreakMutation = () => {
  const toggleBreakClient = useSessionStore((state) => state.toggleBreak);
  const currentState = useSessionStore.getState();

  return useMutation({
    mutationFn: async () => {
      const { activeSessionRef } = getRefs();
      const { onBreak, breaks } = currentState;
      const now = new Date().toISOString();
      
      // 1. Optimistic UI update
      toggleBreakClient(now);

      // 2. Server write (will retry on failure)
      if (onBreak) {
        // Ending a break (client state is now OFF break)
        const lastBreak = breaks[breaks.length - 1];
        if (lastBreak && !lastBreak.end) lastBreak.end = now;
        await updateDoc(activeSessionRef, { onBreak: false, breaks: [...breaks] });
      } else {
        // Starting a break (client state is now ON break)
        await updateDoc(activeSessionRef, { onBreak: true, breaks: [...breaks, { start: now }] });
      }
    },
  });
};

// --- END SESSION ---
// This is the big one. It's a TanStack mutation that:
// 1. Deletes the active session
// 2. Creates the finished session
export const useEndSessionMutation = () => {
  const endSessionClient = useSessionStore((state) => state.endSession);
  const queryClient = useQueryClient();

  // This mutation needs the final calculated times from PersistentTimer
  return useMutation({
    mutationFn: async (data: {
      finalSessionData: any; // The v0-formatted session
      activeSessionState: any; // The state from the store
    }) => {
      const { user, activeSessionRef } = getRefs();
      
      // 1. Optimistic UI update
      endSessionClient();

      // 2. Server write (ATOMIC BATCH)
      const batch = writeBatch(db);
      
      // 2a. Delete the active session
      batch.delete(activeSessionRef);
      
      // 2b. Create the new finished session
      const newSessionRef = doc(collection(db, 'sessions'));
      batch.set(newSessionRef, data.finalSessionData);
      
      await batch.commit();
    },
    onSuccess: () => {
      // Invalidate the finished sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
};