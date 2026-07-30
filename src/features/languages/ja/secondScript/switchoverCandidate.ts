import { JA_COURSE_ATOMS_BY_ID } from "../courseAtoms";
import { KANJI_ELIGIBLE_ATOMS } from "./applyKanjiSurfaces";
import { isKanjiLatched, switchoverMisses } from "./kanjiSwitchoverLatch";
import { MAX_SWITCHOVER_BEATS_PER_REVIEW } from "./kanjiRollout";
import { N5_KANJI } from "./n5Kanji";

/**
 * Picks the ONE word whose written form is ready to be introduced (B061).
 *
 * Called while a dynamic review lesson is being built. Returns null far more
 * often than not, which is the point: the beat is rare, and a review with no
 * eligible word is an ordinary review.
 *
 * ## The gate is a conjunction
 *
 * 1. **`learnerModule >= unlockModule`** — every component glyph has been taught.
 *    Without this floor 友達 could be introduced at m3 on a mature ともだち, before
 *    the learner has met 友 or 達 at all.
 * 2. **It is a real switchover** — the word was taught in kana BEFORE its kanji
 *    became eligible. The ~30 words taught at or after their unlock are born with
 *    kanji and have nothing to switch; giving them a beat would introduce a form
 *    the learner met on day one.
 * 3. **Not already latched** — introductions happen once.
 *
 * There is deliberately NO FSRS-readiness gate. An earlier version required a
 * 14-day interval; measurement killed it (see `RETIRED_KANJI_REVEAL_INTERVAL_DAYS`
 * for the numbers): 7 and 14 days are the same trigger because FSRS steps 5d→28d
 * straight over the range, and a learner who answers Hard never reaches any
 * threshold — so the shakiest learners would never be shown a kanji at all.
 *
 * The module IS the trigger. That makes the ladder predictable, which is what the
 * research pass found learners actually want (their complaint tracks
 * unpredictability, not difficulty), and it moves the "is this learner ready"
 * question to where it can actually be answered: the graded cloze. Get it right
 * and the switch sticks; get it wrong and the word stays kana for one more
 * introduction.
 *
 * ## Ordering
 *
 * Earliest `unlockModule` first, then atom id, so the backlog drains in the order
 * the course intended and the result is stable for a given learner.
 */

export type SwitchoverCandidate = {
  /** Bare course-atom id. */
  atomId: string;
  kana: string;
  kanji: string;
  gloss: string;
  /** Module the kanji became eligible in. */
  unlockModule: number;
  /** Per-character senses where an honest one exists, else null. */
  parts: { glyph: string; sense: string | null }[];
};

const HAN = /\p{Script=Han}/u;

/** Built once — the selector runs on every review build. */
let _byChar: Map<string, (typeof N5_KANJI)[number]> | null = null;
const KANJI_BY_CHAR = () =>
  (_byChar ??= new Map(N5_KANJI.map((e) => [e.character, e])));

function moduleIndexOf(fromModule: unknown): number {
  const n = Number(String(fromModule ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Is this atom a switchover — taught in kana before its kanji became eligible?
 * Exported because the RENDER gate needs the same answer: a born-with-kanji word
 * must keep rendering as kanji whether or not any beat ever fires for it.
 */
export function isSwitchoverAtom(atomId: string | undefined): boolean {
  if (!atomId) return false;
  const entry = KANJI_ELIGIBLE_ATOMS.get(bareId(atomId));
  if (!entry) return false;
  const atom = JA_COURSE_ATOMS_BY_ID.get(bareId(atomId));
  if (!atom) return false;
  return entry.unlockModule > moduleIndexOf(atom.fromModule);
}

/** `ja:tomodachi` → `tomodachi`. KANJI_ELIGIBLE_ATOMS is keyed bare. */
export function bareId(atomId: string): string {
  const i = atomId.indexOf(":");
  return i === -1 ? atomId : atomId.slice(i + 1);
}

export function pickSwitchoverCandidates(opts: {
  learnerModule: number;
  /** Atom ids the learner has unlocked, canonical or bare — both accepted. */
  unlockedAtomIds: ReadonlySet<string>;
  /** How many to return. Defaults to the per-review policy cap. */
  limit?: number;
}): SwitchoverCandidate[] {
  const { learnerModule, unlockedAtomIds } = opts;

  const unlockedBare = new Set(
    [...unlockedAtomIds].map((id) => bareId(id)),
  );

  const found: SwitchoverCandidate[] = [];

  for (const [atomId, entry] of KANJI_ELIGIBLE_ATOMS) {
    if (entry.unlockModule > learnerModule) continue;
    if (!unlockedBare.has(atomId)) continue;
    if (isKanjiLatched(atomId)) continue;
    if (!isSwitchoverAtom(atomId)) continue;

    const atom = JA_COURSE_ATOMS_BY_ID.get(atomId);
    if (!atom) continue;

    const candidate = {
      atomId,
      kana: atom.kana,
      kanji: entry.kanji,
      gloss: atom.meaningEn,
      unlockModule: entry.unlockModule,
      parts: componentParts(entry.kanji),
    };

    found.push(candidate);
  }

  // Earliest unlock first (drain in the order the course intended), then
  // best-known first, then atom id so the result is stable for a given store.
  // Words that were MISSED go first: the retry is the "one more time in reviews"
  // Spencer asked for, and it is worth little if it lands six modules later.
  found.sort(
    (a, b) =>
      switchoverMisses(b.atomId) - switchoverMisses(a.atomId) ||
      a.unlockModule - b.unlockModule ||
      a.atomId.localeCompare(b.atomId),
  );

  return found.slice(0, opts.limit ?? MAX_SWITCHOVER_BEATS_PER_REVIEW);
}

/**
 * Per-character senses, `null` where the course has no honest one.
 *
 * Sourced from `N5_KANJI` meanings via the eligible map's own glyph data rather
 * than authored per word, so there is nothing to keep in sync — and a glyph with
 * no catalog entry yields null instead of an invented gloss. 達 is the motivating
 * case: it is a pluralising suffix with no useful standalone sense, and forcing
 * one on it teaches folk etymology.
 */
function componentParts(kanji: string): { glyph: string; sense: string | null }[] {
  const byChar = KANJI_BY_CHAR();
  return [...kanji]
    .filter((c) => HAN.test(c))
    .map((glyph) => {
      const entry = byChar.get(glyph);
      const sense = entry?.meaning?.[0];
      return { glyph, sense: sense && sense.trim() ? sense : null };
    });
}

/** Module this atom's kanji became eligible in, or null if not eligible. */
export function switchoverUnlockModule(atomId: string | undefined): number | null {
  if (!atomId) return null;
  return KANJI_ELIGIBLE_ATOMS.get(bareId(atomId))?.unlockModule ?? null;
}
