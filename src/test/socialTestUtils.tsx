/**
 * Test-only helpers that wrap social-feature unit tests in the minimum
 * provider stack their hooks now require: a `QueryClient` (because the
 * hooks always invoke `useQuery` even when the API path is gated off), a
 * `ToastProvider` (because mutation hooks call `useToast()` at render
 * time), and optional API mocking via `vi.mock` at the call site.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import type { ReactNode } from "react";

export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function MockSocialProviders({
  children,
  client,
}: {
  children: ReactNode;
  client?: QueryClient;
}) {
  const qc = client ?? makeTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
