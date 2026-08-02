/**
 * Quest claim feedback.
 *
 * The claim mutation had `onSuccess` only, and the row played its reward chime
 * on CLICK. So a failed claim congratulated the learner with a success sound
 * and then did nothing at all — no toast, no spinner, no explanation — and the
 * natural response (tap again) aborted the previous request via the shared
 * `quests:claim` tag. Rewards were never actually at risk (the server
 * transition 409s on re-claim), but silence reads as a broken button.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const playSfx = vi.fn();
const showToast = vi.fn();
const claim = vi.fn();

vi.mock("@/shared/audio/sfx", () => ({ playSfx: (n: string) => playSfx(n) }));
vi.mock("@/shared/contexts/ToastContext", () => ({
  useToastOptional: () => ({ showToast }),
}));
vi.mock("@/shared/api/provider", () => ({
  useApiOptional: () => ({
    quests: { list: async () => [], claim, bumpProgress: vi.fn(), refresh: vi.fn() },
  }),
}));

import { useQuests } from "./useQuests";

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useQuests — claim feedback", () => {
  beforeEach(() => {
    playSfx.mockReset();
    showToast.mockReset();
    claim.mockReset();
  });

  it("toasts and stays silent when the claim fails", async () => {
    claim.mockRejectedValue(new Error("500"));

    const { result } = renderHook(() => useQuests(), { wrapper: wrapper() });
    act(() => result.current.claim("daily-reviews"));

    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(showToast.mock.calls[0][1]).toBe("error");
    // The reward chime must NOT fire for a claim that never landed.
    expect(playSfx).not.toHaveBeenCalled();
  });

  it("plays the reward chime only once the claim actually lands", async () => {
    claim.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useQuests(), { wrapper: wrapper() });
    act(() => result.current.claim("daily-reviews"));

    await waitFor(() => expect(playSfx).toHaveBeenCalledWith("match"));
    expect(showToast).not.toHaveBeenCalled();
  });

  it("exposes isClaiming so the button can block a double-fire", async () => {
    let release: (v: unknown) => void = () => {};
    claim.mockImplementation(() => new Promise((res) => (release = res)));

    const { result } = renderHook(() => useQuests(), { wrapper: wrapper() });
    expect(result.current.isClaiming).toBe(false);

    act(() => result.current.claim("daily-reviews"));
    await waitFor(() => expect(result.current.isClaiming).toBe(true));

    await act(async () => {
      release({ ok: true });
    });
    await waitFor(() => expect(result.current.isClaiming).toBe(false));
  });
});
