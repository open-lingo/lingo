/**
 * Korean conjugation tables — Phase 5 starter seed.
 *
 * Korean conjugation is genuinely data-heavy (politeness × tense × aspect ×
 * negation × honorifics). Phase 5 spec calls for "the structural foundation":
 * one representative regular verb covering the full politeness paradigm,
 * proving the slot wires correctly so a future content pass can drop in
 * more verbs without touching engine code.
 *
 * Verb chosen: 먹다 (meokda, "to eat"). It's a regular consonant-stem verb
 * (irregular patterns like ㅂ-, ㄹ-, 르-irregular live separately when
 * authored). Covers:
 *   - present, past, future
 *   - formal-polite (-습니다), polite (-요), casual / plain
 *   - negation forms
 *
 * Form keys document the cell layout (e.g. `present.formal_polite`).
 * The shared conjugation engine consumes `forms: Record<string, string>`
 * — keys are opaque to the engine.
 *
 * CONTENT-TODO: a Korean linguist should sanity-check the casual/plain
 * forms below before content goes wide. 먹어 vs 먹는다 are both casual but
 * occupy different sociolinguistic niches (sentence-final vs. narrative).
 */
import type { AtomId } from "@/shared/language/types";

export type KoVerbForm =
  // Present
  | "present.formal_polite"   // 먹습니다
  | "present.polite"          // 먹어요
  | "present.casual"          // 먹어
  | "present.plain"           // 먹는다 (declarative plain — used in writing / monologue)
  | "present.formal_polite.neg"
  | "present.polite.neg"
  | "present.casual.neg"
  // Past
  | "past.formal_polite"      // 먹었습니다
  | "past.polite"             // 먹었어요
  | "past.casual"             // 먹었어
  | "past.formal_polite.neg"
  | "past.polite.neg"
  | "past.casual.neg"
  // Future
  | "future.formal_polite"    // 먹을 겁니다
  | "future.polite"           // 먹을 거예요
  | "future.casual"           // 먹을 거야
  | "future.formal_polite.neg"
  | "future.polite.neg"
  | "future.casual.neg"
  // Dictionary / lemma form
  | "dictionary";

export type KoVerbEntry = {
  id: string;
  lemma: string;
  meaning: string;
  /**
   * Verb class — drives auto-generation rules in a future content pass.
   * For now, hand-authored cells per verb.
   */
  group: "regular-consonant" | "regular-vowel" | "irregular";
  forms: Record<KoVerbForm, string>;
  introducedAtModule: number;
};

export const KO_VERB_ENTRIES: KoVerbEntry[] = [
  {
    id: "meokda",
    lemma: "먹다",
    meaning: "to eat",
    group: "regular-consonant",
    introducedAtModule: 5, // M5 (food/ordering) — placeholder until M5 KO lands
    forms: {
      dictionary: "먹다",
      // Present
      "present.formal_polite": "먹습니다",
      "present.polite": "먹어요",
      "present.casual": "먹어",
      "present.plain": "먹는다",
      "present.formal_polite.neg": "먹지 않습니다",
      "present.polite.neg": "안 먹어요",
      "present.casual.neg": "안 먹어",
      // Past
      "past.formal_polite": "먹었습니다",
      "past.polite": "먹었어요",
      "past.casual": "먹었어",
      "past.formal_polite.neg": "먹지 않았습니다",
      "past.polite.neg": "안 먹었어요",
      "past.casual.neg": "안 먹었어",
      // Future
      "future.formal_polite": "먹을 겁니다",
      "future.polite": "먹을 거예요",
      "future.casual": "먹을 거야",
      "future.formal_polite.neg": "먹지 않을 겁니다",
      "future.polite.neg": "안 먹을 거예요",
      "future.casual.neg": "안 먹을 거야",
    },
  },
];

/** Lookup helper for the shared conjugation engine. */
export function getVerbByAtomId(atomId: AtomId): KoVerbEntry | undefined {
  return KO_VERB_ENTRIES.find(
    (v) => (`ko:${v.lemma}` as AtomId) === atomId,
  );
}

export const KO_CONJUGATION_FORM_LABELS: Record<KoVerbForm, string> = {
  dictionary: "Dictionary",
  "present.formal_polite": "Present — formal polite (-ㅂ니다)",
  "present.polite": "Present — polite (-요)",
  "present.casual": "Present — casual / banmal",
  "present.plain": "Present — plain (-는다)",
  "present.formal_polite.neg": "Present neg — formal polite (-지 않습니다)",
  "present.polite.neg": "Present neg — polite (안 …요)",
  "present.casual.neg": "Present neg — casual (안 …)",
  "past.formal_polite": "Past — formal polite (-았/었습니다)",
  "past.polite": "Past — polite (-았/었어요)",
  "past.casual": "Past — casual (-았/었어)",
  "past.formal_polite.neg": "Past neg — formal polite",
  "past.polite.neg": "Past neg — polite",
  "past.casual.neg": "Past neg — casual",
  "future.formal_polite": "Future — formal polite (-을 겁니다)",
  "future.polite": "Future — polite (-을 거예요)",
  "future.casual": "Future — casual (-을 거야)",
  "future.formal_polite.neg": "Future neg — formal polite",
  "future.polite.neg": "Future neg — polite",
  "future.casual.neg": "Future neg — casual",
};
