import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StressPatternStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { ExplainButton } from "../ExplainButton";
import { Icon } from "@/shared/components/Icon";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

/** Label shown with the revealed spelling. Keyed by the rule that decides
 *  whether the accent is WRITTEN — the stress itself is always there. */
const RULE_LABEL: Record<string, string> = {
  aguda: "aguda — stress on the last syllable",
  llana: "llana — stress on the second-to-last",
  esdrujula: "esdrújula — stress on the third-to-last",
  none: "no written accent needed",
};

type Props = {
  step: StressPatternStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * STRESS PATTERN — the word is shown split into syllables with every written
 * accent STRIPPED, the audio plays, and the learner taps the syllable that
 * carries the stress. The correct spelling, tilde included, appears only after
 * the answer commits.
 *
 * The stripping is the mechanic, not a detail. Spanish written accents are a
 * consequence of stress, and any presentation that shows the tilde first lets
 * the learner read the answer instead of hearing it — which is why this could
 * not be an ordinary `multiple_choice` over spellings.
 *
 * Audio therefore plays ON MOUNT: it is the stimulus. That is the opposite of
 * the cloze family, where the sentence plays post-commit because pre-commit it
 * would speak the answer. Here the audio IS the question.
 *
 * LAYOUT CONTRACT (house rule, CLAUDE.md § "Lesson UI stability rules"): this
 * step reveals a spelling, a rule and a minimal pair on submit, so everything
 * that grows is placed BELOW the syllable row and the CTA carries the sticky
 * `primary-cta` hook. Nothing the learner was looking at moves when they
 * commit — measured at 375×667, the viewport where the growth actually bites.
 */
export function StressPatternStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const hasAudio = !!getTtsUrl(step.audioText);
  const correct = picked === step.stressedIndex;

  // Play once on mount — the stimulus. Guarded by a ref so a re-render from
  // any state change cannot re-trigger it mid-step.
  const played = useRef(false);
  useEffect(() => {
    if (played.current || !hasAudio) return;
    played.current = true;
    const timer = window.setTimeout(() => playJaAudio(step.audioText), 250);
    return () => window.clearTimeout(timer);
  }, [step.audioText, hasAudio]);

  function handleSubmit() {
    if (picked === null || submitted) return;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && picked !== null) handleSubmit();
    else if (submitted) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, picked]);

  useLessonKeyboard({ onEnter: handleEnter });

  function syllableStyle(i: number): string {
    if (submitted) {
      if (i === step.stressedIndex) {
        return "border-success bg-success/15 text-success";
      }
      if (i === picked) return "border-error bg-error/15 text-error";
      return "border-border bg-surface text-text-muted opacity-60";
    }
    return i === picked
      ? "border-accent bg-accent/10 text-accent"
      : "border-border bg-surface text-text-primary hover:border-accent/60";
  }

  const hasSubmittedWrong = submitted && !correct;
  const hasNotes = !!(step.accentRule || step.ruleNote || step.minimalPair);

  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {step.prompt ??
          t("lesson.stressPattern.instruction", "Which syllable is stressed?")}
      </p>

      {/* The stimulus card never changes size above the syllable row — same
          padding and the same play-button size before and after Check — so the
          tappable syllables sit at a fixed y through the whole step. Every
          revealed block lands BELOW them, in the space the CTA's `mt-auto`
          was already holding open. */}
      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-4 py-4 sm:px-5 sm:py-5">
        {/* Rendered even with no clip in the manifest, disabled rather than
            absent: a TTS-less word otherwise drops the card's anchor and the
            step reads as though the audio control failed to load. Same
            treatment as liaison_listen. */}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => playJaAudio(step.audioText)}
            disabled={!hasAudio}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent-hover bg-accent text-white disabled:opacity-40 sm:h-12 sm:w-12"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={20} />
          </button>
        </div>

        {/* Syllables as buttons, separated by a middot so the segmentation is
            visible without the separators being tappable. Accent-free by
            contract — see StressPatternStep's doc comment.

            The separator TRAILS its syllable inside one non-wrapping unit. It
            used to lead the next one, which on a word long enough to wrap
            (5 syllables at 375px) dropped a naked middot at the start of the
            second line, reading as a bullet rather than a break. */}
        <div className="flex flex-wrap items-center justify-center gap-y-2">
          {step.syllables.map((syllable, i) => (
            <span key={i} className="flex items-center whitespace-nowrap">
              <button
                type="button"
                disabled={submitted}
                aria-pressed={picked === i}
                aria-label={t(
                  "lesson.stressPattern.syllableLabel",
                  "Syllable {{n}}: {{syllable}}",
                  { n: i + 1, syllable },
                )}
                onClick={() => setPicked(i)}
                className={`rounded-xl border-2 px-3 py-1.5 text-2xl font-bold transition-colors sm:text-3xl ${syllableStyle(i)} ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                {syllable}
              </button>
              {i < step.syllables.length - 1 ? (
                <span
                  aria-hidden
                  className="select-none px-1 text-lg text-text-muted"
                >
                  ·
                </span>
              ) : null}
            </span>
          ))}
        </div>

        {/* The spelling lands only after commit. Before that, showing it would
            hand over the answer — and so would the gloss: on a minimal pair
            «hablo»/«habló» the English ("I speak" vs "he/she spoke") IS the
            stress, so a learner who knows the preterite can answer without
            listening. Both live in the reveal, which also means the meaning
            has one home instead of moving between two on submit. */}
        {submitted ? (
          <div className="mt-3 flex flex-col items-center gap-0.5">
            {/* The spelling is the payoff, so it must read as ONE word: a
                17-character «electrodomésticos» at 30px wrapped to
                "electrodomés / ticos" mid-word at 375px, which is exactly the
                thing the learner is here to look at, broken. Long forms step
                down a size instead; `break-words` stays as the last-resort
                guard so nothing ever bleeds out of the card — and `hyphens-auto`
                (which needs the `lang` below to pick the Spanish dictionary)
                makes that last resort break at a syllable boundary with a
                hyphen instead of mid-syllable with nothing. */}
            <p
              lang="es"
              className={`max-w-full hyphens-auto break-words px-1 text-center font-black leading-tight text-text-primary ${
                step.writtenForm.length > 12
                  ? "text-2xl sm:text-3xl"
                  : "text-3xl sm:text-4xl"
              }`}
            >
              {step.writtenForm}
            </p>
            <p className="text-center text-sm text-text-secondary">
              {step.meaningEn}
            </p>
          </div>
        ) : null}
      </div>

      {/* Rule + partner form in ONE block below the card, the same slot
          liaison_listen puts its junction notes in. Keeping the rule label out
          of the stimulus card is what lets the card stay a fixed height. */}
      {submitted && hasNotes ? (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-3 py-2">
          {step.accentRule ? (
            <p className="text-[0.8125rem] font-semibold leading-snug text-info">
              {RULE_LABEL[step.accentRule] ?? step.accentRule}
            </p>
          ) : null}
          {step.ruleNote ? (
            <p className="text-[0.8125rem] leading-snug text-text-secondary">
              {step.ruleNote}
            </p>
          ) : null}
          {/* The partner form is what the stress was DOING. Without it the
              learner learns where the tilde goes but not why it matters. */}
          {step.minimalPair ? (
            <p
              className={`text-[0.8125rem] leading-snug text-text-muted ${
                // A rule note ends in prose; the partner form is a different
                // KIND of fact. Without the rule it read as one more sentence
                // of the note and disappeared into it.
                step.accentRule || step.ruleNote
                  ? "mt-0.5 border-t border-border-muted pt-1"
                  : ""
              }`}
            >
              <span lang="es" className="font-bold text-text-primary">
                {step.minimalPair.writtenForm}
              </span>
              {" — "}
              {step.minimalPair.meaningEn}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Single bottom block (house CTA-harmony) carrying the sticky hook, so
          the three revealed blocks scroll UNDER the button instead of shoving
          it off a short screen. Without `primary-cta` the CTA sat 228px below
          the fold at 375×667 after Check. */}
      <div
        className="relative mt-auto flex flex-col gap-3 pt-2"
        data-testid="primary-cta"
      >
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {/* No `correctAnswer` echo: post-commit the stressed syllable already
            carries the success tone and the spelling is spelled out above, so
            a third copy costs ~24px of a 485px stage to repeat what two other
            elements say (same call as liaison_listen). */}
        {hasSubmittedWrong ? <Feedback correct={false} /> : null}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            disabled={picked === null}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
