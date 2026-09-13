import type { PlacementItem } from "@/shared/language/types";
import type { LessonStep } from "@/features/lesson/types";
import { collectFrPlacement } from "../placementBank";

import { FR_M1_PLACEMENT } from "./m1";
import { FR_M2_PLACEMENT } from "./m2";
import { FR_M3_PLACEMENT } from "./m3";
import { FR_M4_PLACEMENT } from "./m4";
import { FR_M5_PLACEMENT } from "./m5";
import { FR_M6_PLACEMENT } from "./m6";
import { FR_M7_PLACEMENT } from "./m7";
import { FR_M8_PLACEMENT } from "./m8";
import { FR_M9_PLACEMENT } from "./m9";
import { FR_M10_PLACEMENT } from "./m10";
import { FR_M11_PLACEMENT } from "./m11";
import { FR_M12_PLACEMENT } from "./m12";
import { FR_M13_PLACEMENT } from "./m13";
import { FR_M14_PLACEMENT } from "./m14";
import { FR_M15_PLACEMENT } from "./m15";
import { FR_M16_PLACEMENT } from "./m16";
import { FR_M17_PLACEMENT } from "./m17";
import { FR_M18_PLACEMENT } from "./m18";
import { FR_M19_PLACEMENT } from "./m19";
import { FR_M20_PLACEMENT } from "./m20";
import { FR_M21_PLACEMENT } from "./m21";
import { FR_M22_PLACEMENT } from "./m22";
import { FR_M23_PLACEMENT } from "./m23";
import { FR_M24_PLACEMENT } from "./m24";
import { FR_M25_PLACEMENT } from "./m25";
import { FR_M26_PLACEMENT } from "./m26";

/** JSON-safe projection of a `PlacementItem` — see the ES aggregator's
 *  header for why `build` (a closure) can't ship as-is. */
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
 * `placementBank.ts` directly (derived at import time from an eager
 * `import.meta.glob` over `curriculum/m*.ts`). Eager/Node only (the emitter
 * and `placement.generated.test.ts`).
 *
 * Reuses `collectFrPlacement` — the exact same derivation
 * `placementBank.ts` used to run live (first item per module doubles as
 * its screener item; THROWS on the ES-shaped `{screener, byModule}` export
 * or a file/export-number mismatch) — against a synthetic "glob" record
 * built from static imports, so a real defective curriculum file still
 * fails loudly here instead of at some other, more confusing site.
 */
export function buildFrPlacementAggregate(): PlacementAggregateJson {
  const modules: Record<string, Record<string, unknown>> = {
    "./curriculum/m1.ts": { FR_M1_PLACEMENT },
    "./curriculum/m2.ts": { FR_M2_PLACEMENT },
    "./curriculum/m3.ts": { FR_M3_PLACEMENT },
    "./curriculum/m4.ts": { FR_M4_PLACEMENT },
    "./curriculum/m5.ts": { FR_M5_PLACEMENT },
    "./curriculum/m6.ts": { FR_M6_PLACEMENT },
    "./curriculum/m7.ts": { FR_M7_PLACEMENT },
    "./curriculum/m8.ts": { FR_M8_PLACEMENT },
    "./curriculum/m9.ts": { FR_M9_PLACEMENT },
    "./curriculum/m10.ts": { FR_M10_PLACEMENT },
    "./curriculum/m11.ts": { FR_M11_PLACEMENT },
    "./curriculum/m12.ts": { FR_M12_PLACEMENT },
    "./curriculum/m13.ts": { FR_M13_PLACEMENT },
    "./curriculum/m14.ts": { FR_M14_PLACEMENT },
    "./curriculum/m15.ts": { FR_M15_PLACEMENT },
    "./curriculum/m16.ts": { FR_M16_PLACEMENT },
    "./curriculum/m17.ts": { FR_M17_PLACEMENT },
    "./curriculum/m18.ts": { FR_M18_PLACEMENT },
    "./curriculum/m19.ts": { FR_M19_PLACEMENT },
    "./curriculum/m20.ts": { FR_M20_PLACEMENT },
    "./curriculum/m21.ts": { FR_M21_PLACEMENT },
    "./curriculum/m22.ts": { FR_M22_PLACEMENT },
    "./curriculum/m23.ts": { FR_M23_PLACEMENT },
    "./curriculum/m24.ts": { FR_M24_PLACEMENT },
    "./curriculum/m25.ts": { FR_M25_PLACEMENT },
    "./curriculum/m26.ts": { FR_M26_PLACEMENT },
  };
  const { screener, byModule } = collectFrPlacement(modules);
  const byModuleJson: Record<string, PlacementItemJson[]> = {};
  for (const [moduleId, items] of Object.entries(byModule)) {
    byModuleJson[moduleId] = items.map(materialize);
  }
  return { screener: screener.map(materialize), byModule: byModuleJson };
}
