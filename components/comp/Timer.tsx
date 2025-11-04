import React, { useState, useEffect } from 'react';
import { useSession } from './contexts/SessionContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Play, Pause, Square, Coffee, RotateCcw } from 'lucide-react';

export function Timer() {
  const {
    activeSession,
    sessionTypes,
    isLoading,
    startSession,
    takeBreak,
    resumeSession,
    endSession,
    updateSession
  } = useSession();

  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);

  // Set default session type
  useEffect(() => {
    if (sessionTypes.length > 0 && !selectedTypeId) {
      const defaultType = sessionTypes.find(t => t.name === 'Coding') || sessionTypes[0];
      setSelectedTypeId(defaultType.id);
    }
  }, [sessionTypes, selectedTypeId]);

  // Update session title and note when changed
  useEffect(() => {
    if (activeSession) {
      setTitle(activeSession.title);
      setNote(activeSession.note);
    }
  }, [activeSession]);

  // Timer calculation
  useEffect(() => {
    if (!activeSession) {
      setCurrentTime(0);
      setBreakTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = new Date(activeSession.startedAt).getTime();
      
      if (activeSession.status === 'running') {
        const totalElapsed = now - startTime;
        const focusTime = totalElapsed - (activeSession.totalBreakMs || 0);
        setCurrentTime(Math.max(0, focusTime));
      } else if (activeSession.status === 'paused') {
        // Calculate current break time
        const lastBreak = activeSession.breaks[activeSession.breaks.length - 1];
        if (lastBreak && !lastBreak.endedAt) {
          const breakElapsed = now - new Date(lastBreak.startedAt).getTime();
          setBreakTime(breakElapsed);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!selectedTypeId) return;
    await startSession(selectedTypeId, title, note);
  };

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    if (activeSession) {
      await updateSession(activeSession.id, { title: newTitle });
    }
  };

  const handleNoteChange = async (newNote: string) => {
    setNote(newNote);
    if (activeSession) {
      await updateSession(activeSession.id, { note: newNote });
    }
  };

  const selectedType = sessionTypes.find(t => t.id === selectedTypeId);

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Timer Display */}
        <div className="text-center space-y-4">
          {activeSession ? (
            <div>
              <div className="text-6xl font-mono tracking-wider text-gray-900 dark:text-white">
                {activeSession.status === 'paused' ? formatTime(breakTime) : formatTime(currentTime)}
              </div>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedType?.color || '#6B7280' }}
                />
                <span className="text-lg text-gray-600 dark:text-gray-300">
                  {activeSession.status === 'paused' ? 'Break Time' : selectedType?.name || 'Focus Session'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-6xl font-mono tracking-wider text-gray-400 dark:text-gray-500">
                0:00
              </div>
              <p className="text-lg text-gray-500 dark:text-gray-400">Ready to start focusing?</p>
            </div>
          )}
        </div>

        {/* Session Configuration */}
        {!activeSession && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose session type" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Session Title (Optional)</Label>
              <Input
                placeholder="e.g., React component development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Session Notes */}
        <div className="space-y-2">
          <Label>Quick Notes</Label>
          <Textarea
            placeholder="Jot down thoughts, ideas, or notes during your session..."
            value={note}
            onChange={(e) => activeSession ? handleNoteChange(e.target.value) : setNote(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!activeSession ? (
            <Button
              onClick={handleStart}
              disabled={!selectedTypeId || isLoading}
              className="h-14 px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Focus Session
            </Button>
          ) : (
            <>
              {activeSession.status === 'running' ? (
                <>
                  <Button
                    onClick={takeBreak}
                    disabled={isLoading}
                    variant="outline"
                    className="h-12 px-6"
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    Take Break
                  </Button>
                  <Button
                    onClick={endSession}
                    disabled={isLoading}
                    variant="outline"
                    className="h-12 px-6 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={resumeSession}
                    disabled={isLoading}
                    className="h-12 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resume Focus
                  </Button>
                  <Button
                    onClick={endSession}
                    disabled={isLoading}
                    variant="outline"
                    className="h-12 px-6 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Active Session Info */}
        {activeSession && (
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            {title && (
              <>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-center border-none text-lg font-medium bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-colors"
                  placeholder="Add a title for this session"
                />
              </>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Started at {new Date(activeSession.startedAt).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}