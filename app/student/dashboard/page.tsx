import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl } from '@/lib/auth-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">View today&apos;s assigned topic and questions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Log your daily question progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">View your progress and statistics</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

