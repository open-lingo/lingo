/**
 * Spanish placement-test bank — Stage 1 screener + Stage 2 per-module pool.
 *
 * Per ADR-001's `PlacementBank` shape: `screener` is one item per authored
 * module (spine target: 16 items, ordered easy→hard = module order);
 * `byModule` is the m-keyed pool consulted during stage-2 narrowing
 * (spine target: 4 items per module).
 *
 * Unlike KO (items authored inline here), ES placement items live WITH
 * their module in `curriculum/m{n}.ts` (`ES_M{n}_PLACEMENT`) so parallel
 * authoring waves each own one file — this file only aggregates. Stub
 * modules contribute empty arrays until their wave lands.
 */
import type { PlacementBank, PlacementItem } from "@/shared/language/types";

import { ES_M1_PLACEMENT } from "./curriculum/m1";
import { ES_M2_PLACEMENT } from "./curriculum/m2";
import { ES_M3_PLACEMENT } from "./curriculum/m3";
import { ES_M4_PLACEMENT } from "./curriculum/m4";
import { ES_M5_PLACEMENT } from "./curriculum/m5";
import { ES_M6_PLACEMENT } from "./curriculum/m6";
import { ES_M7_PLACEMENT } from "./curriculum/m7";
import { ES_M8_PLACEMENT } from "./curriculum/m8";
import { ES_M9_PLACEMENT } from "./curriculum/m9";
import { ES_M10_PLACEMENT } from "./curriculum/m10";
import { ES_M11_PLACEMENT } from "./curriculum/m11";
import { ES_M12_PLACEMENT } from "./curriculum/m12";

type ModulePlacement = { screener: PlacementItem[]; byModule: PlacementItem[] };

/** Module order matters: the screener runs easy → hard. */
const PER_MODULE: ReadonlyArray<readonly [string, ModulePlacement]> = [
  ["m1", ES_M1_PLACEMENT],
  ["m2", ES_M2_PLACEMENT],
  ["m3", ES_M3_PLACEMENT],
  ["m4", ES_M4_PLACEMENT],
  ["m5", ES_M5_PLACEMENT],
  ["m6", ES_M6_PLACEMENT],
  ["m7", ES_M7_PLACEMENT],
  ["m8", ES_M8_PLACEMENT],
  ["m9", ES_M9_PLACEMENT],
  ["m10", ES_M10_PLACEMENT],
  ["m11", ES_M11_PLACEMENT],
  ["m12", ES_M12_PLACEMENT],
];

export const ES_PLACEMENT_BANK: PlacementBank = {
  screener: PER_MODULE.flatMap(([, placement]) => placement.screener),
  byModule: Object.fromEntries(
    PER_MODULE.map(([moduleId, placement]) => [moduleId, placement.byModule]),
  ),
};
