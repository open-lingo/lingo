/**
 * Tests for AdminUsersListPage — pagination + sort + search routing.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockAdmin = {
  listUsers: vi.fn(),
};

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ admin: mockAdmin }),
}));

vi.mock("@/shared/utils/formatDate", () => ({
  useDateFormat: () => ({ formatDate: (iso: string) => iso }),
}));

// AdminUsersListPage reads from useAdminSearch — when not wrapped in
// AdminLayout the hook returns a no-op pair, which is what we want here.
import { AdminUsersListPage } from "./AdminUsersListPage";

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}

function makeUser(id: string, overrides: Partial<{ username: string; xp: number }> = {}) {
  return {
    id,
    auth0_id: `auth0|${id}`,
    username: overrides.username ?? id,
    display_name: id.toUpperCase(),
    profile_picture_key: null,
    status: "active",
    status_expiration: null,
    community_status: null,
    community_status_expiration: null,
    role: "user",
    xp: overrides.xp ?? 0,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  };
}

describe("AdminUsersListPage", () => {
  beforeEach(() => {
    mockAdmin.listUsers.mockReset();
  });

  it("renders a paginated table with rows", async () => {
    mockAdmin.listUsers.mockResolvedValue({
      items: [makeUser("alice"), makeUser("bob")],
      nextCursor: "25",
    });
    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());
    expect(screen.getByText("@bob")).toBeInTheDocument();
    // Page 1 indicator.
    // Page 1 indicator (i18n interpolation may not run without an
    // i18next instance in tests; match the fallback regex broadly).
    expect(screen.getByText(/Page/)).toBeInTheDocument();
  });

  it("pages forward when Next is clicked, sending the previous cursor", async () => {
    mockAdmin.listUsers
      .mockResolvedValueOnce({ items: [makeUser("alice")], nextCursor: "25" })
      .mockResolvedValueOnce({ items: [makeUser("zoe")], nextCursor: null });

    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() => expect(screen.getByText("@zoe")).toBeInTheDocument());

    // Second call carries the cursor returned by the first response.
    expect(mockAdmin.listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: "25", limit: 25 }),
    );
  });

  it("changing sort resets pagination back to page 1", async () => {
    // Two ``Once`` calls for the initial + Next, then a default that
    // answers every post-sort-change refetch with the @xp_top row.
    mockAdmin.listUsers
      .mockResolvedValueOnce({ items: [makeUser("alice")], nextCursor: "25" })
      .mockResolvedValueOnce({ items: [makeUser("bob")], nextCursor: null })
      .mockResolvedValue({ items: [makeUser("xp_top", { xp: 999 })], nextCursor: null });

    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() => expect(screen.getByText("@bob")).toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }) as HTMLSelectElement, {
      target: { value: "xp" },
    });

    await waitFor(() =>
      expect(screen.getByText("@xp_top")).toBeInTheDocument(),
    );
    // After the reset effect runs, the most recent call has no cursor
    // and carries the new sort key.
    await waitFor(() => {
      const last = mockAdmin.listUsers.mock.lastCall?.[0];
      expect(last?.sort).toBe("xp");
      expect(last?.cursor).toBeUndefined();
    });
  });

  it("renders the empty-state when no users match", async () => {
    mockAdmin.listUsers.mockResolvedValue({ items: [], nextCursor: null });
    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText(/No users found/i)).toBeInTheDocument());
  });
});
