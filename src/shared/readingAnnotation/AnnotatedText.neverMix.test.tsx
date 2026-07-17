import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";

// Mutable so each test can flip settings that would otherwise show romaji
// (master toggle on, per-script threshold not yet reached) — the point of
// these tests is proving kanji wins over all of them.
const settingsRef: { learning: Record<string, unknown> } = {
  learning: {
    showRomaji: true,
    hiraganaRomajiAutoOff: false,
    katakanaRomajiAutoOff: false,
  },
};
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: settingsRef }),
}));
// Force the active language to JA (bare mode resolves via useLanguage).
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));
// Stand-in for the not-yet-shipped kanji-substitution layer: a fake JA
// annotator that echoes `text` back as a single word-grouped fragment with
// a fixed reading, so bare-mode tests can drive WordToken with kanji text
// deterministically without depending on the real (kana-only, Phase 2) JA
// annotator or the curriculum data it pulls in.
vi.mock("@/shared/language/registry", () => ({
  tryGetLanguageModule: (id: string) =>
    id === "ja"
      ? {
          readingAnnotation: {
            annotate: (text: string) => [
              { text, reading: "gakusei", symbols: Array.from(text) },
            ],
            fadeOnMastery: true,
          },
        }
      : null,
}));

import { AnnotatedText } from "./AnnotatedText";

beforeEach(() => {
  settingsRef.learning = {
    showRomaji: true,
    hiraganaRomajiAutoOff: false,
    katakanaRomajiAutoOff: false,
  };
});

describe("AnnotatedText — never-mix romaji/kanji gate (bare mode)", () => {
  it("renders no romaji for a kanji-bearing surface, even with showRomaji on, forceShowHelper on, and the script threshold not yet reached", () => {
    const { container } = render(<AnnotatedText text="学生" forceShowHelper />);
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("data-visible")).toBe("false");
    expect(rt!.getAttribute("aria-hidden")).toBe("true");
    expect(rt!.textContent).not.toContain("gakusei");
  });

  it("leaves a kana-only surface unaffected (same fixture, no kanji)", () => {
    const { container } = render(<AnnotatedText text="がくせい" forceShowHelper />);
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("data-visible")).toBe("true");
    expect(rt!.textContent).toBe("gakusei");
  });

  it("treats 々 (the kanji iteration mark) as kanji and suppresses romaji", () => {
    const { container } = render(<AnnotatedText text="時々" forceShowHelper />);
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("data-visible")).toBe("false");
  });
});

describe("AnnotatedText — never-mix romaji/kanji gate (segments mode, Kanji branch)", () => {
  it("suppresses ROMAJI on a kanji segment but floats the kana reading as furigana", () => {
    // Never-mix kills romaji over kanji; furigana (the kana reading) is how
    // Japanese annotates kanji and MUST show while the substitution layer's
    // window is open (reading !== surface). The authored romaji override is
    // ignored outright on kanji surfaces.
    const { container } = render(
      <AnnotatedText
        segments={[{ surface: "忙しい", reading: "いそがしい", romaji: "isogashii" }]}
        forceShowHelper
      />,
    );
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("aria-hidden")).toBe("false");
    expect(rt!.textContent).not.toContain("isogashii");
    // Okurigana-aligned (2026-07-17): the rt covers only the kanji run —
    // いそが floats over 忙; the しい tail renders as plain base text.
    expect(rt!.textContent).toBe("いそが");
    const ruby = rt!.parentElement as HTMLElement;
    const base = Array.from(ruby.childNodes)
      .filter((n) => n.nodeName.toLowerCase() !== "rt")
      .map((n) => n.textContent)
      .join("");
    expect(base).toBe("忙しい");
  });

  it("renders no reading line once the furigana window closes (reading === surface)", () => {
    // The kanji layer signals "furigana off" by setting reading = surface.
    const { container } = render(
      <AnnotatedText
        segments={[{ surface: "忙しい", reading: "忙しい", romaji: "isogashii" }]}
        forceShowHelper
      />,
    );
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("aria-hidden")).toBe("true");
    expect(rt!.textContent).not.toContain("isogashii");
    expect(rt!.textContent).not.toContain("忙しい");
  });

  it("renders a PURE-kanji surface as ruby with its kana reading (not plain text)", () => {
    // 一 (m8 numbers) has no kana at all — it must not fall into the
    // plain-text short-circuit; furigana floats while the window is open.
    const { container } = render(
      <AnnotatedText segments={[{ surface: "一", reading: "いち" }]} forceShowHelper />,
    );
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("aria-hidden")).toBe("false");
    expect(rt!.textContent).toBe("いち");
    expect(container.textContent).toContain("一");
  });

  it("a kanji word inside a multi-segment SENTENCE annotation shows NO romaji (never-mix), even beside kana neighbours", () => {
    // Post-kanji-pass shape of a sentence like まいにち ともだちを てつだう at a
    // high module: only the eligible word is kanji-fied (毎日, bare — past its
    // furigana window), the rest stays kana. The kanji segment must never carry
    // romaji, no matter that forceShowHelper is on and romaji shows over the
    // kana run.
    const { container } = render(
      <AnnotatedText
        segments={[
          { surface: "毎日", reading: "毎日", atomId: "mainichi" },
          { surface: " ともだちを てつだう", reading: " ともだちを てつだう" },
        ]}
        forceShowHelper
      />,
    );
    const kanjiRuby = Array.from(container.querySelectorAll("ruby")).find(
      (r) => r.childNodes[0]?.textContent === "毎日",
    );
    expect(kanjiRuby).toBeTruthy();
    const rt = kanjiRuby!.querySelector("rt")!;
    expect(rt.getAttribute("aria-hidden")).toBe("true"); // reading === surface → nothing floats
    expect(rt.textContent ?? "").not.toMatch(/[a-z]/i); // never romaji over kanji
    expect(container.textContent).toContain("毎日");
  });

  it("a kanji word still IN its furigana window floats the kana reading (not romaji) inside a sentence", () => {
    const { container } = render(
      <AnnotatedText
        segments={[
          { surface: "毎日", reading: "まいにち", atomId: "mainichi" },
          { surface: " べんきょうする", reading: " べんきょうする" },
        ]}
        forceShowHelper
      />,
    );
    const kanjiRuby = Array.from(container.querySelectorAll("ruby")).find(
      (r) => r.childNodes[0]?.textContent === "毎日",
    );
    const rt = kanjiRuby!.querySelector("rt")!;
    expect(rt.getAttribute("aria-hidden")).toBe("false");
    expect(rt.textContent).toBe("まいにち"); // furigana kana, never romaji
    expect(rt.textContent).not.toMatch(/[a-z]/i);
  });

  it("leaves a non-kanji segment on this same (non-pure-kana) branch unaffected", () => {
    // "Hi ここ" has kana (so it isn't plain text) but isn't pure kana
    // either (Latin letters + a space) — it reaches the same Kanji-branch
    // code as the kanji case above, but contains no kanji, so the reading
    // line must still show.
    const { container } = render(
      <AnnotatedText
        segments={[{ surface: "Hi ここ", reading: "hi koko" }]}
        forceShowHelper
      />,
    );
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt!.getAttribute("aria-hidden")).toBe("false");
    expect(rt!.textContent).toBe("hi koko");
  });
});
