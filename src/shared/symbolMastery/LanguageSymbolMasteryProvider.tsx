/**
 * Drop-in provider that wires `SymbolMasteryProvider` to the active
 * language's `module.symbolMastery.isSymbol` predicate. Lesson and
 * preview pages mount this — they don't need to know which language
 * supplies the predicate.
 *
 * When the active language has no `symbolMastery` capability (no
 * tracked script — e.g. ES under current design), the provider renders
 * its children with an inert no-op predicate. The downstream hooks
 * still resolve from the context; the helper-fade just never gates
 * (every symbol always shows its helper).
 */
import type { ReactNode } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { tryGetLanguageModule } from "@/shared/language/registry";
import { SymbolMasteryProvider } from "./context";

const ALWAYS_TRUE_PREDICATE = (_s: string): boolean => true;

export function LanguageSymbolMasteryProvider({
  children,
  userIdOverride,
}: {
  children: ReactNode;
  userIdOverride?: string | null;
}) {
  // Defensive: if no LanguageProvider is mounted (tests, Storybook),
  // default to JA so the existing JA lesson player keeps rendering.
  let langId = "ja";
  try {
    const { language } = useLanguage();
    if (language?.id) langId = language.id;
  } catch {
    /* no provider */
  }
  const module = tryGetLanguageModule(langId);
  const isSymbol = module?.symbolMastery?.isSymbol ?? ALWAYS_TRUE_PREDICATE;
  return (
    <SymbolMasteryProvider isSymbol={isSymbol} userIdOverride={userIdOverride}>
      {children}
    </SymbolMasteryProvider>
  );
}
