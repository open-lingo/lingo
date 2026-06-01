import type { ReadingPassage } from "./ja-reading-passages";
import type { SpeakingPrompt } from "./ja-speaking-prompts";
import type { CounterDef } from "@/features/languages/ja/classifiers";

import { READING_PASSAGES as JA_READING } from "./ja-reading-passages";
import { SPEAKING_PROMPTS as JA_SPEAKING } from "./ja-speaking-prompts";
import { COUNTER_DEFS as JA_COUNTERS } from "@/features/languages/ja/classifiers";
import { KO_READING_PASSAGES } from "./ko-reading-passages";
import { KO_SPEAKING_PROMPTS } from "./ko-speaking-prompts";
import { KO_COUNTER_DEFS } from "./ko-counters";

export function getReadingPassages(langId: string): ReadingPassage[] {
  if (langId === "ko") return KO_READING_PASSAGES;
  return JA_READING;
}

export function getSpeakingPrompts(langId: string): SpeakingPrompt[] {
  if (langId === "ko") return KO_SPEAKING_PROMPTS;
  return JA_SPEAKING;
}

export function getCounterDefs(langId: string): CounterDef[] {
  if (langId === "ko") return KO_COUNTER_DEFS;
  return JA_COUNTERS;
}

export function getTtsLang(langId: string): string {
  if (langId === "ko") return "ko";
  return "ja";
}

export function getSpeechRecognitionLang(langId: string): string {
  if (langId === "ko") return "ko-KR";
  return "ja-JP";
}

export function hasConjugationData(langId: string): boolean {
  return langId === "ja";
}

export function hasKanjiData(langId: string): boolean {
  return langId === "ja";
}
