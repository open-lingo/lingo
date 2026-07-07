import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useCourseLevel } from "../useCourseLevel";
import {
  ADJ_FORM_LABELS,
  getVerbsUpToModule,
  getAdjsUpToModule,
  type AdjForm,
} from "@/features/languages/ja/conjugationTables";
import {
  conjugateVerb,
  CHAIN_FORM_LABELS,
  type ChainForm,
  type IAdjForm,
} from "@/features/languages/ja/conjugationEngine";
import { recordPracticeResult, pickWeighted } from "../practiceStats";
// Distractor + shuffle helpers are single-sourced in the trainer session module.
import {
  shuffle,
  generateAdjDistractors,
  generateFormationDistractors,
  generateIAdjFormationDistractors,
} from "./trainerSession";

type Category = "verbs" | "i-adj" | "na-adj";
type Mode = "mcq" | "type";

type SessionStats = {
  correct: number;
  total: number;
  streak: number;
};

/**
 * Free drill — its OWN route (`practice/conjugation/free`, v1.2 Task 7). Moved
 * wholesale off the hub (the hub is now the compact Ink Tiles selector). The
 * original free-form MCQ conjugation drill: weighted by practiceStats, writes NO
 * FSRS state (deliberately — free play, off the review schedule).
 */
export function FreeDrillPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Slim header: back to hub + title */}
      <div className="flex items-center gap-3">
        <Link
          to={langPath("practice/conjugation")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
          aria-label={t("practice.conjugation.backToTrainer", {
            defaultValue: "Back to trainer",
          })}
        >
          <Icon name="arrowLeft" size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("practice.conjugation.freeDrillTitle", { defaultValue: "Free drill" })}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("practice.conjugation.freeDrillSub", {
              defaultValue: "Any forms, any pace — doesn't affect your review schedule.",
            })}
          </p>
        </div>
      </div>

      <FreeDrill />
    </div>
  );
}

function FreeDrill() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();

  const [category, setCategory] = useState<Category>("verbs");
  const [_mode] = useState<Mode>("mcq");
  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, 7));
  const [selectedForms, setSelectedForms] = useState<Set<string>>(
    () => new Set(["masu", "nai", "te", "ta"]),
  );
  const [stats, setStats] = useState<SessionStats>({ correct: 0, total: 0, streak: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const verbs = useMemo(() => getVerbsUpToModule(maxModule), [maxModule]);
  const adjs = useMemo(() => getAdjsUpToModule(maxModule), [maxModule]);

  const filteredAdjs = useMemo(
    () => adjs.filter((a) => (category === "i-adj" ? a.type === "i-adj" : a.type === "na-adj")),
    [adjs, category],
  );

  const [question, setQuestion] = useState<{
    itemId: string;
    prompt: string;
    meaning: string;
    formLabel: string;
    correct: string;
    options: string[];
  } | null>(null);

  const generateQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);

    if (category === "verbs") {
      if (verbs.length === 0) return;
      const verb = pickWeighted(verbs, (v) => v.id, "conjugation");
      const forms = (Object.keys(CHAIN_FORM_LABELS) as ChainForm[]).filter((f) =>
        selectedForms.has(f),
      );
      if (forms.length === 0) return;
      const targetForm = forms[Math.floor(Math.random() * forms.length)];
      // Engine-generated correct + same-verb formation distractors (anti-elimination).
      const correct = conjugateVerb(verb.dictionary, verb.group, targetForm);
      const distractors = generateFormationDistractors(
        verb.dictionary,
        verb.group,
        targetForm,
        correct,
      );
      const options = shuffle([correct, ...distractors]);
      setQuestion({
        itemId: `${verb.id}:${targetForm}`,
        prompt: verb.dictionary,
        meaning: verb.meaning,
        formLabel: CHAIN_FORM_LABELS[targetForm],
        correct,
        options,
      });
    } else {
      const pool = filteredAdjs;
      if (pool.length === 0) return;
      const adj = pickWeighted(pool, (a) => a.id, "conjugation");
      const adjForms = (["present", "negative", "past", "past-negative"] as AdjForm[]).filter(
        (f) => selectedForms.has(f),
      );
      if (adjForms.length === 0) return;
      const targetForm = adjForms[Math.floor(Math.random() * adjForms.length)];
      const correct = adj.forms[targetForm];
      // i-adjectives (except plain present) get same-adjective misapplied-rule
      // distractors; na-adjectives + present keep the legacy generator.
      const distractors =
        category === "i-adj" && targetForm !== "present"
          ? generateIAdjFormationDistractors(adj.dictionary, targetForm as IAdjForm, correct)
          : generateAdjDistractors(correct, adj, targetForm, pool);
      const options = shuffle([correct, ...distractors]);
      setQuestion({
        itemId: `${adj.id}:${targetForm}`,
        prompt: adj.dictionary,
        meaning: adj.meaning,
        formLabel: ADJ_FORM_LABELS[targetForm],
        correct,
        options,
      });
    }
  }, [category, verbs, filteredAdjs, selectedForms]);

  // Initialize first question
  useMemo(() => {
    if (!question) generateQuestion();
  }, []);

  const handleAnswer = (answer: string) => {
    if (showResult || !question) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    const isCorrect = answer === question.correct;
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));
    recordPracticeResult("conjugation", question.itemId, isCorrect);
  };

  const handleNext = () => {
    generateQuestion();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!question) return;
    if (showResult && e.key === "Enter") {
      handleNext();
      return;
    }
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.options.length && !showResult) {
      handleAnswer(question.options[num - 1]);
    }
  };

  // Free-drill chips deliberately collapse the ます family to the ONE form
  // that tests formation (dictionary → ます-stem). ません/ました/ませんでした
  // are cookie-cutter suffix swaps on that stem (Spencer 2026-07-02) —
  // drilling them separately tests rote endings, not conjugation. They stay
  // in the engine/cheat sheets; they just aren't separate drill toggles.
  const MASU_SUFFIX_FORMS: ReadonlySet<string> = new Set([
    "masu-neg",
    "masu-past",
    "masu-past-neg",
  ]);
  const verbFormKeys = (Object.keys(CHAIN_FORM_LABELS) as ChainForm[]).filter(
    (f) => !MASU_SUFFIX_FORMS.has(f),
  );
  const adjFormKeys = Object.keys(ADJ_FORM_LABELS) as AdjForm[];
  const currentFormKeys = category === "verbs" ? verbFormKeys : adjFormKeys;
  const currentFormLabels = category === "verbs" ? CHAIN_FORM_LABELS : ADJ_FORM_LABELS;

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Mode
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as Category);
                setQuestion(null);
                setTimeout(generateQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              <option value="verbs">Verbs</option>
              <option value="i-adj">i-Adjectives</option>
              <option value="na-adj">na-Adjectives</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Level
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setQuestion(null);
                setTimeout(generateQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from({ length: courseLevel - 6 }, (_, i) => i + 7).map((m) => (
                <option key={m} value={m}>
                  Up to M{m}
                </option>
              ))}
              {courseLevel < 7 && <option value={7}>Up to M7</option>}
            </select>
          </label>
        </div>

        {/* Form checkboxes */}
        <div className="mt-2 flex flex-wrap gap-2">
          {currentFormKeys.map((form) => (
            <label
              key={form}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={selectedForms.has(form)}
                onChange={(e) => {
                  const next = new Set(selectedForms);
                  if (e.target.checked) next.add(form);
                  else next.delete(form);
                  setSelectedForms(next);
                }}
                className="accent-accent"
              />
              {(currentFormLabels as Record<string, string>)[form]}
            </label>
          ))}
        </div>
      </Card>

      {/* Question card */}
      {question && (
        <Card padding="lg" className="text-center">
          <p className="text-3xl font-bold text-text-primary" lang="ja">
            {question.prompt}
          </p>
          <p className="mt-1 text-sm text-text-muted">{question.meaning}</p>
          <p className="mt-3 text-sm font-medium text-accent">→ {question.formLabel}</p>

          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correct;
              const isSelected = opt === selectedAnswer;
              let btnClass = "rounded-lg border px-4 py-3 text-sm font-medium transition";
              if (showResult) {
                if (isCorrect) {
                  btnClass += " border-green-500 bg-green-50 text-green-800";
                } else if (isSelected && !isCorrect) {
                  btnClass += " border-red-500 bg-red-50 text-red-800";
                } else {
                  btnClass += " border-border bg-surface text-text-secondary opacity-50";
                }
              } else {
                btnClass +=
                  " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";
              }
              return (
                <button
                  key={opt + i}
                  type="button"
                  onClick={() => handleAnswer(opt)}
                  disabled={showResult}
                  className={btnClass}
                >
                  <span className="mr-1.5 text-xs text-text-muted">{i + 1}</span>
                  <span lang="ja">{opt}</span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-4">
              {selectedAnswer === question.correct ? (
                <p className="text-sm font-semibold text-accent">
                  <Icon name="check" size={16} className="mr-1 inline" />
                  {t("practice.conjugation.correct", { defaultValue: "Correct!" })}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  <Icon name="close" size={16} className="mr-1 inline" />
                  {t("practice.conjugation.answerWas", { defaultValue: "Answer:" })}{" "}
                  <span lang="ja">{question.correct}</span>
                </p>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                {t("practice.conjugation.next", { defaultValue: "Next →" })}
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-sm text-text-secondary">
          {t("practice.conjugation.freeScore", {
            defaultValue: "Score: {{correct}}/{{total}}",
            correct: stats.correct,
            total: stats.total,
          })}
          {stats.total > 0 && (
            <span className="ml-2 text-text-muted">
              ({Math.round((stats.correct / stats.total) * 100)}%)
            </span>
          )}
        </span>
        <span className="text-sm text-text-secondary">
          <Icon name="flame" size={14} className="mr-1 inline text-warning" />
          {t("practice.conjugation.freeStreak", {
            defaultValue: "Streak: {{count}}",
            count: stats.streak,
          })}
        </span>
      </div>
    </div>
  );
}
