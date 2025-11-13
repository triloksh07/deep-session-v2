'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Square, Coffee, Loader2 } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer';
import { useShallow } from 'zustand/react/shallow';
import { auth, db } from '@/lib/firebase';
import { useCreateSession } from '@/hooks/useCreateSession'; // <-- This saves the FINAL log
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import type { Session, SessionFormProps } from '@/types';
import { formatTimerDuration as formatTime } from '@/lib/timeUtils';
import { StopCircleIcon, CoffeeIcon, PlayIcon } from 'lucide-react';
import { EditableProps } from '@/types/typeDeclaration';
import { nanoid } from 'nanoid';

function EditableTitle({ value, onChange, disabled = false }: EditableProps) {
    const [isEditing, setIsEditing] = useState(false);
    // 1. Fast, local state for the input
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local state with prop value if it changes externally
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false);
        // Only call onChange if the value actually changed or is not empty & Save immediately on blur
        if (currentValue.trim() !== value.trim() && currentValue.trim() !== '') {
            onChange(currentValue.trim());
        } else {
            // Reset to original value if input is empty
            setCurrentValue(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setCurrentValue(value); // Revert changes
            setIsEditing(false);
        }
    };

    return (
        <div className="w-full">
            {isEditing && !disabled ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={currentValue}
                    onChange={((e) => setCurrentValue(e.target.value))}
                    placeholder="What are you focusing on?"
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                />
            ) : (
                <span
                    onClick={() => !disabled && setIsEditing(true)}
                    className={`block w-full text-white px-4 py-3 rounded-lg cursor-pointer transition hover:bg-[#2a2a2a]/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                >
                    {value || 'Focus Session'}
                </span>
            )}
        </div>
    );
}

export default function SessionTracker() {
    // Get real-time state from the Zustand store
    const {
        isActive,
        isOnBreak,
        title,
        type,
        notes,
        sessionStartTime,
        breaks,
        toggleBreak,
        clearActiveSession,
        startSession,
        updateSessionDetails,
    } = useSessionStore(
        useShallow((state) => ({
            isActive: state.isActive,
            isOnBreak: state.onBreak,
            startSession: state.startSession,
            title: state.title,  // This is the GLOBAL title (for active session)
            type: state.type,    // This is the GLOBAL type (for active session)
            notes: state.notes,  // This is the GLOBAL notes (for active session)
            sessionStartTime: state.sessionStartTime,
            breaks: state.breaks,
            toggleBreak: state.toggleBreak,
            updateSessionDetails: state.updateSessionDetails,
            clearActiveSession: state.clearActiveSession,
        }))
    );
    const status = isActive ? (isOnBreak ? 'paused' : 'running') : 'idle'; // Derive status of active session from the store
    const createSessionMutation = useCreateSession(); // Instantiate the mutations
    const { isPending: isSaving } = createSessionMutation;
    const timerRef = useRef<TimerHandle>(null); // This ref gives us access to the timer engine's functions
    // These local states are just for the visual display
    const [displaySessionTime, setDisplaySessionTime] = useState(0);
    const [displayBreakTime, setDisplayBreakTime] = useState(0);
    // A single callback function that the Timer Engine will call
    const handleTickCallback = useCallback((sessionMs: number, breakMs: number) => {
        setDisplaySessionTime(sessionMs);
        setDisplayBreakTime(breakMs);
    }, []);

    // Local state for session details
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionType, setSessionType] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        // Check the LOCAL `sessionTitle` from the form, NOT the global `title`.
        // if (!sessionTitle.trim()) {
        //     alert("Please enter a session title."); // Or use a toast
        //     return;
        // }
        // if (!sessionTitle.trim()) return;
        let dataToSubmit: Partial<Session> = {
            title: sessionTitle.trim(),
            type: sessionType || 'Other',
            notes: sessionNotes
        }
        console.log("Starting session with:", dataToSubmit);
        startSession(dataToSubmit as Session);
    };

    // --- END SESSION HANDLER ---
    const handleEnd = async () => {
        if (!timerRef.current || !sessionStartTime) {
            return;
        }
        const user = auth.currentUser;
        if (!user) return;

        // 1. Get final times from the engine
        const { sessionTime, breakTime } = timerRef.current.endSession();
        const endTime = new Date().toISOString();

        // 2. Build the v0-compatible data object
        const finalV0Data = {
            // id: user?.uid, // UUID will be generated by Firestore
            id: nanoid(),
            userId: user.uid,
            title: title,
            session_type_id: type,
            notes: notes || "",
            breaks: breaks,
            started_at: sessionStartTime,
            ended_at: endTime,
            total_focus_ms: sessionTime,
            total_break_ms: breakTime,
        };

        // 3. Save the final session (this is offline-capable)
        createSessionMutation.mutateAsync(finalV0Data);
        try {
            await clearActiveSession();
        } catch (error) {
            // 6. The transaction failed (e.g., network error after retries)
            console.error("End session failed:", error);
            // We can show a toast here: "Failed to save, will retry."
            // setIsEnding(false); // Re-enable the button
        }
    };

    // Helper to conditionally join class names
    const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');
    const isLoading = createSessionMutation.isPending; // Only check the save mutation

    return (
        <>
            {/* The Headless Timer Engine. It renders null. */}
            {/* It's CRITICAL that isActive and isOnBreak come from the store */}
            <PersistentTimer
                ref={timerRef}
                isActive={isActive}
                isOnBreak={isOnBreak}
                onTick={handleTickCallback}
            />
            <div className="flex items-center justify-center p-2 bg-background ">
                {status === 'idle' ? (
                    // Idle State: Show SessionForm to start a new session
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-muted-foreground">
                                Start a new Focus Session
                            </CardTitle>
                            {/* <div className="text-muted-foreground">
                                {type || 'Session'}
                            </div> */}
                        </CardHeader>

                        <CardContent className="text-center space-y-6">
                            <form onSubmit={handleStart} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Session Title</Label>
                                    <Input
                                        id="title"
                                        value={sessionTitle} // Bound to local state
                                        onChange={(e) => setSessionTitle(e.target.value)} // Updates local state
                                        placeholder="What are you working on?"
                                        autoFocus
                                        className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 mb-6 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Session Type</Label>
                                    {/* Update the Select component */}
                                    <Select value={sessionType} onValueChange={setSessionType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a session type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* Map over the config file */}
                                            {DEFAULT_SESSION_TYPES.map((sessionType) => (
                                                <SelectItem key={sessionType.id} value={sessionType.id}>
                                                    {sessionType.label} {/* Show the Label, save the ID */}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <Button type="submit" className="flex-1 px-10 py-4 rounded-full bg-linear-to-r from-[#8A2BE2] to-[#5D3FD3] text-white font-bold text-base shadow-lg shadow-[#8A2BE2]/30 hover:opacity-90 transition-opacity cursor-pointer">
                                        Start Focus
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    // Active State: Timer Display
                    < Card className="w-full max-w-md">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-muted-foreground">
                                {/* {title && title || 'Focus Session'} */}
                                <div className="text-center text-muted-foreground">
                                    {isSaving ? 'Syncing...' : (isOnBreak ? (
                                        <div className="relative top-4 right-4 flex items-center space-x-2 text-red-400 font-semibold animate-pulse">
                                            <CoffeeIcon className="w-4 h-4" />
                                            <span>ON Break</span>
                                        </div>
                                    ) : (
                                        <div className="relative top-4 right-4 flex items-center space-x-2 text-green-400 font-semibold animate-pulse">
                                            <span className="w-4 h-4 rounded-full" />
                                            <span>Active</span>
                                        </div>
                                    ))}
                                </div>
                            </CardTitle>
                            {/* <div className="text-muted-foreground">
                                {type && type || 'Session'}
                            </div> */}
                            <div className="flex items-center space-x-3 space-y-2">
                                {sessionType && (
                                    <div className="mt-2 inline-block absolute top-2 left-5 bg-purple-700/30 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full">
                                        {sessionType}
                                    </div>
                                )}
                                <div className="w-full flex flex-col items-center space-y-2 mt-4 mb-4">
                                    <EditableTitle
                                        value={title}
                                        onChange={(newTitle) => updateSessionDetails({ title: newTitle })}
                                        // disabled={status === 'paused'} // optional: lock editing during breaks
                                        disabled={isLoading} // Disable while saving
                                    />
                                </div>

                                {/* <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={sessionNotes}
                                        onChange={(e) => setSessionNotes(e.target.value)}
                                        placeholder="Any initial thoughts or goals for this session..."
                                        rows={4}
                                    />
                                </div> */}
                            </div>
                        </CardHeader>

                        <CardContent className="text-center space-y-6">
                            {/* ... (state & Timer display) ... */}
                            <div className="space-y-2">
                                <div className={`transition-all duration-300 ${isOnBreak ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {/* {status === 'running' && (
                                        <div className="relative top-4 right-4 flex items-center space-x-2 text-green-400 font-semibold animate-pulse">
                                            <span className="w-4 h-4 rounded-full" />
                                            <span>Active</span>
                                        </div>
                                    )} */}
                                    <div className="text-6xl font-mono tracking-tight">
                                        {formatTime(displaySessionTime)}
                                    </div>
                                    <div className="text-muted-foreground">Session Time</div>
                                </div>

                                {displayBreakTime > 0 && (
                                    <div className={`transition-all duration-300 ${isOnBreak ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {/* {status === 'paused' && (
                                            <div className="relative top-4 right-4 flex items-center space-x-2 text-red-400 font-semibold animate-pulse">
                                                <CoffeeIcon className="w-4 h-4" />
                                                <span>ON Break</span>
                                            </div>
                                        )} */}
                                        <div className="text-2xl font-mono tracking-tight">
                                            {formatTime(displayBreakTime)}
                                        </div>
                                        <div className="text-muted-foreground">Break Time</div>
                                    </div>
                                )}
                            </div>

                            {/* 7. --- CONNECTED CONTROLS --- */}
                            <div className="flex justify-center space-x-4">
                                <Button
                                    onClick={toggleBreak}
                                    variant="outline"
                                    size="lg"
                                    // className={isOnBreak ? 'bg-orange-100 border-orange-300' : ''}
                                    // disabled={isSaving}
                                    className={classNames(
                                        "px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer",
                                        status === 'running' ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-green-500 text-white "
                                    )}
                                >
                                    {status === 'running' ? <CoffeeIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                    <span>{status === 'running' ? 'Take Break' : 'Resume'}</span>
                                </Button>

                                <Button
                                    onClick={handleEnd}
                                    variant="destructive"
                                    size="lg"
                                    className="bg-red-600/80 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 cursor-pointer hover:bg-red-600"
                                // disabled={isOnBreak}
                                >
                                    <StopCircleIcon className="w-5 h-5" />
                                    <span>End</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div >

        </>
    )
}