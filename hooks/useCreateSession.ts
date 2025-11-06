import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useSessionStore } from '@/store/timerStore'; // We need this to reset the store on success
import { Session } from '@/types'; // Our v2 UI type
import { nanoid } from 'nanoid'; // Let's use nanoid like v0

// This is the data type we'll save to Firestore
interface SessionData {
  id: number;
  userId: string;
  title: string;
  type: string;
  notes: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  sessionTime: number; // Final milliseconds
  breakTime: number; // Final milliseconds
  breaks: any[]; // The array of break objects
  date: string; // YYYY-MM-DD
}

// The data we pass to this function from the UI
interface CreateSessionInput {
  title: string;
  type: string;
  notes: string;
  startTime: string; // ISO string from store
  endTime: string; // ISO string from component
  sessionTime: number; // ms
  breakTime: number; // ms
  breaks: any[];
  date: string;
}

// The async function that does the server work
const createSessionOnFirebase = async (sessionData: CreateSessionInput) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');

  // --- 2. THIS IS THE ADAPTER ---
  // Convert our v2 UI data into the v0 Firebase data model
  // const dataToSave: SessionData = {
  //   ...sessionData,
  //   id: Date.now(), // Simple unique ID based on timestamp // (matches old app/page.tsx logic)
  //   userId: user.uid,
  // };
  const dataToSave = {
    id: nanoid(), // Use nanoid for a string ID, just like v0
    userId: user.uid,
    title: sessionData.title,
    type: sessionData.type,
    notes: sessionData.notes,
    breaks: sessionData.breaks,

    // Convert numbers/strings back to Firestore Timestamps
    started_at: sessionData.startTime,
    ended_at: sessionData.endTime,

    // Use the v0 field names
    duration: sessionData.sessionTime,
    break_duration: sessionData.breakTime,
  };

  const docRef = await addDoc(collection(db, 'sessions'), dataToSave);
  return docRef.id;
};

// The custom hook that our component will use
export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const endSessionOnClient = useSessionStore((state) => state.endSession);

  return useMutation({
    // mutationFn: createSessionOnFirebase,
    mutationFn: (sessionData: CreateSessionInput) => createSessionOnFirebase(sessionData), // 3. Adjust type

    // This is the magic!
    onSuccess: () => {
      console.log('Session saved to Firebase (v0 format)!');

      // 1. Tell TanStack Query to refetch the session list
      // This will automatically update <SessionLog />
      queryClient.invalidateQueries({ queryKey: ['sessions'] });

      // 2. Reset the client-side timer store
      endSessionOnClient();
    },
    onError: (error) => {
      // Handle the error (e.g., show a toast notification)
      console.error('Failed to save session:', error);
      // We don't reset the store here, so the user can try again
    },
  });
};