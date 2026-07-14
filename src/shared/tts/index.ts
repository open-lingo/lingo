/**
 * TTS audio resolver + playback.
 *
 * Language-agnostic by behavior: callers pass `lang` (default `"ja"`) and
 * we look up `"<lang>:<text>"` in a flat manifest. Today the only manifest
 * shipped is the JA one (see manifest import below); Phase 4 will swap this
 * for a per-language manifest registry. The public API + symbol names stay
 * stable across that migration.
 *
 * Moved from `shared/japanese/tts.ts` in Phase 1 step 1 of the multilang
 * dedup initiative — the resolver itself never needed to live under
 * `japanese/`. See `dev/architecture/2026-06-01-multilang-parity-and-dedup.md`.
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
// One-language stopgap: this is the JA-only manifest today. Phase 4 swaps
// this for a per-language manifest registry resolved via `lang`. Until
// then, `getTtsUrl(text, "ko")` will simply miss (returns null), same as
// any other unknown key.
import manifest from "../../pub/tts/manifest.json";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { getAudioVolume, subscribeAudioVolume } from "@/shared/audio/volume";

const MANIFEST = manifest as Record<string, string | string[]>;

function pickPath(entry: string | string[] | undefined): string | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (entry.length === 0) return null;
  return entry[Math.floor(Math.random() * entry.length)];
}

/**
 * Single katakana glyph → its hiragana twin (ア→あ). The two scripts are
 * sound-identical, and the pipeline has only ever generated per-glyph
 * clips for hiragana — so a lone katakana lookup falls back to the
 * hiragana recording rather than silence. Whole WORDS never take this
 * path (loanwords get real katakana-keyed clips); the length===1 guard
 * keeps it that way.
 */
function hiraganaTwin(text: string): string | null {
  if (Array.from(text).length !== 1) return null;
  const code = text.charCodeAt(0);
  // ァ..ヶ (U+30A1–U+30F6) map onto ぁ..ゖ at a fixed −0x60 offset.
  if (code < 0x30a1 || code > 0x30f6) return null;
  return String.fromCharCode(code - 0x60);
}

export function getTtsUrl(text: string, lang: string = "ja"): string | null {
  if (!text) return null;
  const key = `${lang}:${text}`;
  let relative = pickPath(MANIFEST[key]);
  if (!relative) {
    const alt = text.endsWith("。") ? text.slice(0, -1) : `${text}。`;
    relative = pickPath(MANIFEST[`${lang}:${alt}`]);
  }
  if (!relative && lang === "ja") {
    const twin = hiraganaTwin(text);
    if (twin) relative = pickPath(MANIFEST[`${lang}:${twin}`]);
  }
  if (!relative) return null;
  return `/${relative}`;
}

export function hasTtsAudio(text: string, lang: string = "ja"): boolean {
  return getTtsUrl(text, lang) !== null;
}

// ---------------------------------------------------------------------------
// Web Audio context — lazy + gesture-unlocked.
// ---------------------------------------------------------------------------

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let unlocked = false;
let volumeSubscribed = false;

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
 * Shared GainNode that sits between every source and the destination so
 * the app-wide volume slider can attenuate TTS output. Created lazily on
 * first use and subscribed once to the volume module so changes propagate
 * immediately (no re-render needed in views).
 */
function getGain(): GainNode | null {
  const c = getContext();
  if (!c) return null;
  if (!gain) {
    gain = c.createGain();
    gain.gain.value = getAudioVolume();
    gain.connect(c.destination);
  }
  if (!volumeSubscribed) {
    volumeSubscribed = true;
    subscribeAudioVolume((v) => {
      if (gain) gain.gain.value = v;
    });
  }
  return gain;
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
  const out = getGain() ?? c.destination;
  src.connect(out);
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

/**
 * Play `text` and resolve when the clip FINISHES (manifest miss resolves
 * immediately). Sequencers chain on this — dialogue_listen previously
 * scheduled turns off a 70ms/char estimate, roughly half Nanami's real
 * pace, so turns played over each other (QA 2026-07-13). The
 * duration-based fallback keeps a suspended AudioContext (no user
 * gesture yet) from hanging a sequence forever.
 */
/** Local voice coloring for dialogue speakers: one corpus voice (Nanami)
 *  plays every line, so multi-speaker exchanges were indistinguishable by
 *  ear (Spencer QA 2026-07-13). detune (cents) + playbackRate resample
 *  the clip — small values read as "another person" without chipmunk
 *  artifacts. Real second-voice clips are the phase-2 fix. */
export type VoiceColor = { detuneCents?: number; playbackRate?: number };

export async function playJaAudioToEnd(
  text: string,
  lang: string = "ja",
  voice: VoiceColor = {},
): Promise<void> {
  const url = getTtsUrl(text, lang);
  if (!url) return;
  const buf = await loadBuffer(url);
  if (!buf) return;
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") {
    void c.resume();
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  if (voice.playbackRate) src.playbackRate.value = voice.playbackRate;
  if (voice.detuneCents && src.detune) src.detune.value = voice.detuneCents;
  src.connect(getGain() ?? c.destination);
  const rate = voice.playbackRate ?? 1;
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    src.onended = finish;
    setTimeout(finish, Math.ceil((buf.duration / rate) * 1000) + 1500);
    src.start();
  });
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
 *
 * Honors `audio.silentMode` (Settings → Audio). When silent mode is on
 * the hook is a no-op. This is the **only** gate point for silent mode —
 * direct `playJaAudio` calls (tap-to-play on speaker / mic buttons) stay
 * un-gated so the learner can still hear sounds when they explicitly ask.
 */
export function useAutoPlayJaAudio(
  text: string | undefined,
  playbackKey: string,
  delayMs: number = 350,
): void {
  const silent = useSettings().settings.audio.silentMode;
  useEffect(() => {
    if (!text) return;
    if (silent) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      void autoPlayJaAudio(text, playbackKey);
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text, playbackKey, delayMs, silent]);
}
