/**
 * Conjugation Trainer — combo (stacked) forms data layer (v1.2 addendum, Task 6).
 *
 * Pure. Which stacked chain form a SET of selected base tiles unlocks. Sets are
 * tile ids (`TrainerTypeId`). The engine (`conjugationEngine.ts`) already
 * conjugates every chain form listed here, and the distractor generators
 * already handle each one — so this file adds NO conjugation/distractor logic,
 * only the tile-set → form mapping.
 */
import type { ChainForm, IAdjForm } from "@/features/languages/ja/conjugationEngine";
import type { TrainerTypeId } from "./trainerRegistry";

/** Which pool + conjugator the combo drills. An entry never mixes categories —
 *  verb combos conjugate verbs, i-adj combos conjugate adjectives. */
export type ComboEntry =
  | { tiles: TrainerTypeId[]; category: "verb"; form: ChainForm; label: string }
  | { tiles: TrainerTypeId[]; category: "i-adj"; form: IAdjForm; label: string };

/**
 * Every stacked form and the exact set of base tiles that must ALL be selected
 * to unlock it. The nai/ta tiles act as semantic "negative"/"past" ingredients
 * even where the surface morphology differs (ません has no ない in it; くなかった
 * builds on the い tile's own く-stem) — same precedent as the masu stacks.
 */
export const COMBO_MAP: ComboEntry[] = [
  { tiles: ["ta-form", "nai-form"], category: "verb", form: "nai-past", label: "ない form (past)" }, // みなかった
  { tiles: ["v-tai", "nai-form"], category: "verb", form: "tai-neg", label: "たい form (negative)" }, // みたくない
  { tiles: ["v-tai", "ta-form"], category: "verb", form: "tai-past", label: "たい form (past)" }, // みたかった
  { tiles: ["v-tai", "nai-form", "ta-form"], category: "verb", form: "tai-neg-past", label: "たい form (negative past)" }, // みたくなかった
  { tiles: ["masu", "nai-form"], category: "verb", form: "masu-neg", label: "polite negative" }, // みません
  { tiles: ["masu", "ta-form"], category: "verb", form: "masu-past", label: "polite past" }, // みました
  { tiles: ["masu", "nai-form", "ta-form"], category: "verb", form: "masu-past-neg", label: "polite negative past" }, // みませんでした
  // い-adjective stacks (the い tile's base is the く-stem negative; see registry).
  { tiles: ["i-adj-forms", "ta-form"], category: "i-adj", form: "past", label: "い-adjective past" }, // たかかった
  { tiles: ["i-adj-forms", "nai-form", "ta-form"], category: "i-adj", form: "past-negative", label: "い-adjective negative past" }, // たかくなかった
];

/** Every COMBO_MAP entry whose tile set is a subset of the current selection. */
export function combosForSelection(selected: ReadonlySet<TrainerTypeId>): ComboEntry[] {
  return COMBO_MAP.filter((entry) => entry.tiles.every((tile) => selected.has(tile)));
}

/**
 * Can `tile` join the current selection on a path toward SOME combo — i.e. is
 * the grown selection still a subset of at least one COMBO_MAP entry? Drives
 * the hub's greying: with a selection active, tiles that can't pair are
 * dimmed/unclickable (Spencer 2026-07-02). Always true for an empty selection
 * (any single tile trains solo) and for already-selected tiles (deselect).
 */
export function canExtendSelection(
  selected: ReadonlySet<TrainerTypeId>,
  tile: TrainerTypeId,
): boolean {
  if (selected.size === 0 || selected.has(tile)) return true;
  return COMBO_MAP.some((entry) => {
    const set = new Set(entry.tiles);
    return set.has(tile) && [...selected].every((s) => set.has(s));
  });
}
