'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LogoutButtonProps = {
  compact?: boolean;
  className?: string;
};

export function LogoutButton({
  compact = false,
  className,
}: LogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: '/signin' });
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('gap-2 text-destructive hover:text-destructive', className)}
      onClick={() => void handleLogout()}
      disabled={isSigningOut}
      aria-label={compact ? 'Log out' : undefined}
    >
      {isSigningOut ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden />
      )}
      {compact ? null : (
        <span>{isSigningOut ? 'Logging out…' : 'Log out'}</span>
      )}
    </Button>
  );
}
