import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { LogoutButton } from '@/components/LogoutButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Redirect to role-specific dashboard
  switch (user.role) {
    case 'SUPERADMIN':
      redirect('/admin/dashboard');
    case 'TEACHER':
      redirect('/teacher/dashboard');
    case 'STUDENT':
      redirect('/student/dashboard');
    case 'PARENT':
      redirect('/parent/dashboard');
    default:
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p className="mb-4">Welcome, {user.username}!</p>
            <p className="mb-4">Role: {user.role}</p>
            <LogoutButton />
          </div>
        </div>
      );
  }
}

