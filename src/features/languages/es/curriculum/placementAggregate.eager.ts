import type { PlacementItem } from "@/shared/language/types";
import type { LessonStep } from "@/features/lesson/types";

import { ES_M1_PLACEMENT } from "./m1";
import { ES_M2_PLACEMENT } from "./m2";
import { ES_M3_PLACEMENT } from "./m3";
import { ES_M4_PLACEMENT } from "./m4";
import { ES_M5_PLACEMENT } from "./m5";
import { ES_M6_PLACEMENT } from "./m6";
import { ES_M7_PLACEMENT } from "./m7";
import { ES_M8_PLACEMENT } from "./m8";
import { ES_M9_PLACEMENT } from "./m9";
import { ES_M10_PLACEMENT } from "./m10";
import { ES_M11_PLACEMENT } from "./m11";
import { ES_M12_PLACEMENT } from "./m12";
import { ES_M13_PLACEMENT } from "./m13";
import { ES_M14_PLACEMENT } from "./m14";
import { ES_M15_PLACEMENT } from "./m15";
import { ES_M16_PLACEMENT } from "./m16";
import { ES_M17_PLACEMENT } from "./m17";
import { ES_M18_PLACEMENT } from "./m18";
import { ES_M19_PLACEMENT } from "./m19";
import { ES_M20_PLACEMENT } from "./m20";
import { ES_M21_PLACEMENT } from "./m21";
import { ES_M22_PLACEMENT } from "./m22";
import { ES_M23_PLACEMENT } from "./m23";
import { ES_M24_PLACEMENT } from "./m24";
import { ES_M25_PLACEMENT } from "./m25";
import { ES_M26_PLACEMENT } from "./m26";
import { ES_M27_PLACEMENT } from "./m27";
import { ES_M28_PLACEMENT } from "./m28";
import { ES_M29_PLACEMENT } from "./m29";
import { ES_M30_PLACEMENT } from "./m30";
import { ES_M31_PLACEMENT } from "./m31";
import { ES_M32_PLACEMENT } from "./m32";
import { ES_M33_PLACEMENT } from "./m33";
import { ES_M34_PLACEMENT } from "./m34";
import { ES_M35_PLACEMENT } from "./m35";
import { ES_M36_PLACEMENT } from "./m36";
import { ES_M37_PLACEMENT } from "./m37";
import { ES_M38_PLACEMENT } from "./m38";

type ModulePlacement = { screener: PlacementItem[]; byModule: PlacementItem[] };

/** Module order matters: the screener runs easy → hard. Mirrors the list
 *  that used to live in `placementBank.ts` directly. */
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
  ["m38", ES_M38_PLACEMENT],
];

/** JSON-safe projection of a `PlacementItem`: `build` is a closure (not
 *  serializable), so the emitter calls it once here and ships the
 *  materialized `LessonStep` instead. The consumer (`placementBank.ts`)
 *  rewraps `step` in a trivial `() => step` closure so `PlacementBank`'s
 *  shape at the call site is unchanged. */
export type PlacementItemJson = { id: string; moduleId: string; step: LessonStep };
export type PlacementAggregateJson = {
  screener: PlacementItemJson[];
  byModule: Record<string, PlacementItemJson[]>;
};

function materialize(item: PlacementItem): PlacementItemJson {
  return { id: item.id, moduleId: item.moduleId, step: item.build() };
}

/**
 * The Stage-1 screener + Stage-2 per-module pool that used to live in
 * `placementBank.ts` directly (`ES_PLACEMENT_BANK`). Eager/Node only (the
 * emitter and `placement.generated.test.ts`) — importing the modules
 * evaluates every lesson factory, which is exactly what the app must not do
 * (same reasoning as `atomsAggregate.eager.ts`).
 */
export function buildEsPlacementAggregate(): PlacementAggregateJson {
  const byModule: Record<string, PlacementItemJson[]> = {};
  for (const [moduleId, placement] of PER_MODULE) {
    byModule[moduleId] = placement.byModule.map(materialize);
  }
  return {
    screener: PER_MODULE.flatMap(([, placement]) => placement.screener).map(materialize),
    byModule,
  };
}
