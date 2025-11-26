import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubscriptionsPageClient } from '@/components/admin/SubscriptionsPageClient';

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'SUPERADMIN') {
    redirect(getDashboardUrl(user.role));
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Subscription Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage teacher subscriptions
          </p>
        </div>

        <SubscriptionsPageClient />
      </div>
    </DashboardLayout>
  );
}

