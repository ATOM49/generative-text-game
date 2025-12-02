'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/lib/auth/roles';

export function UserMenu() {
  const { data: session, status } = useSession();
  const name = session?.user?.name || session?.user?.email || 'Signed in user';
  const role = session?.user?.role;

  return (
    <div className="rounded-lg border bg-sidebar-accent/20 p-3 text-sm">
      <div>
        <p className="font-semibold leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground">
          {role
            ? ROLE_LABELS[role]
            : status === 'loading'
              ? 'Loading…'
              : 'Unknown role'}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full"
        onClick={() => signOut({ callbackUrl: '/signin' })}
      >
        Sign out
      </Button>
    </div>
  );
}
