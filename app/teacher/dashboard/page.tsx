import { requireTeacherWithSubscription } from '@/lib/teacher-page-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TeacherDashboardClient } from '@/components/teacher/TeacherDashboardClient';
import { ThresholdConfig } from '@/components/teacher/ThresholdConfig';

export default async function TeacherDashboardPage() {
  await requireTeacherWithSubscription();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Teacher Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage students, create assignments, and track progress
          </p>
        </div>

        <TeacherDashboardClient />

        {/* Threshold Configuration */}
        <ThresholdConfig />
      </div>
    </DashboardLayout>
  );
}

