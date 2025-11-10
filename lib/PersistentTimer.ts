// ----------------- 2. PersistentTimer.tsx (The Engine) -----------------
// This component is "headless"—it has no UI. Its only job is to keep time.

'use client';

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
// import { useSessionStore } from '@/store/oldMainSessionStore';
import { useSessionStore } from '@/store/sessionStore';
import { useShallow } from 'zustand/react/shallow';

export interface TimerHandle {
  start: () => void;
  getCurrentDisplayTimes: () => { session: number; break: number };
  endSession: () => { sessionTime: number; breakTime: number };
}

interface PersistentTimerProps {
  isActive: boolean;
  isOnBreak: boolean;
  onTick: (sessionMs: number, breakMs: number) => void;
}

const PersistentTimer = forwardRef<TimerHandle, PersistentTimerProps>(
  ({ isActive, isOnBreak, onTick }: PersistentTimerProps, ref) => {
    const sessionElapsed = useRef(0);
    const breakElapsed = useRef(0);
    const lastTimestamp = useRef<number | null>(null);

    // Get the raw state from the store for rehydration
    const { sessionStartTime, breaks, onBreak: isRehydratedOnBreak } = useSessionStore(
      useShallow((state) => ({
        sessionStartTime: state.sessionStartTime,
        breaks: state.breaks,
        onBreak: state.onBreak,
      }))
    );

    // CRITICAL FIX: This effect now correctly handles rehydration, including active breaks.
    useEffect(() => {
      // if (!isActive || !sessionStartTime) return;
      if (isActive && sessionStartTime) {
        console.log("Rehydrating timer state...");
        console.log(`Session Start Time: ${sessionStartTime}`);

        // 1. Ensure startTime is a valid number (milliseconds)
        const startTimeMs = new Date(sessionStartTime).getTime();
        if (isNaN(startTimeMs)) {
          console.error("Rehydration failed: Invalid start time from store.");
          return;
        }

        // 2. Calculate the duration of all COMPLETED breaks
        let completedBreakDuration = 0;
        const completedBreaks = breaks.filter(b => b.start && b.end);
        completedBreaks.forEach(b => {
          completedBreakDuration += new Date(b.end!).getTime() - new Date(b.start).getTime();
        });

        // 3. Check if we rehydrated while a break was active
        if (isRehydratedOnBreak) {
          const lastBreak = breaks[breaks.length - 1];
          if (lastBreak && !lastBreak.end) {
            const lastBreakStartMs = new Date(lastBreak.start).getTime();
            const elapsedSinceBreakStarted = Date.now() - lastBreakStartMs;

            // The total break time is completed breaks + the current active one
            breakElapsed.current = completedBreakDuration + elapsedSinceBreakStarted;
          }
        } else {
          breakElapsed.current = completedBreakDuration;
        }

        // 4. Calculate total session time based on the above
        const totalElapsedSinceStart = Date.now() - startTimeMs;
        sessionElapsed.current = totalElapsedSinceStart - breakElapsed.current;

        console.log(`Rehydrated with Session: ${sessionElapsed.current}ms, Break: ${breakElapsed.current}ms`);
        // Synchronously push the rehydrated time to the parent
        // This happens *before* the first paint.
        onTick(sessionElapsed.current, breakElapsed.current);
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      isActive,
      sessionStartTime,
      breaks,
      isRehydratedOnBreak,
      onTick
    ]); // Runs only on Mount
    // isActive, isOnBreak, sessionStartTime, breaks, isRehydratedOnBreak

    // New Core Timing Loop with requestAnimationFrame
    useEffect(() => {
      let frameId: number | null = null;
      // local flag so tick knows whether it should continue scheduling frames
      let running = false;

      const tick = (now: number) => {
        if (!running) return; // safety: stop if we've been told to stop

        if (lastTimestamp.current !== null) {
          const delta = now - lastTimestamp.current;
          if (isOnBreak) {
            breakElapsed.current += delta;
          } else if (isActive) {
            sessionElapsed.current += delta;
          }
          // if neither, don't add anywhere
        }
        lastTimestamp.current = now;
        // --- PUSH ON EVERY TICK ---
        // Let the engine push its state to the page
        onTick(sessionElapsed.current, breakElapsed.current);
        frameId = requestAnimationFrame(tick);
      };

      // Start only when needed
      running = !!(isActive || isOnBreak);
      if (running) {
        // preserve lastTimestamp to avoid large jump; initialize if null
        lastTimestamp.current = lastTimestamp.current ?? performance.now();
        frameId = requestAnimationFrame(tick);
      } else {
        // clear timestamp so resume uses a fresh baseline
        lastTimestamp.current = null;
      }
      return () => {
        // stop loop and cancel scheduled frame
        running = false;
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      };
    }, [isActive, isOnBreak]);

    useImperativeHandle(ref, () => ({
      // 👇 2. Implement the `start` method
      start() {
        console.log("Timer engine counters reset.");
        sessionElapsed.current = 0;
        breakElapsed.current = 0;
        // Set the timestamp to start counting immediately without a delay
        lastTimestamp.current = performance.now();
      },
      getCurrentDisplayTimes() {
        return { session: sessionElapsed.current, break: breakElapsed.current };
      },
      endSession() {
        // Return a clean final number.
        return {
          sessionTime: Math.round(sessionElapsed.current),
          breakTime: Math.round(breakElapsed.current),
        };
      },
    }));

    return null;
  }
);

PersistentTimer.displayName = 'PersistentTimer';

export default PersistentTimer;