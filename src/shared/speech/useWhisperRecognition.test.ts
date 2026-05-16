/**
 * Tests for `useWhisperRecognition` with the worker stubbed out.
 *
 * We don't load the real transformers.js pipeline (model fetch is
 * non-deterministic and far too slow for CI). Instead we hand-roll a
 * stub `Worker` that mimics the protocol from `whisper-worker.ts` and
 * assert the hook's state machine moves through the expected phases.
 */
import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWhisperRecognition } from "./useWhisperRecognition";
import type {
  WhisperWorkerInbound,
  WhisperWorkerOutbound,
} from "./whisper-worker";

class StubWorker {
  onmessage: ((e: MessageEvent<WhisperWorkerOutbound>) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  last: WhisperWorkerInbound | null = null;
  terminated = false;

  postMessage(msg: WhisperWorkerInbound, _transfer?: Transferable[]) {
    this.last = msg;
  }
  terminate() {
    this.terminated = true;
  }
  emit(msg: WhisperWorkerOutbound) {
    this.onmessage?.({ data: msg } as MessageEvent<WhisperWorkerOutbound>);
  }
}

function stubMicCapture(pcm = new Float32Array([0.1, 0.2, 0.3])) {
  return async () => ({
    stop: async () => pcm,
    abort: () => undefined,
    sourceSampleRate: 16000,
  });
}

describe("useWhisperRecognition", () => {
  it("starts in idle, transitions through loading → ready on init", async () => {
    const stub = new StubWorker();
    const { result } = renderHook(() =>
      useWhisperRecognition("ja", {
        workerFactory: () => stub as unknown as Worker,
        startMicCapture: stubMicCapture(),
      }),
    );

    expect(result.current.status).toBe("idle");

    // Calling start() kicks init AND tries to capture mic.
    await act(async () => {
      result.current.start();
    });

    // init message was posted to the worker.
    expect(stub.last?.type).toBe("init");
    // Status is either still "loading" (model not ready yet) or
    // already "recording" (mic capture promise resolved first in the
    // microtask queue under happy-dom). Both are valid transition
    // points — the user-visible loading UI fires off `downloadProgress`.
    expect(["loading", "recording"]).toContain(result.current.status);

    // Emit a progress event.
    await act(async () => {
      stub.emit({ type: "progress", loaded: 50, total: 100 });
    });
    expect(result.current.downloadProgress).toBeCloseTo(0.5);

    // Emit ready.
    await act(async () => {
      stub.emit({ type: "ready", device: "wasm" });
    });
    // After ready, the in-flight mic capture finishes and listening
    // flips on (the recording state).
    expect(["recording", "ready"]).toContain(result.current.status);
    expect(result.current.device).toBe("wasm");
  });

  it("posts transcribe with PCM on stop() and surfaces the result", async () => {
    const stub = new StubWorker();
    const pcm = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    const { result } = renderHook(() =>
      useWhisperRecognition("ja", {
        workerFactory: () => stub as unknown as Worker,
        startMicCapture: stubMicCapture(pcm),
      }),
    );

    await act(async () => {
      result.current.start();
    });
    await act(async () => {
      stub.emit({ type: "ready", device: "wasm" });
    });
    // Allow the mic capture promise to settle.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.listening).toBe(true);
    expect(result.current.status).toBe("recording");

    await act(async () => {
      result.current.stop();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(stub.last?.type).toBe("transcribe");
    expect(result.current.status).toBe("transcribing");

    await act(async () => {
      stub.emit({
        type: "result",
        text: "あい",
        durationMs: 120,
      });
    });

    expect(result.current.transcript).toBe("あい");
    expect(result.current.alternatives.length).toBe(1);
    expect(result.current.alternatives[0].transcript).toBe("あい");
    expect(result.current.finished).toBe(true);
    expect(result.current.status).toBe("ready");
  });

  it("surfaces a worker error as unknown SpeechErrorCode + error status", async () => {
    const stub = new StubWorker();
    const { result } = renderHook(() =>
      useWhisperRecognition("ja", {
        workerFactory: () => stub as unknown as Worker,
        startMicCapture: stubMicCapture(),
      }),
    );

    await act(async () => {
      result.current.start();
    });
    await act(async () => {
      stub.emit({
        type: "error",
        code: "init-failed",
        message: "no wasm",
      });
    });

    expect(result.current.error).toBe("unknown");
    expect(result.current.status).toBe("error");
  });
});
