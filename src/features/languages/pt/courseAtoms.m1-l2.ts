/**
 * Per-lesson atom fragment — m1 lesson 2. Scaffolding lane PTFRAG
 * (2026-09-18): five of these files exist so authoring lanes PTAUTH-L1..L5
 * can each own one file (paired with `curriculum/ir/m1/l2.ir.yaml`)
 * without touching `courseAtoms.ts` or each other's files. Empty until the
 * owning lane lands content — populate with `atom({...})` calls the same
 * way a compiled `curriculum/mN.ts` module does; each call self-registers
 * into the shared registry in `courseAtoms.ts` (see that file's import-
 * cycle note — safe to call at this file's top level).
 */
import type { PtAtom } from "./courseAtoms";

export const M1_L2_ATOMS: PtAtom[] = [];
