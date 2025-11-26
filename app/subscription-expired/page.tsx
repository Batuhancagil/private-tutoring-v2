import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl } from '@/lib/auth-helpers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SubscriptionExpiredClient } from '@/components/SubscriptionExpiredClient';

export default async function SubscriptionExpiredPage() {
  const user = await getCurrentUser();

  // If not logged in, redirect to login
  if (!user) {
    redirect('/login');
  }

  // If not a teacher, redirect to their dashboard
  if (user.role !== 'TEACHER') {
    redirect(getDashboardUrl(user.role));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-red-600 dark:text-red-400">
            Subscription Expired
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              Your subscription has expired. Please contact your administrator to renew your subscription.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Once your subscription is renewed, you will be able to access all features again.
            </p>
          </div>
          
          <SubscriptionExpiredClient />
        </CardContent>
      </Card>
    </div>
  );
}

