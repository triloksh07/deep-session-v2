// components/NetworkStatusHandler.tsx
'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// This component's sole purpose is to run a client-side hook
// at the root of the application. It renders nothing.
export function NetworkStatusHandler() {
  useNetworkStatus();
  return null;
}