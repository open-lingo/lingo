/**
 * KO render-side audio-coverage gate — the ko twin of
 * `fr/__tests__/frAudioCoverage.test.ts` / `es/__tests__/esAudioCoverage.test.ts`
 * (see the fr header for why the gate walks lessons AS RENDERED and asks
 * getTtsUrl itself).
 *
 * Added by the 2026-09-01 KO release audit (§2 #9): 26+ live manifest holes
 * in m4–m15 accumulated silently because nothing failed a build when a lesson
 * referenced an unclipped string. (Root cause was an emitter regex that
 * desynced on \n-escaped strings — fixed in scripts/emit-ko-tts-deck.mjs the
 * same day. This test is the guard that makes that class of silent skip loud.)
 *
 * RATCHET: `MAX_UNCOVERED_TEXTS` is **0** and STARTED at 0 (2026-09-01 regen
 * cleared every hole). The fix for a failure here is the regen chain, never
 * an edit to this number:
 *   1. node scripts/emit-ko-tts-deck.mjs
 *   2. cd ../lingo-data && python -m pipeline.tts.generate --lang ko --provider edge
 *   3. python -m pipeline.tts.emit_manifest --lang ko
 *   4. refresh src/shared/tts/manifests/ko.json (byte-identical to
 *      lingo-data/out/tts/manifest/ko.json) and stage the new mp3s in
 *      tts-publish/ko/ — clips and manifest ship in the SAME deploy.
 *
 * Scope: the hand-authored content modules m3–m27 (exactly the files the
 * deck emitter sweeps). The generated m1/m2 hangul row lessons build their
 * syllable audio programmatically outside this emitter chain and were
 * audio-verified by the 2026-08-26 audit — extend the table when they get a
 * scrape of their own.
 */
import { describe, expect, it } from "vitest";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getTtsUrl } from "@/shared/tts";
import type { LessonContent } from "@/features/lesson/types";
import { KO_M3_LESSONS } from "../curriculum/m3";
import { KO_M4_LESSONS } from "../curriculum/m4";
import { KO_M5_LESSONS } from "../curriculum/m5";
import { KO_M6_LESSONS } from "../curriculum/m6";
import { KO_M7_LESSONS } from "../curriculum/m7";
import { KO_M8_LESSONS } from "../curriculum/m8";
import { KO_M9_LESSONS } from "../curriculum/m9";
import { KO_M10_LESSONS } from "../curriculum/m10";
import { KO_M11_LESSONS } from "../curriculum/m11";
import { KO_M12_LESSONS } from "../curriculum/m12";
import { KO_M13_LESSONS } from "../curriculum/m13";
import { KO_M14_LESSONS } from "../curriculum/m14";
import { KO_M15_LESSONS } from "../curriculum/m15";
import { KO_M16_LESSONS } from "../curriculum/m16";
import { KO_M17_LESSONS } from "../curriculum/m17";
import { KO_M18_LESSONS } from "../curriculum/m18";
import { KO_M19_LESSONS } from "../curriculum/m19";
import { KO_M20_LESSONS } from "../curriculum/m20";
import { KO_M21_LESSONS } from "../curriculum/m21";
import { KO_M22_LESSONS } from "../curriculum/m22";
import { KO_M23_LESSONS } from "../curriculum/m23";
import { KO_M24_LESSONS } from "../curriculum/m24";
import { KO_M25_LESSONS } from "../curriculum/m25";
import { KO_M26_LESSONS } from "../curriculum/m26";
import { KO_M27_LESSONS } from "../curriculum/m27";

const MAX_UNCOVERED_TEXTS = 0;

const KO_CONTENT_LESSONS: LessonContent[] = [
  ...KO_M3_LESSONS,
  ...KO_M4_LESSONS,
  ...KO_M5_LESSONS,
  ...KO_M6_LESSONS,
  ...KO_M7_LESSONS,
  ...KO_M8_LESSONS,
  ...KO_M9_LESSONS,
  ...KO_M10_LESSONS,
  ...KO_M11_LESSONS,
  ...KO_M12_LESSONS,
  ...KO_M13_LESSONS,
  ...KO_M14_LESSONS,
  ...KO_M15_LESSONS,
  ...KO_M16_LESSONS,
  ...KO_M17_LESSONS,
  ...KO_M18_LESSONS,
  ...KO_M19_LESSONS,
  ...KO_M20_LESSONS,
  ...KO_M21_LESSONS,
  ...KO_M22_LESSONS,
  ...KO_M23_LESSONS,
  ...KO_M24_LESSONS,
  ...KO_M25_LESSONS,
  ...KO_M26_LESSONS,
  ...KO_M27_LESSONS,
];

/** Field names whose string values the step views hand to getTtsUrl.
 *  `kana` is the phrase_card target-text field (legacy JA-era name — it
 *  carries Hangul here). */
const AUDIO_KEYS = new Set([
  "audioText",
  "audioKey",
  "targetSentence",
  "targetPhrase",
  "promptAudioText",
  "kana",
]);

function collectAudioTexts(node: unknown, into: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectAudioTexts(item, into);
    return;
  }
  if (node && typeof node === "object") {
    const rec = node as Record<string, unknown>;
    // `kana` is DISPLAY text with `audioText` as the played key on the same
    // object (dialogue lines: the view plays `audioText ?? kana`). When
    // audioText is present, kana is never handed to getTtsUrl.
    const kanaShadowed =
      typeof rec.audioText === "string" && rec.audioText.trim().length > 0;
    for (const [key, value] of Object.entries(rec)) {
      if (key === "kana" && kanaShadowed) continue;
      if (typeof value === "string" && AUDIO_KEYS.has(key) && value.trim()) {
        into.add(value.trim());
      } else {
        collectAudioTexts(value, into);
      }
    }
  }
}

describe("ko audio coverage (render-side)", () => {
  it(`every rendered ko audio surface resolves to a clip (ratchet ≤ ${MAX_UNCOVERED_TEXTS})`, () => {
    const texts = new Set<string>();
    for (const lesson of KO_CONTENT_LESSONS) {
      const rendered: LessonContent =
        getMockLessonContent(lesson.id) ?? lesson;
      collectAudioTexts(rendered.steps, texts);
    }
    // Collector sanity floor: catches a broken walk (empty or near-empty),
    // not a coverage claim — step types deliberately REUSE each other's
    // audio, so unique-text count grows much slower than step count.
    expect(texts.size).toBeGreaterThan(200);

    const uncovered = [...texts].filter((t) => getTtsUrl(t, "ko") === null);
    const preview = uncovered.slice(0, 12).join(" | ");
    expect(
      uncovered.length,
      `${uncovered.length} ko audio texts have no manifest clip (first: ${preview}). ` +
        "Fix = TTS regen chain + manifest refresh (see file header) — never raise the ratchet.",
    ).toBeLessThanOrEqual(MAX_UNCOVERED_TEXTS);
  });
});
