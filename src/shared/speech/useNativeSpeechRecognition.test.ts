/**
 * Native (iOS SFSpeechRecognizer) recognizer.
 *
 * The Web Speech API does not exist in WKWebView — `webkitSpeechRecognition`
 * is a Safari-the-browser feature — and the Whisper fallback cannot load in a
 * shipped build either: its weights come from HuggingFace at runtime and the
 * CSP has no such origin (and `whisper-small` is ~240 MB, which is not a thing
 * to fetch mid-lesson on a phone). So on device the speaking step had no
 * working recognizer at all.
 *
 * The plugin is injected rather than module-mocked so these tests exercise the
 * real hook wiring, matching `useWhisperRecognition`'s `WhisperWorkerFactory`
 * convention.
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useNativeSpeechRecognition,
  type NativeSpeechPlugin,
} from "./useNativeSpeechRecognition";

/** Fake plugin that lets a test drive partialResults/listeningState by hand. */
function makePlugin(overrides: Partial<NativeSpeechPlugin> = {}) {
  const listeners: Record<string, ((d: never) => void)[]> = {};
  const plugin: NativeSpeechPlugin = {
    available: vi.fn(async () => ({ available: true })),
    checkPermissions: vi.fn(async () => ({ speechRecognition: "granted" as const })),
    requestPermissions: vi.fn(async () => ({ speechRecognition: "granted" as const })),
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    addListener: vi.fn(async (event: string, fn: (d: never) => void) => {
      (listeners[event] ??= []).push(fn);
      // A real Capacitor handle detaches on `remove()`. The fake must too,
      // otherwise a leaked listener — the actual bug on device, where every
      // retry stacked another `listeningState` subscription — looks clean here.
      return {
        remove: async () => {
          listeners[event] = (listeners[event] ?? []).filter((l) => l !== fn);
        },
      };
    }),
    ...overrides,
  };
  const emit = (event: string, data: unknown) =>
    [...(listeners[event] ?? [])].forEach((fn) => fn(data as never));
  const count = (event: string) => (listeners[event] ?? []).length;
  return { plugin, emit, count };
}

describe("useNativeSpeechRecognition", () => {
  it("reports unsupported when the plugin says the recognizer is unavailable", async () => {
    const { plugin } = makePlugin({ available: vi.fn(async () => ({ available: false })) });
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(false));
  });

  it("streams partial transcripts while listening, before any final result", async () => {
    const { plugin, emit } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.listening).toBe(true));

    // The whole point: transcript updates mid-utterance, so the caller can
    // score and stop early instead of waiting for the recognizer to time out.
    await act(async () => emit("partialResults", { matches: ["안녕"] }));
    await waitFor(() => expect(result.current.transcript).toBe("안녕"));
    expect(result.current.finished).toBe(false);

    await act(async () => emit("partialResults", { matches: ["안녕하세요"] }));
    await waitFor(() => expect(result.current.transcript).toBe("안녕하세요"));
  });

  it("stop() closes the mic and marks the attempt finished", async () => {
    const { plugin } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.listening).toBe(true));

    await act(async () => {
      result.current.stop();
    });
    await waitFor(() => expect(result.current.finished).toBe(true));
    expect(plugin.stop).toHaveBeenCalled();
    expect(result.current.listening).toBe(false);
  });

  it("surfaces a denied microphone permission as an error rather than hanging", async () => {
    const { plugin } = makePlugin({
      requestPermissions: vi.fn(async () => ({ speechRecognition: "denied" as const })),
      checkPermissions: vi.fn(async () => ({ speechRecognition: "denied" as const })),
    });
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.error).toBe("no-mic"));
    expect(plugin.start).not.toHaveBeenCalled();
  });

  it("passes the locale through and asks for partial results", async () => {
    const { plugin } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(plugin.start).toHaveBeenCalled());
    expect(vi.mocked(plugin.start).mock.calls[0][0]).toMatchObject({
      language: "ko-KR",
      partialResults: true,
    });
  });

  it("does not stack listeners when the learner retries after a miss", async () => {
    // On device this leaked: the recognizer ending on its own (silence
    // endpointing, which is the normal way a wrong answer finishes) left the
    // previous attempt's `listeningState` and `partialResults` subscriptions
    // attached, so attempt N saw every native event N times. The native log
    // showed `started` twice and `stopped` four times on the second try.
    const { plugin, emit, count } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(count("listeningState")).toBe(1));

    // The recognizer ends by itself — no `stop()` from the UI, which is the
    // path that skipped the cleanup.
    await act(async () => {
      emit("listeningState", { status: "stopped" });
    });
    await waitFor(() => expect(result.current.finished).toBe(true));

    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.listening).toBe(true));

    expect(count("listeningState")).toBe(1);
    expect(count("partialResults")).toBe(1);
  });

  it("surfaces an error when the recognizer dies without transcribing", async () => {
    // `SFSpeechRecognizer` can fail to initialize entirely — iOS marks a
    // locale's offline model as installed before (or without) the asset
    // actually landing, and then routes to the local recognizer and fails
    // with `kLSRErrorDomain 300`. Reporting only "stopped" leaves the step
    // sitting on an empty transcript as though the learner had said nothing,
    // with no way out. An error flips the view to its skip escape.
    const { plugin, emit } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.listening).toBe(true));

    await act(async () => {
      emit("listeningState", { status: "stopped", error: "recognizer-unavailable" });
    });

    await waitFor(() => expect(result.current.error).toBe("unknown"));
    expect(result.current.finished).toBe(true);
    expect(result.current.listening).toBe(false);
  });
});
