'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const PROVIDERS = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'facebook', label: 'Continue with Facebook' },
];

interface SignInProvidersProps {
  callbackUrl?: string;
}

export function SignInProviders({ callbackUrl }: SignInProvidersProps) {
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setPendingProvider(provider);
    try {
      await signIn(provider, {
        callbackUrl: callbackUrl || '/',
      });
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          className="w-full"
          variant="outline"
          disabled={Boolean(pendingProvider)}
          onClick={() => handleSignIn(provider.id)}
        >
          {pendingProvider === provider.id ? 'Redirecting…' : provider.label}
        </Button>
      ))}
    </div>
  );
}
