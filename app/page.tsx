'use client'; // This component uses hooks, so it must be a Client Component


import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
// import { FirestoreSession, OldSessionFormat, adaptFirestoreSessionsToAnalyticsFormat } from '@/lib/adapter'; // The new function we'll create


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import the function to create a client-side Supabase client
// import { createClient } from '@/app/utils/supabase/client';

// UI Components and Icons (no changes here)
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dashboard } from '@/components/Dashboard';
import { SessionTracker } from '@/components/SessionTracker';
import { SessionForm } from '@/components/SessionForm';
import { SessionLog } from '@/components/SessionLog';
import { Analytics } from '@/components/Analytics';
import { Goals } from '@/components/Goals';
import { ExportData } from '@/components/ExportData';
import { Auth } from '@/components/Auth';
import { Home, Clock, BarChart3, Target, Download, LogOut, User as UserIcon } from 'lucide-react';
// import DashboardPage from '@/components/comp/firebaseData'; // Import the new Analytics component

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


  // // ----------------------new------test-----------------------
  // // Assuming you have a user object available
  // const userId = auth.currentUser?.uid;
  //  const [adaptedSessions, setAdaptedSessions] = useState<OldSessionFormat[]>([]);
  //   const [isLoading, setIsLoading] = useState(true);

  //   useEffect(() => {
  //     const fetchAndAdaptData = async () => {
  //       if (!userId) {
  //         setIsLoading(false);
  //         return;
  //       }

  //       // 1. Fetch from Firestore
  //       const sessionsQuery = query(collection(db, "sessions"), where("userId", "==", userId));
  //       const querySnapshot = await getDocs(sessionsQuery);
  //       // const firestoreSessions = querySnapshot.docs.map(doc => doc.data());
  //        // FIX #1: Assert the type of the data coming from Firestore
  //       const firestoreSessions = querySnapshot.docs.map(doc => ({
  //         id: doc.id, 
  //         ...doc.data()
  //       }) as FirestoreSession);

  //       // 2. Adapt the data to the old format
  //       const analyticsReadySessions = adaptFirestoreSessionsToAnalyticsFormat(firestoreSessions);

  //       setAdaptedSessions(analyticsReadySessions);
  //       setIsLoading(false);
  //     };

  //     fetchAndAdaptData();
  //   }, [userId]);

  //   if (isLoading) return <div>Loading Analytics...</div>;

  // // ----------------------new------test--------end---------------



  // Create the Supabase client inside the component
  // const supabase = createClient();
  const router = useRouter();

  // State management (mostly the same)
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'session'>('dashboard');
  const [currentSessionData, setCurrentSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // API base URL - IMPORTANT: This needs your actual project ID
  // You should move this to your .env.local file for better security
  // const APIc_BASE = process.env.NEXT_PUBLIC_SUPABASE_APIc_BASE;

  // NEW: Modern way to handle auth state
  // useEffect(() => {
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  //     if (session) {
  //       setUser({
  //         id: session.user.id,
  //         email: session.user.email!,
  //         name: session.user.user_metadata?.name,
  //       });
  //       setIsLoading(false);
  //     } else {
  //       setUser(null);
  //       setSessions([]);
  //       setGoals([]);
  //       setCurrentView('dashboard');
  //       setIsLoading(false);
  //     }
  //   });

  //   // Check the initial session state
  //   const getInitialSession = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (session) {
  //       setUser({
  //         id: session.user.id,
  //         email: session.user.email!,
  //         name: session.user.user_metadata?.name,
  //       });
  //     } else {
  //       loadLocalData();
  //     }
  //     setIsLoading(false);
  //   };

  //   getInitialSession();

  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // }, [supabase, router]);


  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadSessions();
      loadGoals();
    }
  }, [user]);

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

  // const getAuthHeaders = async () => {
  //   const { data: { session } } = await supabase.auth.getSession();
  //   return {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${session?.access_token}`
  //   };
  // };

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) return { success: false, error: error.message };
    router.refresh(); // Refresh the page to update server component data
    return { success: true };
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    // Use the client-side Supabase helper for signup
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    setAuthLoading(false);
    if (error) return { success: false, error: error.message };
    router.refresh(); // Refresh the page
    return { success: true };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Refresh the page
  };

  // All the data fetching and handling functions (loadSessions, handleGoalCreate, etc.)
  // can remain mostly the same, as they rely on getAuthHeaders(), which we've kept.
  // ... (All your other handler functions: loadSessions, loadGoals, handleSessionEnd, etc. go here)
  // --- PASTE YOUR OTHER HANDLER FUNCTIONS HERE ---
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
  const handleSessionEnd = async (sessionData: Session) => {
    try {
      if (user) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/sessions`, { method: 'POST', headers, body: JSON.stringify(sessionData) });
        if (response.ok) await loadSessions();
        else {
          console.error('Failed to save session to server');
          setSessions(prev => [...prev, sessionData]);
        }
      } else setSessions(prev => [...prev, sessionData]);
    } catch (error) {
      console.error('Error saving session:', error);
      setSessions(prev => [...prev, sessionData]);
    }
    setCurrentView('dashboard');
    setCurrentSessionData(null);
  };
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

  // if (currentView === 'session') {
  //   return (
  //     <div className="min-h-screen bg-background">
  //       <SessionTracker onSessionEnd={handleSessionEnd} sessionActive={true} onSessionStart={() => { }} />
  //     </div>
  //   );
  // }

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
