/**
 * #158 (TestFlight b20, 2026-09-15): `min-h-[60vh] … justify-center`
 * centred the completion card in 60% of the raw window, leaving the
 * bottom ~35% empty ("Positioned too high vertically") — the last raw
 * `vh` left in the lesson tree, and it skipped the safe-area padding
 * every other lesson surface applies.
 *
 * This screen replaces `LessonShell` entirely (LessonPage's early return
 * for the "complete" state renders `LessonComplete` instead of the
 * shell), so it has to size itself the way `LessonShell` sizes every
 * step view: `FITTED_SHELL_HEIGHT` (`100dvh` minus the focused-flow
 * `<main>` padding and the cookie-consent banner — the one constant
 * `LessonShell` and the mobile flashcard `ReviewShell` both consume, see
 * `@/shared/layout/fittedShell`) plus the same `*-safe` insets. Pin both:
 * the real stage height, and no `vh` regression.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LessonComplete } from "./LessonComplete";
import type { LessonContent } from "../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | ({ defaultValue?: string } & Record<string, unknown>)) => {
      if (typeof opts === "string") return opts;
      return opts?.defaultValue ?? key;
    },
  }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => ({
    stats: { streak: 0, xp: 0, level: 1, lingots: 0, bestStreak: 0, lastActiveDate: null },
    isReady: true,
  }),
}));

vi.mock("@/shared/audio/sfx", () => ({
  playSfx: vi.fn(),
}));

vi.mock("./Confetti", () => ({
  Confetti: () => null,
}));

afterEach(() => {
  cleanup();
});

const lesson = { id: "ja-m1-1", title: "Test lesson" } as LessonContent;

function renderComplete() {
  render(
    <MemoryRouter>
      <LessonComplete
        lesson={lesson}
        correctCount={4}
        totalGraded={5}
        onContinue={() => {}}
      />
    </MemoryRouter>,
  );
}

/** The outermost box: the lesson title `<p>`'s direct parent, per the JSX
 *  (title sits flat inside the top-level wrapper, no intermediate div). */
function outerBox(): HTMLElement {
  return screen.getByText("Test lesson").parentElement!;
}

describe("LessonComplete sizing (#158)", () => {
  it("sizes the card to the real stage height, not a raw vh unit", () => {
    renderComplete();
    const box = outerBox();
    expect(box.className).not.toContain("vh]");
    // FITTED_SHELL_HEIGHT's calc — the same constant LessonShell uses for
    // every step view, so this card can never drift from the stage other
    // steps render in.
    expect(box.className).toContain("h-[calc(100dvh");
  });

  it("still centres the card vertically within the full stage", () => {
    renderComplete();
    expect(outerBox().className).toContain("justify-center");
  });

  it("insets the card by the safe area on all four sides, like LessonShell", () => {
    renderComplete();
    const box = outerBox();
    for (const cls of ["pt-safe", "pb-safe", "pl-safe", "pr-safe"]) {
      expect(box.className).toContain(cls);
    }
  });
});
