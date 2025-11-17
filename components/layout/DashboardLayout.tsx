import { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';
import { LogoutButton } from '@/components/LogoutButton';
import { Navigation } from '@/components/layout/Navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

