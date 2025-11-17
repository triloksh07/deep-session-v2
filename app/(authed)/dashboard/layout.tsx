import { Navbar } from '@/components/comp/Navbar';

export const metadata = { title: 'Dashboard - DeepSession' };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className='container mx-auto p-6 max-w-7xl'>{children}</div>
    </div>
  )
}