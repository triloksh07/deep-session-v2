// app/dashboard/DashboardProvider.tsx
"use client";
import React, { createContext, useContext } from "react";
import { useSessionsQuery, fetchSessions } from "@/hooks/useSessionsQuery";
import { useGoalsQuery, fetchGoals } from "@/hooks/useGoalsQuery";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoalMutations";
import type { Session, Goal, } from "@/types";

type DashboardContextType = {
  sessions: Session[] | undefined;
  goals: Goal[] | undefined;
  isLoading: boolean;
  error: any;
  isError: boolean;
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>('' as unknown as DashboardContextType);

export default function DashboardProvider({ children, userId }: { children: React.ReactNode; userId: string; }) {
  const {
    data: sessions,
    isLoading: loadingSessions,
    isError: errSessions,
    error: sessionsError
  } = useSessionsQuery(userId, true);
  const {
    data: goals,
    isLoading: loadingGoals,
    isError: errGoals,
    error: goalsError // <-- GET THIS
  } = useGoalsQuery(userId, true);

  // --- GOAL MUTATIONS ---
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const del = useDeleteGoal();

  const isLoading = loadingSessions || loadingGoals;
  const isError = errSessions || errGoals;
  const error = sessionsError || goalsError; // Get the first error

  const value = {
    sessions,
    goals,
    isLoading,
    error,
    isError: Boolean(isError),
    createGoal: (data: any) => create.mutate(data),
    updateGoal: (id: string, updates: any) => update.mutate({ id, updates }),
    deleteGoal: (id: string) => del.mutate(id),
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
};
