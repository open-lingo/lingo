/**
 * Spanish curriculum assembly — module metadata + pathway builder.
 *
 * ES_MODULE_META is the single source of truth for the module spine
 * (docs/es-course-spine-2026-07-13.md). `buildSpanishCourse()` turns it
 * into the pathway CourseModule[] consumed by `getMockCourse("es")`,
 * SKIPPING modules whose lesson array is still an empty stub — the learn
 * map only ever shows authored content. m3+ re-authoring under the §13 doctrine
 * appends here as modules land; the July m1–m19 wave is in `_archive/`.
 */
import type { CourseModule } from "@/shared/domain/course";
import type { LessonContent } from "@/features/lesson/types";

import { ES_M1_LESSONS } from "./m1";
import { ES_M2_LESSONS } from "./m2";

export type EsModuleMeta = {
  id: string;
  title: string;
  eyebrow?: string;
  summary?: string;
  accent?: { from: string; to: string };
};

export const ES_MODULE_META: EsModuleMeta[] = [
  {
    id: "m1",
    title: "M1 · Sounds & greetings",
    eyebrow: "Module 1 · Sonidos y saludos",
    summary: "The five vowels, first greetings, courtesy words, and numbers 0–10.",
    accent: { from: "#0ea5e9", to: "#0284c7" },
  },
  {
    id: "m2",
    title: "M2 · Introductions",
    eyebrow: "Module 2 · Presentaciones",
    summary: "The turn-2 rescue kit, names, soy/eres, él/ella, and where you're from.",
    accent: { from: "#6366f1", to: "#8b5cf6" },
  },
];

const LESSONS_BY_MODULE: Record<string, LessonContent[]> = {
  m1: ES_M1_LESSONS,
  m2: ES_M2_LESSONS,
};

/** Flat lesson list for the shared LESSONS content index (mockLessons.ts). */
export const ES_ALL_LESSONS: LessonContent[] = ES_MODULE_META.flatMap(
  (meta) => LESSONS_BY_MODULE[meta.id] ?? [],
);

/** Assemble the ES pathway. Modules with no authored lessons are skipped. */
export function buildSpanishCourse(): CourseModule[] {
  return ES_MODULE_META.filter(
    (meta) => (LESSONS_BY_MODULE[meta.id] ?? []).length > 0,
  ).map((meta) => ({
    id: meta.id,
    title: meta.title,
    eyebrow: meta.eyebrow,
    summary: meta.summary,
    accent: meta.accent,
    lessons: (LESSONS_BY_MODULE[meta.id] ?? []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      status: "available" as const,
    })),
  }));
}
