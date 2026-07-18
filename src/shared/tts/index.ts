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
import {
  getAudioVolume,
  subscribeAudioVolume,
  stopLocalAudio,
} from "@/shared/audio/volume";

const MANIFEST = manifest as Record<string, string | string[]>;

/**
 * Manifest-lookup language used when a caller doesn't pass `lang`.
 * Step views never pass one (they predate multi-language), so without
 * this every non-ja lesson would look up `ja:<text>` and stay silent.
 * LanguageContext stamps the active course language here on mount/switch;
 * default parameters are evaluated per call, so the ja default holds
 * until a non-ja course actually mounts.
 */
let defaultTtsLang = "ja";

export function setDefaultTtsLang(lang: string): void {
  defaultTtsLang = lang;
}

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

export function getTtsUrl(text: string, lang: string = defaultTtsLang): string | null {
  if (!text) return null;
  const key = `${lang}:${text}`;
  let relative = pickPath(MANIFEST[key]);
  if (!relative) {
    // Trailing sentence punctuation drifts between authored text and the
    // generated deck (which strips it): try the ± variants for both the
    // JA "。" and the Latin "." / "?" the KO/ES decks use.
    const stripped = text.replace(/[。.?!]+$/, "");
    for (const alt of [stripped, `${stripped}。`, `${stripped}.`]) {
      if (alt === text) continue;
      relative = pickPath(MANIFEST[`${lang}:${alt}`]);
      if (relative) break;
    }
  }
  if (!relative && lang === "ja") {
    const twin = hiraganaTwin(text);
    if (twin) relative = pickPath(MANIFEST[`${lang}:${twin}`]);
  }
  if (!relative) return null;
  return `/${relative}`;
}

export function hasTtsAudio(text: string, lang: string = defaultTtsLang): boolean {
  return getTtsUrl(text, lang) !== null || canSynthesize(lang);
}

// ---------------------------------------------------------------------------
// Browser speech-synthesis fallback (non-JA manifest misses).
//
// JA ships a COMPLETE recorded corpus, so a JA miss means brand-new content;
// we stay silent there rather than drop to a robotic voice mid-lesson. Every
// OTHER course ships few/no clips — KO shipped ZERO — so without this fallback
// their audio is silent ("tts not working for korean", Spencer 2026-07-17).
// We speak the text with the correct BCP-47 language so the browser never
// picks, e.g., a Japanese voice for Korean text ("it translates to japanese").
// ---------------------------------------------------------------------------

const BCP47: Record<string, string> = {
  ja: "ja-JP",
  ko: "ko-KR",
  es: "es-ES",
  en: "en-US",
};

function bcp47For(lang: string): string {
  return BCP47[lang] ?? lang;
}

function synthSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

/** JA keeps its recordings-only behavior; every other language may fall back
 *  to synthesis when the manifest has no clip. */
function canSynthesize(lang: string): boolean {
  return lang !== "ja" && synthSupported();
}

/** Best voice for a locale: exact match → language-prefix match → null (let
 *  the engine choose by `utterance.lang`). getVoices() can be empty until the
 *  async `voiceschanged` event; null is fine — `lang` alone still steers the
 *  engine away from the wrong-language voice. */
function pickVoice(tag: string): SpeechSynthesisVoice | null {
  if (!synthSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const lower = tag.toLowerCase();
  const prefix = lower.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === lower) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

/** Speak `text` via the platform TTS voice for `lang`. No-op for JA or when
 *  synthesis is unsupported. Cancels any in-flight utterance so clips never
 *  overlap across steps. Returns the utterance (or null) so callers can chain
 *  on `onend`.
 *
 *  Chrome loads its voice list lazily — `getVoices()` returns `[]` until the
 *  one-shot `voiceschanged` event fires. Speaking with an empty list can pick
 *  the wrong voice (or stay silent), so when it's empty we wait for that event
 *  once and then speak with the right voice resolved. */
function speakViaSynthesis(text: string, lang: string): SpeechSynthesisUtterance | null {
  if (!canSynthesize(lang) || !text) return null;
  const synth = window.speechSynthesis;
  const tag = bcp47For(lang);
  const u = new SpeechSynthesisUtterance(text);
  u.lang = tag;
  u.volume = getAudioVolume();
  activeUtterance = u;
  const clear = () => {
    if (activeUtterance === u) activeUtterance = null;
  };
  u.onend = clear;
  u.onerror = clear;

  const speakNow = () => {
    if (activeUtterance !== u) return; // superseded by a newer clip
    const voice = pickVoice(tag);
    if (voice) u.voice = voice;
    synth.cancel();
    synth.speak(u);
  };

  if (synth.getVoices().length === 0) {
    // Voices not ready yet — speak once they arrive (fall back to speaking
    // anyway after a short wait so a browser that never fires the event, or
    // has genuinely no voices, still attempts playback).
    let fired = false;
    const onVoices = () => {
      if (fired) return;
      fired = true;
      synth.removeEventListener("voiceschanged", onVoices);
      speakNow();
    };
    synth.addEventListener("voiceschanged", onVoices);
    setTimeout(onVoices, 250);
  } else {
    speakNow();
  }
  return u;
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
  // Kick off async voice loading early so the synthesis fallback has a
  // populated list by the time a non-JA lesson needs it.
  if (synthSupported()) window.speechSynthesis.getVoices();
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

// ---------------------------------------------------------------------------
// Active-source registry. Every AudioBufferSourceNode this module starts is
// tracked here so the app can cut off ALL in-flight TTS at once — advancing
// to the next lesson step (or leaving a lesson) must not let the previous
// step's clip bleed into the next one (Spencer QA 2026-07-16). Sources
// self-deregister when they end (natural finish OR an explicit stop()).
// ---------------------------------------------------------------------------
const activeSources = new Set<AudioBufferSourceNode>();

function trackSource(src: AudioBufferSourceNode): void {
  activeSources.add(src);
  src.addEventListener("ended", () => activeSources.delete(src));
}

/**
 * Stop every in-flight clip immediately — Web Audio TTS sources plus any
 * HTMLAudio (per-word / alphabet) clips. Idempotent; safe to call when
 * nothing is playing. Wired into the lesson step-advance path and lesson
 * unmount so audio never spills across a step or lesson boundary.
 */
export function stopAllAudio(): void {
  for (const src of activeSources) {
    try {
      src.stop();
    } catch {
      // Already stopped / never started — ignore.
    }
  }
  activeSources.clear();
  if (synthSupported()) window.speechSynthesis.cancel();
  activeUtterance = null;
  stopLocalAudio();
}

/**
 * Start a fresh AudioBufferSourceNode for `buffer` and start it. The node
 * is automatically eligible for GC once playback ends — the Web Audio
 * runtime owns the lifecycle; `trackSource` only keeps a weak-ish handle
 * so `stopAllAudio` can cut it off early.
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
  trackSource(src);
  src.start();
}

// ---------------------------------------------------------------------------
// Public play API.
// ---------------------------------------------------------------------------

export async function playJaAudio(text: string, lang: string = defaultTtsLang): Promise<void> {
  const url = getTtsUrl(text, lang);
  if (!url) {
    speakViaSynthesis(text, lang);
    return;
  }
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
  lang: string = defaultTtsLang,
  voice: VoiceColor = {},
): Promise<void> {
  const url = getTtsUrl(text, lang);
  if (!url) {
    // Non-JA fallback: speak via the platform voice and resolve when it
    // finishes, so dialogue sequencers don't stack turns. Timeout guards a
    // suspended/blocked synth engine from hanging the sequence forever.
    const u = speakViaSynthesis(text, lang);
    if (!u) return;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      u.onend = finish;
      u.onerror = finish;
      // ~90ms/char is a generous upper bound for platform TTS pacing.
      setTimeout(finish, text.length * 90 + 2000);
    });
    return;
  }
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
  trackSource(src);
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
  lang: string = defaultTtsLang,
): Promise<void> {
  if (!text) return;
  const key = `${playbackKey}:${lang}:${text}`;
  if (playedAutoKeys.has(key)) return;
  const url = getTtsUrl(text, lang);
  if (!url) {
    // No recorded clip — speak via the platform voice (non-JA only). Mark
    // the key so the once-per-session autoplay contract still holds.
    if (canSynthesize(lang)) {
      playedAutoKeys.add(key);
      speakViaSynthesis(text, lang);
    }
    return;
  }
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
