'use client';

import React, { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileText, Edit, Trash2 } from 'lucide-react';
import type { Session } from '@/types';
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';
// import { useUpdateSession, useDeleteSession } from '@/hooks/useSessionMutations';
import { useUpdateSession, useDeleteSession } from '@/hooks/new/useSessionMutations';
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
import { useAuth } from '@/context/AuthProvider'
import { useDashboard } from '../_components/DashboardProvider';

// Helper: build map for session type lookup
const sessionTypeMap = new Map<string, { label: string; color: string }>(
  DEFAULT_SESSION_TYPES.map((type) => [type.id, { label: type.label, color: type.color }])
);
const getSessionTypeInfo = (id: string) => sessionTypeMap.get(id) || { label: id, color: '#808080' };

// Lightweight skeleton used as Suspense fallback. Kept local so we don't need an extra file.
function SessionsListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-6 w-40 rounded bg-muted-foreground/10 animate-pulse" />
      <div className="space-y-3">
        <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
        <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
        <div className="h-24 rounded-md bg-muted-foreground/5 animate-pulse" />
      </div>
    </div>
  );
}

// SessionsContent: reads data from DashboardProvider and renders the list.
// It intentionally *uses* useDashboard() so it can suspend independently.
function SessionsContent({ onEdit, onRequestDelete }: { onEdit: (s: Session) => void; onRequestDelete: (s: Session) => void; }) {
  const { sessions } = useDashboard();
  const sessionList = sessions ?? [];

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const groupedSessions = sessionList.reduce((groups: Record<string, Session[]>, session) => {
    const date = session.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(session);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sessionList.length === 0) {
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
            <span className="text-xs">({groupedSessions[date].length} session{groupedSessions[date].length !== 1 ? 's' : ''})</span>
          </div>

          <div className="space-y-3">
            {groupedSessions[date]
              .sort((a, b) => b.startTime - a.startTime)
              .map((session) => {
                const typeInfo = getSessionTypeInfo(session.type);
                return (
                  <Card key={`${session.id}-${session.startTime}`} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4 grid grid-cols-2 gap-2">
                      <div className="col-span-2 flex items-start justify-between mb-3">
                        <div className="flex justify-center items-center space-x-3">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1 truncate">{session.title}</h3>
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
                        <Badge variant="default" className="capitalize">
                          {typeInfo.label}
                        </Badge>
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="destructive" className="p-1" onClick={() => onRequestDelete(session)}>
                            <Trash2 size={16} />
                          </Button>
                          <Button onClick={() => onEdit(session)} className="p-1" variant="ghost">
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
    </div>
  );
}

export default function SessionLog() {
  const { userId } = useDashboard();
  // const {
  //   sessions,
  //   updateSession,
  //   deleteSession,
  // } = useDashboard();
  // Local UI state and mutations live here (outside Suspense)
  const { mutate: updateSession, isPending: isUpdating } = useUpdateSession(userId);
  const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession(userId);

  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<Session | null>(null);

  const handleEditClick = (session: Session) => {
    setEditingSession(session);
    setNewTitle(String(session.title || ''));
  };

  const handleSaveEdit = () => {
    if (!editingSession) return;
    if (newTitle.trim() !== '') {
      // const dataToUpdate = { id: editingSession.id, updates: { title: newTitle } }
      updateSession({ id: editingSession.id, updates: { title: newTitle } });
    }
    setEditingSession(null);
  };

  const handleRequestDelete = (session: Session) => {
    setDeleteCandidate(session);
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    deleteSession(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  return (
    <div className="space-y-6">
      {/* SSR-shellable header: render immediately */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your session logs and activity history.</p>
        </CardContent>
      </Card>

      {/* Suspense boundary for the sessions list - shows skeleton while data loads */}
      <Suspense fallback={<SessionsListSkeleton />}>
        <SessionsContent onEdit={handleEditClick} onRequestDelete={handleRequestDelete} />
      </Suspense>

      {/* Edit Dialog - outside Suspense and controlled by local state */}
      <Dialog open={!!editingSession} onOpenChange={(isOpen) => !isOpen && setEditingSession(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit session title</DialogTitle>
            <DialogDescription>Make changes to your session title here. Click save when you're done.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="col-span-3" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog - single shared dialog outside Suspense */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your session: <br />
              "{deleteCandidate?.title || 'Untitled Session'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCandidate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
