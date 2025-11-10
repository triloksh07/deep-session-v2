// hooks/useSessionMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types'; // Your v2 Session type
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

// --- Types ---
// This is the v0 shape from your useCreateSession hook
interface FinalV0DataInput {
  id: string;
  userId: string;
  title: string;
  session_type_id: string;
  notes: string;
  breaks: any[];
  started_at: string;
  ended_at: string;
  total_focus_ms: number;
  total_break_ms: number;
}
// Data needed to update a session
type UpdateSessionInput = {
  id: string; // The doc ID
  updates: Partial<Session>; // The fields to change
};

// --- Query Client Helper ---
const useSessionQueryClient = () => {
  const queryClient = useQueryClient();
  // We only invalidate ['sessions']
  return () => queryClient.invalidateQueries({ queryKey: ['sessions'] });
};

// --- Create ---
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

export const useCreateSession = () => {
  const invalidateSessions = useSessionQueryClient();
  return useMutation({
    mutationFn: createSessionOnFirebase,
    onSuccess: () => {
      toast.success('Session saved');
      invalidateSessions();
    },
    onError: (error: Error) => {
      toast.error('Failed to save session', { description: error.message });
    },
  });
};

// --- Update (NEW) ---
const updateSessionOnFirebase = async ({ id, updates }: UpdateSessionInput) => {
  if (!id) throw new Error('No session ID provided');
  // Note: Your v0 sessions are in 'sessions' collection
  const sessionRef = doc(db, 'sessions', id);
  // We must adapt v2 'Session' fields back to v0 Firestore fields
  // e.g., 'sessionTime' -> 'total_focus_ms'
  const adaptedUpdates = {
    ...updates,
    ...(updates.title && { title: updates.title }),
    ...(updates.notes && { notes: updates.notes }),
  };
  await updateDoc(sessionRef, adaptedUpdates);
};

export const useUpdateSession = () => {
  const invalidateSessions = useSessionQueryClient();
  return useMutation({
    mutationFn: updateSessionOnFirebase,
    onSuccess: () => {
      toast.success('Session updated');
      invalidateSessions();
    },
    onError: (error: Error) => {
      toast.error('Failed to update session', { description: error.message });
    },
  });
};

// --- Delete (NEW) ---
const deleteSessionOnFirebase = async (id: string) => {
  if (!id) throw new Error('No session ID provided');
  const sessionRef = doc(db, 'sessions', id);
  await deleteDoc(sessionRef);
};

export const useDeleteSession = () => {
  const invalidateSessions = useSessionQueryClient();
  return useMutation({
    mutationFn: deleteSessionOnFirebase,
    onSuccess: () => {
      toast.success('Session deleted');
      invalidateSessions();
    },
    onError: (error: Error) => {
      toast.error('Failed to delete session', { description: error.message });
    },
  });
};