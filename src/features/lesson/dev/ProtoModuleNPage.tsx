import { useLocation } from "react-router-dom";
import { ProtoModuleWalker, type ProtoModuleConfig } from "./ProtoModuleWalkerPage";
import { ES_MODULE_META, ES_ALL_LESSONS } from "@/features/languages/es/curriculum";
import { getMockLessonContent } from "../data/mockLessons";

/**
 * DEV · generic ES module QA walker for the m4–m10 wave.
 * Route: `/:lang/qa/m4` … `/qa/m10` (all registered onto this component —
 * the module id is read from the path). Serves the registered curriculum
 * through the real render pipeline, same contract as EsM1L1Page/ProtoM3Page.
 */

function stepsFor(lessonId: string) {
  const content = getMockLessonContent(lessonId);
  if (!content) throw new Error(`QA walker: no content for ${lessonId}`);
  return content.steps;
}

export default function ProtoModuleNPage() {
  const { pathname } = useLocation();
  const mod = /\/qa\/(m\d+)$/.exec(pathname)?.[1] ?? "m4";
  const meta = ES_MODULE_META.find((m) => m.id === mod);
  const lessons = ES_ALL_LESSONS.filter((l) => l.id.startsWith(`es-${mod}-`));
  if (!meta || lessons.length === 0) {
    throw new Error(`QA walker: es module "${mod}" is not registered`);
  }
  const config: ProtoModuleConfig = {
    eyebrow: `QA · ES ${mod} (IR-compiled course content)`,
    heading: meta.title,
    blurb: meta.summary ?? "",
    titles: lessons.map((l) => l.title),
    build: async (n) => stepsFor(`es-${mod}-${n}`),
    completeTitle: `¡Módulo ${mod.slice(1)} completo!`,
    completeBody: "Module complete — on to the next one.",
  };
  return <ProtoModuleWalker config={config} />;
}
