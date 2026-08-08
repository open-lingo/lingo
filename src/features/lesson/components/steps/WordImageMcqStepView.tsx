import { useCallback, useEffect, useRef, useState } from "react";
import type { WordImageMcqStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { useTranslation } from "react-i18next";
import { notoEmojiUrl, lingoArtUrl } from "@/shared/assets/notoEmoji";
import { AnnotatedText } from "@/shared/readingAnnotation/AnnotatedText";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { isRomanizationOn } from "@/shared/settings/types";
import { Icon } from "@/shared/components/Icon";

const CELEBRATE_MS = 1100;

type Props = {
  step: WordImageMcqStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Bold the english meaning inside `What is the word for 'love'?`. Matches
 * the emphasis pattern from ListeningBuildStepView so the user gets the
 * same visual cue across step types.
 */
function PromptWithEmphasis({ meaning }: { meaning: string }) {
  return (
    <>
      What is the word for{" "}
      <strong className="font-bold text-text-primary">
        &lsquo;{meaning}&rsquo;
      </strong>
      ?
    </>
  );
}

/**
 * SVG art with a raw-glyph fallback: a vendored Noto file that's missing
 * (or any future un-vendored emoji) renders the device emoji instead of
 * a broken-image box. The vendored set is curated, so gaps are possible
 * whenever new content is authored.
 */
function EmojiArt({ src, emoji }: { src: string | null; emoji: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span aria-hidden className="min-h-0 flex-1 text-5xl leading-none sm:text-8xl">
        {emoji}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={160}
      height={160}
      loading="eager"
      onError={() => setFailed(true)}
      // `min-h-0 flex-1` (was `h-[50%]`): the art is the shrinkable part of the
      // card. A percentage height needs a definite parent height to resolve
      // against, which the card only has once it stops being content-sized —
      // so on narrow phones it fell back to intrinsic size and inflated the
      // card. Flexing absorbs the shrink instead; `object-contain` keeps the
      // aspect ratio at whatever height it lands on.
      // `min-h-[30%]` is a pedagogy floor, not styling: the PICTURE is the
      // answer cue in this step, so it must never be squeezed to nothing. With
      // pure `flex-1` a long kana word (きゅうにゅう) wrapped to two lines and
      // took the whole card, leaving zero art — the step still "fit" the
      // viewport while being unusable. The floor resolves against the card's
      // now-definite square height.
      className="min-h-[30%] w-1/2 max-h-52 max-w-52 flex-1 select-none object-contain"
      draggable={false}
    />
  );
}

export function WordImageMcqStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  // The picture is the answer here, not the romaji, so the romaji helper is a
  // pure reading aid — honor the per-language show-romanization setting
  // (defaults on) so a never-learned learner can actually read each option.
  // Weans off with the setting; mastery gating alone would hide it for users
  // with no record. This is a JA-only vocab step (romaji above kana options),
  // so the setting is resolved for the "ja" language key.
  const showRomaji = isRomanizationOn(useSettings().settings.learning, "ja");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // Audio-prompt mode (vocabMcq review path sets meaningEn = the target
  // kana): the old text prompt printed the answer — "What is the word for
  // なに?" with a tile captioned なに right below it (QA 2026-07-16,
  // ja-m28-review-1). Detection is safe: normal meanings are English and
  // can never equal a kana option word. In this mode the cue is the AUDIO,
  // so we play the word and ask "Which word do you hear?" instead.
  const audioPrompt = step.options.some((o) => o.word === step.meaningEn);
  const autoplayedRef = useRef(false);
  useEffect(() => {
    if (!audioPrompt || autoplayedRef.current) return;
    autoplayedRef.current = true;
    if (getTtsUrl(step.meaningEn)) playJaAudio(step.meaningEn);
  }, [audioPrompt, step.meaningEn]);

  const isCorrect = selected === step.correctOptionId;

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        handleTap(step.options[n - 1].id, step.options[n - 1].word);
      }
    },
  });

  function handleTap(optId: string, word: string) {
    if (submitted) return;
    // Preview-on-tap: play the word's TTS so the learner can match the
    // emoji + kana to a sound before committing. Same interaction as
    // symbol_to_sound / symbol_recognition.
    if (getTtsUrl(word)) {
      playJaAudio(word);
    }
    setSelected(optId);
  }

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete(step.id, isCorrect);
    if (isCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  // Adaptive grid: ≤3 options render as a single balanced row (no empty
  // cell — 3-up was previously 2×2-with-a-hole); 4 stays a 2×2. Card edge is
  // capped (~16rem) and height-budget-aware so big 4K screens don't balloon
  // the picture and short laptop windows still fit the 2-row case.
  const optCount = step.options.length;
  const cols = optCount <= 3 ? optCount : 2;
  const rows = Math.ceil(optCount / cols);
  // Height reserved for everything in the stage that ISN'T the grid: the
  // prompt (up to 2 wrapped lines on a 320px phone), the outer + inner
  // `gap-6`s, the CTA block's `pt-6`, and the CTA itself (~74px measured).
  // Was 11rem, which under-reserved by ~25px whenever the prompt wrapped.
  const RESERVE = "13rem";
  // The stage's free height, once the bottom dead zone is taken out (index.css
  // § "The stage's bottom DEAD ZONE"). Read from the custom property rather
  // than hard-coding `90cqh` so the two cannot drift apart.
  const FREE_H = `calc(100cqh - var(--stage-tail, 0px))`;
  // Width caps: the scroller's own inline free space (`100cqw`, not `100vw` —
  // no scrollbar-gutter error), a height-derived cap, and a hard per-column rem
  // cap. No viewport-unit math.
  const gridWidth = `min(calc(100cqw - 3rem), calc((${FREE_H} - ${RESERVE}) * ${cols} / ${rows}), ${cols * 16}rem)`;
  // ⚠️ The width cap ALONE does not bound the grid's height. It predicts height
  // from width, which is only valid while the cards are actually square — and
  // they are NOT: `aspect-square` sets a *preferred* ratio, but a grid row is
  // sized to its items' min-content, and a card's min-content (romaji ruby +
  // `text-3xl` kana + emoji + `p-4`) exceeds its width on narrow phones. Cards
  // measured 112×135 at 320px, so a 240px-wide grid rendered 390px tall and the
  // stage scrolled by up to 204px (Spencer QA 2026-08-06, ja-m4-neo-1 step 12).
  // Bound the height DIRECTLY and let the cards shrink into it: `1fr` rows plus
  // `min-h-0` on the card is what actually makes `aspect-square` yield.
  const gridMaxHeight = `calc(${FREE_H} - ${RESERVE})`;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* The cluster CENTRES in the space above the CTA rather than starting at
          the top. The grid is width-capped on a phone (350px inside a 398px
          column), so it cannot grow into spare height — top-aligning it dumped
          every leftover pixel into one 263px void between the tiles and the
          CTA, and the whole step read as sitting too high (Spencer QA
          2026-08-07: "the middle elements need to move down a bit"). The CTA
          below still carries `mt-auto`, so it stays bottom-anchored and the
          fixed action bar keeps its position on every device. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-6">
      {audioPrompt ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => playJaAudio(step.meaningEn)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_1px_0_0_rgb(var(--color-accent-hover))]"
            aria-label="Play audio"
          >
            <Icon name="play" size={24} />
          </button>
          <h2 className="text-xl font-medium leading-snug text-text-secondary sm:text-2xl">
            Which word do you hear?
          </h2>
        </div>
      ) : (
        <h2 className="text-center text-xl font-medium leading-snug text-text-secondary sm:text-2xl">
          <PromptWithEmphasis meaning={step.meaningEn} />
        </h2>
      )}

      {/* Grid height ≈ its width (two stacked squares), so the width cap
          is really a height cap: the scroller free space (100cqh) minus the
          prompt + Continue budget. Shrinks on short laptops (MacBook 14" ≈
          840px usable); on tall windows it grows past the 42rem text column
          (picture cards have no line-length constraint) via the
          left-1/2 translate breakout, up to 56rem. */}
      <div
        className="relative left-1/2 grid -translate-x-1/2 gap-3"
        style={{
          width: gridWidth,
          maxHeight: gridMaxHeight,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          // `minmax(0, 1fr)` rows (not the default `auto`) are what let the
          // grid honour maxHeight — `auto` rows size to content and overflow.
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {step.options.map((opt, idx) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          // Kanji ladder: when the factory attached a display annotation for
          // this option, render it via the segments path so the kanji-
          // substituted surface (from applyKanjiSurfaces) shows. Otherwise
          // fall back to the bare kana text path. Answer/audio still key off
          // opt.id / opt.word — the annotation is display-only.
          const optAnn = step.optionAnnotations?.[idx];
          // Square buttons. Same solid-accent selection pattern as the
          // other 2026-05-16 MCQ revamps — unmistakable in dark mode.
          // `min-h-0` + `overflow-hidden` are load-bearing, not defensive: a
          // flex/grid item keeps a min-content floor by default, which is what
          // let the card outgrow its `aspect-square` and push the grid row
          // taller than the width cap predicted. With the floor removed the
          // card shrinks into its `1fr` row and the ratio finally binds.
          let base =
            "flex aspect-square min-h-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 bg-surface p-4 transition-colors duration-150";
          let stateClasses = "border-border hover:border-accent";
          if (submitted && isAnswer) {
            stateClasses = "border-accent bg-accent/10";
          } else if (submitted && isSelected && !isAnswer) {
            stateClasses = "border-error bg-error/10";
          } else if (isSelected) {
            stateClasses = "border-accent bg-accent/5";
          }
          const emojiSrc = lingoArtUrl(opt.word) ?? notoEmojiUrl(opt.emoji);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => handleTap(opt.id, opt.word)}
              className={`${base} ${stateClasses}`}
              aria-label={`Hear and pick ${opt.word}`}
            >
              {/* Kana stacked above the art (normal flow, not absolute) so
               *  the card stays vertically balanced at any size. Rendered via
               *  AnnotatedText with forceShowHelper bound to the global
               *  show-romaji setting so the romaji helper shows above each kana
               *  for a never-learned learner — the same spoon-feed every other
               *  step gives — and weans off when that setting flips off. */}
              {optAnn ? (
                <AnnotatedText
                  forceShowHelper={showRomaji}
                  segments={optAnn}
                  className={
                    // text-2xl (not 3xl) below `sm`: on a ~110-140px phone card a
                    // 6-kana word at 30px wrapped to two lines and crowded the
                    // art out. Desktop keeps 4xl.
                    "font-japanese text-center text-2xl font-bold tracking-wide sm:text-4xl " +
                    (submitted && isAnswer
                      ? "text-accent"
                      : submitted && isSelected && !isAnswer
                        ? "text-error"
                        : "text-text-primary")
                  }
                />
              ) : (
                <AnnotatedText
                  forceShowHelper={showRomaji}
                  text={opt.word}
                  className={
                    // text-2xl (not 3xl) below `sm`: on a ~110-140px phone card a
                    // 6-kana word at 30px wrapped to two lines and crowded the
                    // art out. Desktop keeps 4xl.
                    "font-japanese text-center text-2xl font-bold tracking-wide sm:text-4xl " +
                    (submitted && isAnswer
                      ? "text-accent"
                      : submitted && isSelected && !isAnswer
                        ? "text-error"
                        : "text-text-primary")
                  }
                />
              )}
              {/* Emoji centered, sized to fill ~60–65% of the card.
               *  Noto Emoji SVG render — never device-dependent. */}
              <EmojiArt src={emojiSrc} emoji={opt.emoji} />
            </button>
          );
        })}
      </div>
      </div>

      {/* Single bottom-anchored block (banner + CTA) so the button never
          moves on submit. Width mirrors the grid's breakout so the column
          reads as one shape when the grid exceeds 42rem.
          ⚠️ The breakout offset here is `ml-[50%]`, NOT the grid's `left-1/2`,
          even though the two are geometrically identical (both resolve against
          the containing block's width). This block is made `position: sticky`
          by index.css § "Lesson action bar", and under sticky a `left` value
          stops being a relative nudge and becomes an inset CONSTRAINT — which
          dragged the button off the left edge of the viewport (rect.left=-102
          @412px). A margin is pure layout and survives the position change. */}
      <div
        className="relative ml-[50%] mt-auto flex -translate-x-1/2 flex-col gap-4 pt-6"
        style={{ width: gridWidth }}
        data-testid="primary-cta"
      >
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && <Feedback correct={false} />}
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
