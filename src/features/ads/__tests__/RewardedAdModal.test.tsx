import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/shared/i18n/i18n";
import { ToastProvider } from "@/shared/contexts/ToastContext";

const TEST_UUID = "00000000-0000-4000-8000-000000000abc";

const mockWatched = vi.fn();

// Mock the API surface so the modal hits the mutation without needing a
// real `<ApiProvider>` (which would pull Auth0 + a base URL + ApiClient
// retry machinery). The mutation hook reads `useApi().ads.watched(...)`.
vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>(
    "@/shared/api",
  );
  return {
    ...actual,
    useApi: () => ({
      ads: {
        watched: (body: { idempotency_key: string; placement: string }) =>
          mockWatched(body),
      },
    }),
  };
});

// AdSense globals — the slot's effect calls `loadAdSenseScript` +
// `pushAdSenseSlot`. The placeholder branch (no env) means we don't
// touch these in the happy path, but stub anyway so module load is safe.
vi.mock("../adsense", () => ({
  loadAdSenseScript: vi.fn(),
  pushAdSenseSlot: vi.fn(),
  isAdSenseScriptLoaded: () => false,
}));

import { RewardedAdModal, REWARD_WATCH_SECONDS } from "../RewardedAdModal";
import { ApiError } from "@/shared/api/client";

function renderModal(onClose = vi.fn()) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const utils = render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <I18nextProvider i18n={i18n}>
          <RewardedAdModal idempotencyKey={TEST_UUID} onClose={onClose} />
        </I18nextProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { ...utils, onClose, qc };
}

beforeEach(() => {
  mockWatched.mockReset();
  // Default: env unset → renders placeholder (no AdSense traffic in tests).
  vi.stubEnv("VITE_ADSENSE_CLIENT_ID", "");
  vi.stubEnv("VITE_ADSENSE_REWARDED_SLOT_ID", "");
  vi.stubEnv("VITE_ADSENSE_CLIENT", "");
  vi.useFakeTimers({
    toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout"],
  });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllEnvs();
});

function advanceSeconds(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe("RewardedAdModal", () => {
  it("renders title + countdown + disabled claim button on open", () => {
    renderModal();
    expect(screen.getByText(/watch an ad to earn/i)).toBeInTheDocument();
    expect(screen.getByTestId("rewarded-status")).toHaveTextContent(
      /reward unlocks in 15s/i,
    );
    const claim = screen.getByTestId("rewarded-claim-button");
    expect(claim).toBeDisabled();
  });

  it("enables claim button after the 15s timer expires", () => {
    renderModal();
    advanceSeconds(REWARD_WATCH_SECONDS);

    expect(screen.getByTestId("rewarded-status")).toHaveTextContent(
      /reward ready/i,
    );
    const claim = screen.getByTestId("rewarded-claim-button");
    expect(claim).not.toBeDisabled();
  });

  it("fires the watched mutation with the expected payload on claim", async () => {
    mockWatched.mockResolvedValue({ lingots_awarded: 5, new_balance: 105 });
    const onClose = vi.fn();
    renderModal(onClose);

    advanceSeconds(REWARD_WATCH_SECONDS);
    const claim = screen.getByTestId("rewarded-claim-button");

    await act(async () => {
      fireEvent.click(claim);
    });

    expect(mockWatched).toHaveBeenCalledTimes(1);
    expect(mockWatched).toHaveBeenCalledWith({
      idempotency_key: TEST_UUID,
      placement: "modal_rewarded_v1",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses without API call when closed pre-timer", () => {
    const onClose = vi.fn();
    renderModal(onClose);

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockWatched).not.toHaveBeenCalled();
  });

  it("shows confirm dialog post-timer; reject keeps modal open, accept closes without API call", () => {
    const onClose = vi.fn();
    renderModal(onClose);

    advanceSeconds(REWARD_WATCH_SECONDS);

    // Click X — should surface the confirm modal, NOT close immediately.
    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    // The first "Close" is the ModalBase X. There may be a second
    // "Close without claiming" later — the X one is rendered first.
    fireEvent.click(closeButtons[0]);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/forfeit reward/i)).toBeInTheDocument();

    // Reject → confirm dialog disappears, main modal still open.
    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/forfeit reward/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("rewarded-claim-button")).toBeInTheDocument();
    expect(mockWatched).not.toHaveBeenCalled();

    // Re-open confirm and accept.
    const closeAgain = screen.getAllByRole("button", { name: /close/i });
    fireEvent.click(closeAgain[0]);
    const confirmBtn = screen.getByRole("button", {
      name: /close without claiming/i,
    });
    fireEvent.click(confirmBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockWatched).not.toHaveBeenCalled();
  });

  it("surfaces an info toast on 429 already_credited and closes", async () => {
    mockWatched.mockRejectedValue(
      new ApiError(429, { detail: "already_credited" }),
    );
    const onClose = vi.fn();
    renderModal(onClose);

    advanceSeconds(REWARD_WATCH_SECONDS);
    await act(async () => {
      fireEvent.click(screen.getByTestId("rewarded-claim-button"));
    });

    expect(mockWatched).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
