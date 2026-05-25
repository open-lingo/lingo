/**
 * Test-only helpers that wrap social-feature unit tests in the minimum
 * provider stack their hooks now require: a `QueryClient` (because the
 * hooks always invoke `useQuery` even when the API path is gated off) and
 * a stub `ApiProvider` (because the hooks call `useApiOptional()` — null
 * is fine, but components reading `useApi()` would throw).
 *
 * Tests that exercise mock-only paths can use `MockSocialProviders` —
 * the API path stays disabled because `isSocialApiEnabled()` checks
 * `import.meta.env.VITE_SOCIAL_API` which we leave unset in tests.
 *
 * Tests that exercise the API path can use `ApiSocialProviders` and
 * pass a `SocialApi` stub.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
