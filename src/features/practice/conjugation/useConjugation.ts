import { useMemo } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { tryGetLanguageModule } from "@/shared/language/registry";
import type { ConjugationTrainerProvider } from "@/shared/conjugation/types";
// Side-effect: registers each language's trainer provider into the module's
// lazy `conjugation.trainer` slot. Kept out of the language modules so the
// heavy provider stack never loads at app init (see shared/conjugation/registry).
import "./providers";

/**
 * Resolves the active learning language's conjugation-trainer provider via
 * `getLanguageModule(id).conjugation.trainer`. `null` means the language ships
 * no trainer (the routes render a graceful empty state).
 */
export function useConjugation(): ConjugationTrainerProvider | null {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  return useMemo(() => tryGetLanguageModule(langId)?.conjugation?.trainer ?? null, [langId]);
}
