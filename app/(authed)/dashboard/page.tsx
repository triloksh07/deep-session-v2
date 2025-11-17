// app/dashboard/page.tsx (server)
import dynamic from "next/dynamic";
const DashboardShell = dynamic(() => import("./_components/DashboardShell"), { ssr: false });
export default function DashboardPage() {
  return <DashboardShell />;
}
