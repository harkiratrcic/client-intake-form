import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '../../lib/auth/server-session';
import { Header } from '../../components/dashboard/header';
import { Sidebar } from '../../components/dashboard/sidebar';

// Force all dashboard pages to be dynamic since they require authentication
export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession();
  if (!session.success) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header owner={session.owner} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Dashboard - FormFlow',
    description: 'Immigration consultant dashboard for form management.',
  };
}