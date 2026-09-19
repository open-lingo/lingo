/**
 * pt/curriculum/m1.ts — Portuguese module 1, EMPTY (scaffolding lane,
 * docs/pt-course-design-2026-09-18.md §5). No lessons, no atoms.
 *
 * The design doc's own m1 L1–L5 briefs (§4) are the source for the first
 * authoring wave — a Sonnet agent lane per `[[es-author-with-sonnet-agents]]`
 * (Spencer: no inline bulk authoring), NOT this lane. That lane should
 * either hand-author this file directly (ES's early-module convention) or
 * write `curriculum/ir/m1.ir.yaml` and run
 * `node scripts/compile-ir-pt.mjs m1` (the frameless-only PT compiler this
 * lane ships) to generate it — do not hand-edit a compiler-generated file
 * once that path is taken; regenerate instead (`codebase-search` §6).
 *
 * `curriculum/index.ts`'s `buildPortugueseCourse()` filters modules whose
 * lesson array is empty, so an empty `PT_M1_LESSONS` here means m1 does not
 * appear in the course map at all yet — exactly the "no-op until authored"
 * shape the scaffolding lane needs.
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PtAtom } from "../courseAtoms";

export const PT_M1_ATOMS: PtAtom[] = [];

export const PT_M1_LESSONS: LessonContent[] = [];
