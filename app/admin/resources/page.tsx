import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminResourcesPageClient } from '@/components/admin/AdminResourcesPageClient';

export default async function AdminResourcesPage() {
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
            Pre-Built Resource Library
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage global resources accessible to all teachers
          </p>
        </div>

        <AdminResourcesPageClient />
      </div>
    </DashboardLayout>
  );
}


