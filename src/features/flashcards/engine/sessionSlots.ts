import type { Flashcard, SRSCardState, SRSModality, SRSRating } from "../data/types";
import { getDueModalities, createInitialState, shouldRepeatInSession } from "./srs";
import { getSRSStore, canonicalize } from "./srsStorage";

/**
 * One unit of work in a reviewer session: a card tested in ONE direction.
 *
 * The reviewer grades a single modality per answer (`reviewCard(state,
 * modality, rating)`), but the queue it consumes is card-level — one entry per
 * card no matter how many directions are due. A card due for BOTH recognition
 * and production therefore got a single slot: the learner graded recognition,
 * the card was consumed, and the still-due production half silently fell out of
 * the session. "Review Complete!" showed while work remained, and re-entering
 * the reviewer surfaced the same words again as production.
 *
 * Slots make the session's real length explicit: expand each card into the
 * directions that are actually due.
 */
export type SessionSlot = {
  card: Flashcard;
  modality: SRSModality;
};

/**
 * Expand a card-level queue into per-modality session slots.
 *
 * - Due in both directions → two slots. The first (recognition — receptive
 *   before productive) stays in place; the second is DEFERRED behind every
 *   other card's first pass, so the learner never grades the same word twice
 *   back-to-back (the second exposure would be a freebie — same reasoning as
 *   `dedupeSiblings` in `reviewQueue`).
 * - Due in one direction → that one slot.
 * - Due in neither (never-studied cards, and the not-yet-due cards a free
 *   review surfaces) → a single recognition slot. Recognition is also the
 *   correct first exposure for a brand-new word.
 */
export function buildSessionSlots(
  cards: Flashcard[],
  store: Record<string, SRSCardState> = getSRSStore(),
): SessionSlot[] {
  const first: SessionSlot[] = [];
  const deferred: SessionSlot[] = [];
  // A card reaching us twice (merged decks) must not be scheduled twice —
  // that would drill the same direction of the same word in one session.
  const seen = new Set<string>();

  const push = (into: SessionSlot[], card: Flashcard, modality: SRSModality) => {
    const key = `${canonicalize(card.id)}:${modality}`;
    if (seen.has(key)) return;
    seen.add(key);
    into.push({ card, modality });
  };

  for (const card of cards) {
    const state = store[canonicalize(card.id)] ?? createInitialState();
    // `getDueModalities` returns recognition before production, so index 0 is
    // the receptive direction whenever both are due.
    const due = getDueModalities(state);
    if (due.length === 0) {
      push(first, card, "recognition");
      continue;
    }
    push(first, card, due[0]);
    for (const modality of due.slice(1)) push(deferred, card, modality);
  }

  return [...first, ...deferred];
}

/** Why a graded slot is coming back before the session ends. */
export type RequeueReason = "again" | "learning";

/**
 * Should the slot just graded be re-shown later in THIS session?
 *
 * Two independent triggers:
 *
 * - `"again"` — Again/Hard, the long-standing "needs reinforcement now" rule
 *   (`shouldRepeatInSession`).
 * - `"learning"` — FSRS put the graded direction on a same-day LEARNING STEP
 *   (the default steps are 1m / 10m), so it is still due today. Only Again/Hard
 *   were requeued, so a brand-new word graded Good was consumed by the session
 *   while its 10-minute step left it due — the reviewer then declared "Review
 *   Complete!" and the word was waiting again on the next visit. Anything the
 *   scheduler still wants today belongs in today's session.
 *
 * Takes the POST-grade state: whether a card stays due is the scheduler's
 * answer, not something the rating alone determines (Good graduates a review
 * card but not a card on its first learning step).
 */
export function requeueReason(
  next: SRSCardState,
  modality: SRSModality,
  rating: SRSRating,
): RequeueReason | null {
  if (shouldRepeatInSession(rating)) return "again";
  if (getDueModalities(next).includes(modality)) return "learning";
  return null;
}
