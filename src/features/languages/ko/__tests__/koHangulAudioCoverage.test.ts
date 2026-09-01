/**
 * Hangul-tier (m1/m2) audio-coverage gate — the glyph-drill companion to
 * `koAudioCoverage.test.ts` (which covers the content modules m3–m27 and
 * deliberately excludes this tier).
 *
 * Why a separate gate: the row/CV/y-vowel lessons resolve some audio at
 * BUILD time (`recognition()` in `_hangulRowHelpers` stores the resolved
 * URL from `getTtsUrl(block)`, or `undefined` when the clip is missing — a
 * silent hole), so the m3+ collector's text-key walk can't see them. Here
 * we walk the generated m1/m2 lessons and demand a manifest clip for every
 * sound-bearing SOURCE:
 *   - `symbol_recognition` payload symbols (the audio prompt is the glyph);
 *   - `match_pairs` sources when `playAudioOnSelect` is set;
 *   - every bare-Hangul text in the standard audio fields (listening_build
 *     targets, listening_comprehension transcripts, speaking phrases).
 *
 * RATCHET: 0, started at 0 (2026-09-01 — the emitter-desync regen wave had
 * already backfilled the tier). Fix = the KO TTS regen chain (see the
 * koAudioCoverage header), never a raise.
 */
import { describe, expect, it } from "vitest";
import type { LessonContent } from "@/features/lesson/types";
import { getTtsUrl } from "@/shared/tts";
import { MOCK_LESSON_KO_M1_INTRO } from "../curriculum/m1-intro";
import {
  MOCK_LESSON_KO_M1_V1,
  MOCK_LESSON_KO_M1_V2,
} from "../curriculum/m1-vowels";
import { buildAllKoreanRowLessons } from "../curriculum/m1-rows";
import { buildAllKoreanM2Lessons } from "../curriculum/m2";

const MAX_UNCOVERED_TEXTS = 0;

const HANGUL_TIER_LESSONS: LessonContent[] = [
  MOCK_LESSON_KO_M1_INTRO,
  MOCK_LESSON_KO_M1_V1,
  MOCK_LESSON_KO_M1_V2,
  ...buildAllKoreanRowLessons(),
  ...buildAllKoreanM2Lessons(),
];

const TEXT_AUDIO_KEYS = new Set([
  "audioKey",
  "audioText",
  "targetPhrase",
  "targetSentence",
  "transcript",
]);

const HAS_HANGUL = /[가-힣]/;
/** Bare speakable Hangul text — not a resolved URL/path, no Latin. */
function isSpeakableText(s: string): boolean {
  return HAS_HANGUL.test(s) && !s.includes("/") && !/[A-Za-z]/.test(s);
}

function collect(lessons: LessonContent[]): Set<string> {
  const texts = new Set<string>();
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      const s = step as Record<string, unknown>;
      for (const [key, value] of Object.entries(s)) {
        if (typeof value === "string" && TEXT_AUDIO_KEYS.has(key) && isSpeakableText(value)) {
          texts.add(value.trim());
        }
      }
      if (step.type === "symbol_recognition") {
        const symbol = (s.payload as { symbol?: string } | undefined)?.symbol;
        if (symbol && HAS_HANGUL.test(symbol)) texts.add(symbol);
      }
      if (step.type === "match_pairs" && (s as { playAudioOnSelect?: boolean }).playAudioOnSelect) {
        for (const p of (s.pairs as { source: string }[]) ?? []) {
          if (isSpeakableText(p.source)) texts.add(p.source.trim());
        }
      }
    }
  }
  return texts;
}

describe("ko hangul-tier audio coverage (m1/m2)", () => {
  it(`every glyph/word sound source resolves to a clip (ratchet ≤ ${MAX_UNCOVERED_TEXTS})`, () => {
    const texts = collect(HANGUL_TIER_LESSONS);
    // Sanity floor: 6 vowel blocks + 9×6 m1 row blocks + 9×6 m2 row blocks +
    // y-vowel/CV blocks + anchor words — a broken walk can't reach this.
    expect(texts.size).toBeGreaterThan(150);

    const uncovered = [...texts].filter((t) => getTtsUrl(t, "ko") === null);
    const preview = uncovered.slice(0, 12).join(" | ");
    expect(
      uncovered.length,
      `${uncovered.length} hangul-tier sound sources have no manifest clip (first: ${preview}). ` +
        "Fix = TTS regen chain + manifest refresh — never raise the ratchet.",
    ).toBeLessThanOrEqual(MAX_UNCOVERED_TEXTS);
  });
});
