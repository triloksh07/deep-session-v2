// ----------------- app/store/sessionStore.ts -----------------

import { create } from 'zustand';
import { createFinalSessionObject } from './sessionUtils';
import { DEFAULT_SESSION_STATE } from './constants';
import type { Break, BreaksArray, Session } from "@/types/typeDeclaration";
import { isSession } from '@/types/typeDeclaration'; // 👈 Import the type guard
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config'; // 👈 Import defaults
import { db, auth } from '@/lib/firebase';
// [MODIFIED] Import new firestore functions
import { collection, addDoc, getDocs, query, orderBy, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { IconKey } from '@/config/sessionTypes.config';
import { persist } from 'zustand/middleware';

// --- Shape of Session TYPEs  ---
export interface SessionType {
  id: string;
  label: string;
  icon: IconKey;
  color: string;
}

// Define the shape of our state and actions
export interface SessionState {
  // Data State
  recentSessions: Session[];
  customSessionTypes: SessionType[];
  selectedSessionType: string | null;
  isLoading: boolean; // To show loading spinners in the UI
  error: string | null; // To handle errors in loading sessions
  currentSessionDetails: {
    title: string;
    notes: string;
    sessionTypeId: string | null;
  };

  // Active Session State
  sessionActive: boolean;
  onBreak: boolean;
  sessionStartTime: Date | null;
  breaks: {
    start: Date;
    end: Date | null;
  }[]; // Array of breaks with start and end times

  // Actions
  startSession: () => void;
  toggleBreak: () => void;
  stopSession: (sessionTimeMs: number, breakTimeMs: number) => Promise<void>;
  resetSession: () => void;
  updateCurrentDetails: (details: Partial<SessionState['currentSessionDetails']>) => void;
  // loadSessionsFromStorage: () => void;
  loadInitialData: () => Promise<void>; // Replaces old loading functions

  // --- SESSION TYPE ACTIONS ---
  // loadSessionTypes: () => void;
  addSessionType: (newType: Omit<SessionType, 'id'>) => void;
  deleteSessionType: (typeId: string) => void;
  setSelectedSessionType: (typeId: string) => void;

  // --- NEW ACTIONS FOR SESSION CRUD ---
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, newTitle: string) => Promise<void>;
}

// NOTE: We are removing `persist` middleware. Firestore is now our persistence layer.
// NOTE: If you want to re-add persistence for non-user-specific data, consider using `persist` with a different key.
export const useSessionStore = create<SessionState>()(
  persist((set, get) => ({
    // --- INITIAL STATE ---
    ...DEFAULT_SESSION_STATE,
    customSessionTypes: [], // Start with an empty array for custom session types
    isLoading: true, // To manage loading state in the UI
    error: null, // Initialize error state as null

    // --- ACTIONS ---

    startSession: () => {
      // Ensure we don't start a session if one is already active
      if (get().sessionActive) return;

      set({
        sessionActive: true,
        onBreak: false,
        sessionStartTime: new Date(), // Critical for rehydration
        breaks: [], // Reset breaks for the new session
      });

      // NEW: Send a message to the serviceWorker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          command: 'start',
          startTime: Date.now(), // Send the start time as a simple timestamp
          sessionDetails: get().currentSessionDetails // Send any other relevant details
        });
      }

    },

    toggleBreak: () => {
      const { sessionActive, onBreak, breaks } = get();
      if (!sessionActive) return; // Can't take a break if no session is active

      if (onBreak) {
        // Resuming from a break
        const updatedBreaks = [...breaks];
        const lastBreak = updatedBreaks[updatedBreaks.length - 1];
        if (lastBreak && !lastBreak.end) {
          lastBreak.end = new Date();
        }
        set({ onBreak: false, breaks: updatedBreaks });
      } else {
        // Starting a new break
        set((state) => ({
          onBreak: true,
          breaks: [...state.breaks, { start: new Date(), end: null }],
        }));
      }
    },
    // FIX: Made async and now saves breaks within the session document
    // [MODIFIED] stopSession to use Firestore ID
    stopSession: async (sessionTimeMs, breakTimeMs) => {
      const { sessionStartTime, currentSessionDetails, breaks } = get();

      // 1. More robust check for the current user
      if (!auth.currentUser) {
        console.error("STOP SESSION ABORTED: auth.currentUser is null. The user is not authenticated.");
        set({ error: "Cannot save session. You are not logged in." });
        return;
      }
      if (!sessionStartTime) {
        console.error("STOP SESSION ABORTED: Session start time is missing.");
        return;
      }

      // FIX: Ensure sessionStartTime is a valid Date object before proceeding
      const validStartTime = typeof sessionStartTime === 'string'
        ? new Date(sessionStartTime)
        : sessionStartTime;

      if (!validStartTime || isNaN(validStartTime.getTime())) {
        console.error("STOP SESSION ABORTED: Invalid start time after rehydration.");
        // Optional: Clean up here if needed
        get().resetSession();
        return;
      }
      // --- NEW LOGIC TO SAVE TO FIRESTORE ---
      // We create the session object here, including breaks
      // and send it to Firestore in one go.
      // This ensures data integrity and reduces the number of writes.

      // Create the final session object
      // [MODIFIED] This payload no longer contains a client-side ID.
      const { sessionPayload, breaksPayload } = createFinalSessionObject({
        details: currentSessionDetails,
        startTime: validStartTime,
        sessionTimeMs,
        breakTimeMs,
        breaks,
      });

      // Combine breaks into the main session payload for a single DB write
      const finalPayload = {
        ...sessionPayload,
        breaks: breaksPayload,
        // IMPORTANT: This should come from your auth state, not localStorage
        // It ensures the document is tagged with the current user's ID.
        // FIX #2: Corrected the typo from 'user_Id' to 'userId'
        userId: auth.currentUser.uid,
      };

      // 2. Add detailed debugging logs
      console.log("--- Preparing to Save Session ---");
      console.log("User Auth UID:", auth.currentUser.uid);
      console.log("Payload to be sent:", { finalPayload });
      console.log("---------------------------------");

      // --- NEW: SAVE TO FIRESTORE ---
      try {
        set({ error: null });
        // [MODIFIED] addDoc will generate a unique ID
        const docRef = await addDoc(collection(db, "sessions"), finalPayload);
        console.log("Session saved to Firestore with ID: ", docRef.id);
        // Add the new session to the top of the local state for instant UI update
        // set(state => ({
        //   recentSessions: [finalPayload as Session, ...state.recentSessions]
        // }));
        // --- REPLACEMENT FOR 'as Session' ---
        // Use the type guard to validate the payload before adding it to the state.

        // [MODIFIED] Create the object for local state *with* the new Firestore ID
        const newSessionForState = {
          ...finalPayload,
          id: docRef.id, // This is the crucial change
        };

        if (isSession(newSessionForState)) {
          // If the validation passes, TypeScript now KNOWS finalPayload is a Session.
          // No need for 'as Session'.
          set(state => ({
            recentSessions: [newSessionForState, ...state.recentSessions]
          }));
        } else {
          // If validation fails, log a detailed error and do not update the local state.
          // This prevents corrupt data from entering our app's UI.
          console.error("Validation Error: The created payload does not conform to the Session type. Local state will not be updated.");
          // Optionally, you could set an error state for the UI to display.
          set({ error: "Failed to validate the saved session data." });
        }
        // --- END OF REPLACEMENT ---
      } catch (e) {
        console.error("Error adding document - FIRESTORE WRITE FAILED: ", e);
        set({ error: "Failed to save the session. Please check your connection and try again." });
        // We could add error handling state here for the UI
      }
      // --- END OF NEW LOGIC ---

      // console.log("Ready to save to DB:", { finalPayload });

      // Reset all active session state
      set(() => ({
        // recentSessions: [...state.recentSessions],
        sessionActive: false,
        onBreak: false,
        sessionStartTime: null,
        breaks: [],
        currentSessionDetails: DEFAULT_SESSION_STATE.currentSessionDetails,
      }));

      // Stop the service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ command: 'stop' });
      }
    },

    resetSession: () => {
      if (window.confirm("Are you sure you want to reset the current session?")) {
        set({
          sessionActive: false,
          onBreak: false,
          sessionStartTime: null,
          breaks: [],
          currentSessionDetails: DEFAULT_SESSION_STATE.currentSessionDetails,
        });
      }
    },

    updateCurrentDetails: (details) => {
      console.log('Updating session details:', details);
      set((state) => ({
        currentSessionDetails: { ...state.currentSessionDetails, ...details },
      }));
    },


    // --- IMPROVEMENT: A single function to load all initial data ---
    // [MODIFIED] loadInitialData to fetch the Firestore doc ID
    loadInitialData: async () => {
      if (!auth.currentUser) {
        // Don't try to load data if the user isn't logged in yet.
        // The AuthProvider will trigger a re-render once login is complete.
        set({ isLoading: false });
        return;
      }
      set({ isLoading: true, error: null });
      try {
        // For now, we use default session types. You could also load these from Firestore.
        const sessionTypes = DEFAULT_SESSION_TYPES;

        // Fetch sessions from Firestore
        const sessionsQuery = query(
          collection(db, "sessions"),
          //Only load sessions for the current user
          where("userId", "==", auth.currentUser.uid),  // Corrected auth check
          orderBy("started_at", "desc") // Get the most recent sessions first
        );
        const querySnapshot = await getDocs(sessionsQuery);

        // [MODIFIED] Map doc.id to the session.id property
        const sessions = querySnapshot.docs.map(doc => ({
          ...(doc.data() as Omit<Session, 'id'>),
          id: doc.id, // This is the crucial change
        }) as Session);

        set({
          customSessionTypes: sessionTypes,
          recentSessions: sessions,
          isLoading: false,
        });

      } catch (error) {
        console.error("Failed to load initial data from Firestore:", error);
        set({ isLoading: false, error: "Could not load your session history." });
      }
    },
    // --- SESSION TYPE ACTIONS ---
    addSessionType: (newTypeData) => {
      const newType: SessionType = {
        ...newTypeData,
        id: `${newTypeData.label.toLowerCase()}-${Date.now()}`, // Create a unique ID
      };
      set((state) => ({
        customSessionTypes: [...state.customSessionTypes, newType],
      }));
    },

    deleteSessionType: (typeId) => {
      set((state) => ({
        customSessionTypes: state.customSessionTypes.filter(
          (type) => type.id !== typeId
        ),
      }));
    },

    setSelectedSessionType: (typeId) => {
      // This is the key action to link a type to a session
      set((state) => ({
        selectedSessionType: typeId,
        currentSessionDetails: {
          ...state.currentSessionDetails,
          sessionTypeId: typeId,
        },
      }));
    },

    // --- NEW SESSION CRUD FUNCTIONS ---

    deleteSession: async (sessionId: string) => {
      if (!auth.currentUser) {
        console.error("User not authenticated");
        set({ error: "You must be logged in to delete sessions." });
        return;
      }

      // 1. Optimistic UI update: remove from local state immediately
      const originalSessions = get().recentSessions;
      set(state => ({
        recentSessions: state.recentSessions.filter(s => s.id !== sessionId),
        error: null
      }));

      // 2. Perform database operation
      try {
        const docRef = doc(db, "sessions", sessionId);
        await deleteDoc(docRef);
        console.log(`Session ${sessionId} deleted from Firestore.`);
      } catch (e) {
        console.error("Error deleting session:", e);
        // 3. Revert on error
        set({ error: "Failed to delete session.", recentSessions: originalSessions });
      }
    },

    updateSessionTitle: async (sessionId: string, newTitle: string) => {
      if (!auth.currentUser) {
        set({ error: "User not authenticated." });
        return;
      }

      // 1. Optimistic UI update
      const originalSessions = get().recentSessions;
      const newSessions = originalSessions.map(s =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      );
      set({ recentSessions: newSessions, error: null });

      // 2. Perform database operation
      try {
        const docRef = doc(db, "sessions", sessionId);
        await updateDoc(docRef, {
          title: newTitle
        });
        console.log(`Session ${sessionId} title updated in Firestore.`);
      } catch (e) {
        console.error("Error updating session:", e);
        // 3. Revert on error
        set({ error: "Failed to update title.", recentSessions: originalSessions });
      }
    },

  }),
    {
      // 👇 3. Configure the middleware
      name: 'deep-session-v0-timer-storage', // The key used in localStorage

      // 👇 4. Use `partialize` to select ONLY what needs to be saved
      // This prevents saving unnecessary data like `isLoading` or `recentSessions`.
      partialize: (state) => ({
        sessionActive: state.sessionActive,
        onBreak: state.onBreak,
        sessionStartTime: state.sessionStartTime,
        breaks: state.breaks,
        currentSessionDetails: state.currentSessionDetails,
      }),
    })
);