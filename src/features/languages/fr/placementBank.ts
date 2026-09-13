/**
 * French placement-test bank — Stage 1 screener + Stage 2 per-module pool.
 *
 * Like ES, placement items live WITH their module (`FR_M{n}_PLACEMENT` in
 * `curriculum/m{n}.ts`). NOTE the export SHAPE differs from ES: each
 * `FR_M{n}_PLACEMENT` is a FLAT `PlacementItem[]` (the first item doubles as
 * the module's screener item); the {screener, byModule} split is derived by
 * `collectFrPlacement` below. An ES-shaped object export THROWS — it used to
 * be silently skipped, dropping the module's items.
 *
 * Content-as-data (2026-09-13): `FR_PLACEMENT_BANK` itself no longer derives
 * from a live `import.meta.glob` over `curriculum/m*.ts` (same bundle-cost
 * and glob-order-race reasons as `courseAtoms.ts` — see its header and
 * docs/content-as-data-2026-09-13.md). It reads the committed
 * `curriculum/placement.generated.json`, written by `npm run content:emit`
 * from `curriculum/placementAggregate.eager.ts`, which runs
 * `collectFrPlacement` (still exported here, still the tested contract —
 * `frCurriculum.test.ts`'s guard tests inject fake records against it
 * directly) over a static import list instead of the live glob. Each
 * `PlacementItem.build` (a closure — not JSON-safe) is materialized once at
 * emit time into a plain `step` field and rewrapped in a trivial `() => step`
 * closure here, so the shape at every call site is unchanged.
 *
 * Empty until the first French module is authored. That is the honest state,
 * not a stub to be replaced: `screener: []` means the placement test finds no
 * evidence and places the learner at the start, which is correct when no
 * module exists.
 */
import type { PlacementBank, PlacementItem, ModuleId } from "@/shared/language/types";
import type { LessonStep } from "@/features/lesson/types";
import placementJson from "./curriculum/placement.generated.json";

const MODULE_NO = /\/m(\d+)\.ts$/;
const PLACEMENT_EXPORT = /^FR_M(\d+)_PLACEMENT$/;

/**
 * Pure collector, run by `placementAggregate.eager.ts` at emit time (over a
 * static import list, not a live glob) and exported so its guards can also
 * be negative-control tested directly (`frCurriculum.test.ts`) with an
 * injected fake record.
 */
export function collectFrPlacement(
  modules: Record<string, Record<string, unknown>>,
): { screener: PlacementItem[]; byModule: Record<ModuleId, PlacementItem[]> } {
  const found: { n: number; items: PlacementItem[] }[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const fileNo = MODULE_NO.exec(path);
    if (!fileNo) continue;
    for (const [exportName, value] of Object.entries(mod)) {
      const m = PLACEMENT_EXPORT.exec(exportName);
      if (!m) continue;
      if (!Array.isArray(value)) {
        // ES exports a {screener, byModule} OBJECT from each module file. An
        // author copying that convention here used to have every one of their
        // placement items SILENTLY dropped by this very loop — the exact
        // silent-omission class this file's header promises to prevent. The
        // export NAME matched the pattern, so the intent is unambiguous:
        // refuse the shape rather than skip it.
        throw new Error(
          `fr/placementBank: ${path} exports ${exportName} with a non-array ` +
            `value. FR placement exports are a flat PlacementItem[] — this ` +
            `bank derives {screener, byModule} itself (a module's FIRST item ` +
            `is its screener item). Do not export the ES-style ` +
            `{screener, byModule} object.`,
        );
      }
      if (m[1] !== fileNo[1]) {
        throw new Error(
          `fr/placementBank: ${path} exports ${exportName} — the module number ` +
            `must match the file name.`,
        );
      }
      found.push({ n: Number(fileNo[1]), items: value as PlacementItem[] });
    }
  }
  found.sort((a, b) => a.n - b.n);

  const byModule: Record<ModuleId, PlacementItem[]> = {};
  const screener: PlacementItem[] = [];
  for (const { n, items } of found) {
    byModule[`m${n}`] = items;
    // Stage 1 takes one item per module, easy → hard in module order. The
    // convention (ES spine) is that the module's FIRST placement item is its
    // screener item.
    if (items.length) screener.push(items[0]);
  }
  return { screener, byModule };
}

type PlacementItemJson = { id: string; moduleId: string; step: LessonStep };
type PlacementAggregateJson = {
  screener: PlacementItemJson[];
  byModule: Record<string, PlacementItemJson[]>;
};

function hydrate(item: PlacementItemJson): PlacementItem {
  return { id: item.id, moduleId: item.moduleId, build: () => structuredClone(item.step) };
}

const generated = placementJson as PlacementAggregateJson;

// Hydrate `byModule` first and derive `screener` from it (module's first
// item) rather than hydrating `generated.screener` independently: the FR
// convention (unlike ES) is that a module's screener item IS its first
// byModule item — `collectFrPlacement` above builds both from the SAME
// array element — and `frCurriculum.test.ts` asserts that identity
// (`FR_PLACEMENT_BANK.screener` `toContain`s `byModule[m][0]` by
// reference). Hydrating both sides independently would produce two
// value-equal but distinct objects and break that check.
const hydratedByModule: Record<string, PlacementItem[]> = Object.fromEntries(
  Object.entries(generated.byModule).map(([moduleId, items]) => [moduleId, items.map(hydrate)]),
);

export const FR_PLACEMENT_BANK: PlacementBank = {
  screener: Object.values(hydratedByModule)
    .filter((items) => items.length > 0)
    .map((items) => items[0]),
  byModule: hydratedByModule,
};
