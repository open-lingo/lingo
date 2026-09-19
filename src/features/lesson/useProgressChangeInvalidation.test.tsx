import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  emitProgressChanged,
  resetProgressEventsForTests,
} from "@/shared/domain/progressEvents";
import { useProgressChangeInvalidation } from "./useProgressChangeInvalidation";

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useProgressChangeInvalidation", () => {
  beforeEach(() => resetProgressEventsForTests());

  it("invalidates progress/me for every reason except pull_ignoring_reset", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");
    renderHook(() => useProgressChangeInvalidation(), { wrapper: wrapper(client) });

    emitProgressChanged("lesson_end");
    expect(spy).toHaveBeenCalledWith({ queryKey: ["progress", "me"] });

    spy.mockClear();
    emitProgressChanged("pull_ignoring_reset");
    expect(spy).not.toHaveBeenCalledWith({ queryKey: ["progress", "me"] });
  });

  it("invalidates the quest list for lesson-shaped reasons, not for srs_sync or ui_mutation", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");
    renderHook(() => useProgressChangeInvalidation(), { wrapper: wrapper(client) });

    emitProgressChanged("bulk_complete");
    expect(spy).toHaveBeenCalledWith({ queryKey: ["core", "quests", "list"] });

    spy.mockClear();
    emitProgressChanged("srs_sync");
    expect(spy).not.toHaveBeenCalledWith({ queryKey: ["core", "quests", "list"] });

    spy.mockClear();
    emitProgressChanged("ui_mutation");
    expect(spy).not.toHaveBeenCalledWith({ queryKey: ["core", "quests", "list"] });
  });

  it("still bumps quests for pull_ignoring_reset even though progress/me is skipped", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");
    renderHook(() => useProgressChangeInvalidation(), { wrapper: wrapper(client) });

    emitProgressChanged("pull_ignoring_reset");
    expect(spy).toHaveBeenCalledWith({ queryKey: ["core", "quests", "list"] });
  });
});
