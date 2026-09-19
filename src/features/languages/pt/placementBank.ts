/**
 * Portuguese placement-test bank — scaffold, gracefully empty.
 *
 * Per ADR-001's `PlacementBank` shape: `screener` is one item per authored
 * module (today: zero, since m1 is an empty stub — docs/pt-course-design-
 * 2026-09-18.md §5); `byModule` is the m-keyed stage-2 pool. Both empty
 * arrays/objects, not a throw or a special "unavailable" sentinel — every
 * consumer (`getItemsForModule`, `moduleHasBank`, `canTestOut`,
 * `PLACEMENT_BANK_BY_LANGUAGE` in `src/features/placement/questionBank.ts`)
 * already treats "no items for this module" as the normal empty case, so
 * PT reads as "nothing to test out of yet" everywhere for free.
 *
 * Once m1+ ship, mirror `es/placementBank.ts`'s pattern: placement items
 * authored per-module (via the IR compiler's `ir.placement` block) and
 * aggregated here — see that file's header for the content-as-data
 * rationale once PT's module count makes it worth it.
 */
import type { PlacementBank } from "@/shared/language/types";

export const PT_PLACEMENT_BANK: PlacementBank = {
  screener: [],
  byModule: {},
};
