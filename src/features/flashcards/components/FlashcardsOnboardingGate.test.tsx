import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";

// The gate consults the SRS store on mount to detect "returning users".
// Mock the engine so the test controls that signal without touching real
// localStorage shape.
const mockGetSRSStore = vi.fn();
vi.mock("@/features/flashcards/engine", () => ({
  getSRSStore: () => mockGetSRSStore(),
}));

import {
  FlashcardsOnboardingGate,
  FLASHCARDS_ONBOARDING_STORAGE_KEY,
  shouldSkipFlashcardsOnboarding,
} from "./FlashcardsOnboardingGate";
import { FlashcardsInfoModal } from "./FlashcardsInfoModal";

function renderGate(enabled = true) {
  return render(
    <I18nextProvider i18n={i18n}>
      <FlashcardsOnboardingGate enabled={enabled} />
    </I18nextProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  mockGetSRSStore.mockReset();
  mockGetSRSStore.mockReturnValue({});
});

afterEach(() => {
  cleanup();
});

describe("FlashcardsOnboardingGate", () => {
  it("auto-renders the onboarding modal on first visit (empty localStorage, no SRS state)", () => {
    renderGate();
    expect(
      screen.getByRole("dialog", { name: /welcome to flashcard review/i }),
    ).toBeTruthy();
    // Onboarding CTA copy, not reference CTA.
    expect(screen.getByRole("button", { name: /let's start/i })).toBeTruthy();
  });

  it("does not render when the seen-flag is set", () => {
    localStorage.setItem(FLASHCARDS_ONBOARDING_STORAGE_KEY, "1");
    renderGate();
    expect(
      screen.queryByRole("dialog", { name: /welcome to flashcard review/i }),
    ).toBeNull();
  });

  it("does not render for returning users (existing SRS state)", () => {
    mockGetSRSStore.mockReturnValue({
      "some-card-id": { recognition: {}, production: {} },
    });
    renderGate();
    expect(
      screen.queryByRole("dialog", { name: /welcome to flashcard review/i }),
    ).toBeNull();
  });

  it("does not render when disabled", () => {
    renderGate(false);
    expect(
      screen.queryByRole("dialog", { name: /welcome to flashcard review/i }),
    ).toBeNull();
  });

  it("dismissing the modal sets the seen-flag and unmounts", () => {
    renderGate();
    const cta = screen.getByRole("button", { name: /let's start/i });
    fireEvent.click(cta);
    expect(
      localStorage.getItem(FLASHCARDS_ONBOARDING_STORAGE_KEY),
    ).toBe("1");
    expect(
      screen.queryByRole("dialog", { name: /welcome to flashcard review/i }),
    ).toBeNull();
  });
});

describe("shouldSkipFlashcardsOnboarding", () => {
  it("returns false for first-time users with no SRS state and no flag", () => {
    expect(shouldSkipFlashcardsOnboarding()).toBe(false);
  });

  it("returns true once the flag is set", () => {
    localStorage.setItem(FLASHCARDS_ONBOARDING_STORAGE_KEY, "1");
    expect(shouldSkipFlashcardsOnboarding()).toBe(true);
  });

  it("returns true for returning users (any card state)", () => {
    mockGetSRSStore.mockReturnValue({ "card-1": {} });
    expect(shouldSkipFlashcardsOnboarding()).toBe(true);
  });
});

describe("FlashcardsInfoModal (reference mode)", () => {
  it("renders the same explanation body as onboarding, plus the reset link and Close CTA", () => {
    const onClose = vi.fn();
    const onReset = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FlashcardsInfoModal
          mode="reference"
          onClose={onClose}
          onResetOnboarding={onReset}
        />
      </I18nextProvider>,
    );
    // Reference title (not onboarding title).
    expect(
      screen.getByRole("dialog", { name: /how flashcard review works/i }),
    ).toBeTruthy();
    // All four rating labels appear (body is shared with onboarding).
    expect(screen.getByText("Again")).toBeTruthy();
    expect(screen.getByText("Hard")).toBeTruthy();
    expect(screen.getByText("Good")).toBeTruthy();
    expect(screen.getByText("Easy")).toBeTruthy();
    // Recognition/Production sections (multiple matches: heading + body
    // copy — getAllByText returns >0 if present).
    expect(screen.getAllByText(/recognition/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/production/i).length).toBeGreaterThan(0);
    // Reset link visible only in reference mode.
    const resetLink = screen.getByRole("button", {
      name: /show first-time intro again/i,
    });
    fireEvent.click(resetLink);
    expect(onReset).toHaveBeenCalledTimes(1);
    // Close CTA — there's also the header's X button (aria-label
    // "Close") so use getAllByRole and click the bottom-bar one.
    const closeButtons = screen.getAllByRole("button", { name: /^close$/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("onboarding mode hides the reset link and uses the onboarding CTA", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FlashcardsInfoModal mode="onboarding" onClose={vi.fn()} />
      </I18nextProvider>,
    );
    expect(
      screen.queryByRole("button", {
        name: /show first-time intro again/i,
      }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: /let's start/i })).toBeTruthy();
  });
});
