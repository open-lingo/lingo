import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KanjiRuby } from "./KanjiRuby";
import { alignFurigana } from "@/shared/japanese/okurigana";
import { KANJI_ELIGIBLE_ATOMS } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { JA_COURSE_ATOMS_BY_ID } from "@/features/languages/ja/courseAtoms";

/**
 * TestFlight #186 (b28, 2026-09-17): the kana→kanji switchover reveal
 * (KanjiRevealStepView → RevealChoreo → AnnotatedText → KanjiRuby) showed only
 * い over 家 — the reading truncated to its first kana. Spencer: "this has
 * never been fixed" — earlier fixes (#12, #59, #159/#162) targeted a WebKit
 * paint-timing bug in the wipe ANIMATION and left a residual repaint gap
 * (closed in `KanjiRevealAnimation.tsx`'s `nudge` effect); none of them
 * checked whether the underlying DATA — `alignFurigana`'s prefix/body/rt/
 * suffix split — ever drops kana for the switchover catalog itself.
 *
 * This enumerates EVERY word `KANJI_ELIGIBLE_ATOMS` can hand the switchover
 * beat (`buildSwitchoverBeat` → `pickSwitchoverCandidates`, which reads
 * straight from this map) and proves two things per word, covering both
 * shapes the beat can produce:
 *
 *   - whole-word rubies (家/いえ, 十/じゅう — kanji count < kana count, no
 *     shared affix — exactly #186's shape and its class)
 *   - okurigana-affixed rubies (帰る/かえる, 見る/みる — a shared kana tail)
 *
 * `prefix + rt + suffix` must reconstruct the FULL reading, and the actual
 * rendered `.kana-helper-ink` text must equal `rt` — not a truncated prefix
 * of it. A future regression in `alignFurigana`, `KanjiRuby`, or a new
 * switchover word added to the catalog with a shape this suite doesn't
 * already cover will fail here before it ever reaches a screenshot.
 */
describe("switchover catalog — every kanji_reveal word renders its full reading", () => {
  const words = [...KANJI_ELIGIBLE_ATOMS.entries()].map(([atomId, entry]) => {
    const atom = JA_COURSE_ATOMS_BY_ID.get(atomId);
    if (!atom) throw new Error(`switchover atom ${atomId} missing from the course registry`);
    return { atomId, kanji: entry.kanji, kana: atom.kana };
  });

  it("found at least one switchover word (a suite that enumerates nothing proves nothing)", () => {
    expect(words.length).toBeGreaterThan(0);
  });

  it("found the reported shape (kanji glyph count < kana count, no shared affix)", () => {
    const singleKanjiLongerReading = words.filter(
      (w) => [...w.kanji].length < [...w.kana].length,
    );
    expect(singleKanjiLongerReading.length).toBeGreaterThan(0);
  });

  // TESTAUDIT lane, 2026-09-18 (decision 2): one `it` per check instead of
  // one `it` PER WORD (2 x ~156 words) — every word is still checked by
  // both, every failing word (not just the first) is listed.
  it("alignFurigana reconstructs the full reading, for every switchover word", () => {
    const violations: string[] = [];
    for (const { atomId, kanji, kana } of words) {
      const label = `${atomId} (${kanji}/${kana})`;
      const parts = alignFurigana(kanji, kana);
      if (parts.prefix + parts.rt + parts.suffix !== kana) {
        violations.push(`${label}: prefix+rt+suffix ("${parts.prefix + parts.rt + parts.suffix}") !== kana ("${kana}")`);
      }
      if (parts.prefix + parts.body + parts.suffix !== kanji) {
        violations.push(`${label}: prefix+body+suffix ("${parts.prefix + parts.body + parts.suffix}") !== kanji ("${kanji}")`);
      }
      // The annotated (rt-bearing) run is never empty for a real switchover
      // word — an empty rt would mean alignFurigana fell back to treating
      // the pair as already-equal, which switchover pairs never are.
      if (parts.rt.length === 0) violations.push(`${label}: rt is empty`);
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("KanjiRuby renders the full reading, not a prefix of it, for every switchover word", () => {
    const violations: string[] = [];
    for (const { atomId, kanji, kana } of words) {
      const label = `${atomId} (${kanji}/${kana})`;
      const { container } = render(<KanjiRuby surface={kanji} reading={kana} show />);
      const ink = container.querySelector(".kana-helper-ink");
      if (!ink) {
        violations.push(`${label}: no .kana-helper-ink element rendered`);
        continue;
      }
      const parts = alignFurigana(kanji, kana);
      if (ink.textContent !== parts.rt) {
        violations.push(`${label}: rendered ink "${ink.textContent}" !== expected rt "${parts.rt}"`);
      }
      // Base text is always the full kanji surface, whichever alignment
      // fired — read only the ruby's non-<rt> child nodes (the base glyphs),
      // since the whole element's textContent also folds in the reading.
      const ruby = container.querySelector("ruby")!;
      const base = [...ruby.childNodes]
        .filter((n) => (n as Element).tagName !== "RT")
        .map((n) => n.textContent)
        .join("");
      if (base !== kanji) violations.push(`${label}: rendered base "${base}" !== kanji "${kanji}"`);
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
