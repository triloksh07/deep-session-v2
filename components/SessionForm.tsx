import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';

interface SessionFormProps {
  onSubmit: (sessionData: any) => void;
  onCancel: () => void;
}
 
export function SessionForm({ onSubmit, onCancel }: SessionFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  // --- DELETE THE OLD HARD-CODED LIST ---
  // const sessionTypes = [
  //   'Coding',
  //   'Learning',
  //   'Practice', 
  //   'Exercise',
  //   'Planning',
  //   'Other'
  // ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      type: type || 'Other',
      notes: notes.trim()
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-2 bg-background ">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start New Session</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you working on?"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Session Type</Label>
              {/* Update the Select component */}
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                   {/* Map over the config file */}
                  {DEFAULT_SESSION_TYPES.map((sessionType) => (
                    <SelectItem key={sessionType.id} value={sessionType.id}>
                      {sessionType.label} {/* Show the Label, save the ID */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any initial thoughts or goals for this session..."
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                Start Session
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}