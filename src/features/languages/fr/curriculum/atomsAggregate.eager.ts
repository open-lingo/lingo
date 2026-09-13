import type { FrAtom } from "../courseAtoms";
import { FR_M1_ATOMS } from "./m1";
import { FR_M2_ATOMS } from "./m2";
import { FR_M3_ATOMS } from "./m3";
import { FR_M4_ATOMS } from "./m4";
import { FR_M5_ATOMS } from "./m5";
import { FR_M6_ATOMS } from "./m6";
import { FR_M7_ATOMS } from "./m7";
import { FR_M8_ATOMS } from "./m8";
import { FR_M9_ATOMS } from "./m9";
import { FR_M10_ATOMS } from "./m10";
import { FR_M11_ATOMS } from "./m11";
import { FR_M12_ATOMS } from "./m12";
import { FR_M13_ATOMS } from "./m13";
import { FR_M14_ATOMS } from "./m14";
import { FR_M15_ATOMS } from "./m15";
import { FR_M16_ATOMS } from "./m16";
import { FR_M17_ATOMS } from "./m17";
import { FR_M18_ATOMS } from "./m18";
import { FR_M19_ATOMS } from "./m19";
import { FR_M20_ATOMS } from "./m20";
import { FR_M21_ATOMS } from "./m21";
import { FR_M22_ATOMS } from "./m22";
import { FR_M23_ATOMS } from "./m23";
import { FR_M24_ATOMS } from "./m24";
import { FR_M25_ATOMS } from "./m25";
import { FR_M26_ATOMS } from "./m26";

/**
 * The 26-module atom spread that used to live in `courseAtoms.ts` as three
 * digit-bucketed `import.meta.glob(..., {eager:true})` calls (the FR
 * glob-order race fix, docs/fr-article-glob-race-2026-09-10.md). Content-as-
 * data (2026-09-13): eager/Node only (the emitter and
 * `atoms.generated.test.ts`) — a static, source-order list sidesteps the
 * race entirely (no glob, no lexicographic-vs-numeric sort mismatch) and is
 * exactly the pattern `es/curriculum/atomsAggregate.eager.ts` already uses.
 * EVERY authored module must appear here — a module missing from this list
 * has atoms that are taught and never scheduled (the ES m17 failure this
 * pattern was built to make unrepresentable).
 */
export function buildFrAtomsAggregate(): FrAtom[] {
  return [
    ...FR_M1_ATOMS,
    ...FR_M2_ATOMS,
    ...FR_M3_ATOMS,
    ...FR_M4_ATOMS,
    ...FR_M5_ATOMS,
    ...FR_M6_ATOMS,
    ...FR_M7_ATOMS,
    ...FR_M8_ATOMS,
    ...FR_M9_ATOMS,
    ...FR_M10_ATOMS,
    ...FR_M11_ATOMS,
    ...FR_M12_ATOMS,
    ...FR_M13_ATOMS,
    ...FR_M14_ATOMS,
    ...FR_M15_ATOMS,
    ...FR_M16_ATOMS,
    ...FR_M17_ATOMS,
    ...FR_M18_ATOMS,
    ...FR_M19_ATOMS,
    ...FR_M20_ATOMS,
    ...FR_M21_ATOMS,
    ...FR_M22_ATOMS,
    ...FR_M23_ATOMS,
    ...FR_M24_ATOMS,
    ...FR_M25_ATOMS,
    ...FR_M26_ATOMS,
  ];
}
