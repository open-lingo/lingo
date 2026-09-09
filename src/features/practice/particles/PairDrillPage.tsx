import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { TappableText } from "@/features/dictionary/TappableText";
import { recordPracticeResult, recordSessionEnd } from "@/features/practice/practiceStats";
import { useCourseLevel } from "../useCourseLevel";
import { minePairSentences } from "./mineParticlePairs";
import { getParticlePair, usageCardsForPair, type ParticlePair, type UsageCard } from "./particlePairs";
import { buildPairSession, gradePair, type PairGrade, type PairQuestion } from "./pairDrill";

/**
 * Combined particle drill (`practice/grammar/particles/combine?pair=ni-kara`).
 * Mirrors the conjugation trainer's "Train together": one pair, sentences
 * mined from the taught corpus with BOTH particles blanked, graded per blank
 * with one combined result. Every check writes to the `particles` practice
 * stats — the same store the conjugation trainer uses — so the grammar
 * pillar can count it as training.
 */
export function PairDrillPage() {
  const [params] = useSearchParams();
  const langPath = useLangPath();
  const langId = useLang();
  const pair = getParticlePair(params.get("pair"));
  if (!pair || langId !== "ja") {
    return <Navigate to={langPath("practice/grammar/particles?mode=combine")} replace />;
  }
  return <Session key={pair.id} pair={pair} />;
}

function PairGlyphs({ pair }: { pair: ParticlePair }) {
  return (
    <span className="flex items-center gap-1" lang="ja">
      {pair.particles.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-sm font-bold text-text-muted" aria-hidden>
              +
            </span>
          )}
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-accent/50 bg-accent/10 px-1.5 text-sm font-bold leading-none text-accent">
            {p}
          </span>
        </span>
      ))}
    </span>
  );
}

function Session({ pair }: { pair: ParticlePair }) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const langId = useLang();
  const reachedModule = useCourseLevel();
  const { settings, updateSetting } = useSettings();

  const pool = useMemo(() => minePairSentences(pair.particles, reachedModule), [pair, reachedModule]);

  // Usage cards owed before the first drill: computed ONCE on mount from the
  // persisted seen-set, then walked locally. Re-deriving from settings on every
  // render would pop the next card in the instant the previous one is saved.
  const [cards, setCards] = useState<UsageCard[]>(() =>
    usageCardsForPair(pair, new Set(settings.learning?.particleUsageCardsSeen ?? [])),
  );
  const dismissCard = useCallback(
    (card: UsageCard) => {
      const seen = new Set(settings.learning?.particleUsageCardsSeen ?? []);
      seen.add(card.id);
      updateSetting("learning.particleUsageCardsSeen", [...seen]);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    },
    [settings.learning?.particleUsageCardsSeen, updateSetting],
  );

  const servedRef = useRef<Set<string>>(new Set());
  const [questions, setQuestions] = useState<PairQuestion[]>(() => {
    const qs = buildPairSession(pair, pool, String(Date.now()));
    for (const q of qs) servedRef.current.add(q.id);
    return qs;
  });
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<PairGrade[]>([]);
  const [finished, setFinished] = useState(false);

  const sessionEndedRef = useRef(false);
  useEffect(() => {
    if (finished && !sessionEndedRef.current) {
      recordSessionEnd("particles");
      sessionEndedRef.current = true;
    }
  }, [finished]);

  const restart = () => {
    const qs = buildPairSession(pair, pool, String(Date.now()), servedRef.current);
    servedRef.current = new Set(qs.map((q) => q.id));
    sessionEndedRef.current = false;
    setQuestions(qs);
    setIndex(0);
    setResults([]);
    setFinished(false);
  };

  const onGraded = (grade: PairGrade, q: PairQuestion) => {
    recordPracticeResult("particles", `${pair.id}:${q.id}`, grade.correct);
    setResults((prev) => [...prev, grade]);
  };

  const advance = () => {
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex((i) => i + 1);
  };

  const header = (
    <div className="flex items-center gap-3">
      <Link
        to={langPath("practice/grammar/particles?mode=combine")}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
        aria-label={t("practice.particles.combine.back", { defaultValue: "Back to particles" })}
      >
        <Icon name="arrowLeft" size={16} />
      </Link>
      <h1 className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xl font-bold text-text-primary">
        <span>{t("practice.particles.combine.title", { defaultValue: "Combine" })}</span>
        <PairGlyphs pair={pair} />
      </h1>
    </div>
  );

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {header}
        <Card padding="lg" className="text-center text-sm text-text-secondary">
          {t("practice.particles.combine.empty", {
            defaultValue: "No sentences with both particles yet — keep going in the course and this pair opens up.",
          })}
        </Card>
      </div>
    );
  }

  if (cards.length > 0) {
    const card = cards[0];
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {header}
        <UsageCardView card={card} onDismiss={() => dismissCard(card)} />
      </div>
    );
  }

  if (finished) {
    const right = results.filter((r) => r.correct).length;
    const blanksRight = results.reduce((n, r) => n + (r.blanks[0] ? 1 : 0) + (r.blanks[1] ? 1 : 0), 0);
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {header}
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="checkCircle" size={28} aria-hidden />
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {t("practice.particles.combine.doneTitle", { defaultValue: "Session complete" })}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("practice.particles.combine.doneScore", {
              defaultValue: "{{right}} of {{total}} sentences fully correct · {{blanks}} of {{blankTotal}} blanks.",
              right,
              total: results.length,
              blanks: blanksRight,
              blankTotal: results.length * 2,
            })}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={restart}>
              <Icon name="refresh" size={16} className="mr-1.5" aria-hidden />
              {t("practice.particles.combine.again", { defaultValue: "New set" })}
            </Button>
            <Link
              to={langPath("practice/grammar/particles?mode=combine")}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
            >
              {t("practice.particles.combine.pickAnother", { defaultValue: "Pick another pair" })}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const current = questions[index];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {header}
      <div className="flex items-center justify-between text-xs font-medium text-text-muted">
        <span>
          {t("practice.particles.combine.progress", {
            defaultValue: "{{n}} of {{total}}",
            n: index + 1,
            total: questions.length,
          })}
        </span>
        <span>
          {t("practice.particles.combine.scoreLabel", {
            defaultValue: "Score {{correct}}/{{total}}",
            correct: results.filter((r) => r.correct).length,
            total: results.length,
          })}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(results.length / questions.length) * 100}%` }}
        />
      </div>
      <QuestionCard
        key={current.id}
        question={current}
        langId={langId}
        isLast={index + 1 >= questions.length}
        onGraded={(g) => onGraded(g, current)}
        onNext={advance}
      />
    </div>
  );
}

function UsageCardView({ card, onDismiss }: { card: UsageCard; onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon name="lightbulb" size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("practice.particles.combine.usageKicker", { defaultValue: "When they meet" })}
          </p>
          <h2 className="text-lg font-bold text-text-primary" lang="ja">
            {card.title}
          </h2>
        </div>
      </div>
      <ol className="space-y-2.5">
        {card.lines.map((line, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-text-secondary">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[0.7rem] font-bold text-text-muted">
              {i + 1}
            </span>
            <span lang="ja">{line}</span>
          </li>
        ))}
      </ol>
      <Button variant="primary" className="w-full" onClick={onDismiss}>
        {t("practice.particles.combine.gotIt", { defaultValue: "Got it — start" })}
        <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
      </Button>
    </Card>
  );
}

/**
 * One two-blank question. The learner fills the ACTIVE blank from the bank;
 * filling blank 1 moves focus to blank 2; tapping a filled blank reopens it.
 * Check is enabled once both are filled. Per CLAUDE.md the option row and the
 * CTA never move on submit: the bank stays mounted (disabled) after grading
 * and the footer row swaps Check → Next in place.
 */
export function QuestionCard({
  question: q,
  langId,
  isLast,
  onGraded,
  onNext,
}: {
  question: PairQuestion;
  langId: string;
  isLast: boolean;
  onGraded: (grade: PairGrade) => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<[string | null, string | null]>([null, null]);
  const [active, setActive] = useState<0 | 1>(0);
  const [grade, setGrade] = useState<PairGrade | null>(null);
  const revealed = grade !== null;

  const pick = (opt: string) => {
    if (revealed) return;
    setPicked((prev) => {
      const next: [string | null, string | null] = [prev[0], prev[1]];
      next[active] = opt;
      return next;
    });
    const other = active === 0 ? 1 : 0;
    if (picked[other] === null) setActive(other);
  };

  const check = () => {
    if (revealed || picked[0] === null || picked[1] === null) return;
    const g = gradePair(q, picked);
    setGrade(g);
    onGraded(g);
  };

  const blank = (i: 0 | 1) => {
    const value = picked[i];
    let cls =
      "mx-0.5 inline-flex h-9 min-w-[2.75rem] items-center justify-center gap-1 rounded-md border-2 px-1.5 align-middle text-xl font-semibold leading-none transition";
    if (revealed && grade) {
      // A wrong blank reads its own fix in place: the learner's particle
      // small and struck, the correct one beside it in green.
      cls += grade.blanks[i] ? " border-success bg-success/10 text-success" : " border-error bg-error/5 text-success";
    } else if (active === i) {
      cls += " border-accent bg-accent/10 text-text-primary";
    } else {
      cls += " border-dashed border-border-muted bg-surface-muted text-text-primary";
    }
    return (
      <button
        type="button"
        className={cls}
        onClick={() => !revealed && setActive(i)}
        disabled={revealed}
        aria-label={t("practice.particles.combine.blankAria", {
          defaultValue: "Blank {{n}}{{value}}",
          n: i + 1,
          value: value ? `: ${value}` : "",
        })}
        aria-pressed={!revealed && active === i}
        data-testid={`blank-${i + 1}`}
      >
        {revealed && grade && !grade.blanks[i] ? (
          <>
            <s className="text-sm font-medium text-error decoration-2" data-testid={`blank-${i + 1}-picked`}>
              {value}
            </s>
            <span data-testid={`blank-${i + 1}-answer`}>{q.answers[i]}</span>
          </>
        ) : (
          (value ?? <span className="text-text-muted">{i + 1}</span>)
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-text-muted">
          {t("practice.particles.combine.meaning", { defaultValue: "Meaning" })}
          <span className="ml-2 normal-case tracking-normal text-text-secondary">{q.translation}</span>
        </p>
        <p className="text-2xl leading-[2.4] text-text-primary" lang={langId}>
          {q.segments[0]}
          {blank(0)}
          {q.segments[1]}
          {blank(1)}
          {q.segments[2]}
        </p>
        {revealed && (
          <div className="mt-3 border-t border-border pt-3">
            <TappableText text={q.text} lang={langId} className="text-lg leading-relaxed text-text-secondary" />
          </div>
        )}
      </Card>

      <div
        className="grid grid-cols-3 gap-2"
        role="group"
        aria-label={t("practice.particles.combine.bankAria", { defaultValue: "Particle options" })}
      >
        {q.options.map((opt) => {
          let cls =
            "flex min-h-14 items-center justify-center rounded-lg border px-3 py-3 text-2xl font-semibold transition";
          if (revealed) cls += " border-border bg-surface text-text-secondary opacity-50";
          else cls += " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted active:bg-surface-muted";
          return (
            <button key={opt} type="button" className={cls} onClick={() => pick(opt)} disabled={revealed} lang="ja">
              {opt}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-11 items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-medium">
          {revealed && grade ? (
            grade.correct ? (
              <span className="text-success">
                <Icon name="check" size={16} className="mr-1 inline" aria-hidden />
                {t("practice.particles.combine.correct", { defaultValue: "Both right." })}
              </span>
            ) : (
              <span className="text-text-secondary">
                <Icon name="close" size={16} className="mr-1 inline text-error" aria-hidden />
                {t("practice.particles.combine.answerWas", {
                  defaultValue: "Answer: {{a}} … {{b}}",
                  a: q.answers[0],
                  b: q.answers[1],
                })}
              </span>
            )
          ) : (
            <span className="text-text-muted">
              {picked[0] !== null && picked[1] !== null
                ? t("practice.particles.combine.hintCheck", { defaultValue: "Tap a blank to change it" })
                : t("practice.particles.combine.hint", {
                    defaultValue: "Fill blank {{n}}",
                    n: picked[active] === null ? active + 1 : picked[0] === null ? 1 : 2,
                  })}
            </span>
          )}
        </p>
        {revealed ? (
          <Button variant="primary" onClick={onNext}>
            {isLast
              ? t("practice.particles.combine.finish", { defaultValue: "Finish" })
              : t("practice.particles.combine.next", { defaultValue: "Next" })}
            <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
          </Button>
        ) : (
          <Button variant="primary" onClick={check} disabled={picked[0] === null || picked[1] === null}>
            {t("practice.particles.combine.check", { defaultValue: "Check" })}
          </Button>
        )}
      </div>
    </div>
  );
}
