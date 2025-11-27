import { redirect } from 'next/navigation';
import { getCurrentUser, requireRole } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MessagesPageClient } from '@/components/messaging/MessagesPageClient';

export default async function ParentMessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user is a parent
  try {
    await requireRole('PARENT');
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
            Communicate with your child's teacher
          </p>
        </div>

        <MessagesPageClient />
      </div>
    </DashboardLayout>
  );
}

