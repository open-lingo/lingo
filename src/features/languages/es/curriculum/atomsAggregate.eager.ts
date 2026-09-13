import type { EsAtom } from "../courseAtoms";
import { ES_M1_ATOMS } from "./m1";
import { ES_M2_ATOMS } from "./m2";
import { ES_M3_ATOMS } from "./m3";
import { ES_M4_ATOMS } from "./m4";
import { ES_M5_ATOMS } from "./m5";
import { ES_M6_ATOMS } from "./m6";
import { ES_M7_ATOMS } from "./m7";
import { ES_M8_ATOMS } from "./m8";
import { ES_M9_ATOMS } from "./m9";
import { ES_M10_ATOMS } from "./m10";
import { ES_M11_ATOMS } from "./m11";
import { ES_M12_ATOMS } from "./m12";
import { ES_M13_ATOMS } from "./m13";
import { ES_M14_ATOMS } from "./m14";
import { ES_M15_ATOMS } from "./m15";
import { ES_M16_ATOMS } from "./m16";
import { ES_M17_ATOMS } from "./m17";
import { ES_M18_ATOMS } from "./m18";
import { ES_M19_ATOMS } from "./m19";
import { ES_M20_ATOMS } from "./m20";
import { ES_M21_ATOMS } from "./m21";
import { ES_M22_ATOMS } from "./m22";
import { ES_M23_ATOMS } from "./m23";
import { ES_M24_ATOMS } from "./m24";
import { ES_M25_ATOMS } from "./m25";
import { ES_M26_ATOMS } from "./m26";
import { ES_M27_ATOMS } from "./m27";
import { ES_M28_ATOMS } from "./m28";
import { ES_M29_ATOMS } from "./m29";
import { ES_M30_ATOMS } from "./m30";
import { ES_M31_ATOMS } from "./m31";
import { ES_M32_ATOMS } from "./m32";
import { ES_M33_ATOMS } from "./m33";
import { ES_M34_ATOMS } from "./m34";
import { ES_M35_ATOMS } from "./m35";
import { ES_M36_ATOMS } from "./m36";
import { ES_M37_ATOMS } from "./m37";
import { ES_M38_ATOMS } from "./m38";

/**
 * The 38-module atom spread that used to live in `courseAtoms.getEsCourseAtoms`.
 * Eager/Node only (the emitter and `atoms.generated.test.ts`): importing the
 * modules evaluates every lesson factory, which is exactly what the app must
 * not do. EVERY authored module must appear here — see the warning that used
 * to sit on `getEsCourseAtoms`: a module missing from this list has atoms
 * that are taught and never scheduled.
 */
export function buildEsAtomsAggregate(): EsAtom[] {
  return [
    ...ES_M1_ATOMS,
    ...ES_M2_ATOMS,
    ...ES_M3_ATOMS,
    ...ES_M4_ATOMS,
    ...ES_M5_ATOMS,
    ...ES_M6_ATOMS,
    ...ES_M7_ATOMS,
    ...ES_M8_ATOMS,
    ...ES_M9_ATOMS,
    ...ES_M10_ATOMS,
    ...ES_M11_ATOMS,
    ...ES_M12_ATOMS,
    ...ES_M13_ATOMS,
    ...ES_M14_ATOMS,
    ...ES_M15_ATOMS,
    ...ES_M16_ATOMS,
    ...ES_M17_ATOMS,
    ...ES_M18_ATOMS,
    ...ES_M19_ATOMS,
    ...ES_M20_ATOMS,
    ...ES_M21_ATOMS,
    ...ES_M22_ATOMS,
    ...ES_M23_ATOMS,
    ...ES_M24_ATOMS,
    ...ES_M25_ATOMS,
    ...ES_M26_ATOMS,
    ...ES_M27_ATOMS,
    ...ES_M28_ATOMS,
    ...ES_M29_ATOMS,
    ...ES_M30_ATOMS,
    ...ES_M31_ATOMS,
    ...ES_M32_ATOMS,
    ...ES_M33_ATOMS,
    ...ES_M34_ATOMS,
    ...ES_M35_ATOMS,
    ...ES_M36_ATOMS,
    ...ES_M37_ATOMS,
    ...ES_M38_ATOMS,
  ];
}
