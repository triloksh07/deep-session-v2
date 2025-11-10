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
import { Goal } from '@/types';
import { toast } from 'sonner';

// --- Types ---
// Data needed to create a goal (omit server-managed fields)
type CreateGoalInput = Omit<Goal, 'id' | 'userId' | 'createdAt'>;
// Data needed to update a goal
type UpdateGoalInput = {
    id: string; // The doc ID
    updates: Partial<Goal>; // The fields to change
};

// --- Query Client ---
const useGoalQueryClient = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['goals'] });
};

// --- Create ---
const createGoalOnFirebase = async (newGoal: CreateGoalInput) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const goalToSave = {
        ...newGoal,
        userId: user.uid,
        createdAt: new Date().toISOString(), // Use client-side ISO string
    };

    const docRef = await addDoc(collection(db, 'goals'), goalToSave);
    return docRef.id;
};

export const useCreateGoal = () => {
    const invalidateGoals = useGoalQueryClient();
    return useMutation({
        mutationFn: createGoalOnFirebase,
        onSuccess: () => {
            toast.success('Goal created successfully!');
            invalidateGoals(); // Refetch goals list
        },
        onError: (error) => {
            toast.error('Failed to create goal', {
                description: error.message || 'Please try again.',
            });
            console.error('Failed to create goal:', error);
            // You can add a toast notification here
        },
    });
};

// --- Update ---
const updateGoalOnFirebase = async ({ id, updates }: UpdateGoalInput) => {
    if (!id) throw new Error('No goal ID provided');
    const goalRef = doc(db, 'goals', id);
    await updateDoc(goalRef, updates);
};

export const useUpdateGoal = () => {
    const invalidateGoals = useGoalQueryClient();
    return useMutation({
        mutationFn: updateGoalOnFirebase,
        onSuccess: () => {
            toast.success('Goal updated');
            invalidateGoals(); // Refetch goals list
        },
        onError: (error) => {
            toast.error('Failed to update goal', { description: error.message });
            console.error('Failed to update goal:', error);
        },
    });
};

// --- Delete ---
const deleteGoalOnFirebase = async (id: string) => {
    if (!id) throw new Error('No goal ID provided');
    const goalRef = doc(db, 'goals', id);
    await deleteDoc(goalRef);
};

export const useDeleteGoal = () => {
    const invalidateGoals = useGoalQueryClient();
    return useMutation({
        mutationFn: deleteGoalOnFirebase,
        onSuccess: () => {
            toast.success('Goal deleted');
            invalidateGoals(); // Refetch goals list
        },
        onError: (error) => {
            toast.error('Failed to delete goal', { description: error.message });
            console.error('Failed to delete goal:', error);
        },
    });
};