/**
 * AgreementClozeStepView contract: every blank must be filled before
 * Check enables; ONE Check grades all blanks as a set and fires
 * onComplete exactly once; a miss shows the corrected sentence in the
 * Feedback banner. i18n + TTS are mocked (same reason TestRunner.test
 * stubs the real step views — neither spins up in happy-dom).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { AgreementClozeStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      def?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const template = typeof def === "string" ? def : key;
      const vars = (typeof def === "object" ? def : opts) ?? {};
      return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
        String(vars[k] ?? ""),
      );
    },
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => null),
}));

import { AgreementClozeStepView } from "./AgreementClozeStepView";

afterEach(() => {
  cleanup();
});

function makeStep(): AgreementClozeStep {
  return {
    id: "ac-test",
    type: "agreement_cloze",
    segments: [
      {
        blank: {
          id: "b1",
          correctAnswer: "Las",
          options: ["El", "La", "Los", "Las"],
        },
      },
      { text: " cas" },
      {
        blank: {
          id: "b2",
          correctAnswer: "as",
          options: ["o", "a", "os", "as"],
        },
      },
      { text: " blanc" },
      {
        blank: {
          id: "b3",
          correctAnswer: "as",
          options: ["o", "a", "os", "as"],
        },
      },
    ],
    meaningEn: "The white houses",
  };
}

function pick(groupLabel: string, option: string) {
  const group = screen.getByRole("group", { name: groupLabel });
  fireEvent.click(within(group).getByRole("button", { name: option }));
}

describe("AgreementClozeStepView", () => {
  it("keeps Check disabled until every blank has a selection", () => {
    render(
      <AgreementClozeStepView
        step={makeStep()}
        onComplete={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    const check = screen.getByRole("button", { name: "Check" });
    expect(check).toBeDisabled();
    pick("Blank 1", "Las");
    pick("Blank 2", "as");
    expect(check).toBeDisabled();
    pick("Blank 3", "as");
    expect(check).toBeEnabled();
  });

  it("grades all blanks as a set: one wrong blank fails the step and shows the corrected sentence", () => {
    const onComplete = vi.fn();
    render(
      <AgreementClozeStepView
        step={makeStep()}
        onComplete={onComplete}
        onContinue={vi.fn()}
      />,
    );
    pick("Blank 1", "Las");
    pick("Blank 2", "o");
    pick("Blank 3", "as");
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("ac-test", false);
    expect(screen.getByRole("alert")).toHaveTextContent("Las casas blancas");
  });

  it("completes correct exactly once and hands off to Continue", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    render(
      <AgreementClozeStepView
        step={makeStep()}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );
    pick("Blank 1", "Las");
    pick("Blank 2", "as");
    pick("Blank 3", "as");
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("ac-test", true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
