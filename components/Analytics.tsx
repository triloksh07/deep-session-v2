import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Clock, 
  TrendingUp, 
  Target, 
  Calendar,
  Activity,
  Zap,
  Award
} from 'lucide-react';

interface Session {
  id: number;
  title: string;
  type: string;
  notes: string;
  sessionTime: number;
  breakTime: number;
  startTime: number;
  endTime: number;
  date: string;
}

interface AnalyticsProps {
  sessions: Session[];
}

export function Analytics({ sessions }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Helper functions
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeDecimal = (seconds: number) => {
    return (seconds / 3600).toFixed(1);
  };

  const getDateRange = (range: 'week' | 'month' | 'year') => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (range) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        break;
      case 'year':
        start.setDate(now.getDate() - 365);
        break;
    }

    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  // Filter sessions by time range
  const { start, end } = getDateRange(timeRange);
  const filteredSessions = sessions.filter(session => 
    session.date >= start && session.date <= end
  );

  // Calculate summary statistics
  const totalSessions = filteredSessions.length;
  const totalFocusTime = filteredSessions.reduce((acc, session) => acc + session.sessionTime, 0);
  const totalBreakTime = filteredSessions.reduce((acc, session) => acc + session.breakTime, 0);
  const averageSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;

  // Calculate streak
  const today = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  const sortedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  let checkDate = new Date();
  
  for (const date of sortedDates) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (date === dateStr) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Session type breakdown
  const typeBreakdown = filteredSessions.reduce((acc: { [key: string]: number }, session) => {
    acc[session.type] = (acc[session.type] || 0) + session.sessionTime;
    return acc;
  }, {});

  const typeData = Object.entries(typeBreakdown).map(([type, time]) => ({
    name: type,
    value: Math.round(time / 3600 * 100) / 100, // Convert to hours with 2 decimal places
    count: filteredSessions.filter(s => s.type === type).length
  })).sort((a, b) => b.value - a.value);

  // Daily activity data
  const dailyData = filteredSessions.reduce((acc: { [key: string]: number }, session) => {
    acc[session.date] = (acc[session.date] || 0) + session.sessionTime;
    return acc;
  }, {});

  const dailyChartData = Object.entries(dailyData)
    .map(([date, time]) => ({
      date,
      hours: Math.round(time / 3600 * 100) / 100,
      sessions: filteredSessions.filter(s => s.date === date).length
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days

  // Hourly pattern analysis
  const hourlyPattern = filteredSessions.reduce((acc: { [key: number]: number }, session) => {
    const hour = new Date(session.startTime).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: hour.toString().padStart(2, '0') + ':00',
    sessions: hourlyPattern[hour] || 0
  }));

  // Weekly pattern
  const weeklyPattern = filteredSessions.reduce((acc: { [key: number]: number }, session) => {
    const day = new Date(session.date).getDay();
    acc[day] = (acc[day] || 0) + session.sessionTime;
    return acc;
  }, {});

  const weeklyData = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ].map((day, index) => ({
    day: day.slice(0, 3),
    hours: Math.round((weeklyPattern[index] || 0) / 3600 * 100) / 100
  }));

  // Colors for charts
  const COLORS = [
    '#3B82F6', // blue
    '#10B981', // green
    '#8B5CF6', // purple
    '#EF4444', // red
    '#F59E0B', // yellow
    '#6B7280'  // gray
  ];

  // Activity heatmap data (simplified version)
  const getLast90Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = filteredSessions.filter(s => s.date === dateStr);
      const totalTime = dayData.reduce((acc, session) => acc + session.sessionTime, 0);
      days.push({
        date: dateStr,
        sessions: dayData.length,
        totalTime,
        intensity: totalTime > 0 ? Math.min(Math.ceil(totalTime / 3600), 4) : 0
      });
    }
    return days;
  };

  const heatmapData = getLast90Days();

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h3 className="font-medium mb-2">No Analytics Data Yet</h3>
        <p>Complete some sessions to see your productivity insights here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Analytics & Insights</h2>
        <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'year') => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(totalFocusTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(averageSessionLength)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  formatter={(value, name) => [
                    name === 'hours' ? `${value}h` : value,
                    name === 'hours' ? 'Focus Time' : 'Sessions'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Session Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Session Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}h`, 'Focus Time']} />
                <Legend 
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>
                      {value} ({entry.payload.count} sessions)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => [`${value}h`, 'Focus Time']} />
                <Bar dataKey="hours" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={12}
                  interval={2}
                />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => [`${value}`, 'Sessions Started']} />
                <Bar dataKey="sessions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Activity Heatmap (Last 90 Days)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-13 gap-1 mb-4">
            {heatmapData.map((day, index) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${
                  day.intensity === 0 ? 'bg-gray-100' :
                  day.intensity === 1 ? 'bg-green-200' :
                  day.intensity === 2 ? 'bg-green-300' :
                  day.intensity === 3 ? 'bg-green-400' :
                  'bg-green-500'
                }`}
                title={`${day.date}: ${day.sessions} sessions, ${formatTime(day.totalTime)}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Productivity Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Most productive day */}
            {weeklyData.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium">Most Productive Day</h4>
                  <p className="text-sm text-muted-foreground">
                    {weeklyData.reduce((max, day) => day.hours > max.hours ? day : max).day}day with {formatTimeDecimal(weeklyData.reduce((max, day) => day.hours > max.hours ? day : max).hours * 3600)}h average
                  </p>
                </div>
                <Badge variant="secondary">
                  {weeklyData.reduce((max, day) => day.hours > max.hours ? day : max).day}
                </Badge>
              </div>
            )}

            {/* Most focused session type */}
            {typeData.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium">Top Focus Area</h4>
                  <p className="text-sm text-muted-foreground">
                    {typeData[0].name} sessions account for {Math.round((typeData[0].value / typeData.reduce((sum, item) => sum + item.value, 0)) * 100)}% of your focus time
                  </p>
                </div>
                <Badge variant="secondary">
                  {typeData[0].name}
                </Badge>
              </div>
            )}

            {/* Peak productivity time */}
            {hourlyData.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium">Peak Start Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Most sessions start around {hourlyData.reduce((max, hour) => hour.sessions > max.sessions ? hour : max).hour}
                  </p>
                </div>
                <Badge variant="secondary">
                  {hourlyData.reduce((max, hour) => hour.sessions > max.sessions ? hour : max).hour}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}