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
  }) => Promise<unknown>;
  stop: () => Promise<void>;
  addListener: (
    eventName: string,
    listenerFunc: (data: never) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
};

export type UseNativeSpeechOptions = {
  plugin?: NativeSpeechPlugin;
  maxAlternatives?: number;
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
    .then(({ registerPlugin }) => ({
      plugin: registerPlugin<NativeSpeechPlugin>("SpeechRecognizer"),
    }))
    .catch(() => ({ plugin: null }));
  return pluginSingleton;
}

export function useNativeSpeechRecognition(
  lang: string = "ko-KR",
  options: UseNativeSpeechOptions = {},
): UseSpeechRecognitionApi {
  const { plugin: injected, maxAlternatives = 5 } = options;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [alternatives, setAlternatives] = useState<SpeechAlternative[]>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<SpeechErrorCode | null>(null);

  const pluginRef = useRef<NativeSpeechPlugin | null>(injected ?? null);
  const handlesRef = useRef<{ remove: () => Promise<void> }[]>([]);
  // Guards against a `stop` racing the async `start`, and against the
  // listeningState event double-firing `finished`.
  const activeRef = useRef(false);

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
    setTranscript("");
    setAlternatives([]);
    setFinished(false);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    const p = pluginRef.current;
    activeRef.current = false;
    void (async () => {
      try {
        await p?.stop();
      } catch {
        /* already stopped */
      }
      await detachListeners();
      setListening(false);
      setFinished(true);
    })();
  }, [detachListeners]);

  const start = useCallback(() => {
    const p = pluginRef.current;
    if (!p) {
      setError("not-supported");
      return;
    }
    reset();
    activeRef.current = true;

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
          await p.addListener("partialResults", ((data: { matches?: string[] }) => {
            const matches = data?.matches ?? [];
            if (!matches.length) return;
            setTranscript(matches[0] ?? "");
            setAlternatives(matches.map((m) => ({ transcript: m })));
          }) as (d: never) => void),
        );

        handlesRef.current.push(
          await p.addListener("listeningState", ((data: {
            status?: string;
            error?: string;
          }) => {
            if (data?.status === "started") {
              setListening(true);
              return;
            }
            // The recognizer ended on its own (silence endpointing,
            // interruption). This is a terminal state for the attempt, so the
            // subscriptions have to go with it — `stop()` is not called on
            // this path and was the only thing that used to detach them.
            if (!activeRef.current) return;
            activeRef.current = false;
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
        await p.start({
          language: lang,
          maxResults: Math.min(Math.max(maxAlternatives, 1), 5),
          partialResults: true,
          popup: false,
        });
        if (activeRef.current) setListening(true);
      } catch {
        activeRef.current = false;
        setError("unknown");
        setListening(false);
        setFinished(true);
      }
    })();
  }, [detachListeners, lang, maxAlternatives, reset]);

  // Never leave the mic open behind a unmounted step.
  useEffect(() => {
    return () => {
      activeRef.current = false;
      void pluginRef.current?.stop().catch(() => undefined);
      void detachListeners();
    };
  }, [detachListeners]);

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
