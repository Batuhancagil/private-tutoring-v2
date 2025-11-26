import { requireTeacherWithSubscription } from '@/lib/teacher-page-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarPageClient } from '@/components/teacher/CalendarPageClient';

export default async function CalendarPage() {
  await requireTeacherWithSubscription();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignment Calendar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View assignments in calendar format with weekly and daily details
          </p>
        </div>

        <CalendarPageClient />
      </div>
    </DashboardLayout>
  );
}

