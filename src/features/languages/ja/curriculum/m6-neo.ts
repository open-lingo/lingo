/**
 * m6-neo — NEGATIVES & EXISTENCE (spine tile s06).
 *
 * FIRST module produced by the deterministic compiler pipeline
 * (docs/content-ir-spec-2026-07-20.md): the pedagogy is authored in
 * `ir/m6.ir.yaml` (→ `ir/m6.ir.json` via `node scripts/compile-ir.mjs m6`),
 * and `compileModule` lays it out into gate-passing lessons at import.
 *
 * DO NOT hand-edit lessons here — edit the IR and recompile. The authoring
 * bar (density, variety, teach-first provenance, capstone, close-on-match) is
 * satisfied BY CONSTRUCTION; see moduleCompiler.m6.guard.test.ts.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m6Ir from "./ir/m6.ir.json";

export const M6_NEO_LESSONS: LessonContent[] = compileModule(m6Ir as unknown as ModuleIR);
