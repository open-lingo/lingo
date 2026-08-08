import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as wanakana from "wanakana";
import type { ConjugationTransformStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import {
  getTransformStage,
  isStreakShielded,
  getTransformCellReps,
  recordTransformResult,
  type TransformStage,
} from "@/features/languages/ja/conjugation/transformCells";
import { getTransformRuleset } from "@/features/languages/ja/conjugation/transformRulesets";
import { TransformRuleTable } from "./TransformRuleTable";
import type { TransformForm } from "@/features/languages/ja/conjugation/transformCells";
import { normalizeTypedAnswer } from "@/shared/speech";

const CELEBRATE_MS = 1100;

/**
 * In-lesson streak flame, shared across the transform cards of ONE lesson
 * run. Module-level on purpose: the flame must survive step remounts but
 * has no business in persisted lesson state — a reload restarts the flame,
 * not the mastery (cells persist via FSRS). Keyed by lesson so switching
 * lessons resets it.
 */
const flame = { key: "", count: 0, best: 0 };
export function transformFlameFor(lessonKey: string): { count: number; best: number } {
  if (flame.key !== lessonKey) {
    flame.key = lessonKey;
    flame.count = 0;
    flame.best = 0;
  }
  return flame;
}

type Props = {
  step: ConjugationTransformStep;
  lessonId: string;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Conjugation Transform — the morphing drill card (spec 2026-07-23).
 * Stage is resolved AT MOUNT from the (form × verb-class) mastery cell:
 *   1 LEARN — MCQ, rule table pinned (collapses after this card if the
 *             cell's next card would be stage 2);
 *   2 KNOW — MCQ, table behind a half-credit 💡 peek;
 *   3 OWN  — typed production (kana IME or romaji), peek still available.
 * `ungraded` renders the stage-3 shell but writes nothing anywhere — the
 * "try typing it" tease. Misses shake but don't reset the flame while the
 * cell is shielded (<5 reps). Correct answers auto-play the answer form's
 * TTS when a clip exists.
 */
export function ConjugationTransformStepView({ step, lessonId, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const form = step.form as TransformForm;
  const stage: TransformStage = step.ungraded
    ? 3
    : getTransformStage(form, step.verbClass);
  const shielded = step.ungraded || isStreakShielded(form, step.verbClass);
  const reps = getTransformCellReps(form, step.verbClass);
  const ruleset = getTransformRuleset(step.form);

  const lessonFlame = transformFlameFor(lessonId);
  const [, forceRender] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedValue, setTypedValue] = useState("");
  const [peeked, setPeeked] = useState(false);
  const [shieldFlash, setShieldFlash] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const typed = stage === 3;

  const options = useMemo(() => {
    // Deterministic slot from step id — same convention as the factories
    // (no Math.random in render paths).
    const slot =
      Math.abs([...step.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 3;
    const opts = step.distractors.slice(0, 2);
    opts.splice(slot, 0, step.answer);
    return opts;
  }, [step.id, step.answer, step.distractors]);

  const audioTimer = useRef<number | null>(null);
  const hasAnswerAudio = !!getTtsUrl(step.answer);

  const commit = useCallback(
    (isCorrect: boolean) => {
      setSubmitted(true);
      setCorrect(isCorrect);
      if (!step.ungraded) {
        recordTransformResult({
          form,
          group: step.verbClass,
          stage,
          correct: isCorrect,
          peeked,
        });
        if (isCorrect) {
          lessonFlame.count += 1;
          lessonFlame.best = Math.max(lessonFlame.best, lessonFlame.count);
        } else if (!shielded) {
          lessonFlame.count = 0;
        } else {
          setShieldFlash(true);
          window.setTimeout(() => setShieldFlash(false), 900);
        }
        forceRender((n) => n + 1);
      }
      onComplete(step.id, step.ungraded ? true : isCorrect);
      if (isCorrect) {
        setCelebrationText(pickCelebrationText(t));
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
        if (hasAnswerAudio) {
          audioTimer.current = window.setTimeout(() => playJaAudio(step.answer), 320);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, stage, peeked, shielded, hasAnswerAudio],
  );

  function submitMcq() {
    if (!selected || submitted) return;
    commit(selected === step.answer);
  }
  function submitTyped() {
    if (submitted) return;
    const composed = wanakana.toKana(typedValue.trim());
    commit(
      normalizeTypedAnswer(composed) === normalizeTypedAnswer(step.answer),
    );
  }

  const handleEnter = useCallback(() => {
    if (submitted) onContinue();
    else if (typed) submitTyped();
    else submitMcq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, typed, selected, typedValue]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!typed && !submitted && n <= options.length) setSelected(options[n - 1]);
    },
  });

  const showTable = stage === 1 || peeked;
  const stageLabel = step.ungraded
    ? t("lesson.transform.tryIt", "BONUS · TRY TYPING IT")
    : stage === 1
      ? t("lesson.transform.stage1", "STAGE 1 · LEARN")
      : stage === 2
        ? t("lesson.transform.stage2", "STAGE 2 · KNOW")
        : t("lesson.transform.stage3", "STAGE 3 · OWN");

  return (
    <div className="relative flex flex-1 flex-col gap-5">
      {/* head: stage/srs chips left, flame right */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-widest ${
              stage === 3 && !step.ungraded
                ? "border-success/60 text-success"
                : "border-border text-text-secondary"
            }`}
          >
            {stageLabel}
          </span>
          {!step.ungraded ? (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-text-muted">
              srs ×{reps}
            </span>
          ) : null}
        </div>
        {!step.ungraded ? (
          <span
            data-testid="transform-flame"
            className={`whitespace-nowrap text-sm font-bold text-warning transition-transform ${
              shieldFlash ? "animate-pulse" : ""
            } ${peeked ? "opacity-40" : ""}`}
          >
            🔥×{lessonFlame.count}
            {peeked ? " ½" : ""}
            {shielded ? " 🛡" : ""}
          </span>
        ) : null}
      </div>

      {/* prompt: base → ? centered, full target spelled out (prompt-clarity
          invariant: never bare "make it negative")
          `mt-auto` starts here, not on the head chips above — those are a
          status bar and belong at the top. With the action block's `mt-auto`
          the free space splits evenly, so the drill itself sits midway
          between the chips and the CTA instead of stranding a 207px void
          below it (Spencer QA 2026-08-07, 430x932). */}
      <div className="mt-auto text-center">
        <p className="font-japanese text-4xl font-bold text-text-primary">
          {step.base}
          <span aria-hidden="true" className="mx-3 text-2xl text-text-muted">→</span>
          <span className="text-accent">？</span>
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {step.baseRomaji ? `${step.baseRomaji} · ` : ""}
          {step.baseGloss} → <b className="text-text-secondary">{step.targetGloss}</b>
          <span className="mx-1.5 text-text-muted">·</span>
          {step.formLabel}
        </p>
      </div>

      {/* the rule table (signature) — pinned at stage 1, peeked later.
          `focus`: one row, the one being drilled. The full grid is a tap away
          but never the default — see TransformRuleTable's header. */}
      {ruleset && showTable ? (
        <TransformRuleTable
          form={step.form}
          highlight={step.verbClass}
          highlightSubgroup={step.subgroup}
          maskBase={step.base}
          focus
        />
      ) : null}

      {/* peek chip — stage ≥2, until used */}
      {ruleset && !showTable && !submitted ? (
        <div className="flex justify-center">
          <button
            type="button"
            data-testid="transform-peek"
            onClick={() => setPeeked(true)}
            className="rounded-full border border-border px-3.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:border-warning hover:text-warning"
          >
            💡 {t("lesson.transform.peek", "the rule")}{" "}
            <span className="text-text-muted">
              · {t("lesson.transform.peekCost", "costs half the flame")}
            </span>
          </button>
        </div>
      ) : null}

      {/* answer: MCQ (stages 1-2) or typed (stage 3 / ungraded) */}
      {typed ? (
        <div className="flex gap-2.5">
          <input
            data-testid="transform-typed"
            // Mid-lesson, focus is stranded on the previous step's Continue
            // — without this, keystrokes go to <body> and "typing isn't
            // working" (Spencer walk 2026-07-24).
            autoFocus
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            disabled={submitted}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t("lesson.transform.typePlaceholder", "type it — kana or romaji")}
            className={`min-w-0 flex-1 rounded-xl border-2 bg-surface px-4 py-3 text-center font-japanese text-xl text-text-primary outline-none transition-colors ${
              submitted
                ? correct
                  ? "border-success"
                  : "border-error"
                : "border-border focus:border-accent"
            }`}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {options.map((opt, i) => {
            const picked = selected === opt;
            let style =
              "border-border bg-surface text-text-primary hover:border-accent/60";
            if (submitted) {
              if (opt === step.answer) style = "border-success bg-success/15 text-success";
              else if (picked) style = "border-error bg-error/15 text-error";
              else style = "border-border bg-surface text-text-muted opacity-60";
            } else if (picked) {
              style = "border-accent bg-accent/10 text-accent";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={submitted}
                aria-pressed={picked}
                onClick={() => setSelected(opt)}
                className={`rounded-xl border-2 px-4 py-3.5 text-center font-japanese text-2xl font-bold transition-colors ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {submitted && hasAnswerAudio ? (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => playJaAudio(step.answer)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={12} />
          </button>
        </div>
      ) : null}

      {/* single bottom block (house convention: CTA never moves) */}
      {/* `primary-cta` opts into the sticky action bar (index.css § "Lesson
          action bar"). Fits without it at 700px, but at 560 the CTA sat 123px
          below the fold — same gap as `dialogue_listen`, found in the same
          sweep (2026-08-06). */}
      <div className="relative mt-auto flex flex-col gap-4 pt-4" data-testid="primary-cta">
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {submitted && !correct ? (
          <Feedback correct={false} correctAnswer={step.answer} />
        ) : null}
        {submitted && !correct && shielded && !step.ungraded ? (
          <p className="text-center text-xs font-semibold text-warning">
            🛡 {t("lesson.transform.shielded", "Streak shielded — misses are free until this form has {{n}} reps", { n: 5 })}
          </p>
        ) : null}
        {!submitted ? (
          <ContinueButton
            onClick={typed ? submitTyped : submitMcq}
            disabled={typed ? typedValue.trim().length === 0 : !selected}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
