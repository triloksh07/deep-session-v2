// app/dashboard/DashboardContent.tsx
"use client";
import React from "react";
import { useDashboard } from "./DashboardProvider";
import ConnectedDataRenderer from "@/components/ConnectedDataRenderer";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardContent() {
  const { sessions, goals, isLoading, isError } = useDashboard();
  return (
    <Dashboard sessions={sessions!} />
  )
}
