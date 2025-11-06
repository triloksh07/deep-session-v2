import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Calendar, FileText } from 'lucide-react';
import { Session } from '@/types'; // <-- 1. IMPORT THE TYPE
// --- 1. IMPORT THE CONFIG ---
import { DEFAULT_SESSION_TYPES } from '@/config/sessionTypes.config';

// --- 2. CREATE A MAP FOR EASY LOOKUP ---
const sessionTypeMap = new Map<string, { label: string, color: string }>(
  DEFAULT_SESSION_TYPES.map(type => [type.id, { label: type.label, color: type.color }])
);
const getSessionTypeInfo = (id: string) => {
  return sessionTypeMap.get(id) || { label: id, color: '#808080' }; // Fallback
};

interface SessionLogProps {
  sessions: Session[];
}

export function SessionLog({ sessions }: SessionLogProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

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
                  <Card key={session.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{session.title}</h3>
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <span>{formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                          </div>
                        </div>
                        {/* --- 5. USE THE LABEL IN THE BADGE --- */}
                        <Badge className={getTypeColor(session.type)}>
                          {typeInfo.label}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 mb-3 text-muted-foreground">
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
                        <div className="flex items-start space-x-2 text-muted-foreground">
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                          <p className="text-sm">{session.notes}</p>
                        </div>
                      )}
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