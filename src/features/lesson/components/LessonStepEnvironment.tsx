import type { ReactNode } from "react";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { useHasSymbolMastery } from "@/shared/symbolMastery";
import { LanguageSymbolMasteryProvider } from "@/shared/symbolMastery/LanguageSymbolMasteryProvider";

/**
 * The context a `StepRenderer` needs to render a step the way a lesson does.
 *
 * Every script-ladder gate that decides whether romaji or furigana shows is
 * a RENDER-time read of one of two contexts:
 *
 *   - `LessonModuleProvider` — where the learner is right now. The romaji
 *     ladder retires hiragana at M7 and katakana at M17, and the persisted
 *     `hiraganaRomajiAutoOff` flag only flips when an M7+ lesson is
 *     COMPLETED. Any surface that renders module content without crossing
 *     that finish handler reads the flag as false and leaks romaji.
 *   - `LanguageSymbolMasteryProvider` — the per-symbol helper fade. Absent,
 *     `useSymbolMastery` falls back to a NOOP whose `isHelperHidden` is
 *     always false, so every kana keeps its romaji forever and exposures
 *     stop counting toward mastery.
 *
 * Both were mounted by `LessonPage` and by nothing else, so the test-out
 * (`PlacementTestPage`) — which renders the module's OWN lesson steps —
 * rendered them under neither. Spencer 2026-08-18: *"check the furigana and
 * romaji displays inside the test outs, doesnt seem they respect it the same
 * as normal lessons."* An m31 test-out showed 「先生に 辞書を いただいた」
 * with romaji over the kana (`ni`, `o`, `i ta da i ta`) that the same step
 * in the same module's lesson does not show.
 *
 * Bundling them means a step-rendering surface opts into the whole ladder or
 * none of it, instead of picking up whichever providers its page happened to
 * mount.
 *
 * `moduleIndex` is 1-based (`parseModuleIndex`), or 0/null when the caller
 * genuinely has no module — outside-a-lesson surfaces keep settings-only
 * behavior, which is the documented default of `LessonModuleContext`.
 */
export function LessonStepEnvironment({
  moduleIndex,
  children,
}: {
  moduleIndex: number | null;
  children: ReactNode;
}) {
  // Mount the mastery provider only when one is not already above us.
  // Nesting is NOT harmless: each instance keeps its own `useState` copy of
  // the store and persists it to the same localStorage key, so two mounted
  // copies drift and the inner one's writes clobber the outer one's. This is
  // why `LessonPage` — which mounts the mastery provider around the whole
  // page, not just the step — can adopt this component without changing that
  // provider's scope.
  const hasSymbolMastery = useHasSymbolMastery();
  const withModule = (
    <LessonModuleProvider moduleIndex={moduleIndex}>
      {children}
    </LessonModuleProvider>
  );
  return hasSymbolMastery ? (
    withModule
  ) : (
    <LanguageSymbolMasteryProvider>{withModule}</LanguageSymbolMasteryProvider>
  );
}
