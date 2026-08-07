import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import { TappableText } from "@/features/dictionary/TappableText";
import { getStories, getConversations } from "@/features/practice/content";
import { getKnownAtomsByPos } from "@/features/practice/engine";
import { getCardState, setCardState, gradeFromLesson } from "@/features/flashcards/engine";
import { recordPracticeResult } from "@/features/practice/practiceStats";
import { useCourseLevel } from "../useCourseLevel";
import { CLOZE_POS, buildClozeCards, collectSentences, type ClozeCard } from "../reading/readingBuilders";
import { useShowReadingRomaji } from "../reading/useShowReadingRomaji";

/** Cloze cards per session — a short, unhurried read. */
const CLOZE_SESSION = 8;

/* --------------------------------------------------------------------------
 * Conservative recognition SRS grading — only cards that already have state
 * advance (respects "only review cards count"); we never seed new cards here.
 *
 * BOTH outcomes are written. Grading only the correct pick made the scheduler a
 * one-way ratchet: intervals could only ever grow, so the atoms the learner is
 * weakest on were the ones whose strength we most overestimated. A miss maps to
 * Again via the house `gradeFromLesson` mapping, same as lessons and reading.
 * ------------------------------------------------------------------------ */
function gradeSrs(atomIds: string[], correct: boolean): void {
  for (const id of atomIds) {
    const state = getCardState(id);
    if (!state) continue;
    setCardState(id, gradeFromLesson(state, "recognition", { correct, retried: false }));
  }
}

/**
 * Fill-in-the-blank — a standalone cloze session pooled from ALL authored
 * sentences at the learner's level (stories + conversations), not tied to
 * any single story; pick the missing content word from same-part-of-speech
 * words you already know.
 *
 * Every pick grades the `recognition` modality of the atom the activity
 * exercised — correct reinforces, a miss writes Again — and only ever touches
 * cards which already have SRS state ("only review cards count").
 */
export function ClozePracticePage() {
  const { t } = useTranslation();
  const langId = useLang();
  const reachedModule = useCourseLevel();
  const showRomaji = useShowReadingRomaji(langId);

  // Draws from ALL authored content, not one story — the pool grows with the
  // library instead of being trapped inside a single narrative's sentences.
  const sentences = useMemo(
    () => collectSentences(getStories(langId, reachedModule), getConversations(langId, reachedModule)),
    [langId, reachedModule],
  );
  const knownContent = useMemo(() => getKnownAtomsByPos(langId, [...CLOZE_POS]), [langId]);

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
      gradeSrs([card.answer.atomId], opt.isAnswer);
      recordPracticeResult("reading", card.answer.atomId, opt.isAnswer);
    },
    [revealed, card],
  );

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("practice.cloze.title", { defaultValue: "Fill in the blank" })}
      </h1>
      <p className="text-sm text-text-secondary">
        {t("practice.cloze.subtitle", {
          defaultValue: "Sentences from your stories, with one word missing.",
        })}
      </p>
    </div>
  );

  if (cards.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="layers" size={28} aria-hidden />}
          title={t("practice.reading.cloze.empty.title", { defaultValue: "No fill-the-blanks yet" })}
          description={t("practice.reading.cloze.empty.description", {
            defaultValue: "Learn a few more words and we'll turn your reading into fill-the-blank practice.",
          })}
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        {header}
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
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="space-y-4">
      {header}

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

        {revealed && showRomaji && card.reading && (
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
              {showRomaji && <span className="text-xs text-text-muted">{opt.reading}</span>}
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
