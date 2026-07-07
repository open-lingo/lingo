/**
 * External-study import — FSRS seeding + apply (anki-import-spec-2026-07-07
 * §seed.ts).
 *
 * Evidence, not authority (§Design principles):
 *   - Recognition is seeded richly from the Anki evidence; production enters
 *     as a NEW card (metered by the normal new-intake cap) due at the same
 *     time as recognition.
 *   - No-clobber: any card with real progress (`reps > 0` on either modality)
 *     is left untouched and counted as `skippedExisting` — imports never beat
 *     genuine Lingo review history.
 *   - Long-overdue cards become due TODAY (metered by the existing review
 *     queue), never rescheduled into the future.
 *
 * Writes go through `setCardState` — the same per-card setter lesson reviews
 * use — so Track A backend sync + quota-safe localStorage writes apply.
 * Unlocking (opt-in) goes through the REAL `unlockAtomIds` server-push path
 * (a genuine account change, unlike dev simulation). NB: unlocking matched
 * atoms advances the grammar-deck reached-modules for migrators — intended;
 * grammar intake stays capped/day with backlog transparency (grammar-deck
 * v1.1/v1.2).
 */
import type { SRSCardState, SRSModalityState } from "../data/types";
import {
  addDays,
  defaultInitialDifficulty,
  getToday,
} from "../engine/srs";
import { getCardState, setCardState } from "../engine/srsStorage";
import { unlockAtomIds } from "@/features/lesson/data/unlockLessonAtoms";
import type { KnownItem } from "./types";
import type { ImportReport } from "./types";
import type { ImportMatch } from "./match";

/** Clamp helper (inclusive). */
function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Fresh, fully-zeroed NEW sub-state due on `dueDate`. */
function newSubState(today: string, dueDate: string): SRSModalityState {
  return {
    stability: 0,
    difficulty: 0,
    state: "new",
    interval: 0,
    dueDate,
    lastReviewDate: today,
    reps: 0,
    lapses: 0,
  };
}

/**
 * Map one item's evidence to a seeded card state. `today` (YYYY-MM-DD) is
 * injected for deterministic scheduling/testing.
 *
 * Recognition: review-state, stability = clamp(intervalDays, 1, 365),
 * difficulty = FSRS D0 (derived), reps/lapses carried, due today if overdue.
 * Production: NEW, due at the same time as recognition.
 * `suspended-reviewed` evidence halves the interval first (weaker signal).
 */
export function evidenceToSeedState(item: KnownItem, today: string): SRSCardState {
  const ev = item.evidence;
  let intervalDays = Number.isFinite(ev.intervalDays) ? Math.max(0, Math.trunc(ev.intervalDays)) : 0;
  if (ev.class === "suspended-reviewed") {
    intervalDays = Math.floor(intervalDays / 2);
  }

  const lastReviewDate = (ev.lastReviewAt ?? today).slice(0, 10);
  // Overdue cards clamp to today; not-yet-due cards keep their future date.
  const scheduledDue = addDays(lastReviewDate, intervalDays);
  const dueDate = scheduledDue > today ? scheduledDue : today;

  const recognition: SRSModalityState = {
    stability: clamp(intervalDays, 1, 365),
    difficulty: defaultInitialDifficulty(),
    state: "review",
    interval: intervalDays,
    dueDate,
    lastReviewDate,
    reps: Math.max(0, Math.trunc(ev.reps)),
    lapses: Math.max(0, Math.trunc(ev.lapses)),
  };

  // Production track enters new, due alongside recognition.
  const production = newSubState(today, dueDate);

  return { recognition, production };
}

function hasRealProgress(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  return state.recognition.reps > 0 || state.production.reps > 0;
}

/**
 * Apply matched imports: seed each matched card's FSRS state (no-clobber) and,
 * when `opts.unlockAtoms`, unlock the matched atoms via the real server-push
 * path. `opts.unmatched` is threaded straight into the returned report so the
 * report screen is self-contained; `opts.today` overrides the clock for tests.
 */
export function applyImport(
  matches: ImportMatch[],
  opts: { unlockAtoms: boolean; unmatched?: KnownItem[]; today?: string },
): ImportReport {
  const today = opts.today ?? getToday();

  const matchedItems = new Set<KnownItem>();
  let multiCredit = 0;
  {
    // Count distinct items + items crediting >1 atom (matches carry one row
    // per credited atom).
    const perItem = new Map<KnownItem, number>();
    for (const m of matches) perItem.set(m.item, (perItem.get(m.item) ?? 0) + 1);
    for (const [item, n] of perItem) {
      matchedItems.add(item);
      if (n > 1) multiCredit++;
    }
  }

  const matchedCardIds = new Set<string>();
  const seen = new Set<string>();
  let seededCards = 0;
  let skippedExisting = 0;

  for (const match of matches) {
    const { cardId } = match;
    matchedCardIds.add(cardId);
    if (seen.has(cardId)) continue; // dedup within this import run
    seen.add(cardId);

    if (hasRealProgress(getCardState(cardId))) {
      skippedExisting++;
      continue;
    }
    setCardState(cardId, evidenceToSeedState(match.item, today));
    seededCards++;
  }

  let unlockedAtoms = 0;
  if (opts.unlockAtoms && matchedCardIds.size > 0) {
    // Unlock ALL matched atoms (including no-clobber-skipped ones — those are
    // already progressed, so the union is a no-op there). Returns the count
    // newly added to the unlock store.
    unlockedAtoms = unlockAtomIds([...matchedCardIds]);
  }

  return {
    matchedItems: matchedItems.size,
    seededCards,
    skippedExisting,
    unlockedAtoms,
    unmatched: opts.unmatched ?? [],
    multiMatches: multiCredit,
  };
}
