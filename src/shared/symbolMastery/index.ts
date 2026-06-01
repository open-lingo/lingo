/**
 * Symbol mastery — generic per-script exposure + struggle engine.
 *
 * The language module supplies the `isSymbol` validator and optional
 * storage prefix; the engine handles the rest (exposure dedup, fade
 * gating, struggle-bucket ranking, cross-tab sync).
 *
 * The JA wrapper at `features/languages/ja/symbolMastery/` re-exports
 * pre-bound versions under the legacy `useKana*` names; today's call
 * sites consume from there.
 */

export { SymbolMasteryProvider, useSymbolMastery } from "./context";
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
