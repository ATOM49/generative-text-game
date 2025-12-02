// app/providers.jsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CopilotKit } from '@copilotkit/react-core';
import { SessionProvider } from 'next-auth/react';
import '@copilotkit/react-textarea/styles.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());
  const COPILOT_CLOUD_PUBLIC_API_KEY =
    process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY;

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <CopilotKit publicApiKey={COPILOT_CLOUD_PUBLIC_API_KEY}>
          {children}
        </CopilotKit>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
