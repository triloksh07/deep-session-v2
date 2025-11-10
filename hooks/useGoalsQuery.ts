import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Goal } from '@/types'; // Import our new shared type

// The async function that does the server work
export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  // --- ADD THIS LOG ---
  console.log("useGoalsQuery: Attempting to fetch for userId:", userId);

  if (!userId) {
    console.error("useGoalsQuery: Aborted, no userId provided.");
    return [];
  }

  // --- ADD THIS TRY...CATCH ---
  try {
    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }) as Goal);

    // --- ADD THIS LOG ---
    console.log("useGoalsQuery: Successfully fetched", data.length, "goals.");
    return data;

  } catch (error) {
    // --- ADD THIS LOG ---
    console.error("useGoalsQuery: Error *inside* fetchGoals:", error);
    throw error; // Re-throw the error
  }
};

// The custom hook that our components will use
export const useGoalsQuery = (userId: string | undefined, enabled: boolean) => {
  // const user = auth.currentUser;

  return useQuery({
    // The query key: ['goals', 'userId']
    queryKey: ['goals', userId],
    queryFn: () => fetchGoals(userId!),
    // Only run this query if the user is logged in
    // enabled: !!userId,
      enabled: enabled, // <-- PASS THE PROP 
  });
};