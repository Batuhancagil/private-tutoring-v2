'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { JWTPayload } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

interface NavigationProps {
  user: JWTPayload | null;
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return null;
  }

  const roleLinks = getRoleLinks(user.role);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Tutoring Dashboard
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:items-baseline md:space-x-4">
              {roleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${
                      isActive(link.href)
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Info and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.username}
              </span>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:text-indigo-200">
                {user.role}
              </span>
            </div>
            <LogoutButton />

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {/* Mobile User Info */}
              <div className="sm:hidden px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.username}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {user.role}
                </div>
              </div>
              {/* Mobile Navigation Links */}
              {roleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block rounded-md px-3 py-2 text-base font-medium transition-colors
                    ${
                      isActive(link.href)
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
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

