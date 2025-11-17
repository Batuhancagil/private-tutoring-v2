import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';
import { UserRole } from '@prisma/client';

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Require authentication - throws error if not authenticated
 */
export function requireAuth(request: NextRequest): JWTPayload {
  const user = getAuthUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require specific role - throws error if user doesn't have the role
 */
export function requireRole(
  request: NextRequest,
  role: UserRole
): JWTPayload {
  const user = requireAuth(request);

  if (user.role !== role) {
    throw new Error(`Access denied: ${role} role required`);
  }

  return user;
}

/**
 * Require one of multiple roles
 */
export function requireAnyRole(
  request: NextRequest,
  roles: UserRole[]
): JWTPayload {
  const user = requireAuth(request);

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
 * API route wrapper that handles authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = requireAuth(request);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      throw error;
    }
  };
}

/**
 * API route wrapper that handles role-based access control
 */
export function withRole(
  role: UserRole,
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = requireRole(request, role);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Access denied')) {
          return NextResponse.json(
            { error: error.message },
            { status: 403 }
          );
        }
      }
      throw error;
    }
  };
}

/**
 * API route wrapper that handles multiple roles
 */
export function withAnyRole(
  roles: UserRole[],
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = requireAnyRole(request, roles);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Access denied')) {
          return NextResponse.json(
            { error: error.message },
            { status: 403 }
          );
        }
      }
      throw error;
    }
  };
}

