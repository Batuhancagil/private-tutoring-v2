import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardUrl, checkSubscriptionAccess } from './auth-helpers';

/**
 * Require teacher authentication and active subscription
 * Use this in teacher page components
 */
export async function requireTeacherWithSubscription() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'TEACHER') {
    redirect(getDashboardUrl(user.role));
  }

  // Check subscription status
  const hasActiveSubscription = await checkSubscriptionAccess(user);
  if (!hasActiveSubscription) {
    redirect('/subscription-expired');
  }

  return user;
}

