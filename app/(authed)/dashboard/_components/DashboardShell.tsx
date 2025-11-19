// app/dashboard/DashboardShell.tsx
"use client";
import React from "react";
import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "@/context/AuthProvider";
import DashboardProvider from "./DashboardProvider";
import DashboardContent from "./DashboardContent";
// import { Auth } from "@/components/Auth";
import { useRouter, redirect } from 'next/navigation';
import ConnectedDataRenderer from '@/components/ConnectedDataRenderer';
import { useDashboard } from "../_components/DashboardProvider";

export default function DashboardShell() {
    const { user, loading } = useAuth();
    // const [user, setUser] = useState<FirebaseUser | null>(null);
    const { isLoading, isError, error } = useDashboard();
    const router = useRouter();

    // show spinner
    // if (loading) return <div>Loading...</div>;

    // useEffect(() => {
    //     if (!user) {
    //         router.push("/login"); // client-side redirect
    //     }
    // }, [user, router]);

    // if (!user) {
    //     redirect("/login"); // ✅ runs before render
    // }

    // if (!user) {
    //     return null; // render nothing until redirect happens
    // }

    return (
        <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
            <DashboardContent />
        </ConnectedDataRenderer>

    );
}
