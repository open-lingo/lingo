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
  nativeSpeechPluginName,
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

describe("Android: recognizer that dies without a stopped event", () => {
  // `@capacitor-community/speech-recognition` on Android resolves `start()`
  // as soon as listening begins and, on a recognizer error (silence timeout,
  // network, no match), rejects the ALREADY-RESOLVED call and emits nothing.
  // The only signal left is `isListening()` flipping to false. Without a
  // watchdog the hook shows "Listening…" forever.
  it("finishes with no-speech once isListening() reports false and nothing was heard", async () => {
    let listening = true;
    const { plugin, emit } = makePlugin({
      isListening: vi.fn(async () => ({ listening })),
    });
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));
    act(() => result.current.start());
    emit("listeningState", { status: "started" });
    await waitFor(() => expect(result.current.listening).toBe(true));

    listening = false; // recognizer died natively; no event follows
    await waitFor(() => expect(result.current.finished).toBe(true), { timeout: 3000 });
    expect(result.current.listening).toBe(false);
    expect(result.current.error).toBe("no-speech");
  });

  it("finishes cleanly (no error) if a transcript was heard before it died", async () => {
    let listening = true;
    const { plugin, emit } = makePlugin({
      isListening: vi.fn(async () => ({ listening })),
    });
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));
    act(() => result.current.start());
    emit("listeningState", { status: "started" });
    await waitFor(() => expect(result.current.listening).toBe(true));
    emit("partialResults", { matches: ["어머니"] });

    listening = false;
    await waitFor(() => expect(result.current.finished).toBe(true), { timeout: 3000 });
    expect(result.current.error).toBeNull();
    expect(result.current.transcript).toBe("어머니");
  });

  it("does not poll a plugin without isListening (the iOS Swift plugin)", async () => {
    const { plugin, emit } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));
    act(() => result.current.start());
    emit("listeningState", { status: "started" });
    await waitFor(() => expect(result.current.listening).toBe(true));
    await new Promise((r) => setTimeout(r, 900));
    expect(result.current.listening).toBe(true);
    expect(result.current.finished).toBe(false);
  });
});

describe("nativeSpeechPluginName", () => {
  it("binds Android to the community plugin's registered class name", () => {
    expect(nativeSpeechPluginName("android")).toBe("SpeechRecognition");
  });

  it("keeps iOS on the in-repo Swift plugin", () => {
    expect(nativeSpeechPluginName("ios")).toBe("SpeechRecognizer");
  });

  it("falls back to the Swift name for anything else (never picks a plugin that can't link)", () => {
    expect(nativeSpeechPluginName("web")).toBe("SpeechRecognizer");
  });
});

describe("Android: plugin whose stop() never settles", () => {
  // Verified on the emulator 2026-09-04: the community plugin's Java `stop()`
  // calls `stopListening()` and returns without ever resolving the call (it
  // only rejects on exception). An unbounded `await p.stop()` therefore left
  // the step on "Stop recording" after every manual tap-to-stop.
  it("still marks the attempt finished after a manual stop", async () => {
    const { plugin, emit } = makePlugin({
      stop: vi.fn(() => new Promise<void>(() => undefined)),
    });
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));
    await act(async () => result.current.start());
    await act(async () => emit("listeningState", { status: "started" }));
    await waitFor(() => expect(result.current.listening).toBe(true));

    await act(async () => result.current.stop());

    await waitFor(
      () => {
        expect(result.current.listening).toBe(false);
        expect(result.current.finished).toBe(true);
      },
      { timeout: 3000 },
    );
    expect(result.current.error).toBeNull();
  });
});

describe("preloaded accepted readings + warm-up (TestFlight #171, #155)", () => {
  it("hands the accepted readings to the native request as contextualStrings", async () => {
    const { plugin } = makePlugin();
    const { result } = renderHook(() =>
      useNativeSpeechRecognition("ja-JP", {
        plugin,
        contextualStrings: ["テレビ", "てれび"],
      }),
    );
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => result.current.start());

    // `SFSpeechAudioBufferRecognitionRequest.contextualStrings` is the only
    // place we can tell the recognizer what this step is asking for, and the
    // list is known at mount — sending it is the whole of #171's first half.
    await waitFor(() =>
      expect(plugin.start).toHaveBeenCalledWith(
        expect.objectContaining({ contextualStrings: ["テレビ", "てれび"] }),
      ),
    );
  });

  it("omits contextualStrings entirely when the step has none", async () => {
    const { plugin } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => result.current.start());

    await waitFor(() => expect(plugin.start).toHaveBeenCalled());
    const opts = (plugin.start as unknown as { mock: { calls: [Record<string, unknown>][] } })
      .mock.calls[0][0];
    expect(opts).not.toHaveProperty("contextualStrings");
  });

  it("prepare() warms authorization and the recognizer without opening the mic", async () => {
    const prepare = vi.fn(async () => ({ prepared: true }));
    const { plugin } = makePlugin({
      prepare,
      checkPermissions: vi.fn(async () => ({ speechRecognition: "prompt" as const })),
    });
    const { result } = renderHook(() =>
      useNativeSpeechRecognition("ja-JP", { plugin, contextualStrings: ["テレビ"] }),
    );
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => result.current.prepare?.());

    // The permission round-trip is the expensive half of "slow to initialize",
    // and it happens here instead of behind the learner's first tap.
    await waitFor(() => expect(plugin.requestPermissions).toHaveBeenCalled());
    await waitFor(() =>
      expect(prepare).toHaveBeenCalledWith(
        expect.objectContaining({ language: "ja-JP", contextualStrings: ["テレビ"] }),
      ),
    );
    // Warming must never open the mic — that is what the tap is for.
    expect(plugin.start).not.toHaveBeenCalled();
    expect(result.current.listening).toBe(false);
  });

  it("prepare() is a no-op on a plugin too old to implement it", async () => {
    const { plugin } = makePlugin();
    expect(plugin.prepare).toBeUndefined();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => result.current.prepare?.());

    expect(result.current.error).toBeNull();
  });

  it("reports where the startup time went when timings are collected", async () => {
    const { plugin, emit } = makePlugin();
    const { result } = renderHook(() =>
      useNativeSpeechRecognition("ko-KR", { plugin, collectTimings: true }),
    );
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => result.current.start());
    await act(async () =>
      emit("listeningState", {
        status: "started",
        timings: { permissions: 1, audioSession: 42, engine: 31, task: 8, total: 82 },
      }),
    );
    await act(async () => emit("partialResults", { matches: ["안녕하세요"] }));

    await waitFor(() => {
      expect(result.current.timings?.tapToStart).not.toBeNull();
      expect(result.current.timings?.tapToFirstPartial).not.toBeNull();
    });
    // The native breakdown is what says WHICH phase is slow — a 42 ms audio
    // session and a 31 ms engine start are a different bug from a 3 s
    // permission prompt.
    expect(result.current.timings?.native).toMatchObject({ audioSession: 42 });
  });

  it("collects nothing when the debug dial is off", async () => {
    const { plugin, emit } = makePlugin();
    const { result } = renderHook(() => useNativeSpeechRecognition("ko-KR", { plugin }));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(async () => result.current.start());
    await act(async () => emit("listeningState", { status: "started", timings: { total: 9 } }));

    expect(result.current.timings?.tapToStart).toBeNull();
    expect(result.current.timings?.native).toBeUndefined();
  });
});
