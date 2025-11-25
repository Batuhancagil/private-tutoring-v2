'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ParentFormProps {
  onSuccess: (parent: { id: string; username: string }) => void;
  onCancel: () => void;
}

export function ParentForm({ onSuccess, onCancel }: ParentFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }

    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Please fix password validation errors');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/teacher/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create parent');
      }

      // Success - reset form and call callback
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setPasswordErrors([]);
      onSuccess(data.data);
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
        <CardTitle>Create Parent Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="username" required>
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={loading}
              required
            />
            {passwordErrors.length > 0 && (
              <ul className="mt-1 list-disc list-inside text-sm text-red-600 dark:text-red-400">
                {passwordErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          {password && (
            <div>
              <Label htmlFor="confirmPassword" required>
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Parent'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

