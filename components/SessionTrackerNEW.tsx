'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Square, Coffee, Loader2 } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer';
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import { auth, db } from '@/lib/firebase'; // 1. Import 'db'
// 2. Import all necessary Firestore functions
import { 
  runTransaction, 
  doc, 
  collection 
} from 'firebase/firestore'; 

// 3. We no longer import useCreateSession

export function SessionTracker() {
  // 4. We ONLY need 'toggleBreak' from the store now
  const { 
    isActive, 
    isOnBreak, 
    title, 
    type, 
    notes,
    sessionStartTime, 
    breaks,
    toggleBreak
  } = useSessionStore(
    useShallow((state) => ({
      isActive: state.isActive,
      isOnBreak: state.onBreak,
      title: state.title,
      type: state.type,
      notes: state.notes,
      sessionStartTime: state.sessionStartTime,
      breaks: state.breaks,
      toggleBreak: state.toggleBreak,
      // We no longer need clearActiveSession
    }))
  );

  // 5. We need a local loading state for the button
  const [isEnding, setIsEnding] = useState(false);

  const timerEngineRef = useRef<TimerHandle>(null);
  const [displaySession, setDisplaySession] = useState(0);
  const [displayBreak, setDisplayBreak] = useState(0);

  // ... (UI tick loop and formatTime are fine)
  useEffect(() => { /* ... */ }, [isActive]);
  const formatTime = (milliseconds: number) => { /* ... */ };

  // --- 6. THIS IS THE NEW ATOMIC "End Session" flow ---
  const handleEndSession = async () => {
    if (!timerEngineRef.current || !sessionStartTime || isEnding) {
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setIsEnding(true); // Set loading state

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

    // 3. Define our "lock" doc (the active session)
    const activeSessionRef = doc(db, 'active_sessions', user.uid);
    // Define the new session doc
    const newSessionRef = doc(collection(db, 'sessions')); // Creates a new ref

    try {
      // 4. Run the transaction
      await runTransaction(db, async (transaction) => {
        // 4a. Read the "lock" doc
        const activeDoc = await transaction.get(activeSessionRef);
        
        if (!activeDoc.exists()) {
          // It's already gone! Another device (or offline sync)
          // already ended this session. We must do nothing.
          console.log("Session already ended by another device. Aborting.");
          return; // Abort the transaction
        }
        
        // 4b. The doc exists, so we are the "winner".
        // Create the new finished session...
        transaction.set(newSessionRef, finalV0Data);
        // ...and delete the active session "lock"
        transaction.delete(activeSessionRef);
      });
      
      // 5. Transaction is complete (or queued offline).
      // The `useSyncActiveSession` hook will now see the
      // deletion of the active doc and automatically hide this component.
      
      // We don't need to setIsEnding(false) because the component will unmount.

    } catch (error) {
      // 6. The transaction failed (e.g., network error after retries)
      console.error("End session transaction failed:", error);
      // We can show a toast here: "Failed to save, will retry."
      setIsEnding(false); // Re-enable the button
    }
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
          <CardHeader> {/* ... (Header) ... */} </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* ... (Timer display JSX) ... */}
            
            <div className="flex justify-center space-x-4">
                <Button
                  onClick={toggleBreak} // 7. Call store action
                  variant="outline"
                  size="lg"
                  className={isOnBreak ? 'bg-orange-100 border-orange-300' : ''}
                  disabled={isEnding}
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  {isOnBreak ? 'End Break' : 'Break'}
                </Button>
                
                <Button
                  onClick={handleEndSession} // 8. Call our new transaction handler
                  variant="destructive"
                  size="lg"
                  disabled={isEnding}
                >
                  {isEnding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                  {isEnding ? 'Saving...' : 'End'}
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}