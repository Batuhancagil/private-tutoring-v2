'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

/**
 * ThresholdConfig Component
 * Allows teachers to customize accuracy threshold
 */
export function ThresholdConfig() {
  const [threshold, setThreshold] = useState<number>(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchThreshold() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/teacher/preferences/threshold');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch threshold');
        }

        setThreshold(result.data.threshold);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load threshold');
      } finally {
        setLoading(false);
      }
    }

    fetchThreshold();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Validate threshold
      if (threshold < 0 || threshold > 100) {
        setError('Threshold must be between 0 and 100');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/teacher/preferences/threshold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threshold }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save threshold');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save threshold');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setThreshold(70);
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading threshold...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accuracy Threshold Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="threshold">Accuracy Threshold (%)</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  setThreshold(value);
                }
              }}
              className="mt-1"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Set the accuracy threshold for color coding and alerts (0-100%). Default: 70%
            </p>
            {threshold < 0 || threshold > 100 ? (
              <p className="mt-1 text-sm text-red-500">
                Threshold must be between 0 and 100
              </p>
            ) : null}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-600 dark:text-green-400">
              Threshold saved successfully! All views will update automatically.
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || threshold < 0 || threshold > 100}>
              {saving ? 'Saving...' : 'Save Threshold'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset to Default (70%)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

