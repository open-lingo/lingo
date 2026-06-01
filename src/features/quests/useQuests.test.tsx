import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useQuests } from "./useQuests";

/**
 * Outside an ``<ApiProvider>`` (component-tests, storybook, etc.) the
 * hook returns an empty + no-op surface so the consumer doesn't crash.
 * Real behavior (list/refetch/bump/claim) is exercised by the backend
 * test suite + end-to-end browser checks.
 */
function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useQuests", () => {
  it("returns an empty no-op surface when no ApiProvider is mounted", () => {
    const { result } = renderHook(() => useQuests(), { wrapper: makeWrapper() });
    expect(result.current.quests).toEqual([]);
    expect(result.current.summary.badgeCount).toBe(0);
    // Calling the mutators is safe even without an API.
    result.current.addProgress("daily-fifty-xp", 10);
    result.current.claim("daily-fifty-xp");
    result.current.refresh();
  });
});
