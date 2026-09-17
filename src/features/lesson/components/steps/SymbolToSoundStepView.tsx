import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolToSoundStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { getTtsUrl } from "@/shared/tts";
import { getAlphabetAudioUrl } from "@/shared/audio/alphabetAudio";
import { playLocalAudio } from "@/shared/audio/volume";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { Icon } from "@/shared/components/Icon";
import { Tile } from "../tiles/Tile";
import type { TileState } from "../tiles/Tile";
import { TileTray } from "../tiles/TileTray";

const CELEBRATE_MS = 1100;

type Props = {
  step: SymbolToSoundStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Revamped symbol_to_sound (2026-05-16): no central Play button, no
 * auto-play. The kana is shown alone at the top; the 2x2 grid below has
 * romaji-labeled buttons that play THEIR OWN kana's audio on tap.
 *
 * The user taps to sample each sound, compares against their memory of
 * the displayed kana (heard moments earlier in symbol_intro), and
 * commits with a separate Check button. Tap on a button does double
 * duty: preview the sound + select the option. Re-tap replays.
 */
export function SymbolToSoundStepView({
  step,
  onComplete,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctOptionId;

  function playForOption(opt: { symbol?: string }) {
    // Prefer the option's own kana via JA TTS. If no symbol is set
    // (legacy step authoring), fall back silently — the renderer still
    // works as a vanilla MC.
    if (opt.symbol) {
      const url = getTtsUrl(opt.symbol);
      if (url) {
        playLocalAudio(url);
        return;
      }
    }
    // Last-ditch: payload.audioKey (only the correct option matches).
    if (opt.symbol === step.payload.symbol && step.payload.audioKey) {
      playLocalAudio(getAlphabetAudioUrl(step.payload.audioKey));
    }
  }

  function handleOptionTap(opt: { id: string; symbol?: string }) {
    if (submitted) return;
    setSelected(opt.id);
    playForOption(opt);
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

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected, onContinue]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) handleOptionTap(step.options[n - 1]);
    },
  });

  // Every symbol_to_sound producer (ja/ko _consonantRowHelpers, m1-l1,
  // m1-sa, _hangulRowHelpers, m1-vowels) emits exactly 4 options, so this
  // always resolves to the 2×2 grid below. `TileTray`'s `grid` kind only
  // has a `cols={1|2}` primitive — a true 3-column grid (the old
  // `optionCount === 3` branch) isn't expressible on it; kept as a single-
  // column fallback since it is unreached by any shipped content (grepped
  // 2026-09-17, review P3). Flagged as a gap for the primitive's owner.
  const optionCount = step.options.length;
  const gridCols = optionCount === 2 || optionCount === 4 ? 2 : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* `mt-auto` HERE and on the action block below is what centres this
          step: two auto margins in a column split the free space evenly, so
          the content sits midway between the header and the CTA while the CTA
          stays bottom-anchored — no wrapper element, no reading-order change.
          Top-aligned, this step stranded a 185px void on a 430x932 phone
          (Spencer QA 2026-08-07). Collapses to 0 when content overflows. */}
      <p className="mt-auto text-center text-base text-text-secondary">
        {t(
          "alphabet.tapToHear",
          "Tap a sound to hear it. Pick the one that matches.",
        )}
      </p>

      <div className="flex justify-center">
        <span
          className="font-japanese text-[clamp(140px,22cqh,200px)] font-bold leading-none text-text-primary"
          aria-hidden
        >
          {step.payload.symbol}
        </span>
      </div>
      {/* ON THE TILE PRIMITIVE (review P3, 2026-09-17). `reveal` is the
          tier built for exactly this shape — "one uniform mid size
          whatever the text length" — and its 32px block padding is a
          byte-for-byte match to the old `py-8`. Icon + text stay a plain
          inner flex row (Tile centres its children; the primitive owns no
          `gap`, so the 12px `gap-3` between icon and label is kept as
          layout, not a text-size override). State mapping follows
          MultipleChoiceStepView's convention — pre-submit `selected` is the
          lighter tint every other option surface uses, not the old solid
          fill; an unpicked non-answer option after submit stays `idle`. */}
      <TileTray kind="grid" cols={gridCols} gap={gridCols ? undefined : "tight"}>
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          const state: TileState = submitted
            ? isAnswer
              ? "correct"
              : isSelected
                ? "wrong"
                : "idle"
            : isSelected
              ? "selected"
              : "idle";
          return (
            <Tile
              key={opt.id}
              variant="option"
              size="reveal"
              state={state}
              disabled={submitted}
              onClick={() => handleOptionTap(opt)}
              aria-label={`Hear ${opt.text}`}
            >
              <span className="flex items-center justify-center gap-3">
                <Icon name="volume" size={20} aria-hidden className="shrink-0" />
                <span>{opt.text}</span>
              </span>
            </Tile>
          );
        })}
      </TileTray>
      {/* Single bottom block: banner + CTA together so the button never
          moves on submit. */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
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
