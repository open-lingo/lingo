/**
 * Anki-round-trippable note schema (Spencer 2026-06-13, research-backed).
 *
 * SCHEMA ONLY — no `.apkg` import/export I/O this run (media hosting is
 * unresolved; see docs/flashcards-anki-scoping-2026-06-13.md). This defines
 * the note/card model so a future exporter is mechanical:
 *
 *  - A NOTE is an ordered list of fields (Kaishi-aligned: Word / Reading /
 *    furigana / Meaning / Sentence / audio / pitch / image / notes).
 *  - A NOTE TYPE carries TEMPLATES; each template generates one card. The
 *    recognition (ord 0) + production (ord 1) split maps onto Anki's
 *    `cards.ord`, exactly the FSRS-6 modality split this app already uses.
 *  - `guid` is derived DETERMINISTICALLY from the atom id, so re-import
 *    updates in place instead of duplicating (Anki matches notes by guid).
 *
 * Field names live only in the note type (Anki joins values by 0x1F in
 * field order); we mirror that with an explicit ordered field list.
 */
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";
import { canonicalAtomId } from "@/features/languages/ja/courseAtoms";
import type { Example } from "./types";

/** Ordered field list of the JA vocab note type (Kaishi-aligned). MVP
 *  fields are populated from atom data today; the rest are reserved for
 *  later enrichment (pitch, sentence audio, custom art). */
export const JA_VOCAB_FIELDS = [
  "AtomId",
  "Word",
  "Reading",
  "WordFurigana",
  "Meaning",
  "Sentence",
  "SentenceMeaning",
  "WordAudio",
  "SentenceAudio",
  "PitchAccent",
  "Image",
  "Notes",
] as const;

export type JaVocabField = (typeof JA_VOCAB_FIELDS)[number];

export type AnkiCardTemplate = {
  /** Disk ordinal (`cards.ord`): 0 = recognition, 1 = production. */
  ord: 0 | 1;
  name: "Recognition" | "Production";
  /** Field whose presence gates card generation (Anki skips empty fronts). */
  requires: JaVocabField;
};

export type AnkiNoteType = {
  name: string;
  /** Anki model type: 0 = standard (multi-template), 1 = cloze. */
  type: 0 | 1;
  fields: readonly JaVocabField[];
  templates: readonly AnkiCardTemplate[];
  sortField: JaVocabField;
};

export const JA_VOCAB_NOTE_TYPE: AnkiNoteType = {
  name: "OpenLingo JA Vocab",
  type: 0,
  fields: JA_VOCAB_FIELDS,
  templates: [
    { ord: 0, name: "Recognition", requires: "Word" },
    { ord: 1, name: "Production", requires: "Meaning" },
  ],
  sortField: "Word",
};

export type AnkiNote = {
  /** Deterministic, stable across re-imports — derived from the atom id. */
  guid: string;
  noteType: string;
  fields: Record<JaVocabField, string>;
};

/** Deterministic guid from the (canonical) atom id — FNV-1a → base36, so a
 *  re-import updates the note in place rather than duplicating. */
export function atomNoteGuid(atom: CourseAtom): string {
  const key = canonicalAtomId(atom);
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `ol-${(h >>> 0).toString(36)}`;
}

/**
 * Map an atom (+ optional mined sentence) to a round-trippable note. Pure;
 * unfilled fields are empty strings (Anki's convention). The Production
 * card is generated because `Meaning` is always present.
 */
export function courseAtomToAnkiNote(
  atom: CourseAtom,
  opts?: { example?: Example; wordAudio?: string },
): AnkiNote {
  const fields: Record<JaVocabField, string> = {
    AtomId: canonicalAtomId(atom),
    Word: atom.kanji ?? atom.kana,
    Reading: atom.kana,
    WordFurigana: atom.kanji ? `${atom.kanji}[${atom.kana}]` : "",
    Meaning: atom.meaningEn,
    Sentence: opts?.example?.text ?? "",
    SentenceMeaning: opts?.example?.translation ?? "",
    WordAudio: opts?.wordAudio ?? "",
    SentenceAudio: opts?.example?.audioUrl ?? "",
    PitchAccent: "",
    Image: "",
    Notes: atom.note ?? "",
  };
  return { guid: atomNoteGuid(atom), noteType: JA_VOCAB_NOTE_TYPE.name, fields };
}
