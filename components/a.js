import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Calendar, FileText } from 'lucide-react';
import { Session } from '@/types';
// --- 1. IMPORT THE CONFIG ---
import { DEFAULT_SESSION_TYPES } from '@/lib/sessionTypes';

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
  // ... (formatTime, formatDate, formatDateTime are fine)

  const getTypeColor = (typeId: string) => {
    // --- 3. UPDATE THIS FUNCTION ---
    const colors: { [key: string]: string } = {
      'coding': 'bg-blue-100 text-blue-800',
      'learning': 'bg-green-100 text-green-800',
      'practice': 'bg-purple-100 text-purple-800',
      'exercise': 'bg-red-100 text-red-800',
      'planning': 'bg-yellow-100 text-yellow-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[typeId] || colors['other'];
    // We can use the color from the config later, but this works for now.
  };

  // ... (grouping logic is fine)

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-3">
          {/* ... (date header) ... */}
          
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
                        {/* ... (title and time) ... */}
                        
                        {/* --- 5. USE THE LABEL IN THE BADGE --- */}
                        <Badge className={getTypeColor(session.type)}>
                          {typeInfo.label} 
                        </Badge>
                      </div>
                      
                      {/* ... (rest of the card) ... */}
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