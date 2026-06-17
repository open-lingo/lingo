import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockGetSettings = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { sub: "auth0|abc" } }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({ users: { getSettings: mockGetSettings } }),
}));

vi.mock("@/features/admin/impersonation/ImpersonationContext", () => ({
  useImpersonation: () => null,
}));

import { useUserSettings } from "./useUserSettings";

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useUserSettings", () => {
  beforeEach(() => {
    mockGetSettings.mockReset();
    mockGetSettings.mockResolvedValue({
      shop: { purchases: ["title-explorer"], equippedDecorator: "ring-gold" },
      theme: "dark",
    });
  });

  it("shares ONE fetch across consumers with different selectors", async () => {
    const wrapper = makeWrapper();

    const decorator = renderHook(
      () =>
        useUserSettings({
          select: (d) =>
            (d.shop as Record<string, unknown> | undefined)?.equippedDecorator ?? null,
        }),
      { wrapper },
    );
    const shop = renderHook(
      () =>
        useUserSettings({
          select: (d) =>
            ((d.shop as Record<string, unknown> | undefined)?.purchases as string[]) ?? [],
        }),
      { wrapper },
    );

    await waitFor(() => expect(decorator.result.current.data).toBe("ring-gold"));
    await waitFor(() =>
      expect(shop.result.current.data).toEqual(["title-explorer"]),
    );

    // Two consumers, one shared cache entry => exactly one network read.
    expect(mockGetSettings).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when unauthenticated via the enabled flag", () => {
    const wrapper = makeWrapper();
    renderHook(() => useUserSettings({ enabled: false }), { wrapper });
    expect(mockGetSettings).not.toHaveBeenCalled();
  });
});
