import { Navbar } from './_components/Navbar2';
import { useAuth } from '@/context/AuthProvider';
import ConnectedDataRenderer from '@/components/ConnectedDataRenderer';
import { useDashboard } from "./_components/DashboardProvider";
import DashboardProvider from "./_components/DashboardProvider";
// import { Auth } from "@/components/Auth";
import { useRouter, redirect } from 'next/navigation';

export const metadata = { title: 'DeepSession' };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const { isLoading, isError, error } = useDashboard();
  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading DeepSession...</p>
        </div>
      </div>
    );
  }

  // useEffect(() => {
  //     if (!user) {
  //         router.push("/login"); // client-side redirect
  //     }
  // }, [user, router]);

  if (!user) {
    redirect("/login"); // ✅ runs before render
  }

  if (!user) {
    return null; // render nothing until redirect happens
  }

  return (
    <DashboardProvider userId={user.uid}>
      <ConnectedDataRenderer isLoading={isLoading} isError={isError} error={error}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className='container mx-auto p-6 max-w-7xl'>{children}</div>
        </div>
      </ConnectedDataRenderer>
    </DashboardProvider>
  )
}