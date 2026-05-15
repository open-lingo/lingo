export type KanaMasteryState = {
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

export type KanaMasteryStore = Record<string, KanaMasteryState>;

/** Helper-hidden gate: 20 exposures AND interval ≥ 7d. AND, not OR. */
export function helperHidden(state: KanaMasteryState | undefined): boolean {
  if (!state) return false;
  return state.exposures >= 20 && state.interval >= 7;
}

export function newMasteryState(kana: string): KanaMasteryState {
  const now = new Date();
  return {
    kana,
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
