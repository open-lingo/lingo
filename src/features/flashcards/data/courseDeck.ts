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
import { getUnlockedAtomIds } from "@/features/lesson/data/unlockLessonAtoms";
import {
  getMinedSentences,
  __resetMinedSentences,
} from "@/features/lesson/data/minedSentences";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { tryGetLanguageModule } from "@/shared/language/registry";
import { notoEmojiUrl } from "@/shared/assets/notoEmoji";
import {
  getFrequencyAtoms,
  getFrequencyUnlockedAtomIds,
  frequencyAtomToFlashcard,
} from "@/features/languages/frequencyResolver";

/**
 * Opt-in frequency ("optional") vocab knob threaded into the course deck.
 * `enabled` off (the default) makes the whole frequency path a no-op — the
 * deck is byte-for-byte what it was before the feature existed.
 */
export type FrequencyDeckOptions = {
  enabled: boolean;
  /** Learner's max-reached content module (from `useCourseLevel`). */
  reachedModule: number;
};

const FREQ_OFF: FrequencyDeckOptions = { enabled: false, reachedModule: 0 };

/* ── sentence mining ──
 * The miner itself now lives in `@/features/lesson/data/minedSentences`
 * (shared with the SRS review-lesson builder). Behavior is unchanged:
 * canonical card id → shortest authored sentence containing the word. */

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
  freq: FrequencyDeckOptions = FREQ_OFF,
): FlashcardDeck | null {
  // Module-gated frequency ids (empty when the feature is off). Unioned into
  // the unlocked set so a frequency word's card flips to unlocked — for JA that
  // card already exists (a `fromModule: "future"` atom); for KO the seed words
  // are appended below since they have no backing course atom.
  const freqUnlocked = getFrequencyUnlockedAtomIds(
    languageId,
    freq.reachedModule,
    freq.enabled,
  );
  const effectiveUnlocked =
    freqUnlocked.size === 0
      ? unlockedIds
      : new Set<string>([...unlockedIds, ...freqUnlocked]);

  const base = buildBaseCourseDeck(languageId, effectiveUnlocked);
  if (!base) return null;
  return applyFrequencyCards(base, languageId, freq.enabled, freqUnlocked);
}

/** The course deck before any frequency-vocab overlay (original behavior). */
function buildBaseCourseDeck(
  languageId: string,
  unlockedIds: ReadonlySet<string>,
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

/**
 * Overlay frequency-vocab onto a built deck: tag frequency cards `source:
 * "freq"` (so surfaces can label them "optional") and append any frequency atom
 * that has no backing course card (the KO seed). No-op when the feature is off,
 * so the deck is unchanged for every existing caller.
 */
function applyFrequencyCards(
  deck: FlashcardDeck,
  languageId: string,
  enabled: boolean,
  freqUnlockedIds: ReadonlySet<string>,
): FlashcardDeck {
  if (!enabled) return deck;
  const freqAtoms = getFrequencyAtoms(languageId);
  if (freqAtoms.length === 0) return deck;

  const freqIds = new Set(freqAtoms.map((a) => a.id));
  const existing = new Set(deck.cards.map((c) => c.id));

  const cards: Flashcard[] = deck.cards.map((c) =>
    freqIds.has(c.id) ? { ...c, source: "freq" as const } : c,
  );
  for (const atom of freqAtoms) {
    if (existing.has(atom.id)) continue;
    cards.push(
      frequencyAtomToFlashcard(atom, { unlocked: freqUnlockedIds.has(atom.id) }),
    );
  }
  return { ...deck, cards };
}

/** Test hook: drop the memoized indexes. */
export function __resetCourseDeckMine(): void {
  __resetMinedSentences();
  imagesByCardId = null;
}
