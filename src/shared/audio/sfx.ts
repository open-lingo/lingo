/**
 * Tiny UI sound-effects layer for non-musical interaction feedback (the
 * passive-card "advance" chirp, etc.). Distinct from `playJaAudio` (TTS)
 * and `playLocalAudio` (per-word vocab clips): sfx are short, ambient, and
 * not pedagogically meaningful — they exist purely to give passive cards a
 * non-progress acknowledgement so learners feel the tap landed without
 * believing they "did" anything.
 *
 * Assets live under `public/audio/sfx/<name>.mp3`. If the asset is missing
 * (chirp not yet produced) `audio.play().catch(() => {})` silently no-ops
 * — callers don't need to feature-detect.
 *
 * Honors the app-wide volume slider via `volume.ts`. A light 10ms haptic
 * fires on mobile when `navigator.vibrate` is available.
 */
import { getAudioVolume } from "./volume";

export type SfxName = "passive-advance";

const sfxCache = new Map<SfxName, HTMLAudioElement>();

export function playSfx(name: SfxName): void {
  let audio = sfxCache.get(name);
  if (!audio) {
    audio = new Audio(`/audio/sfx/${name}.mp3`);
    sfxCache.set(name, audio);
  }
  // SFX sit at 40% of the global volume — they're a feedback ping, not a
  // foreground sound. Re-stamp on every play in case the user moved the
  // slider since cache.
  audio.volume = Math.min(1, Math.max(0, getAudioVolume() * 0.4));
  audio.currentTime = 0;
  audio.play().catch(() => {});
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Permissions / disabled — ignore.
    }
  }
}
