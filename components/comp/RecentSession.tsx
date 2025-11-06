'use client';
import { useState, useMemo } from 'react';
import { Edit, Copy, Trash2, X } from 'lucide-react';
import { useSessionStore } from '@/store/oldMainSessionStore';
import { useShallow } from 'zustand/shallow';
import { formatISOTime, FormatCalculatedDuration } from '@/lib/timeUtils';
import type { Session } from '@/types/typeDeclaration';

// --- Import Shadcn Components ---
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
// ---------------------------------


// Helper function to format the date headings
const getDisplayDate = (dateString: string): string => {
    // ... (no change)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const inputDate = new Date(dateString);

    if (inputDate.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (inputDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return inputDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

//  Recent Sessions Section Components
const RecentSessions = () => {

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // --- NEW UI STATE ---
    // State to track which session is being edited
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    // State to hold the new title value in the input
    const [newTitle, setNewTitle] = useState('');
    // --------------------

    const {
        recentSessions,
        deleteSession,
        updateSessionTitle
    } = useSessionStore(useShallow(
        (state) => ({
            recentSessions: state.recentSessions,
            deleteSession: state.deleteSession,
            updateSessionTitle: state.updateSessionTitle,
        })
    )
    );

    // ... (groupedSessions and sortedGroupedDates memos are unchanged)
    const groupedSessions = useMemo(() => {
        return recentSessions.reduce((acc: { [key: string]: Session[] }, session) => {
            const sessionDate = session.started_at.split('T')[0];
            if (!acc[sessionDate]) {
                acc[sessionDate] = [];
            }
            acc[sessionDate].push(session);
            return acc;
        }, {});
    }, [recentSessions]);

    const sortedGroupedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());


    const sessionsToDisplay = selectedDate ? { [selectedDate]: groupedSessions[selectedDate] || [] } : groupedSessions;
    const datesToDisplay = selectedDate ? (groupedSessions[selectedDate] ? [selectedDate] : []) : sortedGroupedDates;


    // --- MODIFIED HANDLER FUNCTIONS ---

    // This function is now just for handling the "Save" click in the Dialog
    const handleSaveEdit = () => {
        if (newTitle.trim() !== "" && editingSession) {
            updateSessionTitle(editingSession.id, newTitle.trim());
        }
        // Close the dialog
        setEditingSession(null);
    };

    // This function opens the dialog and pre-fills the state
    const handleEditClick = (session: Session) => {
        setEditingSession(session);
        setNewTitle(String(session.title || ''));
    };

    // The delete logic is now moved directly into the AlertDialog component
    const handleDeleteConfirm = (sessionId: string) => {
        deleteSession(sessionId);
    };

    // --- END HANDLERS ---

    return (
        <div className="mt-6 border border-main-accent/20 bg-dark-bg rounded-xl p-4 shadow-lg">
            {/* ... (Header and date filter UI is unchanged) */}
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-white text-lg font-semibold">Recent Sessions</h2>
                <div className="flex items-center space-x-2">
                    <input
                        title='date'
                        type="date"
                        value={selectedDate || ''}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-[#2A2A2A] text-white text-sm px-2 py-1 rounded-md border border-[#8A2BE2]/40 cursor-pointer"
                    />
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="p-1.5 bg-[#2A2A2A] rounded-md border border-[#8A2BE2]/40 text-gray-400 hover:text-white"
                            title="Clear date filter"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-2">
                {datesToDisplay.length > 0 ? (
                    datesToDisplay.map(date => (
                        <div key={date}>
                            <h3 className="text-main-accent font-semibold text-sm my-3 px-1 sticky top-0 bg-dark-bg py-1">{getDisplayDate(date)}</h3>
                            {sessionsToDisplay[date].map(session => (
                                <div key={session.id} className={'p-3 mb-2 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors duration-200'}>
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <h4 className="text-white font-medium text-base">
                                                {session.title || 'Untitled Session'}
                                            </h4>
                                            <p className="text-gray-400 text-sm">
                                                {FormatCalculatedDuration(0, session.total_focus_ms)} &middot; {formatISOTime(session.started_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-400">
                                        
                                        {/* --- EDIT BUTTON (opens Dialog) --- */}
                                        <Button 
                                          onClick={() => handleEditClick(session)} 
                                          className="p-1 hover:text-white"
                                          variant="secondary"
                                        >
                                          <Edit size={16} />
                                        </Button>

                                        {/* <button className="p-1 hover:text-white"><Copy size={16} /></button> */}

                                        {/* --- DELETE BUTTON (opens AlertDialog) --- */}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="p-1 hover:text-white"><Trash2 size={16} /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your
                                                        session titled &quot;{session.title || 'Untitled Session'}&quot;.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                      onClick={() => handleDeleteConfirm(session.id)}
                                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                      Continue
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-400">No sessions found for this date.</p>
                    </div>
                )}
            </div>

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
                        <Button onClick={handleSaveEdit}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default RecentSessions;