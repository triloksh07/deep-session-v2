// hooks/useSessionMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Session } from "@/types";
import { toast } from "sonner";

// Data needed to update a session
export type UpdateSessionInput = {
  id: string;                // Firestore doc ID (Session.id)
  updates: Partial<Session>; // fields from UI model
};
type CreateCtx = {
  key: (string | undefined)[];
  previous?: Session[];
};

// --- low-level Firestore update ---
const updateSessionOnFirebase = async ({
  id,
  updates,
}: UpdateSessionInput): Promise<void> => {
  if (!id) throw new Error("No session ID provided");

  const sessionRef = doc(db, "sessions", id);

  const adaptedUpdates: Record<string, any> = {};

  if (typeof updates.title === "string") {
    adaptedUpdates.title = updates.title;
  }

  if (typeof updates.notes === "string") {
    adaptedUpdates.notes = updates.notes;
  }

  if (Object.keys(adaptedUpdates).length === 0) {
    return;
  }

  await updateDoc(sessionRef, adaptedUpdates);
};

// ✅ userId injected from caller (NOT auth.currentUser inside hook)
export const useUpdateSession = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<void, Error, UpdateSessionInput, CreateCtx>({
    mutationFn: updateSessionOnFirebase,

    onMutate: async ({ id, updates }) => {
      const key: (string | undefined)[] = ["sessions", userId];

      // just in case some refetch in progress
      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Session[]>(key) || []).slice();

      const next = previous.map((session) =>
        session.id === id ? { ...session, ...updates } : session
      );

      qc.setQueryData<Session[]>(key, next);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Session[]>(ctx.key, ctx.previous);
      }
      console.error("Failed to update session:", error);
      toast.error("Failed to update session", {
        description: error.message,
      });
    },

    onSuccess: () => {
      toast.success("Session updated");
    },
  });
};

// --- low-level delete ---
const deleteSessionOnFirebase = async (id: string): Promise<void> => {
  if (!id) throw new Error("No session ID provided");
  const sessionRef = doc(db, "sessions", id);
  await deleteDoc(sessionRef);
};

export const useDeleteSession = (userId: string) => {
  const qc = useQueryClient();

  return useMutation<void, Error, string, CreateCtx>({
    mutationFn: deleteSessionOnFirebase,

    onMutate: async (id) => {
      const key: (string | undefined)[] = ["sessions", userId];

      await qc.cancelQueries({ queryKey: key });

      const previous = (qc.getQueryData<Session[]>(key) || []).slice();

      const next = previous.filter((session) => session.id !== id);

      qc.setQueryData<Session[]>(key, next);

      return { key, previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.key && ctx.previous) {
        qc.setQueryData<Session[]>(ctx.key, ctx.previous);
      }
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete session", {
        description: error.message,
      });
    },

    onSuccess: () => {
      toast.success("Session deleted");
    },
  });
};
