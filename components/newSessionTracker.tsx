'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Square, Coffee, Loader2 } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer'; // Using the v0 timer engine
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid'; // For v0 adapter
import { auth } from '@/lib/firebase'; // For v0 adapter

// --- ADD ---
// Import the new mutation hooks
// import { 
//   useToggleBreakMutation, 
//   useEndSessionMutation 
// } from '@/hooks/useTimerMutations';
import { useCreateSession } from '@/hooks/useCreateSession'; // <-- This saves the FINAL log

export function SessionTracker() {
  // 1. Get real-time state from the Zustand store
  const { isActive, isOnBreak, title, type, notes, sessionStartTime, breaks, toggleBreak, clearActiveSession } = useSessionStore(
    useShallow((state) => ({
      isActive: state.isActive,
      isOnBreak: state.onBreak,
      title: state.title,
      type: state.type,
      notes: state.notes,
      sessionStartTime: state.sessionStartTime,
      breaks: state.breaks,
      toggleBreak: state.toggleBreak,
      clearActiveSession: state.clearActiveSession,
    }))
  );

  // 2. Instantiate the mutations
  // const toggleBreakMutation = useToggleBreakMutation();
  // const endSessionMutation = useEndSessionMutation();
  const createSessionMutation = useCreateSession();

  // 3. Setup the timer engine
  const timerEngineRef = useRef<TimerHandle>(null);
  const [displaySession, setDisplaySession] = useState(0);
  const [displayBreak, setDisplayBreak] = useState(0);

  // 4. UI tick loop (polls the timer engine)
  useEffect(() => {
    let frameId: number;
    const updateDisplay = () => {
      if (isActive && timerEngineRef.current) {
        const { session, break: breakTime } = timerEngineRef.current.getCurrentDisplayTimes();
        setDisplaySession(session);
        setDisplayBreak(breakTime);
      }
      frameId = requestAnimationFrame(updateDisplay);
    };
    frameId = requestAnimationFrame(updateDisplay);
    return () => cancelAnimationFrame(frameId);
  }, [isActive]);

  // 5. Format time function (no changes)
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 6. --- NEW END SESSION HANDLER ---
  const handleEndSession = async () => {
    if (!timerEngineRef.current || !sessionStartTime || createSessionMutation.isPending) {
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    // 1. Get final times from the engine
    const { sessionTime, breakTime } = timerEngineRef.current.endSession();
    const endTime = new Date().toISOString();

    // 2. Build the v0-compatible data object
    const finalV0Data = {
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
      // 4. AFTER saving, clear the active session (also offline-capable)
      await clearActiveSession();
      // The `useSyncActiveSession` hook will hear this deletion
      // and set isActive: false, hiding this component.

    } catch (error) {
      console.error("Failed to save session:", error);
      // Show a toast error
    }
  };

  // This component now relies on the sync hook to set isActive to false
  if (!isActive) {
    return null;
  }

  // const anyLoading = toggleBreakMutation.isPending || endSessionMutation.isPending;
  const isLoading = createSessionMutation.isPending; // Only check the save mutation

  return (
    <>
      {/* The Headless Timer Engine. It renders null. */}
      {/* It's CRITICAL that isActive and isOnBreak come from the store */}
      <PersistentTimer
        ref={timerEngineRef}
        isActive={isActive}
        isOnBreak={isOnBreak}
      />

      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-muted-foreground">
              {title || 'Focus Session'}
            </CardTitle>
            <div className="text-muted-foreground">
              {type || 'Session'}
            </div>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            {/* ... (Timer display JSX is unchanged) ... */}
            <div className="space-y-2">
              <div className={`transition-all duration-300 ${isOnBreak ? 'text-muted-foreground' : 'text-foreground'}`}>
                <div className="text-6xl font-mono tracking-tight">
                  {formatTime(displaySession)}
                </div>
                <div className="text-muted-foreground">Session Time</div>
              </div>

              {displayBreak > 0 && (
                <div className={`transition-all duration-300 ${isOnBreak ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <div className="text-2xl font-mono tracking-tight">
                    {formatTime(displayBreak)}
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
                className={isOnBreak ? 'bg-orange-100 border-orange-300' : ''}
                disabled={isLoading}
              >
                {/* {toggleBreakMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coffee className="mr-2 h-4 w-4" />
                )} */}
                <Coffee className="mr-2 h-4 w-4" />
                {isOnBreak ? 'End Break' : 'Break'}
              </Button>

              <Button
                onClick={handleEndSession}
                variant="destructive"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Saving...' : 'End'}
              </Button>
            </div>

            <div className="text-center text-muted-foreground">
              {isLoading ? 'Syncing...' : (isOnBreak ? 'On Break' : 'In Session')}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}