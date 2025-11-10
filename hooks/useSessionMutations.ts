import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types';
import { toast } from 'sonner';

// --- Types ---
// Data needed to update a session
type UpdateSessionInput = {
    id: string; // The doc ID
    updates: Partial<Session>; // The fields to change
};

// --- Query Client ---
const useSessionQueryClient = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['sessions'] });
};


// --- Create ---
// user function that creates a session in Firebase
// useCreateSession.ts a separate file

// --- Update ---
const updateSessionOnFirebase = async ({ id, updates }: UpdateSessionInput) => {
    if (!id) throw new Error('No session ID provided');
    const sessionRef = doc(db, 'sessions', id);
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
            invalidateSessions(); // Refetch Sessions list
        },
        onError: (error) => {
            toast.error('Failed to update session', { description: error.message });
            console.error('Failed to update session:', error);
        },
    });
};

// --- Delete ---
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
            invalidateSessions(); // Refetch Sessions list
        },
        onError: (error) => {
            toast.error('Failed to delete session', { description: error.message });
            console.error('Failed to delete Session:', error);
        },
    });
};