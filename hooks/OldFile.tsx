import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Session } from '@/types'; // Import our new shared type

// The data model as it exists in your v0 Firestore
interface FirebaseSessionData {
  id: string;
  userId: string;
  title: string;
  session_type_id: string;
  notes?: string;
  started_at: string; // It's a Timestamp object
  ended_at: string;   // It's a Timestamp object
  total_focus_ms: number;
  total_break_ms: number;
}

// The async function that does the server work
const fetchSessions = async (userId: string): Promise<Session[]> => {
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
      orderBy('started_at', 'desc') // <-- 2. Query v0 field
    );

    const querySnapshot = await getDocs(q);

    // --- 3. THIS IS THE ADAPTER ---
    // Convert v0 data (FirebaseSessionData) into v2 UI data (Session)
    const sessions = querySnapshot.docs.map(doc => {
      const data = doc.data() as FirebaseSessionData;

      // --- 2. THIS IS THE FIX ---
      // Convert the date strings to number timestamps
      const startTime = new Date(data.started_at).getTime();
      const endTime = new Date(data.ended_at).getTime();
      return {
        id: data.id, // Use the v0 string ID
        title: data.title,
        type: data.type,
        notes: data.notes || '',

        started_at: startTime, // Pass the number
        ended_at: endTime,   // Pass the number

        // Use v0's pre-calculated durations
        sessionTime: data.duration,
        breakTime: data.break_duration,

        // Create the date string for the UI
        date: new Date(startTime).toISOString().split('T')[0],

        // Include the original timestamp strings
        // started_at: data.started_at,
        // ended_at: data.ended_at
      };
    });

    console.log("useSessionsQuery: Successfully fetched and adapted", sessions.length, "sessions.");
    return sessions;

  } catch (error) {
    console.error("useSessionsQuery: Error *inside* fetchSessions:", error);
    throw error;
  }
};

// --- THIS IS THE CHANGE ---
// We now accept userId as an argument

// The custom hook that our components will use
export const useSessionsQuery = (userId: string | undefined) => {
  // const user = auth.currentUser;

  return useQuery({
    // The query key: ['sessions', 'userId']
    // This caches the data based on the user
    queryKey: ['sessions', userId],

    // The query function
    queryFn: () => fetchSessions(userId!),

    // Only run this query if the user is logged in
    enabled: !!userId,
  });
};