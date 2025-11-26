'use client';

import { Button } from '@/components/ui/Button';
import { LogoutButton } from '@/components/LogoutButton';

export function SubscriptionExpiredClient() {
  return (
    <div className="flex flex-col gap-2 pt-4">
      <LogoutButton />
      <Button
        variant="outline"
        onClick={() => {
          window.location.href = '/login';
        }}
        className="w-full"
      >
        Return to Login
      </Button>
    </div>
  );
}

