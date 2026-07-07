import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DialogueListenStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const TURN_GAP_MS = 400;
const CELEBRATE_MS = 1100;

type Props = {
  step: DialogueListenStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Dialogue-listen renderer — plays a 2-4 turn dialogue sequentially, then
 * walks the learner through 2-3 comprehension MCQs. Each question commits
 * before the next reveals (no peek-ahead). Transcript reveal is gated by
 * `transcriptRevealAfter` (default `"first-answer"`).
 *
 * Audio playback uses the same TTS pipeline as the other JA step views
 * (`playJaAudio` + module-cached AudioBuffer decode). Auto-play on mount
 * honors `audio.silentMode` — when silent, the dialogue does NOT auto-play
 * but the explicit ▶ Replay button still works (consistent with the
 * silent-mode contract: auto = off, on-demand = on).
 */
export function DialogueListenStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const silentMode = useSettings().settings.audio.silentMode;

  // ── Audio playback orchestration ────────────────────────────────────────
  // Track an incrementing "play session" id so that a Replay tap can cancel
  // any in-flight sequence (the prior session's setTimeouts check this and
  // bail). Sequence plays the lines via playJaAudio (which decodes from
  // module-cached AudioBuffers — first play decodes, replays are zero-cost).
  const sessionRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);

  const clearPendingTimeouts = useCallback(() => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current = [];
  }, []);

  const playSequence = useCallback(() => {
    sessionRef.current += 1;
    const mySession = sessionRef.current;
    clearPendingTimeouts();
    setIsPlaying(true);
    setActiveLineIdx(null);

    let cumulativeMs = 0;
    for (let i = 0; i < step.lines.length; i++) {
      const line = step.lines[i];
      const audioText = line.audioText ?? line.kana;
      // Each turn fires after the previous turn's start + a 400ms gap.
      // We can't await actual playback end cheaply via the existing TTS
      // helper, so we use a fixed gap. Per HOL convention, this is good
      // enough for 1-2s lines and stays predictable when re-played.
      const fireAtMs = cumulativeMs;
      const tid = setTimeout(() => {
        if (sessionRef.current !== mySession) return;
        setActiveLineIdx(i);
        void playJaAudio(audioText);
      }, fireAtMs);
      timeoutsRef.current.push(tid);
      // Rough per-line budget — 1200ms baseline + 70ms/char heuristic so
      // longer lines don't trample the next turn. Tunable; tight enough
      // not to drag, loose enough that 3-mora lines don't overlap.
      const lineBudgetMs = Math.max(1200, 70 * audioText.length) + TURN_GAP_MS;
      cumulativeMs += lineBudgetMs;
    }
    // Final timeout flips isPlaying off + clears the active highlight so
    // the Replay button restores to idle.
    const endTid = setTimeout(() => {
      if (sessionRef.current !== mySession) return;
      setIsPlaying(false);
      setActiveLineIdx(null);
    }, cumulativeMs);
    timeoutsRef.current.push(endTid);
  }, [step.lines, clearPendingTimeouts]);

  // Auto-play on mount — silentMode honored. The dependency on step.id
  // means a remount on the same step (StrictMode dev) only triggers once
  // per actual step transition because the effect's cleanup cancels the
  // session.
  useEffect(() => {
    if (silentMode) return;
    const handle = setTimeout(() => playSequence(), 350);
    return () => {
      clearTimeout(handle);
      clearPendingTimeouts();
      sessionRef.current += 1; // invalidate any pending fires
      setIsPlaying(false);
      setActiveLineIdx(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  useEffect(() => {
    return () => clearPendingTimeouts();
  }, [clearPendingTimeouts]);

  // ── Question state machine ──────────────────────────────────────────────
  // Questions reveal one at a time. Each question gets its own committed
  // selection. After the LAST question commits, we surface Continue +
  // overall correctness to the lesson via onComplete (true only if every
  // question was answered correctly).
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectionByQ, setSelectionByQ] = useState<Record<string, string>>({});
  const [committedByQ, setCommittedByQ] = useState<Record<string, boolean>>({});
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const completedRef = useRef(false);

  const totalQuestions = step.questions.length;
  const lastQuestion = step.questions[totalQuestions - 1];
  const allCommitted =
    totalQuestions > 0 && step.questions.every((q) => committedByQ[q.id]);
  const allCorrect = step.questions.every(
    (q) => committedByQ[q.id] && selectionByQ[q.id] === q.correctOptionId,
  );

  // Transcript reveal gate. Default = "first-answer".
  const transcriptMode = step.transcriptRevealAfter ?? "first-answer";
  const anyCommitted = step.questions.some((q) => committedByQ[q.id]);
  const showTranscript =
    transcriptMode === "first-answer"
      ? anyCommitted
      : transcriptMode === "all-answers"
        ? allCommitted
        : false;

  function commitCurrent() {
    const q = step.questions[currentIdx];
    if (!q) return;
    const sel = selectionByQ[q.id];
    if (!sel) return;
    const correct = sel === q.correctOptionId;
    setCommittedByQ((prev) => ({ ...prev, [q.id]: true }));
    // Fire overall completion only after the LAST commit. Done-guard so a
    // remount mid-celebration doesn't re-fire.
    if (q.id === lastQuestion?.id && !completedRef.current) {
      completedRef.current = true;
      const overall = step.questions.every(
        (qq) =>
          qq.id === q.id
            ? correct
            : selectionByQ[qq.id] === qq.correctOptionId,
      );
      onComplete(step.id, overall);
    }
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  function advanceToNext() {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((i) => i + 1);
    }
  }

  // Per-line replay button (tap a transcript bubble to hear that line
  // again). Silent-mode does NOT gate this (consistent with the speaker-
  // icon contract elsewhere).
  function playLine(idx: number) {
    const line = step.lines[idx];
    if (!line) return;
    void playJaAudio(line.audioText ?? line.kana);
  }

  // Pre-compute whether each line has TTS available — bubbles without
  // audio render their play button disabled (defensive; authored lines
  // should always have manifest entries).
  const lineAudioAvailable = useMemo(
    () => step.lines.map((l) => Boolean(getTtsUrl(l.audioText ?? l.kana))),
    [step.lines],
  );

  const currentQ = step.questions[currentIdx];
  const currentCommitted = currentQ ? !!committedByQ[currentQ.id] : false;
  const currentSelection = currentQ ? selectionByQ[currentQ.id] : undefined;
  const currentCorrect =
    currentQ && currentSelection === currentQ.correctOptionId;

  const handleEnter = useCallback(() => {
    if (!currentCommitted && currentSelection) commitCurrent();
    else if (currentCommitted && !allCommitted) advanceToNext();
    else if (allCommitted) onContinue();
  }, [currentCommitted, currentSelection, allCommitted]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (currentQ && !currentCommitted && n <= currentQ.options.length) {
        setSelectionByQ((prev) => ({
          ...prev,
          [currentQ.id]: currentQ.options[n - 1].id,
        }));
      }
    },
  });

  // Sentence-level explain affordance — surfaces after any wrong commit on
  // the current question; tracks across questions via committed state.
  const anyWrongCommit = step.questions.some(
    (q) =>
      committedByQ[q.id] && selectionByQ[q.id] !== q.correctOptionId,
  );

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={anyWrongCommit}
      />
      {/* ── Header: replay control + speakers manifest ─────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={playSequence}
          disabled={isPlaying}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_3px_0_0_var(--color-accent-hover)]"
          aria-label={t("lesson.dialogueListen.replay", "Replay dialogue")}
        >
          <Icon name="play" size={24} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t(
              "lesson.dialogueListen.listenLabel",
              "Listen to the dialogue",
            )}
          </p>
          <p className="text-sm font-medium text-text-secondary">
            {isPlaying
              ? t("lesson.dialogueListen.playing", "Playing…")
              : t(
                  "lesson.dialogueListen.replayHint",
                  "▶ Replay dialogue",
                )}
          </p>
        </div>
      </div>

      {/* ── Transcript reveal (gated) ──────────────────────────────────── */}
      {showTranscript && (
        <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-border bg-surface-muted/40 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t("lesson.dialogueListen.transcript", "Transcript")}
          </p>
          {step.lines.map((line, i) => {
            const audioOk = lineAudioAvailable[i];
            const active = activeLineIdx === i;
            return (
              <div
                key={`${step.id}-line-${i}`}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition-colors ${
                  active
                    ? "border-accent bg-accent-muted"
                    : "border-border/60 bg-surface"
                }`}
              >
                <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-text-muted pt-1">
                  {line.speaker}
                </span>
                <p className="flex-1 font-japanese text-base font-medium text-text-primary">
                  <AnnotatedJa text={line.kana} />
                </p>
                <button
                  type="button"
                  onClick={() => playLine(i)}
                  disabled={!audioOk}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("lesson.play", "Play audio")}
                >
                  <Icon name="play" size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Live-active indicator (when transcript hidden) ─────────────── */}
      {!showTranscript && activeLineIdx !== null && (
        <div className="rounded-xl border-[1.5px] border-accent/40 bg-accent-muted/40 px-4 py-2 text-sm font-medium text-text-secondary">
          {step.lines[activeLineIdx].speaker}…
        </div>
      )}

      {/* ── Question progress ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {currentQ?.prompt ?? ""}
        </h2>
        {totalQuestions > 1 && (
          <span className="shrink-0 rounded-full bg-surface-muted px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-muted">
            {t("lesson.dialogueListen.qProgress", "{{n}} of {{total}}", {
              n: currentIdx + 1,
              total: totalQuestions,
            })}
          </span>
        )}
      </div>

      {/* ── Current question options ──────────────────────────────────── */}
      {currentQ && (
        <div className="relative grid gap-3" style={{ minHeight: 120 }}>
          {currentQ.options.map((opt) => {
            const isSelected = currentSelection === opt.id;
            const isAnswer = opt.id === currentQ.correctOptionId;
            let style =
              "border-border bg-surface text-text-primary hover:border-accent";
            if (currentCommitted && isAnswer) {
              style = "border-accent bg-accent-muted text-accent";
            } else if (currentCommitted && isSelected && !isAnswer) {
              style = "border-error bg-error/15 text-error";
            } else if (isSelected) {
              style = "border-accent bg-accent-muted text-accent";
            }
            return (
              <button
                key={opt.id}
                type="button"
                disabled={currentCommitted}
                onClick={() =>
                  setSelectionByQ((prev) => ({ ...prev, [currentQ.id]: opt.id }))
                }
                className={`rounded-xl border-[1.5px] px-4 py-3.5 text-left text-sm font-medium transition-colors duration-150 ${style} ${currentCommitted ? "cursor-default" : "cursor-pointer"}`}
              >
                {opt.text}
              </button>
            );
          })}
          {celebrating && <CelebrationToast text={celebrationText} />}
        </div>
      )}

      {/* Bottom-anchored block drops the banner + CTA to the standard
       *  bottom anchor (shared with every other graded step) instead of
       *  floating mid-card, and keeps the CTA put when the feedback banner
       *  appears on commit (Spencer 2026-06-13 CTA-harmony pass). */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6">
        {currentCommitted && currentQ && (
          <Feedback
            correct={!!currentCorrect}
            explanation={currentQ.explanation}
          />
        )}

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        {!currentCommitted ? (
          <ContinueButton
            onClick={commitCurrent}
            label={t("lesson.check", "Check")}
            disabled={!currentSelection}
          />
        ) : !allCommitted ? (
          <ContinueButton
            onClick={advanceToNext}
            label={t("lesson.dialogueListen.nextQuestion", "Next question")}
            variant={currentCorrect ? "correct" : "incorrect"}
          />
        ) : (
          <div className="motion-safe:animate-fade-up">
            <ContinueButton
              onClick={onContinue}
              variant={allCorrect ? "correct" : "incorrect"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
