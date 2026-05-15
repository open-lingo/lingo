export { KanaMasteryProvider, useKanaMastery } from "./context";
export { useTrackExposure, useKanaHelperVisible } from "./hooks";
export type {
  KanaMasteryState,
  KanaMasteryStore,
} from "./types";
export { helperHidden } from "./types";

// Struggle store (alphabet-streamline: pre-FSRS difficulty signal)
export { useKanaStruggle } from "./useKanaStruggle";
export type { UseKanaStruggleResult } from "./useKanaStruggle";
export {
  getKanaStruggleStore,
  recordKanaStruggle,
  topStruggleKana,
  clearKanaStruggleStore,
} from "./struggleStore";
export type {
  KanaStruggleEntry,
  KanaStruggleStore,
  StruggleSignal,
} from "./struggleStore";
