import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { logApiError } from '@/lib/error-logger';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Fetch fresh user data
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        role: true,
        teacherId: true,
        createdAt: true,
      },
    });

    if (!userData) {
      logApiError('Auth', `User not found: ${user.userId}`, new Error('User not found'), request, user);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    logApiError('Auth', 'Error fetching user data', error, request, user);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

