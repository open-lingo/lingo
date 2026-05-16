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
 *   - N-best alternatives (up to 5) surfaced as `alternatives`
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

/** A single ASR alternative from the N-best list. */
export type SpeechAlternative = {
  transcript: string;
  confidence?: number;
};

export type UseSpeechRecognitionState = {
  /** True while the mic is open. */
  listening: boolean;
  /** Best-so-far transcript (interim or final). Concatenated top-1 across result items. */
  transcript: string;
  /**
   * Final-result N-best list. Empty while listening (interim results
   * usually only carry the top alternative) and populated on the
   * terminal result. Each entry has `transcript` and (where the API
   * reported it) `confidence` in [0, 1].
   */
  alternatives: SpeechAlternative[];
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

export type UseSpeechRecognitionOptions = {
  /**
   * Number of alternatives to request from the API. Clamped to [1, 5].
   * Defaults to 5 — Chrome and Safari both honor the request, and more
   * alternatives is a near-free way to recover from common ASR errors
   * (h-prepending, romaji-vs-kana ambiguity, etc.) in the matcher.
   */
  maxAlternatives?: number;
};

export function useSpeechRecognition(
  lang: string = "ja-JP",
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionApi {
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [alternatives, setAlternatives] = useState<SpeechAlternative[]>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<SpeechErrorCode | null>(null);
  const supported = getCtor() !== null;

  const requestedAlts = Math.max(1, Math.min(5, options.maxAlternatives ?? 5));

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
    setAlternatives([]);
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
    recog.maxAlternatives = requestedAlts;

    recog.onstart = () => {
      setListening(true);
    };

    recog.onresult = (event: {
      results: ArrayLike<
        ArrayLike<{ transcript: string; confidence?: number }> & {
          isFinal?: boolean;
        }
      >;
    }) => {
      // Two distinct things to surface:
      //  - `transcript`: best-so-far text, including interim. Used to
      //    show the user what we heard live.
      //  - `alternatives`: N-best list from the final result item.
      //    Populated only when we see an `isFinal` result.
      let best = "";
      const results = event.results;
      const finalAlts: SpeechAlternative[] = [];
      for (let i = 0; i < results.length; i++) {
        const alts = results[i];
        if (!alts || alts.length === 0) continue;
        best += alts[0].transcript;
        if (alts.isFinal) {
          for (let j = 0; j < alts.length; j++) {
            const a = alts[j];
            if (!a) continue;
            finalAlts.push({
              transcript: a.transcript,
              confidence: a.confidence,
            });
          }
        }
      }
      setTranscript(best);
      if (finalAlts.length > 0) {
        // Dedupe by transcript; preserve first occurrence (highest confidence).
        const seen = new Set<string>();
        const deduped: SpeechAlternative[] = [];
        for (const a of finalAlts) {
          const key = a.transcript.trim();
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(a);
        }
        setAlternatives(deduped);
      }
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
  }, [lang, requestedAlts, reset]);

  return {
    listening,
    transcript,
    alternatives,
    finished,
    error,
    supported,
    start,
    stop,
    reset,
  };
}
