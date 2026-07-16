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
 * In-flight `<audio>` clips started via `playLocalAudio`. Tracked so an
 * app-level cutoff (advancing a lesson step / leaving a lesson — see
 * `stopAllAudio` in `shared/tts`) can pause them mid-play instead of
 * letting a per-word/alphabet clip bleed into the next step. Elements
 * self-remove on `ended`/`error`.
 */
const activeLocalAudio = new Set<HTMLAudioElement>();

/**
 * HTMLAudioElement playback wrapper. Use instead of `new Audio(url).play()`
 * so the global volume slider takes effect on this audio.
 */
export function playLocalAudio(url: string): HTMLAudioElement | null {
  if (!url) return null;
  const audio = new Audio(url);
  audio.volume = currentVolume;
  activeLocalAudio.add(audio);
  const drop = () => activeLocalAudio.delete(audio);
  audio.addEventListener("ended", drop, { once: true });
  audio.addEventListener("error", drop, { once: true });
  audio.play().catch(() => {});
  return audio;
}

/**
 * Pause + drop every in-flight `playLocalAudio` clip. Part of the app-wide
 * audio cutoff on lesson step-advance / unmount (see `stopAllAudio`).
 */
export function stopLocalAudio(): void {
  for (const audio of activeLocalAudio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Detached / not seekable — ignore.
    }
  }
  activeLocalAudio.clear();
}
