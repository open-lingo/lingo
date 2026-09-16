/**
 * Speech recognition on iOS, via the native `SFSpeechRecognizer`.
 *
 * WHY A THIRD RECOGNIZER — neither existing engine works in a shipped native
 * build:
 *
 *   - `useSpeechRecognition` is the Web Speech API. `webkitSpeechRecognition`
 *     is a Safari-the-browser feature; WKWebView does not expose it, so
 *     `supported` is false on device and the step silently has no recognizer.
 *   - `useWhisperRecognition` downloads `Xenova/whisper-small` from HuggingFace
 *     at runtime. The bundle ships no `.onnx` weights and the CSP's
 *     `connect-src` has no HuggingFace origin, so the fetch is blocked outright
 *     in a built app. (It works in `npm run dev` only because the CSP plugin is
 *     `apply: "build"` — which is exactly why this failed on a phone while
 *     looking fine on a laptop.) Even unblocked, ~240 MB is not a mid-lesson
 *     download.
 *
 * `SFSpeechRecognizer` is what a native app is supposed to use here: on-device,
 * instant, no download, and it supports `ko-KR` among many locales.
 *
 * The property that matters most for UX is **partial results**. The web engine
 * only scores on `finished`, so the mic stays open for a beat after the learner
 * has already said the word correctly. Streaming partials lets the caller score
 * mid-utterance and stop the moment it matches.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { IS_NATIVE } from "@/shared/platform/native";
import type {
  SpeechAlternative,
  SpeechErrorCode,
  SpeechTimings,
  UseSpeechRecognitionApi,
} from "./useSpeechRecognition";

/**
 * The slice of `@capacitor-community/speech-recognition` this hook uses.
 *
 * Declared structurally and injectable so tests drive real hook wiring instead
 * of mocking the module — same convention as `WhisperWorkerFactory`.
 */
export type NativeSpeechPlugin = {
  available: (options?: { language?: string }) => Promise<{ available: boolean }>;
  checkPermissions: () => Promise<{ speechRecognition: string }>;
  requestPermissions: () => Promise<{ speechRecognition: string }>;
  start: (options?: {
    language?: string;
    maxResults?: number;
    partialResults?: boolean;
    popup?: boolean;
    /**
     * The step's accepted readings — `SFSpeechAudioBufferRecognitionRequest.contextualStrings`.
     * Biases the language model towards the phrase we are actually asking for
     * (TestFlight #171).
     */
    contextualStrings?: string[];
  }) => Promise<unknown>;
  stop: () => Promise<void>;
  /**
   * Warm the recognizer without opening the mic (TestFlight #155, "slow to
   * initialize"): construct `SFSpeechRecognizer` for the locale and settle
   * authorization while the learner is still reading the card.
   *
   * Optional — the Android community plugin has no such method, and an older
   * iOS build may predate it, so the hook must never assume it exists.
   */
  prepare?: (options?: {
    language?: string;
    contextualStrings?: string[];
  }) => Promise<unknown>;
  /**
   * Android only (`@capacitor-community/speech-recognition` ≥5.1). The Swift
   * plugin does not implement it, and the hook must not assume it exists.
   */
  isListening?: () => Promise<{ listening: boolean }>;
  addListener: (
    eventName: string,
    listenerFunc: (data: never) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
};

export type UseNativeSpeechOptions = {
  plugin?: NativeSpeechPlugin;
  maxAlternatives?: number;
  /** Accepted readings for the current target, precomputed at mount (#171). */
  contextualStrings?: readonly string[];
  /** Collect `performance.now()` marks (`?speech-debug=1`). */
  collectTimings?: boolean;
};

/**
 * Bridges to `ios/App/App/SpeechRecognizerPlugin.swift`.
 *
 * This is our own plugin rather than `@capacitor-community/speech-recognition`
 * because that package ships a podspec but no `Package.swift`, and this project
 * is SPM (`CapApp-SPM`, no Podfile) — `cap sync` reports it as not SPM-compatible
 * and it never links. Owning ~150 lines of Swift beat migrating the app to
 * CocoaPods for one plugin.
 *
 * On web there is no native implementation, so `available()` rejects and the
 * hook reports `supported: false` — which is correct, since the web build uses
 * the Web Speech API instead.
 */
/**
 * Module-scope singleton — `registerPlugin` may be called exactly ONCE per
 * plugin name for the lifetime of the page.
 *
 * Calling it per-hook-mount (which is what this did originally) means every
 * subsequent speaking step hits
 *   "Capacitor plugin \"SpeechRecognizer\" already registered. Cannot register
 *    plugins twice."
 * and gets back a dead handle, so `available()` is never actually invoked. The
 * symptom is indistinguishable from "the plugin isn't registered at all": the
 * step just reports speech unsupported, forever, with nothing in the native
 * log — because nothing ever reached native.
 */
/**
 * ⚠️ BOXED ON PURPOSE — `{ plugin }`, never the plugin itself.
 *
 * `registerPlugin` returns a **Proxy** that answers ANY property access with a
 * callable. That includes `then`. So returning it from an `async` function (or
 * resolving a promise with it) makes the JS runtime treat it as a thenable: it
 * reads `.then`, gets a function, and calls `p.then(resolve, reject)` — which
 * the proxy dispatches to the bridge as a native method named "then". Nothing
 * implements that, nothing ever calls `resolve`, and **the await hangs
 * forever**.
 *
 * The symptom is maddening precisely because every part looks healthy: the
 * plugin registers, `registerPlugin` returns a truthy object, no error is
 * thrown, and no call reaches native. The step just reports speech unsupported.
 *
 * Wrapping in a plain object means the promise never sees a thenable.
 */
let pluginSingleton: Promise<{ plugin: NativeSpeechPlugin | null }> | null = null;

/**
 * Returns the BOX, never the plugin — see the note above. `return plugin` from
 * an async function is exactly as fatal as resolving a promise with it, because
 * the returned value is awaited by the caller and probed for `.then` all the
 * same. The box has to survive all the way to the call site.
 */
async function loadDefaultPlugin(): Promise<{ plugin: NativeSpeechPlugin | null }> {
  // Off-native there is no implementation behind the bridge, and every call
  // rejects with UNIMPLEMENTED. Returning null here keeps `supported` false
  // without touching the bridge at all — otherwise merely rendering a speaking
  // step in a web build (or a test) produces an unhandled rejection.
  if (!IS_NATIVE) return { plugin: null };
  pluginSingleton ??= import("@capacitor/core")
    .then(({ registerPlugin, Capacitor }) => ({
      plugin: registerPlugin<NativeSpeechPlugin>(
        nativeSpeechPluginName(Capacitor.getPlatform()),
      ),
    }))
    .catch(() => ({ plugin: null }));
  return pluginSingleton;
}

/**
 * Which native class answers the bridge, per platform.
 *
 * - iOS: our own `SpeechRecognizer` (`ios/App/App/SpeechRecognizerPlugin.swift`),
 *   because the community package cannot link into an SPM project (see above).
 * - Android: `@capacitor-community/speech-recognition` links fine through
 *   Gradle and exposes the same method/event surface, so we use it as-is.
 *   Its Android class registers under the name `SpeechRecognition`.
 *
 * The Swift plugin was written to the community package's contract precisely
 * so this could be a name switch and not an adapter. `NativeSpeechPlugin` is
 * the shared slice; if either side drifts, add the adapter here, not in the hook.
 */
export function nativeSpeechPluginName(platform: string): string {
  return platform === "android" ? "SpeechRecognition" : "SpeechRecognizer";
}

/** Longest we wait for the plugin's `stop()` to settle before finishing. */
const STOP_SETTLE_MS = 750;

const EMPTY_TIMINGS: SpeechTimings = { tapToStart: null, tapToFirstPartial: null };

/** Monotonic clock, guarded for environments without `performance`. */
function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function useNativeSpeechRecognition(
  lang: string = "ko-KR",
  options: UseNativeSpeechOptions = {},
): UseSpeechRecognitionApi {
  const {
    plugin: injected,
    maxAlternatives = 5,
    contextualStrings,
    collectTimings = false,
  } = options;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [alternatives, setAlternatives] = useState<SpeechAlternative[]>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<SpeechErrorCode | null>(null);
  const [timings, setTimings] = useState<SpeechTimings>(EMPTY_TIMINGS);

  // The hint list changes identity on every render of a memo-less caller;
  // keep it in a ref so it never re-creates `start`.
  const contextualRef = useRef<readonly string[] | undefined>(contextualStrings);
  contextualRef.current = contextualStrings;
  /** `performance.now()` at the mic tap — the zero point for every mark. */
  const tapAtRef = useRef<number | null>(null);

  const pluginRef = useRef<NativeSpeechPlugin | null>(injected ?? null);
  const handlesRef = useRef<{ remove: () => Promise<void> }[]>([]);
  // Guards against a `stop` racing the async `start`, and against the
  // listeningState event double-firing `finished`.
  const activeRef = useRef(false);
  const heardRef = useRef(false);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current !== null) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Unbox only AFTER the await — `p` must never be the awaited value.
      const p = injected ?? (await loadDefaultPlugin()).plugin;
      if (cancelled) return;
      pluginRef.current = p;
      if (!p) {
        setSupported(false);
        return;
      }
      try {
        // Ask about the ACTUAL course locale — support is per-locale, and the
        // native default (en-US) would answer the wrong question for ko-KR.
        const { available } = await p.available({ language: lang });
        if (!cancelled) setSupported(Boolean(available));
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [injected, lang]);

  const detachListeners = useCallback(async () => {
    const handles = handlesRef.current;
    handlesRef.current = [];
    for (const h of handles) {
      try {
        await h.remove();
      } catch {
        /* listener already gone */
      }
    }
  }, []);

  const reset = useCallback(() => {
    heardRef.current = false;
    setTranscript("");
    setAlternatives([]);
    setFinished(false);
    setError(null);
    setTimings(EMPTY_TIMINGS);
  }, []);

  /**
   * Warm the recognizer during the step's intro (TestFlight #155 — "slow to
   * initialize"). Called on MOUNT, while the learner is still reading the card
   * and listening to the model clip; the mic does not open here.
   *
   * What this actually buys, in order of cost on a cold step:
   *   1. **Authorization.** The very first speaking step of a session pays for
   *      two system permission round-trips (speech, then microphone). Doing it
   *      behind the tap means the learner taps, nothing happens, and a dialog
   *      appears — which is most of "slow to initialize".
   *   2. **`SFSpeechRecognizer` construction.** Instantiating for a locale
   *      touches the on-device asset catalogue; the native side caches it.
   *   3. **The vocabulary hint.** Handed over now so the request can be built
   *      with it rather than after the tap.
   *
   * The audio session is deliberately NOT activated here. `.playAndRecord`
   * re-routes output to the receiver and ducks everything else the moment it
   * goes active — activating at mount would mean the model clip the learner is
   * about to play sounds like a phone call. That step stays on the tap.
   */
  const prepare = useCallback(() => {
    const p = pluginRef.current;
    if (!p) return;
    void (async () => {
      try {
        const status = await p.checkPermissions();
        if (status.speechRecognition === "prompt") await p.requestPermissions();
        await p.prepare?.({
          language: lang,
          contextualStrings: contextualRef.current
            ? [...contextualRef.current]
            : undefined,
        });
      } catch {
        // Warming is best-effort by definition — `start()` re-checks
        // everything and surfaces a real failure there, where the learner is
        // actually waiting on it.
      }
    })();
  }, [lang]);

  /**
   * Android watchdog. The community plugin resolves `start()` the moment the
   * recognizer begins and, when the recognizer then dies on its own (silence
   * timeout, NO_MATCH, network), it rejects the already-resolved call and emits
   * NO `listeningState: stopped`. Verified on the API 35 emulator 2026-09-04:
   * the step sat on "Listening…" indefinitely. `isListening()` is the only
   * remaining signal, so poll it while a session is active. The Swift plugin
   * emits a proper stopped event and has no `isListening`, so nothing is
   * armed on iOS — `useNativeSpeechRecognition.test.ts` pins both.
   */
  const armWatchdog = useCallback(
    (p: NativeSpeechPlugin) => {
      clearWatchdog();
      const probe = p.isListening;
      if (!probe) return;
      watchdogRef.current = setInterval(() => {
        if (!activeRef.current) {
          clearWatchdog();
          return;
        }
        void probe
          .call(p)
          .then(({ listening: still }) => {
            if (still || !activeRef.current) return;
            activeRef.current = false;
            clearWatchdog();
            void detachListeners();
            if (!heardRef.current) setError("no-speech");
            setListening(false);
            setFinished(true);
          })
          .catch(() => undefined);
      }, 300);
    },
    [clearWatchdog, detachListeners],
  );

  const stop = useCallback(() => {
    const p = pluginRef.current;
    activeRef.current = false;
    clearWatchdog();
    void (async () => {
      try {
        // Bounded: the Android community plugin's `stop()` never resolves its
        // call (verified 2026-09-04 — Java `stop` runs `stopListening()` and
        // returns; only an exception settles it). Waiting on it unbounded left
        // the step on "Stop recording" after every manual tap-to-stop. The
        // wait still exists so a plugin that DOES settle (the iOS Swift one)
        // can deliver its final transcript before `finished` flips.
        await Promise.race([
          p?.stop(),
          new Promise<void>((r) => setTimeout(r, STOP_SETTLE_MS)),
        ]);
      } catch {
        /* already stopped */
      }
      await detachListeners();
      setListening(false);
      setFinished(true);
    })();
  }, [clearWatchdog, detachListeners]);

  const start = useCallback(() => {
    const p = pluginRef.current;
    if (!p) {
      setError("not-supported");
      return;
    }
    reset();
    activeRef.current = true;
    tapAtRef.current = nowMs();

    void (async () => {
      try {
        let status = await p.checkPermissions();
        if (status.speechRecognition !== "granted") {
          status = await p.requestPermissions();
        }
        if (status.speechRecognition !== "granted") {
          // Denied is terminal for this attempt — surface it instead of
          // opening a mic that will never produce audio.
          activeRef.current = false;
          setError("no-mic");
          setListening(false);
          setFinished(true);
          return;
        }
        if (!activeRef.current) return;

        // Detach anything left over from a previous attempt BEFORE subscribing
        // again. The recognizer ending by itself (silence endpointing — the
        // normal way a wrong answer finishes) never routed through `stop()`,
        // so its handles survived and every retry stacked another pair. Two
        // `listeningState` subscriptions means the second attempt's `started`
        // and `stopped` each fire twice, and `finished` flips before the
        // learner has finished speaking.
        await detachListeners();

        handlesRef.current.push(
          await p.addListener("partialResults", ((data: {
            matches?: string[];
            /** Which engine produced this hypothesis (iOS). */
            onDevice?: boolean;
          }) => {
            const matches = data?.matches ?? [];
            if (!matches.length) return;
            const first = !heardRef.current;
            heardRef.current = true;
            if (collectTimings && first && tapAtRef.current !== null) {
              const dt = nowMs() - tapAtRef.current;
              setTimings((prev) => ({
                ...prev,
                tapToFirstPartial: dt,
                // 1/0 rather than a boolean so it rides the same numeric map as
                // the phase breakdown. Distinguishes "the on-device model is
                // slow" from "the on-device model died and we are quietly on
                // the server" — the two shapes behind #155's "slow to
                // initialize", which look identical from the UI.
                ...(typeof data.onDevice === "boolean"
                  ? { native: { ...(prev.native ?? {}), onDevice: data.onDevice ? 1 : 0 } }
                  : {}),
              }));
            }
            setTranscript(matches[0] ?? "");
            setAlternatives(matches.map((m) => ({ transcript: m })));
          }) as (d: never) => void),
        );

        handlesRef.current.push(
          await p.addListener("listeningState", ((data: {
            status?: string;
            error?: string;
            /** Native-side latency breakdown, ms per phase (#155). */
            timings?: Record<string, number>;
          }) => {
            if (data?.status === "started") {
              if (collectTimings) {
                const dt =
                  tapAtRef.current !== null ? nowMs() - tapAtRef.current : null;
                setTimings((prev) => ({
                  ...prev,
                  tapToStart: dt,
                  ...(data.timings ? { native: data.timings } : {}),
                }));
              }
              setListening(true);
              return;
            }
            // The recognizer ended on its own (silence endpointing,
            // interruption). This is a terminal state for the attempt, so the
            // subscriptions have to go with it — `stop()` is not called on
            // this path and was the only thing that used to detach them.
            if (!activeRef.current) return;
            activeRef.current = false;
            clearWatchdog();
            void detachListeners();
            // The recognizer can die without ever transcribing — iOS marks a
            // locale's offline model installed before the asset is really
            // there, routes to the local recognizer anyway, and fails to
            // initialize. Without an error the step is indistinguishable from
            // "the learner said nothing", so it just asks them to try again,
            // forever. Flagging it surfaces the skip escape instead.
            if (data?.error) setError("unknown");
            setListening(false);
            setFinished(true);
          }) as (d: never) => void),
        );

        if (!activeRef.current) return;
        armWatchdog(p);
        await p.start({
          language: lang,
          maxResults: Math.min(Math.max(maxAlternatives, 1), 5),
          partialResults: true,
          popup: false,
          // The whole point of #171: the recognizer is told what the lesson
          // is asking for BEFORE it hears a syllable.
          ...(contextualRef.current && contextualRef.current.length > 0
            ? { contextualStrings: [...contextualRef.current] }
            : {}),
        });
        if (activeRef.current) setListening(true);
      } catch {
        activeRef.current = false;
        clearWatchdog();
        setError("unknown");
        setListening(false);
        setFinished(true);
      }
    })();
  }, [
    armWatchdog,
    clearWatchdog,
    collectTimings,
    detachListeners,
    lang,
    maxAlternatives,
    reset,
  ]);

  // Never leave the mic open behind a unmounted step.
  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearWatchdog();
      void pluginRef.current?.stop().catch(() => undefined);
      void detachListeners();
    };
  }, [clearWatchdog, detachListeners]);

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
    prepare,
    timings,
  };
}
