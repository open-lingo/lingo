/**
 * Microphone capture for the Whisper STT spike.
 *
 * Whisper expects 16 kHz mono `Float32Array` PCM. Browser AudioContexts
 * default to 44.1 or 48 kHz, so we capture at the native rate then
 * resample on stop. Resampling uses linear interpolation — adequate for
 * speech feature extraction; Whisper's own front-end is robust to
 * minor anti-aliasing artifacts at this conversion ratio.
 *
 * Capture uses `ScriptProcessorNode`, which is deprecated but
 * universally supported (AudioWorklet would be a separate worklet
 * module file we'd need to ship). Acceptable for a spike — flagged in
 * the followups list.
 *
 * The default capture pipeline:
 *   1. `getUserMedia({ audio: true })`
 *   2. `MediaStreamAudioSourceNode` → `ScriptProcessorNode` (buffer
 *      size 4096 samples ≈ 85 ms at 48 kHz).
 *   3. On each `onaudioprocess` we copy the mono channel into a list
 *      of `Float32Array` chunks. No analysis happens during capture.
 *   4. On `stop()`, we concatenate, resample to 16 kHz, and return.
 *
 * Endpointing is *not* implemented in this spike — the UI surfaces a
 * stop button. RMS-based VAD is queued as a follow-up.
 */

/** Target sample rate Whisper expects. */
export const WHISPER_SAMPLE_RATE = 16000;

/** Buffer size for the ScriptProcessorNode. 4096 ≈ 85 ms at 48 kHz. */
const SCRIPT_BUFFER_SIZE = 4096;

export type MicCaptureHandle = {
  /** Stop the mic and return the captured PCM at 16 kHz mono. */
  stop: () => Promise<Float32Array>;
  /** Abort without returning audio (e.g. component unmount). */
  abort: () => void;
  /** Native capture sample rate, exposed for diagnostics. */
  sourceSampleRate: number;
};

export type MicCaptureError =
  | "no-mic-permission"
  | "no-audio-context"
  | "no-stream"
  | "unknown";

export class MicCaptureFailure extends Error {
  code: MicCaptureError;
  constructor(code: MicCaptureError, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

/**
 * Begin microphone capture. Resolves once the stream is live and audio
 * is flowing.
 */
export async function startMicCapture(): Promise<MicCaptureHandle> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) {
    throw new MicCaptureFailure("no-stream", "navigator.mediaDevices missing");
  }
  const AudioCtor =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)
      : undefined;
  if (!AudioCtor) {
    throw new MicCaptureFailure("no-audio-context", "AudioContext missing");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    throw new MicCaptureFailure(
      "no-mic-permission",
      err instanceof Error ? err.message : "getUserMedia denied",
    );
  }

  const ctx = new AudioCtor();
  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated but ubiquitously supported. The
  // AudioWorklet replacement requires a separate worklet module file;
  // not worth it for a spike.
  const processor = ctx.createScriptProcessor(SCRIPT_BUFFER_SIZE, 1, 1);
  const chunks: Float32Array[] = [];
  let stopped = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    // Copy — the input buffer is reused by the engine.
    chunks.push(new Float32Array(input));
  };

  source.connect(processor);
  // Connecting to destination keeps the graph alive; we use a gain of
  // 0 so the user doesn't hear themselves.
  const muteSink = ctx.createGain();
  muteSink.gain.value = 0;
  processor.connect(muteSink);
  muteSink.connect(ctx.destination);

  const sourceSampleRate = ctx.sampleRate;

  function tearDown() {
    stopped = true;
    try {
      processor.disconnect();
    } catch {
      /* ignore */
    }
    try {
      source.disconnect();
    } catch {
      /* ignore */
    }
    try {
      muteSink.disconnect();
    } catch {
      /* ignore */
    }
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    if (ctx.state !== "closed") {
      ctx.close().catch(() => {
        /* ignore */
      });
    }
  }

  async function stop(): Promise<Float32Array> {
    if (stopped) {
      return new Float32Array(0);
    }
    stopped = true;
    // Drain pending events: ScriptProcessorNode fires `onaudioprocess`
    // synchronously inside the audio thread, so by the time we set
    // `stopped` and tear down, no more chunks land.
    tearDown();
    const merged = concatFloat32(chunks);
    if (sourceSampleRate === WHISPER_SAMPLE_RATE) return merged;
    return resampleLinear(merged, sourceSampleRate, WHISPER_SAMPLE_RATE);
  }

  function abort() {
    if (stopped) return;
    stopped = true;
    tearDown();
  }

  return { stop, abort, sourceSampleRate };
}

/** Concatenate a list of Float32Array chunks into one buffer. */
export function concatFloat32(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/**
 * Linear-interpolation resample. Output length is
 * `floor(input.length * to / from)`. Good enough for ASR; not for
 * music. Pure and deterministic — used in tests.
 *
 * Pass-through if rates match.
 */
export function resampleLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return input;
  if (input.length === 0) return new Float32Array(0);
  const ratio = fromRate / toRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = srcIndex - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
}

/**
 * Compute RMS amplitude of a Float32Array. Exposed for future VAD /
 * endpointing logic (and for tests of the resampler that want to
 * confirm energy is preserved).
 */
export function rms(buf: Float32Array): number {
  if (buf.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}
