// ----------------- 1. RobustTimer.tsx (The Engine) -----------------
// This component is now "headless"—it has no UI. Its only job is to keep time.

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface RobustTimerHandle {
  start: () => void;
  pause: () => void;
  toggleBreak: () => void;
  endSession: () => { sessionTime: number; breakTime: number };
  getCurrentDisplayTimes: () => { session: number; break: number };
}

interface RobustTimerProps {
  isActive: boolean;
  isOnBreak: boolean;
}

const RobustTimer = forwardRef<RobustTimerHandle, RobustTimerProps>(
  ({ isActive, isOnBreak }, ref) => {
    const [sessionTime, setSessionTime] = useState(0);
    const [breakTime, setBreakTime] = useState(0);
    // --- FIX: Initialize the ref with null and update its type ---
    // This tells TypeScript that the ref can hold a number OR null,
    // which correctly represents its state before the timer starts.
    const animationFrameRef = useRef<number | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);
    const lastKnownBreakState = useRef<boolean>(isOnBreak);

    const timerLoop = useCallback(() => {
      const now = Date.now();
      const delta = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;
      accumulatedTimeRef.current += delta;
      animationFrameRef.current = requestAnimationFrame(timerLoop);
    }, []);

    useEffect(() => {
      if (isActive) {
        lastUpdateTimeRef.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(timerLoop);
      } else {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null; // Clean up the ref value
        }
      }
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null; // Clean up the ref value on unmount
        }
      };
    }, [isActive, timerLoop]);

    useEffect(() => {
      if (isActive) {
        // Check if the break state has actually changed
        if (isOnBreak !== lastKnownBreakState.current) {
          // If we were on a break and now we are not
          if (lastKnownBreakState.current) {
            setBreakTime(prev => prev + accumulatedTimeRef.current);
          } else { // If we were in a session and now we are on break
            setSessionTime(prev => prev + accumulatedTimeRef.current);
          }
          // Reset accumulators for the new state
          accumulatedTimeRef.current = 0;
          lastUpdateTimeRef.current = Date.now();
        }
      }
      // Always update the last known state
      lastKnownBreakState.current = isOnBreak;
    }, [isOnBreak, isActive]);

    useImperativeHandle(ref, () => ({
      start: () => {
        setSessionTime(0);
        setBreakTime(0);
        accumulatedTimeRef.current = 0;
        lastKnownBreakState.current = false; // Start in a focus state
      },
      pause: () => {
        if (lastKnownBreakState.current) {
          setBreakTime(prev => prev + accumulatedTimeRef.current);
        } else {
          setSessionTime(prev => prev + accumulatedTimeRef.current);
        }
        accumulatedTimeRef.current = 0;
      },
      toggleBreak: () => { /* Logic is now fully handled by the useEffect hook */ },
      endSession: () => {
        let finalSessionTime = sessionTime;
        let finalBreakTime = breakTime;
        if (isActive) {
          if (isOnBreak) {
            finalBreakTime += accumulatedTimeRef.current;
          } else {
            finalSessionTime += accumulatedTimeRef.current;
          }
        }
        return { sessionTime: finalSessionTime, breakTime: finalBreakTime };
      },
      getCurrentDisplayTimes: () => {
        let currentSession = sessionTime;
        let currentBreak = breakTime;
        // If the timer is active, add the accumulated time to the current session or break
        if (isActive) {
          if (isOnBreak) {
            currentBreak += accumulatedTimeRef.current;
          } else {
            currentSession += accumulatedTimeRef.current;
          }
        }
        return { session: currentSession, break: currentBreak };
      }
    }));

    return null; // This component renders no UI
  }
);

// --- FIX: Add a display name to the component for better debugging ---
RobustTimer.displayName = 'RobustTimer';

export default RobustTimer;
