/**
 * French placement-test bank — Stage 1 screener + Stage 2 per-module pool.
 *
 * Like ES, placement items live WITH their module (`FR_M{n}_PLACEMENT` in
 * `curriculum/m{n}.ts`) and this file only aggregates. NOTE the export SHAPE
 * differs from ES: each `FR_M{n}_PLACEMENT` is a FLAT `PlacementItem[]` (the
 * first item doubles as the module's screener item); the {screener, byModule}
 * split is derived here. An ES-shaped object export THROWS at import time —
 * it used to be silently skipped, dropping the module's items. Unlike ES, the
 * aggregation is DERIVED by globbing the curriculum rather than by a
 * hand-maintained list of imports — see the header of `courseAtoms.ts` for why
 * (ES shipped m17 without adding it to its list, and the atoms went unscheduled
 * and unnoticed; a placement bank has exactly the same silent-omission shape).
 *
 * Empty until the first French module is authored. That is the honest state,
 * not a stub to be replaced: `screener: []` means the placement test finds no
 * evidence and places the learner at the start, which is correct when no
 * module exists.
 */
import type { PlacementBank, PlacementItem, ModuleId } from "@/shared/language/types";

// Negative pattern: never eagerly import the module TESTS sitting beside
// the modules (import-cycle back through mockLessons).
const CURRICULUM_MODULES = import.meta.glob<Record<string, unknown>>(
  ["./curriculum/m*.ts", "!./curriculum/m*.test.ts"],
  { eager: true },
);

const MODULE_NO = /\/m(\d+)\.ts$/;
const PLACEMENT_EXPORT = /^FR_M(\d+)_PLACEMENT$/;

/**
 * Pure collector behind `FR_PLACEMENT_BANK`, exported so its guards can be
 * negative-control tested: authoring a real defective curriculum file would
 * poison the live glob (and the atoms/pathway globs with it), so the tests
 * inject a fake record instead.
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

const { screener, byModule } = collectFrPlacement(CURRICULUM_MODULES);

export const FR_PLACEMENT_BANK: PlacementBank = { screener, byModule };
