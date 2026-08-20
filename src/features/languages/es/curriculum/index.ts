/**
 * Spanish curriculum assembly — module metadata + pathway builder.
 *
 * ES_MODULE_META is the single source of truth for the module spine
 * (docs/es-course-spine-2026-07-13.md). `buildSpanishCourse()` turns it
 * into the pathway CourseModule[] consumed by `getMockCourse("es")`,
 * SKIPPING modules whose lesson array is still an empty stub — the learn
 * map only ever shows authored content. As authoring waves land m2…m17,
 * their modules appear automatically; nothing here needs editing.
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
import { ES_M13_LESSONS } from "./m13";
import { ES_M14_LESSONS } from "./m14";
import { ES_M15_LESSONS } from "./m15";
import { ES_M16_LESSONS } from "./m16";
import { ES_M17_LESSONS } from "./m17";
import { ES_M18_LESSONS } from "./m18";
import { ES_M19_LESSONS } from "./m19";

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
    summary: "Subject pronouns, ser (singular), me llamo, and tú vs usted.",
    accent: { from: "#6366f1", to: "#8b5cf6" },
  },
  {
    id: "m3",
    title: "M3 · Gender & articles",
    eyebrow: "Module 3 · Género y artículos",
    summary: "El/la, un/una, plural formation, and hay.",
    accent: { from: "#ec4899", to: "#db2777" },
  },
  {
    id: "m4",
    title: "M4 · Descriptions",
    eyebrow: "Module 4 · Descripciones",
    summary: "Adjective agreement, ser + adjective, and colors.",
    accent: { from: "#f97316", to: "#ea580c" },
  },
  {
    id: "m5",
    title: "M5 · Family & possession",
    eyebrow: "Module 5 · Familia y posesión",
    summary: "Family words, possessives mi/tu/su, and tener (singular).",
    accent: { from: "#14b8a6", to: "#0d9488" },
  },
  {
    id: "m6",
    title: "M6 · Numbers & time",
    eyebrow: "Module 6 · Números y tiempo",
    summary: "Numbers 11–100, clock time, days of the week, and months.",
    accent: { from: "#8b5cf6", to: "#7c3aed" },
  },
  {
    id: "m7",
    title: "M7 · Estar & places",
    eyebrow: "Module 7 · Estar y lugares",
    summary: "Estar, location with en, ser vs estar, and al/del.",
    accent: { from: "#ef4444", to: "#dc2626" },
  },
  {
    id: "m8",
    title: "M8 · Routines I",
    eyebrow: "Module 8 · Rutinas I",
    summary: "The full -ar present paradigm and frequency adverbs.",
    accent: { from: "#f59e0b", to: "#d97706" },
  },
  {
    id: "m9",
    title: "M9 · Routines II",
    eyebrow: "Module 9 · Rutinas II",
    summary: "The -er/-ir present paradigms and the question words.",
    accent: { from: "#10b981", to: "#059669" },
  },
  {
    id: "m10",
    title: "M10 · Food & gustar",
    eyebrow: "Module 10 · Comida y gustos",
    summary: "Gustar mechanics, food vocabulary, and polite ordering.",
    accent: { from: "#3b82f6", to: "#2563eb" },
  },
  {
    id: "m11",
    title: "M11 · Ir & the near future",
    eyebrow: "Module 11 · Vamos",
    summary: "Ir, ir a + infinitive, and getting around town.",
    accent: { from: "#a855f7", to: "#9333ea" },
  },
  {
    id: "m12",
    title: "M12 · Shopping",
    eyebrow: "Module 12 · De compras",
    summary: "Demonstratives, prices, clothes, and numbers to thousands.",
    accent: { from: "#06b6d4", to: "#0891b2" },
  },
  {
    id: "m13",
    title: "M13 · Stem-changing verbs",
    eyebrow: "Module 13 · Cambios de raíz",
    summary: "e→ie, o→ue, and e→i verbs — preferences and abilities.",
    accent: { from: "#0ea5e9", to: "#0284c7" },
  },
  {
    id: "m14",
    title: "M14 · Home & weather",
    eyebrow: "Module 14 · Casa y clima",
    summary: "Rooms and furniture, hay vs está, and hace + weather.",
    accent: { from: "#6366f1", to: "#8b5cf6" },
  },
  {
    id: "m15",
    title: "M15 · Reflexives & routine",
    eyebrow: "Module 15 · Mi rutina",
    summary: "Reflexive verbs and narrating your day start to finish.",
    accent: { from: "#ec4899", to: "#db2777" },
  },
  {
    id: "m16",
    title: "M16 · Travel & review",
    eyebrow: "Module 16 · De viaje",
    summary: "Survival Spanish, yo-irregulars, the progressive, and the A1 grand review.",
    accent: { from: "#f97316", to: "#ea580c" },
  },
  {
    id: "m17",
    title: "M17 · The preterite",
    eyebrow: "Module 17 · El pretérito",
    summary: "The A2 tier opens: regular past tense, the accent minimal pair, and six ways to say when.",
    accent: { from: "#0ea5e9", to: "#6366f1" },
  },
  {
    id: "m18",
    title: "M18 · The irregular preterite",
    eyebrow: "Módulo 18 · Pretéritos fuertes",
    summary: "Strong stems, the j-stem rule, and the six spelling verbs that are not irregular at all.",
    accent: { from: "#6366f1", to: "#8b5cf6" },
  },
  {
    id: "m19",
    title: "M19 · The imperfect",
    eyebrow: "Módulo 19 · El imperfecto",
    summary: "Two ending sets, three irregular verbs, and the time word that decides which past you use.",
    accent: { from: "#8b5cf6", to: "#d946ef" },
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
  m13: ES_M13_LESSONS,
  m14: ES_M14_LESSONS,
  m15: ES_M15_LESSONS,
  m16: ES_M16_LESSONS,
  m17: ES_M17_LESSONS,
  m18: ES_M18_LESSONS,
  m19: ES_M19_LESSONS,
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
