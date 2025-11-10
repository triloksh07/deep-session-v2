'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Square, Coffee, Loader2 } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
// import { useSessionStore } from '@/store/newSessionStore';
import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer'; // Using the v0 timer engine
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid'; // For v0 adapter
import { auth, db } from '@/lib/firebase'; // For v0 adapter
// 2. Import all necessary Firestore functions
// import {
//   runTransaction,
//   doc,
//   collection
// } from 'firebase/firestore';

// --- ADD ---
// Import the new mutation hooks
// import { 
//   useToggleBreakMutation, 
//   useEndSessionMutation 
// } from '@/hooks/useTimerMutations';
import { useCreateSession } from '@/hooks/useCreateSession'; // <-- This saves the FINAL log

export function SessionTracker() {

  // 1. Get real-time state from the Zustand store
  const { isActive, isOnBreak, title, type, notes, sessionStartTime, breaks, toggleBreak, clearActiveSession, } = useSessionStore(
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

  const { isPending: isSaving } = createSessionMutation;
  // 5. We need a local loading state for the button
  const [isEnding, setIsEnding] = useState(false);
  // 3. Setup the timer engine
  const timerEngineRef = useRef<TimerHandle>(null);
  const [displaySession, setDisplaySession] = useState(0);
  const [displayBreak, setDisplayBreak] = useState(0);

  // This ref gives us access to the timer engine's functions
  const timerRef = useRef<TimerHandle>(null);
  // This local state is just for the visual display
  const [displayTime, setDisplayTime] = useState(0);
  const [displayBreakTime, setDisplayBreakTime] = useState(0);

  // This effect keeps the visual timer display updated
  // useEffect(() => {
  //   let animationFrameId: number;
  //   const updateDisplay = () => {
  //     if (isActive && timerRef.current) {
  //       // Call the new method to get both times
  //       const { session, break: breakT } = timerRef.current.getCurrentDisplayTimes();

  //       // Update both state variables
  //       setDisplayTime(session);
  //       setDisplayBreakTime(breakT);
  //     }
  //     animationFrameId = requestAnimationFrame(updateDisplay);
  //   };
  //   updateDisplay();
  //   return () => cancelAnimationFrame(animationFrameId);
  // }, [isActive]);

  // 4. UI tick loop (polls the timer engine)
  // useEffect(() => {
  //   let frameId: number;
  //   const updateDisplay = () => {
  //     if (isActive && timerEngineRef.current) {
  //       const { session, break: breakTime } = timerEngineRef.current.getCurrentDisplayTimes();
  //       setDisplaySession(session);
  //       setDisplayBreak(breakTime);
  //     }
  //     frameId = requestAnimationFrame(updateDisplay);
  //   };
  //   frameId = requestAnimationFrame(updateDisplay);
  //   return () => cancelAnimationFrame(frameId);
  // }, [isActive]);

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

  // A single callback function that the Engine will call
  const handleTickCallback = useCallback((sessionMs: number, breakMs: number) => {
    setDisplayTime(sessionMs);
    setDisplayBreakTime(breakMs);
  }, []);

  // 6. --- NEW END SESSION HANDLER ---
  const handleEndSession = async () => {
    if (!timerRef.current || !sessionStartTime || isSaving) {
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    // 1. Get final times from the engine
    const { sessionTime, breakTime } = timerRef.current.endSession();
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
    // 3. Define our "lock" doc (the active session)
    // const activeSessionRef = doc(db, 'active_sessions', user.uid);
    // Define the new session doc
    // const newSessionRef = doc(collection(db, 'sessions')); // Creates a new ref


    try {
      await clearActiveSession();
      // The `useSyncActiveSession` hook will hear this deletion
      // and set isActive: false, hiding this component.

      // --- REMOVED TRANSACTION CODE FOR SIMPLICITY ---
      // 4. Run the transaction
      // await runTransaction(db, async (transaction) => {
      //   // 4a. Read the "lock" doc
      //   const activeDoc = await transaction.get(activeSessionRef);

      //   if (!activeDoc.exists()) {
      //     // It's already gone! Another device (or offline sync)
      //     // already ended this session. We must do nothing.
      //     console.log("Session already ended by another device. Aborting.");
      //     return; // Abort the transaction
      //   }

      //   // 4b. The doc exists, so we are the "winner".
      //   // Create the new finished session...
      //   transaction.set(newSessionRef, finalV0Data);
      //   // ...and delete the active session "lock"
      //   transaction.delete(activeSessionRef);
      // });

    } catch (error) {
      // 6. The transaction failed (e.g., network error after retries)
      console.error("End session transaction failed:", error);
      // We can show a toast here: "Failed to save, will retry."
      setIsEnding(false); // Re-enable the button
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
        ref={timerRef}
        isActive={isActive}
        isOnBreak={isOnBreak}
        onTick={handleTickCallback}
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
                  {formatTime(displayTime)}
                </div>
                <div className="text-muted-foreground">Session Time</div>
              </div>

              {displayBreakTime > 0 && (
                <div className={`transition-all duration-300 ${isOnBreak ? 'text-foreground' : 'text-muted-foreground'}`}>
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
                className={isOnBreak ? 'bg-orange-100 border-orange-300' : ''}
                disabled={isSaving}
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
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'End'}
              </Button>
            </div>

            <div className="text-center text-muted-foreground">
              {isSaving ? 'Syncing...' : (isOnBreak ? 'On Break' : 'In Session')}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}