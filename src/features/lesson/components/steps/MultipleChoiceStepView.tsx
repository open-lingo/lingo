import { useCallback, useMemo, useState } from "react";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { useTranslation } from "react-i18next";
import type { MultipleChoiceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Tile } from "../tiles/Tile";
import { TileTray } from "../tiles/TileTray";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import {
  getTtsUrl,
  playJaAudio,
  useAutoPlayJaAudio,
} from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { stepHasSentenceContent } from "../../data/_stepPredicates";
import { isSingleWordOption } from "./optionTier";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { formatPrompt } from "../formatPrompt";
import { RegisterCueEyebrow } from "./RegisterCueEyebrow";
import { useContentString, useContentStrings } from "../../hooks/useContentString";
import {
  courseIdsFromLessonId,
  explanationAnchor,
  hintAnchor,
  optionAnchor,
  promptAnchor,
} from "@/shared/i18n/content/anchors";
import { Badge } from "@/shared/components/ui";

const CELEBRATE_MS = 1100;

type Props = {
  step: MultipleChoiceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
  /** Owning lesson id — see `useContentString`. */
  lessonId?: string;
};

export function MultipleChoiceStepView({ step, onComplete, onContinue, lessonId }: Props) {
  const { t } = useTranslation();
  const rid = lessonId ?? step.id;
  const ids = courseIdsFromLessonId(rid);
  const resolvedPromptRaw = useContentString(
    rid,
    ids ? promptAnchor(ids.moduleId, rid, step.prompt, undefined) : null,
    step.prompt,
  );
  const resolvedHint = useContentString(
    rid,
    ids && step.hint ? hintAnchor(ids.moduleId, rid, step.hint) : null,
    step.hint ?? "",
  );
  const resolvedExplanation = useContentString(
    rid,
    ids && step.explanation ? explanationAnchor(ids.moduleId, rid, step.explanation) : null,
    step.explanation ?? "",
  );
  const resolvedOptionTexts = useContentStrings(
    rid,
    step.options.map((opt) => ({
      anchor: ids ? optionAnchor(ids.moduleId, rid, opt.text) : null,
      enText: opt.text,
    })),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctOptionId;

  // Render order is seeded on step id (same contract as build tile banks and
  // the other MCQ views): factory output is already slot-rotated and just
  // re-shuffles harmlessly, while a hand-written literal (the es/fr §13 wave
  // writes options correct-first for readability) never ships a position
  // tell. Indices, not options, so `optionAnnotations` stays index-aligned.
  const order = useMemo(
    () => seededShuffle(step.options.map((_, i) => i), step.id),
    [step.id, step.options.length],
  );

  useAutoPlayJaAudio(step.promptAudioText, `mc-${step.id}`);

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= order.length) {
        setSelected(step.options[order[n - 1]].id);
      }
    },
  });

  function handleSubmit() {
    if (!selected) return;
    const correct = selected === step.correctOptionId;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  function replayPromptAudio() {
    if (step.promptAudioText) playJaAudio(step.promptAudioText);
  }

  const ttsAvailable =
    !!step.promptAudioText && !!getTtsUrl(step.promptAudioText);
  // 2×2 grid when 4 options; single column otherwise. Anchors Continue by
  // sizing the option block with a fixed min-height regardless of layout.
  // `auto-rows-fr` forces both rows to equal heights — without it, a tile
  // whose content is the only 2-mora kana in a translateMcq grid blew up
  // to 5xl + py-9 while its 3-mora neighbors stayed text-xl + py-6
  // (Spencer's 2026-05-17 sizing-inconsistency report).
  const optionsAre4 = step.options.length === 4;
  // Word-only grid detection (single tokens, no sentences): these render
  // as centered word cards at ONE shared size tier — mixing a 5xl kana
  // with a tiny left-aligned 3-mora word in the same grid read as broken.
  //
  // THE TEST IS "NO WHITESPACE", NOT A CHARACTER CAP (2026-09-16, phase 2B;
  // TestFlight #156 / sweep T2). It used to require EVERY option to be ≤ 8
  // characters, so one 10-character word — `ありがとうございます` — demoted a
  // 2×2 grid of single Japanese words to the `sentence` PROSE tier, where the
  // options render left-aligned and wrap mid-word: measured on the 15 Pro Max,
  // 1 of 4 wrapped at 100% and 2 of 4 at 125% and 140% on `ja-m3-neo-5?step=12`
  // — Spencer's #156 screenshot exactly. A long single word is still a word;
  // it belongs on the `word` tier, which centres it and shrinks it toward its
  // own FIT floor before it is ever allowed to wrap (the order he asked for:
  // "shrinking the font size floor is preferred").
  //
  // The cap that remains is a SANITY cap, well above anything authored: the
  // longest single-token option in the four shipped courses is 12 glyphs
  // (JA/KO) and 17 (ES/FR). A "word" longer than that is a mis-authored
  // sentence with its spaces eaten, and prose is the safer render for it.
  // Wide scripts (kana, kanji, hangul) get the lower cap because their glyphs
  // are ~1em where Latin is ~0.5em, so 16 wide glyphs and 24 Latin ones are
  // about the same ink.
  const allSingleWords = step.options.every((o) => isSingleWordOption(o.text));
  // A word-only grid picks ONE tier for every option — the longest option
  // decides. Pre-fix the ≤2-glyph cutoff was per option, which left とけい /
  // きゅうり tiny and left-aligned beside a blown-up centred に (Spencer QA
  // 2026-07-13, ja-m5-review-1: "bigger and take the center of the card if
  // it is a single word").
  const singleWordSize = step.options.some((o) => o.text.trim().length > 2)
    ? ("word" as const)
    : ("word-glyph" as const);

  const hasSubmittedWrong = submitted && !isCorrect;
  const showExplain = stepHasSentenceContent(step);

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      {showExplain && (
        <ExplainButton
          explanation={resolvedExplanation}
          hasSubmittedWrong={hasSubmittedWrong}
        />
      )}
      {/* The cluster CENTRES in the space above the action block rather than
          starting at the top. A prompt plus a short option list sizes to its
          content, so top-aligning stranded a 179px void between the last
          option and the CTA on a 430x932 phone (Spencer QA 2026-08-07).
          Reading order is unchanged; only the position moved. The action block
          below keeps `mt-auto`, so it stays bottom-anchored. */}
      <div className="flex min-h-0 flex-1 flex-col stage-center gap-6">
      {step.audioOnlyPrompt ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            type="button"
            onClick={replayPromptAudio}
            disabled={!ttsAvailable}
            className="flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_4px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_5px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_2px_0_0_rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={32} />
          </button>
          <Badge variant="eyebrow">
            {t("lesson.whichKanaStarts", "Which kana starts the word?")}
          </Badge>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {/* The grammar review pool authors twelve register MCQs whose
              distractors are the same sentence in the wrong register — the
              cue is the exercise. `sentenceMcq` splits it out of the prompt,
              so it renders here and nowhere else. `basis-full` keeps it on
              its own line above the prompt inside this wrapping flex row. */}
          <RegisterCueEyebrow cue={step.registerCue} className="basis-full" />
          <h2 className="text-xl font-semibold text-text-primary">
            {step.promptAnnotation ? (
              <AnnotatedJa segments={step.promptAnnotation} />
            ) : (
              <AnnotatedJa text={formatPrompt(resolvedPromptRaw)} />
            )}
          </h2>
          {ttsAvailable && (
            // Replayable speaker on every MC with a TTS prompt. Auto-play
            // fires once on mount; this lets the learner hear it again
            // without leaving the card. Especially load-bearing on test
            // cards where the romaji ruby is off — audio is the prompt.
            <button
              type="button"
              onClick={replayPromptAudio}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_1px_0_0_rgb(var(--color-accent-hover))]"
              aria-label={t("lesson.play", "Play audio")}
            >
              <Icon name="play" size={14} />
            </button>
          )}
        </div>
      )}

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{resolvedHint}</p>
      )}

      {/* Container-relative min-height: cards grow into the free space of
          the lesson scroller (`cqh`) on tall windows and shrink on short
          ones — no `dvh` floor that overflowed short/landscape viewports.
          The grid's own `auto-rows-fr` + tile content set the natural
          floor, so no fixed px minimum is needed. */}
      <TileTray
        kind="grid"
        cols={optionsAre4 ? 2 : 1}
        gap={optionsAre4 ? undefined : "tight"}
        style={{
          minHeight: optionsAre4 ? "min(40rem, 52cqh)" : "min(32.5rem, 44cqh)",
        }}
      >
        {order.map((idx) => {
          const opt = step.options[idx];
          const optText = resolvedOptionTexts[idx];
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          const ann = step.optionAnnotations?.[idx];

          // Default + selected-pre-submit + post-submit-correct/wrong, as
          // ONE WORD each. Pre-submit selection is a lighter "picked, not
          // locked" tint than the full accent fill that marks a submitted
          // correct answer — pre-fix (2026-05-17 R1.1) both used the same
          // green fill, which made tap-to-peek look like commit-to-answer.
          // The colours themselves live in the primitive now.
          const state = submitted && isAnswer
            ? "correct"
            : submitted && isSelected
              ? "wrong"
              : isSelected
                ? "selected"
                : "idle";

          // Layout per option, as a size tier:
          // - `reveal` (translateMcq): all 4 options at one size regardless
          //   of text length. Pre-fix the isShortGlyph branch fired for
          //   2-mora かぎ and blew it up to text-5xl while 3-mora siblings
          //   stayed text-xl — tiles looked broken. Spencer 2026-05-17: "set
          //   height and width limits and then fill text".
          // - `word`/`word-glyph`: word-only grids, one uniform display size
          //   picked by the longest option.
          // - `glyph`: a ≤2-glyph option in a MIXED grid — the classic
          //   alphabet drill. Big-glyph treatment ONLY when the whole grid is
          //   glyphs: a lone short option (うん) in a mixed sentence grid
          //   rendered 3-4× its siblings (Gate 10 continuity run 2026-07-20).
          // - `sentence`: long text, left-aligned.
          const isShortGlyph =
            opt.text.length <= 2 &&
            step.options.every((o) => o.text.length <= 2);
          const size = step.optionsRevealRomajiOnSelect
            ? ("reveal" as const)
            : allSingleWords
              ? singleWordSize
              : isShortGlyph
                ? ("glyph" as const)
                : ("sentence" as const);

          return (
            <Tile
              key={opt.id}
              variant="option"
              size={size}
              state={state}
              disabled={submitted}
              aria-pressed={isSelected}
              onClick={() => setSelected(opt.id)}
            >
              {step.optionsHideRomaji ? (
                // Test/quiz mode — render the kana raw so the romaji
                // helper doesn't broadcast the answer.
                <span className="font-japanese" lang="ja">{optText}</span>
              ) : (() => {
                // Reveal-on-select: show romaji only on the currently-
                // selected option (pre-submit). Once submitted, show it
                // on the correct option too so feedback is readable.
                const showRomaji =
                  step.optionsRevealRomajiOnSelect &&
                  (isSelected || (submitted && isAnswer));
                return ann ? (
                  <AnnotatedJa segments={ann} forceShowHelper={showRomaji} />
                ) : (
                  <AnnotatedJa text={optText} forceShowHelper={showRomaji} />
                );
              })()}
            </Tile>
          );
        })}
      </TileTray>
      </div>

      {/* Single bottom-anchored block: wrong-answer banner + CTA together
          so the button never moves on submit. */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && (
          <Feedback correct={false} explanation={step.explanation} />
        )}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label="Check"
            disabled={!selected}
          />
        ) : (
          <ContinueButton
            onClick={onContinue}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        )}
      </div>
    </div>
  );
}
