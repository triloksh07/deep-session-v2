import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Calendar, FileText, Edit, Trash2 } from 'lucide-react';
import { Session } from '@/types'; // <-- 1. IMPORT THE TYPE
// --- 1. IMPORT THE CONFIG ---
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
import { useUpdateSession, useDeleteSession } from '@/hooks/useSessionMutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
// ---------------------------------

// --- 2. CREATE A MAP FOR EASY LOOKUP ---
const sessionTypeMap = new Map<string, { label: string, color: string }>(
  DEFAULT_SESSION_TYPES.map(type => [type.id, { label: type.label, color: type.color }])
);
const getSessionTypeInfo = (id: string) => {
  return sessionTypeMap.get(id) || { label: id, color: '#808080' }; // Fallback
};

const getSessionLabel = (id: string) => {
  return sessionTypeMap.get(id)?.label || id; // Fallback to showing the id
};

interface SessionLogProps {
  sessions: Session[];
}

export function SessionLog({ sessions }: SessionLogProps) {

  const { mutate: updateSession, isPending: isUpdating } = useUpdateSession();
  const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession();

  // --- NEW UI STATE ---
  // State to track which session is being edited
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  // State to hold the new title value in the input
  const [newTitle, setNewTitle] = useState('');
  const [sessionId, setSessionId] = useState('');
  // --------------------

  // --- MODIFIED HANDLER FUNCTIONS ---

  // This function opens the dialog and pre-fills the state
  const handleEditClick = (session: Session) => {
    setEditingSession(session);
    setNewTitle(String(session.title || ''));
  };

  const handleSaveEdit = (sessionId: string, newTitle: string) => {
    if (newTitle.trim() !== "" && editingSession) {
      updateSession({ id: sessionId, updates: { title: newTitle } });
    }
    // Close the dialog
    setEditingSession(null);
  };

  const handleDeleteConfirm = (sessionId: string) => {
    deleteSession(sessionId);
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeColor = (typeId: string) => {
    const colors: { [key: string]: string } = {
      'Coding': 'bg-blue-100 text-blue-800',
      'Learning': 'bg-green-100 text-green-800',
      'Practice': 'bg-purple-100 text-purple-800',
      'Exercise': 'bg-red-100 text-red-800',
      'Planning': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[typeId] || colors['Other'];
    // We can use the color from the config later, but this works for now.
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups: { [key: string]: Session[] }, session) => {
    const date = session.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No sessions yet. Start your first session to begin tracking!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center space-x-2 text-muted-foreground border-b pb-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(date)}</span>
            <span className="text-xs">
              ({groupedSessions[date].length} session{groupedSessions[date].length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="space-y-3">
            {groupedSessions[date]
              .sort((a, b) => b.startTime - a.startTime)
              .map((session) => {
                // --- 4. GET THE LABEL ---
                const typeInfo = getSessionTypeInfo(session.type);
                return (
                  <Card key={`${session.id}-${session.startTime}`} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4 grid grid-cols-2 gap-2">
                      <div className="col-span-2 flex items-start justify-between mb-3">
                        <div className="flex justify-center items-center space-x-3">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1 max--[90%] wrap-normal">{session.title}</h3>
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <span>{formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-start space-x-4 mb-3 text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Focus: {formatTime(session.sessionTime)}</span>
                        </div>
                        {session.breakTime > 0 && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Break: {formatTime(session.breakTime)}</span>
                          </div>
                        )}
                      </div>
                      {session.notes && (
                        <div className="col-span-2 flex items-start space-x-2 text-muted-foreground">
                          <FileText className="h-4 w-4 mt-0.5 shrink" />
                          <p className="text-sm">{session.notes}</p>
                        </div>
                      )}
                      <div className="col-span-2 relative flex items-center justify-between mt-4">
                        <Badge variant="default" className={getTypeColor(typeInfo.label)}>
                          {/* getTypeColor(session.type) */}
                          {typeInfo.label}
                          {/* {getSessionLabel(session.type)} */}
                        </Badge>
                        <div className="relaive flex items-center justify-center space-x-2">
                          {/* --- DELETE BUTTON (opens AlertDialog) --- */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="p-1 hover:text-white"><Trash2 size={16} /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete your
                                  session: <br /> &quot;{session.title || 'Untitled Session'}&quot;.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteConfirm(session.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={isDeleting}
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {/* --- EDIT BUTTON (opens Dialog) --- */}
                          <Button
                            onClick={() => { handleEditClick(session), setSessionId(session.id) }}
                            className="p-1 hover:text-primary"
                            variant="ghost"
                            disabled={isUpdating}
                          >
                            <Edit size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}

      {/* --- EDIT DIALOG (MODAL) --- */}
      {/* This sits outside the loop and is controlled by the 'editingSession' state */}
      <Dialog open={!!editingSession} onOpenChange={(isOpen) => !isOpen && setEditingSession(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit session title</DialogTitle>
            <DialogDescription>
              Make changes to your session title here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>Cancel</Button>
            <Button onClick={() => handleSaveEdit(sessionId, newTitle)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}