/**
 * ConversationRoleplay smoke — the app line renders + advances; the learner
 * line renders a production rung (tiles, the ramp's first rung) and a produced
 * line grades correct + credits production SRS.
 *
 * The atom catalog is mocked empty so `segmentLine` yields the whole learner
 * line as a single tile — deterministic and independent of real curriculum
 * data — while the tile assembly + grading run for real.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { Conversation } from "@/features/practice/content";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const s =
        opts && typeof opts.defaultValue === "string" ? opts.defaultValue : key;
      return s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts?.[k] ?? ""));
    },
  }),
}));

vi.mock("./conversationAudio", () => ({
  playConversationLine: vi.fn(),
  conversationLineHasAudio: () => true,
}));

const creditProductionForLine = vi.fn();
vi.mock("./conversationSrs", () => ({
  creditProductionForLine: (...a: unknown[]) => creditProductionForLine(...a),
  lineAtomIds: () => [],
}));

// Empty atom catalog → the tile segmenter treats each line as one chunk.
vi.mock("@/features/lesson/data/normalizedAtoms", () => ({
  getNormalizedCourseAtoms: () => [],
}));

vi.mock("@/features/dictionary/TappableText", () => ({
  TappableText: ({ text }: { text: string }) => <span>{text}</span>,
}));

import { ConversationRoleplay } from "./ConversationRoleplay";

const CONV: Conversation = {
  id: "ja-test-intro",
  languageId: "ja",
  module: 3,
  title: "Introductions",
  situation: "Meeting someone.",
  speakers: [
    { id: "A", label: "Ken" },
    { id: "B", label: "You" },
  ],
  learnerRole: "B",
  lines: [
    { speaker: "A", text: "はじめまして。", translation: "Nice to meet you." },
    { speaker: "B", text: "トムだ。", translation: "I'm Tom." },
  ],
};

beforeEach(() => {
  cleanup();
  creditProductionForLine.mockClear();
});

describe("ConversationRoleplay", () => {
  it("plays the app line, then grades the learner's produced line", () => {
    render(
      <ConversationRoleplay
        conv={CONV}
        lang="ja"
        defaultTtsLang="ja"
        onExit={() => {}}
      />,
    );

    // App line (Ken) shows first, with a Continue to advance to the learner turn.
    expect(screen.getByText("はじめまして。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    // Learner turn (tiles rung): produce "I'm Tom." The single tile is the line.
    expect(screen.getByText("I'm Tom.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "トムだ" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    // Correct → production SRS credited + a resolved panel with Continue.
    expect(creditProductionForLine).toHaveBeenCalledWith("トムだ。", "ja", false);
    expect(
      screen.getByRole("button", { name: /Continue/ }),
    ).toBeInTheDocument();
  });

  it("renders an empty/summary path after the last line", () => {
    render(
      <ConversationRoleplay
        conv={CONV}
        lang="ja"
        defaultTtsLang="ja"
        onExit={() => {}}
      />,
    );
    // Advance past the app line, produce the last line, then Continue → done.
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "トムだ" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    // The resolved panel's Continue advances; it is the last line → summary.
    const continues = screen.getAllByRole("button", { name: /Continue/ });
    fireEvent.click(continues[continues.length - 1]);
    expect(screen.getByText("Roleplay complete")).toBeInTheDocument();
  });
});
