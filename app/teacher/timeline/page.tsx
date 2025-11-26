import { requireTeacherWithSubscription } from '@/lib/teacher-page-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TimelinePageClient } from '@/components/teacher/TimelinePageClient';

export default async function TimelinePage() {
  await requireTeacherWithSubscription();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignment Timeline
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Visualize assignments across time for all your students
          </p>
        </div>

        <TimelinePageClient />
      </div>
    </DashboardLayout>
  );
}

