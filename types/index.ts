// This is the data structure our app will use
// Based on components/SessionLog.tsx
export interface Session {
  id: string;
  title: string;
  type: string;
  notes: string;
  sessionTime: number;
  breakTime: number;
  startTime: number;
  endTime: number;

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
  updatedAt?: string; // ISO string (optional)
}

export interface User {
  id: string;
  email: string;
  name?: string;
}