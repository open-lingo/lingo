/**
 * ConversationListener smoke — an authored dialogue plays (audio mocked),
 * renders its transcript with inline lookup + translations, and quizzes the
 * learner with comprehension questions built from the dialogue.
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

const playConversationLine = vi.fn();
vi.mock("./conversationAudio", () => ({
  playConversationLine: (...a: unknown[]) => playConversationLine(...a),
  conversationLineHasAudio: () => true,
}));

vi.mock("@/features/dictionary/TappableText", () => ({
  TappableText: ({ text }: { text: string }) => <span>{text}</span>,
}));

import { ConversationListener } from "./ConversationListener";

const CONV: Conversation = {
  id: "ja-test-cafe",
  languageId: "ja",
  module: 5,
  title: "At the cafe",
  situation: "Ordering a drink.",
  speakers: [
    { id: "A", label: "Staff" },
    { id: "B", label: "You" },
  ],
  learnerRole: "B",
  lines: [
    { speaker: "A", text: "いらっしゃいませ。", translation: "Welcome." },
    { speaker: "B", text: "コーヒーをください。", translation: "Coffee, please." },
    { speaker: "A", text: "はい、どうぞ。", translation: "Here you go." },
    { speaker: "B", text: "ありがとう。", translation: "Thanks." },
  ],
};

beforeEach(() => {
  cleanup();
  playConversationLine.mockClear();
});

describe("ConversationListener", () => {
  it("renders the transcript with translations and auto-plays the dialogue", () => {
    render(
      <ConversationListener
        conv={CONV}
        lang="ja"
        defaultTtsLang="ja"
        onExit={() => {}}
      />,
    );
    expect(screen.getByText("At the cafe")).toBeInTheDocument();
    // Transcript translations + target text render. (English glosses also
    // appear as question options, so assert presence via getAllByText.)
    expect(screen.getAllByText("Coffee, please.").length).toBeGreaterThan(0);
    expect(screen.getByText("コーヒーをください。")).toBeInTheDocument();
    // Replay drives the multi-voice sequencer (mount auto-play is timer-gated).
    fireEvent.click(screen.getByRole("button", { name: "Replay conversation" }));
    expect(playConversationLine).toHaveBeenCalled();
  });

  it("asks a comprehension question and completes on answering", () => {
    render(
      <ConversationListener
        conv={CONV}
        lang="ja"
        defaultTtsLang="ja"
        onExit={() => {}}
      />,
    );
    // A "what did X say?" question renders.
    expect(screen.getByText(/What did .* say\?/)).toBeInTheDocument();

    // Walk every question by clicking its correct option, then finishing.
    for (let guard = 0; guard < 12; guard++) {
      const finish = screen.queryByRole("button", { name: "Finish" });
      const next = screen.queryByRole("button", { name: "Next" });
      if (!finish && !next) {
        // Not answered yet — pick a correct option. The correct gloss is one of
        // the four; click each until one commits (commit disables the buttons).
        const options = ["Welcome.", "Coffee, please.", "Here you go.", "Thanks."];
        for (const label of options) {
          const btn = screen.queryByRole("button", { name: label });
          if (btn) {
            fireEvent.click(btn);
            break;
          }
        }
        continue;
      }
      fireEvent.click((finish ?? next) as HTMLElement);
      if (finish) break;
    }

    expect(screen.getByText(/You followed \d+ of \d+/)).toBeInTheDocument();
  });
});
