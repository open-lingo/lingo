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
import { ES_M3_LESSONS } from "./m3";
import { ES_M4_LESSONS } from "./m4";
import { ES_M5_LESSONS } from "./m5";
import { ES_M6_LESSONS } from "./m6";
import { ES_M7_LESSONS } from "./m7";
import { ES_M8_LESSONS } from "./m8";
import { ES_M9_LESSONS } from "./m9";
import { ES_M10_LESSONS } from "./m10";
import { ES_M11_LESSONS } from "./m11";
import { ES_M12_LESSONS } from "./m12";

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
    title: "Sounds & greetings",
    eyebrow: "Module 1 · Sonidos y saludos",
    summary: "The five vowels, first greetings, courtesy words, and numbers 0–10.",
    accent: { from: "#0ea5e9", to: "#0284c7" },
  },
  {
    id: "m2",
    title: "Introductions",
    eyebrow: "Module 2 · Presentaciones",
    summary: "The turn-2 rescue kit, names, soy/eres, él/ella, and where you're from.",
    accent: { from: "#6366f1", to: "#8b5cf6" },
  },
  {
    id: "m3",
    title: "Things & sides",
    eyebrow: "Module 3 · El, la y las cosas",
    summary: "el/la and un/una, your first nouns, «¿qué es?», and hay to count what you see.",
    accent: { from: "#f59e0b", to: "#ea580c" },
  },
  {
    id: "m4",
    title: "Where things are",
    eyebrow: "Module 4 · ¿Dónde está?",
    summary: "hay vs está, rooms of the house, los/las and the plural rule, aquí/allí, and the two rule-breakers.",
    accent: { from: "#10b981", to: "#059669" },
  },
  {
    id: "m5",
    title: "Mi familia",
    eyebrow: "Module 5 · Mi familia",
    summary: "tengo/tienes/tiene as formulas, mi/tu, the family, pets, and asking anyone's age.",
    accent: { from: "#f472b6", to: "#db2777" },
  },
  {
    id: "m6",
    title: "Describe it",
    eyebrow: "Module 6 · Descríbelo",
    summary: "Adjectives that flip to match their noun, colors, muy and pero — the pink/blue tints finally do their work.",
    accent: { from: "#a855f7", to: "#7c3aed" },
  },
  {
    id: "m7",
    title: "El café",
    eyebrow: "Module 7 · El café",
    summary: "quiero vs me gusta, food and drink, tengo hambre/sed — and Diego finally pays at Carmen's café.",
    accent: { from: "#f59e0b", to: "#b45309" },
  },
  {
    id: "m8",
    title: "La semana",
    eyebrow: "Module 8 · La semana",
    summary: "The seven days, hoy/mañana, ¿cuándo? — and once through quince, with your ear against dos/doce.",
    accent: { from: "#38bdf8", to: "#0369a1" },
  },
  {
    id: "m9",
    title: "Vamos",
    eyebrow: "Module 9 · Vamos",
    summary: "voy/vas, a vs al, ¿adónde? — say where you're headed, and catch the bus there.",
    accent: { from: "#34d399", to: "#047857" },
  },
  {
    id: "m10",
    title: "The verb machine",
    eyebrow: "Module 10 · La máquina",
    summary: "hablar, trabajar, estudiar — one -o/-as/-a swap runs them all. Ends on «hablo un poco».",
    accent: { from: "#f43f5e", to: "#be123c" },
  },
  {
    id: "m11",
    title: "Como y bebo",
    eyebrow: "Module 11 · La segunda máquina",
    summary: "comer, beber, vivir — the -er and -ir machines, which in the singular are one machine.",
    accent: { from: "#38bdf8", to: "#0369a1" },
  },
  {
    id: "m12",
    title: "Este, ese",
    eyebrow: "Module 12 · Señalar",
    summary: "este, ese and their plurals — pointing agrees, and a shop is where you find out.",
    accent: { from: "#a78bfa", to: "#6d28d9" },
  },
];

const LESSONS_BY_MODULE: Record<string, LessonContent[]> = {
  m1: ES_M1_LESSONS,
  m2: ES_M2_LESSONS,
  m3: ES_M3_LESSONS,
  m4: ES_M4_LESSONS,
  m5: ES_M5_LESSONS,
  m6: ES_M6_LESSONS,
  m7: ES_M7_LESSONS,
  m8: ES_M8_LESSONS,
  m9: ES_M9_LESSONS,
  m10: ES_M10_LESSONS,
  m11: ES_M11_LESSONS,
  m12: ES_M12_LESSONS,
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
