/**
 * Web Worker hosting the transformers.js Whisper pipeline.
 *
 * Why a worker: the ONNX runtime + Whisper model load is heavy
 * (~80–150 MB on first run, multi-second WASM compile), and inference
 * is CPU-bound when WebGPU is unavailable. Running on the main thread
 * janks the React tree. Workers are also the only way to use
 * SharedArrayBuffer-backed WASM threads without cross-origin
 * isolation gymnastics on the main document.
 *
 * Messaging protocol (typed via `WhisperWorkerInbound` / Outbound):
 *
 *   main → worker:
 *     { type: 'init' }                 — load model (only once)
 *     { type: 'transcribe', pcm }      — run ASR on Float32Array
 *     { type: 'terminate' }            — best-effort cleanup
 *
 *   worker → main:
 *     { type: 'progress', loaded, total, file }  — download progress
 *     { type: 'ready', device }                  — pipeline initialized
 *     { type: 'result', text, durationMs }       — transcription done
 *     { type: 'error', code, message }           — anything went wrong
 *
 * Init policy: WebGPU first, WASM fallback. We try WebGPU; if the
 * pipeline throws during creation OR during the first dummy warmup
 * (caller-driven), we re-init on WASM and re-emit `ready`.
 *
 * This file is consumed via Vite's `?worker` syntax. See
 * `useWhisperRecognition.ts` for the main-thread wrapper.
 */

/// <reference lib="webworker" />

// Lazy-loaded so the worker bundle stays small until init runs.
// The transformers.js entry pulls in onnxruntime-web, which is a
// significant chunk. We do not import it at module scope.

export type WhisperWorkerInbound =
  | { type: "init"; modelId?: string }
  | { type: "transcribe"; pcm: Float32Array; language?: string }
  | { type: "terminate" };

export type WhisperDevice = "webgpu" | "wasm";

export type WhisperWorkerOutbound =
  | {
      type: "progress";
      loaded?: number;
      total?: number;
      file?: string;
      status?: string;
      progress?: number;
    }
  | { type: "ready"; device: WhisperDevice }
  | {
      type: "result";
      text: string;
      durationMs: number;
    }
  | {
      type: "error";
      code: "init-failed" | "transcribe-failed" | "not-ready" | "unknown";
      message: string;
    };

/* eslint-disable @typescript-eslint/no-explicit-any */
type WhisperPipeline = ((
  audio: Float32Array,
  opts: Record<string, unknown>,
) => Promise<{ text: string } | Array<{ text: string }>>) & {
  tokenizer?: any;
  processor?: { tokenizer?: any };
};

let pipelineRef: WhisperPipeline | null = null;
let activeDevice: WhisperDevice | null = null;
let englishSuppressTokens: number[] = [];

/**
 * Build a list of token IDs whose decoded form contains Latin letters.
 * Pass these via `suppress_tokens` on transcribe to keep Whisper from
 * emitting English words/romaji for Japanese input — "ryu" famously
 * gets decoded as "you" otherwise. Soft-fails to [] on any tokenizer
 * shape we don't recognize; the convertToHiragana post-filter is the
 * fallback safety net.
 */
function buildEnglishSuppressList(pipe: WhisperPipeline): number[] {
  try {
    const tok = pipe.tokenizer ?? pipe.processor?.tokenizer;
    if (!tok) return [];
    const vocab = tok.model?.vocab ?? tok.get_vocab?.() ?? tok.vocab ?? null;
    if (!vocab) return [];

    const ids: number[] = [];
    const isLatin = /[a-zA-Z]/;
    const collect = (token: string, id: number) => {
      if (typeof id === "number" && isLatin.test(token)) ids.push(id);
    };

    if (vocab instanceof Map) {
      for (const [tok, id] of vocab.entries()) collect(String(tok), id);
    } else if (typeof vocab === "object") {
      for (const [tok, id] of Object.entries(vocab))
        collect(tok, id as number);
    }
    return ids;
  } catch {
    return [];
  }
}

async function initPipeline(
  modelId: string,
  device: WhisperDevice,
): Promise<WhisperPipeline> {
  // Dynamic import — keeps the worker bootstrap fast and lets Vite
  // chunk the heavy ONNX runtime separately.
  const mod: any = await import("@huggingface/transformers");
  const { pipeline } = mod;

  function progressCallback(p: any) {
    const out: WhisperWorkerOutbound = {
      type: "progress",
      file: p?.file,
      loaded: p?.loaded,
      total: p?.total,
      status: p?.status,
      progress: p?.progress,
    };
    (self as unknown as Worker).postMessage(out);
  }

  // dtype: 'q8' shrinks the model to ~80 MB; WebGPU prefers fp32/fp16
  // but 'q8' is the cross-target default that loads on both backends
  // in transformers.js 3.x+. If a host doesn't support q8 on the
  // chosen device, transformers.js falls back internally.
  const pipe: WhisperPipeline = await pipeline(
    "automatic-speech-recognition",
    modelId,
    {
      device,
      dtype: device === "webgpu" ? "fp32" : "q8",
      progress_callback: progressCallback,
    },
  );
  return pipe;
}

async function handleInit(modelId: string) {
  // Try WebGPU first.
  try {
    pipelineRef = await initPipeline(modelId, "webgpu");
    activeDevice = "webgpu";
    englishSuppressTokens = buildEnglishSuppressList(pipelineRef);
    const ready: WhisperWorkerOutbound = { type: "ready", device: "webgpu" };
    (self as unknown as Worker).postMessage(ready);
    return;
  } catch (err) {
    // Swallow and fall through to WASM. We surface the WebGPU failure
    // only via a progress note for diagnostics; the real error is
    // emitted only if WASM also fails.
    const note: WhisperWorkerOutbound = {
      type: "progress",
      status: "webgpu-unavailable",
      file: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(note);
  }

  try {
    pipelineRef = await initPipeline(modelId, "wasm");
    activeDevice = "wasm";
    englishSuppressTokens = buildEnglishSuppressList(pipelineRef);
    const ready: WhisperWorkerOutbound = { type: "ready", device: "wasm" };
    (self as unknown as Worker).postMessage(ready);
  } catch (err) {
    const errOut: WhisperWorkerOutbound = {
      type: "error",
      code: "init-failed",
      message: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(errOut);
    pipelineRef = null;
    activeDevice = null;
  }
}

// 16kHz mono, ~400ms of silence on each side. Whisper's no-speech head
// reads the very start of the spectrogram; if the utterance starts at
// t=0 the model is more likely to emit a YouTube-style closer ("ご視聴
// ありがとうございました") as a hallucinated fallback. A short silence
// pad pushes the audio off the boundary and consistently improves
// recognition on sub-second utterances.
const SILENCE_PAD_SAMPLES = Math.round(16000 * 0.4);

function padWithSilence(pcm: Float32Array): Float32Array {
  const padded = new Float32Array(pcm.length + SILENCE_PAD_SAMPLES * 2);
  padded.set(pcm, SILENCE_PAD_SAMPLES);
  return padded;
}

async function handleTranscribe(pcm: Float32Array, language: string) {
  if (!pipelineRef) {
    const errOut: WhisperWorkerOutbound = {
      type: "error",
      code: "not-ready",
      message: "pipeline not initialized",
    };
    (self as unknown as Worker).postMessage(errOut);
    return;
  }
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const padded = padWithSilence(pcm);
    const out = await pipelineRef(padded, {
      language,
      task: "transcribe",
      return_timestamps: false,
      chunk_length_s: 5,
      stride_length_s: 1,
      // Greedy deterministic decode. Beam search + sampling are where
      // hallucinated YouTube closers come from on short clips.
      num_beams: 1,
      do_sample: false,
      temperature: 0,
      // Whisper's "condition on previous text" lets prior transcription
      // bias the current one. Useless for one-shot utterances and a
      // known source of drift / loops on short audio.
      condition_on_previous_text: false,
      // Prevents the 3-gram repeat loops Whisper falls into on near-
      // silent inputs.
      no_repeat_ngram_size: 3,
      // Suppress every token whose decoded form contains [a-zA-Z]. Built
      // once at init; empty array is a no-op. Stops Whisper from
      // returning English words / romaji for Japanese input (e.g. "ryu"
      // → "you", or kana getting transliterated as latin).
      ...(englishSuppressTokens.length > 0
        ? { suppress_tokens: englishSuppressTokens }
        : {}),
    });
    const text = Array.isArray(out)
      ? (out[0]?.text ?? "")
      : (out?.text ?? "");
    const t1 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const result: WhisperWorkerOutbound = {
      type: "result",
      text: typeof text === "string" ? text : String(text ?? ""),
      durationMs: t1 - t0,
    };
    (self as unknown as Worker).postMessage(result);
  } catch (err) {
    const errOut: WhisperWorkerOutbound = {
      type: "error",
      code: "transcribe-failed",
      message: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(errOut);
  }
}

self.onmessage = (event: MessageEvent<WhisperWorkerInbound>) => {
  const msg = event.data;
  if (!msg) return;
  switch (msg.type) {
    case "init":
      void handleInit(msg.modelId ?? "Xenova/whisper-small");
      return;
    case "transcribe":
      void handleTranscribe(msg.pcm, msg.language ?? "japanese");
      return;
    case "terminate":
      pipelineRef = null;
      activeDevice = null;
      // The host calls worker.terminate() after — we just drop the
      // pipeline reference here so any in-flight inference completes
      // its current frame and exits.
      return;
  }
};

// Avoid "this file is not a module" complaints under isolatedModules.
export {};
/* eslint-enable @typescript-eslint/no-explicit-any */
// Silence unused-var lint for the exported type union when nothing
// imports the runtime side of this file directly.
export type _ActiveDeviceProbe = typeof activeDevice;
