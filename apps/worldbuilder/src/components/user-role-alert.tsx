'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserRoleAlertProps {
  userName?: string | null;
  userEmail?: string | null;
  roleLabel: string;
  canCreateWorld: boolean;
}

export function UserRoleAlert({
  userName,
  userEmail,
  roleLabel,
  canCreateWorld,
}: UserRoleAlertProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card px-4 py-3 text-sm">
        <p className="font-semibold leading-tight">{userName || userEmail}</p>
        <p className="text-xs text-muted-foreground">Role: {roleLabel}</p>
      </div>

      {!canCreateWorld && (
        <Alert>
          <AlertTitle>Explorer access only</AlertTitle>
          <AlertDescription>
            Feel free to wander and check in on your favorite realms—builders
            still hold the keys to editing them.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
