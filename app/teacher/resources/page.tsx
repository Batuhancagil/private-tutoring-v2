import { requireTeacherWithSubscription } from '@/lib/teacher-page-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResourcesPageClient } from '@/components/teacher/ResourcesPageClient';

export default async function ResourcesPage() {
  await requireTeacherWithSubscription();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Resource Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage lessons, topics, and resources
          </p>
        </div>

        <ResourcesPageClient />
      </div>
    </DashboardLayout>
  );
}

