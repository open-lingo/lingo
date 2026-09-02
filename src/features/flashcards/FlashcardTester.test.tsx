/**
 * First render test for the review session. The component was 959 lines with
 * none (spec § "Current state", 2026-09-02).
 *
 * CHARACTERIZATION suite: it pins the behaviour Wave B must not change —
 * render a prompt, reveal it, grade it, undo the grade, and the empty-session
 * summary — so the component split in this task and the shell swap in Task 7
 * are provably behaviour-preserving.
 *
 * Everything that needs a network call or a React context provider is mocked at
 * the import boundary (the `CardManagerPage.test.tsx` pattern). The SRS ENGINE
 * IS NOT MOCKED: grading really runs FSRS and really writes localStorage,
 * because "undo restores the pre-grade state" is only worth asserting against
 * the real scheduler.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import type { Flashcard } from "@/features/flashcards/data/types";
import type { ReviewQueue } from "./engine";

const CARD_ONE: Flashcard = {
  id: "ja:yama",
  type: "word",
  front: "やま",
  back: "mountain",
  note: "Also the second half of many surnames.",
};
const CARD_TWO: Flashcard = {
  id: "ja:kawa",
  type: "word",
  front: "かわ",
  back: "river",
};

function makeQueue(cards: Flashcard[]): ReviewQueue {
  return {
    review: [],
    newCards: cards,
    queue: cards,
    dueCount: 0,
    newCount: cards.length,
    notYetDueCount: 0,
    totalCount: cards.length,
    unseenTotal: cards.length,
    newCardsAllowed: 20,
    cardIdToDefaultEase: {},
  };
}

const mockQueue = vi.hoisted(() => ({ value: null as ReviewQueue | null }));
const mockViewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock("@/shared/hooks/useViewport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/hooks/useViewport")>()),
  useViewport: () => ({
    isMobile: mockViewport.isMobile,
    isTablet: false,
    isDesktop: !mockViewport.isMobile,
  }),
}));
vi.mock("./useSubscriptionQueue", () => ({
  useSubscriptionQueue: () => ({
    queue: mockQueue.value,
    decks: [],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("./useReviewQueueFilter", () => ({
  useReviewQueueFilter: () => ({ kind: "all" }),
}));
vi.mock("./useSRSyncSession", () => ({
  useSRSyncSession: () => ({ dirtyCount: 0 }),
}));
vi.mock("./useFlashcardDueSummary", () => ({
  useFlashcardDueSummary: () => ({ dueCount: 0 }),
}));
vi.mock("./useImagePreload", () => ({ useImagePreload: () => {} }));
vi.mock("@/features/quests/useQuests", () => ({
  useQuests: () => ({ quests: [], complete: vi.fn(), addProgress: vi.fn() }),
}));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  // `audio.silentMode` is read by `useAutoPlayJaAudio`; keep it truthy so the
  // real hook stays silent even if the tts mock below ever stops applying.
  useSettings: () => ({
    settings: { flashcards: {}, audio: { silentMode: true } },
    updateFlashcards: vi.fn(),
  }),
}));
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));
vi.mock("@/features/flashcards/data/loadDeck", () => ({
  getParticlesForLanguage: () => null,
}));
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  useAutoPlayJaAudio: () => {},
}));
vi.mock("@/shared/tts/prefetch", () => ({ usePrefetchAudio: () => {} }));

import { FlashcardTester } from "./FlashcardTester";
import { clearSRSStore, getEffectiveState } from "./engine";
import { FLASHCARDS_ONBOARDING_STORAGE_KEY } from "./components/FlashcardsOnboardingGate";

function renderTester() {
  return render(
    <MemoryRouter initialEntries={["/ja/practice/flashcards/review"]}>
      <I18nextProvider i18n={i18n}>
        <FlashcardTester />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe("FlashcardTester", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSRSStore();
    // The onboarding gate auto-opens a modal over a virgin store and would
    // cover every assertion here. "1" is the exact sentinel
    // `shouldSkipFlashcardsOnboarding()` looks for.
    localStorage.setItem(FLASHCARDS_ONBOARDING_STORAGE_KEY, "1");
    mockViewport.isMobile = false;
    mockQueue.value = makeQueue([CARD_ONE, CARD_TWO]);
  });

  it("shows the first card's prompt face, unrevealed", () => {
    renderTester();
    expect(screen.getByText("やま")).toBeInTheDocument();
    expect(screen.queryByText("mountain")).not.toBeInTheDocument();
    expect(screen.getByText(/tap to reveal/i)).toBeInTheDocument();
  });

  it("reveals the answer and offers exactly two grade buttons by default", () => {
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    expect(screen.getByText("mountain")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /didn't know/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /knew it/i })).toBeInTheDocument();
    // Decision 1 (Spencer, 2026-09-02): four is opt-in, never a default.
    expect(screen.queryByRole("button", { name: /^hard$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^easy$/i })).not.toBeInTheDocument();
  });

  it("grades the tested modality and advances to the next card", () => {
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /knew it/i }));
    expect(screen.getByText("かわ")).toBeInTheDocument();
    expect(getEffectiveState("ja:yama").recognition.reps).toBe(1);
    // Production is untouched — one modality per answer.
    expect(getEffectiveState("ja:yama").production.reps).toBe(0);
  });

  it("undo restores the pre-grade state and re-shows the card revealed", () => {
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /knew it/i }));
    fireEvent.click(screen.getByRole("button", { name: /undo last grade/i }));
    // Back on the graded slot, already flipped: recognition shows the MEANING.
    expect(screen.getByText("mountain")).toBeInTheDocument();
    expect(getEffectiveState("ja:yama").recognition.reps).toBe(0);
    // Depth is exactly one — the affordance is gone after using it.
    expect(
      screen.queryByRole("button", { name: /undo last grade/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the summary, not a card, when the session has no slots", () => {
    mockQueue.value = makeQueue([]);
    renderTester();
    expect(screen.getByText(/review complete/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to flashcards/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument();
  });

  it("mobile moves card details into a sheet opened from the toolbar", async () => {
    mockViewport.isMobile = true;
    renderTester();
    // Not in flow before reveal, and the affordance is inert.
    expect(screen.queryByText(/second half of many surnames/i)).not.toBeInTheDocument();
    const details = screen.getByRole("button", { name: /card details/i });
    expect(details).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    expect(details).toBeEnabled();
    // Still not in flow — the phone screen shows card + grades and nothing else.
    expect(screen.queryByText(/second half of many surnames/i)).not.toBeInTheDocument();

    fireEvent.click(details);
    const sheet = await screen.findByRole("dialog");
    expect(sheet.className).toContain("bottom-0");
    expect(
      within(sheet).getByText(/second half of many surnames/i),
    ).toBeInTheDocument();
    // Session stats and the review settings ride in the same sheet on mobile.
    expect(within(sheet).getByText(/grading buttons/i)).toBeInTheDocument();
  });

  it("grading the current card closes an open details sheet", () => {
    mockViewport.isMobile = true;
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /card details/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Grading advances to the NEXT, unrevealed card — a still-open sheet
    // would show its details despite the disabled-until-revealed invariant.
    fireEvent.click(screen.getByRole("button", { name: /knew it/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores keyboard grade keys while the details sheet is open", () => {
    mockViewport.isMobile = true;
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /card details/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // "1" grades "again" in simple mode — must be swallowed while the
    // focus-trapped sheet owns the keyboard, not routed to the card behind it.
    fireEvent.keyDown(document, { key: "1" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(getEffectiveState("ja:yama").recognition.reps).toBe(0);
    // Still on the first (revealed) card — a grade would have advanced to
    // "かわ", unrevealed.
    expect(screen.getByText("mountain")).toBeInTheDocument();
    expect(screen.queryByText("かわ")).not.toBeInTheDocument();
  });

  it("desktop keeps the detail panel in flow and the settings popover", () => {
    mockViewport.isMobile = false;
    renderTester();
    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    expect(screen.getAllByText(/second half of many surnames/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /review settings/i }));
    // The popover is a `role="dialog"` anchored in the toolbar, not a sheet.
    const popover = screen.getByRole("dialog", { name: /review settings/i });
    expect(popover.className).toContain("absolute");
  });

  it("mounts the fitted stage on mobile and the flow column on desktop", () => {
    mockViewport.isMobile = true;
    const { container, unmount } = renderTester();
    const stage = container.querySelector("[data-lesson-stage]");
    expect(stage, "mobile must expose the stage-fit gate hook").not.toBeNull();
    // The card fills the stage rather than reserving a fixed 360px block.
    const card = screen.getByText("やま").closest("button")!;
    expect(card.className).toContain("flex-1");
    expect(card.className).not.toContain("min-h-[360px]");
    unmount();

    mockViewport.isMobile = false;
    const desktop = renderTester();
    expect(desktop.container.querySelector("[data-lesson-stage]")).toBeNull();
    expect(
      screen.getByText("やま").closest("button")!.className,
    ).toContain("min-h-[360px]");
  });
});
