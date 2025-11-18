// app/dashboard/DashboardShell.tsx
"use client";
import React from "react";
import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "@/context/AuthProvider";
import DashboardProvider from "./DashboardProvider";
import DashboardContent from "./DashboardContent";
import { Auth } from "@/components/Auth";
import { useRouter, redirect } from 'next/navigation';

export default function DashboardShell() {
    const { user, loading } = useAuth();
    // const [user, setUser] = useState<FirebaseUser | null>(null);
    const router = useRouter();

    // show spinner
    if (loading) return <div>Loading...</div>;

    // useEffect(() => {
    //     if (!user) {
    //         router.push("/login"); // client-side redirect
    //     }
    // }, [user, router]);

    if (!user) {
        redirect("/login"); // ✅ runs before render
    }

    if (!user) {
        return null; // render nothing until redirect happens
    }

    return (
        <DashboardProvider userId={user.uid}>
            <DashboardContent />
        </DashboardProvider>
    );
}
