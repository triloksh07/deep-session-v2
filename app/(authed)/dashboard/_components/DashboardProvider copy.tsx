// app/(authed)/dashboard/DashboardProvider.tsx
"use client";
import React, { createContext, useContext } from "react";

// import { useSessionsQuery } from "@/hooks/new/SessionQuery";
import { useSessionsQuery } from "@/hooks/new/useSessionsQuery";
// import { useSessionsQuery } from "@/hooks/useSessionsQuery";

import { useGoalsQuery } from "@/hooks/useGoalsQuery";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoalMutations";
import type { Session, Goal, } from "@/types";
import { Skeleton as SkeletonBlock } from '@/components/ui/skeleton'

type DashboardContextType = {
  sessions: Session[] | undefined;
  goals: Goal[] | undefined;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export default function DashboardProvider({
  children,
  userId
}: {
  children: React.ReactNode;
  userId: string;
}) {
  
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    isError: errSessions,
    error: sessionsError
  } = useSessionsQuery(userId, true);

  // const sessionsData = useSessionsRealtime(userId);

  const {
    data: goalsData,
    isLoading: loadingGoals,
    isError: errGoals,
    error: goalsError
  } = useGoalsQuery(userId, true);

  // --- GOAL MUTATIONS ---
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const del = useDeleteGoal();

  const isLoading = loadingSessions || loadingGoals;
  const isError = errSessions || errGoals;
  const error = sessionsError || goalsError; // Get the first error

  // gate for valid array
  // const sessions = sessionsData!;
  // const goals = goalsData!;

  const value: DashboardContextType = {
    sessions: sessionsData ?? [],
    goals: goalsData ?? [],
    isLoading,
    error,
    isError: Boolean(isError),
    createGoal: (data) => create.mutate(data),
    updateGoal: (id: string, updates) => update.mutate({ id, updates }),
    deleteGoal: (id: string) => del.mutate(id),
  };

  // Prevent rendering children until initial data is available.
  // This allows Suspense boundaries in consuming components to show fallbacks.
  if (isLoading && (!sessionsData || !goalsData)) {
    // Skeleton fallback
    return (
      <div className="p-6 space-y-4">
        <SkeletonBlock className={'h-40 w-screen'} />
        <SkeletonBlock className={'h-80 w-screen'} />
        <SkeletonBlock className={'h-200 w-screen'} />
      </div>
    );; // or a minimal loading spinner if desired
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
};


/**
 * NOTE:
 * Pages/components consuming this provider should wrap data-dependent sections
 * in <Suspense fallback={...}> to ensure proper loading states.
 * For finer-grained control, consider splitting into separate contexts
 * for sessions and goals, but the unified approach is kept here for simplicity.
 */