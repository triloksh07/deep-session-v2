'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle }from './ui/card';
import { Play, Pause, Square, Coffee, Loader2 } from 'lucide-react'; // Added Loader2

// 1. Import your store, timer engine, and NEW MUTATION
import { useSessionStore } from '@/store/timerStore';
import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer';
import { useShallow } from 'zustand/react/shallow';
import { useCreateSession } from '@/hooks/useCreateSession'; // <-- IMPORTED

export function SessionTracker() {
  // 2. Get state from the store
  const { isActive, isOnBreak, ...sessionInfo } = useSessionStore(
    useShallow((state) => ({
      isActive: state.isActive,
      isOnBreak: state.onBreak,
      title: state.title,
      type: state.type,
      notes: state.notes,
      startTime: state.sessionStartTime,
      breaks: state.breaks,
      toggleBreak: state.toggleBreak,
    }))
  );

  // 3. Setup the mutation hook
  const createSessionMutation = useCreateSession();

  // (The timerEngineRef, display state, UI tick loop, and formatTime are all unchanged)
  const timerEngineRef = useRef<TimerHandle>(null);
  const [displaySession, setDisplaySession] = useState(0);
  const [displayBreak, setDisplayBreak] = useState(0);

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

  const formatTime = (milliseconds: number) => {
    // ... (same as before)
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 4. THIS IS THE NEW "END SESSION" LOGIC
  const handleEndSession = () => {
    if (!timerEngineRef.current || !sessionInfo.startTime) return;

    // 1. Get final times from the engine
    const { sessionTime, breakTime } = timerEngineRef.current.endSession();

    // 2. Get current state data from the store
    const endTime = new Date().toISOString();

    // 3. Build the final session object
    const finalSessionData = {
      title: sessionInfo.title,
      type: sessionInfo.type,
      notes: sessionInfo.notes,
      startTime: sessionInfo.startTime,
      endTime: endTime,
      sessionTime: sessionTime, // Final number from engine
      breakTime: breakTime, // Final number from engine
      breaks: sessionInfo.breaks,
      date: new Date(sessionInfo.startTime).toISOString().split('T')[0],
    };

    // 4. Call the mutation!
    // This will save to Firebase, then reset the store on success.
    createSessionMutation.mutate(finalSessionData);
  };

  if (!isActive) {
    return null; 
  }

  return (
    <>
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