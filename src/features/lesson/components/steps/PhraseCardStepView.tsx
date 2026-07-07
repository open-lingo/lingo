import { useEffect } from "react";
import type { PhraseCardStep } from "../../types";
import { Icon } from "@/shared/components/Icon";
import { playJaAudio, useAutoPlayJaAudio, getTtsUrl } from "@/shared/tts";
import { ContinueButton } from "../ContinueButton";
import { lookupKanaEmoji, notoEmojiUrl } from "@/shared/assets/notoEmoji";
import { playSfx } from "@/shared/audio/sfx";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

type Props = {
  step: PhraseCardStep;
  onContinue: () => void;
};

/**
 * Phrasebook exposure card — meaning-first. The user is being TAUGHT a
 * phrase, not tested on one. Layout is intentionally calm: meaning
 * dominates, romaji guides pronunciation, kana decorates (the user may
 * not know kana yet).
 */
export function PhraseCardStepView({ step, onContinue }: Props) {
  useLessonKeyboard({
    onEnter: () => {
      playSfx("passive-advance");
      onContinue();
    },
  });

  useAutoPlayJaAudio(step.kana, `phrase-${step.id}`);

  // Cheap guard: if the manifest is missing this audio, the play button
  // becomes a no-op rather than throwing. (Should never happen in
  // production but useful when authoring new content.)
  const hasAudio = getTtsUrl(step.kana) !== null;

  function handlePlay() {
    if (!hasAudio) return;
    playJaAudio(step.kana);
  }

  // Replay-on-focus: when the lesson player returns to this card via
  // back-button (no nav today but useful when a Back affordance lands),
  // the audio re-plays once.
  useEffect(() => {
    return () => {
      // cleanup placeholder — useAutoPlayJaAudio handles teardown
    };
  }, [step.id]);

  // Author override → kana lookup → no glyph. notoEmojiUrl returns null for
  // unmapped chars; the <img> only renders when we resolved a URL.
  const resolvedEmoji = step.emoji ?? lookupKanaEmoji(step.kana) ?? null;
  const emojiUrl = resolvedEmoji ? notoEmojiUrl(resolvedEmoji) : null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
        Phrasebook
      </p>

      <div className="relative overflow-hidden rounded-3xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-surface to-info/10 px-7 py-9 text-center shadow-[var(--shadow-card)]">
        {emojiUrl && (
          <img
            src={emojiUrl}
            alt=""
            aria-hidden
            width={64}
            height={64}
            decoding="async"
            className="mx-auto mb-4 h-16 w-16"
          />
        )}
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl">
          {step.meaningEn}
        </h2>

        <p
          className="mt-5 font-japanese text-2xl font-bold text-accent sm:text-3xl"
          lang="ja-Latn"
        >
          {step.romaji}
        </p>

        <p
          className="mt-2 font-japanese text-base text-text-muted sm:text-lg"
          lang="ja"
        >
          {step.kana}
        </p>

        <button
          type="button"
          onClick={handlePlay}
          disabled={!hasAudio}
          className="mt-6 inline-flex items-center gap-2 rounded-full border-[1.5px] border-accent/50 bg-surface px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Replay audio"
        >
          <Icon name="play" size={16} aria-hidden />
          Play again
        </button>

        {step.cultureNote ? (
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-text-secondary">
            {step.cultureNote}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-6">
        <ContinueButton
          onClick={() => {
            // Passive cards don't tick the progress bar — emit a non-progress
            // chirp + light haptic so the tap feels acknowledged.
            playSfx("passive-advance");
            onContinue();
          }}
          label="Got it"
        />
      </div>
    </div>
  );
}
