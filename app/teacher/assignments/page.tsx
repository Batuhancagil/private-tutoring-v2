import { requireTeacherWithSubscription } from '@/lib/teacher-page-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AssignmentsPageClient } from '@/components/teacher/AssignmentsPageClient';

export default async function AssignmentsPage() {
  await requireTeacherWithSubscription();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignment Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage assignments for your students
          </p>
        </div>

        <AssignmentsPageClient />
      </div>
    </DashboardLayout>
  );
}

