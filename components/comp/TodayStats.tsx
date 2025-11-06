'use Client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useSessionStore } from '@/store/oldMainSessionStore'; // Or your actual path
import type { Session } from '@/types/typeDeclaration';

// --- Type Definitions for Clarity and Safety ---

// Defines the props for the CircularProgress component
interface CircularProgressProps {
    percentage: number;
    color: string;
    label: string;
    time: string;
}

// Defines the props for the TypeBar component
interface TypeBarProps {
    type: string;
    time: string;
    percentage: number;
    color: string;
}


// --- Helper Function to format time ---
const formatMilliseconds = (ms: number) => {
    if (ms <= 0) return "0m";
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = '';
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0 || hours === 0) {
        result += `${minutes}m`;
    }
    return result.trim();
};

// --- Helper function to check if a date is today ---
const isToday = (someDate: string) => {
    const today = new Date();
    const date = new Date(someDate);
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};


// --- NEW: Helper function to calculate the daily streak ---
const calculateStreak = (sessions: Session[]) => {
    if (!sessions || sessions.length === 0) {
        return 0;
    }

    // Get unique days (normalized to the start of the day) from session history
    const uniqueDayTimestamps = [...new Set(
        sessions.map(s => new Date(s.started_at).setHours(0, 0, 0, 0))
    )];

    // Sort the unique days in descending order (most recent first)
    uniqueDayTimestamps.sort((a, b) => b - a);

    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today).setDate(new Date(today).getDate() - 1);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    const mostRecentSessionDay = uniqueDayTimestamps[0];

    // If the last session was before yesterday, the streak is broken
    if (mostRecentSessionDay < yesterday) {
        return 0;
    }

    let streak = 1;
    let lastDate = mostRecentSessionDay;

    // Iterate through the rest of the sessions to find consecutive days
    for (let i = 1; i < uniqueDayTimestamps.length; i++) {
        const currentDate = uniqueDayTimestamps[i];
        if (lastDate - currentDate === oneDayInMs) {
            streak++;
            lastDate = currentDate;
        } else {
            // A gap was found, so the streak ends here
            break;
        }
    }

    return streak;
};

// --- Sub-Components (respecting your latest version) ---
const CircularProgress = ({ percentage, color, label, time }: CircularProgressProps) => (
    <div className="flex flex-col items-center space-y-2">
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="stroke-current text-gray-700" strokeWidth="10" fill="transparent" />
                <circle cx="50" cy="50" r="45" className='stroke-current' strokeWidth="10" fill="transparent"
                    style={{ color: color }}
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * percentage) / 100}
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-lg">{time}</span>
            </div>
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
    </div>
);

const TypeBar = ({ type, time, percentage, color }: TypeBarProps) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
            <span className="text-white">{type}</span>
            <span className="text-gray-400">{time}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-[--session-type-color] h-2 rounded-full" style={{
                width: `${percentage}%`, '--session-type-color': color
            } as React.CSSProperties
            }>
            </div>
        </div>
    </div>
);

// --- Main Component ---
const TodayStatsCard = () => {
    // 1. Select ALL state needed for calculation in a single hook.
    // `shallow` prevents re-renders if the nested data hasn't changed.
    const {
        recentSessions,
        customSessionTypes,
        sessionActive,
        sessionStartTime,
        onBreak,
        breaks,
        currentSessionDetails
    } = useSessionStore(useShallow(
        (state) => ({
            recentSessions: state.recentSessions,
            customSessionTypes: state.customSessionTypes,
            sessionActive: state.sessionActive,
            sessionStartTime: state.sessionStartTime,
            onBreak: state.onBreak,
            breaks: state.breaks,
            currentSessionDetails: state.currentSessionDetails,
        })
    )

    );

    // 2. Calculate today's stats, now including the LIVE active session
    const todayStats = useMemo(() => {
        const todaysCompletedSessions = recentSessions.filter(session => isToday(session.started_at));

        let activeSessionFocusMs = 0;
        let activeSessionBreakMs = 0;

        // --- LIVE CALCULATION FOR ACTIVE SESSION ---
        if (sessionActive && sessionStartTime) {
            const now = new Date();
            const startTime = new Date(sessionStartTime);

            const completedBreakTime = breaks
                .filter(b => b.end)
                .reduce((acc, b) => acc + (new Date(b.end as Date).getTime() - new Date(b.start).getTime()), 0);

            const currentBreakTime = onBreak && breaks.length > 0 && breaks[breaks.length - 1].start
                ? now.getTime() - new Date(breaks[breaks.length - 1].start).getTime()
                : 0;

            activeSessionBreakMs = completedBreakTime + currentBreakTime;
            const totalElapsed = now.getTime() - startTime.getTime();
            activeSessionFocusMs = totalElapsed - activeSessionBreakMs;
        }

        // Combine completed sessions with the live active session
        const totalFocusMs = todaysCompletedSessions.reduce((acc, session) => acc + session.total_focus_ms, 0) + activeSessionFocusMs;
        const totalBreakMs = todaysCompletedSessions.reduce((acc, session) => acc + session.total_break_ms, 0) + activeSessionBreakMs;
        const totalTimeMs = totalFocusMs + totalBreakMs;

        const focusPercentage = totalTimeMs > 0 ? (totalFocusMs / totalTimeMs) * 100 : 0;
        const breakPercentage = totalTimeMs > 0 ? (totalBreakMs / totalTimeMs) * 100 : 0;

        // Aggregate per-type totals
        const typeTotalsMap = new Map();
        todaysCompletedSessions.forEach(session => {
            const existingTotal = typeTotalsMap.get(session.session_type_id) || 0;
            typeTotalsMap.set(session.session_type_id, existingTotal + session.total_focus_ms);
        });

        // Add the live session's focus time to its type
        if (sessionActive && currentSessionDetails.sessionTypeId) {
            const existingTotal = typeTotalsMap.get(currentSessionDetails.sessionTypeId) || 0;
            typeTotalsMap.set(currentSessionDetails.sessionTypeId, existingTotal + activeSessionFocusMs);
        }

        const perTypeTotals = Array.from(typeTotalsMap.entries()).map(([typeId, totalMs]) => {
            const typeDetails = customSessionTypes.find(t => t.id === typeId) || { label: 'Unknown', color: 'bg-gray-500' };
            return {
                id: typeId,
                label: typeDetails.label,
                color: typeDetails.color,
                timeMs: totalMs,
                percentage: totalFocusMs > 0 ? (totalMs / totalFocusMs) * 100 : 0,
            };
        });

        // --- STREAK LOGIC INTEGRATED ---
        const streak = calculateStreak(recentSessions);

        return {
            focusTimeMs: totalFocusMs,
            breakTimeMs: totalBreakMs,
            focusPercentage,
            breakPercentage,
            perTypeTotals,
            streak,
        };
    }, [recentSessions, customSessionTypes, sessionActive, sessionStartTime, onBreak, breaks, currentSessionDetails]);

    // 3. Render the component with the dynamic data
    return (
        <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-semibold mb-4">Today&apos;s Focus</h2>
                {todayStats.streak > 0 && (
                    <div className="flex items-center justify-center bg-[#2a2a2a] p-2 rounded-lg">
                        <Flame size={18} className="text-orange-400 mr-2" />
                        <span className="text-white font-medium">{todayStats.streak}-day streak</span>
                    </div>
                )}
            </div>
            <div className="flex justify-around items-center mb-6">
                <CircularProgress
                    percentage={todayStats.focusPercentage}
                    color="#8A2BE2"
                    label="Focus Time"
                    time={formatMilliseconds(todayStats.focusTimeMs)}
                />
                <CircularProgress
                    percentage={todayStats.breakPercentage}
                    color="#4a6bdf"
                    label="Break Time"
                    time={formatMilliseconds(todayStats.breakTimeMs)}
                />
            </div>
            <h3 className="text-white font-semibold mb-3">Per-Type Totals</h3>
            <div className="space-y-4 mb-4">
                {todayStats.perTypeTotals.length > 0 ? (
                    todayStats.perTypeTotals.sort((a, b) => b.timeMs - a.timeMs).map(type => (
                        <TypeBar
                            key={type.id}
                            type={type.label}
                            time={formatMilliseconds(type.timeMs)}
                            percentage={type.percentage}
                            color={type.color}
                        />
                    ))
                ) : (
                    <p className="text-gray-500 text-center text-sm">No focus sessions logged today.</p>
                )}
            </div>

        </div>
    );
};

export default TodayStatsCard;
