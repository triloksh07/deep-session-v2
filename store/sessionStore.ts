import { create } from 'zustand';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface Break { start: string; end?: string; }
export interface SessionInfo { title: string; type: string; notes: string; }

interface TimerState {
  title: string;
  type: string;
  notes: string;
  sessionStartTime: string | null;
  onBreak: boolean;
  breaks: Break[];
  isActive: boolean;
  
  // --- 1. Actions are now async and will talk to Firestore ---
  startSession: (info: SessionInfo) => Promise<void>;
  toggleBreak: () => Promise<void>;
  clearActiveSession: () => Promise<void>; // Replaces endSession
  _syncState: (newState: Partial<TimerState>) => void;
}

export const useSessionStore = create<TimerState>()(
    (set, get) => ({
      // --- INITIAL STATE ---
      title: '', type: '', notes: '',
      sessionStartTime: null, onBreak: false, breaks: [], isActive: false,

      // --- 2. This is the "listener" action ---
      _syncState: (newState) => {
        set((state) => ({ ...state, ...newState }));
      },

      // --- 3. NEW ASYNC ACTIONS (Offline-First) ---
      startSession: async (info) => {
        const user = auth.currentUser;
        if (!user) return; // Fail silently if no user

        const startTime = new Date().toISOString();
        const newState = { 
          ...info, 
          isActive: true, 
          onBreak: false, 
          breaks: [], 
          sessionStartTime: startTime 
        };

        try {
          // This will write to the local cache *immediately* (even offline)
          const activeSessionRef = doc(db, 'active_sessions', user.uid);
          await setDoc(activeSessionRef, newState);
          // Our `useSyncActiveSession` hook will hear this and update the store
        } catch (error) {
          console.error("Error starting session:", error);
          // Add a toast notification here
        }
      },

      toggleBreak: async () => {
        const user = auth.currentUser;
        if (!user) return;

        const { isActive, onBreak, breaks } = get();
        if (!isActive) return;

        const now = new Date().toISOString();
        const activeSessionRef = doc(db, 'active_sessions', user.uid);

        try {
          if (onBreak) {
            // Ending a break
            const lastBreak = breaks[breaks.length - 1];
            if (lastBreak && !lastBreak.end) lastBreak.end = now;
            await updateDoc(activeSessionRef, { onBreak: false, breaks: [...breaks] });
          } else {
            // Starting a break
            await updateDoc(activeSessionRef, { onBreak: true, breaks: [...breaks, { start: now }] });
          }
          // The listener will update the store
        } catch (error) {
          console.error("Error toggling break:", error);
        }
      },

      // This just deletes the active doc.
      // Saving the *final* session is a separate step.
      clearActiveSession: async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
          const activeSessionRef = doc(db, 'active_sessions', user.uid);
          await deleteDoc(activeSessionRef);
          // The listener will see this deletion and set isActive: false
        } catch (error) {
          console.error("Error clearing active session:", error);
        }
      },
    })
);