import { redirect } from 'next/navigation';
import { getCurrentUser, requireRole } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MessagesPageClient } from '@/components/messaging/MessagesPageClient';

export default async function TeacherMessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user is a teacher
  try {
    await requireRole('TEACHER');
  } catch {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Communicate with your students
          </p>
        </div>

        <MessagesPageClient />
      </div>
    </DashboardLayout>
  );
}

