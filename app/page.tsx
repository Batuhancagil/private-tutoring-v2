import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    // Redirect authenticated users to their dashboard
    redirect('/dashboard');
  }

  // Redirect unauthenticated users to login
  redirect('/login');
}

