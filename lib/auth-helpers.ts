import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './auth';
import { UserRole } from '@prisma/client';
import { prisma } from './prisma';
import { isSubscriptionActive } from './subscription-helpers';

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

/**
 * Check if user has active subscription (for teachers)
 * @param user - User payload
 * @returns true if subscription is active or user doesn't need subscription, false if expired
 */
export async function checkSubscriptionAccess(user: JWTPayload): Promise<boolean> {
  // Superadmin, Students, and Parents don't need subscriptions
  if (user.role !== 'TEACHER') {
    return true;
  }

  // Check if teacher has an active subscription
  const subscription = await prisma.subscription.findUnique({
    where: { teacherId: user.userId },
  });

  if (!subscription) {
    // No subscription found - deny access
    return false;
  }

  return isSubscriptionActive(subscription.startDate, subscription.endDate);
}

/**
 * Require active subscription - throws error if subscription is expired
 */
export async function requireActiveSubscription(user: JWTPayload): Promise<void> {
  const hasAccess = await checkSubscriptionAccess(user);
  
  if (!hasAccess) {
    throw new Error('Access denied: subscription expired');
  }
}

