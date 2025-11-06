import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Play, Clock, Target, TrendingUp } from 'lucide-react';
import { Session } from '@/types'; // <-- 1. IMPORT THE TYPE
import { FormatCalculatedDuration } from '@/lib/timeUtils';
import { AiSuggestion } from './ai-suggestion';

interface DashboardProps {
  sessions: Session[];
  onStartSession: () => void;
}

export function Dashboard({ sessions, onStartSession }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(session => session.date === today);

  // Calculate today's stats
  const totalFocusTime = todaySessions.reduce((acc, session) => acc + (session.sessionTime / 1000), 0);
  // (session.sessionTime / 1000)
  const totalBreakTime = todaySessions.reduce((acc, session) => acc + (session.breakTime / 1000), 0);
  const sessionCount = todaySessions.length;

  // Calculate this week's stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartString = weekStart.toISOString().split('T')[0];

  const thisWeekSessions = sessions.filter(session => session.date >= weekStartString);
  const weeklySessionTime = thisWeekSessions.reduce((acc, session) => acc + (session.sessionTime / 1000), 0);
  const weeklySessionCount = thisWeekSessions.length;

  // Get session type breakdown for today
  const typeBreakdown = todaySessions.reduce((acc: { [key: string]: number }, session) => {
    acc[session.type] = (acc[session.type] || 0) + session.sessionTime;
    return acc;
  }, {});

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Coding': 'bg-blue-100 text-blue-800',
      'Learning': 'bg-green-100 text-green-800',
      'Practice': 'bg-purple-100 text-purple-800',
      'Exercise': 'bg-red-100 text-red-800',
      'Planning': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  const recentSessions = [...sessions]
    .sort((a, b) => b.startTime - a.startTime) // sort by latest startTime
    .slice(0, 3); // take top 3

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-medium">FocusFlow</h1>
        <p className="text-muted-foreground">Track your productivity and build better work habits</p>

        <Button
          onClick={onStartSession}
          size="lg"
          className="px-8"
        >
          <Play className="mr-2 h-5 w-5" />
          Start New Session
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionCount}</div>
            <p className="text-xs text-muted-foreground">
              {sessionCount > 0 ? 'Keep it up!' : 'Start your first session'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(totalFocusTime)}</div>
            <p className="text-xs text-muted-foreground">
              {totalBreakTime > 0 && `+${formatTime(totalBreakTime)} breaks`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklySessionCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatTime(weeklySessionTime)} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Activity Breakdown */}
        {Object.keys(typeBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(typeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, time]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Badge className={getTypeColor(type)}>
                        {type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {FormatCalculatedDuration(0, time)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <AiSuggestion sessions={sessions} /> */}
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{session.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.sessionTime / 1000)} • {new Date(session.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getTypeColor(session.type)}>
                      {session.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>A Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <AiSuggestion sessions={sessions} />

          </CardContent>
        </Card>
      </div>
      {sessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">Ready to start your first session?</h3>
            <p className="text-muted-foreground mb-4">
              Track your focus time and build productive habits with DeepSession.
            </p>
            <Button onClick={onStartSession}>
              <Play className="mr-2 h-4 w-4" />
              Start Your First Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}