import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import type { SyncSource } from "./types";

// TestFlight #208 (docs/user-feedback/2026-09-18-testflight-b32.md): the
// account menu's phone-only "Sync & diagnostics" row now opens this panel
// inside a dedicated Sheet instead of letting SyncManager open its own
// nested absolutely-positioned popover. `renderMode="inline"` is the piece
// that makes that possible — same panel body, no trigger button, no
// absolute positioning, always visible (the host owns open/close).

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _k }),
}));

afterEach(() => cleanup());

function source(overrides: Partial<SyncSource> = {}): SyncSource {
  return {
    id: "flashcards",
    label: "Flashcards",
    lastSyncAt: "2026-09-18T00:00:00.000Z",
    nextSyncAt: null,
    dirtyCount: 0,
    onSyncNow: () => Promise.resolve(),
    visible: true,
    ...overrides,
  };
}

describe("SyncManager renderMode", () => {
  it('"popover" (default): no controls visible until the trigger button is clicked', async () => {
    const { SyncManager } = await import("./SyncManager");
    render(<SyncManager sources={[source()]} />);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByText("Flashcards")).toBeNull();
    // The trigger button IS present.
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it('"inline": the panel body renders immediately, no trigger button, no role="menu" popover chrome', async () => {
    const { SyncManager } = await import("./SyncManager");
    render(<SyncManager sources={[source()]} renderMode="inline" />);

    // Same controls, visible without any click.
    expect(screen.getByText("Flashcards")).toBeInTheDocument();
    expect(screen.getByText("Sync")).toBeInTheDocument();

    // No popover-only chrome.
    expect(screen.queryByRole("menu")).toBeNull();
    // No icon-only trigger button (the synced source has no action button either).
    expect(screen.queryByRole("button")).toBeNull();
  });

  it('"inline" still surfaces a diagnostic row with its action, identical to popover mode', async () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    const { SyncManager } = await import("./SyncManager");
    render(
      <SyncManager
        sources={[source({ diagnostic: { line: "Layout trace (#174)", actionLabel: "Arm", onAction } })]}
        renderMode="inline"
      />,
    );
    expect(screen.getByText("Layout trace (#174)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arm" })).toBeInTheDocument();
  });

  it('"inline" with extra content renders it (Layout trace / diagnostics panels)', async () => {
    const { SyncManager } = await import("./SyncManager");
    render(
      <SyncManager
        sources={[source()]}
        renderMode="inline"
        extra={<div data-testid="extra-diagnostics">extra panel</div>}
      />,
    );
    expect(screen.getByTestId("extra-diagnostics")).toBeInTheDocument();
  });
});
