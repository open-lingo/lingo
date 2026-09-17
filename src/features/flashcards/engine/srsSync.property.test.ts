/**
 * Property tests for `mergeStates` (2026-09-17 project review, lane A5a —
 * `docs/preflight-2026-09-17.md` task 5c).
 *
 * `srsSync.test.ts` pins specific scenarios. This file asserts the two
 * invariants the module's own doc comment claims:
 *
 *   "Server wins for cards where server's most-recent review across
 *    modalities beats local's. Local wins otherwise... Local reset is
 *    never overwritten by server 'learned' state."
 *
 * i.e. (1) the LWW winner is decided purely by comparing `lastReviewedAt` —
 * it does not matter which side of the merge call a card started on
 * ("commutative" in that sense, NOT that `mergeStates(a,b) === mergeStates(b,a)`
 * as objects: the argument order is never symmetric because only the
 * winner gets `lastSyncedAt` stamped) — and (2) a genuine local reset
 * always survives a merge against a "learned" server card, regardless of
 * timestamps.
 *
 * `src/features/flashcards/engine/*.ts` (non-test) is lane A8's file — this
 * file only imports it, never edits it.
 */
import { fc, test } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";

import { isLearnedState, isResetState, mergeStates } from "./srsSync";
import type { SRSStore } from "./srsStorage";
import type { SRSCardState, SRSModalityState } from "../data/types";

const NOW = "2026-09-17T00:00:00.000Z";
const CARD_ID = "ja-m3-atom-1";

function sub(overrides: Partial<SRSModalityState> = {}): SRSModalityState {
  return {
    stability: 0,
    difficulty: 0,
    state: "new",
    interval: 0,
    dueDate: "2026-06-01",
    lastReviewDate: "2026-06-01",
    reps: 0,
    lapses: 0,
    ...overrides,
  };
}

const arbModalityState = fc.record({
  stability: fc.double({ min: 0, max: 50, noNaN: true }),
  difficulty: fc.double({ min: 1, max: 10, noNaN: true }),
  state: fc.constantFrom<SRSModalityState["state"]>("new", "learning", "review", "relearning"),
  interval: fc.nat({ max: 365 }),
  dueDate: fc.constant("2026-09-01"),
  lastReviewDate: fc.constant("2026-08-01"),
  reps: fc.nat({ max: 10 }),
  lapses: fc.nat({ max: 5 }),
});

/** Strips the one field a merge legitimately stamps on the winner, so two
 *  merge results can be compared for "same card content". */
function withoutSyncStamp(card: SRSCardState | undefined): Omit<SRSCardState, "lastSyncedAt"> | undefined {
  if (!card) return card;
  const { lastSyncedAt: _drop, ...rest } = card;
  return rest;
}

describe("mergeStates — properties", () => {
  const timestamps = fc
    .tuple(fc.integer({ min: 0, max: 2_000_000_000 }), fc.integer({ min: 1, max: 2_000_000_000 }))
    .map(([base, delta]) => ({
      earlier: new Date(base).toISOString(),
      later: new Date(base + delta).toISOString(), // strictly later — delta >= 1
    }));

  test.prop([timestamps, arbModalityState, arbModalityState, arbModalityState, arbModalityState])(
    "the winner (by lastReviewedAt) is the same card regardless of which side is local vs server",
    ({ earlier, later }, recA, prodA, recB, prodB) => {
      const cardEarlier: SRSCardState = { recognition: recA, production: prodA, lastReviewedAt: earlier };
      const cardLater: SRSCardState = { recognition: recB, production: prodB, lastReviewedAt: later };

      // Exclude the reset-exception — that is a SEPARATE, deliberately
      // non-commutative rule, covered by its own property below.
      fc.pre(!(isResetState(cardEarlier) && isLearnedState(cardLater)));
      fc.pre(!(isResetState(cardLater) && isLearnedState(cardEarlier)));

      const mergeA: SRSStore = mergeStates({ [CARD_ID]: cardEarlier }, { [CARD_ID]: cardLater }, NOW);
      const mergeB: SRSStore = mergeStates({ [CARD_ID]: cardLater }, { [CARD_ID]: cardEarlier }, NOW);

      // In both calls the LATER card must win: mergeA has it as `server`
      // (serverIsNewer), mergeB has it as `local` (server is NOT newer, so
      // the local — the later card — is left in place).
      expect(withoutSyncStamp(mergeA[CARD_ID])).toEqual(withoutSyncStamp(cardLater));
      expect(withoutSyncStamp(mergeB[CARD_ID])).toEqual(withoutSyncStamp(cardLater));
    },
  );

  test.prop([
    arbModalityState,
    arbModalityState,
    fc.integer({ min: 0, max: 2_000_000_000 }),
    fc.integer({ min: 0, max: 2_000_000_000 }),
  ])(
    "always keeps a local reset — a reset card never loses to a learned server card, at any timestamps",
    (recB, prodB, resetMs, learnedMs) => {
      const resetCard: SRSCardState = {
        recognition: sub(),
        production: sub(),
        lastReviewedAt: new Date(resetMs).toISOString(),
        manualResetAt: new Date(resetMs).toISOString(),
      };
      // Force the "server" card to be genuinely learned, whatever
      // fast-check drew for recB/prodB: bump reps on recognition so
      // isLearnedState holds regardless of what production landed on.
      const learnedCard: SRSCardState = {
        recognition: { ...recB, reps: Math.max(recB.reps, 1) },
        production: prodB,
        lastReviewedAt: new Date(learnedMs).toISOString(),
      };
      expect(isResetState(resetCard)).toBe(true);
      expect(isLearnedState(learnedCard)).toBe(true);

      const merged = mergeStates({ [CARD_ID]: resetCard }, { [CARD_ID]: learnedCard }, NOW);

      // Not just "content preserved" — literally untouched, no lastSyncedAt
      // stamp either (the `keepLocalReset` branch skips the assignment
      // entirely; `merged` starts as `{...local}`).
      expect(merged[CARD_ID]).toEqual(resetCard);
    },
  );
});

// ---------------------------------------------------------------------------
// Shrunk counterexample — proves the reset-preservation property above is
// not vacuous.
//
// Method: rather than editing `srsSync.ts` (owned by lane A8 — off-limits
// even temporarily; see this file's header), the merge rule was reproduced
// in a small BROKEN standalone copy, local to this investigation only, with
// the `keepLocalReset` guard removed (plain last-write-wins, no reset
// exception — the behaviour this repo moved away from):
//
//   function brokenMerge(local, server, now) {
//     const merged = { ...local };
//     for (const [id, s] of Object.entries(server)) {
//       const l = merged[id];
//       if (!l || (s.lastReviewedAt ?? "") > (l.lastReviewedAt ?? "")) {
//         merged[id] = { ...s, lastSyncedAt: now };
//       }
//     }
//     return merged;
//   }
//
// Running the reset-preservation property above (copied verbatim, only
// `mergeStates` swapped for `brokenMerge`) in a throwaway file, never
// committed, fast-check failed after 2 generated cases and shrank (42
// shrink steps) to `resetMs=0, learnedMs=1` — a reset at the Unix epoch and
// a learned server review exactly 1ms later — with `recB`/`prodB` shrunk to
// the all-zero modality state. That is exactly the ordinary "device reset,
// another device's learned progress syncs in later" scenario a real reset
// has to survive. `brokenMerge` let the server's later, learned state
// overwrite the reset; the case below pins a concrete, readable instance of
// that shape against the REAL `mergeStates`, which must keep the reset.
// ---------------------------------------------------------------------------
it("regression: a local reset survives even when the server's learned review is strictly later (shrunk counterexample shape)", () => {
  const resetCard: SRSCardState = {
    recognition: sub(),
    production: sub(),
    lastReviewedAt: "2026-01-01T00:00:00.000Z",
    manualResetAt: "2026-01-01T00:00:00.000Z",
  };
  const learnedCard: SRSCardState = {
    recognition: sub({ state: "review", reps: 5, stability: 10 }),
    production: sub({ state: "review", reps: 5, stability: 10 }),
    lastReviewedAt: "2026-06-01T00:00:00.000Z", // strictly LATER than the reset
  };
  const merged = mergeStates({ [CARD_ID]: resetCard }, { [CARD_ID]: learnedCard }, NOW);
  expect(merged[CARD_ID]).toEqual(resetCard);
});
