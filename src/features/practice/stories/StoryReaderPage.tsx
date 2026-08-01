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
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Card, Button, EmptyState } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { playJaAudio, playJaAudioToEnd } from "@/shared/tts";
import { allStories } from "@/features/practice/content";
import { getKnownAtomsByPos } from "@/features/practice/engine";
import { getCardState, setCardState, gradeFromLesson } from "@/features/flashcards/engine";
import { getStoryProgress, recordStoryRead, type StoryScore } from "@/shared/storyProgress";
import { markLessonCompleted } from "@/shared/domain/mockProgress";
import { recordPracticeResult } from "@/features/practice/practiceStats";
import { hashSeed, storyExercisedAtomIds } from "@/features/practice/reading/readingBuilders";
import { useShowReadingRomaji } from "@/features/practice/reading/useShowReadingRomaji";
import { resolveStoryWords, type StoryWordInfo } from "./unknownWords";
import { buildQuestions } from "./storyQuestions";
import { StoryWordSheet } from "./StoryWordSheet";
import { StoryQuiz } from "./StoryQuiz";

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

export function StoryReaderPage() {
  const { t } = useTranslation();
  const { storyId } = useParams<{ storyId: string }>();
  // Present only when the learner arrived from a Learn pathway story node —
  // the id of that node, which `finish` marks complete. A library re-read has
  // no `node` and so never touches course progress.
  const [searchParams] = useSearchParams();
  const originNode = searchParams.get("node");
  const langId = useLang();
  const langPath = useLangPath();
  const showRomaji = useShowReadingRomaji(langId);

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

  const knownContent = useMemo(() => getKnownAtomsByPos(langId, [...CLOZE_POS]), [langId]);
  const questions = useMemo(
    () => (story ? buildQuestions(story, knownContent, hashSeed(story.id)) : []),
    [story, knownContent],
  );

  const [phase, setPhase] = useState<Phase>("read");
  const [score, setScore] = useState<StoryScore | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [activeWord, setActiveWord] = useState<StoryWordInfo | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  // A ref, not state: the play loop reads it between lines to know whether a
  // second press asked it to stop.
  const playing = useRef(false);

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

  const playAll = useCallback(async () => {
    if (!story) return;
    if (playing.current) {
      playing.current = false;
      setPlayingIndex(null);
      return;
    }
    playing.current = true;
    for (let i = 0; i < story.sentences.length; i++) {
      if (!playing.current) break;
      setPlayingIndex(i);
      await playJaAudioToEnd(story.sentences[i].text, langId);
    }
    playing.current = false;
    setPlayingIndex(null);
  }, [story, langId]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {backLink}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void playAll()}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-text-secondary transition hover:text-text-primary"
          >
            <Icon name={playingIndex === null ? "play" : "pause"} size={14} aria-hidden />
            {playingIndex === null
              ? t("practice.stories.playAll", { defaultValue: "Play all" })
              : t("practice.stories.stop", { defaultValue: "Stop" })}
          </button>
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

      <Card padding="lg" className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{story.title}</h1>
          <p className="text-sm text-text-secondary">{story.theme}</p>
        </div>

        <div className="space-y-3">
          {story.sentences.map((sentence, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-md px-1 py-0.5 transition ${
                playingIndex === i ? "bg-accent/10" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => void playJaAudio(sentence.text, langId)}
                className="mt-1.5 shrink-0 rounded-md p-1 text-text-muted transition hover:text-text-primary"
                aria-label={t("practice.stories.playWord", { defaultValue: "Play audio" })}
              >
                <Icon name="volume" size={16} aria-hidden />
              </button>
              <div className="min-w-0 flex-1 space-y-0.5">
                <TappableText
                  text={sentence.text}
                  lang={langId}
                  extraSurfaces={surfaces}
                  highlightSurfaces={highlight}
                  onWordTap={(surface) => setActiveWord(words.get(surface) ?? null)}
                  className="text-xl leading-relaxed text-text-primary"
                />
                {showRomaji && sentence.reading && (
                  <p className="text-xs text-text-muted">{sentence.reading}</p>
                )}
                {showEnglish && (
                  <p className="text-sm text-text-secondary">{sentence.translation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        {questions.length > 0 ? (
          <Button variant="primary" onClick={() => setPhase("quiz")}>
            {t("practice.stories.check", { defaultValue: "Check understanding" })}
            <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              finish();
              setPhase("done");
            }}
          >
            <Icon name="check" size={16} className="mr-1.5" aria-hidden />
            {t("practice.stories.markRead", { defaultValue: "Mark as read" })}
          </Button>
        )}
      </div>

      {wordSheet}
    </div>
  );
}
