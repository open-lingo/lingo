import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/shared/api/client";

const register = vi.fn();
const getMe = vi.fn();
vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ users: { register: (...a: unknown[]) => register(...a), getMe: () => getMe(), updateMe: vi.fn() } }),
}));

import { useOwnProfile } from "./useOwnProfile";

const me = { id: "u1", username: "spencer", display_name: "Spencer" };
const initial = { username: "spencer", displayName: "Spencer", bio: "", avatarUrl: "" };

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

async function save() {
  const { result } = renderHook(() => useOwnProfile(initial, { registerMode: true }), { wrapper });
  act(() => result.current.openEdit(initial));
  act(() => { result.current.save(); });
  return result;
}

describe("first-run registration (TestFlight #33)", () => {
  beforeEach(() => { register.mockReset(); getMe.mockReset(); });

  it("treats a 409 'User already registered' as success when /users/me resolves", async () => {
    register.mockRejectedValue(new ApiError(409, { detail: "User already registered" }));
    getMe.mockResolvedValue(me);
    const result = await save();
    await waitFor(() => expect(result.current.saveError).toBeNull());
    expect(result.current.editMode).toBe(false);
  });

  it("recovers a lost response: register fails, but the user now exists", async () => {
    register.mockRejectedValue(new TypeError("Load failed"));
    getMe.mockResolvedValue(me);
    const result = await save();
    await waitFor(() => expect(result.current.saveError).toBeNull());
  });

  it("still reports a real username clash", async () => {
    register.mockRejectedValue(new ApiError(409, { detail: "Username already taken" }));
    getMe.mockRejectedValue(new ApiError(404, { detail: "Not found" }));
    const result = await save();
    await waitFor(() => expect(result.current.saveError).toBe("Username already taken."));
  });
});
