'use client'; // This component uses hooks, so it must be a Client Component
// Firebase imports for data fetching from Firestore
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser // Rename to avoid conflict
} from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dashboard } from '@/components/Dashboard';
// import { SessionTracker } from '@/components/SessionTracker';
import { SessionTracker } from '@/components/newSessionTracker';
import { SessionForm } from '@/components/SessionForm';
import { SessionLog } from '@/components/SessionLog';
import { Analytics } from '@/components/Analytics';
import { Goals } from '@/components/Goals';
import { ExportData } from '@/components/ExportData';
import { Auth } from '@/components/Auth';
import { Home, Clock, BarChart3, Target, Download, LogOut, User as UserIcon } from 'lucide-react';

// zustore import (if needed)
import { useSessionStore } from '@/store/timerStore';
// imports from v0
import TimerCard from '@/components/comp/TimerCard';
import TodayStatsCard from '@/components/comp/TodayStats';
import RecentSessions from '@/components/comp/RecentSession';
import AuthComponent from "@/components/AuthComponent";
import Link from 'next/link';
import { useTabSync } from '@/hooks/useTabSync'; // 👈 Import the hook
import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer';

// Interfaces (no changes here)
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
  updatedAt?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

// The main App component
export default function App() {

  // const sessions = useState('sessions'); // useSessionStore((state) => state.sessions)
  const fetchSessions = useSessionStore((state) => state.startSession); // state.fetchSessions
  const startSession = useSessionStore((state) => state.startSession);
  const endSession = useSessionStore((state) => state.endSession);

  const router = useRouter();

  // State management (mostly the same)
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'session'>('dashboard');
  const [currentSessionData, setCurrentSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // NEW: Modern way to handle auth state changes with Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setIsLoading(false); // You already have this state
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Fetch data on user login
useEffect(() => {
  if (user) {
    // fetchSessions(user.uid);
    // fetchGoals(user.uid); // (if you build this into a store)
  }
}, [user, fetchSessions]);

  // Load data when user is authenticated
  // useEffect(() => {
  //   if (user) {
  //     loadSessions();
  //     loadGoals();
  //   }
  // }, [user]);

  // Save to local storage when data changes (fallback)
  useEffect(() => {
    if (!user) {
      saveLocalData();
    }
  }, [sessions, goals, user]);


  const loadLocalData = () => {
    try {
      const savedSessions = localStorage.getItem('focusflow-sessions');
      const savedGoals = localStorage.getItem('focusflow-goals');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      if (savedGoals) setGoals(JSON.parse(savedGoals));
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  };

  const saveLocalData = () => {
    try {
      localStorage.setItem('focusflow-sessions', JSON.stringify(sessions));
      localStorage.setItem('focusflow-goals', JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  };

  const getAuthHeaders = async () => {
    // const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${session?.access_token}`
    };
  };

  // Handle Login Function
  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Handle Signup Function
  const handleSignup = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      // Update the user's profile
      await updateProfile(loggedInUser, { displayName: name });

      // (Optional but good practice) Save user to 'users' collection
      const userRef = doc(db, "users", loggedInUser.uid);
      await setDoc(userRef, {
        uid: loggedInUser.uid,
        email: loggedInUser.email,
        displayName: name,
      }, { merge: true });

      setAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Handle Logout Function
  const handleLogout = async () => {
    await signOut(auth);
    // No need to refresh, onAuthStateChanged will set user to null
  };

  // --- OTHER HANDLER FUNCTIONS HERE ---
  const loadSessions = async () => {
    if (!user) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/sessions`, { headers });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else console.error('Failed to load sessions:', response.statusText);
    } catch (error) { console.error('Error loading sessions:', error); }
  };
  const loadGoals = async () => {
    if (!user) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals`, { headers });
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      } else console.error('Failed to load goals:', response.statusText);
    } catch (error) { console.error('Error loading goals:', error); }
  };
  // const handleSessionEnd = async (sessionData: Session) => {
  //   try {
  //     if (user) {
  //       const headers = await getAuthHeaders();
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/sessions`, { method: 'POST', headers, body: JSON.stringify(sessionData) });
  //       if (response.ok) await loadSessions();
  //       else {
  //         console.error('Failed to save session to server');
  //         setSessions(prev => [...prev, sessionData]);
  //       }
  //     } else setSessions(prev => [...prev, sessionData]);
  //   } catch (error) {
  //     console.error('Error saving session:', error);
  //     setSessions(prev => [...prev, sessionData]);
  //   }
  //   setCurrentView('dashboard');
  //   setCurrentSessionData(null);
  // };
  const handleGoalCreate = async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal: Goal = { ...goalData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    try {
      if (user) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals`, { method: 'POST', headers, body: JSON.stringify(goal) });
        if (response.ok) await loadGoals();
        else {
          console.error('Failed to save goal to server');
          setGoals(prev => [...prev, goal]);
        }
      } else setGoals(prev => [...prev, goal]);
    } catch (error) {
      console.error('Error creating goal:', error);
      setGoals(prev => [...prev, goal]);
    }
  };
  const handleGoalUpdate = async (id: string, updates: Partial<Goal>) => {
    try {
      if (user) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals/${id}`, { method: 'PUT', headers, body: JSON.stringify(updates) });
        if (response.ok) await loadGoals();
        else {
          console.error('Failed to update goal on server');
          setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
        }
      } else setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
    } catch (error) {
      console.error('Error updating goal:', error);
      setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
    }
  };
  const handleGoalDelete = async (id: string) => {
    try {
      if (user) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals/${id}`, { method: 'DELETE', headers });
        if (response.ok) await loadGoals();
        else {
          console.error('Failed to delete goal from server');
          setGoals(prev => prev.filter(goal => goal.id !== id));
        }
      } else setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      setGoals(prev => prev.filter(goal => goal.id !== id));
    }
  };
  const handleExport = async (format: 'json' | 'csv', options: any) => {
    // This function can remain the same
  };
  // --- END OF HANDLER FUNCTIONS ---


  // --- RENDER LOGIC ---
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <div className="text-center space-y-4">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
  //         <p className="text-muted-foreground">Loading FocusFlow...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return <Auth onLogin={handleLogin} onSignup={handleSignup} isLoading={authLoading} />;
  // }

  if (currentView === 'session') {
    return (
      <div className="min-h-screen bg-background">
        <SessionTracker onSessionEnd={handleSessionEnd} sessionActive={true} onSessionStart={() => { }} />
      </div>
    );
  }

  // if (currentView === 'form') {
  //   return (
  //     <div className="min-h-screen bg-background">
  //       <SessionForm
  //         onSubmit={(sessionData) => {
  //           setCurrentSessionData(sessionData);
  //           setCurrentView('session');
  //         }}
  //         onCancel={() => setCurrentView('dashboard')}
  //       />
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-background">
      {/* home page nav bar */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-4xl">
          <div>
            <h1 className="text-xl font-medium">FocusFlow</h1>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            {/* {user.name || user.email} */}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <UserIcon className="h-3 w-3" />
              <span>{user ? 'Synced' : 'Offline'}</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      {/* diff home page tabs */}
      <div className="container mx-auto p-6 max-w-4xl">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard"><Home className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="goals"><Target className="h-4 w-4 mr-2" />Goals</TabsTrigger>
            <TabsTrigger value="sessions"><Clock className="h-4 w-4 mr-2" />Sessions</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" />Analytics</TabsTrigger>
            <TabsTrigger value="export"><Download className="h-4 w-4 mr-2" />Export</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><Dashboard sessions={sessions} onStartSession={() => setCurrentView('form')} /></TabsContent>
          <TabsContent value="goals"><Goals sessions={sessions} goals={goals} onGoalCreate={handleGoalCreate} onGoalUpdate={handleGoalUpdate} onGoalDelete={handleGoalDelete} /></TabsContent>
          <TabsContent value="sessions">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Session History</h2>
              <Button onClick={() => setCurrentView('form')}><Clock className="mr-2 h-4 w-4" />New Session</Button>
            </div>
            <SessionLog sessions={sessions} />
          </TabsContent>
          <TabsContent value="analytics">
            {/* <DashboardPage /> */}
            <Analytics sessions={sessions} />
          </TabsContent>
          <TabsContent value="export"><ExportData sessions={sessions} goals={goals} onExport={handleExport} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
