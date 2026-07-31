/**
 * sentence_transform (parametrized build_sentence) — render + factory.
 *
 * n4-scoping §3 verdict: transform is a build_sentence with sourceSentence
 * + transformLabel, NOT a new type. These tests pin: source card renders
 * with its chip, grading is untouched by the params, and the plain
 * (non-transform) build renders no source card.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => "tts-url"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: false } },
    updateSetting: vi.fn(),
  }),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import { transformBuild, build } from "@/features/languages/ja/grammarHelpers";

const noop = () => {};

describe("sentence_transform build", () => {
  const step = transformBuild(
    "test-transform-1",
    "Rewrite for a friend:",
    "コーヒーを のみますか。",
    "→ casual",
    "コーヒー のむ？",
    ["コーヒー", "のむ", "のみます", "？"],
    ["コーヒー", "のむ", "？"],
  );

  it("renders the source sentence card with the transform chip", () => {
    const { container, getByText } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    const source = container.querySelector('[data-testid="transform-source"]');
    expect(source).not.toBeNull();
    // Hidden rt placeholders inject zero-width spaces between glyphs.
    expect(source!.textContent!.replace(/​/g, "")).toContain("のみますか");
    expect(getByText("→ casual")).toBeTruthy();
    expect(getByText("Rewrite for a friend:")).toBeTruthy();
  });

  it("factory: transform params do not alter grading fields", () => {
    const plain = build(
      "test-transform-1",
      "Rewrite for a friend:",
      "コーヒー のむ？",
      ["コーヒー", "のむ", "のみます", "？"],
      ["コーヒー", "のむ", "？"],
    );
    expect(step.correctOrder).toEqual(plain.correctOrder);
    expect(step.tiles).toEqual(plain.tiles);
    expect(step.targetSentence).toBe(plain.targetSentence);
    expect(step.type).toBe("build_sentence");
    expect(step.sourceAnnotation!.map((s) => s.surface).join("")).toBe(
      "コーヒーを のみますか。",
    );
  });

  it("plain builds render no source card", () => {
    const plain = build(
      "test-plain-1",
      "Say: I drink coffee.",
      "コーヒーを のみます",
      ["コーヒー", "を", "のみます"],
      ["コーヒー", "を", "のみます"],
    );
    const { container } = render(
      <BuildSentenceStepView step={plain} onComplete={noop} onContinue={noop} />,
    );
    expect(
      container.querySelector('[data-testid="transform-source"]'),
    ).toBeNull();
  });
});
