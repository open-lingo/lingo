/**
 * Shared JA sentence miner (extracted from `flashcards/data/courseDeck.ts`,
 * 2026-07-17, so the SRS review-lesson builder can reuse it).
 *
 * Maps each canonical atom id (`ja:biiru`) to a MINED example sentence: the
 * shortest sentence from existing lessons that actually uses the atom's
 * word. We reuse authored curriculum sentences rather than writing new
 * ones — and because lessons already satisfy the intro-before-use
 * conformance, a mined sentence never leans on not-yet-taught vocab.
 *
 * Two indexes, built in one memoized walk:
 *  - `getMinedSentences()` — shortest sentence per atom, translation or
 *    not. Byte-identical semantics to the original courseDeck miner
 *    (build_sentence / listening_build / listening_comprehension sources).
 *  - `getMinedTranslatedSentences()` — shortest MULTI-WORD sentence per
 *    atom that carries a reliable English translation. Sources: authored
 *    `speaking` steps (targetPhrase + translation) and sentence-meaning
 *    `listening_comprehension` steps (transcript + correct-option text).
 *    Used by the review-lesson builder to put due words back into
 *    sentence context (Spencer QA ja-m28-review-2).
 */
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMinedLessonReader } from "./minedLessonReader";
import { ensureMinedSentencesLoaded } from "./contentLoader";
// Tests/emitter: installs the synchronous lesson reader (see *.eager.ts).
import "virtual:eager:minedSentences";
import { usesWord } from "./jaWordSpan";

export type MinedSentence = { text: string; translation?: string };
export type MinedTranslatedSentence = { text: string; translation: string };

let anyIndex: Map<string, MinedSentence> | null = null;
let translatedIndex: Map<string, MinedTranslatedSentence> | null = null;

/** Re-entrancy guard: the walk materializes every lesson, INCLUDING the
 *  generated SRS review lessons — which themselves consult the miner. While
 *  the indexes are being built, nested lookups get an empty map (those
 *  review lessons compose word-level fallbacks, same as before the miner
 *  was shared), instead of recursing forever. */
let building = false;
const EMPTY_TRANSLATED: ReadonlyMap<string, MinedTranslatedSentence> =
  new Map();

function orderedJaLessonIds(): string[] {
  const course = getMockCourse("ja");
  const ids: string[] = [];
  type LessonRef = { id: string };
  type ModuleShape = {
    lessons?: LessonRef[];
    lessonGroups?: { lessons?: LessonRef[] }[];
  };
  for (const mod of course.modules as unknown as ModuleShape[]) {
    for (const l of mod.lessons ?? []) ids.push(l.id);
    for (const g of mod.lessonGroups ?? []) {
      for (const l of g.lessons ?? []) ids.push(l.id);
    }
  }
  return ids;
}

/** Pull candidate sentences (+ any translation) out of one lesson step.
 *  Unchanged from the courseDeck original — this feeds the flashcard
 *  example index, so its behavior must stay identical. */
function sentencesFromStep(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  s: any,
): MinedSentence[] {
  const out: MinedSentence[] = [];
  if (s.type === "build_sentence" && typeof s.targetSentence === "string") {
    out.push({ text: s.targetSentence });
  }
  if (s.type === "listening_build" && typeof s.targetSentence === "string") {
    out.push({ text: s.targetSentence });
  }
  if (
    s.type === "listening_comprehension" &&
    typeof s.transcript === "string"
  ) {
    out.push({ text: s.transcript, translation: s.translation });
  }
  return out;
}

/** Multi-word sentences whose English translation we can trust verbatim. */
function translatedSentencesFromStep(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  s: any,
): MinedTranslatedSentence[] {
  const out: MinedTranslatedSentence[] = [];
  if (
    s.type === "speaking" &&
    typeof s.targetPhrase === "string" &&
    typeof s.translation === "string" &&
    s.targetPhrase.includes(" ")
  ) {
    out.push({ text: s.targetPhrase, translation: s.translation });
  }
  if (
    s.type === "listening_comprehension" &&
    typeof s.transcript === "string" &&
    s.transcript.includes(" ") &&
    typeof s.question === "string" &&
    /sentence mean/i.test(s.question) &&
    Array.isArray(s.options)
  ) {
    const correct = s.options.find(
      (o: { id: string; text?: string }) => o.id === s.correctOptionId,
    );
    if (correct && typeof correct.text === "string") {
      out.push({ text: s.transcript, translation: correct.text });
    }
  }
  return out;
}

function buildIndexes(): void {
  building = true;
  try {
    buildIndexesInner();
  } finally {
    building = false;
  }
}

function buildIndexesInner(): void {
  const bestAny = new Map<string, { sent: MinedSentence; len: number }>();
  const bestTr = new Map<
    string,
    { sent: MinedTranslatedSentence; len: number }
  >();
  const atoms = JA_COURSE_ATOMS.filter(isSrsEligibleAtom).map((a) => ({
    kana: a.kana,
    cardId: canonicalAtomId(a),
  }));
  for (const id of orderedJaLessonIds()) {
    // `floors: false`: this walk reads sentence text only, and the floor
    // passes never touch it — with floors on, the first call here forced the
    // whole-course frequency index (~1.2 s desktop, seconds on a phone) before
    // Home could paint (it runs under useFlashcardDueSummary on Home).
    const lesson = getMinedLessonReader()!(id, { floors: false });
    if (!lesson) continue;
    for (const step of lesson.steps) {
      for (const sent of sentencesFromStep(step)) {
        if (sent.text.length <= 1) continue;
        for (const { kana, cardId } of atoms) {
          if (sent.text === kana) continue;
          if (!usesWord(sent.text, kana)) continue;
          const prev = bestAny.get(cardId);
          if (!prev || sent.text.length < prev.len) {
            bestAny.set(cardId, { sent, len: sent.text.length });
          }
        }
      }
      for (const sent of translatedSentencesFromStep(step)) {
        for (const { kana, cardId } of atoms) {
          if (sent.text === kana) continue;
          if (!usesWord(sent.text, kana)) continue;
          const prev = bestTr.get(cardId);
          if (!prev || sent.text.length < prev.len) {
            bestTr.set(cardId, { sent, len: sent.text.length });
          }
        }
      }
    }
  }
  anyIndex = new Map([...bestAny].map(([k, v]) => [k, v.sent]));
  translatedIndex = new Map([...bestTr].map(([k, v]) => [k, v.sent]));
}

/**
 * Map canonical card id → shortest mined example sentence. Memoized: walks
 * every lesson once. Only multi-character sentences that USE the word as a
 * word (`jaWordSpan.ts` — not a substring of another word, and not the bare
 * word itself) qualify.
 */
export function getMinedSentences(): Map<string, MinedSentence> {
  if (building) return new Map();
  if (!anyIndex) {
    if (!indexesAvailableSynchronously()) return EMPTY_ANY;
    buildIndexes();
  }
  return anyIndex!;
}

/** Serializable form of both indexes — what the content emitter writes. */
export type MinedSentenceIndexes = {
  any: [string, MinedSentence][];
  translated: [string, MinedTranslatedSentence][];
};

/**
 * Build both indexes by walking the (eagerly registered) lesson table.
 * Used by `npm run content:emit`; the browser never walks.
 */
export function computeMinedSentenceIndexes(): MinedSentenceIndexes {
  buildIndexes();
  return {
    any: [...(anyIndex ?? new Map())],
    translated: [...(translatedIndex ?? new Map())],
  };
}

/** Install precomputed indexes (browser: from content/v1/ja/mined.*.json). */
export function setMinedSentenceIndexes(data: MinedSentenceIndexes): void {
  anyIndex = new Map(data.any);
  translatedIndex = new Map(data.translated);
}

const EMPTY_ANY: Map<string, MinedSentence> = new Map();
let kicked = false;



/**
 * Content-as-data (2026-09-13): in the browser the lesson table is filled
 * from JSON on demand and the miner's walk would need the whole Japanese
 * course, so the walk only runs where the table is eager (tests, emitter).
 * Otherwise the precomputed index is fetched once, and `getMinedSentences`
 * answers EMPTY until it lands — callers on Home use `useContentRevision()`
 * to re-render when it does. Empty is a safe answer: it means "no example
 * sentence yet", never wrong data.
 */
function indexesAvailableSynchronously(): boolean {
  if (getMinedLessonReader()) return true;
  if (!kicked) {
    kicked = true;
    void ensureMinedSentencesLoaded("ja").catch(() => {
      kicked = false;
    });
  }
  return false;
}

/**
 * Map canonical card id → shortest mined MULTI-WORD sentence with a
 * trustworthy English translation. Same memoized walk as
 * `getMinedSentences`.
 */
export function getMinedTranslatedSentences(): ReadonlyMap<
  string,
  MinedTranslatedSentence
> {
  if (building) return EMPTY_TRANSLATED;
  if (!translatedIndex) {
    if (!indexesAvailableSynchronously()) return EMPTY_TRANSLATED;
    buildIndexes();
  }
  return translatedIndex!;
}

/** Test hook: drop the memoized indexes. */
export function __resetMinedSentences(): void {
  anyIndex = null;
  translatedIndex = null;
}
