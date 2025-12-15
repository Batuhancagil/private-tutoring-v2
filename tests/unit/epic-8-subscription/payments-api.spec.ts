/**
 * Epic 8, Story 8.2: Payments API - Unit Tests
 * 
 * Tests for payments API endpoint:
 * - Payment creation
 * - Payment listing
 * - Validation
 * - Authorization (Superadmin only)
 */

import { NextRequest } from 'next/server';
import { GET as getHandler, POST as postHandler } from '@/app/api/admin/payments/route';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/api-helpers', () => ({
  withRole: (handler: any) => handler,
}));

jest.mock('@/lib/error-logger', () => ({
  logApiError: jest.fn(),
}));

jest.mock('@/lib/performance-monitor', () => ({
  trackPerformance: jest.fn(),
}));

describe('Story 8.2: Payments API [P0]', () => {
  const mockSuperadminId = 'superadmin-123';
  const mockSubscriptionId = 'subscription-123';

  const mockSuperadmin = {
    userId: mockSuperadminId,
    role: UserRole.SUPERADMIN,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Creation', () => {
    test('[P0] 8.2-UNIT-001: Creates payment with valid data', async () => {
      // Given: Valid payment data
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        id: mockSubscriptionId,
        teacherId: 'teacher-123',
      });

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment-123',
        subscriptionId: mockSubscriptionId,
        amount: 100.50,
        paymentDate: new Date('2025-11-25'),
        notes: 'Cash payment',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: mockSubscriptionId,
          amount: 100.50,
          paymentDate: '2025-11-25',
          notes: 'Cash payment',
        }),
      });
      
      // When: Payment is created
      const response = await postHandler(request, mockSuperadmin);
      const data = await response.json();

      // Then: Payment is created successfully
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(prisma.payment.create).toHaveBeenCalled();
    });

    test('[P0] 8.2-UNIT-002: Validates amount > 0', async () => {
      // Given: Invalid payment amount (0 or negative)
      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: mockSubscriptionId,
          amount: 0,
          paymentDate: '2025-11-25',
        }),
      });
      
      // When: Payment is created with invalid amount
      const response = await postHandler(request, mockSuperadmin);
      const data = await response.json();

      // Then: Validation error is returned
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('[P0] 8.2-UNIT-003: Validates subscription exists', async () => {
      // Given: Non-existent subscription
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: 'non-existent',
          amount: 100,
          paymentDate: '2025-11-25',
        }),
      });
      
      // When: Payment is created for non-existent subscription
      const response = await postHandler(request, mockSuperadmin);
      const data = await response.json();

      // Then: Error is returned
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Payment Listing', () => {
    test('[P0] 8.2-UNIT-004: Lists all payments', async () => {
      // Given: Payments exist
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'payment-1',
          subscriptionId: mockSubscriptionId,
          amount: 100,
          paymentDate: new Date('2025-11-25'),
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'payment-2',
          subscriptionId: mockSubscriptionId,
          amount: 150,
          paymentDate: new Date('2025-11-26'),
          notes: 'Cash',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/payments');
      
      // When: Payments are listed
      const response = await getHandler(request, mockSuperadmin);
      const data = await response.json();

      // Then: Payments are returned
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(2);
    });

    test('[P0] 8.2-UNIT-005: Filters payments by subscriptionId', async () => {
      // Given: Payments exist for multiple subscriptions
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/admin/payments?subscriptionId=${mockSubscriptionId}`
      );
      
      // When: Payments are listed with subscription filter
      const response = await getHandler(request, mockSuperadmin);
      const data = await response.json();

      // Then: Filter is applied
      expect(response.status).toBe(200);
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscriptionId: mockSubscriptionId,
          }),
        })
      );
    });
  });
});

