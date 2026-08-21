import { useLang } from "@/shared/hooks/useLangPath";
import { ProtoModuleWalker, type ProtoModuleConfig } from "./ProtoModuleWalkerPage";
import { ES_M2_LESSONS } from "@/features/languages/es/curriculum/m2";
import { FR_M2_MODULE } from "@/features/languages/fr/curriculum/m2";
import { getMockLessonContent } from "../data/mockLessons";

/**
 * DEV · module-2 QA walker, language-dispatched.
 * Route: `/:lang/qa/m2`. Serves the PROMOTED m2 through the real render
 * pipeline (see EsM1L1Page for the promotion note).
 */

function stepsFor(lessonId: string) {
  const content = getMockLessonContent(lessonId);
  if (!content) throw new Error(`QA walker: no content for ${lessonId}`);
  return content.steps;
}

const ES_CONFIG: ProtoModuleConfig = {
  eyebrow: "QA · ES m2 (promoted course content)",
  heading: "🌿 Module 2 — who are you?",
  blurb:
    "Ten lessons: the ¿cómo estás? rescue kit, names, the no-entiendo escape hatch (with its payoff sim), ser without a conjugation table, origins by flag, the -o/-a switch on people — checkpoint after all teaching, café conversation, mastery on a stranger.",
  titles: ES_M2_LESSONS.map((l) => l.title),
  build: async (n) => stepsFor(`es-m2-${n}`),
  completeTitle: "¡Módulo dos completo!",
  completeBody:
    "You can meet a stranger, trade names and origins, survive a sentence you don't know, and land the coffee. That's a conversation.",
};

const FR_CONFIG: ProtoModuleConfig = {
  eyebrow: "QA · FR m2 (promoted course content)",
  heading: "🌿 Module 2 — qui es-tu ?",
  blurb:
    "Ten lessons: own the answer to «Ça va ?», names, the je-ne-comprends-pas escape hatch, être with its pronouns attached, origins by city (no article minefield), and the silent t that wakes up — checkpoint after all teaching, café conversation, mastery on a stranger.",
  titles: FR_M2_MODULE.lessons.map((l) => l.title),
  build: async (n) => stepsFor(`fr-m2-${n}`),
  completeTitle: "Module deux — terminé !",
  completeBody:
    "A stranger, a full exchange, zero panic — in French. Next: what you like.",
};

export default function ProtoM2Page() {
  const lang = useLang();
  return <ProtoModuleWalker config={lang === "fr" ? FR_CONFIG : ES_CONFIG} />;
}
