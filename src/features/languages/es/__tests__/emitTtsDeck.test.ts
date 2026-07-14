/**
 * ES TTS deck emitter — run with:
 *
 *   EMIT_ES_TTS_DECK=1 npx vitest run src/features/languages/es/__tests__/emitTtsDeck.test.ts
 *
 * Writes ../lingo-core/test_decks/es-course.json for the Python generator
 * (`python -m scripts.tts.generate --provider edge --lang es`).
 *
 * Lives as an env-gated vitest file (skipped in normal runs) because the
 * ja emitter's approach — regex over source with a charset filter — can't
 * work for Spanish: Latin script can't be told apart from the English
 * glosses sitting in the same files. Instead we import the built content
 * and walk the actual step objects, collecting exactly the fields the
 * runtime feeds to getTtsUrl. Texts are emitted VERBATIM (trimmed only):
 * manifest keys must match runtime lookups exactly.
 */
import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ES_ALL_LESSONS } from "../curriculum";
import { getEsCourseAtoms } from "../courseAtoms";
import { ES_VERB_ENTRIES } from "../conjugationTables";
import { ES_PLACEMENT_BANK } from "../placementBank";

const OUT = resolve(process.cwd(), "../lingo-core/test_decks/es-course.json");

/** Spanish text + digits + punctuation the course uses. Guards against a
 *  wrongly-walked English field silently entering the deck. */
const ES_TEXT = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ0-9\s.,;:¿?¡!'"()\-—…%$]+$/;

const AUDIO_FIELDS = [
  "kana", // phrase_card carries its target-language text here (legacy name)
  "targetSentence",
  "audioText",
  "audioKey",
  "targetPhrase",
  "promptAudioText",
] as const;

function collectFromStep(step: Record<string, unknown>, into: Set<string>): void {
  for (const f of AUDIO_FIELDS) {
    const v = step[f];
    if (typeof v === "string" && v.trim()) into.add(v.trim());
  }
  if (Array.isArray(step.tiles)) {
    for (const t of step.tiles) {
      if (typeof t === "string" && t.trim()) into.add(t.trim());
    }
  }
  // Canonical (accented) accepted answer only — variants are grading
  // leniency, not distinct audio.
  if (Array.isArray(step.acceptedAnswers) && typeof step.acceptedAnswers[0] === "string") {
    const a = step.acceptedAnswers[0].trim();
    if (a) into.add(a);
  }
}

describe("emit es tts deck", () => {
  it.skipIf(!process.env.EMIT_ES_TTS_DECK)("writes the deck json", async () => {
    const texts = new Set<string>();

    for (const atom of getEsCourseAtoms()) texts.add(atom.surface.trim());
    for (const lesson of ES_ALL_LESSONS) {
      for (const step of lesson.steps) {
        collectFromStep(step as unknown as Record<string, unknown>, texts);
      }
    }
    for (const item of [
      ...ES_PLACEMENT_BANK.screener,
      ...Object.values(ES_PLACEMENT_BANK.byModule).flat(),
    ]) {
      collectFromStep(item.build() as unknown as Record<string, unknown>, texts);
    }
    for (const verb of ES_VERB_ENTRIES) {
      for (const form of Object.values(verb.forms)) texts.add(form.trim());
    }
    // Practice data may not exist yet mid-build — tolerate absence. The
    // computed specifier + @vite-ignore defers resolution to runtime so a
    // missing file lands in the catch instead of failing the transform.
    const speakingPath = "../../../practice/data/es-speaking-prompts";
    const readingPath = "../../../practice/data/es-reading-passages";
    try {
      const speaking = await import(/* @vite-ignore */ speakingPath);
      for (const p of Object.values(speaking)
        .flat()
        .filter((x): x is { targetPhrase: string } =>
          typeof (x as { targetPhrase?: unknown })?.targetPhrase === "string",
        )) {
        texts.add(p.targetPhrase.trim());
      }
    } catch {
      /* not authored yet */
    }
    try {
      const reading = await import(/* @vite-ignore */ readingPath);
      for (const p of Object.values(reading)
        .flat()
        .filter((x): x is { passage: string } =>
          typeof (x as { passage?: unknown })?.passage === "string",
        )) {
        for (const line of p.passage.split("\n")) {
          if (line.trim()) texts.add(line.trim());
        }
      }
    } catch {
      /* not authored yet */
    }

    const skipped: string[] = [];
    const kept = [...texts].filter((t) => {
      if (ES_TEXT.test(t)) return true;
      skipped.push(t);
      return false;
    });
    if (skipped.length) {
      // eslint-disable-next-line no-console
      console.warn(`[emit-es-deck] skipped ${skipped.length} non-ES strings:`, skipped.slice(0, 10));
    }

    const cards = kept.sort().map((t, i) => ({
      id: `es-${i.toString().padStart(4, "0")}`,
      front: t,
    }));
    const deck = {
      name: "es-course",
      languageId: "es",
      _note:
        "Auto-emitted by src/features/languages/es/__tests__/emitTtsDeck.test.ts " +
        "(EMIT_ES_TTS_DECK=1). Edit the curriculum, re-emit, then run the TTS generator.",
      cards,
    };
    writeFileSync(OUT, JSON.stringify(deck, null, 2) + "\n", "utf-8");
    // eslint-disable-next-line no-console
    console.log(`wrote ${cards.length} phrases → ${OUT}`);
    expect(cards.length).toBeGreaterThan(0);
  });
});
