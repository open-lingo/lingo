/**
 * Portuguese (Brazilian) conjugation tables — scaffold, zero verbs.
 *
 * Mirrors `es/conjugationTables.ts` structurally (entry shape, `forms`
 * keyed by `<tense>.<person>`), with BR's own person axis: `você`, not
 * `tu`/`vós` (docs/pt-course-design-2026-09-18.md §3 — the course is
 * BR-only, and BR speech defaults to `você` almost universally; a future
 * EU config pass is the place `tu`/`vós` would be added, not here). Design
 * doc's m1–m3 rollout: ser/estar/ter (m1 sg. ser + -ar present; m2 -er +
 * ficar; m3 -ir + contractions layer 2) — no verb ships without a row here
 * (the rule ES's E12 established: no hand-written paradigm in a step).
 *
 * EMPTY on purpose (scaffolding lane, no lesson content) — the first
 * authoring wave (m1: ser/estar/ter + -ar present) populates
 * `PT_VERB_ENTRIES`.
 */
import type { AtomId } from "@/shared/language/types";

export type PtVerbForm =
  // Presente
  | "present.eu"
  | "present.voce"
  | "present.ele"
  | "present.nos"
  | "present.voces";

export type PtVerbEntry = {
  id: string;
  lemma: string;
  meaning: string;
  /** Conjugation class — -ar/-er/-ir per design doc §3's rollout order,
   *  plus "irregular" (ser/estar/ter/ir land here first). */
  group: "ar" | "er" | "ir" | "irregular";
  forms: Record<PtVerbForm, string>;
  introducedAtModule: number;
};

export const PT_VERB_ENTRIES: PtVerbEntry[] = [];

export function getVerbByAtomId(atomId: AtomId): PtVerbEntry | undefined {
  const bare = atomId.startsWith("pt:") ? atomId.slice(3) : atomId;
  return PT_VERB_ENTRIES.find((v) => v.lemma === bare);
}
