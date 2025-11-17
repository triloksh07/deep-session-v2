// app/dashboard/DashboardProvider.tsx
"use client";
import React, { createContext, useContext } from "react";
import { useSessionsQuery, fetchSessions } from "@/hooks/useSessionsQuery";
import { useGoalsQuery, fetchGoals } from "@/hooks/useGoalsQuery";
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoalMutations";

type DashboardContextType = {
  sessions: any[];
  goals: any[];
  isLoading: boolean;
  isError: boolean;
  createGoal: (data: any) => void;
  updateGoal: (id: string, updates: any) => void;
  deleteGoal: (id: string) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export default function DashboardProvider({ children, userId }: { children: React.ReactNode; userId: string; }) {
  const { data: sessions = [], isLoading: loadingSessions, isError: errSessions } = useSessionsQuery(userId, true);
  const { data: goals = [], isLoading: loadingGoals, isError: errGoals } = useGoalsQuery(userId, true);

  const create = useCreateGoal();
  const update = useUpdateGoal();
  const del = useDeleteGoal();

  const isLoading = loadingSessions || loadingGoals;
  const isError = errSessions || errGoals;

  const value = {
    sessions,
    goals,
    isLoading,
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
