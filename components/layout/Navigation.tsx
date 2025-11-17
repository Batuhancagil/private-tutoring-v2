import Link from 'next/link';
import { JWTPayload } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

interface NavigationProps {
  user: JWTPayload | null;
}

export function Navigation({ user }: NavigationProps) {
  if (!user) {
    return null;
  }

  const roleLinks = getRoleLinks(user.role);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Tutoring Dashboard
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              {roleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.username}
            </span>
            <span className="rounded-full bg-indigo-100 dark:bg-indigo-900 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:text-indigo-200">
              {user.role}
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

function getRoleLinks(role: string): Array<{ href: string; label: string }> {
  switch (role) {
    case 'SUPERADMIN':
      return [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/teachers', label: 'Teachers' },
        { href: '/admin/subscriptions', label: 'Subscriptions' },
      ];
    case 'TEACHER':
      return [
        { href: '/teacher/dashboard', label: 'Dashboard' },
        { href: '/teacher/students', label: 'Students' },
        { href: '/teacher/assignments', label: 'Assignments' },
        { href: '/teacher/resources', label: 'Resources' },
      ];
    case 'STUDENT':
      return [
        { href: '/student/dashboard', label: 'Dashboard' },
        { href: '/student/log', label: 'Log Progress' },
        { href: '/student/progress', label: 'My Progress' },
      ];
    case 'PARENT':
      return [
        { href: '/parent/dashboard', label: 'Dashboard' },
        { href: '/parent/progress', label: 'Child Progress' },
        { href: '/parent/messages', label: 'Messages' },
      ];
    default:
      return [{ href: '/dashboard', label: 'Dashboard' }];
  }
}

