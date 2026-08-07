/**
 * The story reader.
 *
 * Words the learner has not learned are highlighted from live SRS state, so the
 * same story reads differently for two learners. Tapping one opens the word
 * sheet, where it can be added to their SRS deck. Audio uses the shared TTS
 * player, which serves a CDN clip when one exists and falls back to in-browser
 * speech synthesis otherwise — so stories are audible today and pick up real
 * narration for free once story text migrates to `lingo-data`.
 *
 * SRS credit requires PASSING the comprehension check. The old surface credited
 * a bare "mark as read" identically to a perfect quiz.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Card, Button, EmptyState } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { playJaAudio, playJaAudioToEnd, stopAllAudio } from "@/shared/tts";
import { allStories } from "@/features/practice/content";
import { getKnownAtomsByPos } from "@/features/practice/engine";
import { getCardState, setCardState, gradeFromLesson } from "@/features/flashcards/engine";
import { getStoryProgress, recordStoryRead, type StoryScore } from "@/shared/storyProgress";
import { markLessonCompleted } from "@/shared/domain/mockProgress";
import { recordPracticeResult } from "@/features/practice/practiceStats";
import { hashSeed, storyExercisedAtomIds } from "@/features/practice/reading/readingBuilders";
import { useDictionaryModal } from "@/features/dictionary/DictionaryModalContext";
import { useShowReadingRomaji } from "@/features/practice/reading/useShowReadingRomaji";
import { useStoryFontSize } from "@/shared/settings/storyFontSize";
import { StoryFontSizeControl } from "./StoryFontSizeControl";
import { resolveStoryWords, type StoryWordInfo } from "./unknownWords";
import { buildQuestions } from "./storyQuestions";
import { StoryWordSheet } from "./StoryWordSheet";
import { StoryQuiz } from "./StoryQuiz";
import { groupStoryBlocks, storyCastNames } from "./storyBlocks";
import { SpeakerChips, hasCast } from "./SpeakerCast";
import { StoryProse } from "./StoryProse";

/** Content parts of speech the comprehension questions may swap. */
const CLOZE_POS = ["noun", "verb", "adjective", "adverb"] as const;

type Phase = "read" | "quiz" | "done";

/** Only cards that already carry state advance — "only review cards count". */
function creditSrs(atomIds: string[]): void {
  for (const id of atomIds) {
    const state = getCardState(id);
    if (!state) continue;
    setCardState(id, gradeFromLesson(state, "recognition", { correct: true, retried: false }));
  }
}

interface StoryReaderPageProps {
  /**
   * The story to read. Resolved from the route by `ReadingRoute`, not read
   * from `useParams` here — one route serves stories AND conversations, so the
   * id has to be matched against the content before a reader is chosen.
   */
  storyId: string;
}

export function StoryReaderPage({ storyId }: StoryReaderPageProps) {
  const { t } = useTranslation();
  // Present only when the learner arrived from a Learn pathway story node —
  // the id of that node, which `finish` marks complete. A library re-read has
  // no `node` and so never touches course progress.
  const [searchParams] = useSearchParams();
  const originNode = searchParams.get("node");
  const langId = useLang();
  const langPath = useLangPath();
  const showRomaji = useShowReadingRomaji(langId);
  const { scale: fontScale } = useStoryFontSize();
  const { openWord } = useDictionaryModal();

  const story = useMemo(
    () => allStories(langId).find((s) => s.id === storyId) ?? null,
    [langId, storyId],
  );

  // Live SRS reads — deliberately keyed on the story + language only, so two
  // learners (or the same learner after adding words) get different highlights.
  const words = useMemo(
    () => (story ? resolveStoryWords(story, langId) : new Map<string, StoryWordInfo>()),
    [story, langId],
  );
  const surfaces = useMemo(() => [...words.keys()], [words]);
  const highlight = useMemo(() => new Set(surfaces), [surfaces]);

  // Narration paragraphs + inset dialogue runs. Purely a layout grouping —
  // sentence indices are preserved so audio, highlight and SRS still key on
  // the story's own ordering.
  const blocks = useMemo(() => groupStoryBlocks(story?.sentences ?? []), [story]);

  // The cast rides in the header beside the story info rather than as a strip
  // above the prose — same names, same order, so the chips and the transcript
  // stay colour-consistent (`storyCastNames` is the single derivation).
  const cast = useMemo(
    () => storyCastNames(blocks).map((name) => ({ key: name, label: name })),
    [blocks],
  );

  const knownContent = useMemo(() => getKnownAtomsByPos(langId, [...CLOZE_POS]), [langId]);
  const questions = useMemo(
    () => (story ? buildQuestions(story, knownContent, hashSeed(story.id)) : []),
    [story, knownContent],
  );

  const [phase, setPhase] = useState<Phase>("read");
  const [score, setScore] = useState<StoryScore | null>(null);
  // Whole-paragraph English under each target paragraph. The per-sentence
  // translation is always available from the sentence popover, so this is the
  // "read it straight through in English" mode, not the only way to see it.
  const [showEnglish, setShowEnglish] = useState(false);
  const [activeWord, setActiveWord] = useState<StoryWordInfo | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  // A ref, not state: the play loop reads it between lines to know whether a
  // second press asked it to stop.
  const playing = useRef(false);

  /**
   * A tapped word must ALWAYS answer. The story word map is deliberately narrow
   * — authored glosses plus multi-character course atoms the learner hasn't
   * learned — but `TappableText` makes every dictionary surface tappable, so
   * plenty of real words fall outside it. Those used to open nothing at all:
   * single-character Korean words in particular (열, 눈, 약, 배, 차, 안, 분) are
   * kept out of the map on purpose, because putting them in would highlight
   * every particle-length word as noise. Falling through to the dictionary
   * answers them — and every other surface the map happens not to carry.
   *
   * The dictionary is also the BETTER answer for a homograph: the course atom
   * for 열 is "ten", so the map would confidently assert the wrong meaning in
   * `열이 나요` ("has a fever"), where the dictionary offers both senses.
   */
  const handleWordTap = useCallback(
    (surface: string) => {
      const info = words.get(surface);
      if (info) {
        setActiveWord(info);
        return;
      }
      openWord(surface);
    },
    [words, openWord],
  );

  const finish = useCallback(
    (result?: StoryScore) => {
      if (!story) return;
      // Read BEFORE recordStoryRead bumps the counter — otherwise every finish
      // looks like a re-read.
      const before = getStoryProgress(story.id);
      recordStoryRead(story.id, result);
      recordPracticeResult("reading", story.id, result ? result.correct === result.total : true);
      // Credit only on a clean run — a bare "mark as read" is not comprehension.
      if (result && result.correct === result.total) {
        creditSrs(storyExercisedAtomIds(story, knownContent));
      }
      // Close the loop back to the path. A story node the learner can never
      // complete would block its whole module (`getModuleStatus` counts every
      // non-review row), so this is not optional bookkeeping.
      if (originNode) {
        markLessonCompleted(originNode, {
          accuracy: result ? result.correct / Math.max(1, result.total) : 1,
          xpEarned: 0,
          isReview: (before?.reads ?? 0) > 0,
        });
      }
    },
    [story, knownContent, originNode],
  );

  /**
   * Halt a run-through immediately: break the loop between lines AND cut the
   * line already sounding. The old toggle only did the former, so pressing
   * "stop" mid-sentence still let that sentence finish.
   */
  const stopReadThrough = useCallback(() => {
    playing.current = false;
    setPlayingIndex(null);
    stopAllAudio();
  }, []);

  const startReadThrough = useCallback(async () => {
    if (!story || playing.current) return;
    playing.current = true;
    for (let i = 0; i < story.sentences.length; i++) {
      if (!playing.current) break;
      setPlayingIndex(i);
      await playJaAudioToEnd(story.sentences[i].text, langId);
    }
    // A stop (or an unmount) already cleared the highlight and owns the ref —
    // don't stomp a run the learner may have restarted in the meantime.
    if (!playing.current) return;
    playing.current = false;
    setPlayingIndex(null);
  }, [story, langId]);

  const toggleReadThrough = useCallback(() => {
    if (playing.current) {
      stopReadThrough();
      return;
    }
    void startReadThrough();
  }, [startReadThrough, stopReadThrough]);

  // Leaving the reader silences it. The app shell also stops audio on every
  // route change, but the loop is this component's own — nothing outside it
  // can break it, and a detached loop would keep starting fresh clips.
  useEffect(
    () => () => {
      playing.current = false;
      stopAllAudio();
    },
    [],
  );

  const backLink = (
    <Link
      to={langPath("practice/stories")}
      className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition hover:text-text-primary"
    >
      <Icon name="arrowLeft" size={16} aria-hidden />
      {t("practice.stories.backToLibrary", { defaultValue: "All stories" })}
    </Link>
  );

  if (!story) {
    return (
      <EmptyState
        icon={<Icon name="bookOpen" size={28} aria-hidden />}
        title={t("practice.stories.notFound", { defaultValue: "We couldn't find that story." })}
        action={
          <Link
            to={langPath("practice/stories")}
            className={composeButtonClasses({ variant: "primary" })}
          >
            {t("practice.stories.backToLibrary", { defaultValue: "All stories" })}
          </Link>
        }
      />
    );
  }

  const wordSheet = (
    <StoryWordSheet word={activeWord} langId={langId} onClose={() => setActiveWord(null)} />
  );

  if (phase === "done") {
    return (
      <div className="space-y-4">
        {backLink}
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="checkCircle" size={28} aria-hidden />
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {t("practice.stories.quiz.doneTitle", { defaultValue: "Nice reading" })}
          </p>
          {score && (
            <p className="mt-1 text-sm text-text-secondary">
              {t("practice.stories.quiz.score", {
                defaultValue: "You got {{correct}} of {{total}} right.",
                correct: score.correct,
                total: score.total,
              })}
            </p>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => setPhase("read")}>
              {t("practice.stories.quiz.reread", { defaultValue: "Read again" })}
            </Button>
            <Link
              to={langPath("practice/stories")}
              className={composeButtonClasses({ variant: "primary" })}
            >
              {t("practice.stories.backToLibrary", { defaultValue: "All stories" })}
            </Link>
          </div>
        </Card>
        {wordSheet}
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="space-y-4">
        {backLink}
        <StoryQuiz
          title={story.title}
          questions={questions}
          langId={langId}
          onReadAgain={() => setPhase("read")}
          onComplete={(result) => {
            finish(result);
            setScore(result);
            setPhase("done");
          }}
        />
        {wordSheet}
      </div>
    );
  }

  const isReading = playingIndex !== null;

  return (
    // Bottom padding clears the floating read-aloud pill, so the last
    // paragraph and the finish button are never parked underneath it.
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between gap-3">
        {backLink}
        <div className="flex items-center gap-1">
          <StoryFontSizeControl />
          <button
            type="button"
            onClick={() => setShowEnglish((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-text-secondary transition hover:text-text-primary"
          >
            <Icon name="eye" size={14} aria-hidden />
            {showEnglish
              ? t("practice.stories.hideEnglish", { defaultValue: "Hide English" })
              : t("practice.stories.showEnglish", { defaultValue: "Show English" })}
          </button>
        </div>
      </div>

      {/* Two short cards side by side: what this is, and who is in it. The
          cast used to be a full-width strip above the prose, which pushed the
          first line of the story down the page on every dialogue story. */}
      <div className={hasCast(cast) ? "grid gap-3 sm:grid-cols-2" : ""}>
        <Card padding="md" data-story-header-card="info" className="space-y-1">
          <h1 className="text-lg font-semibold text-text-primary">{story.title}</h1>
          <p className="text-sm text-text-secondary">{story.theme}</p>
          {/* LINES, not words. Nothing in the app tokenizes JA/KO into words
              reliably — the dictionary scan behind `TappableText` only spans
              surfaces it knows, so counting its hits would undercount every
              conjugation and particle and call the result a word count. The
              library card already measures length in lines; the reader agrees
              with it rather than inventing a second, wrong figure. */}
          <p className="flex items-center gap-1.5 pt-1 text-xs tabular-nums text-text-muted">
            <Icon name="list" size={13} aria-hidden />
            {t("practice.stories.sentenceCount", {
              defaultValue: "{{count}} lines",
              count: story.sentences.length,
            })}
          </p>
        </Card>

        {/* No dialogue (or a single speaker, where colour distinguishes
            nothing) collapses to the info card alone — an empty box beside it
            would be worse than no card. */}
        {hasCast(cast) ? (
          <Card padding="md" data-story-header-card="cast">
            <SpeakerChips members={cast} lang={langId} />
          </Card>
        ) : null}
      </div>

      <Card padding="lg">
        <StoryProse
          blocks={blocks}
          langId={langId}
          surfaces={surfaces}
          highlight={highlight}
          onWordTap={handleWordTap}
          showRomaji={showRomaji}
          showTranslations={showEnglish}
          playingIndex={playingIndex}
          // One sentence on demand ends the run-through rather than fighting
          // it for the single audio channel.
          onPlaySentence={(i) => {
            stopReadThrough();
            void playJaAudio(story.sentences[i].text, langId);
          }}
          fontScale={fontScale}
        />
      </Card>

      <div className="flex justify-end">
        {questions.length > 0 ? (
          <Button
            variant="primary"
            onClick={() => {
              stopReadThrough();
              setPhase("quiz");
            }}
          >
            {t("practice.stories.check", { defaultValue: "Check understanding" })}
            <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              stopReadThrough();
              finish();
              setPhase("done");
            }}
          >
            <Icon name="check" size={16} className="mr-1.5" aria-hidden />
            {t("practice.stories.markRead", { defaultValue: "Mark as read" })}
          </Button>
        )}
      </div>

      {/* The one persistent audio control. A 30-sentence story scrolls the
          header out of reach, and the run-through had no visible stop once
          it was under way — the toggle only ever lived up there. */}
      <button
        type="button"
        onClick={toggleReadThrough}
        aria-pressed={isReading}
        className="fixed bottom-safe-4 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-text-primary shadow-popover transition hover:bg-surface-muted"
      >
        <Icon name={isReading ? "stop" : "play"} size={16} aria-hidden />
        {isReading
          ? t("practice.stories.stopReading", { defaultValue: "Stop reading" })
          : t("practice.stories.readAloud", { defaultValue: "Read aloud" })}
      </button>

      {wordSheet}
    </div>
  );
}
