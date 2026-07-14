import type { ReadingPassage } from "./ja-reading-passages";
import type { SpeakingPrompt } from "./ja-speaking-prompts";
import type { CounterDef } from "@/features/languages/ja/classifiers";
import type { EsVerbEntry } from "@/features/languages/es/conjugationTables";

import { READING_PASSAGES as JA_READING } from "./ja-reading-passages";
import { SPEAKING_PROMPTS as JA_SPEAKING } from "./ja-speaking-prompts";
import { ES_READING_PASSAGES } from "./es-reading-passages";
import { ES_SPEAKING_PROMPTS } from "./es-speaking-prompts";
import { COUNTER_DEFS as JA_COUNTERS } from "@/features/languages/ja/classifiers";
import { KO_READING_PASSAGES } from "@/features/languages/ko/readingPassages";
import { KO_SPEAKING_PROMPTS } from "@/features/languages/ko/speakingPrompts";
import { KO_COUNTER_DEFS } from "@/features/languages/ko/classifiers";
import { ES_VERB_ENTRIES } from "@/features/languages/es/conjugationTables";

export function getReadingPassages(langId: string): ReadingPassage[] {
  if (langId === "ko") return KO_READING_PASSAGES;
  if (langId === "es") return ES_READING_PASSAGES;
  return JA_READING;
}

export function getSpeakingPrompts(langId: string): SpeakingPrompt[] {
  if (langId === "ko") return KO_SPEAKING_PROMPTS;
  if (langId === "es") return ES_SPEAKING_PROMPTS;
  return JA_SPEAKING;
}

export function getCounterDefs(langId: string): CounterDef[] {
  if (langId === "ko") return KO_COUNTER_DEFS;
  if (langId === "es") return []; // Spanish has no counter system
  return JA_COUNTERS;
}

export function getTtsLang(langId: string): string {
  if (langId === "ko") return "ko";
  if (langId === "es") return "es";
  return "ja";
}

export function getSpeechRecognitionLang(langId: string): string {
  if (langId === "ko") return "ko-KR";
  if (langId === "es") return "es-MX";
  return "ja-JP";
}

export function hasConjugationData(langId: string): boolean {
  return langId === "ja" || langId === "es";
}

/** Person × tense verb tables for the ES conjugation trainer. JA keeps its
 *  own engine-backed tables (conjugationEngine.ts) — this loader only
 *  serves the entry-list shape ES uses. */
export function getConjugationVerbEntries(langId: string): EsVerbEntry[] {
  if (langId === "es") return ES_VERB_ENTRIES;
  return [];
}

export function hasKanjiData(langId: string): boolean {
  return langId === "ja";
}
