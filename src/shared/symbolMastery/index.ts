/**
 * Symbol mastery — generic per-script exposure + struggle engine.
 *
 * The language module supplies the `isSymbol` validator (via
 * `module.symbolMastery.isSymbol`); the engine handles the rest
 * (exposure dedup, fade gating, struggle-bucket ranking, cross-tab
 * sync). Phase 2 (2026-06-01) retired the JA wrapper at
 * `features/languages/ja/symbolMastery/`; today's lesson pages mount
 * `LanguageSymbolMasteryProvider` (which auto-resolves the predicate
 * from the active language module) and consume the generic hooks here.
 */

export {
  SymbolMasteryProvider,
  useSymbolMastery,
  useHasSymbolMastery,
} from "./context";
// `LanguageSymbolMasteryProvider` is exported from its dedicated path
// (`./LanguageSymbolMasteryProvider`) — not re-exported here because it
// imports the central registry, which would pull JA's module into
// every shared/symbolMastery consumer and create import cycles via
// the lesson builder chain.
export { useTrackExposure, useSymbolHelperVisible } from "./hooks";
export type {
  SymbolMasteryState,
  SymbolMasteryStore,
  KanaMasteryState,
  KanaMasteryStore,
} from "./types";
export { helperHidden, newMasteryState } from "./types";

export { useSymbolStruggle, useKanaStruggle } from "./useSymbolStruggle";
export type {
  UseSymbolStruggleResult,
  UseKanaStruggleResult,
} from "./useSymbolStruggle";

export {
  getSymbolStruggleStore,
  recordSymbolStruggle,
  topStruggleSymbols,
  clearSymbolStruggleStore,
  // Back-compat aliases (JA names).
  getKanaStruggleStore,
  recordKanaStruggle,
  topStruggleKana,
  clearKanaStruggleStore,
} from "./struggleStore";
export type {
  SymbolStruggleEntry,
  SymbolStruggleStore,
  KanaStruggleEntry,
  KanaStruggleStore,
  StruggleSignal,
} from "./struggleStore";

export { storageKey, getStore, setStore, clearStore } from "./storage";
