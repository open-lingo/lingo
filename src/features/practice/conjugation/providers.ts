/**
 * Conjugation-trainer provider composition root.
 *
 * Importing this module registers every language's trainer provider (each
 * self-registers via `shared/conjugation/registry`). It is imported ONLY by the
 * (lazy-routed) trainer surface through `useConjugation`, so the providers'
 * heavy runtime stacks load on demand — never at app init. This is the single
 * place the surface references language provider modules; the drill UI files
 * import no per-language linguistics.
 */
import "@/features/languages/ja/conjugation/provider";
import "@/features/languages/ko/conjugationProvider";
