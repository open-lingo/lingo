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
import { ES_M13_PLACEMENT } from "./curriculum/m13";
import { ES_M14_PLACEMENT } from "./curriculum/m14";
import { ES_M15_PLACEMENT } from "./curriculum/m15";
import { ES_M16_PLACEMENT } from "./curriculum/m16";
import { ES_M17_PLACEMENT } from "./curriculum/m17";
import { ES_M18_PLACEMENT } from "./curriculum/m18";
import { ES_M19_PLACEMENT } from "./curriculum/m19";
import { ES_M20_PLACEMENT } from "./curriculum/m20";
import { ES_M21_PLACEMENT } from "./curriculum/m21";
import { ES_M22_PLACEMENT } from "./curriculum/m22";
import { ES_M23_PLACEMENT } from "./curriculum/m23";
import { ES_M24_PLACEMENT } from "./curriculum/m24";
import { ES_M25_PLACEMENT } from "./curriculum/m25";
import { ES_M26_PLACEMENT } from "./curriculum/m26";
import { ES_M27_PLACEMENT } from "./curriculum/m27";
import { ES_M28_PLACEMENT } from "./curriculum/m28";
import { ES_M29_PLACEMENT } from "./curriculum/m29";
import { ES_M30_PLACEMENT } from "./curriculum/m30";
import { ES_M31_PLACEMENT } from "./curriculum/m31";
import { ES_M32_PLACEMENT } from "./curriculum/m32";
import { ES_M33_PLACEMENT } from "./curriculum/m33";
import { ES_M34_PLACEMENT } from "./curriculum/m34";
import { ES_M35_PLACEMENT } from "./curriculum/m35";
import { ES_M36_PLACEMENT } from "./curriculum/m36";
import { ES_M37_PLACEMENT } from "./curriculum/m37";

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
  ["m13", ES_M13_PLACEMENT],
  ["m14", ES_M14_PLACEMENT],
  ["m15", ES_M15_PLACEMENT],
  ["m16", ES_M16_PLACEMENT],
  ["m17", ES_M17_PLACEMENT],
  ["m18", ES_M18_PLACEMENT],
  ["m19", ES_M19_PLACEMENT],
  ["m20", ES_M20_PLACEMENT],
  ["m21", ES_M21_PLACEMENT],
  ["m22", ES_M22_PLACEMENT],
  ["m23", ES_M23_PLACEMENT],
  ["m24", ES_M24_PLACEMENT],
  ["m25", ES_M25_PLACEMENT],
  ["m26", ES_M26_PLACEMENT],
  ["m27", ES_M27_PLACEMENT],
  ["m28", ES_M28_PLACEMENT],
  ["m29", ES_M29_PLACEMENT],
  ["m30", ES_M30_PLACEMENT],
  ["m31", ES_M31_PLACEMENT],
  ["m32", ES_M32_PLACEMENT],
  ["m33", ES_M33_PLACEMENT],
  ["m34", ES_M34_PLACEMENT],
  ["m35", ES_M35_PLACEMENT],
  ["m36", ES_M36_PLACEMENT],
  ["m37", ES_M37_PLACEMENT],
];

export const ES_PLACEMENT_BANK: PlacementBank = {
  screener: PER_MODULE.flatMap(([, placement]) => placement.screener),
  byModule: Object.fromEntries(
    PER_MODULE.map(([moduleId, placement]) => [moduleId, placement.byModule]),
  ),
};
