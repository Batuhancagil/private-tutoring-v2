/**
 * User Factory
 * 
 * Factory pattern for creating test users with realistic data.
 * Uses Faker.js for generating random but realistic test data.
 * Creates users directly in the database using Prisma.
 * 
 * Features:
 * - Auto-cleanup: Tracks created users and deletes them after tests
 * - Override support: Allows customizing specific fields
 * - Role-based creation: Supports different user roles (superadmin, teacher, student, parent)
 * - Direct database access: Uses Prisma to create users (no API dependency)
 * 
 * Usage:
 *   const factory = new UserFactory();
 *   const user = await factory.createUser({ username: 'testuser', role: 'teacher' });
 *   await factory.cleanup(); // Delete all created users
 */

import { faker } from '@faker-js/faker';
import { PrismaClient, UserRole as PrismaUserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export type UserRole = 'superadmin' | 'teacher' | 'student' | 'parent';

export interface CreateUserOptions {
  username?: string;
  password?: string;
  role?: UserRole;
  teacherId?: string | null;
  [key: string]: any; // Allow additional fields
}

export interface CreatedUser {
  id: string;
  username: string;
  password: string; // Store plain password for test use
  role: UserRole;
  teacherId?: string | null;
  [key: string]: any;
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Map test role to Prisma UserRole enum
 */
function mapRoleToPrisma(role: UserRole): PrismaUserRole {
  const roleMap: Record<UserRole, PrismaUserRole> = {
    superadmin: PrismaUserRole.SUPERADMIN,
    teacher: PrismaUserRole.TEACHER,
    student: PrismaUserRole.STUDENT,
    parent: PrismaUserRole.PARENT,
  };
  return roleMap[role] || PrismaUserRole.STUDENT;
}

export class UserFactory {
  private createdUsers: CreatedUser[] = [];
  private createdSubscriptions: string[] = []; // Track subscription IDs for cleanup

  /**
   * Create a test user directly in the database
   * 
   * @param overrides - Optional fields to override default generated values
   * @returns Created user object with id, username, password (plain), and role
   */
  async createUser(overrides: CreateUserOptions = {}): Promise<CreatedUser> {
    const role = (overrides.role || 'student') as UserRole;
    
    // Generate username if not provided (use timestamp to ensure uniqueness)
    const username = overrides.username || `test-${role}-${Date.now()}-${faker.string.alphanumeric(6)}`;
    
    // Generate password if not provided
    const plainPassword = overrides.password || 'TestPassword123';
    
    // Hash password for database storage
    const hashedPassword = await hashPassword(plainPassword);
    
    // Determine teacherId based on role
    let teacherId = overrides.teacherId;
    if (teacherId === undefined) {
      // Students and parents need a teacherId (tenant), teachers and superadmins don't
      if (role === 'student' || role === 'parent') {
        // For now, leave null - tests should provide teacherId explicitly
        teacherId = null;
      } else {
        // Teachers and superadmins are tenants themselves
        teacherId = null;
      }
    }

    try {
      // Create user directly in database using Prisma
      const created = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: mapRoleToPrisma(role),
          teacherId,
        },
      });
      
      // Store for cleanup (include plain password for test use)
      const testUser: CreatedUser = {
        id: created.id,
        username: created.username,
        password: plainPassword, // Store plain password for login tests
        role,
        teacherId: created.teacherId,
      };
      
      this.createdUsers.push(testUser);
      
      // If this is a teacher, create an active subscription automatically
      if (role === 'teacher') {
        await this.createSubscriptionForTeacher(created.id);
      }
      
      return testUser;
    } catch (error) {
      // Log error but don't fail silently
      console.error('UserFactory: Failed to create user in database:', error);
      throw error;
    }
  }

  /**
   * Create an active subscription for a teacher
   * 
   * @param teacherId - The teacher's user ID
   * @param monthsDuration - Number of months the subscription should last (default: 12)
   */
  async createSubscriptionForTeacher(teacherId: string, monthsDuration: number = 12): Promise<void> {
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsDuration);

    try {
      const subscription = await prisma.subscription.create({
        data: {
          teacherId,
          startDate: now,
          endDate: endDate,
        },
      });
      
      this.createdSubscriptions.push(subscription.id);
    } catch (error) {
      // If subscription already exists, that's okay - don't fail
      console.warn(`UserFactory: Failed to create subscription for teacher ${teacherId}:`, error);
    }
  }

  /**
   * Create a user with a specific role
   * 
   * @param role - User role (superadmin, teacher, student, parent)
   * @param overrides - Optional fields to override
   */
  async createUserWithRole(role: UserRole, overrides: CreateUserOptions = {}): Promise<CreatedUser> {
    return this.createUser({ ...overrides, role });
  }

  /**
   * Cleanup all created users and subscriptions
   * 
   * This method should be called automatically by the fixture,
   * but can be called manually if needed.
   */
  async cleanup(): Promise<void> {
    // Delete subscriptions first (they have foreign key constraints)
    for (const subscriptionId of this.createdSubscriptions) {
      try {
        await prisma.subscription.delete({
          where: { id: subscriptionId },
        });
      } catch (error) {
        // Log but don't fail - cleanup errors shouldn't break tests
        console.warn(`Failed to cleanup subscription ${subscriptionId}:`, error);
      }
    }
    
    // Delete all created users from database using Prisma
    for (const user of this.createdUsers) {
      try {
        await prisma.user.delete({
          where: { id: user.id },
        });
      } catch (error) {
        // Log but don't fail - cleanup errors shouldn't break tests
        // User might already be deleted or not exist
        console.warn(`Failed to cleanup user ${user.id}:`, error);
      }
    }
    
    // Clear the tracking arrays
    this.createdUsers = [];
    this.createdSubscriptions = [];
  }

  /**
   * Get count of created users (for debugging)
   */
  getCreatedCount(): number {
    return this.createdUsers.length;
  }
}

