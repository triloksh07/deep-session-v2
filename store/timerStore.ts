import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Describes a single break
export interface Break {
  start: string; // ISO string
  end?: string; // ISO string (undefined if break is active)
}

// The raw data needed to define a session
interface SessionState {
  title: string;
  type: string;
  notes: string;
  sessionStartTime: string | null; // ISO string
  onBreak: boolean;
  breaks: Break[];
  isActive: boolean; // Is a session running at all? (running or on break)

  // Actions
  startSession: (info: { title: string; type: string; notes: string }) => void;
  toggleBreak: () => void;
  endSession: () => void;
  // This store does NOT know about elapsed time.
  // That is the job of PersistentTimer.ts
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      title: '',
      type: '',
      notes: '',
      sessionStartTime: null,
      onBreak: false,
      breaks: [],
      isActive: false,

      // --- ACTIONS ---
      startSession: (info) => {
        set({
          ...info,
          isActive: true,
          onBreak: false,
          breaks: [],
          sessionStartTime: new Date().toISOString(),
        });
      },

      toggleBreak: () => {
        const { isActive, onBreak, breaks } = get();
        if (!isActive) return; // Can't toggle if no session

        const now = new Date().toISOString();

        if (onBreak) {
          // We are ending a break
          const lastBreak = breaks[breaks.length - 1];
          if (lastBreak && !lastBreak.end) {
            lastBreak.end = now;
          }
          set({ onBreak: false, breaks: [...breaks] });
        } else {
          // We are starting a break
          set({
            onBreak: true,
            breaks: [...breaks, { start: now }],
          });
        }
      },

      endSession: () => {
        // Reset the state to default
        set({
          title: '',
          type: '',
          notes: '',
          sessionStartTime: null,
          onBreak: false,
          breaks: [],
          isActive: false,
        });
      },
    }),
    {
      // --- PERSISTENCE CONFIG ---
      name: 'deepsession-v2-storage',
      storage: createJSONStorage(() => localStorage),
      // We only persist the data, not the functions
      partialize: (state) => ({
        title: state.title,
        type: state.type,
        notes: state.notes,
        sessionStartTime: state.sessionStartTime,
        onBreak: state.onBreak,
        breaks: state.breaks,
        isActive: state.isActive,
      }),
    }
  )
);