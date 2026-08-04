/**
 * The story body — prose paragraphs with inset dialogue.
 *
 * Narration flows: consecutive narration sentences run together inside one
 * `<p>` instead of stacking as one row each (an authored `break` opens a new
 * paragraph mid-run). Speech breaks out: a run of lines by the same character
 * becomes an indented block carrying that character's name once, styled with
 * the same treatment the lesson player's dialogue transcript uses
 * (`DialogueListenStepView`) so a spoken line looks the same wherever the
 * learner meets it.
 *
 * ONE layout, always prose. The English never restructures the page:
 *
 *  - **Per sentence** — hovering (desktop), focusing (keyboard) or tapping
 *    (touch) a sentence opens a popover anchored to it carrying that
 *    sentence's play control, its reading aid and its translation. One gesture
 *    covers both audio and meaning, so no sentence needs a permanently visible
 *    volume button cluttering the prose.
 *  - **Whole paragraph** — `showTranslations` puts the block's sentence
 *    translations, JOINED into flowing prose, underneath the target paragraph.
 *    For reading straight through. It adds a paragraph; it never splits one.
 *
 * The earlier "expanded" layout (one row per sentence once English was on)
 * is gone: it undid the paragraphing the prose blocks exist to provide.
 */
import { useCallback, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import type { StorySentence } from "@/features/practice/content";
import { SpeakerCast } from "./SpeakerCast";
import { buildSpeakerColors } from "./speakerColor";
import type { StoryBlock, StoryBlockItem } from "./storyBlocks";

/** Base sizes the story scale multiplies, in rem (Tailwind `text-xl`/`text-sm`). */
const BASE_TEXT_REM = 1.25;
const BASE_READING_REM = 0.8;

interface StoryProseProps {
  blocks: StoryBlock[];
  langId: string;
  /** Gloss surfaces the dictionary doesn't carry, widened into tappability. */
  surfaces: string[];
  /** Surfaces drawn as "you haven't learned this yet". */
  highlight: Set<string>;
  onWordTap: (surface: string) => void;
  showRomaji: boolean;
  /** Paragraph-level English under each target paragraph. */
  showTranslations: boolean;
  /** Index of the sentence the "play all" loop is currently speaking. */
  playingIndex: number | null;
  onPlaySentence: (index: number) => void;
  /** Story text scale (see `shared/settings/storyFontSize`). 1 = default. */
  fontScale: number;
}

export function StoryProse({
  blocks,
  langId,
  surfaces,
  highlight,
  onWordTap,
  showRomaji,
  showTranslations,
  playingIndex,
  onPlaySentence,
  fontScale,
}: StoryProseProps) {
  const { t } = useTranslation();
  // The sentence whose popover is open — hover on desktop, tap on touch, focus
  // for keyboard. At most one at a time, so the page never grows two popovers.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // A story has no `speakers[]` — the cast IS the distinct `speaker` names on
  // its speech blocks, in order of first appearance. Same ordering rule as a
  // conversation's declared speaker list, so the two surfaces colour alike.
  const castNames = useMemo(() => {
    const seen: string[] = [];
    for (const b of blocks) {
      if (b.kind === "speech" && !seen.includes(b.speaker)) seen.push(b.speaker);
    }
    return seen;
  }, [blocks]);
  const colorByName = useMemo(() => buildSpeakerColors(castNames), [castNames]);

  // Only the story's own type scales. Everything else on the page — the
  // popover, the English paragraph, the speaker chips — keeps its rem sizes,
  // which are root-relative and so are untouched by these inline overrides.
  // `+toFixed` rounds off float noise (1.25 * 1.15) without leaving trailing
  // zeros, so the emitted value matches what CSSOM would normalize it to.
  const rem = (base: number) => `${+(base * fontScale).toFixed(3)}rem`;
  const textStyle: CSSProperties = { fontSize: rem(BASE_TEXT_REM) };
  const readingStyle: CSSProperties = { fontSize: rem(BASE_READING_REM) };

  /**
   * Sentence-level click. Words are their OWN buttons inside this span
   * (`TappableText`), and the popover carries one too, so a click that lands on
   * any button has already been handled — playing the sentence as well would
   * fire two actions from one gesture (open the word sheet AND speak the line).
   * Hit-testing the event target settles it explicitly; nothing here depends on
   * which handler React happens to run first.
   */
  const handleSentenceClick = useCallback(
    (event: MouseEvent<HTMLElement>, index: number) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("button")) return;
      setActiveIndex(index);
      onPlaySentence(index);
    },
    [onPlaySentence],
  );

  /** One sentence, always inline — it is a run of prose, not a row. */
  const renderSentence = ({ sentence, index }: StoryBlockItem) => {
    const playing = playingIndex === index;
    const active = activeIndex === index;
    return (
      <span
        key={index}
        data-story-sentence={index}
        // `relative` so the popover can anchor to the sentence itself. On a
        // wrapped sentence that anchors to its FIRST line box, i.e. where the
        // sentence starts, which is where the eye already is.
        className={`relative inline cursor-pointer rounded transition-colors ${
          playing ? "bg-accent/10" : active ? "bg-accent/5" : ""
        }`}
        onMouseEnter={() => setActiveIndex(index)}
        onMouseLeave={() => setActiveIndex((cur) => (cur === index ? null : cur))}
        // Focus bubbles in React, so tabbing onto any word in the sentence
        // opens its popover — the play control stays keyboard-reachable now
        // that it is no longer permanently rendered.
        onFocus={() => setActiveIndex(index)}
        onClick={(e) => handleSentenceClick(e, index)}
      >
        <TappableText
          text={sentence.text}
          lang={langId}
          extraSurfaces={surfaces}
          highlightSurfaces={highlight}
          onWordTap={onWordTap}
          className="text-text-primary"
        />
        {active ? (
          <SentencePopover
            sentence={sentence}
            langId={langId}
            showRomaji={showRomaji}
            playLabel={t("practice.stories.playSentence", {
              defaultValue: "Play this sentence aloud",
            })}
            onPlay={() => onPlaySentence(index)}
          />
        ) : null}
        {/* A space, so two inline sentences don't butt up against each other. */}{" "}
      </span>
    );
  };

  /** The reading aid for a whole block, kept parallel to the flowing prose. */
  const renderBlockReading = (items: StoryBlockItem[]) => {
    if (!showRomaji) return null;
    const reading = items
      .map((i) => i.sentence.reading)
      .filter(Boolean)
      .join(" ");
    if (!reading) return null;
    return (
      <p className="mt-1 leading-relaxed text-text-muted" style={readingStyle}>
        {reading}
      </p>
    );
  };

  /**
   * The block's English as a PARAGRAPH — its sentence translations joined into
   * running prose. Deliberately not one line per sentence: the point of the
   * toggle is reading the passage straight through in English, and a stack of
   * short rows reads like a glossary, not a story.
   */
  const renderBlockTranslation = (items: StoryBlockItem[]) => {
    if (!showTranslations) return null;
    const english = items
      .map((i) => i.sentence.translation)
      .filter(Boolean)
      .join(" ");
    if (!english) return null;
    return <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{english}</p>;
  };

  return (
    <div className="space-y-3">
      <SpeakerCast
        members={castNames.map((name) => ({ key: name, label: name }))}
        lang={langId}
      />
      {blocks.map((block, bi) => {
        const readingLine = renderBlockReading(block.items);
        const englishLine = renderBlockTranslation(block.items);

        if (block.kind === "narration") {
          return (
            <div key={bi}>
              <p className="leading-relaxed text-text-primary" style={textStyle}>
                {block.items.map(renderSentence)}
              </p>
              {readingLine}
              {englishLine}
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
              // Speaker and line sit on ONE row — icon, name, then the text to
              // its right. Stacking the name above the text made every exchange
              // twice as tall as the prose around it, which read as a wall of
              // boxes rather than dialogue. Same shape as ConversationTranscript.
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition ${
                active ? "border-accent bg-accent-muted shadow-sm" : "border-border/60 bg-surface"
              }`}
            >
              {/* The speaker's colour is what distinguishes two characters in
                  a scene; it holds whether or not the block is being spoken,
                  so the active treatment is carried by the box, not the name. */}
              <span
                className={`flex shrink-0 items-center gap-1 pt-1 text-xs font-bold uppercase tracking-wider ${
                  colorByName.get(block.speaker)?.text ?? "text-text-muted"
                }`}
              >
                <Icon name="user" size={13} aria-hidden />
                <span lang={langId}>{block.speaker}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="leading-relaxed text-text-primary" style={textStyle}>
                  {block.items.map(renderSentence)}
                </p>
                {readingLine}
                {englishLine}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The per-sentence popover: play, reading aid, translation. Phrasing content
 * only (`<span>`/`<button>`) because it lives inside the `<p>` of prose.
 *
 * Anchored to the sentence rather than portalled — it has to track the text as
 * the paragraph reflows, and it carries no interaction that could be clipped
 * meaningfully by the card around it.
 */
/**
 * The target language in its OWN script, shown on the play control. The
 * popover puts the play button next to the English translation, so a bare
 * speaker icon reads as though it might play the English — naming the language
 * is what removes the doubt.
 */
const NATIVE_LANG_NAME: Record<string, string> = {
  ja: "日本語",
  ko: "한국어",
  es: "Español",
};

function SentencePopover({
  sentence,
  langId,
  showRomaji,
  playLabel,
  onPlay,
}: {
  sentence: StorySentence;
  langId: string;
  showRomaji: boolean;
  playLabel: string;
  onPlay: () => void;
}) {
  return (
    <span
      className="absolute left-0 top-full z-20 mt-1 flex w-max max-w-[min(22rem,70vw)] items-start gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left shadow-lg"
      // The sentence span's own click handler already skips button targets;
      // stopping here too keeps a click on the popover's padding from
      // re-triggering playback behind it.
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={playLabel}
        className="mt-0.5 flex shrink-0 items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 text-accent transition hover:bg-surface-muted"
      >
        <Icon name="volume" size={13} aria-hidden />
        <span className="text-[11px] font-semibold leading-none" lang={langId}>
          {NATIVE_LANG_NAME[langId] ?? langId.toUpperCase()}
        </span>
      </button>
      <span className="min-w-0">
        {showRomaji && sentence.reading ? (
          <span className="block text-xs leading-snug text-text-muted">{sentence.reading}</span>
        ) : null}
        <span className="block text-sm leading-snug text-text-secondary">
          {sentence.translation}
        </span>
      </span>
    </span>
  );
}
