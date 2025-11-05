import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useSessionStore } from '@/store/timerStore'; // We need this to reset the store on success

// This is the data type we'll save to Firestore
interface SessionData {
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

// The async function that does the server work
const createSessionOnFirebase = async (sessionData: Omit<SessionData, 'userId'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');

  const dataToSave: SessionData = {
    ...sessionData,
    userId: user.uid,
  };

  const docRef = await addDoc(collection(db, 'sessions'), dataToSave);
  return docRef.id;
};

// The custom hook that our component will use
export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const endSessionOnClient = useSessionStore((state) => state.endSession);

  return useMutation({
    mutationFn: createSessionOnFirebase,
    
    // This is the magic!
    onSuccess: () => {
      console.log('Session saved to Firebase!');
      
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