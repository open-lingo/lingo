/**
 * TTS audio resolver + playback.
 *
 * The Python pipeline writes mp3s into `lingo/src/pub/tts/<lang>/<hash>.mp3`
 * and a flat `manifest.json` keyed by `"<lang>:<text>"`. Vite serves the
 * `src/pub/` directory at the root path so the manifest values are usable
 * directly as URLs.
 *
 * Playback uses **Web Audio API** (AudioBufferSourceNode), not
 * HTMLAudioElement. For short clips (~300ms–1.5s) this avoids:
 *   - MP3 encoder/decoder priming delay clicks (decodeAudioData trims them)
 *   - the "ended event may not fire" Chromium issue (chromium#40354418)
 *   - HTMLAudioElement.play() racing the preload (clip starts mid-decode)
 *   - GC mid-playback for unrooted Audio() instances
 *
 * AudioContext is created lazily and unlocked on the first user gesture
 * (required by Chrome autoplay policy + iOS Safari). After unlock, all
 * subsequent playback — including 350ms-after-mount autoplay — works
 * reliably regardless of how it was triggered.
 */
import { useEffect } from "react";
import manifest from "../../pub/tts/manifest.json";

const MANIFEST = manifest as Record<string, string | string[]>;

function pickPath(entry: string | string[] | undefined): string | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (entry.length === 0) return null;
  return entry[Math.floor(Math.random() * entry.length)];
}

export function getTtsUrl(text: string, lang: string = "ja"): string | null {
  if (!text) return null;
  const key = `${lang}:${text}`;
  const relative = pickPath(MANIFEST[key]);
  if (!relative) return null;
  return `/${relative}`;
}

export function hasTtsAudio(text: string, lang: string = "ja"): boolean {
  return Boolean(MANIFEST[`${lang}:${text}`]);
}

// ---------------------------------------------------------------------------
// Web Audio context — lazy + gesture-unlocked.
// ---------------------------------------------------------------------------

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/**
 * Resume the AudioContext on the first user gesture in the tab. Required
 * because:
 *   - Chrome blocks AudioContext.start() without prior user interaction
 *     (autoplay policy).
 *   - iOS Safari leaves new AudioContexts in "suspended" state until a
 *     touchstart/click resumes them.
 *
 * Idempotent — once unlocked, subsequent gestures are no-ops. The listener
 * removes itself after first fire.
 */
function unlockOnFirstGesture(): void {
  if (unlocked) return;
  const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
  const handler = () => {
    const c = getContext();
    if (c && c.state === "suspended") {
      void c.resume();
    }
    unlocked = true;
    for (const ev of events) window.removeEventListener(ev, handler);
  };
  for (const ev of events) {
    window.addEventListener(ev, handler, { once: false, passive: true });
  }
}

if (typeof window !== "undefined") {
  unlockOnFirstGesture();
}

// ---------------------------------------------------------------------------
// Decode + cache. AudioBuffers are reusable — one decode per unique URL.
// ---------------------------------------------------------------------------

const bufferCache = new Map<string, AudioBuffer>();
const inflight = new Map<string, Promise<AudioBuffer>>();

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const c = getContext();
  if (!c) return null;
  const cached = bufferCache.get(url);
  if (cached) return cached;
  const pending = inflight.get(url);
  if (pending) return pending;

  const p = (async () => {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    // Chromium prefers the promise form; older Safari only honored the
    // callback form, but we target current evergreens.
    const buf = await c.decodeAudioData(arr);
    bufferCache.set(url, buf);
    inflight.delete(url);
    return buf;
  })();
  inflight.set(url, p);
  try {
    return await p;
  } catch (e) {
    inflight.delete(url);
    console.warn("[tts] decodeAudioData failed:", url, e);
    return null;
  }
}

/**
 * Start a fresh AudioBufferSourceNode for `buffer` and start it. The node
 * is automatically eligible for GC once playback ends — no keep-alive Set
 * required (the Web Audio runtime owns the lifecycle).
 */
function playBuffer(buffer: AudioBuffer): void {
  const c = getContext();
  if (!c) return;
  // If still suspended (no gesture yet this session), attempt resume but
  // don't block playback — start() is queued by the Web Audio runtime.
  if (c.state === "suspended") {
    void c.resume();
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(c.destination);
  src.start();
}

// ---------------------------------------------------------------------------
// Public play API.
// ---------------------------------------------------------------------------

export async function playJaAudio(text: string, lang: string = "ja"): Promise<void> {
  const url = getTtsUrl(text, lang);
  if (!url) return;
  const buf = await loadBuffer(url);
  if (!buf) return;
  playBuffer(buf);
}

/** StrictMode-safe dedupe: one play per (text, key) pair per session. */
const playedAutoKeys = new Set<string>();

export async function autoPlayJaAudio(
  text: string | undefined,
  playbackKey: string,
  lang: string = "ja",
): Promise<void> {
  if (!text) return;
  const url = getTtsUrl(text, lang);
  if (!url) return;
  const key = `${playbackKey}:${lang}:${text}`;
  if (playedAutoKeys.has(key)) return;
  playedAutoKeys.add(key);
  const buf = await loadBuffer(url);
  if (!buf) return;
  playBuffer(buf);
}

/**
 * React hook: after `delayMs` (default 350), play the TTS for `text`.
 *
 * StrictMode-safe: each (text, playbackKey) plays once per session.
 * If the component unmounts before the delay elapses, the play is cancelled
 * — but a play that has already started keeps running because the Web Audio
 * runtime owns the source node lifecycle.
 *
 * The decoded AudioBuffer is module-cached, so repeat plays of the same
 * URL across the session are zero-cost after the first decode.
 */
export function useAutoPlayJaAudio(
  text: string | undefined,
  playbackKey: string,
  delayMs: number = 350,
): void {
  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      void autoPlayJaAudio(text, playbackKey);
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text, playbackKey, delayMs]);
}
