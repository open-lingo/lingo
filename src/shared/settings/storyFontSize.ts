/**
 * Story-reading text size — ONE persisted preference, two entry points.
 *
 * The learner can change it from Settings (a stacked select) or from the story
 * reader itself (A- / A+). Both go through `useStoryFontSize`, so there is a
 * single source of truth: `settings.learning.storyFontSize`, persisted with the
 * rest of the settings blob and therefore synced per learner across devices.
 *
 * Discrete steps rather than a free slider: a story is long-form reading, so the
 * useful range is "a bit smaller" to "much bigger", and five named stops are
 * easier to land on with two buttons than any continuous value. The stored
 * value is the SCALE (not the index) so the meaning survives a future change to
 * the step list — a blob written by an older client still resolves to the
 * nearest surviving step instead of jumping to an unrelated size.
 *
 * The scale multiplies the story's own type only (target text + its reading
 * aid). Nothing else on the page reads it, so it cannot disturb the library,
 * the quiz, or the app-wide `accessibility.fontSize`.
 */
import { useCallback } from "react";
import { useSettings } from "@/shared/contexts/SettingsContext";

export interface StoryFontStep {
  /** Multiplier applied to the story's base type size. */
  scale: number;
  /** i18n key for the Settings select. */
  labelKey: string;
  /** English fallback for `labelKey`. */
  defaultLabel: string;
}

export const STORY_FONT_STEPS: readonly StoryFontStep[] = [
  { scale: 0.85, labelKey: "settings.storyTextSizeSmall", defaultLabel: "Small" },
  { scale: 1, labelKey: "settings.storyTextSizeDefault", defaultLabel: "Default" },
  { scale: 1.15, labelKey: "settings.storyTextSizeLarge", defaultLabel: "Large" },
  { scale: 1.35, labelKey: "settings.storyTextSizeLarger", defaultLabel: "Larger" },
  { scale: 1.6, labelKey: "settings.storyTextSizeLargest", defaultLabel: "Largest" },
];

/** The step a learner who has never touched the preference reads at. */
export const DEFAULT_STORY_FONT_SCALE = 1;

/**
 * Resolve a stored scale to a step INDEX, snapping to the nearest step. A
 * stored value that is not exactly a step (an older step list, a hand-edited
 * blob) still lands somewhere sensible instead of falling back to default.
 */
export function storyFontStepIndex(scale: number | undefined | null): number {
  if (typeof scale !== "number" || !Number.isFinite(scale)) {
    return STORY_FONT_STEPS.findIndex((s) => s.scale === DEFAULT_STORY_FONT_SCALE);
  }
  let best = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < STORY_FONT_STEPS.length; i++) {
    const delta = Math.abs(STORY_FONT_STEPS[i].scale - scale);
    if (delta < bestDelta) {
      best = i;
      bestDelta = delta;
    }
  }
  return best;
}

export interface StoryFontSize {
  /** Snapped scale to render at — what both entry points display. */
  scale: number;
  /** Index into `STORY_FONT_STEPS`. */
  index: number;
  /** Persist a step by index; out-of-range values are clamped, not ignored. */
  setIndex: (next: number) => void;
  canShrink: boolean;
  canGrow: boolean;
}

/** Read + write the one persisted story text size. */
export function useStoryFontSize(): StoryFontSize {
  const { settings, updateSetting } = useSettings();
  const index = storyFontStepIndex(settings.learning.storyFontSize);

  const setIndex = useCallback(
    (next: number) => {
      const clamped = Math.min(STORY_FONT_STEPS.length - 1, Math.max(0, next));
      updateSetting("learning.storyFontSize", STORY_FONT_STEPS[clamped].scale);
    },
    [updateSetting],
  );

  return {
    scale: STORY_FONT_STEPS[index].scale,
    index,
    setIndex,
    canShrink: index > 0,
    canGrow: index < STORY_FONT_STEPS.length - 1,
  };
}
