/**
 * TTS audio resolver. The Python pipeline writes mp3s into
 * `lingo/src/pub/tts/<lang>/<hash>.mp3` and a flat `manifest.json` keyed by
 * `"<lang>:<text>"`. Vite serves the `src/pub/` directory at the root path,
 * so the manifest values are usable directly as URLs.
 */
import manifest from "../../pub/tts/manifest.json";

/**
 * Manifest values are either a single string (single voice) or an array
 * (multiple voices). The resolver normalizes and picks at random per call
 * so the learner is exposed to both speakers across a session.
 */
const MANIFEST = manifest as Record<string, string | string[]>;

function pickPath(entry: string | string[] | undefined): string | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (entry.length === 0) return null;
  return entry[Math.floor(Math.random() * entry.length)];
}

/**
 * Resolve a TTS URL for a (text, lang) pair. Returns `null` when no audio
 * exists yet — callers should hide the play button rather than 404.
 *
 * When the manifest entry holds multiple voice variants (e.g. NanamiNeural
 * + KeitaNeural for Japanese), one is picked at random per call so the
 * learner builds tolerance for different speakers across a session.
 */
export function getTtsUrl(text: string, lang: string = "ja"): string | null {
  if (!text) return null;
  const key = `${lang}:${text}`;
  const relative = pickPath(MANIFEST[key]);
  if (!relative) return null;
  // Manifest stores `tts/ja/<hash>.mp3`; serve from public root.
  return `/${relative}`;
}

export function hasTtsAudio(text: string, lang: string = "ja"): boolean {
  return Boolean(MANIFEST[`${lang}:${text}`]);
}

/** Auto-play with the same StrictMode dedupe pattern as alphabetAudio. */
const playedAutoKeys = new Set<string>();

/**
 * Active Audio elements held until playback completes. Without this set,
 * the unrooted `new Audio(...)` instance can be garbage-collected mid-
 * playback in Chromium when no DOM node references it — manifesting as
 * audio that cuts off after ~0.5s for short clips. Keeping a reference
 * until `ended` / `error` fires guarantees full playback.
 */
const activeAudio = new Set<HTMLAudioElement>();

function playUntilDone(url: string): HTMLAudioElement {
  const audio = new Audio(url);
  activeAudio.add(audio);
  const release = () => {
    activeAudio.delete(audio);
    audio.removeEventListener("ended", release);
    audio.removeEventListener("error", release);
  };
  audio.addEventListener("ended", release);
  audio.addEventListener("error", release);
  audio.play().catch(() => release());
  return audio;
}

export function playJaAudio(text: string, lang: string = "ja"): void {
  const url = getTtsUrl(text, lang);
  if (!url) return;
  playUntilDone(url);
}

export function autoPlayJaAudio(
  text: string | undefined,
  playbackKey: string,
  lang: string = "ja",
): void {
  if (!text) return;
  const url = getTtsUrl(text, lang);
  if (!url) return;
  const key = `${playbackKey}:${lang}:${text}`;
  if (playedAutoKeys.has(key)) return;
  playedAutoKeys.add(key);
  playUntilDone(url);
}

/**
 * React hook: 500ms after the component mounts (per the locked "give the
 * step UI a beat before hitting them with audio" pattern), play the TTS
 * for `text`. StrictMode-safe: each (text, playbackKey) pair fires once.
 *
 * Provide a stable `playbackKey` per step (the step id is ideal). Re-mounts
 * with the same key are deduped within the session.
 */
import { useEffect } from "react";

export function useAutoPlayJaAudio(
  text: string | undefined,
  playbackKey: string,
  delayMs: number = 350,
): void {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => {
      autoPlayJaAudio(text, playbackKey);
    }, delayMs);
    return () => clearTimeout(t);
  }, [text, playbackKey, delayMs]);
}
