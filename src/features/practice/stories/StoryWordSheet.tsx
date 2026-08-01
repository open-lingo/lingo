/**
 * The word sheet — what opens when the learner taps a word in a story.
 *
 * Unlike the dictionary modal, this can show an AUTHORED gloss, which is the
 * only meaning available for culture words the curriculum never teaches, and it
 * offers "Add to my words" so the word leaves the story as a real SRS card.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { playJaAudio } from "@/shared/tts";
import { useShowReadingRomaji } from "@/features/practice/reading/useShowReadingRomaji";
import { addStoryWord, isStoryWordAdded } from "./addWord";
import type { StoryWordInfo } from "./unknownWords";

interface StoryWordSheetProps {
  word: StoryWordInfo | null;
  langId: string;
  onClose: () => void;
}

export function StoryWordSheet({ word, langId, onClose }: StoryWordSheetProps) {
  const { t } = useTranslation();
  const showRomaji = useShowReadingRomaji(langId);
  // Local echo of the write so the button flips without re-reading storage.
  const [added, setAdded] = useState(false);

  if (!word) return null;
  const alreadyAdded = added || isStoryWordAdded(word, langId);

  return (
    // The word itself is the heading — repeating it in the modal header would
    // print the same string twice, so the header carries only the close button.
    <Modal open onClose={onClose} ariaLabelledBy="story-word-surface" size="sm">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <p id="story-word-surface" className="text-2xl text-text-primary" lang={langId}>
              {word.surface}
            </p>
            <button
              type="button"
              onClick={() => void playJaAudio(word.surface, langId)}
              className="rounded-md p-1.5 text-text-muted transition hover:text-text-primary"
              aria-label={t("practice.stories.playWord", { defaultValue: "Play audio" })}
            >
              <Icon name="volume" size={18} aria-hidden />
            </button>
          </div>
          {showRomaji && word.reading && word.reading !== word.surface && (
            <p className="text-sm text-text-muted">{word.reading}</p>
          )}
          <p className="mt-1 text-base text-text-secondary">{word.meaning}</p>
        </div>

        <Button
          variant={alreadyAdded ? "secondary" : "primary"}
          disabled={alreadyAdded}
          onClick={() => {
            addStoryWord(word, langId);
            setAdded(true);
          }}
        >
          <Icon name={alreadyAdded ? "check" : "plus"} size={16} className="mr-1.5" aria-hidden />
          {alreadyAdded
            ? t("practice.stories.wordAdded", { defaultValue: "In your words" })
            : t("practice.stories.addWord", { defaultValue: "Add to my words" })}
        </Button>
      </div>
    </Modal>
  );
}
