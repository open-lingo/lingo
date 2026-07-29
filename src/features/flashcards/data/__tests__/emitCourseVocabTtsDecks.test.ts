/**
 * Course-vocab TTS deck emitter (front-of-card audio pass) — run with:
 *
 *   EMIT_COURSE_VOCAB_TTS_DECKS=1 npx vitest run \
 *     src/features/flashcards/data/__tests__/emitCourseVocabTtsDecks.test.ts
 *
 * Writes one deck per shipped course language:
 *   ../lingo-core/test_decks/{ja,ko,es}-course-vocab.json
 * for the Python generator (`python -m scripts.tts.generate --provider edge
 * --lang <lang>`), which fills any missing mp3 + writes the manifest key.
 *
 * Scope: the *front-of-card* spoken surface for every vocabulary word that
 * appears on a course flashcard — i.e. exactly the set the flashcards
 * surface renders. That set is `getNormalizedCourseAtoms(lang)` filtered to
 * SRS-eligible atoms — the same filter `buildEnrichedCourseDeck` uses to
 * build the deck (JA via `isSrsEligibleAtom`, KO/ES via `atom.srsEligible`).
 *
 * The spoken surface is the normalized `display` field:
 *   - JA: kana  (the flashcard *front* is "漢字 (かな)", but only the kana is
 *          keyed in the TTS manifest / spoken — kanji is silent).
 *   - KO: Hangul surface.
 *   - ES: Spanish word.
 *
 * Flip-side (English gloss) audio is intentionally NOT emitted — that is a
 * separate future pass.
 *
 * Lives as an env-gated vitest file (skipped in normal runs) because it
 * imports the real, registered language catalogs — the only faithful way to
 * reproduce what a flashcard would speak. Texts are emitted VERBATIM
 * (trimmed only): manifest keys must match runtime `getTtsUrl` lookups
 * exactly.
 */
import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
// Importing normalizedAtoms transitively imports the language registry,
// which statically registers ja/ko/es — so the catalogs are non-empty.
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";

const LANGS = ["ja", "ko", "es"] as const;

function deckPathFor(lang: string): string {
  return resolve(process.cwd(), `../lingo-core/test_decks/${lang}-course-vocab.json`);
}

/** The spoken front surface for every SRS-eligible (i.e. flashcard) atom. */
function frontSurfaces(lang: string): string[] {
  const set = new Set<string>();
  for (const atom of getNormalizedCourseAtoms(lang)) {
    if (!atom.srsEligible) continue;
    const s = atom.display.trim();
    if (s) set.add(s);
  }
  return [...set].sort();
}

describe("emit course-vocab tts decks", () => {
  it.skipIf(!process.env.EMIT_COURSE_VOCAB_TTS_DECKS)(
    "writes one front-of-card deck per language",
    () => {
      for (const lang of LANGS) {
        const texts = frontSurfaces(lang);
        expect(texts.length).toBeGreaterThan(0);
        const cards = texts.map((t, i) => ({
          id: `${lang}-vocab-${i.toString().padStart(4, "0")}`,
          front: t,
        }));
        const deck = {
          name: `${lang}-course-vocab`,
          languageId: lang,
          _note:
            "Auto-emitted by src/features/flashcards/data/__tests__/" +
            "emitCourseVocabTtsDecks.test.ts (EMIT_COURSE_VOCAB_TTS_DECKS=1). " +
            "Front-of-card spoken surface for every SRS-eligible course " +
            "flashcard atom. Edit the catalog, re-emit, then run the TTS " +
            "generator (--lang " +
            lang +
            ").",
          cards,
        };
        const out = deckPathFor(lang);
        writeFileSync(out, JSON.stringify(deck, null, 2) + "\n", "utf-8");
        // eslint-disable-next-line no-console
        console.log(`[emit-course-vocab] ${lang}: ${cards.length} words → ${out}`);
      }
    },
  );
});
