import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, Square, Coffee, PictureInPicture } from 'lucide-react';
import html2canvas from 'html2canvas';

interface SessionTrackerProps {
  onSessionEnd: (sessionData: any) => void;
  // isActive: boolean;
  onSessionStart: () => void;
}

export function SessionTracker({ onSessionEnd, isActive, onSessionStart }: SessionTrackerProps) {
  const [sessionTime, setSessionTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);


  // --- NEW: Refs for Picture-in-Picture ---
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackerCardRef = useRef<HTMLDivElement>(null); // Ref to the component we want to capture
  const pipIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (isOnBreak) {
          setBreakTime(prev => prev + 1);
        } else {
          setSessionTime(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, isOnBreak]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  // --- NEW: Function to update the PiP window ---
  const updatePipWindow = async () => {
    if (!trackerCardRef.current || !pipCanvasRef.current || !pipVideoRef.current) return;

    // 1. Use html2canvas to draw the UI onto our hidden canvas
    const canvas = await html2canvas(trackerCardRef.current, { backgroundColor: null });
    const ctx = pipCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, pipCanvasRef.current.width, pipCanvasRef.current.height);
      ctx.drawImage(canvas, 0, 0, pipCanvasRef.current.width, pipCanvasRef.current.height);
    }
  };

  // --- NEW: Function to start Picture-in-Picture mode ---
  const handleEnterPip = async () => {
    if (!pipVideoRef.current || !pipCanvasRef.current) return;

    // 2. Create a video stream from our canvas
    const stream = pipCanvasRef.current.captureStream();
    pipVideoRef.current.srcObject = stream;
    pipVideoRef.current.play();

    //  --- FIX: Wait for the video metadata to load before requesting PiP ---
    pipVideoRef.current.onloadedmetadata = async () => {
        try {
            // Request to open the PiP window
            await pipVideoRef.current!.requestPictureInPicture();
            
            // Start an interval to update the PiP window every second
            pipIntervalRef.current = setInterval(updatePipWindow, 1000);

            // Listen for when the user closes the PiP window
            pipVideoRef.current!.onleavepictureinpicture = () => {
                if (pipIntervalRef.current) clearInterval(pipIntervalRef.current);
            }

        } catch (error) {
            console.error("Failed to enter Picture-in-Picture mode:", error);
        }
  };
}

  const handleStart = () => {
    onSessionStart();
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleBreak = () => {
    if (isOnBreak) {
      // Resume from break
      setIsOnBreak(false);
      setIsPaused(false);
    } else {
      // Start break
      setIsOnBreak(true);
      setIsPaused(false);
    }
  };

  const handleEnd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // if (pipIntervalRef.current) clearInterval(pipIntervalRef.current); // Stop PiP updates
    
    //* Close PiP window if it's open
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    }
    
    const sessionData = {
      id: Date.now(),
      title: currentSession?.title || 'Untitled Session',
      type: currentSession?.type || 'Other',
      notes: currentSession?.notes || '',
      sessionTime,
      breakTime,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    
    onSessionEnd(sessionData);

    const updateCurrentSession = (sessionData: any) => {
      setCurrentSession(sessionData);
    };

    updateCurrentSession(sessionData);
    
    // Reset everything
    setSessionTime(0);
    setBreakTime(0);
    setIsRunning(false);
    setIsPaused(false);
    setIsOnBreak(false);
    setCurrentSession(null);
    startTimeRef.current = null;
  };
  // If not active, don't render the tracker
  // This allows the tracker to be conditionally rendered based on the active state
  if (!isActive) {
    return null;
  }


  return (
    <>
          {/* --- NEW: Hidden elements required for PiP --- */}
        

        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
          {/* We add the ref to the Card we want to capture */}
          <Card className="w-full max-w-md" >
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-muted-foreground">
                {currentSession?.title || 'Focus Session'}
              </CardTitle>
              <div className="text-muted-foreground">
                {currentSession?.type || 'Session'} • Session {Math.floor((sessionTime + breakTime) / 1500) + 1}
              </div>
              {/* NEW: Button to trigger PiP mode */}
            <Button onClick={handleEnterPip} variant="ghost" size="sm">
                <PictureInPicture className="h-4 w-4" />
            </Button>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              {/* Main Timer Display */}
              <div className="space-y-2">
                <div className={`transition-all duration-300 ${isOnBreak ? 'text-muted-foreground' : 'text-foreground'}`}>
                  <div className="text-6xl font-mono tracking-tight">
                    {formatTime(sessionTime)}
                  </div>
                  <div className="text-muted-foreground">Session Time</div>
                </div>
                
                {/* Break Timer */}
                {breakTime > 0 && (
                  <div className={`transition-all duration-300 ${isOnBreak ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className="text-2xl font-mono tracking-tight">
                      {formatTime(breakTime)}
                    </div>
                    <div className="text-muted-foreground">Break Time</div>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isOnBreak 
                      ? 'bg-orange-500' 
                      : isPaused 
                        ? 'bg-yellow-500' 
                        : isRunning 
                          ? 'bg-green-500' 
                          : 'bg-muted'
                  }`}
                  style={{ width: isRunning ? '100%' : '0%' }}
                />
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                {!isRunning ? (
                  <Button 
                    onClick={handleStart}
                    size="lg"
                    className="px-8"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePause}
                      variant="outline"
                      size="lg"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    
                    <Button
                      onClick={handleBreak}
                      variant="outline"
                      size="lg"
                      className={isOnBreak ? 'bg-orange-100 border-orange-300' : ''}
                    >
                      <Coffee className="mr-2 h-4 w-4" />
                      {isOnBreak ? 'End Break' : 'Break'}
                    </Button>
                    
                    <Button
                      onClick={handleEnd}
                      variant="destructive"
                      size="lg"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      End
                    </Button>
                  </>
                )}
              </div>

              {/* Current Status */}
              <div className="text-center text-muted-foreground">
                {isOnBreak ? 'On Break' : isPaused ? 'Paused' : isRunning ? 'In Session' : 'Ready to Start'}
              </div>
            </CardContent>
          </Card>
        </div>
     </>
 );
}