'use client';

import { useState, useEffect } from 'react';
import { JWTPayload } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface UseAuthReturn {
  user: JWTPayload | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccessTenant: (targetTeacherId: string | null) => boolean;
}

/**
 * Client-side hook for authentication and role checks
 * Fetches current user from /api/auth/me endpoint
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const canAccessTenant = (targetTeacherId: string | null): boolean => {
    if (!user) {
      return false;
    }

    // SUPERADMIN can access all tenants
    if (user.role === 'SUPERADMIN') {
      return true;
    }

    // Users can access their own tenant data
    return user.teacherId === targetTeacherId;
  };

  return {
    user,
    loading,
    hasRole,
    hasAnyRole,
    canAccessTenant,
  };
}

