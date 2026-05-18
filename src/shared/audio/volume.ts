/**
 * App-wide audio volume.
 *
 * Single source of truth for the user-facing "App volume" slider in
 * settings. Two playback paths feed off it:
 *
 *   1. Web Audio (TTS) — `tts.ts` connects every source through a shared
 *      GainNode that subscribes to volume changes here.
 *   2. HTMLAudioElement (alphabet mp3s, listening clips) — call sites use
 *      `playLocalAudio` instead of `new Audio(url).play()`; the helper
 *      stamps `audio.volume` before play.
 *
 * Range: 0..1. Persisted via `settings.audio.volume`; SettingsContext
 * pushes the current setting into this module on mount + on change.
 */

let currentVolume = 1;
const listeners = new Set<(volume: number) => void>();

export function getAudioVolume(): number {
  return currentVolume;
}

export function setAudioVolume(volume: number): void {
  const clamped = Math.min(1, Math.max(0, volume));
  if (clamped === currentVolume) return;
  currentVolume = clamped;
  for (const cb of listeners) cb(clamped);
}

/** Subscribe to volume changes. Fires immediately with the current value. */
export function subscribeAudioVolume(cb: (volume: number) => void): () => void {
  listeners.add(cb);
  cb(currentVolume);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * HTMLAudioElement playback wrapper. Use instead of `new Audio(url).play()`
 * so the global volume slider takes effect on this audio.
 */
export function playLocalAudio(url: string): HTMLAudioElement | null {
  if (!url) return null;
  const audio = new Audio(url);
  audio.volume = currentVolume;
  audio.play().catch(() => {});
  return audio;
}
