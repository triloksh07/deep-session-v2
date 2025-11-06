import { create } from 'zustand';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface Break { start: string; end?: string; }
export interface SessionInfo { title: string; type: string; notes: string; }

// --- 1. RENAME SessionState to TimerState for clarity ---
interface TimerState {
  title: string;
  type: string;
  notes: string;
  sessionStartTime: string | null;
  onBreak: boolean;
  breaks: Break[];
  isActive: boolean;

  startSession: (info: SessionInfo, startTime: string) => void;
  toggleBreak: (time: string) => void;
  endSession: () => void;
  _syncState: (newState: Partial<TimerState>) => void; // For the sync hook
}

export const useSessionStore = create<TimerState>()(
  (set, get) => ({
    // --- INITIAL STATE ---
    title: '', type: '', notes: '',
    sessionStartTime: null, onBreak: false, breaks: [], isActive: false,

    // --- CLIENT-SIDE ACTIONS ---
    startSession: (info, startTime) => {
      // --- 2. MERGE, DON'T REPLACE ---
      set((state) => ({
        ...state,
        ...info,
        isActive: true,
        onBreak: false,
        breaks: [],
        sessionStartTime: startTime
      }));
    },
    toggleBreak: (time) => {
      const { onBreak, breaks } = get();
      if (onBreak) {
        const lastBreak = breaks[breaks.length - 1];
        if (lastBreak && !lastBreak.end) lastBreak.end = time;
        set({ onBreak: false, breaks: [...breaks] });
      } else {
        set({ onBreak: true, breaks: [...breaks, { start: time }] });
      }
    },
    endSession: () => {
      set({
        isActive: false,
        sessionStartTime: null,
        onBreak: false,
        breaks: [],
        title: '',
        type: '',
        notes: ''
      });
    },
    // --- 3. THIS IS THE MOST IMPORTANT FIX ---
    // This is called by our real-time hook
    _syncState: (newState) => {
      // MERGE the new state from Firestore, don't replace the whole object
      set((state) => ({ ...state, ...newState }));
    },
  })
);