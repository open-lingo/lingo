import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// Mutable so each test can flip the reading-aid setting.
const settingsRef: { learning: Record<string, unknown> } = {
  learning: { showRomanization: true },
};
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: settingsRef }),
}));
// Force the active language to Korean (bare mode resolves via useLanguage).
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ko" } }),
}));

import { AnnotatedText } from "./AnnotatedText";

beforeEach(() => {
  settingsRef.learning = { showRomanization: true };
  localStorage.clear();
});

describe("AnnotatedText — Korean Revised Romanization reading aid", () => {
  it("renders pronunciation-based RR above each Hangul word", () => {
    const { container } = render(<AnnotatedText text="한국어" />);
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("data-visible")).toBe("true");
    // Liaison: 한국어 → hangugeo (the ㄱ of 국 links onto 어).
    expect(rt!.textContent).toBe("hangugeo");
  });

  it("keeps spacing and romanizes each word independently", () => {
    const { container } = render(<AnnotatedText text="한국 사람" />);
    const readings = [...container.querySelectorAll("rt")].map(
      (r) => r.textContent,
    );
    expect(readings).toEqual(["hanguk", "saram"]);
  });

  it("hides the reading when showRomanization is off", () => {
    settingsRef.learning = { showRomanization: false };
    const { container } = render(<AnnotatedText text="학교" />);
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("data-visible")).toBe("false");
  });
});
