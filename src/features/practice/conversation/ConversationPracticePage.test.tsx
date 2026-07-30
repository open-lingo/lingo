/**
 * ConversationPracticePage smoke — the landing lists module-unlocked
 * conversations with Listen + Roleplay entries, and shows an empty state when
 * the language/module has no curated dialogue.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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

vi.mock("@/shared/hooks/useLangPath", () => ({ useLang: () => "ja" }));
vi.mock("../useCourseLevel", () => ({ useCourseLevel: () => 5 }));
vi.mock("../data/practiceDataLoader", () => ({ getTtsLang: () => "ja" }));

const getConversations = vi.fn();
vi.mock("@/features/practice/content", () => ({
  getConversations: (...a: unknown[]) => getConversations(...a),
}));

// The players aren't exercised on the landing; stub them to keep the tree light.
vi.mock("./ConversationListener", () => ({ ConversationListener: () => null }));
vi.mock("./ConversationRoleplay", () => ({ ConversationRoleplay: () => null }));

import { ConversationPracticePage } from "./ConversationPracticePage";

const CONV: Conversation = {
  id: "ja-m5-cafe",
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
  ],
};

beforeEach(() => {
  cleanup();
});

describe("ConversationPracticePage", () => {
  it("lists unlocked conversations with Listen + Roleplay entries", () => {
    getConversations.mockReturnValue([CONV]);
    render(<ConversationPracticePage />);
    expect(screen.getByText("At the cafe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Listen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Roleplay/ })).toBeInTheDocument();
  });

  it("shows an empty state when there is no curated dialogue", () => {
    getConversations.mockReturnValue([]);
    render(<ConversationPracticePage />);
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
  });
});
