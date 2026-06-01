/**
 * Symbol mastery — per-script exposure tracker that fades learner aids
 * (furigana, romanization, glyph overlays) as a learner reaches the
 * exposure threshold for a given symbol.
 *
 * The "symbol" is whatever the language treats as its atomic script unit
 * (kana for JA, jamo or syllable for KO, etc.). The engine is generic;
 * the language module supplies the symbol validator + storage scope.
 *
 * The `kana` field on `SymbolMasteryState` preserves its name for
 * localStorage shape compat with the pre-extraction JA store. New
 * language modules just use it as the generic symbol surface.
 */

export type SymbolMasteryState = {
  /** The symbol surface (kept as `kana` for storage shape compat). */
  kana: string;
  exposures: number;
  correctCount: number;
  incorrectCount: number;
  streak: number;
  lastSeen: string;
  easeFactor: number;
  interval: number;
  dueDate: string;
};

export type SymbolMasteryStore = Record<string, SymbolMasteryState>;

/** Back-compat aliases for the JA name. */
export type KanaMasteryState = SymbolMasteryState;
export type KanaMasteryStore = SymbolMasteryStore;

/** Helper-hidden gate: 20 exposures AND interval ≥ 7d. AND, not OR. */
export function helperHidden(state: SymbolMasteryState | undefined): boolean {
  if (!state) return false;
  return state.exposures >= 20 && state.interval >= 7;
}

export function newMasteryState(symbol: string): SymbolMasteryState {
  const now = new Date();
  return {
    kana: symbol,
    exposures: 0,
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    lastSeen: now.toISOString(),
    easeFactor: 2.5,
    interval: 0,
    dueDate: now.toISOString().slice(0, 10),
  };
}
