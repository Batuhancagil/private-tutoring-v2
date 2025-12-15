'use client';

import { useState, useEffect } from 'react';
import { SubscriptionList } from './SubscriptionList';
import { SubscriptionForm } from './SubscriptionForm';
import { PaymentForm } from './PaymentForm';
import { PaymentHistory } from './PaymentHistory';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

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
  expirationInfo?: {
    daysUntilExpiration: number;
    status: 'critical' | 'warning' | 'info' | 'none' | 'expired';
    isExpired: boolean;
    isExpiringSoon: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  subscriptionId: string;
  amount: string;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
  subscription?: {
    id: string;
    teacher: {
      id: string;
      username: string;
    };
  };
}

export function SubscriptionsPageClient() {
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSubscriptionForPayment, setSelectedSubscriptionForPayment] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] = useState<Subscription | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'created' | 'expiration'>('created');

  // Fetch payments on mount
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (showExpiringOnly) {
        params.append('expiringSoon', 'true');
      }
      if (sortBy === 'expiration') {
        params.append('sort', 'expiration');
      }
      
      const url = `/api/admin/subscriptions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch subscriptions');
      }

      setSubscriptions(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscriptions when filters change
  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showExpiringOnly, sortBy]);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      const result = await response.json();

      if (response.ok) {
        setPayments(result.data);
      }
    } catch (err) {
      // Silently fail - payments are optional
    }
  };

  const handleCreateClick = () => {
    setEditingSubscription(null);
    setShowForm(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowForm(true);
  };

  const handleDelete = (subscription: Subscription) => {
    setDeletingSubscription(subscription);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSubscription) return;

    try {
      const response = await fetch(`/api/admin/subscriptions/${deletingSubscription.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subscription');
      }

      // Refresh the list
      fetchSubscriptions();
      setDeletingSubscription(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete subscription. Please try again.'
      );
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSubscription(null);
    // Refresh the list
    fetchSubscriptions();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSubscription(null);
  };

  const handleRecordPayment = (subscriptionId: string) => {
    setSelectedSubscriptionForPayment(subscriptionId);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedSubscriptionForPayment(null);
    // Refresh payments
    fetchPayments();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedSubscriptionForPayment(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12 text-gray-500">Loading subscriptions...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12 text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {!showForm && !showPaymentForm ? (
        <>
          {/* Expiration Summary */}
          {subscriptions.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Expiration Summary
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-red-600 dark:text-red-400">
                        Critical ({subscriptions.filter(s => s.expirationInfo?.status === 'critical').length})
                      </span>
                      <span className="text-yellow-600 dark:text-yellow-400">
                        Warning ({subscriptions.filter(s => s.expirationInfo?.status === 'warning').length})
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        Info ({subscriptions.filter(s => s.expirationInfo?.status === 'info').length})
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Expired ({subscriptions.filter(s => s.expirationInfo?.status === 'expired').length})
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={showExpiringOnly ? 'primary' : 'outline'}
                      onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                    >
                      {showExpiringOnly ? 'Show All' : 'Show Expiring Only'}
                    </Button>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'created' | 'expiration')}
                      className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="created">Sort by Created</option>
                      <option value="expiration">Sort by Expiration</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end mb-4 gap-2">
            <Button onClick={handleCreateClick}>Create Subscription</Button>
            <Button variant="secondary" onClick={() => {
              setSelectedSubscriptionForPayment(null);
              setShowPaymentForm(true);
            }}>
              Record Payment
            </Button>
          </div>
          <SubscriptionList
            subscriptions={subscriptions}
            payments={payments}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRecordPayment={handleRecordPayment}
          />
          <div className="mt-6">
            <PaymentHistory payments={payments} />
          </div>
        </>
      ) : showPaymentForm ? (
        <PaymentForm
          subscriptionId={selectedSubscriptionForPayment || undefined}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      ) : (
        <SubscriptionForm
          subscription={editingSubscription}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingSubscription(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Subscription"
        message={`Are you sure you want to delete the subscription for "${deletingSubscription?.teacher.username}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

