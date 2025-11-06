'use client';

// ... (all existing imports)
import { useSyncActiveSession } from '@/hooks/useSyncActiveSession'; // --- ADD ---
import { useStartSessionMutation } from '@/hooks/useTimerMutations'; // --- ADD ---

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  // ... (other state: isLoading, authLoading, providerLoading)

  // ... (useEffect for onAuthStateChanged)

  // --- ADD THIS HOOK ---
  // This syncs our Zustand store with Firestore in real-time
  // and handles cross-device updates.
  useSyncActiveSession(user?.uid);
  // ---

  // ... (all auth handlers: handleLogin, handleSignup, etc.)

  // --- RENDER LOGIC ---
  if (isLoading) {
    // ... (loading spinner)
  }

  if (!user) {
    // ... (Auth component)
  }

  // --- Main Authenticated View ---
  return (
    <div className="min-h-screen bg-background">
      {/* ... (Navbar) ... */}

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Pass the user object down */}
        <DashboardContent user={user} />
      </div>
    </div>
  );
}

// --- Helper Component to Manage Views ---
const DashboardContent = ({ user }: { user: FirebaseUser }) => {
  // --- Client-side View State ---
  // We no longer use a local 'currentView' state for the session
  const isSessionActive = useSessionStore((state) => state.isActive);
  const startSessionMutation = useStartSessionMutation(); // --- ADD ---
  
  // This state is *only* for showing the form vs. the dashboard
  const [showForm, setShowForm] = useState(false);
  
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

  // --- Default View: The Dashboard Tabs ---
  return <DashboardTabs onStartSessionClick={handleStartSessionClick} userId={user.uid} />;
};

// ... (DashboardTabs component is unchanged)
// ... (ConnectedDataRenderer component is unchanged)