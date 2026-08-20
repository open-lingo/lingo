/**
 * FR render-side audio-coverage gate — the fr twin of
 * `es/__tests__/esAudioCoverage.test.ts` (see its header for why the gate
 * walks lessons AS RENDERED and asks getTtsUrl itself).
 *
 * RATCHET: `MAX_UNCOVERED_TEXTS` is **0** and STARTED at 0 — French shipped
 * its first module after the ES corpus wipe (2026-07-29) taught the course
 * what a coverage gap costs, so fr never gets a nonzero grace period. The
 * fix for a failure here is the regen chain, never an edit to this number:
 *   1. EMIT_FR_TTS_DECK=1 npx vitest run src/features/languages/fr/__tests__/emitTtsDeck.test.ts
 *   2. cd ../lingo-data && python -m pipeline.tts.generate --provider edge --lang fr
 *   3. python -m pipeline.tts.emit_manifest --lang fr
 *   4. refresh src/shared/tts/manifests/fr.json (byte-identical to
 *      lingo-data/out/tts/manifest/fr.json) and stage the new mp3s in
 *      tts-publish/fr/ — clips and manifest ship in the SAME deploy.
 *
 * FR stays out of AVAILABLE_LEARNING_LANGUAGE_IDS until this gate is green.
 */
import { describe, expect, it } from "vitest";
import { FR_ALL_LESSONS } from "../curriculum";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getTtsUrl } from "@/shared/tts";
import type { LessonContent } from "@/features/lesson/types";

const MAX_UNCOVERED_TEXTS = 0;

/** Field names whose string values the step views hand to getTtsUrl.
 *  Mirrors the emitter (`emitTtsDeck.test.ts` AUDIO_FIELDS) — `kana` is the
 *  phrase_card target-text field (legacy name, carries French here). */
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
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (typeof value === "string" && AUDIO_KEYS.has(key) && value.trim()) {
        into.add(value.trim());
      } else {
        collectAudioTexts(value, into);
      }
    }
  }
}

describe("fr audio coverage (render-side)", () => {
  it(`every rendered fr audio surface resolves to a clip (ratchet ≤ ${MAX_UNCOVERED_TEXTS})`, () => {
    const texts = new Set<string>();
    for (const lesson of FR_ALL_LESSONS) {
      const rendered: LessonContent =
        getMockLessonContent(lesson.id) ?? lesson;
      collectAudioTexts(rendered.steps, texts);
    }
    // Collector sanity floor: catches a broken walk (empty or near-empty),
    // not a coverage claim. m1 alone yields 46 unique texts — step types
    // deliberately REUSE each other's audio (a build retests the card's
    // phrase), so unique-text count grows much slower than step count.
    expect(texts.size).toBeGreaterThan(30);

    const uncovered = [...texts].filter((t) => getTtsUrl(t, "fr") === null);
    const preview = uncovered.slice(0, 12).join(" | ");
    expect(
      uncovered.length,
      `${uncovered.length} fr audio texts have no manifest clip (first: ${preview}). ` +
        "Fix = TTS regen chain + manifest refresh (see file header) — never raise the ratchet.",
    ).toBeLessThanOrEqual(MAX_UNCOVERED_TEXTS);
  });
});
