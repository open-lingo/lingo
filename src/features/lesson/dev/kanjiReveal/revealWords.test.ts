import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { BEAT_WORDS, kanjiClozeStep, sentenceStep } from "./revealWords";
import { getKanjiWordPool, hasShareGlyphOption } from "@/features/languages/ja/secondScript/kanjiDistractorPool";
import { REVEAL_CANDIDATES } from "./revealAnimations";
import { N5_KANJI } from "@/features/languages/ja/secondScript/n5Kanji";
import { KANJI_RECOGNITION_MODULE } from "@/features/languages/ja/secondScript/kanjiRollout";
import { containsKanji } from "@/shared/japanese/kanaTable";

const HAN = /\p{Script=Han}/u;

/**
 * The two-step switchover beat (B061) has three properties that are easy to
 * state in prose and easy to lose in an edit, because breaking any of them still
 * renders a perfectly plausible-looking step:
 *
 *  1. Step 2's distractors must differ from the answer ONLY at the switched
 *     word. Vary the verb or the particle and the step is solvable by
 *     elimination without reading the kanji — the defect §6f of
 *     `docs/kanji-switchover-distributed-spec-2026-07-28.md` found.
 *  2. Furigana must be suppressed on the switched word when `furiganaOn` is
 *     false, or the reading is printed above the thing being tested.
 *  3. The correct option must not sit at a fixed index — `MultipleChoiceStepView`
 *     does not shuffle, so authored order IS render order.
 */

describe("kanji reveal — beat words", () => {
  it("every demo word's kanji is in the live catalog, at m8 or later", () => {
    const byChar = new Map(N5_KANJI.map((e) => [e.character, e]));
    for (const w of BEAT_WORDS) {
      for (const ch of [...w.kanji]) {
        const entry = byChar.get(ch);
        expect(entry, `${ch} (${w.kanji}) missing from N5_KANJI`).toBeDefined();
        expect(entry!.introducedAtModule).toBeGreaterThanOrEqual(
          KANJI_RECOGNITION_MODULE,
        );
      }
    }
  });

  it("every demo word is a real switchover — taught in kana, kanji later", () => {
    for (const w of BEAT_WORDS) {
      expect(w.kanjiModule, w.kanji).toBeGreaterThan(w.taughtModule);
    }
  });

  it("`parts` covers each glyph exactly once, and admits when it has no gloss", () => {
    for (const w of BEAT_WORDS) {
      expect(w.parts.map((p) => p.glyph)).toEqual([...w.kanji]);
    }
    // Not a style nit: a run where every part has a confident sense would mean
    // someone invented one for 達 or 猫, which is the folk-etymology risk the
    // gallery is meant to expose rather than paper over.
    const nulls = BEAT_WORDS.flatMap((w) => w.parts).filter(
      (p) => p.sense === null,
    );
    expect(nulls.length).toBeGreaterThan(0);
  });

  it("the switched word is the target index of its own sentence", () => {
    for (const w of BEAT_WORDS) {
      const seg = w.sentence.segments[w.targetIndex];
      expect(seg, w.kanji).toBeDefined();
      expect(seg.surface).toBe(w.kanji);
      expect(seg.reading).toBe(w.kana);
    }
  });
});

describe("kanji reveal — step 2 (the sentence question)", () => {
  it("suppresses furigana on the switched word when furiganaOn is false", () => {
    for (const w of BEAT_WORDS) {
      const step = sentenceStep(w, false);
      const seg = (step as { promptAnnotation: { surface: string; reading: string }[] })
        .promptAnnotation[w.targetIndex];
      // reading === surface leaves AnnotatedText nothing to float.
      expect(seg.reading, w.kanji).toBe(seg.surface);
      expect(containsKanji(seg.surface)).toBe(true);
    }
  });

  it("shows furigana on the switched word when furiganaOn is true", () => {
    for (const w of BEAT_WORDS) {
      const step = sentenceStep(w, true);
      const seg = (
        step as {
          promptAnnotation: {
            surface: string;
            reading: string;
            furiganaWindowOpen?: boolean;
          }[];
        }
      ).promptAnnotation[w.targetIndex];
      expect(seg.reading).toBe(w.kana);
      expect(seg.furiganaWindowOpen).toBe(true);
    }
  });

  it("leaves every non-target segment untouched in both modes", () => {
    for (const w of BEAT_WORDS) {
      for (const furi of [true, false]) {
        const step = sentenceStep(w, furi) as {
          promptAnnotation: { surface: string; reading: string }[];
        };
        w.sentence.segments.forEach((orig, i) => {
          if (i === w.targetIndex) return;
          expect(step.promptAnnotation[i]).toEqual(orig);
        });
      }
    }
  });

  it("distractors differ from the answer only at the switched word", () => {
    // The English options are built from one frame with a single slot varying,
    // so stripping the differing tail must leave a shared prefix. A distractor
    // that changes the verb or the particle produces a short prefix and fails.
    for (const w of BEAT_WORDS) {
      const answer = w.sentence.en;
      for (const d of w.distractors) {
        const shared = sharedPrefixWords(answer, d);
        expect(
          shared.length,
          `"${d}" vs "${answer}" — differs before the switched word`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("does not park the correct option at a fixed index", () => {
    // MultipleChoiceStepView renders authored order verbatim. If the shuffle is
    // ever dropped this goes red instead of the whole gallery quietly becoming
    // "always tap the first one".
    const positions = new Set<number>();
    for (const w of BEAT_WORDS) {
      for (const furi of [true, false]) {
        const step = sentenceStep(w, furi) as {
          options: { id: string; text: string }[];
          correctOptionId: string;
        };
        expect(step.options).toHaveLength(1 + w.distractors.length);
        const idx = step.options.findIndex((o) => o.id === step.correctOptionId);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(step.options[idx].text).toBe(w.sentence.en);
        positions.add(idx);
      }
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it("is stable across calls — the shuffle is seeded, not random", () => {
    const a = sentenceStep(BEAT_WORDS[0], false) as { options: { text: string }[] };
    const b = sentenceStep(BEAT_WORDS[0], false) as { options: { text: string }[] };
    expect(a.options.map((o) => o.text)).toEqual(b.options.map((o) => o.text));
  });
});

describe("kanji reveal — step 2 cloze mode (fill_blank)", () => {
  type Cloze = {
    sentence: string;
    hint?: string;
    blanks: { correctAnswer: string }[];
    wordBank: string[];
    wordBankHideHelper?: boolean;
  };

  it("puts the switched word's kanji as the ONLY correct tile", () => {
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      expect(step.blanks).toHaveLength(1);
      expect(step.blanks[0].correctAnswer).toBe(w.kanji);
      expect(step.wordBank).toContain(w.kanji);
      // The hard constraint: the word's own kanji must never also be a wrong
      // tile. Offering 友達 as incorrect in a step about 友達 would teach that a
      // known word's written form is wrong. This one SURVIVES Spencer's
      // relaxation of the taught-glyph rule — it guards a different failure.
      expect(step.wordBank.filter((t) => t === w.kanji)).toHaveLength(1);
    }
  });

  it("shape-matches every tile to the answer — same glyph count, pure kanji", () => {
    // Spencer 2026-07-29: distractors may use kanji the learner has never met,
    // so the only thing making them plausible is SHAPE. A 1-glyph tile in a bank
    // answered by a 2-glyph word is identifiable without reading anything.
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      const n = [...w.kanji].filter((c) => HAN.test(c)).length;
      for (const tile of step.wordBank) {
        const chars = [...tile];
        expect(chars.filter((c) => HAN.test(c)).length, tile).toBe(n);
        // Pure kanji: okurigana would be its own giveaway.
        expect(chars.every((c) => HAN.test(c)), tile).toBe(true);
      }
    }
  });

  it("draws distractors from REAL words, not invented glyph pairs", () => {
    const real = new Set(getKanjiWordPool().map((p) => p.surface));
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      for (const tile of step.wordBank) {
        if (tile === w.kanji) continue;
        expect(real.has(tile), `${tile} is not a course-registry word`).toBe(true);
      }
    }
  });

  it("never repeats the answer's reading in a distractor", () => {
    const byS = new Map(getKanjiWordPool().map((p) => [p.surface, p]));
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      for (const tile of step.wordBank) {
        if (tile === w.kanji) continue;
        expect(byS.get(tile)?.kana).not.toBe(w.kana);
      }
    }
  });

  it("hard mode shares a glyph WHERE THE POOL ALLOWS, and degrades safely", () => {
    // Availability is a property of the word: 日 is productive enough that 明日
    // has many shape-matched neighbours (今日, 毎日, 昨日), 友達 has none, and a
    // single-glyph answer like 猫 can never have one. `hasShareGlyphOption` is
    // what a caller should consult before offering the toggle — this asserts the
    // two agree, so the helper can never claim an option the builder won't honour.
    let anyHardModePossible = false;
    for (const w of BEAT_WORDS) {
      const answerGlyphs = new Set([...w.kanji].filter((c) => HAN.test(c)));
      const overlap = (bank: string[]) =>
        bank.filter(
          (t) => t !== w.kanji && [...t].some((c) => answerGlyphs.has(c)),
        ).length;

      expect(overlap((kanjiClozeStep(w) as unknown as Cloze).wordBank)).toBe(0);

      const available = hasShareGlyphOption(w.kanji, w.kana);
      const hard = kanjiClozeStep(w, { shareGlyph: true }) as unknown as Cloze;
      if (available) {
        anyHardModePossible = true;
        expect(overlap(hard.wordBank), w.kanji).toBeGreaterThan(0);
      }
      // Either way the bank is still four shape-matched real tiles.
      expect(hard.wordBank).toHaveLength(4);
    }
    expect(anyHardModePossible).toBe(true);
  });

  it("suppresses the bank's reading helper", () => {
    // Left on, the tiles float ともだち / かぞく / せんせい / がくせい above the
    // kanji and the learner never reads a kanji at all.
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      expect(step.wordBankHideHelper).toBe(true);
    }
  });

  it("carries the English cue, without which the step has no answer", () => {
    // "___ といきます" is satisfied by friend, family, teacher AND student. The
    // Japanese frame does not constrain the answer; the cue is what does.
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      expect(step.hint).toBe(w.sentence.en);
    }
  });

  it("blanks exactly the switched word and keeps the rest of the sentence", () => {
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      expect(step.sentence).toContain("{{blank}}");
      // Reconstructing with the answer must rebuild the original surface.
      const rebuilt = step.sentence.replace("{{blank}}", w.kanji);
      const original = w.sentence.segments.map((sg) => sg.surface).join("");
      expect(rebuilt).toBe(original);
      // ...and the blank must not leak the kanji into the visible frame.
      expect(step.sentence).not.toContain(w.kanji);
    }
  });

  it("offers four tiles and does not park the answer at a fixed index", () => {
    const positions = new Set<number>();
    for (const w of BEAT_WORDS) {
      const step = kanjiClozeStep(w) as unknown as Cloze;
      expect(step.wordBank).toHaveLength(4);
      positions.add(step.wordBank.indexOf(w.kanji));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it("is deterministic — the same word yields the same bank every call", () => {
    for (const w of BEAT_WORDS) {
      const a = kanjiClozeStep(w) as unknown as Cloze;
      const b = kanjiClozeStep(w) as unknown as Cloze;
      expect(a.wordBank).toEqual(b.wordBank);
    }
  });
});

describe("kanji reveal — wipe easing", () => {
  // Found by frame capture, not by reading: `EASE` is cubic-bezier(0.22,1,0.36,1),
  // a strong ease-out that is 67% complete at 20% of its duration. On a
  // clip-path wipe that makes the text blink out and leave the stage empty for
  // the rest of the phase. Wipes must be linear. This is invisible in review —
  // the code looks identical either way — so it is pinned here.
  // `new URL(..., import.meta.url)` is not a file: URL under vitest — same
  // fileURLToPath dance the other emit tests in this directory use.
  const SRC = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "revealAnimations.tsx"),
    "utf8",
  );

  it("never drives a wipe or erase with the ease-out curve", () => {
    const offenders = [...SRC.matchAll(/krv-(wipe|erase)[^`]*`/g)]
      .map((m) => m[0])
      .filter((decl) => decl.includes("${EASE}"));
    expect(offenders).toEqual([]);
  });

  it("still has wipe/erase animations to check (the regex has not gone stale)", () => {
    expect([...SRC.matchAll(/krv-(wipe|erase)/g)].length).toBeGreaterThan(2);
  });

  it("the ease-out curve is still the front-loaded one this rule assumes", () => {
    // If EASE is ever retuned to something near-linear the rule above stops
    // mattering, and this test says so instead of the rule quietly cargo-culting.
    expect(SRC).toContain('const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"');
  });
});

describe("kanji reveal — candidate list", () => {
  it("has unique ids and no duplicate labels", () => {
    const ids = REVEAL_CANDIDATES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const labels = REVEAL_CANDIDATES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("keeps every candidate inside a plausible step budget", () => {
    // Step 1 is one step in a lesson, not a cutscene. 6s is the ceiling past
    // which the reveal stops being a beat and starts being a wait.
    for (const c of REVEAL_CANDIDATES) {
      expect(c.approxMs, c.id).toBeGreaterThan(500);
      expect(c.approxMs, c.id).toBeLessThan(6000);
    }
  });

  it("exactly one candidate is marked recommended", () => {
    const rec = REVEAL_CANDIDATES.filter((c) => c.label.includes("⭐"));
    expect(rec).toHaveLength(1);
  });
});

/** Words shared from the start of two sentences, ignoring case/punctuation. */
function sharedPrefixWords(a: string, b: string): string[] {
  const wa = a.toLowerCase().replace(/[.,]/g, "").split(/\s+/);
  const wb = b.toLowerCase().replace(/[.,]/g, "").split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < Math.min(wa.length, wb.length); i++) {
    if (wa[i] !== wb[i]) break;
    out.push(wa[i]);
  }
  return out;
}

describe("kanji reveal — cloze distractor safety", () => {
  it("never offers a tile whose gloss matches the answer's", () => {
    // The cloze is answered against an English cue, so a synonym tile would be
    // defensibly correct and the step would mark a right answer wrong.
    const byS = new Map(getKanjiWordPool().map((p) => [p.surface, p]));
    const norm = (g: string) => g.trim().toLowerCase().replace(/\s+/g, " ");
    for (const w of BEAT_WORDS) {
      for (const share of [false, true]) {
        const step = kanjiClozeStep(w, { shareGlyph: share }) as unknown as {
          wordBank: string[];
        };
        for (const tile of step.wordBank) {
          if (tile === w.kanji) continue;
          const gloss = byS.get(tile)?.gloss;
          if (gloss) expect(norm(gloss), `${tile} vs ${w.kanji}`).not.toBe(norm(w.gloss));
        }
      }
    }
  });
});
