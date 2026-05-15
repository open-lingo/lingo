/**
 * Web Speech API React wrapper for Japanese pronunciation drills.
 *
 * Direct binding — no new dependencies. The Web Speech API is
 * browser-native and free. Chrome + Edge + Safari (recent) support
 * `ja-JP`; Firefox does not.
 *
 * The hook is intentionally minimal:
 *   - one start / stop pair
 *   - interim transcript while speaking, final transcript on end
 *   - errors surfaced via an `error` field (string code)
 *
 * Anything richer (per-mora alignment, pitch overlay, MediaRecorder
 * listen-back) lives elsewhere. See
 * `docs/superpowers/specs/2026-05-15-speech-recognition-research.md`.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function getCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechErrorCode =
  | "not-supported"
  | "no-mic"
  | "no-speech"
  | "aborted"
  | "network"
  | "audio-capture"
  | "service-not-allowed"
  | "unknown";

export type UseSpeechRecognitionState = {
  /** True while the mic is open. */
  listening: boolean;
  /** Best-so-far transcript (interim or final). */
  transcript: string;
  /** True once the recognizer has fired `end`. */
  finished: boolean;
  /** Error code, or null. */
  error: SpeechErrorCode | null;
  /** Whether the API is available in this browser. */
  supported: boolean;
};

export type UseSpeechRecognitionApi = UseSpeechRecognitionState & {
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function useSpeechRecognition(
  lang: string = "ja-JP",
): UseSpeechRecognitionApi {
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<SpeechErrorCode | null>(null);
  const supported = getCtor() !== null;

  const stop = useCallback(() => {
    const r = recogRef.current;
    if (r) {
      try {
        r.stop();
      } catch {
        /* may already be stopped */
      }
    }
  }, []);

  // Tear down on unmount so leaving the lesson never leaves the mic hot.
  useEffect(() => {
    return () => {
      const r = recogRef.current;
      if (r) {
        try {
          r.abort();
        } catch {
          /* ignore */
        }
        recogRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setFinished(false);
    setError(null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("not-supported");
      return;
    }
    // Abort any previous instance — chaining start() before stop()
    // completes throws InvalidStateError in Chrome.
    if (recogRef.current) {
      try {
        recogRef.current.abort();
      } catch {
        /* ignore */
      }
      recogRef.current = null;
    }
    reset();

    const recog = new Ctor();
    recog.lang = lang;
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 3;

    recog.onstart = () => {
      setListening(true);
    };

    recog.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string; confidence?: number }>> }) => {
      // Collect best alternative from every result item, prefer the one
      // with the highest confidence among interim alternatives.
      let best = "";
      const results = event.results;
      for (let i = 0; i < results.length; i++) {
        const alts = results[i];
        if (alts && alts.length > 0) {
          best += alts[0].transcript;
        }
      }
      setTranscript(best);
    };

    recog.onerror = (event: { error?: string }) => {
      const code = event.error ?? "unknown";
      // Map a couple of common error strings to our union.
      const known: SpeechErrorCode[] = [
        "no-speech",
        "aborted",
        "network",
        "audio-capture",
        "service-not-allowed",
      ];
      if (code === "not-allowed") {
        setError("no-mic");
      } else if ((known as string[]).includes(code)) {
        setError(code as SpeechErrorCode);
      } else {
        setError("unknown");
      }
    };

    recog.onend = () => {
      setListening(false);
      setFinished(true);
    };

    recogRef.current = recog;
    try {
      recog.start();
    } catch {
      // Chrome throws if start() is called twice or after an abort with
      // no settle time. Surface as a soft error so the UI can show
      // "try again".
      setError("unknown");
      setListening(false);
    }
  }, [lang, reset]);

  return {
    listening,
    transcript,
    finished,
    error,
    supported,
    start,
    stop,
    reset,
  };
}
