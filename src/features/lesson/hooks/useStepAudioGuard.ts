/**
 * Cross-step "is this still the on-screen step" guard for manual audio
 * playback (TestFlight #127, 2026-09-15).
 *
 * `PlacementTestPage.tsx` already narrows this race at the page boundary:
 * the advance effect calls `stopAllAudio()` the instant the engine picks
 * the next item, and a follow-up effect re-asserts it once the next item
 * has actually MOUNTED. That closes the gap for anything already playing
 * BEFORE the step changed. It does NOT close the gap for a play that was
 * only TAPPED before the step changed: `playJaAudio` / `playJaAudioToEnd`
 * are async (network fetch + decode for a cold clip), a tap right before
 * submit can still be in flight when both of those page-level stops fire,
 * and the clip then starts (or keeps queuing) on the NEW step once the
 * fetch resolves.
 *
 * A step view can't answer "am I still current?" from its own props or
 * refs — `LessonPage` / `PlacementTestPage` mount `<StepRenderer
 * key={step.id}>`, so a step view is always fully UNMOUNTED and replaced
 * on step change, never updated in place. Its own closures/refs die with
 * it; whatever mounted next has no way to reach back and tell the old
 * instance to stop. This lives outside the component tree for exactly
 * that reason — a module-level value that survives the unmount.
 *
 * Usage: call `useCurrentStepId(step.id)` once, at the top of any step
 * view that plays audio on a tap (or a timer) the learner can outrun.
 * Route every such `playJaAudio` / `playJaAudioToEnd` call through
 * `playStepAudio` / `playStepAudioToEnd` instead of calling the shared
 * TTS functions directly.
 */
import { useEffect } from "react";
import {
  playJaAudio,
  playJaAudioToEnd,
  stopAllAudio,
  type PlaybackResult,
  type VoiceColor,
} from "@/shared/tts";

let activeStepId: string | null = null;

/** Registers `stepId` as the on-screen step. One call per step view,
 *  unconditionally (not just on the audio-owning branch) — the guard
 *  needs to see EVERY step mount, not only the ones that happen to play
 *  audio, or an audio-less step in between would leave a stale id behind. */
export function useCurrentStepId(stepId: string): void {
  useEffect(() => {
    activeStepId = stepId;
    // Deliberately no cleanup: tearing this back to null on unmount would
    // race the NEXT step's own mount (whichever commits last wins), and
    // "no active step" is never the state we want mid-transition anyway —
    // the next step's mount effect is what's supposed to advance this.
  }, [stepId]);
}

/** True while `stepId` is still the on-screen step. Exported for tests and
 *  for call sites that need the check without a `playJaAudio` call. */
export function isStepStillCurrent(stepId: string): boolean {
  return activeStepId === stepId;
}

/**
 * `playJaAudio`, silenced if `stepId` is no longer the on-screen step by
 * the time the clip resolves. Returns `null` on staleness (instead of the
 * real `PlaybackResult`) so a caller can skip whatever it would otherwise
 * have done with the result (e.g. `setAudioSilent`) — a stale play is a
 * no-op, not a partial success.
 */
export async function playStepAudio(
  text: string,
  stepId: string,
  lang?: string,
): Promise<PlaybackResult | null> {
  const result = await playJaAudio(text, lang);
  if (!isStepStillCurrent(stepId)) {
    // The clip may have already started (playJaAudio's promise resolves
    // once playback begins, not once it ends) — cut it immediately rather
    // than let it run out on a screen it no longer belongs to.
    stopAllAudio();
    return null;
  }
  return result;
}

/**
 * `playJaAudioToEnd`, gated the same way. Its promise resolves only once
 * the clip FINISHES, so by the time this can detect staleness the clip
 * has already played out in full — this cannot prevent THAT clip's bleed
 * (nothing outside `shared/tts` can, short of a cancellable-playback API
 * there — out of scope here). What it DOES do: report staleness so a
 * caller sequencing several lines (dialogue) stops queuing the next one,
 * and calls `stopAllAudio()` as a backstop in case playback is still
 * mid-flight for any reason.
 */
export async function playStepAudioToEnd(
  text: string,
  stepId: string,
  lang?: string,
  voice?: VoiceColor,
): Promise<boolean> {
  await playJaAudioToEnd(text, lang, voice);
  if (!isStepStillCurrent(stepId)) {
    stopAllAudio();
    return false;
  }
  return true;
}
