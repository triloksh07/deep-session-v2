import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types'; // Our v2 UI type
import { nanoid } from 'nanoid'; // Let's use nanoid like v0

// This is the data type we'll save to Firestore

// --- 1. THIS IS THE FIX ---
// This interface now matches the 'finalV0Data' object
// that SessionTracker.tsx will create.
interface FinalV0DataInput {
  id: string;
  userId: string;
  title: string;
  session_type_id: string;
  notes: string;
  breaks: any[]; // Or be more specific: Break[]
  started_at: string;
  ended_at: string;
  total_focus_ms: number;
  total_break_ms: number;
}

// The async function that does the server work
const createSessionOnFirebase = async (sessionData: FinalV0DataInput) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');
  const dataToSave = {
    id: nanoid(), // Use nanoid for a string ID, just like v0
    userId: user.uid,
    title: sessionData.title,
    type: sessionData.session_type_id,
    notes: sessionData.notes,
    breaks: sessionData.breaks,

    // Convert numbers/strings back to Firestore Timestamps
    started_at: sessionData.started_at,
    ended_at: sessionData.ended_at,

    // Use the v0 field names
    duration: sessionData.total_focus_ms,
    break_duration: sessionData.total_break_ms,
  };

  const docRef = await addDoc(collection(db, 'sessions'), dataToSave);
  return docRef.id;
};

// The custom hook that our component will use
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSessionOnFirebase,

    onSuccess: () => {
      console.log('Session saved to Firebase "sessions" collection.');
      // 1. Tell TanStack Query to refetch the session list
      // This will automatically update <SessionLog />
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error) => {
      // Handle the error (e.g., show a toast notification)
      console.error('Failed to save session (will retry):', error);
      // We don't reset the store here, so the user can try again
    },
  });
};