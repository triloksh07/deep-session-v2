// app/dashboard/DashboardShell.tsx
"use client";
import React from "react";
import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "@/components/AuthProviderNew";
import DashboardProvider from "./DashboardProvider";
import DashboardContent from "./DashboardContent";
import { Auth } from "@/components/Auth";
import { useRouter } from 'next/navigation';

export default function DashboardShell() {
      const { user, loading } = useAuth();
    // const [user, setUser] = useState<FirebaseUser | null>(null);
    const router = useRouter();

    // show spinner
    // if (loading) return <div>Loading...</div>;

    // if (!user) {
    //     return (
    //         <Auth /* pass handlers or let Auth call firebase directly */ />
    //     );
    // }

    if (!user) {
        router.push("/login"); // redirect to login
        return null;
    }

    return (
        <DashboardProvider userId={user.uid}>
            <DashboardContent />
        </DashboardProvider>
    );
}
