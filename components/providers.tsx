'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// We create the client inside the component, but wrap it in useState
// to ensure it's only created once per component lifecycle.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // We can set some sensible defaults here
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false, // Optional: turn off auto-refetch
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures the QueryClient is only created once
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}