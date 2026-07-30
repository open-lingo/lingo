import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, EmptyState, SegmentedControl } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import { TappableText } from "@/features/dictionary/TappableText";
import { getStories, getConversations, type Story } from "@/features/practice/content";
import { getKnownAtomsByPos } from "@/features/practice/engine";
import { getCardState, setCardState, gradeFromLesson } from "@/features/flashcards/engine";
import { useCourseLevel } from "./useCourseLevel";
import {
  CLOZE_POS,
  buildClozeCards,
  buildStoryQuestions,
  collectSentences,
  storyExercisedAtomIds,
  type ClozeCard,
  type StoryQuestion,
} from "./reading/readingBuilders";

/** Cloze cards per session — a short, unhurried read. */
const CLOZE_SESSION = 8;

type Mode = "stories" | "cloze";

/**
 * Reading practice — built on CURATED, authored content (never the random
 * sentence generator). Two calm beats the learner can switch between:
 *
 *  - **Stories** — read a module-appropriate authored narrative with inline
 *    dictionary lookup (tap any word), then answer a couple of comprehension
 *    questions whose distractors are drawn from other authored content.
 *  - **Fill the blank** — a cloze over an authored sentence (the base is
 *    hand-written, so it is never nonsense); pick the missing content word from
 *    same-part-of-speech words you already know.
 *
 * Correct answers lightly credit the `recognition` modality of the atoms the
 * read exercised — conservative reinforcement that only touches cards which
 * already have SRS state ("only review cards count").
 */
export function ReadingPracticePage() {
  const { t } = useTranslation();
  const langId = useLang();
  const reachedModule = useCourseLevel();

  const stories = useMemo(
    () => getStories(langId, reachedModule),
    [langId, reachedModule],
  );
  const conversations = useMemo(
    () => getConversations(langId, reachedModule),
    [langId, reachedModule],
  );
  const knownContent = useMemo(
    () => getKnownAtomsByPos(langId, [...CLOZE_POS]),
    [langId],
  );

  const sentences = useMemo(
    () => collectSentences(stories, conversations),
    [stories, conversations],
  );

  const hasStories = stories.length > 0;
  const clozeProbe = useMemo(
    () => buildClozeCards(sentences, knownContent, 1, 1),
    [sentences, knownContent],
  );
  const hasCloze = clozeProbe.length > 0;

  const [mode, setMode] = useState<Mode>(() => (hasStories ? "stories" : "cloze"));
  const effectiveMode: Mode = mode === "stories" && !hasStories ? "cloze" : mode;

  const header = (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.reading.title", { defaultValue: "Reading" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.reading.subtitle", {
            defaultValue: "Read what you can handle — tap any word you don't know.",
          })}
        </p>
      </div>
      {hasStories && hasCloze && (
        <SegmentedControl<Mode>
          value={effectiveMode}
          onChange={setMode}
          ariaLabel={t("practice.reading.modeAria", { defaultValue: "Reading mode" })}
          options={[
            {
              value: "stories",
              label: t("practice.reading.mode.stories", { defaultValue: "Stories" }),
              leading: <Icon name="bookOpen" size={15} aria-hidden />,
            },
            {
              value: "cloze",
              label: t("practice.reading.mode.cloze", { defaultValue: "Fill the blank" }),
              leading: <Icon name="layers" size={15} aria-hidden />,
            },
          ]}
        />
      )}
    </div>
  );

  // Nothing available at the learner's level yet.
  if (!hasStories && !hasCloze) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="bookOpen" size={28} aria-hidden />}
          title={t("practice.reading.empty.title", { defaultValue: "Nothing to read just yet" })}
          description={t("practice.reading.empty.description", {
            defaultValue:
              "Keep going in your lessons — as you learn more words, short stories and reading exercises you can actually read will unlock here.",
          })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      {effectiveMode === "stories" ? (
        <StoriesBeat
          stories={stories}
          conversations={conversations}
          knownContent={knownContent}
        />
      ) : (
        <ClozeBeat sentences={sentences} knownContent={knownContent} langId={langId} />
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Conservative recognition SRS credit — only cards that already have state
 * advance (respects "only review cards count").
 * ------------------------------------------------------------------------ */
function creditSrs(atomIds: string[]): void {
  for (const id of atomIds) {
    const state = getCardState(id);
    if (!state) continue;
    setCardState(id, gradeFromLesson(state, "recognition", { correct: true, retried: false }));
  }
}

/* ==========================================================================
 * Stories beat
 * ======================================================================== */

interface StoriesBeatProps {
  stories: Story[];
  conversations: ReturnType<typeof getConversations>;
  knownContent: ReturnType<typeof getKnownAtomsByPos>;
}

function StoriesBeat({ stories, conversations, knownContent }: StoriesBeatProps) {
  const { t } = useTranslation();
  const langId = useLang();

  const [storyIdx, setStoryIdx] = useState(0);
  const [phase, setPhase] = useState<"read" | "quiz">("read");
  const [showEnglish, setShowEnglish] = useState(false);

  const story = stories[storyIdx];

  const questions = useMemo(
    () => (story ? buildStoryQuestions(story, stories, conversations, storyIdx + 1) : []),
    [story, stories, conversations, storyIdx],
  );

  const nextStory = useCallback(() => {
    setStoryIdx((i) => (i + 1) % stories.length);
    setPhase("read");
    setShowEnglish(false);
  }, [stories.length]);

  if (!story) return null;

  if (phase === "quiz") {
    return (
      <StoryQuiz
        key={story.id}
        story={story}
        questions={questions}
        knownContent={knownContent}
        onReadAgain={() => setPhase("read")}
        onNextStory={nextStory}
        multipleStories={stories.length > 1}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-medium text-text-muted">
        <span>
          {t("practice.reading.storyProgress", {
            defaultValue: "Story {{n}} of {{total}}",
            n: storyIdx + 1,
            total: stories.length,
          })}
        </span>
        <button
          type="button"
          onClick={() => setShowEnglish((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-text-secondary transition hover:text-text-primary"
        >
          <Icon name="eye" size={14} aria-hidden />
          {showEnglish
            ? t("practice.reading.hideEnglish", { defaultValue: "Hide English" })
            : t("practice.reading.showEnglish", { defaultValue: "Show English" })}
        </button>
      </div>

      <Card padding="lg" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{story.title}</h2>
          <p className="text-sm text-text-secondary">{story.theme}</p>
        </div>

        <div className="space-y-3">
          {story.sentences.map((sentence, i) => (
            <div key={i} className="space-y-0.5">
              <TappableText
                text={sentence.text}
                lang={langId}
                className="text-xl leading-relaxed text-text-primary"
              />
              {sentence.reading && (
                <p className="text-xs text-text-muted">{sentence.reading}</p>
              )}
              {showEnglish && (
                <p className="text-sm text-text-secondary">{sentence.translation}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {stories.length > 1 && (
          <Button variant="ghost" onClick={nextStory}>
            {t("practice.reading.anotherStory", { defaultValue: "Another story" })}
          </Button>
        )}
        {questions.length > 0 ? (
          <Button variant="primary" onClick={() => setPhase("quiz")}>
            {t("practice.reading.check", { defaultValue: "Check understanding" })}
            <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              creditSrs(storyExercisedAtomIds(story, knownContent));
              nextStory();
            }}
          >
            <Icon name="check" size={16} className="mr-1.5" aria-hidden />
            {t("practice.reading.markRead", { defaultValue: "Mark as read" })}
          </Button>
        )}
      </div>
    </div>
  );
}

interface StoryQuizProps {
  story: Story;
  questions: StoryQuestion[];
  knownContent: ReturnType<typeof getKnownAtomsByPos>;
  onReadAgain: () => void;
  onNextStory: () => void;
  multipleStories: boolean;
}

function StoryQuiz({
  story,
  questions,
  knownContent,
  onReadAgain,
  onNextStory,
  multipleStories,
}: StoryQuizProps) {
  const { t } = useTranslation();

  const [picks, setPicks] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const answeredCount = Object.keys(picks).length;
  const allAnswered = answeredCount >= questions.length;
  const correctCount = questions.filter((q) => picks[q.id] === q.answer).length;

  const pick = useCallback(
    (questionId: string, option: string) => {
      setPicks((prev) => (prev[questionId] ? prev : { ...prev, [questionId]: option }));
    },
    [],
  );

  const finish = useCallback(() => {
    setDone(true);
    // Reward comprehension: credit the story's atoms once when the learner got
    // it all right (conservative — only cards with existing SRS state advance).
    if (correctCount === questions.length) {
      creditSrs(storyExercisedAtomIds(story, knownContent));
    }
  }, [correctCount, questions.length, story, knownContent]);

  if (done) {
    return (
      <Card padding="lg" className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Icon name="checkCircle" size={28} aria-hidden />
        </div>
        <p className="text-lg font-semibold text-text-primary">
          {t("practice.reading.quiz.doneTitle", { defaultValue: "Nice reading" })}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {t("practice.reading.quiz.score", {
            defaultValue: "You got {{correct}} of {{total}} right.",
            correct: correctCount,
            total: questions.length,
          })}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" onClick={onReadAgain}>
            {t("practice.reading.quiz.reread", { defaultValue: "Read again" })}
          </Button>
          {multipleStories && (
            <Button variant="primary" onClick={onNextStory}>
              {t("practice.reading.anotherStory", { defaultValue: "Another story" })}
              <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">
          {t("practice.reading.quiz.heading", {
            defaultValue: "Did you follow “{{title}}”?",
            title: story.title,
          })}
        </h2>
        <button
          type="button"
          onClick={onReadAgain}
          className="text-xs font-medium text-text-secondary transition hover:text-text-primary"
        >
          {t("practice.reading.quiz.reread", { defaultValue: "Read again" })}
        </button>
      </div>

      {questions.map((q, qi) => {
        const picked = picks[q.id];
        const revealed = picked !== undefined;
        return (
          <Card key={q.id} padding="md" className="space-y-2.5">
            <p className="text-sm font-medium text-text-primary">
              <span className="mr-1.5 text-text-muted">{qi + 1}.</span>
              {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const isPicked = picked === opt;
                const isAnswer = opt === q.answer;
                let cls =
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition";
                if (revealed) {
                  if (isAnswer) cls += " border-success bg-success/10 text-success";
                  else if (isPicked) cls += " border-error bg-error/10 text-error";
                  else cls += " border-border bg-surface text-text-secondary opacity-60";
                } else {
                  cls +=
                    " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(q.id, opt)}
                    disabled={revealed}
                    className={cls}
                  >
                    {revealed && isAnswer && (
                      <Icon name="check" size={16} className="shrink-0" aria-hidden />
                    )}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button variant="primary" disabled={!allAnswered} onClick={finish}>
          {t("practice.reading.quiz.finish", { defaultValue: "See how you did" })}
          <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
 * Cloze beat
 * ======================================================================== */

interface ClozeBeatProps {
  sentences: ReturnType<typeof collectSentences>;
  knownContent: ReturnType<typeof getKnownAtomsByPos>;
  langId: string;
}

function ClozeBeat({ sentences, knownContent, langId }: ClozeBeatProps) {
  const { t } = useTranslation();

  const [seed, setSeed] = useState(() => Date.now());
  const cards = useMemo(
    () => buildClozeCards(sentences, knownContent, seed, CLOZE_SESSION),
    [sentences, knownContent, seed],
  );

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);

  const card = cards[index] as ClozeCard | undefined;
  const revealed = picked !== null;

  const restart = useCallback(() => {
    setSeed(Date.now());
    setIndex(0);
    setPicked(null);
    setScore({ correct: 0, total: 0 });
    setDone(false);
  }, []);

  const advance = useCallback(() => {
    setPicked(null);
    if (index < cards.length - 1) setIndex((i) => i + 1);
    else setDone(true);
  }, [index, cards.length]);

  const handlePick = useCallback(
    (opt: ClozeCard["options"][number]) => {
      if (revealed || !card) return;
      setPicked(opt.surface);
      setScore((s) => ({ correct: s.correct + (opt.isAnswer ? 1 : 0), total: s.total + 1 }));
      if (opt.isAnswer) creditSrs([card.answer.atomId]);
    },
    [revealed, card],
  );

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="layers" size={28} aria-hidden />}
        title={t("practice.reading.cloze.empty.title", { defaultValue: "No fill-the-blanks yet" })}
        description={t("practice.reading.cloze.empty.description", {
          defaultValue: "Learn a few more words and we'll turn your reading into fill-the-blank practice.",
        })}
      />
    );
  }

  if (done) {
    return (
      <Card padding="lg" className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Icon name="checkCircle" size={28} aria-hidden />
        </div>
        <p className="text-lg font-semibold text-text-primary">
          {t("practice.reading.cloze.doneTitle", { defaultValue: "Session complete" })}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {t("practice.reading.cloze.doneScore", {
            defaultValue: "You filled {{correct}} of {{total}} correctly.",
            correct: score.correct,
            total: score.total,
          })}
        </p>
        <Button variant="primary" className="mt-4" onClick={restart}>
          <Icon name="refresh" size={16} className="mr-1.5" aria-hidden />
          {t("practice.reading.cloze.again", { defaultValue: "New set" })}
        </Button>
      </Card>
    );
  }

  if (!card) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-medium text-text-muted">
        <span>
          {t("practice.reading.cloze.progress", {
            defaultValue: "{{n}} of {{total}}",
            n: index + 1,
            total: cards.length,
          })}
        </span>
        <span>
          {t("practice.reading.cloze.scoreLabel", {
            defaultValue: "Score {{correct}}/{{total}}",
            correct: score.correct,
            total: score.total,
          })}
        </span>
      </div>

      <Card padding="lg">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-text-muted">
          {t("practice.reading.cloze.meaning", { defaultValue: "Meaning" })}
          <span className="ml-2 normal-case tracking-normal text-text-secondary">
            {card.translation}
          </span>
        </p>

        {revealed ? (
          <TappableText
            text={card.text}
            lang={langId}
            className="text-2xl leading-relaxed text-text-primary"
          />
        ) : (
          <p className="text-2xl leading-relaxed text-text-primary" lang={langId}>
            {card.before}
            <span
              className="mx-1 inline-block min-w-[3.5rem] border-b-2 border-accent align-baseline"
              aria-hidden
            />
            {card.after}
          </p>
        )}

        {revealed && card.reading && (
          <p className="mt-2 text-sm text-text-muted">{card.reading}</p>
        )}
      </Card>

      <div className="space-y-2">
        {card.options.map((opt, i) => {
          const isPicked = picked === opt.surface;
          let cls =
            "flex w-full items-baseline gap-2 rounded-lg border px-4 py-3 text-left transition";
          if (revealed) {
            if (opt.isAnswer) cls += " border-success bg-success/10 text-success";
            else if (isPicked) cls += " border-error bg-error/10 text-error";
            else cls += " border-border bg-surface text-text-secondary opacity-50";
          } else {
            cls +=
              " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";
          }
          return (
            <button
              key={`${opt.surface}-${i}`}
              type="button"
              onClick={() => handlePick(opt)}
              disabled={revealed}
              className={cls}
              lang={langId}
            >
              <span className="text-lg font-medium">{opt.surface}</span>
              <span className="text-xs text-text-muted">{opt.reading}</span>
            </button>
          );
        })}

        {revealed && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm font-medium">
              {card.options.find((o) => o.surface === picked)?.isAnswer ? (
                <span className="text-success">
                  <Icon name="check" size={16} className="mr-1 inline" aria-hidden />
                  {t("practice.reading.cloze.correct", { defaultValue: "Nice reading." })}
                </span>
              ) : (
                <span className="text-text-secondary">
                  <Icon name="close" size={16} className="mr-1 inline text-error" aria-hidden />
                  {t("practice.reading.cloze.answerWas", {
                    defaultValue: "Answer: {{answer}}",
                    answer: card.answer.surface,
                  })}
                </span>
              )}
            </p>
            <Button variant="primary" onClick={advance}>
              {index < cards.length - 1
                ? t("practice.reading.cloze.next", { defaultValue: "Next" })
                : t("practice.reading.cloze.finish", { defaultValue: "Finish" })}
              <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
