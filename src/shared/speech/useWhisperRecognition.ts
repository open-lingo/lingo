/**
 * React hook for on-device Whisper STT (Path B from the speech-research
 * spec). Mirrors the shape of `useSpeechRecognition` so the consumer can
 * pick a backend by query param without branching its render code.
 *
 * Flow:
 *   idle → loading (model download + WASM init) → ready
 *     → start() → recording → stop() → transcribing → finished
 *
 * The worker is created lazily on first `start()` call so the heavy
 * ONNX runtime chunk doesn't land in the main bundle. After init it is
 * kept alive for the lifetime of the hook (model stays warm).
 *
 * The hook returns:
 *   - the same `UseSpeechRecognitionApi`-compatible fields the Web
 *     Speech API hook exposes (listening, transcript, alternatives,
 *     finished, error, supported, start/stop/reset)
 *   - plus Whisper-specific surface area: `status`, `downloadProgress`,
 *     `device` (webgpu | wasm | null).
 *
 * Errors flow through the shared `SpeechErrorCode` union for any code
 * the caller already handles; Whisper-specific causes degrade to
 * `unknown` with a separate `error` ref the debug panel can pick up.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  startMicCapture,
  MicCaptureFailure,
  type MicCaptureHandle,
} from "./audioCapture";
import type {
  SpeechAlternative,
  SpeechErrorCode,
  UseSpeechRecognitionApi,
} from "./useSpeechRecognition";
import type {
  WhisperDevice,
  WhisperWorkerInbound,
  WhisperWorkerOutbound,
} from "./whisper-worker";

export type WhisperStatus =
  | "idle"
  | "loading"
  | "ready"
  | "recording"
  | "transcribing"
  | "error";

export type UseWhisperRecognitionApi = UseSpeechRecognitionApi & {
  /** Detailed status surfaced for the load / record / transcribe UI. */
  status: WhisperStatus;
  /** 0..1 model download progress, or null when not loading. */
  downloadProgress: number | null;
  /** Backend the pipeline is running on, once initialized. */
  device: WhisperDevice | null;
};

/**
 * Worker factory — overridable in tests. The default uses Vite's
 * worker import syntax. In a test environment (vitest + happy-dom) we
 * inject a stub instead.
 */
export type WhisperWorkerFactory = () => Worker;

const defaultWorkerFactory: WhisperWorkerFactory = () => {
  return new Worker(new URL("./whisper-worker.ts", import.meta.url), {
    type: "module",
  });
};

export type UseWhisperRecognitionOptions = {
  /** Override the worker factory in tests. */
  workerFactory?: WhisperWorkerFactory;
  /** Override the mic-capture starter in tests. */
  startMicCapture?: typeof startMicCapture;
};

/**
 * The single Whisper-small model id we ship in the spike. Quantized
 * variants land via the `dtype` option inside the worker.
 */
export const DEFAULT_WHISPER_MODEL = "Xenova/whisper-small";

export function useWhisperRecognition(
  lang: string = "ja",
  options: UseWhisperRecognitionOptions = {},
): UseWhisperRecognitionApi {
  const workerFactory = options.workerFactory ?? defaultWorkerFactory;
  const startCapture = options.startMicCapture ?? startMicCapture;

  const workerRef = useRef<Worker | null>(null);
  const initStartedRef = useRef(false);
  const captureRef = useRef<MicCaptureHandle | null>(null);

  const [status, setStatus] = useState<WhisperStatus>("idle");
  const [device, setDevice] = useState<WhisperDevice | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [alternatives, setAlternatives] = useState<SpeechAlternative[]>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<SpeechErrorCode | null>(null);

  // When a workerFactory override is supplied (i.e. tests, or a future
  // host that wraps the worker), we trust the caller and skip the
  // capability sniff. Otherwise require Worker + AudioContext to be
  // present on the window. happy-dom omits Worker, so the prod check
  // would otherwise short-circuit every unit test of this hook.
  const supported =
    options.workerFactory !== undefined ||
    (typeof window !== "undefined" &&
      typeof Worker !== "undefined" &&
      typeof AudioContext !== "undefined");

  /** Wire a worker. Called once per hook lifetime. */
  const ensureWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    if (!supported) return null;
    let w: Worker;
    try {
      w = workerFactory();
    } catch {
      setError("unknown");
      setStatus("error");
      return null;
    }

    w.onmessage = (event: MessageEvent<WhisperWorkerOutbound>) => {
      const msg = event.data;
      if (!msg) return;
      switch (msg.type) {
        case "progress": {
          if (
            typeof msg.loaded === "number" &&
            typeof msg.total === "number" &&
            msg.total > 0
          ) {
            setDownloadProgress(msg.loaded / msg.total);
          } else if (typeof msg.progress === "number") {
            setDownloadProgress(msg.progress / 100);
          }
          return;
        }
        case "ready": {
          setDevice(msg.device);
          setDownloadProgress(null);
          setStatus((s) => (s === "loading" ? "ready" : s));
          return;
        }
        case "result": {
          const text = msg.text.trim();
          setTranscript(text);
          setAlternatives(text ? [{ transcript: text }] : []);
          setFinished(true);
          setStatus("ready");
          setListening(false);
          return;
        }
        case "error": {
          setError("unknown");
          setStatus("error");
          setListening(false);
          setFinished(true);
          return;
        }
      }
    };

    w.onerror = () => {
      setError("unknown");
      setStatus("error");
      setListening(false);
    };

    workerRef.current = w;
    return w;
  }, [supported, workerFactory]);

  // Teardown on unmount.
  useEffect(() => {
    return () => {
      const w = workerRef.current;
      if (w) {
        try {
          const msg: WhisperWorkerInbound = { type: "terminate" };
          w.postMessage(msg);
          w.terminate();
        } catch {
          /* ignore */
        }
        workerRef.current = null;
      }
      const c = captureRef.current;
      if (c) {
        try {
          c.abort();
        } catch {
          /* ignore */
        }
        captureRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setAlternatives([]);
    setFinished(false);
    setError(null);
  }, []);

  const ensureInit = useCallback(() => {
    if (initStartedRef.current) return;
    const w = ensureWorker();
    if (!w) return;
    initStartedRef.current = true;
    setStatus("loading");
    setDownloadProgress(0);
    const msg: WhisperWorkerInbound = {
      type: "init",
      modelId: DEFAULT_WHISPER_MODEL,
    };
    w.postMessage(msg);
  }, [ensureWorker]);

  const start = useCallback(() => {
    if (!supported) {
      setError("not-supported");
      return;
    }
    reset();
    // First call: kick off model init. We still try to capture audio
    // in parallel — if the user grants the mic before the model is
    // ready, we'll buffer their PCM and just wait on the ready event
    // before posting the transcribe message. Simpler: gate recording
    // until ready. We pick the simpler path.
    if (status === "idle") {
      ensureInit();
    }
    if (status !== "ready" && status !== "idle") {
      // Still loading or already recording — surface a soft no-op.
      return;
    }

    void (async () => {
      try {
        const handle = await startCapture();
        captureRef.current = handle;
        setListening(true);
        setStatus("recording");
        setFinished(false);
      } catch (err) {
        if (err instanceof MicCaptureFailure) {
          if (err.code === "no-mic-permission") setError("no-mic");
          else setError("audio-capture");
        } else {
          setError("unknown");
        }
        setStatus((s) => (s === "ready" || s === "idle" ? s : "error"));
        setListening(false);
      }
    })();
  }, [supported, status, reset, ensureInit, startCapture]);

  const stop = useCallback(() => {
    const handle = captureRef.current;
    if (!handle) return;
    captureRef.current = null;
    setListening(false);
    setStatus("transcribing");
    void (async () => {
      let pcm: Float32Array;
      try {
        pcm = await handle.stop();
      } catch {
        setError("audio-capture");
        setStatus("error");
        setFinished(true);
        return;
      }
      if (pcm.length === 0) {
        setError("no-speech");
        setStatus("ready");
        setFinished(true);
        return;
      }
      const w = workerRef.current;
      if (!w) {
        setError("unknown");
        setStatus("error");
        setFinished(true);
        return;
      }
      const msg: WhisperWorkerInbound = {
        type: "transcribe",
        pcm,
        language: lang,
      };
      // Transfer the PCM buffer to the worker to avoid the copy.
      try {
        w.postMessage(msg, [pcm.buffer]);
      } catch {
        // Fallback: structured clone (no transfer).
        w.postMessage(msg);
      }
    })();
  }, [lang]);

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
    status,
    downloadProgress,
    device,
  };
}
