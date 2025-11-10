import { Session, Goal } from '@/types';

/**
 * Triggers a browser download
 */
function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Converts an array of objects to a CSV string.
 */
function convertToCSV<T extends object>(data: T[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  
  const keys = Object.keys(data[0]) as (keyof T)[];
  
  // Create header row
  const header = keys.join(',') + '\n';
  
  // Create data rows
  const rows = data.map(row => {
    return keys.map(key => {
      // Handle nested objects/arrays by JSON stringifying them
      const value = row[key];
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return JSON.stringify(value); // Use JSON.stringify to handle commas/quotes
    }).join(',');
  }).join('\n');
  
  return header + rows;
}

/**
 * The main export handler function.
 */
export function handleExport({
  format,
  options,
  sessions,
  goals
}: {
  format: 'json' | 'csv';
  options: { includeSessions: boolean; includeGoals: boolean };
  sessions: Session[];
  goals: Goal[];
}) {
  
  if (format === 'json') {
    // JSON export is easy, we can include both.
    const dataToExport = {
      sessions: options.includeSessions ? sessions : undefined,
      goals: options.includeGoals ? goals : undefined,
    };
    const jsonContent = JSON.stringify(dataToExport, null, 2);
    downloadFile(jsonContent, 'deepsession_export.json', 'application/json');
    return;
  }
  
  if (format === 'csv') {
    // CSV export is trickier as they are separate files.
    // We'll download one for each if they are included.
    // This may trigger two download prompts for the user.
    if (options.includeSessions) {
      const csvContent = convertToCSV(sessions);
      downloadFile(csvContent, 'deepsession_sessions.csv', 'text/csv');
    }
    if (options.includeGoals) {
      const csvContent = convertToCSV(goals);
      downloadFile(csvContent, 'deepsession_goals.csv', 'text/csv');
    }
  }
}