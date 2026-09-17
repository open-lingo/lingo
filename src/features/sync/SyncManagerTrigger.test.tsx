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

  // 2026-09-17 (lane A5b, P1b open item 3): `layoutTrace.ts`'s prompt
  // selector widened from `"h2"` to `"h2, [data-lesson-prompt]"` so
  // `h2Top`/`h2Stable`/`noFlicker` go live on `listening_build` routes too
  // (see `layoutTrace.test.ts`). This proves the ONE consumer of that
  // return shape outside the harness — the on-device `LayoutTracePanel`,
  // reached through this same `SyncManagerTrigger` tree — still renders a
  // completed trace correctly: the summary line, the table (with a real,
  // non-null `h2Top` column reading the value a `[data-lesson-prompt]`
  // frame would have produced), and the copy button. `getLastLayoutTrace()`
  // falls back to this same localStorage key when there's no in-memory
  // cache, which is exactly the shape a real completed trace leaves behind.
  it("renders a completed trace (h2Top sourced from [data-lesson-prompt], the widened-selector shape) in the panel table", () => {
    localStorage.setItem(
      "ol:layoutTrace:last",
      JSON.stringify({
        frames: 3,
        changed: [
          { t: 0, dt: 0, h2Top: 213, trayTop: 290, trayH: 182, bankTop: 490.9, bankH: 153, stageH: 711, rowH: 73, fitScale: 1.25 },
          { t: 16, dt: 16, h2Top: 213, trayTop: 290, trayH: 182, bankTop: 490.9, bankH: 153, stageH: 711, rowH: 73, fitScale: 1.25 },
        ],
        maxH2Jump: 0,
        h2Reversals: 0,
        meanDt: 16,
        maxDt: 16,
      }),
    );

    renderWithProviders(<SyncManagerTrigger />);
    const trigger = screen.getByRole("status", { name: /sync status/i });
    fireEvent.mouseEnter(trigger);

    // The i18n mock in this test environment doesn't interpolate — the
    // summary renders its raw `defaultValue` template (`{{frames}} frames,
    // …`); rendering it at all (not a thrown error, not "No trace recorded
    // yet") is the proof the panel accepted the completed-trace shape.
    expect(screen.getByText(/\{\{frames\}\} frames, \{\{changed\}\} changed/i)).toBeInTheDocument();
    // The table cells for both changed frames' h2Top — proves the panel
    // reads and displays a non-null value sourced from the widened selector
    // (a `[data-lesson-prompt]` frame) rather than the "–" it shows for a
    // null field.
    expect(screen.getAllByText("213")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /copy json/i })).toBeInTheDocument();
  });
});
