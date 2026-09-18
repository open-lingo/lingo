import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// TestFlight #208 (docs/user-feedback/2026-09-18-testflight-b32.md, lead
// clarification): on a phone the account menu's phone-only "Sync &
// diagnostics" row expands `SyncManagerTrigger`'s own absolutely-positioned
// popover INLINE inside the account dropdown. Combined with the dropdown's
// own items above it, the compound stack runs well past the viewport with no
// scroll container anywhere in the chain — "Can't see this, make it a menu
// on phone." Fix: tapping that row now closes the account dropdown and opens
// the sync/diagnostics panel as its own full-height bottom Sheet (dedicated
// scroll container, close affordance) — same controls, `SyncManager`
// `renderMode="inline"` (see SyncManager.test.tsx for that piece in
// isolation). The row's own markup (`data-testid`, label, the nested
// `SyncManagerTrigger`) is unchanged; only what tapping it does changed —
// intercepted in the capture phase so `SyncManagerTrigger`'s own internal
// popover never opens instead.

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "auth0|123", name: "Spencer", email: "spencer@lichfieldfamily.com" },
  }),
}));

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ users: { getMe: () => Promise.resolve({ role: "learner" }) } }),
}));

vi.mock("@/shared/contexts/ModalContext", () => ({
  useModal: () => ({ openSettings: () => {} }),
}));

vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => ({
    social: { enabled: false },
    community: { enabled: false, tabs: { contribute: false } },
  }),
}));

vi.mock("@/shared/contexts/ThemeContext", () => ({
  useTheme: () => ({ openThemeEditor: () => {} }),
}));

vi.mock("@/features/shop/useEquippedDecorator", () => ({
  useEquippedDecorator: () => ({ style: null }),
}));

const syncManagerTriggerSpy = vi.fn();
vi.mock("@/features/sync/SyncManagerTrigger", () => ({
  SyncManagerTrigger: (props: { renderMode?: string }) => {
    syncManagerTriggerSpy(props);
    return <div data-testid="sync-manager-trigger">{props.renderMode ?? "popover"}</div>;
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_k: string, def?: string) => def ?? _k }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "ja",
  useLangPath: () => (path: string) => `/ja/${path.replace(/^\//, "")}`,
}));

import { AuthMenu } from "./AuthMenu";

afterEach(() => {
  cleanup();
  syncManagerTriggerSpy.mockClear();
});

function renderMenu() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthMenu />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function openAccountMenu() {
  fireEvent.click(screen.getByRole("button", { name: /accountMenu/i }));
}

describe("AuthMenu — phone Sync & diagnostics row opens a sheet (#208)", () => {
  it("the phone-only sync row is still in the account dropdown, unchanged markup", () => {
    renderMenu();
    openAccountMenu();
    const row = screen.getByTestId("auth-menu-sync-row");
    expect(row).toBeInTheDocument();
    expect(row.textContent).toMatch(/Sync & diagnostics|syncLabel/);
  });

  it("tapping the sync row closes the account dropdown and opens a Sheet, not SyncManagerTrigger's own popover", () => {
    renderMenu();
    openAccountMenu();

    // No dialog yet — the account dropdown is a plain absolute panel, not a dialog.
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByTestId("auth-menu-sync-row"));

    // Account dropdown item (unique to the dropdown) is gone.
    expect(screen.queryByText("Theme")).toBeNull();

    // The sync/diagnostics sheet is open.
    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toBeNull();
  });

  it("the sheet renders SyncManagerTrigger in inline mode (no nested popover chrome)", () => {
    renderMenu();
    openAccountMenu();
    fireEvent.click(screen.getByTestId("auth-menu-sync-row"));

    const triggers = screen.getAllByTestId("sync-manager-trigger");
    // One inside the (now-closed, but not yet unmounted by cleanup) dropdown's
    // row markup, one inside the sheet — the sheet's copy must be "inline".
    expect(triggers.some((el) => el.textContent === "inline")).toBe(true);
  });

  it("the sheet closes on its own close control", () => {
    renderMenu();
    openAccountMenu();
    fireEvent.click(screen.getByTestId("auth-menu-sync-row"));
    expect(screen.getByRole("dialog")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
