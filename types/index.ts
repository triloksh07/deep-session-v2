// This is the data structure our app will use
// Based on components/SessionLog.tsx
export interface Session {
  id: string;
  title: string;
  type: string;
  notes: string;
  sessionTime: number;
  breakTime: number;
  // --- THE KEY CHANGE ---
  // We'll use JS timestamps (numbers) in our UI,
  // but they will be named after the v0 fields.
  startTime: number; // JS timestamp (number), NOT a Firestore Timestamp
  endTime: number; // JS timestamp (number)

  date: string;
}

export interface Goal {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetValue: number;
  targetUnit: 'hours' | 'sessions' | 'minutes';
  category: string; // e.g., 'Coding', 'Learning', or 'All'
  isActive: boolean;
  createdAt: string; // ISO string
}