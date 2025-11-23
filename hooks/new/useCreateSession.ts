// hooks/useCreateSession.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { toast } from 'sonner';
import type { Session } from '@/types';

// Matches finalV0Data from SessionTracker.tsx
interface FinalV0DataInput {
  id: string;                 // nanoid() from tracker
  userId: string;
  title: string;
  session_type_id: string;
  notes: string;
  breaks: any[];
  started_at: string;         // ISO
  ended_at: string;           // ISO
  total_focus_ms: number;
  total_break_ms: number;
}

type CreateVars = FinalV0DataInput;
type CreateData = { docId: string };

type CreateCtx = {
  key: (string | undefined)[];
  previous?: Session[];
};

const createSessionOnFirebase = async (sessionData: CreateVars): Promise<CreateData> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');

  const dataToSave = {
    id: sessionData.id, // nanoid
    userId: user.uid,
    title: sessionData.title,
    session_type_id: sessionData.session_type_id,
    notes: sessionData.notes,
    breaks: sessionData.breaks,
    started_at: sessionData.started_at,
    ended_at: sessionData.ended_at,
    total_focus_ms: sessionData.total_focus_ms,
    total_break_ms: sessionData.total_break_ms,
    created_at: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'sessions'), dataToSave);
  return { docId: docRef.id };
};

export const useCreateSession = () => {
  const qc = useQueryClient();

  return useMutation<CreateData, Error, CreateVars, CreateCtx>({
    mutationFn: createSessionOnFirebase,

    // ✅ Optimistic update: add a Session-shaped item to cache
    onMutate: async (newSession) => {
      const key: (string | undefined)[] = ['sessions', newSession.userId];

      await qc.cancelQueries({ queryKey: key });
      const previous = (qc.getQueryData<Session[]>(key) || []).slice();

      const startTime = new Date(newSession.started_at).getTime();
      const endTime = new Date(newSession.ended_at).getTime();
      const date = newSession.started_at.split('T')[0]; // YYYY-MM-DD

      const optimisticSession: Session = {
        id: newSession.id, // same nanoid
        title: newSession.title,
        type: newSession.session_type_id,
        notes: newSession.notes,
        sessionTime: newSession.total_focus_ms,
        breakTime: newSession.total_break_ms,
        startTime,
        endTime,
        date,
      };

      qc.setQueryData<Session[]>(key, (old = []) => [optimisticSession, ...old]);

      if (process.env.NODE_ENV === 'development') {
        console.log('[useCreateSession] optimistic session added:', optimisticSession);
      }

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData(ctx.key, ctx.previous);
      }
      console.error('Failed to save session:', error);
      toast.error('Failed to save session', { description: error.message });
    },

    onSuccess: () => {
      toast.success('Session saved');
      // Firestore onSnapshot will soon overwrite cache with the real list.
    },

    onSettled: () => {
      // No invalidate needed; onSnapshot keeps sessions in sync.
    },
  });
};
