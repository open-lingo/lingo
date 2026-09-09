import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import type {
  ConjugationTrainerProvider,
  ConjFreeDrillItem,
  ConjFreeDrillProvider,
  ConjFreeDrillQuestion,
  ConjRubySegment,
} from "@/shared/conjugation/types";
import { useCourseLevel } from "../useCourseLevel";
import { useConjugation } from "./useConjugation";

type SessionStats = { correct: number; total: number; streak: number };

/** Above this many words the browser grows a search box. */
const SEARCH_THRESHOLD = 20;

/**
 * Free drill — its own route (`practice/grammar/conjugation/free`). Provider-driven:
 * only languages that expose `provider.freeDrill` reach here (the hub hides the
 * Mix tile otherwise). Free play, weighted by the provider; writes no SRS.
 */
export function FreeDrillPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const conj = useConjugation();

  if (!conj?.freeDrill) {
    return <Navigate to={langPath("practice/grammar/conjugation")} replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to={langPath("practice/grammar/conjugation")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
          aria-label={t("practice.conjugation.backToTrainer", { defaultValue: "Back to trainer" })}
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

      <FreeDrill conj={conj} />
    </div>
  );
}

/** Ruby-aware surface (kanji + furigana once the level exposes it). */
function Written({ segments }: { segments: ConjRubySegment[] }) {
  return (
    <span>
      {segments.map((seg, i) =>
        seg.ruby ? (
          <ruby key={i}>
            {seg.text}
            <rt className="text-[0.5em] font-medium opacity-75">{seg.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}

function FreeDrill({ conj }: { conj: ConjugationTrainerProvider }) {
  const { t } = useTranslation();
  const free = conj.freeDrill!;
  const courseLevel = useCourseLevel();

  const [category, setCategory] = useState<string>(free.categories[0]?.id ?? "");
  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, free.minModule));
  const [selectedForms, setSelectedForms] = useState<Set<string>>(() => new Set(free.defaultForms));
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({ correct: 0, total: 0, streak: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [question, setQuestion] = useState<ConjFreeDrillQuestion | null>(null);

  const allForms = useMemo(() => free.formsFor(category), [free, category]);
  // Gate: a form the chosen level hasn't reached is neither shown nor served.
  const forms = useMemo(
    () => allForms.filter((f) => f.unlockModule <= maxModule),
    [allForms, maxModule],
  );
  const hiddenForms = allForms.length - forms.length;
  const nextUnlock = useMemo(() => {
    const later = allForms.filter((f) => f.unlockModule > maxModule).map((f) => f.unlockModule);
    return later.length ? Math.min(...later) : null;
  }, [allForms, maxModule]);
  const checkedCount = forms.filter((f) => selectedForms.has(f.key)).length;

  const items = useMemo(() => free.listItems(category, maxModule), [free, category, maxModule]);
  const pinned = useMemo(
    () => (pinnedId ? items.find((i) => i.id === pinnedId) ?? null : null),
    [items, pinnedId],
  );
  const showSecondScript =
    free.secondScriptExposureModule != null && maxModule >= free.secondScriptExposureModule;

  // A pin that fell out of the pool (level lowered, mode switched) is dropped.
  useEffect(() => {
    if (pinnedId && !pinned) setPinnedId(null);
  }, [pinnedId, pinned]);

  const generateQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestion(free.buildQuestion(category, maxModule, selectedForms, pinnedId));
  }, [free, category, maxModule, selectedForms, pinnedId]);

  // Scope changes (mode / level / pin) replace the question in place. Form
  // toggles don't — they take effect on the next question.
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestion(free.buildQuestion(category, maxModule, selectedForms, pinnedId));
  }, [free, category, maxModule, pinnedId]); // selectedForms deliberately omitted

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
    free.recordResult(category, question.itemId, isCorrect);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!question) return;
    if ((e.target as HTMLElement | null)?.tagName === "INPUT") return;
    if (showResult && e.key === "Enter") {
      generateQuestion();
      return;
    }
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.options.length && !showResult) {
      handleAnswer(question.options[num - 1]);
    }
  };

  const toggleForm = (key: string) => {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectClass =
    "h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary";

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <Card padding="sm" className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="min-w-0 text-xs font-medium text-text-secondary">
            {t("practice.conjugation.freeMode", { defaultValue: "Mode" })}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPinnedId(null);
              }}
              className={`mt-1 ${selectClass}`}
            >
              {free.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0 text-xs font-medium text-text-secondary">
            {t("practice.conjugation.freeLevel", { defaultValue: "Level" })}
            <select
              value={maxModule}
              onChange={(e) => setMaxModule(Number(e.target.value))}
              className={`mt-1 ${selectClass}`}
            >
              {Array.from(
                { length: Math.max(courseLevel - free.minModule + 1, 1) },
                (_, i) => i + free.minModule,
              ).map((m) => (
                <option key={m} value={m}>
                  {t("practice.conjugation.freeUpTo", { defaultValue: "Up to M{{module}}", module: m })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <WordBrowser
          free={free}
          conj={conj}
          category={category}
          items={items}
          pinned={pinned}
          onPin={setPinnedId}
          showSecondScript={showSecondScript}
        />

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-text-secondary">
              {t("practice.conjugation.freeForms", {
                defaultValue: "Forms ({{checked}}/{{total}})",
                checked: checkedCount,
                total: forms.length,
              })}
            </span>
            {hiddenForms > 0 && nextUnlock != null && (
              <span className="text-xs text-text-muted">
                {t("practice.conjugation.freeFormsHidden", {
                  defaultValue: "{{count}} more from M{{module}}",
                  count: hiddenForms,
                  module: nextUnlock,
                })}
              </span>
            )}
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2" role="group">
            {forms.map((f) => {
              const on = selectedForms.has(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleForm(f.key)}
                  className={
                    "flex min-h-[44px] min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition " +
                    (on
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:bg-surface-muted")
                  }
                >
                  <span
                    aria-hidden
                    className={
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                      (on ? "border-accent bg-accent text-accent-foreground" : "border-border")
                    }
                  >
                    {on && <Icon name="check" size={12} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight text-text-primary">
                      {f.label}
                    </span>
                    <span className="block break-all text-xs leading-tight text-text-muted">
                      {f.example.dictionary} → {f.example.form}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {question ? (
        <Card padding="lg" className="text-center">
          {pinned && (
            <p className="mb-2 text-xs font-medium text-accent">
              <Icon name="bookmark" size={12} className="mr-1 inline" />
              {t("practice.conjugation.freePinnedOnly", { defaultValue: "Pinned word" })}
            </p>
          )}
          <p className="text-3xl font-bold text-text-primary">
            <Written
              segments={free.renderWritten(
                question.prompt,
                showSecondScript ? question.written : undefined,
                question.prompt,
              )}
            />
          </p>
          <p className="mt-1 text-sm text-text-muted">{question.meaning}</p>
          <p className="mt-3 text-sm font-medium text-accent">→ {question.formLabel}</p>

          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correct;
              const isSelected = opt === selectedAnswer;
              let btnClass =
                "min-h-[44px] min-w-0 rounded-lg border px-3 py-2 text-sm font-medium transition";
              if (showResult) {
                if (isCorrect) {
                  btnClass += " border-success bg-success/10 text-success";
                } else if (isSelected && !isCorrect) {
                  btnClass += " border-error bg-error/10 text-error";
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
                  <Written
                    segments={free.renderWritten(
                      question.prompt,
                      showSecondScript ? question.written : undefined,
                      opt,
                    )}
                  />
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
                  <span>{question.correct}</span>
                </p>
              )}
              <button
                type="button"
                onClick={generateQuestion}
                className="mt-3 min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                {t("practice.conjugation.next", { defaultValue: "Next →" })}
              </button>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="lg" className="text-center text-sm text-text-secondary">
          {items.length === 0
            ? t("practice.conjugation.freeNoWords", {
                defaultValue: "Nothing to drill at this level yet — raise the level.",
              })
            : t("practice.conjugation.freeNoForms", {
                defaultValue: "Check at least one form to start.",
              })}
        </Card>
      )}

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
          {t("practice.conjugation.freeStreak", { defaultValue: "Streak: {{count}}", count: stats.streak })}
        </span>
      </div>
    </div>
  );
}

/**
 * "Verbs in this range (N)" disclosure. Tapping a row PINS it — the drill
 * then serves only that word across the checked forms — and collapses the
 * list so the question card is back in view; the header keeps a pinned pill
 * with a one-tap unpin. Tapping the pinned row again also unpins.
 */
function WordBrowser({
  free,
  conj,
  category,
  items,
  pinned,
  onPin,
  showSecondScript,
}: {
  free: ConjFreeDrillProvider;
  conj: ConjugationTrainerProvider;
  category: string;
  items: ConjFreeDrillItem[];
  pinned: ConjFreeDrillItem | null;
  onPin: (id: string | null) => void;
  showSecondScript: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setQuery(""), [category]);

  const searchable = items.length > SEARCH_THRESHOLD;
  const q = query.trim().toLowerCase();
  const visible = q
    ? items.filter(
        (i) =>
          i.dictionary.includes(q) ||
          (i.written?.includes(q) ?? false) ||
          i.meaning.toLowerCase().includes(q),
      )
    : items;

  const title =
    category === "verbs"
      ? t("practice.conjugation.freeVerbsInRange", {
          defaultValue: "Verbs in this range ({{count}})",
          count: items.length,
        })
      : t("practice.conjugation.freeWordsInRange", {
          defaultValue: "Words in this range ({{count}})",
          count: items.length,
        });

  const written = (item: ConjFreeDrillItem) =>
    free.renderWritten(item.dictionary, showSecondScript ? item.written : undefined, item.dictionary);

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-2 px-3 text-left text-sm font-medium text-text-primary"
        >
          <span className="truncate">{title}</span>
          <Icon name={open ? "chevronUp" : "chevronDown"} size={16} className="shrink-0 text-text-muted" />
        </button>
      </div>

      {pinned && (
        <div className="flex items-center gap-2 border-t border-border bg-accent/10 px-3 py-1.5 text-sm">
          <Icon name="bookmark" size={14} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-semibold text-text-primary">
              <Written segments={written(pinned)} />
            </span>
            <span className="ml-1.5 text-xs text-text-muted">{pinned.meaning}</span>
          </span>
          <button
            type="button"
            onClick={() => onPin(null)}
            className="inline-flex h-7 min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-medium text-text-secondary hover:bg-surface-muted"
            aria-label={t("practice.conjugation.freeUnpin", { defaultValue: "Unpin" })}
          >
            <Icon name="close" size={12} />
            {t("practice.conjugation.freeUnpin", { defaultValue: "Unpin" })}
          </button>
        </div>
      )}

      {open && (
        <div className="border-t border-border">
          {searchable && (
            <div className="relative p-2">
              <Icon
                name="search"
                size={14}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("practice.conjugation.freeSearch", { defaultValue: "Search words" })}
                className="h-9 w-full rounded-md border border-border bg-surface pl-8 pr-2 text-sm text-text-primary"
              />
            </div>
          )}
          <ul className="max-h-64 divide-y divide-border overflow-y-auto" role="listbox">
            {visible.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-text-muted">
                {t("practice.conjugation.freeNoMatch", { defaultValue: "No matches" })}
              </li>
            )}
            {visible.map((item) => {
              const isPinned = pinned?.id === item.id;
              const cls = conj.wordClass(item.classId);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isPinned}
                    onClick={() => {
                      onPin(isPinned ? null : item.id);
                      if (!isPinned) setOpen(false);
                    }}
                    className={
                      "flex min-h-[44px] w-full items-center gap-2 px-3 py-1.5 text-left transition " +
                      (isPinned ? "bg-accent/10" : "hover:bg-surface-muted")
                    }
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-base font-semibold text-text-primary">
                        <Written segments={written(item)} />
                      </span>
                      <span className="ml-2 text-xs text-text-muted">{item.meaning}</span>
                    </span>
                    {isPinned && (
                      <Icon name="bookmark" size={14} className="shrink-0 text-accent" aria-hidden />
                    )}
                    <span
                      className={
                        "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
                        (item.irregular
                          ? "border-warning/60 bg-warning/10 text-warning"
                          : "border-border bg-surface-muted text-text-secondary")
                      }
                      aria-label={t(cls.labelKey, { defaultValue: cls.labelDefault })}
                    >
                      {item.classChip}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
