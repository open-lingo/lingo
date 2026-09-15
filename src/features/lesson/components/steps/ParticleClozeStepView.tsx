import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ParticleClozeStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Tile } from "../tiles/Tile";
import { TileTray } from "../tiles/TileTray";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { getTtsUrl } from "@/shared/tts";
import { ExplainButton } from "../ExplainButton";
import { PromptAudioButton } from "./PromptAudioButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { playStepAudio, useCurrentStepId } from "../../hooks/useStepAudioGuard";
import { useContentString } from "../../hooks/useContentString";
import { courseIdsFromLessonId, explanationAnchor } from "@/shared/i18n/content/anchors";
import { Badge } from "@/shared/components/ui";

const CELEBRATE_MS = 1100;

/**
 * Options the "Pick what fits the blank" instruction is honest about
 * (metalanguage "particle" dropped from learner copy, Gate 10 2026-07-20).
 * Grammar pools reuse this step type for copula forms, verb endings,
 * adverbs, demonstratives… (2026-07-06 audit: the hardcoded label lied on
 * ~95 steps) — anything outside this set gets "Complete the sentence".
 */
const PARTICLE_OPTIONS = new Set([
  "は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "ね", "よ",
  "な", "わ", "や", "から", "まで", "までに", "より", "だけ", "しか",
  "くらい", "ぐらい", "ほど", "など",
]);

type Props = {
  step: ParticleClozeStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
  /**
   * Grammar-deck rendering: show `meaningEn` BEFORE the answer. In a
   * lesson the surrounding steps supply context, so the meaning stays a
   * post-submit reveal; standalone, a semantic cloze without the gloss is
   * a guessing game (です/でした/じゃないです are all grammatical).
   * Audio stays post-submit either way — it speaks the answer.
   */
  showMeaningPreAnswer?: boolean;
  /** Owning lesson id — see `useContentString`. */
  lessonId?: string;
};

/**
 * Particle Cloze — sentence with a blank, pick the correct particle.
 *
 * The blank renders as a pill shape between the `before` / `after` halves
 * of the sentence (with AnnotatedJa ruby on each half). After submit the
 * correct particle slots into the pill, the English meaning reveals
 * below (or sits above the sentence from the start — see
 * `showMeaningPreAnswer`), and (if `audioText` is set) the full sentence
 * audio plays once.
 */
export function ParticleClozeStepView({
  step,
  onComplete,
  onContinue,
  showMeaningPreAnswer = false,
  lessonId,
}: Props) {
  const { t } = useTranslation();
  // TestFlight #127: registers this step for the post-submit replay
  // button's currentness guard (see useStepAudioGuard's doc comment).
  useCurrentStepId(step.id);
  const rid = lessonId ?? step.id;
  const ids = courseIdsFromLessonId(rid);
  const resolvedExplanation = useContentString(
    rid,
    ids && step.explanation ? explanationAnchor(ids.moduleId, rid, step.explanation) : null,
    step.explanation ?? "",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctParticle;

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        setSelected(step.options[n - 1]);
      }
    },
  });

  const fullAudio = step.audioText ?? null;
  const hasFullAudio = !!fullAudio && !!getTtsUrl(fullAudio);

  // Pending correct-answer play, held in a ref so it's cancelled if the
  // step unmounts before it fires — advancing must not let this step's
  // audio play over the next one (Spencer QA 2026-07-16).
  const optionAudioTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (optionAudioTimer.current !== null) {
        window.clearTimeout(optionAudioTimer.current);
      }
    },
    [],
  );

  function handleSubmit() {
    if (!selected) return;
    const correct = selected === step.correctParticle;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      // Reinforce the CHOSEN option, not the whole sentence: the full
      // sentence used to keep playing and bleed into the next step
      // (Spencer QA 2026-07-16). The post-submit speaker button below
      // still replays the full sentence on explicit request.
      const pick = selected;
      if (getTtsUrl(pick)) {
        optionAudioTimer.current = window.setTimeout(
          () => void playStepAudio(pick, step.id),
          320,
        );
      }
    }
  }

  function replayAudio() {
    // TestFlight #127: guard against the fetch outliving this step.
    if (fullAudio) void playStepAudio(fullAudio, step.id);
  }

  // Pill content: blank while unanswered, then the chosen / correct
  // particle (post-submit). Wrong → show correct in pill, struck-through
  // user pick beside.
  const pillParticle = submitted ? step.correctParticle : selected;

  const hasSubmittedWrong = submitted && !isCorrect;

  const allOptionsAreParticles = step.options.every((o) =>
    PARTICLE_OPTIONS.has(o),
  );
  // QA 2026-07-12 (Spencer): the gloss is needed pre-answer in LESSONS
  // too — "without the english phrase to translate off of, it's hard to
  // know the intention; sometimes there is no right particle." The deck
  // surface already showed it; now every surface does.
  const showMeaningUpFront = !!step.meaningEn;
  void showMeaningPreAnswer; // retained prop — all surfaces now show it

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      {/* `mt-auto` HERE (moved onto the row below, TestFlight #70c) and on the
          action block further down is what centres this step. Two auto
          margins in a column split the free space evenly, so the content
          sits midway between the header and the CTA while the CTA stays
          bottom-anchored — no wrapper element, no reading-order change.
          Top-aligned, this step stranded a 339px void on a 430x932 phone
          (Spencer QA 2026-08-07). Collapses to 0 when content overflows. */}
      {/* TestFlight #70c (Spencer, b12 2026-09-14): the "?" ExplainButton
          used to be `absolute right-2 top-2` on the OUTER container while
          this label sat under `mt-auto` further down — two independent
          anchors that only lined up by coincidence, leaving dead space
          between them on most viewport heights. Putting both in one flex
          row (ExplainButton's `layout="inline"`) locks them to the same
          baseline; `flex-wrap` + the button's expansion panel forcing
          `basis-full` still lets the explanation drop onto its own line
          below when opened. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <Badge variant="eyebrow">
          {allOptionsAreParticles
            ? t("lesson.pickParticle", "Pick what fits the blank")
            : t("lesson.completeSentence", "Complete the sentence")}
        </Badge>
        <ExplainButton
          layout="inline"
          explanation={resolvedExplanation}
          hasSubmittedWrong={hasSubmittedWrong}
        />
      </div>

      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-5 py-6 text-center">
        {showMeaningUpFront ? (
          <p className="mb-4 text-base text-text-secondary">
            &ldquo;{step.meaningEn}&rdquo;
          </p>
        ) : null}
        <div className="font-japanese text-2xl leading-snug text-text-primary sm:text-3xl">
          {step.beforeAnnotation ? (
            <AnnotatedJa segments={step.beforeAnnotation} />
          ) : (
            <AnnotatedJa text={step.prompt.before} />
          )}
          <span
            className={`mx-2 inline-flex min-w-[3rem] items-center justify-center rounded-full border-2 px-3 py-0.5 align-middle text-xl font-bold ${
              submitted
                ? isCorrect
                  ? "border-success bg-success/15 text-success"
                  : "border-error bg-error/15 text-error"
                : "border-dashed border-accent/60 bg-surface text-accent"
            }`}
          >
            {pillParticle ?? "?"}
          </span>
          {step.afterAnnotation ? (
            <AnnotatedJa segments={step.afterAnnotation} />
          ) : (
            <AnnotatedJa text={step.prompt.after} />
          )}
        </div>

        {submitted && !isCorrect && selected ? (
          <p className="mt-3 text-sm text-error">
            {t("lesson.youPicked", "You picked")}{" "}
            <span className="font-japanese font-bold">{selected}</span>
          </p>
        ) : null}

        {/* Meaning already sits above the sentence in pre-answer mode — don't
            repeat it; this only fires for a step authored with no upfront
            gloss (meaningEn falsy), which disables showMeaningUpFront too. */}
        {submitted && !showMeaningUpFront ? (
          <p className="mt-4 text-sm text-text-secondary">{step.meaningEn}</p>
        ) : null}
        <PromptAudioButton hasAudio={hasFullAudio} answered={submitted} onPlay={replayAudio} />
      </div>

      {/* flex-wrap, not a fixed grid: long options (じゃないです) must widen
          their tile instead of wrapping mid-word; whitespace-nowrap +
          min-w-fit guarantee it, equal flex-basis keeps short particle sets
          evenly sized, and long options step the type down one size. */}
      <TileTray kind="options-row">
        {step.options.map((p) => {
          const picked = selected === p;
          // `tone="success"` is this view's ONE divergence from the MCQ
          // palette, carried verbatim: a correct particle is a success TINT
          // here, where a correct MCQ option is a filled accent tile. Both
          // mean "the right answer"; picking one is a visual decision, not a
          // migration (it is listed in the b16.2 report for the owner).
          const state = submitted
            ? p === step.correctParticle
              ? "correct"
              : picked
                ? "wrong"
                : "spent"
            : picked
              ? "selected"
              : "idle";
          return (
            <Tile
              key={p}
              variant="option"
              size="particle"
              tone="success"
              /* Long options step the type down one tier — the tile widens
                 rather than wrapping mid-word (じゃないです). */
              text={p.length >= 5 ? "sm" : p.length >= 3 ? "md" : "lg"}
              state={state}
              disabled={submitted}
              aria-pressed={picked}
              onClick={() => setSelected(p)}
              className="font-japanese"
            >
              {p}
            </Tile>
          );
        })}
      </TileTray>

      {/* Single bottom block: explanation + banner + CTA together so the
          button never moves on submit. Banner only on wrong — correct
          celebrates via toast; the explanation still teaches on both. */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {submitted && step.explanation ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
            {resolvedExplanation}
          </p>
        ) : null}
        {submitted && !isCorrect && <Feedback correct={false} />}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            disabled={!selected}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>

    </div>
  );
}
