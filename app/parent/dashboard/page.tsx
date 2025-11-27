import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ParentDashboardClient } from '@/components/parent/ParentDashboardClient';

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'PARENT') {
    redirect(getDashboardUrl(user.role));
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Parent Dashboard
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View your child&apos;s progress and communicate with teachers
          </p>
        </div>

        <ParentDashboardClient />
      </div>
    </DashboardLayout>
  );
}

