import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, collection, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useSessionStore, SessionInfo, type TimerState } from '@/store/sessionStore';
import { nanoid } from 'nanoid';
import { Session } from '@/types'; // This is our v2 UI type

// Helper to get the current user and doc ref
const getRefs = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user authenticated");
  // This is the doc for the *live* session
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

      // --- THIS IS THE FULL, CORRECT STATE ---
      // Create a plain data object for Firestore.
      // This object does NOT include any functions.
      const dataToSave = {
        ...info,
        isActive: true,
        onBreak: false,
        breaks: [],
        sessionStartTime: startTime
      };

      // 1. Optimistic UI update (updates Zustand immediately)
      startSessionClient(info, startTime);

      // 2. Server write (offline-capable)
      // We must strip the functions before saving to Firestore
      await setDoc(activeSessionRef, dataToSave);
    },
    onError: (error) => {
      console.error("Start session failed:", error);
      // Here you would add a toast notification
      // We'd also need to add logic to rollback the client state
    },
  });
};

// --- TOGGLE BREAK ---
export const useToggleBreakMutation = () => {
  const toggleBreakClient = useSessionStore((state) => state.toggleBreak);
  // Get a non-reactive snapshot of the current state
  const currentState = useSessionStore.getState();

  return useMutation({
    mutationFn: async () => {
      const { activeSessionRef } = getRefs();
      const { onBreak, breaks } = currentState;
      const now = new Date().toISOString();

      // 1. Optimistic UI update
      toggleBreakClient(now);

      // 2. Server write (offline-capable)
      if (onBreak) {
        // We are ending a break
        const lastBreak = breaks[breaks.length - 1];
        if (lastBreak && !lastBreak.end) lastBreak.end = now;
        await updateDoc(activeSessionRef, { onBreak: false, breaks: [...breaks] });
      } else {
        // We are starting a break
        await updateDoc(activeSessionRef, { onBreak: true, breaks: [...breaks, { start: now }] });
      }
    },
    onError: (error) => {
      console.error("Toggle break failed:", error);
      // Add toast notification
    },
  });
};

// --- END SESSION ---
// This mutation does two things:
// 1. Creates the *final* session document in 'sessions'
// 2. Deletes the *active* session document in 'active_sessions'
export const useEndSessionMutation = () => {
  const endSessionClient = useSessionStore((state) => state.endSession);
  const queryClient = useQueryClient();

  return useMutation({
    // We expect the final, v0-formatted data object from the component
    mutationFn: async (finalV0Data: any) => {
      const { user, activeSessionRef } = getRefs();

      // 1. Optimistic UI update
      endSessionClient();

      // 2. Server write (ATOMIC BATCH)
      const batch = writeBatch(db);

      // 2a. Create the new finished session in the 'sessions' collection
      // We use doc(collection(...)) to generate a new ID locally
      const newSessionRef = doc(collection(db, 'sessions'));
      batch.set(newSessionRef, finalV0Data);

      // 2b. Delete the 'active_sessions' doc
      batch.delete(activeSessionRef);

      // This batch will work offline and sync automatically
      await batch.commit();
    },
    onSuccess: () => {
      console.log('Session saved and active session cleared.');
      // 3. Invalidate our 'sessions' query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      // Add toast notification: "Session saved!"
    },
    onError: (error) => {
      console.error("End session failed:", error);
      // Add toast notification: "Error saving session"
    }
  });
};