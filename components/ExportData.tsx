import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';

interface Session {
  id: number;
  title: string;
  type: string;
  sessionTime: number;
  breakTime: number;
  date: string;
  notes: string;
  startTime: number;
  endTime: number;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetValue: number;
  targetUnit: 'hours' | 'sessions' | 'minutes';
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface ExportDataProps {
  sessions: Session[];
  goals: Goal[];
  onExport: (format: 'json' | 'csv', options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  includeSessions: boolean;
  includeGoals: boolean;
  includeAnalytics: boolean;
  dateRange: 'all' | 'week' | 'month' | 'year';
  sessionTypes: string[];
}

export function ExportData({ sessions, goals, onExport }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [options, setOptions] = useState<ExportOptions>({
    includeSessions: true,
    includeGoals: true,
    includeAnalytics: true,
    dateRange: 'all',
    sessionTypes: ['Coding', 'Learning', 'Practice', 'Exercise', 'Planning', 'Other']
  });

  const sessionTypes = ['Coding', 'Learning', 'Practice', 'Exercise', 'Planning', 'Other'];
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, options);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSessionTypeToggle = (type: string) => {
    setOptions(prev => ({
      ...prev,
      sessionTypes: prev.sessionTypes.includes(type)
        ? prev.sessionTypes.filter(t => t !== type)
        : [...prev.sessionTypes, type]
    }));
  };

  const getFilteredSessions = () => {
    let filtered = sessions;

    // Filter by date range
    if (options.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (options.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case 'year':
          cutoffDate.setDate(now.getDate() - 365);
          break;
      }
      
      filtered = filtered.filter(session => 
        new Date(session.date) >= cutoffDate
      );
    }

    // Filter by session types
    filtered = filtered.filter(session => 
      options.sessionTypes.includes(session.type)
    );

    return filtered;
  };

  const filteredSessions = getFilteredSessions();
  const totalFocusTime = filteredSessions.reduce((acc, session) => acc + session.sessionTime, 0);
  const totalSessions = filteredSessions.length;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium mb-2">Export Data</h2>
        <p className="text-muted-foreground">
          Download your FocusFlow data for backup or analysis in external tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Export Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={format} onValueChange={(value: 'json' | 'csv') => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (Full Data)</SelectItem>
                  <SelectItem value="csv">CSV (Sessions Only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {format === 'json' 
                  ? 'Complete data export including all details and metadata'
                  : 'Spreadsheet-friendly format with session data only'
                }
              </p>
            </div>

            {/* Data Inclusion */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Include Data</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sessions"
                    checked={options.includeSessions}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeSessions: !!checked }))
                    }
                  />
                  <label htmlFor="sessions" className="text-sm">Session History</label>
                </div>
                
                {format === 'json' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="goals"
                        checked={options.includeGoals}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, includeGoals: !!checked }))
                        }
                      />
                      <label htmlFor="goals" className="text-sm">Goals & Targets</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="analytics"
                        checked={options.includeAnalytics}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, includeAnalytics: !!checked }))
                        }
                      />
                      <label htmlFor="analytics" className="text-sm">Analytics Summary</label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select 
                value={options.dateRange} 
                onValueChange={(value: 'all' | 'week' | 'month' | 'year') => 
                  setOptions(prev => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Session Types */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Session Types</label>
              <div className="grid grid-cols-2 gap-2">
                {sessionTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={options.sessionTypes.includes(type)}
                      onCheckedChange={() => handleSessionTypeToggle(type)}
                    />
                    <label htmlFor={type} className="text-sm">{type}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <Button 
              onClick={handleExport}
              disabled={isExporting || (!options.includeSessions && !options.includeGoals)}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalSessions}</div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatTime(totalFocusTime)}</div>
                <div className="text-xs text-muted-foreground">Focus Time</div>
              </div>
            </div>

            {/* Date Range Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {options.dateRange === 'all' ? 'All sessions' : 
                   options.dateRange === 'week' ? 'Last 7 days' :
                   options.dateRange === 'month' ? 'Last 30 days' : 
                   'Last year'}
                </span>
              </div>
              
              {filteredSessions.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    From {new Date(filteredSessions[filteredSessions.length - 1].date).toLocaleDateString()} 
                    to {new Date(filteredSessions[0].date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Session Types */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Included Types:</div>
              <div className="flex flex-wrap gap-1">
                {options.sessionTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content Preview */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Export Contents:</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {options.includeSessions && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-3 w-3" />
                    <span>Session history with timestamps, durations, and notes</span>
                  </div>
                )}
                {format === 'json' && options.includeGoals && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-3 w-3" />
                    <span>Goals and progress tracking data</span>
                  </div>
                )}
                {format === 'json' && options.includeAnalytics && (
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-3 w-3" />
                    <span>Analytics summary and insights</span>
                  </div>
                )}
              </div>
            </div>

            {/* File Info */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground">
                <div>Format: {format.toUpperCase()}</div>
                <div>
                  Estimated size: {
                    format === 'csv' 
                      ? `${Math.ceil(filteredSessions.length * 0.1)}KB`
                      : `${Math.ceil((filteredSessions.length * 0.5 + goals.length * 0.1))}KB`
                  }
                </div>
                <div>
                  Filename: focusflow-export-{new Date().toISOString().split('T')[0]}.{format}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}