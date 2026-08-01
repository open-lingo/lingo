/**
 * The comprehension check that gates SRS credit for a story.
 *
 * Questions and options are TARGET-language strings (see `storyQuestions.ts`),
 * so every option is rendered with `lang` — the old English-prompt quiz was
 * answerable without reading a character of the story.
 *
 * Scoring is reveal-on-pick: the first tap on a question locks it and shows
 * whether it was right. The score is reported up once, when the learner asks to
 * see how they did; the reader owns what that score is worth.
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { StoryQuestion } from "@/features/practice/content";
import type { StoryScore } from "@/shared/storyProgress";

interface StoryQuizProps {
  title: string;
  questions: StoryQuestion[];
  langId: string;
  onReadAgain: () => void;
  onComplete: (score: StoryScore) => void;
}

export function StoryQuiz({ title, questions, langId, onReadAgain, onComplete }: StoryQuizProps) {
  const { t } = useTranslation();
  const [picks, setPicks] = useState<Record<string, string>>({});

  const allAnswered = Object.keys(picks).length >= questions.length;
  const correctCount = questions.filter((q) => picks[q.id] === q.answer).length;

  const pick = useCallback((questionId: string, option: string) => {
    setPicks((prev) => (prev[questionId] ? prev : { ...prev, [questionId]: option }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text-primary">
          {t("practice.stories.quiz.heading", {
            defaultValue: "Did you follow “{{title}}”?",
            title,
          })}
        </h2>
        <button
          type="button"
          onClick={onReadAgain}
          className="shrink-0 text-xs font-medium text-text-secondary transition hover:text-text-primary"
        >
          {t("practice.stories.quiz.reread", { defaultValue: "Read again" })}
        </button>
      </div>

      {questions.map((q, qi) => {
        const picked = picks[q.id];
        const revealed = picked !== undefined;
        return (
          <Card key={q.id} padding="md" className="space-y-2.5">
            <p className="text-sm font-medium text-text-primary">
              <span className="mr-1.5 text-text-muted">{qi + 1}.</span>
              <span lang={langId}>{q.prompt}</span>
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
                    <span lang={langId}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={!allAnswered}
          onClick={() => onComplete({ correct: correctCount, total: questions.length })}
        >
          {t("practice.stories.quiz.finish", { defaultValue: "See how you did" })}
          <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
