/**
 * Speech-recognition feature flag.
 *
 * The pronunciation step is gated behind `?speech=1` so default users see
 * no behavior change. Once the URL param is present in a session, we
 * persist the flag in `sessionStorage` so internal navigation
 * (Continue → next step in a separate route mount) doesn't lose it.
 *
 * Off by default. To enable: visit any page with `?speech=1`. To turn off
 * mid-session, visit `?speech=0`. We mirror the same UX as the
 * `?dev=1` / `?dev=0` toggle in `LearnPage`.
 */

const KEY = "lingo_speech_flag_v1";

export function isSpeechFlagEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSpeechFlag(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.sessionStorage.setItem(KEY, "1");
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* storage may be unavailable (private mode); silently ignore */
  }
}

/**
 * Web Speech API capability check. Some browsers expose
 * `webkitSpeechRecognition` but not `SpeechRecognition`. Firefox exposes
 * neither.
 */
type SpeechWindow = Window & {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SpeechWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}
