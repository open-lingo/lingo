/**
 * Tests for AdminUsersListPage — pagination, header-driven sort, search.
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

function makeUser(
  id: string,
  overrides: Partial<{ username: string; xp: number; display_name: string }> = {},
) {
  return {
    id,
    auth0_id: `auth0|${id}`,
    username: overrides.username ?? id,
    display_name: overrides.display_name ?? id.toUpperCase(),
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

  it("renders the paginated table with rows", async () => {
    mockAdmin.listUsers.mockResolvedValue({
      items: [makeUser("alice"), makeUser("bob")],
      nextCursor: "20",
    });
    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText(/Page/)).toBeInTheDocument();
  });

  it("requests pages of 20 from the backend", async () => {
    mockAdmin.listUsers.mockResolvedValue({ items: [], nextCursor: null });
    wrap(<AdminUsersListPage />);
    await waitFor(() =>
      expect(mockAdmin.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 }),
      ),
    );
  });

  it("pages forward when Next is clicked, sending the previous cursor", async () => {
    mockAdmin.listUsers
      .mockResolvedValueOnce({ items: [makeUser("alice")], nextCursor: "20" })
      .mockResolvedValueOnce({ items: [makeUser("zoe")], nextCursor: null });

    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() => expect(screen.getByText("@zoe")).toBeInTheDocument());

    expect(mockAdmin.listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: "20", limit: 20 }),
    );
  });

  it("clicking a column header sorts the visible page client-side without a refetch", async () => {
    mockAdmin.listUsers.mockResolvedValue({
      items: [
        makeUser("alice", { xp: 100 }),
        makeUser("bob", { xp: 500 }),
        makeUser("carol", { xp: 50 }),
      ],
      nextCursor: null,
    });

    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());
    const callsBefore = mockAdmin.listUsers.mock.calls.length;

    // First click → ascending by XP.
    fireEvent.click(screen.getByRole("button", { name: /Sort by XP/i }));
    await waitFor(() => {
      const cells = screen.getAllByText(/^@/).map((el) => el.textContent);
      expect(cells).toEqual(["@carol", "@alice", "@bob"]);
    });
    // No refetch — sort is local.
    expect(mockAdmin.listUsers.mock.calls.length).toBe(callsBefore);

    // Second click → descending by XP.
    fireEvent.click(screen.getByRole("button", { name: /Sort by XP/i }));
    await waitFor(() => {
      const cells = screen.getAllByText(/^@/).map((el) => el.textContent);
      expect(cells).toEqual(["@bob", "@alice", "@carol"]);
    });
    expect(mockAdmin.listUsers.mock.calls.length).toBe(callsBefore);

    // Third click → unsorted (original server order).
    fireEvent.click(screen.getByRole("button", { name: /Sort by XP/i }));
    await waitFor(() => {
      const cells = screen.getAllByText(/^@/).map((el) => el.textContent);
      expect(cells).toEqual(["@alice", "@bob", "@carol"]);
    });
    expect(mockAdmin.listUsers.mock.calls.length).toBe(callsBefore);
  });

  it("typing in the search box debounces and refetches with the search arg", async () => {
    mockAdmin.listUsers
      .mockResolvedValueOnce({ items: [makeUser("alice")], nextCursor: null })
      .mockResolvedValue({ items: [makeUser("zoe")], nextCursor: null });

    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/Search users/i);
    fireEvent.change(input, { target: { value: "zoe" } });

    await waitFor(() => {
      const last = mockAdmin.listUsers.mock.lastCall?.[0];
      expect(last?.search).toBe("zoe");
      expect(last?.cursor).toBeUndefined();
    });
  });

  it("renders the empty-state when no users match", async () => {
    mockAdmin.listUsers.mockResolvedValue({ items: [], nextCursor: null });
    wrap(<AdminUsersListPage />);
    await waitFor(() => expect(screen.getByText(/No users found/i)).toBeInTheDocument());
  });
});
