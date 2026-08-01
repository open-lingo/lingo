/**
 * AdminInnerShell route guard — ROLE, not just authentication.
 *
 * The guard checked `isAuthenticated` alone until 2026-08-01, so any signed-in
 * learner who typed `/admin` got the console shell, which then fired
 * `listAdminDecks({status:"draft"})` on mount. The server-side dependency is
 * the real boundary (see `test_admin.py::test_deck_admin_list_route_gated`);
 * this pins the client half so a non-admin never lands on the shell at all.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockAuth = vi.fn();
const mockMe = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({ useAuth: () => mockAuth() }));
vi.mock("@/shared/hooks/useMe", () => ({ useMe: () => mockMe() }));
// The marketing site is a different origin now, so an anonymous visitor leaves
// via window.location rather than a route. Stub it to observe the hand-off.
const mockGoToMarketing = vi.fn();
vi.mock("@/shared/config/marketing", () => ({
  goToMarketing: (...a: unknown[]) => mockGoToMarketing(...a),
  marketingUrl: (path = "/") => `https://marketing.test${path}`,
  MARKETING_ORIGIN: "https://marketing.test",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_k: string, d?: string) => d ?? "Loading…" }),
}));
// The shell body fetches; stub it out so the test isolates the guard.
vi.mock("./AdminSidebar", () => ({ AdminSidebar: () => <nav data-testid="sidebar" /> }));
vi.mock("./usePendingReviewCount", () => ({ usePendingReviewCount: () => 0 }));

import { AdminInnerShell } from "./AdminLayout";

function wrap(ui: ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/admin/home"]}>
      <Routes>
        <Route path="/admin/*" element={ui} />
        <Route path="/" element={<div data-testid="app-home" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminInnerShell guard", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockMe.mockReset();
  });

  it("redirects a signed-in NON-admin away from the console", () => {
    mockAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockMe.mockReturnValue({ me: { role: "user" }, isLoading: false });

    wrap(<AdminInnerShell />);

    expect(screen.getByTestId("app-home")).toBeTruthy();
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("sends an unauthenticated visitor to the marketing site", () => {
    mockAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockMe.mockReturnValue({ me: null, isLoading: false });

    wrap(<AdminInnerShell />);

    expect(mockGoToMarketing).toHaveBeenCalled();
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("admits admin and super_admin", () => {
    for (const role of ["admin", "super_admin"]) {
      mockAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
      mockMe.mockReturnValue({ me: { role }, isLoading: false });

      const { unmount } = wrap(<AdminInnerShell />);
      expect(screen.getByTestId("sidebar")).toBeTruthy();
      unmount();
    }
  });

  it("waits for the role instead of bouncing a real admin mid-fetch", () => {
    // Deciding while `getMe` is in flight would redirect every admin on every
    // page load — the guard must hold, not fail closed early.
    mockAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockMe.mockReturnValue({ me: null, isLoading: true });

    wrap(<AdminInnerShell />);

    expect(screen.queryByTestId("app-home")).toBeNull();
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("fails CLOSED when the role lookup yields nothing", () => {
    // A failed/404 getMe leaves `me` null. An admin gate must deny, not admit.
    mockAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockMe.mockReturnValue({ me: null, isLoading: false });

    wrap(<AdminInnerShell />);

    expect(screen.getByTestId("app-home")).toBeTruthy();
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("denies a moderator — community moderation is not site admin", () => {
    mockAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockMe.mockReturnValue({ me: { role: "moderator" }, isLoading: false });

    wrap(<AdminInnerShell />);

    expect(screen.getByTestId("app-home")).toBeTruthy();
  });
});
