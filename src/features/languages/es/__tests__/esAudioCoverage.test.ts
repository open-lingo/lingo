/**
 * ES render-side audio-coverage gate — the es twin of
 * `features/lesson/data/audioCoverage.test.ts` (which walks compiled JA
 * modules only; that exemption is how a 719-clip gap shipped invisibly —
 * docs/es-authoring-scope-2026-08-09.md §1b).
 *
 * Walks every ES lesson AS RENDERED (getMockLessonContent) and collects the
 * exact fields the runtime feeds to getTtsUrl, then asks getTtsUrl itself —
 * the rendering side cannot drift from the emitter's idea of what needs a
 * clip, because it never consults the emitter.
 *
 * RATCHET: `MAX_UNCOVERED_TEXTS` is **0** and stays there (since 2026-08-19:
 * manifest refreshed from the full local corpus, new mp3s staged in
 * `tts-publish/es/` so the deploy ships clips + manifest together — see
 * tts-publish/README.md). The fix for a failure here is the regen chain:
 * re-emit the deck (EMIT_ES_TTS_DECK=1 vitest run .../emitTtsDeck.test.ts,
 * which walks lessons AS RENDERED, same as this gate), run
 * `pipeline.tts.generate --provider edge --lang es` + emit_manifest in
 * lingo-data, refresh `src/shared/tts/manifests/es.json`, and stage the new
 * mp3s — never an edit to this number.
 */
import { describe, expect, it } from "vitest";
import { ES_ALL_LESSONS } from "../curriculum";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getTtsUrl } from "@/shared/tts";
import type { LessonContent } from "@/features/lesson/types";

const MAX_UNCOVERED_TEXTS = 0;

/** Field names whose string values the step views hand to getTtsUrl.
 *  Mirrors the emitter (`emitTtsDeck.test.ts` AUDIO_FIELDS) — `kana` is the
 *  phrase_card target-text field (legacy name, carries Spanish here). */
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

describe("es audio coverage (render-side)", () => {
  it(`every rendered es audio surface resolves to a clip (ratchet ≤ ${MAX_UNCOVERED_TEXTS})`, () => {
    const texts = new Set<string>();
    for (const lesson of ES_ALL_LESSONS) {
      const rendered: LessonContent =
        getMockLessonContent(lesson.id) ?? lesson;
      collectAudioTexts(rendered.steps, texts);
    }
    expect(texts.size).toBeGreaterThan(1000); // collector sanity floor

    const uncovered = [...texts].filter((t) => getTtsUrl(t, "es") === null);
    const preview = uncovered.slice(0, 12).join(" | ");
    expect(
      uncovered.length,
      `${uncovered.length} es audio texts have no manifest clip (first: ${preview}). ` +
        "Fix = TTS regen chain + manifest refresh, then ratchet MAX_UNCOVERED_TEXTS down — never up.",
    ).toBeLessThanOrEqual(MAX_UNCOVERED_TEXTS);
  });
});
