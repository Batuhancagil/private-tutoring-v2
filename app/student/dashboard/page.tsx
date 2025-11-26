import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TodaysAssignmentCard } from '@/components/student/TodaysAssignmentCard';
import { ProgressLogForm } from '@/components/student/ProgressLogForm';

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'STUDENT') {
    redirect(getDashboardUrl(user.role));
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Student Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Log your daily progress and view your assignments
          </p>
        </div>

        <TodaysAssignmentCard />
        <ProgressLogForm />
      </div>
    </DashboardLayout>
  );
}

