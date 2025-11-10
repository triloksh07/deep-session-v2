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
import { Navbar } from '@/components/comp/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveTabTrigger } from '@/components/customUI/ResponsiveTabsTrigger';
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
import { useSessionStore } from '@/store/sessionStore';
import { Session, Goal, User } from '@/types'; // <-- 3. USE THE SHARED TYPES
import { useSessionsQuery } from '@/hooks/useSessionsQuery'; // <-- 1. IMPORT THE NEW HOOK
import { useQueryClient } from '@tanstack/react-query';
import { useGoalsQuery } from '@/hooks/useGoalsQuery'; // <-- 2. IMPORT GOALS HOOK
import { useSyncActiveSession } from '@/hooks/useSyncActiveSession'; // --- ADD ---
import {
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from '@/hooks/useGoalMutations';
import { fetchSessions } from '@/hooks/useSessionsQuery';
import { fetchGoals } from '@/hooks/useGoalsQuery';
import { handleExport } from '@/lib/exportUtils'; // <-- 1. IMPORT NEW HANDLER
import { useTabSync } from '@/hooks/useTabSync';
import { toast } from 'sonner';
// imports from v0
// import TimerCard from '@/components/comp/TimerCard';
// import TodayStatsCard from '@/components/comp/TodayStats';
// import RecentSessions from '@/components/comp/RecentSession';
// import AuthComponent from "@/components/AuthComponent";
// import Link from 'next/link';
// import { useTabSync } from '@/hooks/useTabSync'; // 👈 Import the hook
// import PersistentTimer, { TimerHandle } from '@/lib/PersistentTimer';

// --- CREATE THE PROVIDER INSTANCES ---
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// --- Main App Component ---
export default function App() {
  const queryClient = useQueryClient(); // 4. Get the client
  useTabSync();

  // Service worker registration remains the same.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('Service Worker registered:', registration))
        .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, []);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState(false); // For Google/GitHub

  // --- THIS IS THE FIX ---
  // We were calling this with user?.uid, which is undefined on first render.
  // We must ensure this hook only runs *after* the user is set.
  const [isAuthReady, setIsAuthReady] = useState(false);


  // --- 5. ADD THIS PRE-FETCHING HOOK ---
  useEffect(() => {
    // Run this only when the user object is available
    if (user?.uid) {
      console.log("User logged in. Pre-fetching data for offline use...");

      // Pre-fetch sessions to prime the cache
      queryClient.prefetchQuery({
        queryKey: ['sessions', user.uid],
        queryFn: () => fetchSessions(user.uid),
      });

      // Pre-fetch goals to prime the cache
      queryClient.prefetchQuery({
        queryKey: ['goals', user.uid],
        queryFn: () => fetchGoals(user.uid),
      });
    }
  }, [user, queryClient]); // Runs once when 'user' becomes available

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

  // --- ADD THIS HOOK ---
  // This syncs our Zustand store with Firestore in real-time
  // and handles cross-device updates.
  useSyncActiveSession(isAuthReady ? user : null);
  // --- END OF FIX ---

  // --- Auth Handlers ---
  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the user state update
      setAuthLoading(false);
      return { success: true };
    } catch (error: unknown) {
      setAuthLoading(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
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
    } catch (error: unknown) {
      setAuthLoading(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
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
    } catch (error: unknown) {
      // ... (error handling)
      setProviderLoading(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const handleGoogleSignIn = () => handleProviderSignIn('google');
  const handleGitHubSignIn = () => handleProviderSignIn('github');
  const handleLogout = async () => {
    await signOut(auth);
    // No need to refresh, onAuthStateChanged will set user to null
  };

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

  // This is the DASHBOARD
  // --- Main Authenticated View ---
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* home page nav bar */}
      {/* <div className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-4xl">
          <div>
            <h1 className="text-xl font-medium">DeepSession</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.displayName || user.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User avatar"}
                className="w-8 h-8 rounded-full"
                width={50}
                height={48}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-medium text-primary">
                  {user.displayName?.split(' ').map(n => n[0]).join('') || <UserIcon />}
                </span>
              </div>
            )}
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
      </div> */}

      {/* Dashboard & Session Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <DashboardContent user={user} />
      </div>
    </div>
  );
}

// --- New Helper Component to Manage Views ---
const DashboardContent = ({ user }: { user: FirebaseUser }) => {
  // --- Client-side View State ---
  // const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'session'>('dashboard');
  const startSession = useSessionStore((state) => state.startSession);
  const isSessionActive = useSessionStore((state) => state.isActive);
  // const startSessionMutation = useStartSessionMutation(); // --- ADD ---
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

  // --- View Handlers ---
  const handleStartSessionClick = () => {
    setShowForm(true); // Just show the form
  };

  // { title: string; type: string; notes: string }
  const handleFormSubmit = (sessionData: Partial<Session>) => {
    // Use the mutation. This will optimistically update
    // our Zustand store, which will make 'isSessionActive' true,
    // which will close the form and show the tracker.
    // startSessionMutation.mutate(sessionData);
    startSession(sessionData as Session);
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

  // --- Default View: The Dashboard Tabs ---
  // This component calls the hook once and distributes data
  return (
    <>
      <DashboardTabs
        onStartSessionClick={handleStartSessionClick}
        userId={user?.uid} // <-- Pass the userId to the next component
      />
    </>
  );
};

// --- UPDATED DashboardContent ---
// It now receives the user object as a prop

// --- New Helper Component for Tabs ---
const DashboardTabs = ({ onStartSessionClick, userId }: { onStartSessionClick: () => void; userId: string; }) => {

  // We'll set the default tab to 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- Server-side Data ---
  // Call the hook ONCE for all tabs
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    isError: isErrorSessions,
    error: sessionsError // <-- GET THIS
  } = useSessionsQuery(userId,
    // Only fetch if the user is logged in AND one of these tabs is active
    !!userId && (activeTab === 'sessions' || activeTab === 'analytics' || activeTab === 'export'));

  // --- NEW: GOALS DATA ---
  const {
    data: goals,
    isLoading: isLoadingGoals,
    isError: isErrorGoals,
    error: goalsError // <-- GET THIS
  } = useGoalsQuery(userId,
    // Only fetch if the user is logged in AND the goals tab is active
    !!userId && activeTab === 'goals');

  // --- NEW: GOAL MUTATIONS ---
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  // Combine loading/error states
  const isLoading = isLoadingSessions || isLoadingGoals;
  const isError = isErrorSessions || isErrorGoals;
  const error = sessionsError || goalsError; // Get the first error

  return (
    <Tabs
      defaultValue="dashboard"
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-6 grow flex flex-col">
      {/* <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="dashboard"><Home className="h-4 w-4 mr-2" />Dashboard
        </TabsTrigger>
        <TabsTrigger value="goals"><Target className="h-4 w-4 mr-2" />Goals</TabsTrigger>
        <TabsTrigger value="sessions"><Clock className="h-4 w-4 mr-2" />Sessions</TabsTrigger>
        <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" />Analytics</TabsTrigger>
        <TabsTrigger value="export"><Download className="h-4 w-4 mr-2" />Export</TabsTrigger>
        </TabsList> 
      */}

      <TabsList className="grid w-full grid-cols-5">
        {/* --- See how much cleaner this is? --- */}
        <ResponsiveTabTrigger value="dashboard" icon={Home} text="Dashboard" />
        <ResponsiveTabTrigger value="goals" icon={Target} text="Goals" />
        <ResponsiveTabTrigger value="sessions" icon={Clock} text="Sessions" />
        <ResponsiveTabTrigger value="analytics" icon={BarChart3} text="Analytics" />
        <ResponsiveTabTrigger value="export" icon={Download} text="Export" />
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