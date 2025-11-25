import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  teacherId?: string | null;
}

// Convert secret string to Uint8Array for jose
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secretKey = getSecretKey();
  
  // Calculate expiration time (24 hours from now)
  const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
  
  const jwt = await new SignJWT({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    teacherId: payload.teacherId ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setSubject(payload.userId)
    .sign(secretKey);

  return jwt;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as UserRole,
      teacherId: (payload.teacherId as string | null) ?? null,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

