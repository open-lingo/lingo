/**
 * JA symbol-mastery wrapper.
 *
 * Pre-binds the generic `SymbolMasteryProvider` to `isKana` so the JA
 * lesson surface drops in unchanged, and re-exports the engine's hooks
 * under their pre-extraction names (`KanaMasteryProvider`,
 * `useKanaMastery`, `useKanaHelperVisible`).
 *
 * Phase 2 will route this through the `LanguageModule.symbolMastery`
 * slot instead of importing JA's validator directly.
 */
import type { ReactNode } from "react";
import { SymbolMasteryProvider } from "@/shared/symbolMastery";
import { isKana } from "@/shared/japanese/kanaTable";

export function KanaMasteryProvider({
  children,
  userIdOverride,
}: {
  children: ReactNode;
  userIdOverride?: string | null;
}) {
  return (
    <SymbolMasteryProvider isSymbol={isKana} userIdOverride={userIdOverride}>
      {children}
    </SymbolMasteryProvider>
  );
}

export {
  useSymbolMastery as useKanaMastery,
  useSymbolHelperVisible as useKanaHelperVisible,
  useTrackExposure,
  helperHidden,
  newMasteryState,
  useSymbolStruggle as useKanaStruggle,
  getKanaStruggleStore,
  recordKanaStruggle,
  topStruggleKana,
  clearKanaStruggleStore,
} from "@/shared/symbolMastery";

export type {
  SymbolMasteryState as KanaMasteryState,
  SymbolMasteryStore as KanaMasteryStore,
  UseSymbolStruggleResult as UseKanaStruggleResult,
  KanaStruggleEntry,
  KanaStruggleStore,
  StruggleSignal,
} from "@/shared/symbolMastery";
