import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types'; // Import our new shared type

// The data model as it exists in your v0 Firestore
interface FirestoreSessionData {
  id: string;
  userId: string;
  title: string;
  session_type_id: string;
  notes?: string;
  started_at: string; // ISO String
  ended_at: string;  // ISO String
  total_focus_ms: number;
  total_break_ms: number;
}

// The async function that does the server work
export const fetchSessions = async (userId: string): Promise<Session[]> => {
  console.log("useSessionsQuery: Attempting to fetch for userId:", userId);

  if (!userId) {
    console.error("useSessionsQuery: Aborted, no userId provided.");
    return [];
  }
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('started_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sessions: Session[] = querySnapshot.docs
      .map(doc => {
        const data = doc.data() as FirestoreSessionData;

        // 2. We keep this check, it's good practice
        if (!data.started_at || !data.ended_at) {
          console.warn("Skipping session, missing timestamp:", data.id);
          return null;
        }

        // --- VALIDATION ---
        const startTime = new Date(data.started_at).getTime();
        const endTime = new Date(data.ended_at).getTime();

        if (isNaN(startTime) || isNaN(endTime)) {
          console.warn("Skipping session, invalid date format:", data.id, data.started_at);
          return null;
        }

        // --- 3. THIS IS THE FIX ---
        // Map the v0 fields to the v2 fields
        return {
          id: doc.id, // <-- THIS IS THE FIX
          title: data.title,
          type: data.session_type_id,   // <-- MAP v0 field
          notes: data.notes || '',
          sessionTime: data.total_focus_ms, // <-- MAP v0 field
          breakTime: data.total_break_ms, // <-- MAP v0 field
          startTime: startTime,
          endTime: endTime,
          date: new Date(startTime).toISOString().split('T')[0],
        };
      })
      .filter(session => session !== null) as Session[]; // Filter out bad data

    console.log("useSessionsQuery: Successfully fetched and adapted", sessions.length, "sessions.");
    return sessions;

  } catch (error) {
    console.error("useSessionsQuery: Error *inside* fetchSessions:", error);
    throw error;
  }
};

// The custom hook that our components will use
export const useSessionsQuery = (
  userId: string | undefined,
  enabled: boolean
) => {

  return useQuery({
    // The query key: ['sessions', 'userId']
    // This caches the data based on the user
    queryKey: ['sessions', userId],
    // The query function
    queryFn: () => fetchSessions(userId!),
    // queryFn: () => fetchSessions(userId as string),
    // Only run this query if the user is logged in
    // enabled: !!userId,
    enabled: enabled, // <-- PASS THE PROP
  });
};