// The format from your Firestore/Zustand store
interface FirestoreSession {
  title: React.ReactNode;
  id: string;
  userId: string;
  session_type_id: string | null;
  notes: string;
  started_at: string; // ISO 8601 string
  ended_at: string;   // ISO 8601 string
  total_focus_ms: number;
  total_break_ms: number;
}

// The format your Analytics component accepts
interface AnalyticsSession {
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

export function adaptSessionsForAnalytics(
  sessions: FirestoreSession[]
): AnalyticsSession[] {
  return sessions.map((session, index) => {
    const startDate = new Date(session.started_at);
    
    return {
      // --- Field Mappings ---
      id: index, // Use the array index for the required numeric ID
      
      title: String(session.title), // Ensure title is a string
      
      type: session.session_type_id || 'default', // Map session_type_id to 'type'
      
      notes: session.notes,
      
      sessionTime: session.total_focus_ms, // Map total_focus_ms to sessionTime
      
      breakTime: session.total_break_ms, // Map total_break_ms to breakTime
      
      startTime: startDate.getTime(), // Convert ISO string to numeric timestamp
      
      endTime: new Date(session.ended_at).getTime(), // Convert ISO string to numeric timestamp
      
      date: startDate.toISOString().split('T')[0], // Create a 'YYYY-MM-DD' date string
    };
  });
}