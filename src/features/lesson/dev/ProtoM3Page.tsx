import { ProtoModuleWalker, type ProtoModuleConfig } from "./ProtoModuleWalkerPage";
import { ES_M3_LESSONS } from "@/features/languages/es/curriculum/m3";
import { getMockLessonContent } from "../data/mockLessons";

/**
 * DEV · module-3 QA walker.
 * Route: `/:lang/qa/m3`. Serves the IR-compiled m3 through the real render
 * pipeline (see EsM1L1Page for the promotion note). ES-only for now — the
 * fr m3 re-author models itself on this module once it clears Spencer's walk.
 */

function stepsFor(lessonId: string) {
  const content = getMockLessonContent(lessonId);
  if (!content) throw new Error(`QA walker: no content for ${lessonId}`);
  return content.steps;
}

const ES_CONFIG: ProtoModuleConfig = {
  eyebrow: "QA · ES m3 (IR-compiled course content)",
  heading: "🗝️ Module 3 — things pick a side",
  blurb:
    "Ten lessons: el/la and un/una as one rule (the callback to maestro/maestra), eleven picture-true nouns that wear their articles, «¿qué es?» as a conversational move, hay putting your m1 numbers to work, en/aquí, the lost-keys rescue — checkpoint after all teaching, Sofía's visit, mastery on María's naming game.",
  titles: ES_M3_LESSONS.map((l) => l.title),
  build: async (n) => stepsFor(`es-m3-${n}`),
  completeTitle: "¡Módulo tres completo!",
  completeBody:
    "You can point at anything, ask what it is, answer, and count what you see — with the right article, every time. m4 puts colors and sizes on all of it.",
};

export default function ProtoM3Page() {
  return <ProtoModuleWalker config={ES_CONFIG} />;
}
