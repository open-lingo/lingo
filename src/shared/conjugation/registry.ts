/**
 * Tiny, dependency-free registry of conjugation-trainer providers.
 *
 * WHY this indirection: the trainer providers pull heavy runtime stacks (JA
 * pulls the grammar-SRS + grammar-review-pool + atom-index chain). Importing a
 * provider EAGERLY from a language `module.ts` — which the language registry
 * loads at app init — creates an import cycle that poisons the memoized
 * curriculum. Instead, `module.conjugation.trainer` is a lazy getter reading
 * this registry, and each provider self-registers when its module is first
 * imported. The providers are imported only by the (lazy-routed) trainer
 * surface via `features/practice/conjugation/providers.ts`, so the heavy stack
 * loads on demand and app init stays light.
 *
 * This module intentionally imports ONLY the provider type.
 */
import type { ConjugationTrainerProvider } from "./types";

const REGISTRY = new Map<string, ConjugationTrainerProvider>();

export function registerConjugationTrainer(
  languageId: string,
  provider: ConjugationTrainerProvider,
): void {
  REGISTRY.set(languageId, provider);
}

export function getRegisteredTrainer(
  languageId: string,
): ConjugationTrainerProvider | undefined {
  return REGISTRY.get(languageId);
}
