/**
 * Spanish placement-test bank — Stage 1 screener + Stage 2 per-module pool.
 *
 * Per ADR-001's `PlacementBank` shape: `screener` is one item per authored
 * module (spine target: 16 items, ordered easy→hard = module order);
 * `byModule` is the m-keyed pool consulted during stage-2 narrowing
 * (spine target: 4 items per module).
 *
 * Unlike KO (items authored inline here), ES placement items live WITH
 * their module in `curriculum/m{n}.ts` (`ES_M{n}_PLACEMENT`). Content-as-data
 * (2026-09-13): this file no longer imports those modules directly (each
 * named `ES_M{n}_PLACEMENT` import pulled its module's WHOLE file — lesson
 * factories included — into the main bundle for every user; see
 * docs/content-as-data-2026-09-13.md). It reads the committed
 * `curriculum/placement.generated.json`, written by `npm run content:emit`
 * from `curriculum/placementAggregate.eager.ts` (the same 38-module
 * aggregation that used to live here). Each `PlacementItem.build` (a
 * closure — not JSON-safe) is materialized once at emit time into a plain
 * `step` field and rewrapped in a trivial `() => step` closure below, so the
 * shape at every call site is unchanged. `placement.generated.test.ts` is
 * the stale guard.
 */
import type { PlacementBank, PlacementItem } from "@/shared/language/types";
import type { LessonStep } from "@/features/lesson/types";
import placementJson from "./curriculum/placement.generated.json";

type PlacementItemJson = { id: string; moduleId: string; step: LessonStep };
type PlacementAggregateJson = {
  screener: PlacementItemJson[];
  byModule: Record<string, PlacementItemJson[]>;
};

function hydrate(item: PlacementItemJson): PlacementItem {
  return { id: item.id, moduleId: item.moduleId, build: () => structuredClone(item.step) };
}

const generated = placementJson as PlacementAggregateJson;

export const ES_PLACEMENT_BANK: PlacementBank = {
  screener: generated.screener.map(hydrate),
  byModule: Object.fromEntries(
    Object.entries(generated.byModule).map(([moduleId, items]) => [moduleId, items.map(hydrate)]),
  ),
};
