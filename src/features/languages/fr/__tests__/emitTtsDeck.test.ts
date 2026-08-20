/**
 * FR TTS deck emitter — run with:
 *
 *   EMIT_FR_TTS_DECK=1 npx vitest run src/features/languages/fr/__tests__/emitTtsDeck.test.ts
 *
 * Writes ../lingo-data/data/test_decks/fr-course.json for the Python
 * generator (`cd ../lingo-data && python -m pipeline.tts.generate
 * --provider edge --lang fr`). Direct port of the ES emitter — see
 * `es/__tests__/emitTtsDeck.test.ts` for why this walks built step objects
 * (raw AND rendered) instead of regexing source, and why texts are emitted
 * VERBATIM (manifest keys must match runtime lookups exactly).
 *
 * FR differences: no conjugation tables yet (the first verb module adds its
 * forms here), and the charset guard admits French accents, apostrophes
 * (straight and curly), and guillemets.
 */
import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FR_ALL_LESSONS } from "../curriculum";
import { getFrCourseAtoms } from "../courseAtoms";
import { FR_PLACEMENT_BANK } from "../placementBank";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

const OUT = resolve(process.cwd(), "../lingo-data/data/test_decks/fr-course.json");

/** French text + digits + punctuation the course uses. Guards against a
 *  wrongly-walked English field silently entering the deck — note English
 *  sails through a Latin charset check, so this guard only catches fields
 *  carrying symbols/CJK; the real defense is walking only AUDIO_FIELDS. */
const FR_TEXT =
  /^[a-zàâæçéèêëîïôœùûüÿA-ZÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ0-9\s.,;:?!'’"()«»\-—…%€$]+$/;

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
  // Canonical accepted answer only — variants are grading leniency.
  if (Array.isArray(step.acceptedAnswers) && typeof step.acceptedAnswers[0] === "string") {
    const a = step.acceptedAnswers[0].trim();
    if (a) into.add(a);
  }
  // dialogue_listen: runtime plays line.audioText ?? line.kana per line.
  if (Array.isArray(step.lines)) {
    for (const line of step.lines as Array<Record<string, unknown>>) {
      const v = line?.audioText ?? line?.kana;
      if (typeof v === "string" && v.trim()) into.add(v.trim());
    }
  }
  // match_pairs: playAudioOnSelect plays the bare source word on tap.
  if (Array.isArray(step.pairs)) {
    for (const pair of step.pairs as Array<Record<string, unknown>>) {
      if (typeof pair?.source === "string" && pair.source.trim()) {
        into.add(pair.source.trim());
      }
    }
  }
  // liaison_listen / gender_sort word lists: tap-to-play surfaces.
  if (Array.isArray(step.words)) {
    for (const w of step.words) {
      if (typeof w === "string" && w.trim()) into.add(w.trim());
    }
  }
  if (Array.isArray(step.items)) {
    for (const item of step.items as Array<Record<string, unknown>>) {
      if (typeof item?.surface === "string" && item.surface.trim()) {
        into.add(item.surface.trim());
      }
    }
  }
}

/** Recursive walk over a RENDERED step tree — mirrors the authoritative
 *  collectAudioTexts in frAudioCoverage.test.ts (see the ES emitter header
 *  for the raw+rendered rationale). */
function collectRendered(node: unknown, into: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectRendered(item, into);
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (
        typeof value === "string" &&
        (AUDIO_FIELDS as readonly string[]).includes(key) &&
        value.trim()
      ) {
        into.add(value.trim());
      } else {
        collectRendered(value, into);
      }
    }
  }
}

describe("emit fr tts deck", () => {
  it.skipIf(!process.env.EMIT_FR_TTS_DECK)("writes the deck json", async () => {
    const texts = new Set<string>();

    for (const atom of getFrCourseAtoms()) texts.add(atom.surface.trim());
    for (const lesson of FR_ALL_LESSONS) {
      for (const step of lesson.steps) {
        collectFromStep(step as unknown as Record<string, unknown>, texts);
      }
      const rendered = getMockLessonContent(lesson.id) ?? lesson;
      collectRendered(rendered.steps, texts);
      for (const step of rendered.steps) {
        collectFromStep(step as unknown as Record<string, unknown>, texts);
      }
    }
    for (const item of [
      ...FR_PLACEMENT_BANK.screener,
      ...Object.values(FR_PLACEMENT_BANK.byModule).flat(),
    ]) {
      collectFromStep(item.build() as unknown as Record<string, unknown>, texts);
    }
    // Practice data may not exist yet — tolerate absence (ES pattern).
    const speakingPath = "../../../practice/data/fr-speaking-prompts";
    const readingPath = "../../../practice/data/fr-reading-passages";
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
      if (FR_TEXT.test(t)) return true;
      skipped.push(t);
      return false;
    });
    if (skipped.length) {
      // eslint-disable-next-line no-console
      console.warn(`[emit-fr-deck] skipped ${skipped.length} non-FR strings:`, skipped.slice(0, 10));
    }

    const cards = kept.sort().map((t, i) => ({
      id: `fr-${i.toString().padStart(4, "0")}`,
      front: t,
    }));
    const deck = {
      name: "fr-course",
      languageId: "fr",
      _note:
        "Auto-emitted by src/features/languages/fr/__tests__/emitTtsDeck.test.ts " +
        "(EMIT_FR_TTS_DECK=1). Edit the curriculum, re-emit, then run the TTS generator.",
      cards,
    };
    writeFileSync(OUT, JSON.stringify(deck, null, 2) + "\n", "utf-8");
    // eslint-disable-next-line no-console
    console.log(`wrote ${cards.length} phrases → ${OUT}`);
    expect(cards.length).toBeGreaterThan(0);
  });
});
