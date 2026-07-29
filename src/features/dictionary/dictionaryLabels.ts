import type { TFunction } from "i18next";
import type { PartOfSpeech, DictionarySource } from "@/shared/dictionary";

/** English fallbacks for parts of speech — i18n keys are `dictionary.pos.<pos>`. */
const POS_FALLBACK: Record<PartOfSpeech, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  adverb: "Adverb",
  particle: "Particle",
  counter: "Counter",
  number: "Number",
  pronoun: "Pronoun",
  determiner: "Determiner",
  conjunction: "Conjunction",
  interjection: "Interjection",
  expression: "Expression",
  "proper-noun": "Proper noun",
  phrase: "Phrase",
  grammar: "Grammar",
  other: "Other",
};

const SOURCE_FALLBACK: Record<DictionarySource, string> = {
  course: "In your course",
  frequency: "Frequency list",
  both: "Course + frequency",
};

export function posLabel(t: TFunction, pos: PartOfSpeech): string {
  return t(`dictionary.pos.${pos}`, POS_FALLBACK[pos] ?? pos);
}

export function sourceLabel(t: TFunction, source: DictionarySource): string {
  return t(`dictionary.source.${source}`, SOURCE_FALLBACK[source]);
}

/** Numeric ordering for `mN` unlock modules; non-numeric (`future`) sorts last. */
export function unlockModuleOrder(m: string | undefined): number {
  if (!m) return Number.POSITIVE_INFINITY;
  const match = /^m(\d+)$/.exec(m);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}
