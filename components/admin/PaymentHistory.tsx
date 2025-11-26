'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Payment {
  id: string;
  subscriptionId: string;
  subscription?: {
    id: string;
    teacher: {
      id: string;
      username: string;
    };
  };
  amount: string;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  subscriptionId?: string; // Optional filter by subscription
}

export function PaymentHistory({ payments, subscriptionId }: PaymentHistoryProps) {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total
  const totalAmount = payments.reduce((sum, payment) => {
    return sum + parseFloat(payment.amount);
  }, 0);

  // Filter payments if subscriptionId provided
  const filteredPayments = subscriptionId
    ? payments.filter((p) => p.subscriptionId === subscriptionId)
    : payments;

  if (filteredPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No payments recorded yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Payment History</CardTitle>
          {filteredPayments.length > 0 && (
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total: {formatCurrency(totalAmount.toString())}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {!subscriptionId && (
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Teacher
                  </th>
                )}
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {!subscriptionId && (
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {payment.subscription?.teacher.username || 'N/A'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {payment.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredPayments.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  {!subscriptionId && <td className="py-3 px-4"></td>}
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Total</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {formatCurrency(totalAmount.toString())}
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

