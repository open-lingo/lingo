/**
 * Native-build stand-in for `useWhisperRecognition.ts`.
 *
 * Perf review 2026-09-17 (docs/perf-2026-09-17.md §1, lane A4b): on a
 * shipped native build `SpeakingStepView` always picks `nativeRecog`
 * (`usingNative = IS_NATIVE` short-circuits before the engine dial is even
 * read — see the fallback-selection block in `SpeakingStepView.tsx`), so the
 * real `useWhisperRecognition` hook's worker/model machinery can never run
 * there. The real hook is still statically imported by that file (rules of
 * hooks require every branch to mount), so without this swap the whole
 * transformers.js + onnxruntime-web + WASM dependency graph — 5.75 MB
 * compressed / ~21% of the build-25 IPA — ships to every install anyway,
 * unreachable.
 *
 * `vite.config.ts` aliases `@/shared/speech/useWhisperRecognition` to THIS
 * file only under `--mode native` (see the `resolve.alias` block there), so
 * the real file — and everything it dynamically imports — is never part of
 * the native module graph at all. Web builds are completely unaffected: the
 * alias is mode-gated, so `npm run build` / `npm run dev` / vitest all keep
 * resolving to the real hook.
 *
 * `SpeechTunePage.tsx` (a `?dev`-only STT tuning tool, not a learner-facing
 * route) also references this hook. On native it degrades to "unsupported"
 * for the Whisper engine toggle, same as it already does in any browser
 * missing `Worker`/`AudioContext` — a pre-existing, handled state, not a new
 * failure mode.
 *
 * Shape must stay in lockstep with `UseWhisperRecognitionApi` /
 * `WhisperStatus` in `useWhisperRecognition.ts` — `useWhisperRecognition.ts`
 * itself is unchanged; only native builds ever see this file.
 */
import { useCallback, useMemo } from "react";
import type { SpeechAlternative, SpeechErrorCode } from "./useSpeechRecognition";

export type WhisperStatus =
  | "idle"
  | "loading"
  | "ready"
  | "recording"
  | "transcribing"
  | "error";

export type UseWhisperRecognitionApi = {
  listening: boolean;
  transcript: string;
  alternatives: SpeechAlternative[];
  finished: boolean;
  error: SpeechErrorCode | null;
  supported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  status: WhisperStatus;
  downloadProgress: number | null;
  device: "webgpu" | "wasm" | null;
};

/**
 * Always-unsupported stand-in. `lang`/options are accepted (and ignored) so
 * call sites don't need a native-only branch of their own.
 */
export function useWhisperRecognition(
  _lang?: string,
  _options?: unknown,
): UseWhisperRecognitionApi {
  const start = useCallback(() => {
    /* no-op: Whisper never runs on native, see file header */
  }, []);
  const stop = useCallback(() => {}, []);
  const reset = useCallback(() => {}, []);
  return useMemo(
    () => ({
      listening: false,
      transcript: "",
      alternatives: [],
      finished: false,
      error: "not-supported" as SpeechErrorCode,
      supported: false,
      start,
      stop,
      reset,
      status: "error" as WhisperStatus,
      downloadProgress: null,
      device: null,
    }),
    [start, stop, reset],
  );
}
