'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, Square, Coffee, Loader2 } from 'lucide-react'; // Added Loader2

// 1. Import your store, timer engine, and NEW MUTATION
import { useSessionStore } from '@/store/timerStore';
import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer';
import { useShallow } from 'zustand/react/shallow';
import { useCreateSession } from '@/hooks/useCreateSession'; // <-- IMPORTED
import { nanoid } from 'nanoid'; // For v0 adapter
import { auth } from '@/lib/firebase'; // For v0 adapter
// --- ADD ---
// Import the new mutation hooks
import {
  useToggleBreakMutation,
  useEndSessionMutation
} from '@/hooks/useTimerMutations';


export function SessionTracker() {
  // Get real-time state from the Zustand store
  const { isActive, isOnBreak, ...sessionInfo } = useSessionStore(
    useShallow((state) => ({
      isActive: state.isActive,
      isOnBreak: state.onBreak,
      title: state.title,
      type: state.type,
      notes: state.notes,
      startTime: state.sessionStartTime,
      breaks: state.breaks,
      // toggleBreak: state.toggleBreak,
    }))
  );

  // 3. Setup the mutation hook
  // const createSessionMutation = useCreateSession();

  // 2. Instantiate the mutations
  const toggleBreakMutation = useToggleBreakMutation();
  const endSessionMutation = useEndSessionMutation();

  // (The timerEngineRef, display state, UI tick loop, and formatTime are all unchanged)
  const timerEngineRef = useRef<TimerHandle>(null);
  const [displaySession, setDisplaySession] = useState(0);
  const [displayBreak, setDisplayBreak] = useState(0);

  // UI tick loop (polls the timer engine)
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

  // Format time function (no changes)
  const formatTime = (milliseconds: number) => {
    // ... (same as before)
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 4. THIS IS THE old "END SESSION" LOGIC
  // const handleEndSession = () => {
  //   if (!timerEngineRef.current || !sessionInfo.startTime) return;

  //   // 1. Get final times from the engine
  //   const { sessionTime, breakTime } = timerEngineRef.current.endSession();

  //   // 2. Get current state data from the store
  //   const endTime = new Date().toISOString();

  //   // 3. Build the final session object
  //   const finalSessionData = {
  //     title: sessionInfo.title,
  //     type: sessionInfo.type,
  //     notes: sessionInfo.notes,
  //     startTime: sessionInfo.startTime,
  //     endTime: endTime,
  //     sessionTime: sessionTime, // Final number from engine
  //     breakTime: breakTime, // Final number from engine
  //     breaks: sessionInfo.breaks,
  //     date: new Date(sessionInfo.startTime).toISOString().split('T')[0],
  //   };

  //   // 4. Call the mutation!
  //   // This will save to Firebase, then reset the store on success.
  //   createSessionMutation.mutate(finalSessionData);
  // };
  // --- NEW END SESSION HANDLER ---
  const handleEndSession = () => {
    if (!timerEngineRef.current || !sessionTime || endSessionMutation.isPending) {
      return;
    }
    const user = auth.currentUser;
    if (!user) return; // Should never happen here

    // 1. Get final times from the engine
    const { sessionTime, breakTime } = timerEngineRef.current.endSession();
    const endTime = new Date().toISOString();

    // 2. Build the v0-compatible data object (our adapter logic)
    const finalV0Data = {
      id: nanoid(),
      userId: user.uid,
      title: title,
      session_type_id: type,
      notes: notes || "",
      breaks: breaks,
      started_at: sessionStartTime, // This is the string from the store
      ended_at: endTime,
      total_focus_ms: sessionTime,
      total_break_ms: breakTime,
    };

    // 3. Call the mutation
    endSessionMutation.mutate(finalV0Data);
  };

  // This component now relies on the sync hook to set isActive to false
  if (!isActive) {
    return null;
  }

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
          {/* ... (CardHeader and Timer Display are unchanged) ... */}
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-muted-foreground">{sessionInfo.title || 'Focus Session'}</CardTitle>
            <div className="text-muted-foreground">{sessionInfo.type || 'Session'}</div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <div className={`transition-all duration-300 ${isOnBreak ? 'text-muted-foreground' : 'text-foreground'}`}>
                <div className="text-6xl font-mono tracking-tight">{formatTime(displaySession)}</div>
                <div className="text-muted-foreground">Session Time</div>
              </div>
              {displayBreak > 0 && (
                <div className={`transition-all duration-300 ${isOnBreak ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <div className="text-2xl font-mono tracking-tight">{formatTime(displayBreak)}</div>
                  <div className="text-muted-foreground">Break Time</div>
                </div>
              )}
            </div>

            {/* 5. Controls now disable themselves while saving */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={sessionInfo.toggleBreak}
                variant="outline"
                size="lg"
                className={isOnBreak ? 'bg-orange-100 border-orange-300' : ''}
                disabled={createSessionMutation.isPending} // Disable on save
              >
                <Coffee className="mr-2 h-4 w-4" />
                {isOnBreak ? 'End Break' : 'Break'}
              </Button>

              <Button
                onClick={handleEndSession}
                variant="destructive"
                size="lg"
                disabled={createSessionMutation.isPending} // Disable on save
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                {createSessionMutation.isPending ? 'Saving...' : 'End'}
              </Button>
            </div>
            <div className="text-center text-muted-foreground">
              {isOnBreak ? 'On Break' : 'In Session'}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}