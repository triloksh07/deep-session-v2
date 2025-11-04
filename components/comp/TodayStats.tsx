import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabaseUrl } from './utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Coffee, Target, Flame } from 'lucide-react';

interface TodayAnalytics {
  totalFocusMs: number;
  totalBreakMs: number;
  sessionCount: number;
  typeBreakdown: Record<string, number>;
  sessions: any[];
}

export function TodayStats() {
  const { accessToken } = useAuth();
  const [analytics, setAnalytics] = useState<TodayAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/make-server-eb7eb3f5/analytics/today`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Refresh every minute
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
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

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </Card>
    );
  }

  const focusHours = analytics ? analytics.totalFocusMs / (1000 * 60 * 60) : 0;
  const dailyGoal = 4; // 4 hours default goal
  const goalProgress = Math.min((focusHours / dailyGoal) * 100, 100);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Today's Focus</h3>
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl mb-2 mx-auto">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {analytics ? formatTime(analytics.totalFocusMs) : '0m'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Focus Time</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl mb-2 mx-auto">
              <Coffee className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {analytics ? formatTime(analytics.totalBreakMs) : '0m'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Break Time</p>
          </div>
        </div>

        {/* Goal Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Goal</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatTime((analytics?.totalFocusMs || 0))} / {dailyGoal}h
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(goalProgress)}% complete
          </p>
        </div>

        {/* Session Count */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Sessions Today</span>
          </div>
          <Badge variant="secondary">
            {analytics?.sessionCount || 0}
          </Badge>
        </div>
      </div>
    </Card>
  );
}