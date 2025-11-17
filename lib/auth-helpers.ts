import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './auth';

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

  return verifyToken(token);
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

