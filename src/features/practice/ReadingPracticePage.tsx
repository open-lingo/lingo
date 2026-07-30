import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import { generatePracticeItems, type PracticeItem } from "./engine";
import { getCardState, setCardState, gradeFromLesson } from "@/features/flashcards/engine";

const SESSION_COUNT = 12;

/** One tap option for a cloze item. */
interface ClozeOption {
  surface: string;
  reading: string;
  meaningEn?: string;
  isAnswer: boolean;
}

/** Deterministic Fisher-Yates so option order is stable across re-renders of the
 *  same item (keyed off the item id) but varies item-to-item. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice();
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build the shuffled tap options for a cloze item (answer + same-POS known
 *  distractors). Returns null for straight-read items (no blank). */
function optionsFor(item: PracticeItem): ClozeOption[] | null {
  if (!item.blank) return null;
  const opts: ClozeOption[] = [
    {
      surface: item.blank.answer,
      reading: item.blank.answerReading,
      isAnswer: true,
    },
    ...item.blank.distractors.map((d) => ({
      surface: d.surface,
      reading: d.reading,
      meaningEn: d.meaningEn,
      isAnswer: false,
    })),
  ];
  return seededShuffle(opts, hashSeed(item.id));
}

/** Lightly credit the recognition modality for the atoms a correct read
 *  exercised. Conservative: only cards that already have SRS state advance
 *  (respects "only review cards count"). */
function creditSrs(item: PracticeItem): void {
  for (const id of item.exercisedAtomIds) {
    const state = getCardState(id);
    if (!state) continue;
    setCardState(id, gradeFromLesson(state, "recognition", { correct: true, retried: false }));
  }
}

export function ReadingPracticePage() {
  const { t } = useTranslation();
  const langId = useLang();

  const [seed, setSeed] = useState(() => Date.now());

  const session = useMemo(() => {
    const items = generatePracticeItems(langId, {
      surface: "reading",
      count: SESSION_COUNT,
      seed,
    });
    const options = new Map<string, ClozeOption[] | null>();
    for (const item of items) options.set(item.id, optionsFor(item));
    return { items, options };
  }, [langId, seed]);

  const { items } = session;

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);

  const item = items[index] as PracticeItem | undefined;
  const options = item ? session.options.get(item.id) ?? null : null;

  const startNewSession = useCallback(() => {
    setSeed(Date.now());
    setIndex(0);
    setPicked(null);
    setRevealed(false);
    setScore({ correct: 0, total: 0 });
    setDone(false);
  }, []);

  const advance = useCallback(() => {
    setPicked(null);
    setRevealed(false);
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setDone(true);
    }
  }, [index, items.length]);

  const handlePick = useCallback(
    (opt: ClozeOption) => {
      if (revealed || !item) return;
      setPicked(opt.surface);
      setRevealed(true);
      setScore((s) => ({ correct: s.correct + (opt.isAnswer ? 1 : 0), total: s.total + 1 }));
      if (opt.isAnswer) creditSrs(item);
    },
    [revealed, item],
  );

  const handleGotIt = useCallback(() => {
    if (!item) return;
    creditSrs(item);
    setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    advance();
  }, [item, advance]);

  // Split the target sentence around the first occurrence of the answer so the
  // masked slot can be rendered in place. The engine guarantees the answer
  // appears verbatim in `target`.
  const masked = useMemo(() => {
    if (!item?.blank) return null;
    const at = item.target.indexOf(item.blank.answer);
    if (at < 0) return { before: item.target, after: "" };
    return {
      before: item.target.slice(0, at),
      after: item.target.slice(at + item.blank.answer.length),
    };
  }, [item]);

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("practice.reading.title", { defaultValue: "Reading" })}
      </h1>
      <p className="text-sm text-text-secondary">
        {t("practice.reading.builtFromKnown", {
          defaultValue: "Sentences built from words you already know — read, then fill the blank.",
        })}
      </p>
    </div>
  );

  // Low-vocab / nothing generated.
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="bookOpen" size={28} aria-hidden />}
          title={t("practice.reading.empty.title", { defaultValue: "Learn a few more words first" })}
          description={t("practice.reading.empty.description", {
            defaultValue:
              "Reading practice builds sentences from the vocabulary you've learned. Complete a lesson or two and we'll have plenty to read.",
          })}
        />
      </div>
    );
  }

  // Session summary.
  if (done) {
    return (
      <div className="space-y-4">
        {header}
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="checkCircle" size={28} aria-hidden />
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {t("practice.reading.summary.title", { defaultValue: "Session complete" })}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("practice.reading.summary.score", {
              defaultValue: "You read {{correct}} of {{total}} correctly.",
              correct: score.correct,
              total: score.total,
            })}
          </p>
          <Button variant="primary" className="mt-4" onClick={startNewSession}>
            <Icon name="refresh" size={16} className="mr-1.5" aria-hidden />
            {t("practice.reading.newSession", { defaultValue: "New session" })}
          </Button>
        </Card>
      </div>
    );
  }

  if (!item) return null;

  const isCloze = !!item.blank && !!options;

  return (
    <div className="space-y-4">
      {header}

      {/* Progress */}
      <div className="flex items-center justify-between text-xs font-medium text-text-muted">
        <span>
          {t("practice.reading.progress", {
            defaultValue: "{{n}} of {{total}}",
            n: index + 1,
            total: items.length,
          })}
        </span>
        <span>
          {t("practice.reading.scoreLabel", {
            defaultValue: "Score {{correct}}/{{total}}",
            correct: score.correct,
            total: score.total,
          })}
        </span>
      </div>

      {/* Sentence */}
      <Card padding="lg">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-text-muted">
          {t("practice.reading.meaningHint", { defaultValue: "Meaning" })}
          <span className="ml-2 normal-case tracking-normal text-text-secondary">{item.translation}</span>
        </p>

        {isCloze && masked ? (
          <p className="text-2xl leading-relaxed text-text-primary" lang={langId}>
            {masked.before}
            {revealed ? (
              <span className="mx-0.5 rounded-md bg-success/10 px-1.5 font-semibold text-success">
                {item.blank!.answer}
              </span>
            ) : (
              <span className="mx-1 inline-block min-w-[3.5rem] border-b-2 border-accent align-baseline" aria-hidden />
            )}
            {masked.after}
          </p>
        ) : (
          <p className="text-2xl leading-relaxed text-text-primary" lang={langId}>
            {item.target}
          </p>
        )}

        {revealed && item.reading && (
          <p className="mt-2 text-sm text-text-muted">{item.reading}</p>
        )}
      </Card>

      {/* Cloze options */}
      {isCloze ? (
        <div className="space-y-2">
          {options!.map((opt, i) => {
            const isPicked = picked === opt.surface;
            let cls =
              "flex w-full items-baseline gap-2 rounded-lg border px-4 py-3 text-left transition";
            if (revealed) {
              if (opt.isAnswer) cls += " border-success bg-success/10 text-success";
              else if (isPicked) cls += " border-error bg-error/10 text-error";
              else cls += " border-border bg-surface text-text-secondary opacity-50";
            } else {
              cls += " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";
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
                {picked && options!.find((o) => o.surface === picked)?.isAnswer ? (
                  <span className="text-success">
                    <Icon name="check" size={16} className="mr-1 inline" aria-hidden />
                    {t("practice.reading.correct", { defaultValue: "Nice reading." })}
                  </span>
                ) : (
                  <span className="text-text-secondary">
                    <Icon name="close" size={16} className="mr-1 inline text-error" aria-hidden />
                    {t("practice.reading.answerWas", {
                      defaultValue: "Answer: {{answer}}",
                      answer: item.blank!.answer,
                    })}
                  </span>
                )}
              </p>
              <Button variant="primary" onClick={advance}>
                {index < items.length - 1
                  ? t("practice.reading.next", { defaultValue: "Next" })
                  : t("practice.reading.finish", { defaultValue: "Finish" })}
                <Icon name="arrowRight" size={16} className="ml-1.5" aria-hidden />
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Straight comprehensible-read beat.
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleGotIt}>
            <Icon name="check" size={16} className="mr-1.5" aria-hidden />
            {t("practice.reading.gotIt", { defaultValue: "Got it" })}
          </Button>
        </div>
      )}
    </div>
  );
}
