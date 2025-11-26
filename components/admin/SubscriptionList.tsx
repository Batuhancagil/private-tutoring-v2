'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExpirationWarning } from './ExpirationWarning';
import type { ExpirationInfo } from '@/lib/subscription-helpers';

interface Subscription {
  id: string;
  teacherId: string;
  teacher: {
    id: string;
    username: string;
  };
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'upcoming';
  expirationInfo?: ExpirationInfo;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  subscriptionId: string;
  amount: string;
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  payments?: Payment[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onRecordPayment: (subscriptionId: string) => void;
}

export function SubscriptionList({
  subscriptions,
  payments = [],
  onEdit,
  onDelete,
  onRecordPayment,
}: SubscriptionListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTotalPayments = (subscriptionId: string) => {
    return payments
      .filter((p) => p.subscriptionId === subscriptionId)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No subscriptions found.</p>
            <p className="text-sm">Create a subscription to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Teacher
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Start Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  End Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Payments
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {subscription.teacher.username}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {formatDate(subscription.startDate)}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {formatDate(subscription.endDate)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                      {subscription.expirationInfo && (
                        <ExpirationWarning
                          daysUntilExpiration={subscription.expirationInfo.daysUntilExpiration}
                          status={subscription.expirationInfo.status}
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {formatCurrency(getTotalPayments(subscription.id))}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onRecordPayment(subscription.id)}
                        className="text-sm"
                      >
                        Payment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onEdit(subscription)}
                        className="text-sm"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => onDelete(subscription)}
                        className="text-sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

