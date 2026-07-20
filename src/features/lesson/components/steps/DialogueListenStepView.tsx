import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DialogueListenStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import {
  getTtsUrl,
  playJaAudioToEnd,
  type VoiceColor,
} from "@/shared/tts";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const TURN_GAP_MS = 650;
const SENTENCE_GAP_MS = 350;
const CELEBRATE_MS = 1100;

/**
 * Split a JA line into playable sentences, keeping the terminator (？/！
 * carry the contour; 。 is stripped by the manifest lookup anyway). A line
 * like わたしは トムだ。がくせいだ。 was synthesized as ONE clip and read
 * run-together (Spencer QA 2026-07-19: "it needs to be per sentence and
 * have better spacing between them"). Exported for unit testing and reused
 * by the TTS deck emitter's sentence-split expansion.
 */
export function splitJaSentences(text: string): string[] {
  return (text.match(/[^。？！]+[。？！]?」?/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Global dialogue pacing. Nanami's natural TTS pace reads fast on a first
 * listen; a modest slow-down helps comprehension without sounding drunk
 * (Spencer QA 2026-07-16: "slowing the tts speed a bit might be helpful").
 *
 * Scoped to dialogue lines only (composed into `voiceFor` below) — NOT a
 * change to the shared TTS module's defaults, so every other step's audio
 * is untouched.
 *
 * Why not "compensate" the pitch drop with detune: a plain Web Audio
 * `AudioBufferSourceNode` has no independent time/pitch controls. Per the
 * spec, `computedPlaybackRate = playbackRate * 2^(detune/1200)` — detune
 * and playbackRate both feed the SAME resampling rate, so nudging detune
 * to cancel the pitch shift would cancel the slow-down too (they're one
 * knob, not two). At 0.92x the pitch drops ~140 cents (a little over a
 * semitone) — the same order of magnitude as the per-speaker VoiceColor
 * shifts below, and a pitch DROP from slowing down reads as natural
 * (only sped-up clips chipmunk).
 */
const DIALOGUE_PACE = 0.92;

/** Compose the global dialogue pace onto a per-speaker VoiceColor's
 *  playbackRate, leaving its detune (voice identity) untouched. Exported
 *  for unit testing. */
export function pacedVoice(base: VoiceColor, pace: number): VoiceColor {
  return { ...base, playbackRate: (base.playbackRate ?? 1) * pace };
}

/**
 * Play one dialogue line sentence-by-sentence with SENTENCE_GAP_MS of
 * breathing room between sentences. Falls back to the whole-line clip when
 * any sentence is missing from the manifest (defensive — the deck emitter
 * expands multi-sentence strings, so authored lines should always split)
 * and for the non-manifest synthesis path (non-JA courses). `stillCurrent`
 * aborts between awaits so Replay / step-advance cancels cleanly.
 * Exported for unit testing.
 */
export async function playLineAudio(
  text: string,
  voice: VoiceColor,
  stillCurrent: () => boolean = () => true,
): Promise<void> {
  const sentences = splitJaSentences(text);
  const perSentence =
    sentences.length > 1 && sentences.every((s) => getTtsUrl(s));
  if (!perSentence) {
    await playJaAudioToEnd(text, undefined, voice);
    return;
  }
  for (let i = 0; i < sentences.length; i++) {
    if (!stillCurrent()) return;
    await playJaAudioToEnd(sentences[i], undefined, voice);
    if (i < sentences.length - 1) {
      if (!stillCurrent()) return;
      await new Promise((r) => setTimeout(r, SENTENCE_GAP_MS));
    }
  }
}

export type TranscriptLineStatus = "active" | "played" | "upcoming";

/**
 * Classify a transcript line for highlighting: the line currently playing
 * is "active", a line that has started playing at least once (this session
 * or a prior replay) but isn't playing right now is "played" (kept fully
 * readable), and anything not yet heard is "upcoming" (dimmed so the
 * learner can't read ahead of the audio). Exported for unit testing.
 */
export function lineStatus(
  idx: number,
  activeLineIdx: number | null,
  playedLineIdxs: ReadonlySet<number>,
): TranscriptLineStatus {
  if (activeLineIdx === idx) return "active";
  if (playedLineIdxs.has(idx)) return "played";
  return "upcoming";
}

type Props = {
  step: DialogueListenStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Dialogue-listen renderer — plays a 2-4 turn dialogue sequentially, then
 * walks the learner through 2-3 comprehension MCQs. Each question commits
 * before the next reveals (no peek-ahead). The transcript is always
 * visible and lines un-blur as they play; `transcriptRevealAfter`
 * (default `"first-answer"`) gates only when NOT-YET-HEARD lines un-blur.
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
  const reducedMotion = useReducedMotion();

  // ── Audio playback orchestration ────────────────────────────────────────
  // Track an incrementing "play session" id so that a Replay tap can cancel
  // any in-flight sequence (the prior session's setTimeouts check this and
  // bail). Sequence plays the lines via playJaAudio (which decodes from
  // module-cached AudioBuffers — first play decodes, replays are zero-cost).
  const sessionRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  // Every line index that has started playing at least once (this mount) —
  // drives the "previous line stays readable" transcript treatment. Reset
  // whenever the step changes (see the reset effect below).
  const [playedLineIdxs, setPlayedLineIdxs] = useState<Set<number>>(
    () => new Set(),
  );
  // Scroll targets for the transcript rows, so the active line can be
  // smoothed into view when a longer (narrative) transcript scrolls.
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Guards a single-line replay tap so a rapid second tap (or an in-flight
  // full-sequence replay) can't have its stale `.then()` clear an active
  // highlight that no longer belongs to it.
  const lineTapTokenRef = useRef(0);

  const clearPendingTimeouts = useCallback(() => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current = [];
  }, []);

  // Per-speaker voice coloring: the whole corpus is one voice (Nanami),
  // so a two-person exchange was audibly one person talking to herself
  // (Spencer QA 2026-07-13). Distinct speakers get a small detune/rate
  // shift in order of first appearance — line 1's speaker stays neutral.
  // Magnitudes halved 2026-07-19 ("the pitching is a little too extreme"):
  // ±120–150 cents reads as another person without sounding processed.
  // Real second-voice clips are the phase-2 fix.
  const voiceBySpeaker = useMemo(() => {
    const COLORS: VoiceColor[] = [
      {},
      { detuneCents: -150, playbackRate: 0.98 },
      { detuneCents: 120, playbackRate: 1.02 },
      { detuneCents: -80, playbackRate: 1.0 },
    ];
    const map = new Map<string, VoiceColor>();
    for (const line of step.lines) {
      const key = line.speaker ?? "";
      if (!map.has(key)) map.set(key, COLORS[map.size % COLORS.length]);
    }
    return map;
  }, [step.lines]);
  // voiceFor composes the per-speaker color with the global dialogue pace
  // (see DIALOGUE_PACE above) — every dialogue line plays a touch slower
  // than the raw TTS clip, speaker identity untouched.
  const voiceFor = (line: (typeof step.lines)[number]): VoiceColor =>
    pacedVoice(voiceBySpeaker.get(line.speaker ?? "") ?? {}, DIALOGUE_PACE);

  const markPlayed = useCallback((idx: number) => {
    setPlayedLineIdxs((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));
  }, []);

  const playSequence = useCallback(() => {
    sessionRef.current += 1;
    const mySession = sessionRef.current;
    clearPendingTimeouts();
    setIsPlaying(true);
    setActiveLineIdx(null);

    // Chain on REAL playback end (playJaAudioToEnd resolves when the clip
    // finishes), then breathe TURN_GAP_MS before the next turn. The old
    // 70ms/char estimate ran ~half of Nanami's actual pace, so turns
    // played over each other (QA 2026-07-13). A stale session id aborts
    // between awaits — Replay/unmount cancels cleanly.
    void (async () => {
      for (let i = 0; i < step.lines.length; i++) {
        if (sessionRef.current !== mySession) return;
        const line = step.lines[i];
        setActiveLineIdx(i);
        markPlayed(i);
        // lang stays undefined so the shared default (stamped per-course by
        // LanguageContext via setDefaultTtsLang) resolves the manifest key.
        await playLineAudio(
          line.audioText ?? line.kana,
          voiceFor(line),
          () => sessionRef.current === mySession,
        );
        if (sessionRef.current !== mySession) return;
        await new Promise((r) => setTimeout(r, TURN_GAP_MS));
      }
      if (sessionRef.current !== mySession) return;
      setIsPlaying(false);
      setActiveLineIdx(null);
    })();
  }, [step.lines, clearPendingTimeouts, markPlayed]);

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

  // New dialogue → forget which lines were already heard.
  useEffect(() => {
    setPlayedLineIdxs(new Set());
  }, [step.id]);

  useEffect(() => {
    return () => clearPendingTimeouts();
  }, [clearPendingTimeouts]);

  // Smooth (or instant, per prefers-reduced-motion) scroll-into-view for
  // the active transcript line — only matters once the transcript is tall
  // enough to scroll (narrative-format steps can run up to 8 lines), a
  // no-op otherwise since the row is already in view.
  useEffect(() => {
    if (activeLineIdx === null) return;
    lineRefs.current[activeLineIdx]?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [activeLineIdx, reducedMotion]);

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

  // Transcript treatment (reworked 2026-07-19, Spencer QA: "the transcript
  // doesnt show up as it plays, it needs to do that"). The panel is ALWAYS
  // visible and lines un-blur as the audio reaches them — the learner reads
  // along with playback instead of staring at a blank card. The old
  // `transcriptRevealAfter` gate now controls only when NOT-YET-HEARD lines
  // un-blur (so a learner still can't read ahead of the audio, and can't
  // read answers they haven't listened for). "never" keeps unheard lines
  // blurred for the whole step; heard lines always become readable.
  const transcriptMode = step.transcriptRevealAfter ?? "first-answer";
  const anyCommitted = step.questions.some((q) => committedByQ[q.id]);
  const unheardRevealed =
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
    // Mirror the sequence's active-line tracking so a tapped bubble
    // highlights itself the same way an auto-played turn does (Spencer QA
    // 2026-07-16: tracking "which line is playing" was the whole ask).
    // The token guard means only the tap that's still current gets to
    // clear the highlight when its clip ends — a rapid second tap, or the
    // full-sequence Replay taking over, wins instead of racing back to null.
    const token = ++lineTapTokenRef.current;
    setActiveLineIdx(idx);
    markPlayed(idx);
    // Same voice color + per-sentence pacing as the sequence — a replay
    // must sound like the same "person" the learner just heard. lang
    // undefined → per-course default, same as the sequence above.
    void playLineAudio(
      line.audioText ?? line.kana,
      voiceFor(line),
      () => lineTapTokenRef.current === token,
    ).then(() => {
      if (lineTapTokenRef.current !== token) return;
      setActiveLineIdx((cur) => (cur === idx ? null : cur));
    });
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

      {/* ── Transcript (always visible, un-blurs as audio plays) ──────────
          Three-tier treatment (Spencer QA 2026-07-16: "a better view of the
          active and previous transcript line would help too") — the active
          line pops (accent bg + bold), already-heard lines stay exactly as
          readable as before, and not-yet-heard lines dim AND blur their
          text so a learner can't read ahead of the audio (blur lifts per
          the reveal gate above). The row list scrolls independently of the
          "Transcript" label so long (narrative, up to 8-line) transcripts
          don't blow out the card, and the active row scrolls itself into
          view — smoothly, unless prefers-reduced-motion asks otherwise. ── */}
      <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-border bg-surface-muted/40 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t("lesson.dialogueListen.transcript", "Transcript")}
          </p>
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {step.lines.map((line, i) => {
              const audioOk = lineAudioAvailable[i];
              const status = lineStatus(i, activeLineIdx, playedLineIdxs);
              const isActive = status === "active";
              const isUpcoming = status === "upcoming";
              const isMasked = isUpcoming && !unheardRevealed;
              return (
                <div
                  key={`${step.id}-line-${i}`}
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition-all duration-200 ${
                    isActive
                      ? "border-accent bg-accent-muted shadow-sm"
                      : isUpcoming
                        ? "border-border/30 bg-surface/60 opacity-45"
                        : "border-border/60 bg-surface"
                  }`}
                >
                  <span
                    className={`shrink-0 text-xs font-bold uppercase tracking-wider pt-1 ${
                      isActive ? "text-accent" : "text-text-muted"
                    }`}
                  >
                    {line.speaker}
                  </span>
                  <p
                    className={`flex-1 font-japanese text-base text-text-primary ${
                      isActive ? "font-semibold" : "font-medium"
                    } ${isMasked ? "select-none blur-[5px]" : ""}`}
                    aria-hidden={isMasked || undefined}
                  >
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
        </div>

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
