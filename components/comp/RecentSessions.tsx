import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useSession } from './contexts/SessionContext';
import { supabaseUrl } from './utils/supabase/info';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trash2, Edit3, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  typeId: string;
  title: string;
  note: string;
  startedAt: string;
  endedAt: string;
  totalFocusMs: number;
  totalBreakMs: number;
  status: string;
}

export function RecentSessions() {
  const { accessToken } = useAuth();
  const { sessionTypes, startSession } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!accessToken) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `${supabaseUrl}/functions/v1/make-server-eb7eb3f5/sessions?from=${today}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const completedSessions = data.filter((s: Session) => s.status === 'ended');
          setSessions(completedSessions);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [accessToken]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getSessionTypeName = (typeId: string) => {
    const type = sessionTypes.find(t => t.id === typeId);
    return type?.name || 'Unknown';
  };

  const getSessionTypeColor = (typeId: string) => {
    const type = sessionTypes.find(t => t.id === typeId);
    return type?.color || '#6B7280';
  };

  const handleDuplicate = async (session: Session) => {
    await startSession(session.typeId, session.title, session.note);
    toast.success('New session started with same settings');
  };

  const handleDelete = async (sessionId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-eb7eb3f5/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        toast.success('Session deleted');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Today's Sessions</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Today's Sessions</h3>
        <Badge variant="outline">
          {sessions.length} completed
        </Badge>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No completed sessions today</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Start a focus session to see your progress here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getSessionTypeColor(session.typeId) }}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.title || getSessionTypeName(session.typeId)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {getSessionTypeName(session.typeId)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {formatTime(session.totalFocusMs)} focus
                    </span>
                    {session.totalBreakMs > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(session.totalBreakMs)} break
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(session.startedAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(session)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(session.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}