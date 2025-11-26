'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Payment {
  id?: string;
  subscriptionId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

interface Subscription {
  id: string;
  teacherId: string;
  teacher: {
    id: string;
    username: string;
  };
  startDate: string;
  endDate: string;
}

interface PaymentFormProps {
  subscriptionId?: string; // Pre-select subscription if provided
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({
  subscriptionId: initialSubscriptionId,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [subscriptionId, setSubscriptionId] = useState(initialSubscriptionId || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  // Fetch subscriptions list
  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const response = await fetch('/api/admin/subscriptions');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch subscriptions');
        }

        setSubscriptions(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      } finally {
        setLoadingSubscriptions(false);
      }
    }

    fetchSubscriptions();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!subscriptionId) {
      setError('Subscription is required');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!paymentDate) {
      setError('Payment date is required');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          amount: parseFloat(amount),
          paymentDate,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment');
      }

      // Success - reset form and call callback
      setSubscriptionId(initialSubscriptionId || '');
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="subscriptionId" required>
              Subscription
            </Label>
            <select
              id="subscriptionId"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              disabled={loading || loadingSubscriptions || !!initialSubscriptionId}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a subscription</option>
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.teacher.username} ({new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="amount" required>
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentDate" required>
              Payment Date
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">
              Notes (Optional)
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingSubscriptions}>
              {loading ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

