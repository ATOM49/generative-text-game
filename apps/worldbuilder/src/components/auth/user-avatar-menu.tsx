'use client';

import { signOut, useSession } from 'next-auth/react';
import { Loader2, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_LABELS } from '@/lib/auth/roles';

function getInitials(name?: string | null) {
  if (!name) return '??';
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return name.slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserAvatarMenu() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Explorer';
  const displayName = user?.name || user?.email || 'Signed in user';
  const email = user?.email;
  const avatarAlt = displayName || 'User avatar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open user menu"
          className="rounded-full border border-border p-0.5 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent"
        >
          <Avatar>
            <AvatarImage src={user?.image ?? undefined} alt={avatarAlt} />
            <AvatarFallback>
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                getInitials(displayName)
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-semibold leading-tight">
            {displayName}
          </span>
          {email && (
            <span className="text-xs text-muted-foreground">{email}</span>
          )}
          <span className="inline-flex w-fit items-center rounded-full border border-sidebar-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground">
            {roleLabel}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
