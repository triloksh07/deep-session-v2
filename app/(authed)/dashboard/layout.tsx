import { Navbar } from './_components/Navbar2';

export const metadata = { title: 'DeepSession' };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className='container mx-auto p-6 max-w-7xl'>{children}</main>
      </div>
  )
}