/**
 * Dev-only speech-attempt log buffer.
 *
 * Captures each Whisper recognition attempt so the `?dev=1` LearnDevPanel
 * can render a "Speech log" expander for triage. Last 20 entries kept
 * in-memory; never persisted, never logged to console unless the dev
 * flag is on. Subscribers (the dev panel) re-render on push.
 *
 * Used by SpeakingStepView's 2-attempt flow (R1.3c, 2026-05-17). Spencer
 * uses this surface to see why a learner failed twice without making
 * them eat a "wrong" — verdict "auto-pass" lands here so we can spot
 * patterns (kana the model consistently misreads, etc.).
 */
import { isDevUnlockOn } from "@/shared/domain/mockProgress";

export type SpeechLogVerdict = "pass" | "fail" | "auto-pass";

export type SpeechLogEntry = {
  stepId: string;
  targetKana: string;
  transcriptKana: string;
  attemptNumber: 1 | 2;
  verdict: SpeechLogVerdict;
  /** Epoch ms. */
  timestamp: number;
};

const MAX_ENTRIES = 20;

const buffer: SpeechLogEntry[] = [];
const subscribers = new Set<() => void>();

export function pushSpeechLog(entry: SpeechLogEntry): void {
  buffer.push(entry);
  while (buffer.length > MAX_ENTRIES) buffer.shift();
  // Only mirror to console when the dev flag is on — keeps prod silent.
  if (isDevUnlockOn()) {
    // eslint-disable-next-line no-console
    console.info(
      `[speech] ${entry.stepId} #${entry.attemptNumber} "${entry.transcriptKana}" vs "${entry.targetKana}" → ${entry.verdict}`,
    );
  }
  for (const fn of subscribers) fn();
}

/** Returns a snapshot (newest last). Callers must not mutate. */
export function getSpeechLog(): readonly SpeechLogEntry[] {
  return buffer;
}

export function subscribeSpeechLog(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/** Test / dev helper — clears the buffer + notifies subscribers. */
export function __clearSpeechLog(): void {
  buffer.length = 0;
  for (const fn of subscribers) fn();
}
