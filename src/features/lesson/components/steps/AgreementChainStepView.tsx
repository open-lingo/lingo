import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AgreementChainStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { ExplainButton } from "../ExplainButton";
import { Icon } from "@/shared/components/Icon";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: AgreementChainStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * AGREEMENT CHAIN — one head noun, and every slot that must agree with it.
 *
 * The sentence renders as a single wrapping line with inline slots rather than
 * as a list of questions, and that is the entire pedagogical point: the
 * learner has to see four agreements as one decision surfacing in four places.
 * A stack of separate rows would teach them as four facts, which is the
 * misconception the type exists to prevent.
 *
 * Grading is all-or-nothing for the step's boolean — a chain with one link
 * wrong is a broken chain — but each slot still marks individually, because
 * "the chain is wrong" without saying which link is not a correction.
 *
 * LAYOUT CONTRACT (CLAUDE.md § "Lesson UI stability rules"): the sentence and
 * its option rows never change height on submit (each slot reserves its width
 * from its WIDEST option — measured with an invisible ghost, not estimated
 * from character counts), and the reveal lands below, under a `primary-cta`
 * CTA.
 */
export function AgreementChainStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const slots = useMemo(
    () => step.tokens.filter((tk): tk is Extract<typeof tk, { kind: "slot" }> => tk.kind === "slot"),
    [step.tokens],
  );
  const hasAudio = !!(step.audioText && getTtsUrl(step.audioText));

  // House rule: option order is shuffled by a seed derived from the step id,
  // so the correct answer is not always in the same position and the order is
  // still stable across re-renders.
  const optionsFor = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const s of slots) map[s.id] = seededShuffle(s.options, `${step.id}:${s.id}`);
    return map;
  }, [slots, step.id]);

  // The first unfilled slot is the one the option row is for. Explicit taps
  // override it, so a learner can go back and change an earlier slot.
  const currentSlotId =
    active ?? slots.find((s) => !chosen[s.id])?.id ?? slots[slots.length - 1]?.id ?? null;
  const currentSlot = slots.find((s) => s.id === currentSlotId) ?? null;

  const allFilled = slots.every((s) => chosen[s.id]);
  const allCorrect = slots.every((s) => chosen[s.id] === s.correct);

  function choose(value: string) {
    if (submitted || !currentSlotId) return;
    setChosen((prev) => ({ ...prev, [currentSlotId]: value }));
    setActive(null);
  }

  function handleSubmit() {
    if (!allFilled || submitted) return;
    setSubmitted(true);
    onComplete(step.id, allCorrect);
    if (allCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && allFilled) handleSubmit();
    else if (submitted) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allFilled, chosen]);

  useLessonKeyboard({ onEnter: handleEnter });

  function slotStyle(id: string, correctValue: string): string {
    if (submitted) {
      return chosen[id] === correctValue
        ? "border-success bg-success/15 text-success"
        : "border-error bg-error/15 text-error";
    }
    if (id === currentSlotId) return "border-accent bg-accent/10 text-accent";
    return chosen[id]
      ? "border-border bg-surface text-text-primary"
      : "border-dashed border-border bg-surface-muted/50 text-text-muted";
  }

  const hasSubmittedWrong = submitted && !allCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {step.prompt ??
          t("lesson.agreementChain.instruction", "Make every word agree")}
      </p>

      {/* The head noun, fixed. It is the thing everything else answers to, so
          it gets its own card above the sentence rather than sitting inside it
          — the learner must be able to see the governing feature while they
          work, without hunting for it in the line. */}
      <div className="flex items-baseline justify-center gap-2 rounded-xl border border-info/40 bg-info/5 px-3 py-2">
        <span lang="fr" className="text-lg font-black text-text-primary">
          {step.head.surface}
        </span>
        <span className="text-xs text-text-secondary">{step.head.meaningEn}</span>
        <span className="rounded-full bg-info/15 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-info">
          {step.head.featureLabel}
        </span>
      </div>

      {/* One wrapping line, inline slots. Not a stack of rows: the whole fact
          being taught is that these agreements are ONE decision, and a list
          presents them as four. */}
      <div
        lang="fr"
        className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 rounded-2xl border-2 border-border bg-surface px-3 py-4 text-xl sm:text-2xl"
      >
        {step.tokens.map((tk, i) =>
          tk.kind === "fixed" ? (
            <span
              key={i}
              /* French sets no space before a full stop, and the row's own
                 `gap-x` prints one anyway — «assises .». Pull closing
                 punctuation back onto the word it belongs to. */
              className={`text-text-primary ${
                /^[.,;:!?»)\]]/.test(tk.text) ? "-ml-1.5" : ""
              }`}
            >
              {tk.text}
            </span>
          ) : (
            <button
              key={tk.id}
              type="button"
              disabled={submitted}
              onClick={() => setActive(tk.id)}
              aria-label={`${t("lesson.agreementChain.slotLabel", "Slot: {{role}}", {
                role: tk.roleLabel,
              })}${chosen[tk.id] ? `: ${chosen[tk.id]}` : ""}`}
              className={`grid rounded-lg border-2 px-2 py-0.5 font-bold transition-colors ${slotStyle(tk.id, tk.correct)}`}
            >
              {/* Every option, rendered invisibly in the SAME grid cell, so
                  the slot is exactly as wide and as tall as its widest option
                  and the sentence cannot reflow as slots fill. This replaces a
                  `maxOptionLength * 0.62 + 1.4em` estimate — an average-glyph
                  guess that under-sizes any option set with wide letters, and
                  the sentence is being READ while it is answered, so a reflow
                  there is worse than in a tray. Ghost sizing is the house
                  idiom (CLAUDE.md: build trays are pre-sized by an invisible
                  ghost of the full answer). */}
              {tk.options.map((o) => (
                <span
                  key={o}
                  aria-hidden
                  className="invisible col-start-1 row-start-1 whitespace-pre"
                >
                  {o}
                </span>
              ))}
              <span className="col-start-1 row-start-1 justify-self-center whitespace-pre">
                {chosen[tk.id] ?? ""}
              </span>
            </button>
          ),
        )}
      </div>

      {/* Options for the ACTIVE slot only. All slots' options at once would be
          a wall of near-identical French endings with nothing saying which
          belongs where. `min-h` reserves the row so switching slots does not
          reflow the sentence above it. */}
      {!submitted ? (
        <div className="flex flex-col gap-1">
          {/* Which blank these belong to. The active slot is already tinted,
              but tone alone does not say "these fill THAT one" — and the
              active slot can be a line above, at the other end of the
              sentence. Names no grammar, so it is not a hint: the role labels
              stay in the post-commit reveal. */}
          <p className="text-center text-xs text-text-muted">
            {t(
              "lesson.agreementChain.optionsFor",
              "Choose the word for the highlighted blank",
            )}
          </p>
          <div className="flex min-h-[3.25rem] flex-wrap items-start justify-center gap-2">
            {currentSlot?.options.length
              ? optionsFor[currentSlot.id].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    lang="fr"
                    onClick={() => choose(opt)}
                    className={`rounded-xl border-2 px-3 py-1.5 text-lg font-bold transition-colors ${
                      chosen[currentSlot.id] === opt
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface text-text-primary hover:border-accent/60"
                    }`}
                  >
                    {opt}
                  </button>
                ))
              : null}
          </div>
        </div>
      ) : null}

      {/* Post-commit: what each slot was agreeing in, plus the meaning and the
          rule. One dense card in the aspect_choice_cloze idiom — the per-row
          verdict icon puts "which link broke" in the same place as its fix. */}
      {submitted ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <p className="border-b border-border-muted px-3 py-2 text-[0.8125rem] leading-snug text-text-secondary">
            {step.meaningEn}
            {hasAudio ? (
              <button
                type="button"
                onClick={() => playJaAudio(step.audioText!)}
                className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-hover bg-accent align-middle text-white"
                aria-label={t("lesson.play", "Play audio")}
              >
                <Icon name="play" size={11} />
              </button>
            ) : null}
          </p>
          <ul className="divide-y divide-border-muted">
            {slots.map((s) => {
              const got = chosen[s.id] === s.correct;
              return (
                <li
                  key={s.id}
                  className="flex items-start gap-2 px-3 py-1 text-[0.8125rem] leading-snug text-text-secondary"
                >
                  <span
                    className={`mt-px shrink-0 ${got ? "text-success" : "text-error"}`}
                    aria-hidden
                  >
                    <Icon name={got ? "check" : "close"} size={13} />
                  </span>
                  <span>
                    <strong lang="fr" className="font-semibold text-text-primary">
                      {s.correct}
                    </strong>
                    {" — "}
                    {s.roleLabel}
                  </span>
                </li>
              );
            })}
          </ul>
          {step.ruleNote ? (
            <p className="border-t border-border-muted px-3 py-2 text-[0.8125rem] leading-snug text-text-muted">
              {step.ruleNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className="relative mt-auto flex flex-col gap-3 pt-2"
        data-testid="primary-cta"
      >
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {/* Verdict only — every slot carries its own tone in the sentence and
            its correct form is spelled out in the list above. */}
        {hasSubmittedWrong ? <Feedback correct={false} /> : null}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            disabled={!allFilled}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
