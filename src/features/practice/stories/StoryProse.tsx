/**
 * The story body — prose paragraphs with inset dialogue.
 *
 * Narration flows: consecutive narration sentences run together inside one
 * `<p>` instead of stacking as one row each. Speech breaks out: a run of lines
 * by the same character becomes an indented block carrying that character's
 * name once, styled with the same treatment the lesson player's dialogue
 * transcript uses (`DialogueListenStepView`) so a spoken line looks the same
 * wherever the learner meets it.
 *
 * TWO LAYOUTS, one markup path. With English hidden the sentences are inline
 * and the page reads as prose. With English shown each sentence becomes its
 * own line so its translation (and reading aid) sits directly under it —
 * per-sentence alignment is the whole point of asking for the English, and it
 * is not expressible in a flowing paragraph. The romaji aid follows the same
 * rule: per sentence in the expanded layout, and one muted line per block in
 * the flowing one, where it stays parallel to the prose above it.
 */
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import type { StoryBlock, StoryBlockItem } from "./storyBlocks";

interface StoryProseProps {
  blocks: StoryBlock[];
  langId: string;
  /** Gloss surfaces the dictionary doesn't carry, widened into tappability. */
  surfaces: string[];
  /** Surfaces drawn as "you haven't learned this yet". */
  highlight: Set<string>;
  onWordTap: (surface: string) => void;
  showRomaji: boolean;
  showEnglish: boolean;
  /** Index of the sentence the "play all" loop is currently speaking. */
  playingIndex: number | null;
  onPlaySentence: (index: number) => void;
}

export function StoryProse({
  blocks,
  langId,
  surfaces,
  highlight,
  onWordTap,
  showRomaji,
  showEnglish,
  playingIndex,
  onPlaySentence,
}: StoryProseProps) {
  const { t } = useTranslation();

  /** One sentence — inline in prose, its own line once English is shown. */
  const renderSentence = ({ sentence, index }: StoryBlockItem) => {
    const playing = playingIndex === index;
    return (
      <span
        key={index}
        className={`${showEnglish ? "block space-y-0.5 py-0.5" : "inline"} ${
          playing ? "rounded bg-accent/10" : ""
        }`}
      >
        <TappableText
          text={sentence.text}
          lang={langId}
          extraSurfaces={surfaces}
          highlightSurfaces={highlight}
          onWordTap={onWordTap}
          className="text-text-primary"
        />
        <button
          type="button"
          onClick={() => onPlaySentence(index)}
          className="ml-1 inline-flex translate-y-px items-center rounded p-0.5 align-baseline text-text-muted transition hover:text-text-primary"
          aria-label={t("practice.stories.playWord", { defaultValue: "Play audio" })}
        >
          <Icon name="volume" size={14} aria-hidden />
        </button>
        {showEnglish && showRomaji && sentence.reading && (
          <span className="block text-xs text-text-muted">{sentence.reading}</span>
        )}
        {showEnglish && (
          <span className="block text-sm text-text-secondary">{sentence.translation}</span>
        )}
        {/* A space, so two inline sentences don't butt up against each other.
            Harmless in the expanded layout where the span is a block. */}
        {!showEnglish && " "}
      </span>
    );
  };

  /** The reading aid for a whole block, kept parallel to the flowing prose. */
  const renderBlockReading = (items: StoryBlockItem[]) => {
    if (showEnglish || !showRomaji) return null;
    const reading = items
      .map((i) => i.sentence.reading)
      .filter(Boolean)
      .join(" ");
    if (!reading) return null;
    return <p className="mt-1 text-xs leading-relaxed text-text-muted">{reading}</p>;
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, bi) => {
        const readingLine = renderBlockReading(block.items);

        if (block.kind === "narration") {
          return (
            <div key={bi}>
              <p className="text-xl leading-relaxed text-text-primary">
                {block.items.map(renderSentence)}
              </p>
              {readingLine}
            </div>
          );
        }

        // A speech run is inset and boxed — the lesson player's transcript
        // treatment, so dialogue reads the same across the two surfaces. The
        // block lights up while any of its lines is being spoken.
        const active = block.items.some((i) => i.index === playingIndex);
        return (
          <div key={bi} className="ml-4 sm:ml-8">
            <div
              // `min-h` keeps a one-line exchange from collapsing into a cramped
              // sliver beside the flowing paragraphs around it — speech blocks
              // should read as a beat, not a footnote.
              className={`flex min-h-[5rem] w-full flex-col justify-center rounded-xl border px-4 py-3 transition ${
                active ? "border-accent bg-accent-muted shadow-sm" : "border-border/60 bg-surface"
              }`}
            >
              <p
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                <Icon name="user" size={13} aria-hidden />
                <span lang={langId}>{block.speaker}</span>
              </p>
              <p className="mt-1 text-xl leading-relaxed text-text-primary">
                {block.items.map(renderSentence)}
              </p>
              {readingLine}
            </div>
          </div>
        );
      })}
    </div>
  );
}
