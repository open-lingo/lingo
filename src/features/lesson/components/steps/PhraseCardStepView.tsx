import { useEffect } from "react";
import type { PhraseCardStep } from "../../types";
import { Icon } from "@/shared/components/Icon";
import { playJaAudio, useAutoPlayJaAudio, hasTtsAudio } from "@/shared/tts";
import { ContinueButton } from "../ContinueButton";
import { lookupKanaEmoji, notoEmojiUrl } from "@/shared/assets/notoEmoji";
import { playSfx } from "@/shared/audio/sfx";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { isRomanizationOn } from "@/shared/settings/types";
import { useLanguage } from "@/shared/contexts/LanguageContext";

type Props = {
  step: PhraseCardStep;
  onContinue: () => void;
};

/**
 * Active language id, defaulting to "ja" when no LanguageProvider is
 * mounted (lesson-render smoke tests / Storybook). Mirrors AnnotatedText's
 * `useActiveLanguageOrJa` so the phrase card keeps rendering outside a
 * provider tree.
 */
function useActiveLanguageOrJa(): string {
  try {
    const { language } = useLanguage();
    return language?.id ?? "ja";
  } catch {
    return "ja";
  }
}

/**
 * Phrasebook exposure card — meaning-first. The user is being TAUGHT a
 * phrase, not tested on one. Layout is intentionally calm: the English
 * meaning heads the card, the TARGET SCRIPT (`step.kana` — kana for JA,
 * Hangul for KO) is the visual hero, and the romanization (`step.romaji`)
 * is a small subordinate reading aid beneath it. Over-reliance on
 * romanization hurts acquisition, so the native script always dominates.
 */
export function PhraseCardStepView({ step, onContinue }: Props) {
  const langId = useActiveLanguageOrJa();
  // Romanization is a reading aid, not the star. JA phrase cards have
  // historically always shown it (no per-card toggle); non-JA courses
  // (e.g. KO Revised Romanization) honor the language-neutral
  // `showRomanization` setting — the same gate AnnotatedText applies to
  // Hangul reading aids. Native script renders regardless.
  const { settings } = useSettings();
  const showRomanization =
    langId === "ja" ? true : isRomanizationOn(settings.learning, langId);

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
  // hasTtsAudio (not getTtsUrl) so non-JA courses with no recorded clip still
  // expose the speaker — playJaAudio falls back to the platform voice.
  const hasAudio = hasTtsAudio(step.kana);

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
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl">
          {step.meaningEn}
        </h2>

        {/* Target script — the visual hero. Large, accent-colored,
         *  language-tagged so `:lang(ja)` / `:lang(ko)` pick the right font. */}
        <p
          className="mt-5 text-3xl font-bold text-accent sm:text-4xl"
          lang={langId}
        >
          {step.kana}
        </p>

        {/* Romanization — subordinate reading aid: small + muted, and
         *  clearly smaller than the native script above. */}
        {showRomanization && step.romaji ? (
          <p
            className="mt-2 text-base text-text-muted sm:text-lg"
            lang={`${langId}-Latn`}
          >
            {step.romaji}
          </p>
        ) : null}

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
