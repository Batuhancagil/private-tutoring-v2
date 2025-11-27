import { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';
import { Navigation } from '@/components/layout/Navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} />
      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="py-2 sm:py-4 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

