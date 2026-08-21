import { useLang } from "@/shared/hooks/useLangPath";
import { ProtoModuleWalker, type ProtoModuleConfig } from "./ProtoModuleWalkerPage";
import { ES_M1_LESSONS } from "@/features/languages/es/curriculum/m1";
import { FR_M1_MODULE } from "@/features/languages/fr/curriculum/m1";
import { getMockLessonContent } from "../data/mockLessons";

/**
 * DEV · module-1 QA walker, language-dispatched.
 * Route: `/:lang/qa/m1-lesson-1`.
 *
 * PROMOTED (2026-08-21): the prototype content this page used to host is
 * now the real m1 in each language's curriculum — the walker now serves
 * the PROMOTED lessons through `getMockLessonContent`, i.e. the same
 * render pipeline the course uses, so QA here sees exactly what learners
 * see (review-tail augmentation, grid floors, and all).
 */

function stepsFor(lessonId: string) {
  const content = getMockLessonContent(lessonId);
  if (!content) throw new Error(`QA walker: no content for ${lessonId}`);
  return content.steps;
}

const ES_CONFIG: ProtoModuleConfig = {
  eyebrow: "QA · ES m1 (promoted course content)",
  heading: "🌱 Module 1 — the inline-author loop",
  blurb:
    "Nine lessons under the interaction doctrine: image-MCQ debuts, self-cueing micro-sims, word_map first views, hear-before-speak, cued-recall speaking, review tails, interleaved numbers, a zero-new checkpoint after all teaching — and no deduction path that leans on a cognate.",
  titles: ES_M1_LESSONS.map((l) => l.title),
  build: async (n) => stepsFor(`es-m1-${n}`),
  completeTitle: "¡Módulo uno completo!",
  completeBody:
    "Twenty-five words, real sentences, a whole first conversation — and never once a wall of text.",
};

const FR_CONFIG: ProtoModuleConfig = {
  eyebrow: "QA · FR m1 (promoted course content)",
  heading: "🌱 Module 1 — le premier module",
  blurb:
    "The ES m1 spine re-derived for French: silent letters as the phonetics lane, bon/bonne as the agreement seed, six/dix as the ear pair, «ça va» as the mirror gift — same laws, French-honest choices. Denise voice (audition passed 2026-08-21).",
  titles: FR_M1_MODULE.lessons.map((l) => l.title),
  build: async (n) => stepsFor(`fr-m1-${n}`),
  completeTitle: "Module un — terminé !",
  completeBody:
    "Twenty-seven words, real sentences, a whole first conversation — in French, with no wall of text.",
};

export default function EsM1L1Page() {
  const lang = useLang();
  return <ProtoModuleWalker config={lang === "fr" ? FR_CONFIG : ES_CONFIG} />;
}
