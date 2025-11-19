// app/dashboard/DashboardLayoutWrapper.tsx
"use client";

import React from "react";
import DashboardProvider from "./DashboardProvider";
import { useAuth } from '@/context/AuthProvider';

// You can pass userId from props or fetch it from session/auth context
export default function DashboardLayoutWrapper({
    children
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth();

    // Handle loading state
    if (loading) {
        return <div>Loading dashboard...</div>;
    }

    // Handle unauthenticated state
    if (!user) {
        return <div>You must be logged in to view the dashboard.</div>;
    }
    
    return <DashboardProvider userId={user.uid}>{children}</DashboardProvider>;
}
