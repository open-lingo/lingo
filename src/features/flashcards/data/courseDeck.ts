/**
 * Client-generated JA course flashcard deck (Spencer 2026-06-13).
 *
 * The course deck is derived from `JA_COURSE_ATOMS` — the real curriculum
 * vocab — NOT from the old 5-card `ja-beginner.json` stub. Card ids are the
 * canonical atom ids (`ja:biiru`), so a card, its FSRS state, and its
 * unlock flag all share one key. Cheapest at scale: it's static content
 * already in the JS bundle, computed once + memoized; no backend storage.
 *
 * Each card is enriched with a MINED example sentence: the shortest
 * sentence from existing lessons that actually uses the atom's word. We
 * reuse authored curriculum sentences rather than writing new ones — and
 * because lessons already satisfy the intro-before-use conformance, a
 * mined sentence never leans on not-yet-taught vocab.
 */
import {
  buildJaCourseDeck,
  canonicalAtomId,
  JA_COURSE_ATOMS,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";
import type { Example, Flashcard, FlashcardDeck } from "./types";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getUnlockedAtomIds } from "@/features/lesson/data/unlockLessonAtoms";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { tryGetLanguageModule } from "@/shared/language/registry";
import { notoEmojiUrl } from "@/shared/assets/notoEmoji";

/* ── sentence mining ── */

type MinedSentence = { text: string; translation?: string };

let mineIndex: Map<string, MinedSentence> | null = null;

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

/** Pull candidate sentences (+ any translation) out of one lesson step. */
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

/**
 * Map canonical card id → shortest mined example sentence. Memoized: walks
 * every lesson once. Only multi-character sentences that strictly CONTAIN
 * the word (and aren't just the word itself) qualify.
 */
function getMinedSentences(): Map<string, MinedSentence> {
  if (mineIndex) return mineIndex;
  const best = new Map<string, { sent: MinedSentence; len: number }>();
  const atoms = JA_COURSE_ATOMS.filter(isSrsEligibleAtom).map((a) => ({
    kana: a.kana,
    cardId: canonicalAtomId(a),
  }));
  for (const id of orderedJaLessonIds()) {
    const lesson = getMockLessonContent(id);
    if (!lesson) continue;
    for (const step of lesson.steps) {
      for (const sent of sentencesFromStep(step)) {
        if (sent.text.length <= 1) continue;
        for (const { kana, cardId } of atoms) {
          if (sent.text === kana) continue;
          if (!sent.text.includes(kana)) continue;
          const prev = best.get(cardId);
          if (!prev || sent.text.length < prev.len) {
            best.set(cardId, { sent, len: sent.text.length });
          }
        }
      }
    }
  }
  mineIndex = new Map([...best].map(([k, v]) => [k, v.sent]));
  return mineIndex;
}

/* ── enriched deck ── */

/**
 * Build the JA course deck from atoms, enriched with mined sentences and
 * marked unlocked per the current unlock store. Pass `unlockedIds` to
 * override (tests); defaults to the live `lingo:unlocked-atoms` store.
 */
let imagesByCardId: Map<string, string> | null = null;
function getCardImages(): Map<string, string> {
  if (imagesByCardId) return imagesByCardId;
  const out = new Map<string, string>();
  for (const atom of JA_COURSE_ATOMS) {
    if (!isSrsEligibleAtom(atom) || !atom.emoji) continue;
    const url = notoEmojiUrl(atom.emoji);
    if (url) out.set(canonicalAtomId(atom), url);
  }
  imagesByCardId = out;
  return out;
}

export function buildEnrichedJaCourseDeck(
  unlockedIds: ReadonlySet<string> = getUnlockedAtomIds(),
): FlashcardDeck {
  return buildJaCourseDeck({
    unlockedIds,
    examplesByCardId: getMinedSentences() as ReadonlyMap<string, Example>,
    imagesByCardId: getCardImages(),
  });
}

/* ── generic course deck (any language with an atom catalog) ── */

/**
 * Build the course flashcard deck for a language.
 *
 * JA keeps its enriched builder (kanji fronts + mined example sentences).
 * Other languages derive cards straight from the normalized atom view:
 * front = display surface, back = gloss, emoji art when authored. Card ids
 * are the canonical atom ids so a card, its FSRS state, and its unlock
 * flag share one key — same invariant as the JA deck. TTS is keyed off the
 * active language (deck `languageId`), so no per-card audio wiring is
 * needed. Returns null when the language has no atom catalog, letting deck
 * consumers keep their empty-state.
 */
export function buildEnrichedCourseDeck(
  languageId: string,
  unlockedIds: ReadonlySet<string> = getUnlockedAtomIds(),
): FlashcardDeck | null {
  if (languageId === "ja") return buildEnrichedJaCourseDeck(unlockedIds);
  const module = tryGetLanguageModule(languageId);
  if (!module) return null;
  const atoms = getNormalizedCourseAtoms(languageId).filter(
    (a) => a.srsEligible,
  );
  if (atoms.length === 0) return null;
  const cards: Flashcard[] = atoms.map((atom) => ({
    id: atom.id,
    front: atom.display,
    back: atom.gloss,
    type: "word",
    image: atom.emoji ? (notoEmojiUrl(atom.emoji) ?? undefined) : undefined,
    unlocked: unlockedIds.has(atom.id),
    parts: undefined,
  }));
  return {
    id: `${languageId}-course`,
    languageId,
    name: `${module.displayName.en} — full course`,
    cards,
    courseId: module.courseId,
    locale: "en",
  };
}

/** Test hook: drop the memoized indexes. */
export function __resetCourseDeckMine(): void {
  mineIndex = null;
  imagesByCardId = null;
}
