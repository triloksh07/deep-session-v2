'use client'
// app/dashboard/page.tsx (server)
import dynamic from "next/dynamic";
import { useAuth } from '@/context/AuthProvider';
import DashboardProvider from "./_components/DashboardProvider";
import { useRouter, redirect } from 'next/navigation';

const DashboardShell = dynamic(() => import("./_components/DashboardShell"), { ssr: false });
export default function DashboardPage() {
  const { user, loading } = useAuth();
  // const router = useRouter();

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

  return (
    <DashboardProvider userId={user.uid}>
      <DashboardShell />
    </DashboardProvider>
  )
}

// app/(authed)/dashboard/page.tsx
// import { redirect } from "next/navigation";

// export default function DashboardIndex() {
//   redirect("/dashboard/overview");
// }
