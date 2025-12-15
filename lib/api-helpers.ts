import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';
import { UserRole } from '@prisma/client';
import { logApiError } from './error-logger';
import { trackPerformance } from './performance-monitor';
import { checkSubscriptionAccess } from './auth-helpers';

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await getAuthUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require specific role - throws error if user doesn't have the role
 */
export async function requireRole(
  request: NextRequest,
  role: UserRole
): Promise<JWTPayload> {
  const user = await requireAuth(request);

  if (user.role !== role) {
    throw new Error(`Access denied: ${role} role required`);
  }

  return user;
}

/**
 * Require one of multiple roles
 */
export async function requireAnyRole(
  request: NextRequest,
  roles: UserRole[]
): Promise<JWTPayload> {
  const user = await requireAuth(request);

  if (!roles.includes(user.role)) {
    throw new Error(`Access denied: One of [${roles.join(', ')}] roles required`);
  }

  return user;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: JWTPayload | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: JWTPayload | null, roles: UserRole[]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if user can access tenant data
 * SUPERADMIN can access all tenants, others can only access their own tenant
 */
export function canAccessTenant(
  user: JWTPayload | null,
  targetTeacherId: string | null
): boolean {
  if (!user) {
    return false;
  }

  // SUPERADMIN can access all tenants
  if (user.role === 'SUPERADMIN') {
    return true;
  }

  // Users can access their own tenant data
  return user.teacherId === targetTeacherId;
}

/**
 * Require tenant access - throws error if user cannot access tenant
 */
export function requireTenantAccess(
  user: JWTPayload,
  targetTeacherId: string | null
): void {
  if (!canAccessTenant(user, targetTeacherId)) {
    throw new Error('Access denied: insufficient tenant permissions');
  }
}

/**
 * API route wrapper that handles authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const endpoint = request.nextUrl.pathname;
    const method = request.method;
    let statusCode = 500;

    try {
      const user = await requireAuth(request);
      const response = await handler(request, user);
      statusCode = response.status;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      
      // Suppress "Dynamic server usage" errors during build time
      // These are expected when Next.js tries to statically generate routes that use cookies
      if (error instanceof Error && error.message.includes('Dynamic server usage')) {
        // Re-throw to let Next.js handle it - this is expected for dynamic routes
        throw error;
      }
      
      if (error instanceof Error && error.message === 'Authentication required') {
        logApiError('Auth', 'Authentication required', error, request);
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      logApiError('Auth', 'Unexpected error in withAuth', error, request);
      throw error;
    }
  };
}

/**
 * API route wrapper that handles role-based access control
 * Also checks subscription status for teachers
 */
export function withRole(
  role: UserRole,
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireRole(request, role);
      
      // Check subscription status for teachers
      if (role === UserRole.TEACHER) {
        const hasActiveSubscription = await checkSubscriptionAccess(user);
        if (!hasActiveSubscription) {
          logApiError('Auth', 'Subscription expired', new Error('Subscription expired'), request);
          return NextResponse.json(
            { 
              error: 'Subscription expired',
              code: 'SUBSCRIPTION_EXPIRED',
              redirect: '/subscription-expired'
            },
            { status: 403 }
          );
        }
      }
      
      return await handler(request, user);
    } catch (error) {
      // Suppress "Dynamic server usage" errors during build time
      // These are expected when Next.js tries to statically generate routes that use cookies
      if (error instanceof Error && error.message.includes('Dynamic server usage')) {
        // Re-throw to let Next.js handle it - this is expected for dynamic routes
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          logApiError('Auth', 'Authentication required', error, request);
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Access denied')) {
          logApiError('Auth', `Access denied - ${role} role required`, error, request);
          return NextResponse.json(
            { error: error.message },
            { status: 403 }
          );
        }
      }
      logApiError('Auth', 'Unexpected error in withRole', error, request);
      throw error;
    }
  };
}

/**
 * API route wrapper that handles multiple roles
 * Also checks subscription status for teachers
 */
export function withAnyRole(
  roles: UserRole[],
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireAnyRole(request, roles);
      
      // Check subscription status if TEACHER is in the allowed roles
      if (roles.includes(UserRole.TEACHER) && user.role === UserRole.TEACHER) {
        const hasActiveSubscription = await checkSubscriptionAccess(user);
        if (!hasActiveSubscription) {
          logApiError('Auth', 'Subscription expired', new Error('Subscription expired'), request);
          return NextResponse.json(
            { 
              error: 'Subscription expired',
              code: 'SUBSCRIPTION_EXPIRED',
              redirect: '/subscription-expired'
            },
            { status: 403 }
          );
        }
      }
      
      return await handler(request, user);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          logApiError('Auth', 'Authentication required', error, request);
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Access denied')) {
          logApiError('Auth', `Access denied - one of [${roles.join(', ')}] roles required`, error, request);
          return NextResponse.json(
            { error: error.message },
            { status: 403 }
          );
        }
      }
      logApiError('Auth', 'Unexpected error in withAnyRole', error, request);
      throw error;
    }
  };
}

