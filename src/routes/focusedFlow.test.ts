/**
 * Which routes drop the app chrome, and at which widths.
 *
 * Decision 2 (Spencer, 2026-09-02): the flashcard review session hides the
 * header, breadcrumbs and bottom tab bar like a lesson does — but ONLY below
 * `md`. Desktop keeps its chrome, because on desktop the chrome costs nothing
 * and the sidebar is how you leave. That makes this the app's first
 * VIEWPORT-DEPENDENT focused flow, which is exactly why it is a tested pure
 * function and not a regex inlined into two components.
 */
import { describe, it, expect } from "vitest";
import { isFocusedFlow } from "./focusedFlow";

describe("isFocusedFlow", () => {
  it("treats lessons, test-out, placement and grammar review as focused at every width", () => {
    for (const isMobile of [true, false]) {
      expect(isFocusedFlow("/ja/learn/lessons/ja-m4-neo-1", isMobile)).toBe(true);
      expect(isFocusedFlow("/ja/learn/test-out/m11", isMobile)).toBe(true);
      expect(isFocusedFlow("/ja/learn/placement-test", isMobile)).toBe(true);
      expect(isFocusedFlow("/ja/practice/grammar/review", isMobile)).toBe(true);
    }
  });

  it("focuses the flashcard review session on mobile only", () => {
    expect(isFocusedFlow("/ja/practice/flashcards/review", true)).toBe(true);
    expect(isFocusedFlow("/ja/practice/flashcards/review", false)).toBe(false);
    // Trailing slash is the same route.
    expect(isFocusedFlow("/ko/practice/flashcards/review/", true)).toBe(true);
  });

  it("does not focus the reviewer's neighbours", () => {
    for (const isMobile of [true, false]) {
      expect(isFocusedFlow("/ja/practice/flashcards", isMobile)).toBe(false);
      expect(isFocusedFlow("/ja/practice/flashcards/cards", isMobile)).toBe(false);
      expect(isFocusedFlow("/ja/practice/flashcards/decks", isMobile)).toBe(false);
      expect(isFocusedFlow("/home", isMobile)).toBe(false);
    }
  });
});
