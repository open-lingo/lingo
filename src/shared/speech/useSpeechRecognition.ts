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

/**
 * Where the time between the mic tap and a usable result went (TestFlight
 * #155, "slow to initialize"). Every figure is milliseconds from the tap, or
 * null until that milestone lands. Only populated when `?speech-debug=1` is
 * on; the marks themselves are two `performance.now()` reads, so the cost of
 * leaving them armed is nil.
 */
export type SpeechTimings = {
  /** Tap → the recognizer reporting it is listening. */
  tapToStart: number | null;
  /** Tap → the first partial hypothesis. */
  tapToFirstPartial: number | null;
  /** Native-side breakdown (permissions, audio session, engine, task). */
  native?: Readonly<Record<string, number>>;
};

export type UseSpeechRecognitionApi = UseSpeechRecognitionState & {
  start: () => void;
  stop: () => void;
  reset: () => void;
  /**
   * Warm the engine WITHOUT opening the mic — authorization, recognizer
   * construction, vocabulary hint. Optional: only the native recognizer has
   * anything to warm. See `useNativeSpeechRecognition`.
   */
  prepare?: () => void;
  /** Present only while the debug dial is on. */
  timings?: SpeechTimings;
};

export type UseSpeechRecognitionOptions = {
  /**
   * Number of alternatives to request from the API. Clamped to [1, 5].
   * Defaults to 5 — Chrome and Safari both honor the request, and more
   * alternatives is a near-free way to recover from common ASR errors
   * (h-prepending, romaji-vs-kana ambiguity, etc.) in the matcher.
   */
  maxAlternatives?: number;
  /**
   * The step's accepted readings, precomputed at mount (TestFlight #171).
   *
   * The Web Speech API has NO equivalent of `SFSpeechAudioBufferRecognitionRequest.contextualStrings`
   * — there is nowhere to put a vocabulary hint — so this recognizer ignores
   * it, and the same list does its work on the grading side instead
   * (`matchAcceptedForm`). Accepted here so the two engines take the same
   * options object and the caller has no platform branch.
   */
  contextualStrings?: readonly string[];
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
      // Interim N-best, kept separately. A final list always wins when one
      // exists, so this changes nothing about how an attempt is graded at the
      // end — it only stops us throwing away the alternatives that arrive
      // BEFORE the end, which is where the accepted-form match now looks
      // (#171). The form the learner actually said is regularly the second
      // hypothesis, and on a partial there was nowhere for it to be seen.
      const interimAlts: SpeechAlternative[] = [];
      for (let i = 0; i < results.length; i++) {
        const alts = results[i];
        if (!alts || alts.length === 0) continue;
        best += alts[0].transcript;
        const sink = alts.isFinal ? finalAlts : interimAlts;
        for (let j = 0; j < alts.length; j++) {
          const a = alts[j];
          if (!a) continue;
          sink.push({ transcript: a.transcript, confidence: a.confidence });
        }
      }
      setTranscript(best);
      if (finalAlts.length === 0 && interimAlts.length > 0) {
        setAlternatives(interimAlts);
      }
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
