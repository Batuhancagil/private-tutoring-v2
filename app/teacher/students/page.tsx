import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentsPageClient } from '@/components/teacher/StudentsPageClient';

export default async function StudentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'TEACHER') {
    redirect(getDashboardUrl(user.role));
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Student Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage student accounts
          </p>
        </div>

        <StudentsPageClient />
      </div>
    </DashboardLayout>
  );
}

