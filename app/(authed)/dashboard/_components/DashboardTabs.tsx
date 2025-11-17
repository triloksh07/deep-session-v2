// app/dashboard/DashboardTabs.tsx
"use client";
import React, { useState } from "react";
import { useDashboard } from "./DashboardProvider";
import ConnectedDataRenderer from "@/components/ConnectedDataRenderer";
import { Dashboard } from "@/components/Dashboard";
import { Goals } from "@/components/Goals";
import { SessionLog } from "@/components/SessionLog";
import { Analytics } from "@/components/Analytics";
import { ExportData } from "@/components/ExportData";

export default function DashboardTabs() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const { sessions, goals, isLoading, isError } = useDashboard();

    // render tabs...
    return (
        /* TabsList + TabsContent simplified */
        <div>
            {/* Dashboard tab */}
            <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={null}>
                {activeTab === "dashboard" && <Dashboard sessions={sessions} onStartSession={() => { }} />}
                {activeTab === "goals" && <Goals sessions={sessions} goals={goals} />}
                {/* etc. */}
            </ConnectedDataRenderer>
        </div>
    );
}
