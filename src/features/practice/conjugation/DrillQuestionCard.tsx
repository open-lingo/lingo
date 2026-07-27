import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Modal, Popover } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "@/features/lesson/hooks/useLessonKeyboard";
import type { ConjugationTrainerProvider, ConjTrainerQuestion } from "@/shared/conjugation/types";
import { CheatSheet } from "./CheatSheet";

/** After this long on one question the cheat-sheet button nudges (shake +
 *  amber) and the hint line appears. Peeking then costs half credit. */
const STUCK_HINT_MS = 20_000;

/** A surface rendered through the provider (kanji + furigana for JA, plain for
 *  phonetic-script languages like KO). */
function Surface({
  conj,
  question,
  text,
  showSecondScript,
}: {
  conj: ConjugationTrainerProvider;
  question: ConjTrainerQuestion;
  text: string;
  showSecondScript: boolean;
}) {
  const segments = conj.renderSurface(question, text, showSecondScript);
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

/** Conjugation-class chip: tap/click explains WHICH rule set applies. */
function WordClassChip({
  conj,
  wordClassId,
}: {
  conj: ConjugationTrainerProvider;
  wordClassId: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const info = conj.wordClass(wordClassId);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      width="w-64"
      trigger={
        <button
          type="button"
          className={
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition hover:brightness-110 " +
            (info.irregular
              ? "border-warning/60 bg-warning/10 text-warning"
              : "border-border bg-surface-muted text-text-secondary")
          }
        >
          {info.irregular && <Icon name="sparkles" size={12} aria-hidden />}
          {t(info.labelKey, { defaultValue: info.labelDefault })}
          <Icon name="info" size={11} className="opacity-60" aria-hidden />
        </button>
      }
    >
      <p className="px-3 py-2 text-xs leading-relaxed text-text-secondary">
        {t(info.explainKey, { defaultValue: info.explainDefault })}
      </p>
    </Popover>
  );
}

/** One glyph chip in the build stack — tap/click names its form. */
function GlyphChip({
  conj,
  tileId,
  sizeClass,
}: {
  conj: ConjugationTrainerProvider;
  tileId: string;
  sizeClass: string;
}) {
  const [open, setOpen] = useState(false);
  const type = conj.getType(tileId);
  const colorVar = conj.colorVar(tileId);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-end"
      width="w-56"
      trigger={
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-lg border-2 font-extrabold leading-none transition hover:brightness-110 ${sizeClass}`}
          style={{
            color: `var(${colorVar})`,
            borderColor: `color-mix(in srgb, var(${colorVar}) 55%, transparent)`,
            background: `color-mix(in srgb, var(${colorVar}) 12%, transparent)`,
          }}
        >
          {conj.glyph(tileId)}
        </button>
      }
    >
      {type && (
        <div className="px-3 py-2">
          <p className="text-xs font-bold text-text-primary">{type.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{type.subtitle}</p>
        </div>
      )}
    </Popover>
  );
}

/** The build stack: the tiles the target form is made of, stacked vertically. */
function BuildStack({ conj, form }: { conj: ConjugationTrainerProvider; form: string }) {
  const tiles = conj.formToTiles(form);
  if (!tiles) return null;
  const sizeClass =
    tiles.length === 1
      ? "h-14 min-w-16 px-3.5 text-2xl"
      : tiles.length === 2
        ? "h-11 min-w-[52px] px-3 text-xl"
        : "h-9 min-w-10 px-2 text-base";
  const arrowSize = tiles.length === 2 ? 16 : 14;
  return (
    <div className="flex flex-col items-center">
      {tiles.map((tileId, i) => (
        <span key={tileId} className="flex flex-col items-center gap-1">
          {i > 0 && (
            <Icon name="chevronDown" size={arrowSize} className="mt-1 text-text-muted" aria-hidden />
          )}
          <GlyphChip conj={conj} tileId={tileId} sizeClass={sizeClass} />
        </span>
      ))}
    </div>
  );
}

/**
 * Shared MCQ card for every trainer drill (per-type, combined). Owns the full
 * per-question lifecycle — REMOUNT IT PER QUESTION (key={index}); internal
 * state resets by construction. Language-agnostic: every linguistic decision
 * (written-form rendering, word-class labels, form→tile mapping) routes through
 * the injected provider.
 */
export function DrillQuestionCard({
  conj,
  question,
  reachedModule,
  onResult,
  onNext,
}: {
  conj: ConjugationTrainerProvider;
  question: ConjTrainerQuestion;
  reachedModule: number;
  onResult: (credit: number) => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [stuck, setStuck] = useState(false);

  const showSecondScript =
    conj.secondScriptExposureModule != null && reachedModule >= conj.secondScriptExposureModule;
  const tiles = conj.formToTiles(question.form);
  const formColor = tiles ? `var(${conj.colorVar(tiles[0])})` : "rgb(var(--color-accent))";

  const cheatTypes = useMemo(
    () =>
      (tiles ?? [])
        .map((id) => conj.getType(id))
        .filter((x): x is NonNullable<typeof x> => !!x),
    [conj, tiles],
  );

  useEffect(() => {
    const timer = setTimeout(() => setStuck(true), STUCK_HINT_MS);
    return () => clearTimeout(timer);
  }, []);

  const openCheat = () => {
    if (!showResult) setPeeked(true);
    setCheatOpen(true);
  };

  const answer = (opt: string) => {
    if (showResult) return;
    setSelectedAnswer(opt);
    setShowResult(true);
    onResult(opt === question.correct ? (peeked ? 0.5 : 1) : 0);
  };

  useLessonKeyboard({
    enabled: !cheatOpen,
    onNumber: (n) => {
      if (!showResult && n >= 1 && n <= question.options.length) {
        answer(question.options[n - 1]);
      }
    },
    onEnter: () => {
      if (showResult) onNext();
    },
  });

  const correct = selectedAnswer === question.correct;

  return (
    <Card padding="lg" className="flex flex-col">
      <div className="mx-auto grid w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        {cheatTypes.length > 0 ? (
          <button
            type="button"
            onClick={openCheat}
            className={
              "flex max-w-[76px] flex-col items-center gap-1 justify-self-start rounded-xl border px-2.5 py-2 text-[10px] font-semibold leading-tight transition " +
              (stuck && !showResult && !peeked
                ? (cheatOpen ? "" : "conj-cheat-nudge ") +
                  "border-warning/70 bg-warning/10 text-warning"
                : "border-border bg-surface-muted text-text-secondary hover:border-[color:rgb(var(--color-accent))] hover:text-text-primary")
            }
          >
            <Icon name="bookOpen" size={18} aria-hidden />
            {t("practice.conjugation.cheatButton", { defaultValue: "Cheat sheet" })}
          </button>
        ) : (
          <span aria-hidden />
        )}

        <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <WordClassChip conj={conj} wordClassId={question.wordClassId} />
            {question.isAdjective && (
              <span className="inline-flex items-center rounded-full border border-violet-400/60 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-300">
                {t("practice.conjugation.adjectiveFlag", { defaultValue: "adjective" })}
              </span>
            )}
          </div>
          <p className="break-words text-4xl font-bold leading-snug text-text-primary">
            <Surface
              conj={conj}
              question={question}
              text={question.prompt}
              showSecondScript={showSecondScript}
            />
          </p>
          <p className="text-sm text-text-muted">{question.meaning}</p>
        </div>

        <div className="justify-self-end">
          <BuildStack conj={conj} form={question.form} />
        </div>
      </div>

      <div
        className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col gap-3"
        style={{ "--fc": formColor } as React.CSSProperties}
      >
        {question.options.map((opt, i) => {
          const isCorrect = opt === question.correct;
          const isSelected = opt === selectedAnswer;
          let stateClass = "";
          if (showResult) {
            if (isCorrect) {
              stateClass =
                "conj-opt-correct border-success bg-success/10 text-success";
            } else if (isSelected) {
              stateClass =
                "conj-opt-wrong border-error bg-error/10 text-error";
            } else {
              stateClass = "border-border bg-surface text-text-secondary opacity-40";
            }
          } else {
            stateClass = "border-border bg-surface text-text-primary active:translate-y-[2px]";
          }
          return (
            <button
              key={opt + i}
              type="button"
              onClick={() => answer(opt)}
              disabled={showResult}
              className={`conj-opt flex min-h-[68px] flex-1 items-center justify-center rounded-xl border-2 px-4 py-3 text-center transition md:min-h-[76px] ${stateClass}`}
            >
              <span className="text-xl font-semibold leading-snug">
                <Surface
                  conj={conj}
                  question={question}
                  text={opt}
                  showSecondScript={showSecondScript}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-4 flex min-h-[104px] w-full max-w-sm flex-col justify-center">
        {!showResult &&
          (stuck && cheatTypes.length > 0 ? (
            <p className="text-center text-xs font-medium text-warning">
              {t("practice.conjugation.stuckHint", {
                defaultValue: "Stuck? Peek at the cheat sheet — half credit.",
              })}
            </p>
          ) : (
            <p className="hidden text-center text-xs text-text-muted sm:block">
              {t("practice.conjugation.kbdHint", {
                defaultValue: "Press 1–4 to answer · Enter to continue",
              })}
            </p>
          ))}
        {showResult && (
          <>
            {correct ? (
              <p className="text-center text-sm font-semibold text-accent">
                <Icon name="check" size={16} className="mr-1 inline" />
                {peeked
                  ? t("practice.conjugation.correctHalf", {
                      defaultValue: "Correct — half credit (cheat sheet used)",
                    })
                  : t("practice.conjugation.correct", { defaultValue: "Correct!" })}
              </p>
            ) : (
              <p className="text-center text-sm text-destructive">
                <Icon name="close" size={16} className="mr-1 inline" />
                {t("practice.conjugation.answerWas", { defaultValue: "Answer:" })}{" "}
                <span className="font-semibold">
                  <Surface
                    conj={conj}
                    question={question}
                    text={question.correct}
                    showSecondScript={showSecondScript}
                  />
                </span>
              </p>
            )}
            {(() => {
              // Prefer the per-question example (built from THIS word) over the
              // tile's static demo sentence.
              const example = question.example ?? cheatTypes[0]?.example;
              if (!example) return null;
              return (
                <div className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t("practice.conjugation.exampleLabel", { defaultValue: "Example" })}
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-text-primary">
                    {example.text}
                  </p>
                  <p className="text-xs text-text-secondary">{example.translation}</p>
                </div>
              );
            })()}
            <button
              type="button"
              onClick={onNext}
              className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition hover:bg-accent-hover active:translate-y-[2px]"
            >
              {t("practice.conjugation.next", { defaultValue: "Next →" })}
            </button>
          </>
        )}
      </div>

      <Modal
        open={cheatOpen}
        onClose={() => setCheatOpen(false)}
        title={t("practice.conjugation.cheatTab", { defaultValue: "Cheat sheet" })}
      >
        <div className="space-y-6">
          {cheatTypes.map((type) => (
            <div key={type.id}>
              {cheatTypes.length > 1 && (
                <h3 className="mb-2 text-sm font-bold text-text-primary">{type.title}</h3>
              )}
              <CheatSheet conj={conj} type={type} reachedModule={reachedModule} />
            </div>
          ))}
        </div>
      </Modal>
    </Card>
  );
}
