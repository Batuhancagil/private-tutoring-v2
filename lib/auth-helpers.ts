import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './auth';
import { UserRole } from '@prisma/client';

/**
 * Get the current authenticated user from the request
 * Use this in server components and API routes
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require specific role - throws error if user doesn't have the role
 */
export async function requireRole(role: string): Promise<JWTPayload> {
  const user = await requireAuth();

  if (user.role !== role) {
    throw new Error(`Access denied: ${role} role required`);
  }

  return user;
}

/**
 * Get dashboard URL based on user role
 * Maps user roles to their respective dashboard routes
 */
export function getDashboardUrl(role: UserRole | string): string {
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

