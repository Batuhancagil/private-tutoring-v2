import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/health'];

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/api'];

// Role-based route prefixes
const roleRoutes: Record<string, string[]> = {
  SUPERADMIN: ['/admin', '/superadmin'],
  TEACHER: ['/teacher', '/students', '/assignments', '/resources'],
  STUDENT: ['/student', '/log'],
  PARENT: ['/parent'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check authentication
    if (!token) {
      // Redirect to login if not authenticated
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      // Invalid token, clear cookie and redirect
      const response = pathname.startsWith('/api')
        ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));

      response.cookies.delete('auth-token');
      return response;
    }

    // Check role-based access
    for (const [role, routes] of Object.entries(roleRoutes)) {
      if (
        routes.some((route) => pathname.startsWith(route)) &&
        payload.role !== role
      ) {
        // User doesn't have required role
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { error: 'Access denied: insufficient permissions' },
            { status: 403 }
          );
        }
        // Redirect to appropriate dashboard based on role
        const dashboardUrl = getDashboardUrl(payload.role);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    }
  }

  // If user is authenticated and tries to access login, redirect to dashboard
  if (pathname === '/login' && token) {
    const payload = verifyToken(token);
    if (payload) {
      const dashboardUrl = getDashboardUrl(payload.role);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  return NextResponse.next();
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'SUPERADMIN':
      return '/admin/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    case 'PARENT':
      return '/parent/dashboard';
    default:
      return '/dashboard';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

