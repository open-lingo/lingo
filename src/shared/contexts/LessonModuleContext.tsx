import { createContext, useContext } from "react";

/**
 * The module index (1-based, per `ja-m{N}`) of the lesson currently being
 * rendered — or `null` when nothing lesson-scoped is on screen (practice
 * decks, previews, standalone reading surfaces).
 *
 * It exists so render-time gates can consult where the learner *is right now*
 * instead of only a persisted setting. The romaji ladder is the motivating
 * case: `hiraganaRomajiAutoOff` is a one-shot flag flipped only when an M7+
 * lesson is COMPLETED, so opening a late lesson without having crossed that
 * finish handler (QA jump, deep link, isolated draft review) leaves the flag
 * false and romaji leaks. Providing the current module lets the gate treat
 * "you are in module N ≥ threshold" as equivalent to the flag — WITHOUT
 * touching the deliberate escape hatches (see `romajiVisibleForScript`).
 *
 * Default `null` means "unknown module", which every consumer must treat as
 * "fall back to the stored settings exactly as before" — so surfaces outside
 * a lesson keep their current behavior with no provider present.
 */
const LessonModuleContext = createContext<number | null>(null);

export function LessonModuleProvider({
  moduleIndex,
  children,
}: {
  moduleIndex: number | null;
  children: React.ReactNode;
}) {
  return (
    <LessonModuleContext.Provider value={moduleIndex}>
      {children}
    </LessonModuleContext.Provider>
  );
}

/** Current lesson's module index, or `null` outside a lesson. Never throws. */
export function useLessonModuleIndex(): number | null {
  return useContext(LessonModuleContext);
}
