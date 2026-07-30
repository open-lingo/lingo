/**
 * Sentence-template registry. The engine reads templates only through
 * {@link getSentenceTemplates}; per-language data lives in the sibling files.
 * A language with no templates returns `[]` — the generator degrades gracefully.
 */
import type { SentenceTemplate } from "@/features/practice/engine/types";
import { JA_TEMPLATES } from "./ja";
import { KO_TEMPLATES } from "./ko";
import { ES_TEMPLATES } from "./es";

const TEMPLATES: Record<string, SentenceTemplate[]> = {
  ja: JA_TEMPLATES,
  ko: KO_TEMPLATES,
  es: ES_TEMPLATES,
};

export function getSentenceTemplates(languageId: string): SentenceTemplate[] {
  return TEMPLATES[languageId] ?? [];
}
