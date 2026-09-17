/**
 * Smoke test for the Sync panel with the two new diagnostics wired in
 * (#174 layout trace, #176a reset-flag). Pure-logic tests for the pieces
 * live in `layoutTrace.test.ts` and `pullFromServerIgnoringReset.test.ts` —
 * this just proves the real component tree mounts, the panel opens, and
 * both new controls render without throwing (the thing a pure-function test
 * can't catch: a missing provider, a hook called outside its context).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "user-1" },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    progress: { getMe: vi.fn().mockResolvedValue({ user: {}, lessons: [], concepts: [], last30days: [] }) },
    srs: { sync: vi.fn(), clearAll: vi.fn() },
  }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" }, isLoading: false }),
}));

// Imports use the mocks above.
import { SyncManagerTrigger } from "./SyncManagerTrigger";

function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("SyncManagerTrigger — #174 / #176a diagnostics wiring", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mounts and opens the panel without throwing", () => {
    renderWithProviders(<SyncManagerTrigger />);
    const trigger = screen.getByRole("status", { name: /sync status/i });
    expect(trigger).toBeInTheDocument();
  });

  it("shows the layout trace Arm control and the reset-flag pull control once opened", () => {
    renderWithProviders(<SyncManagerTrigger />);
    const trigger = screen.getByRole("status", { name: /sync status/i });
    fireEvent.mouseEnter(trigger);

    expect(screen.getByText(/layout trace/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arm" })).toBeInTheDocument();
    expect(screen.getByText(/sync diagnostics/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pull from server \(ignore local reset\)/i }),
    ).toBeInTheDocument();
  });

  it("arming from the panel sets the localStorage flag the lesson-stage listener reads", () => {
    renderWithProviders(<SyncManagerTrigger />);
    const trigger = screen.getByRole("status", { name: /sync status/i });
    fireEvent.mouseEnter(trigger);

    fireEvent.click(screen.getByRole("button", { name: "Arm" }));
    expect(localStorage.getItem("ol:layoutTrace:armed")).toBe("1");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
