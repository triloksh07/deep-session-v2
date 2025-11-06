'use client'; // This component uses hooks, so it must be a Client Component

import Image from 'next/image';
// Firebase imports for data fetching from Firestore
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser, // Rename to avoid conflict
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// UI Components
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
import {
  Home,
  Clock,
  BarChart3,
  Target,
  Download,
  LogOut,
  User as UserIcon,
  Loader2
} from 'lucide-react';

// Hooks & Stores
// import { useSessionStore } from '@/store/timerStore';
import { useSessionStore } from '@/store/sessionStore';
import { Session, Goal } from '@/types'; // <-- 3. USE THE SHARED TYPES
import { useSessionsQuery } from '@/hooks/useSessionsQuery'; // <-- 1. IMPORT THE NEW HOOK
import { useSyncActiveSession } from '@/hooks/useSyncActiveSession'; // --- ADD ---
import { useStartSessionMutation } from '@/hooks/useTimerMutations'; // --- ADD ---

// --- 2. IMPORT NEW GOAL HOOKS ---
import { useGoalsQuery } from '@/hooks/useGoalsQuery';
import {
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from '@/hooks/useGoalMutations';
import { handleExport } from '@/lib/exportUtils'; // <-- 1. IMPORT NEW HANDLER

// imports from v0
// import TimerCard from '@/components/comp/TimerCard';
// import TodayStatsCard from '@/components/comp/TodayStats';
// import RecentSessions from '@/components/comp/RecentSession';
// import AuthComponent from "@/components/AuthComponent";
// import Link from 'next/link';
// import { useTabSync } from '@/hooks/useTabSync'; // 👈 Import the hook
// import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer';

// Interfaces (no changes here)
// interface Session {
//   id: number;
//   title: string;
//   type: string;
//   notes: string;
//   sessionTime: number;
//   breakTime: number;
//   startTime: number;
//   endTime: number;
//   date: string;
// }

// interface Goal {
//   id: string;
//   title: string;
//   description: string;
//   type: 'daily' | 'weekly' | 'monthly';
//   targetValue: number;
//   targetUnit: 'hours' | 'sessions' | 'minutes';
//   category: string;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt?: string;
// }

interface User {
  id: string;
  email: string;
  name?: string;
}

// --- CREATE THE PROVIDER INSTANCES ---
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// --- Main App Component ---
export default function App() {

  // const sessions = useSessionStore((state) => state.sessions)
  // const fetchSessions = useSessionStore((state) => state.startSession); // state.fetchSessions
  // const startSession = useSessionStore((state) => state.startSession);
  // const endSession = useSessionStore((state) => state.endSession);

  // const router = useRouter();

  // State management (mostly the same)
  // const [sessions, setSessions] = useState<Session[]>([]);
  // const [goals, setGoals] = useState<Goal[]>([]);
  // const [currentSessionData, setCurrentSessionData] = useState<any>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  // const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'session'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  // --- ADD BACK BOTH LOADING STATES ---
  const [providerLoading, setProviderLoading] = useState(false); // For Google/GitHub

  // --- THIS IS THE FIX ---
  // We were calling this with user?.uid, which is undefined on first render.
  // We must ensure this hook only runs *after* the user is set.
  const [isAuthReady, setIsAuthReady] = useState(false);


  // NEW: Modern way to handle auth state changes with Firebase
  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // setIsLoading(false);
        setIsAuthReady(true); // <-- Set auth ready
      } else {
        setUser(null);
      }
      setIsLoading(false); // You already have this state
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     setUser(currentUser);
  //     setIsLoading(false);
  //     setIsAuthReady(true); // <-- Set auth ready
  //   });
  //   return () => unsubscribe();
  // }, []);

  // --- ADD THIS HOOK ---
  // This syncs our Zustand store with Firestore in real-time
  // and handles cross-device updates.
  useSyncActiveSession(isAuthReady ? user : null);

  // Fetch data on user login
  // useEffect(() => {
  //   if (user) {
  //     fetchSessions(user.uid);
  //     // fetchGoals(user.uid); // (if you build this into a store)
  //   }
  // }, [user, fetchSessions]);

  // Load data when user is authenticated
  // useEffect(() => {
  //   if (user) {
  //     loadSessions();
  //     loadGoals();
  //   }
  // }, [user]);

  // Save to local storage when data changes (fallback)
  // useEffect(() => {
  //   if (!user) {
  //     saveLocalData();
  //   }
  // }, [sessions, goals, user]);


  // const loadLocalData = () => {
  //   try {
  //     const savedSessions = localStorage.getItem('focusflow-sessions');
  //     const savedGoals = localStorage.getItem('focusflow-goals');
  //     if (savedSessions) setSessions(JSON.parse(savedSessions));
  //     if (savedGoals) setGoals(JSON.parse(savedGoals));
  //   } catch (error) {
  //     console.error('Error loading local data:', error);
  //   }
  // };

  // const saveLocalData = () => {
  //   try {
  //     localStorage.setItem('focusflow-sessions', JSON.stringify(sessions));
  //     localStorage.setItem('focusflow-goals', JSON.stringify(goals));
  //   } catch (error) {
  //     console.error('Error saving local data:', error);
  //   }
  // };

  // const getAuthHeaders = async () => {
  //   // const { data: { session } } = await supabase.auth.getSession();
  //   return {
  //     'Content-Type': 'application/json',
  //     // 'Authorization': `Bearer ${session?.access_token}`
  //   };
  // };

  // --- Auth Handlers ---

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the user state update
      setAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      // Update the user's profile
      await updateProfile(loggedInUser, { displayName: name });

      // (good practice) Save user to 'users' collection
      const userRef = doc(db, "users", loggedInUser.uid);
      await setDoc(userRef, {
        uid: loggedInUser.uid,
        email: loggedInUser.email,
        displayName: name,
      }, { merge: true });

      // onAuthStateChanged will handle the user state
      setAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  // --- KEEP PROVIDER HANDLERS ---
  const updateUserProfile = async (user: FirebaseUser) => {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }, { merge: true });
  };

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    setProviderLoading(true);
    const authProvider = provider === 'google' ? googleProvider : githubProvider;

    try {
      const result = await signInWithPopup(auth, authProvider);
      await updateUserProfile(result.user);
      setProviderLoading(false);
      return { success: true };
    } catch (error: any) {
      // ... (error handling)
      setProviderLoading(false);
      return { success: false, error: error.message };
    }
  };

  const handleGoogleSignIn = () => handleProviderSignIn('google');
  const handleGitHubSignIn = () => handleProviderSignIn('github');
  const handleLogout = async () => {
    await signOut(auth);
    // No need to refresh, onAuthStateChanged will set user to null
  };

  // --- OTHER HANDLER FUNCTIONS HERE ---
  // const loadSessions = async () => {
  //   if (!user) return;
  //   try {
  //     const headers = await getAuthHeaders();
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/sessions`, { headers });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setSessions(data.sessions || []);
  //     } else console.error('Failed to load sessions:', response.statusText);
  //   } catch (error) { console.error('Error loading sessions:', error); }
  // };
  // const loadGoals = async () => {
  //   if (!user) return;
  //   try {
  //     const headers = await getAuthHeaders();
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals`, { headers });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setGoals(data.goals || []);
  //     } else console.error('Failed to load goals:', response.statusText);
  //   } catch (error) { console.error('Error loading goals:', error); }
  // };
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
  // const handleGoalCreate = async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
  //   const goal: Goal = { ...goalData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  //   try {
  //     if (user) {
  //       const headers = await getAuthHeaders();
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals`, { method: 'POST', headers, body: JSON.stringify(goal) });
  //       if (response.ok) await loadGoals();
  //       else {
  //         console.error('Failed to save goal to server');
  //         setGoals(prev => [...prev, goal]);
  //       }
  //     } else setGoals(prev => [...prev, goal]);
  //   } catch (error) {
  //     console.error('Error creating goal:', error);
  //     setGoals(prev => [...prev, goal]);
  //   }
  // };
  // const handleGoalUpdate = async (id: string, updates: Partial<Goal>) => {
  //   try {
  //     if (user) {
  //       const headers = await getAuthHeaders();
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals/${id}`, { method: 'PUT', headers, body: JSON.stringify(updates) });
  //       if (response.ok) await loadGoals();
  //       else {
  //         console.error('Failed to update goal on server');
  //         setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
  //       }
  //     } else setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
  //   } catch (error) {
  //     console.error('Error updating goal:', error);
  //     setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
  //   }
  // };
  // const handleGoalDelete = async (id: string) => {
  //   try {
  //     if (user) {
  //       const headers = await getAuthHeaders();
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_API_BASE}/goals/${id}`, { method: 'DELETE', headers });
  //       if (response.ok) await loadGoals();
  //       else {
  //         console.error('Failed to delete goal from server');
  //         setGoals(prev => prev.filter(goal => goal.id !== id));
  //       }
  //     } else setGoals(prev => prev.filter(goal => goal.id !== id));
  //   } catch (error) {
  //     console.error('Error deleting goal:', error);
  //     setGoals(prev => prev.filter(goal => goal.id !== id));
  //   }
  // };
  // const handleExport = async (format: 'json' | 'csv', options: any) => {
  //   // This function can remain the same
  // };
  // --- END OF HANDLER FUNCTIONS ---


  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading DeepSession...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // This component now works, powered by your new Firebase handlers
    return (
      <Auth
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGoogleSignIn={handleGoogleSignIn}
        onGitHubSignIn={handleGitHubSignIn}
        isLoading={authLoading}
        isProviderLoading={providerLoading}
      />
    );;
  }

  // This logic is for your new Client State store
  // We will replace 'currentView' soon with the store's 'isActive' state
  // if (currentView === 'session') {
  //   return (
  //     <div className="min-h-screen bg-background">
  //       {/* <SessionTracker onSessionEnd={handleSessionEnd} sessionActive={true} onSessionStart={() => { }} /> */}
  //       <SessionTracker />
  //       {/* We will refactor this next to use the Zustand store */}
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

  // This is the DASHBOARD
  // --- Main Authenticated View ---
  return (
    <div className="min-h-screen bg-background">
      {/* home page nav bar */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-4xl">
          <div>
            <h1 className="text-xl font-medium">DeepSession</h1>
            {/* Uses the Firebase user object! */}
            <p className="text-sm text-muted-foreground">Welcome back, {user.displayName || user.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User avatar"}
                className="w-12 h-12 rounded-full"
                width={50}
                height={48}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-medium text-primary">
                  {user.displayName?.split(' ').map(n => n[0]).join('') || <UserIcon />}
                </span>
              </div>
            )}
            {/* <Badge variant="secondary" className="flex items-center space-x-1">
              <UserIcon className="h-3 w-3" />
              <span>{user ? 'Synced' : 'Offline'}</span>
            </Badge> */}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard & Session Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <DashboardContent user={user} />
      </div>

      {/* diff home page tabs */}
      <div className="container mx-auto p-6 max-w-4xl">
        <Tabs defaultValue="dashboard" className="space-y-6">
          {/* <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard"><Home className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="goals"><Target className="h-4 w-4 mr-2" />Goals</TabsTrigger>
            <TabsTrigger value="sessions"><Clock className="h-4 w-4 mr-2" />Sessions</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" />Analytics</TabsTrigger>
            <TabsTrigger value="export"><Download className="h-4 w-4 mr-2" />Export</TabsTrigger>
          </TabsList> */}

          {/* Dashboard Tab */}
          {/* <TabsContent value="dashboard"> */}
          {/* This component also needs session data. We'll pass the 
              new hook's data here too.
            */}
          {/* <Dashboard sessions={sessions} onStartSession={() => setCurrentView('form')} /> */}
          {/* </TabsContent> */}

          {/* Goals Tab */}
          {/* <TabsContent value="goals"> */}
          {/* We will refactor this tab next */}
          {/* <Goals sessions={sessions} goals={goals} onGoalCreate={handleGoalCreate} onGoalUpdate={handleGoalUpdate} onGoalDelete={handleGoalDelete} /> */}
          {/* </TabsContent> */}

          {/* --- THIS IS THE UPDATED SESSIONS TAB --- */}
          {/* <TabsContent value="sessions"> */}
          {/* <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Session History</h2>
              <Button onClick={() => setCurrentView('form')}><Clock className="mr-2 h-4 w-4" />New Session</Button>
            </div> */}
          {/* <SessionLog sessions={sessions} /> */}
          {/* 6. CALL THE HOOK AND RENDER */}
          {/* <ConnectedSessionLog /> */}

          {/* </TabsContent> */}
          {/* Analytics & Export Tabs */}
          {/* <TabsContent value="analytics">
            <Analytics sessions={sessions} />
          </TabsContent>
          <TabsContent value="export">
            <ExportData sessions={sessions} goals={goals} onExport={handleExport} />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}

// 7. CREATE THIS NEW HELPER COMPONENT
// This component connects our hook to the SessionLog
// const ConnectedSessionLog = () => {
//   // This is where the magic happens!
//   const { data: sessions, isLoading, isError } = useSessionsQuery();

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-10">
//         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="text-center py-10 text-destructive">
//         Error loading sessions. Please try again.
//       </div>
//     );
//   }

//   // We have data!
//   return <SessionLog sessions={sessions || []} />;
// }

// --- New Helper Component to Manage Views ---
const DashboardContent = ({ user }: { user: FirebaseUser }) => {
  // --- Client-side View State ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'session'>('dashboard');
  const startSession = useSessionStore((state) => state.startSession);
  const isSessionActive = useSessionStore((state) => state.isActive);
  const startSessionMutation = useStartSessionMutation(); // --- ADD ---
  // This state is *only* for showing the form vs. the dashboard
  const [showForm, setShowForm] = useState(false);

  // --- Effect to Sync View with Session State ---

  // This effect syncs the view
  useEffect(() => {
    if (isSessionActive) {
      // If a session is active (from any device), show the tracker
      setShowForm(false);
    }
  }, [isSessionActive]);

  // This is the NEW, FIXED effect
  // useEffect(() => {
  //   if (isSessionActive) {
  //     // If a session is active, force the view to the tracker
  //     setCurrentView('session');
  //   } else if (currentView === 'session' && !isSessionActive) {
  //     // If we *were* in the session view, but it just ended,
  //     // automatically go back to the dashboard.
  //     setCurrentView('dashboard');
  //   }
  // }, [isSessionActive, currentView]); // Add currentView to the dependency array

  // --- View Handlers ---
  // const handleStartSessionClick = () => {
  //   setCurrentView('form');
  // };
  // --- View Handlers ---
  const handleStartSessionClick = () => {
    setShowForm(true); // Just show the form
  };

  // const handleFormSubmit = (sessionData: { title: string; type: string; notes: string }) => {
  //   startSession(sessionData); // Start the timer store
  //   setCurrentView('session'); // Switch the view
  // };
  const handleFormSubmit = (sessionData: { title: string; type: string; notes: string }) => {
    // Use the mutation. This will optimistically update
    // our Zustand store, which will make 'isSessionActive' true,
    // which will close the form and show the tracker.
    startSessionMutation.mutate(sessionData);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // --- View Rendering ---
  if (isSessionActive) {
    // If a session is running, *always* show the tracker
    return <SessionTracker />;
  }

  if (showForm) {
    // If we click "start", show the form
    return (
      <SessionForm
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    );
  }

  // // --- View Rendering ---
  // if (currentView === 'session') {
  //   return <SessionTracker />;
  // }

  // if (currentView === 'form') {
  //   return (
  //     <SessionForm
  //       onSubmit={handleFormSubmit}
  //       onCancel={() => setCurrentView('dashboard')}
  //     />
  //   );
  // }

  // --- Default View: The Dashboard Tabs ---
  // This component calls the hook once and distributes data
  return (
    <DashboardTabs
      onStartSessionClick={handleStartSessionClick}
      userId={user.uid} // <-- Pass the userId to the next component
    />
  );
};

// --- UPDATED DashboardContent ---
// It now receives the user object as a prop

// --- New Helper Component for Tabs ---
const DashboardTabs = ({ onStartSessionClick, userId }: { onStartSessionClick: () => void; userId: string; }) => {
  // --- Server-side Data ---
  // Call the hook ONCE for all tabs
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    isError: isErrorSessions,
    error: sessionsError // <-- GET THIS
  } = useSessionsQuery(userId);

  // --- NEW: GOALS DATA ---
  const {
    data: goals,
    isLoading: isLoadingGoals,
    isError: isErrorGoals,
    error: goalsError // <-- GET THIS
  } = useGoalsQuery(userId);

  // --- NEW: GOAL MUTATIONS ---
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  // Combine loading/error states
  const isLoading = isLoadingSessions || isLoadingGoals;
  const isError = isErrorSessions || isErrorGoals;
  const error = sessionsError || goalsError; // Get the first error

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="dashboard"><Home className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
        <TabsTrigger value="goals"><Target className="h-4 w-4 mr-2" />Goals</TabsTrigger>
        <TabsTrigger value="sessions"><Clock className="h-4 w-4 mr-2" />Sessions</TabsTrigger>
        <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" />Analytics</TabsTrigger>
        <TabsTrigger value="export"><Download className="h-4 w-4 mr-2" />Export</TabsTrigger>
      </TabsList>

      {/* Dashboard Tab */}
      <TabsContent value="dashboard">
        <Dashboard
          sessions={sessions || []}
          onStartSession={onStartSessionClick}
        />
      </TabsContent>

      {/* Goals Tab */}
      <TabsContent value="goals">
        <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
          <Goals
            sessions={sessions || []}
            goals={goals || []}
            onGoalCreate={(data) => createGoalMutation.mutate(data)}
            onGoalUpdate={(id, updates) => updateGoalMutation.mutate({ id, updates })}
            onGoalDelete={(id) => deleteGoalMutation.mutate(id)}
          />
        </ConnectedDataRenderer>
      </TabsContent>

      {/* Sessions Tab */}
      <TabsContent value="sessions">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Session History</h2>
          <Button onClick={onStartSessionClick}>
            <Clock className="mr-2 h-4 w-4" />New Session
          </Button>
        </div>
        <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
          <SessionLog sessions={sessions || []} />
        </ConnectedDataRenderer>
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics">
        <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
          <Analytics sessions={sessions || []} />
        </ConnectedDataRenderer>
      </TabsContent>

      {/* Export Tab */}
      {/* Note: You can now pass `goals={goals || []}` to ExportData as well */}
      <TabsContent value="export">
        <ExportData
          sessions={sessions || []}
          goals={goals || []}
          onExport={async (format, options) => {
            handleExport({
              format,
              options,
              sessions: sessions || [],
              goals: goals || [],
            });
          }} />
      </TabsContent>
    </Tabs>
  );
};

// --- Generic Helper for Loading/Error ---
const ConnectedDataRenderer = ({
  isLoading,
  isError,
  error, // <-- 4. RECEIVE THE ERROR PROP
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error: Error | null; // <-- 5. ADD THE TYPE
  children: React.ReactNode;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- 6. RENDER THE ACTUAL ERROR ---
  if (isError) {
    // Also log it to the console for good measure
    if (error) console.error("TanStack Query Error:", error);

    return (
      <div className="text-center py-10 text-destructive">
        <p>Error loading data. Please try again.</p>
        {/* This will show us the error message! */}
        {error && (
          <p className="text-xs mt-2 font-mono">
            <strong>Debug Info:</strong> {error.message}
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
};