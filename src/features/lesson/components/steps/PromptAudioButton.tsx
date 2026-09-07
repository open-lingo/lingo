/**
 * PromptAudioButton — the reward-audio replay control that several step
 * views park inside their prompt card AFTER a commit (kanji reading,
 * agreement/particle/aspect/conjugation cloze, conjugation transform).
 *
 * TestFlight #48/#53 (2026-09-05, Spencer): mounting the button only once
 * `submitted` flips true grows the prompt card at that exact moment, and
 * everything below it (option grid, CTA) shifts down. The fix is a
 * reserved slot: this component renders in the SAME place, at the SAME
 * size, from first render — pre-answer it is a locked placeholder (muted,
 * a lock glyph, `disabled` + `aria-disabled`), post-answer it swaps to the
 * live play button. Only styling changes; nothing mounts or unmounts.
 *
 * Renders nothing at all when the step has no audio to offer — that case
 * never showed a button before either, and reserving a slot for a control
 * that will never go live would be its own new layout wart.
 */
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

type Props = {
  /** Whether this step instance has a clip to play at all. */
  hasAudio: boolean;
  /** Whether the learner has committed an answer — unlocks the button. */
  answered: boolean;
  onPlay: () => void;
  /** Wrapper classes; defaults to the row this replaced in every caller. */
  className?: string;
  size?: number;
};

export function PromptAudioButton({
  hasAudio,
  answered,
  onPlay,
  className = "mt-4 flex items-center justify-center",
  size = 12,
}: Props) {
  const { t } = useTranslation();
  if (!hasAudio) return null;

  return (
    <div className={className}>
      <button
        type="button"
        data-testid="prompt-audio-button"
        onClick={answered ? onPlay : undefined}
        disabled={!answered}
        aria-disabled={!answered}
        aria-label={
          answered
            ? t("lesson.play", "Play audio")
            : t("lesson.audioLocked", "Answer to unlock audio")
        }
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] transition-colors ${
          answered
            ? "cursor-pointer border-accent-hover bg-accent text-white"
            : "cursor-not-allowed border-border bg-surface text-text-muted opacity-60"
        }`}
      >
        <Icon name={answered ? "play" : "lock"} size={answered ? size : size + 2} />
      </button>
    </div>
  );
}
