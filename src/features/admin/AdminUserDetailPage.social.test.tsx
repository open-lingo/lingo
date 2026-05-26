/**
 * Test the admin Social tab on AdminUserDetailPage. Mocks the AdminApi
 * so we don't touch real network. Covers:
 *   • The "Social" tab is rendered alongside the existing tabs.
 *   • Opening it fires the friend-request fetch and renders incoming + outgoing.
 *   • Clicking Accept fires the admin accept endpoint.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockAdmin = {
  getUser: vi.fn(),
  getUserSubscriptions: vi.fn(),
  getUserContent: vi.fn(),
  listFriendRequests: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
};

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ admin: mockAdmin }),
}));

vi.mock("@/shared/contexts/ToastContext", () => ({
  useToast: () => ({ showToast: () => {} }),
}));

vi.mock("@/shared/utils/formatDate", () => ({
  useDateFormat: () => ({ formatDate: (iso: string) => iso }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/${p}`,
}));

import { AdminUserDetailPage } from "./AdminUserDetailPage";

function renderPage(userId: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return render(
    <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
      <Routes>
        <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

describe("AdminUserDetailPage — Social tab", () => {
  beforeEach(() => {
    mockAdmin.getUser.mockReset();
    mockAdmin.getUserSubscriptions.mockReset();
    mockAdmin.getUserContent.mockReset();
    mockAdmin.listFriendRequests.mockReset();
    mockAdmin.acceptFriendRequest.mockReset();
    mockAdmin.declineFriendRequest.mockReset();

    mockAdmin.getUser.mockResolvedValue({
      id: "user-1",
      auth0_id: "auth0|1",
      username: "haru",
      display_name: "Haru",
      profile_picture_key: null,
      status: "active",
      status_expiration: null,
      community_status: null,
      community_status_expiration: null,
      role: "user",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    });
    mockAdmin.getUserSubscriptions.mockResolvedValue([]);
    mockAdmin.getUserContent.mockResolvedValue([]);
    mockAdmin.listFriendRequests.mockResolvedValue({
      incoming: [
        {
          user_id: "u-alice",
          username: "alice",
          display_name: "Alice",
          requested_at: "2026-05-01T00:00:00Z",
        },
      ],
      outgoing: [
        {
          user_id: "u-bob",
          username: "bob",
          display_name: "Bob",
          requested_at: "2026-05-01T00:00:00Z",
        },
      ],
    });
    mockAdmin.acceptFriendRequest.mockResolvedValue({ status: "accepted" });
    mockAdmin.declineFriendRequest.mockResolvedValue(undefined);
  });

  it("renders a Social tab and loads requests when opened", async () => {
    renderPage("user-1");
    // Wait for the user to load (the page renders a loading state until then).
    const socialTab = await screen.findByRole("button", { name: /social/i });
    expect(socialTab).toBeInTheDocument();
    fireEvent.click(socialTab);

    await waitFor(() => {
      expect(mockAdmin.listFriendRequests).toHaveBeenCalledWith("user-1");
    });
    await screen.findByText(/@alice/);
    await screen.findByText(/@bob/);
  });

  it("admin accept fires the endpoint with the right ids", async () => {
    renderPage("user-1");
    const socialTab = await screen.findByRole("button", { name: /social/i });
    fireEvent.click(socialTab);
    const acceptBtn = await screen.findByRole("button", { name: /accept/i });
    fireEvent.click(acceptBtn);
    await waitFor(() => {
      expect(mockAdmin.acceptFriendRequest).toHaveBeenCalledWith(
        "user-1",
        "u-alice",
      );
    });
  });
});
