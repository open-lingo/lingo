import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Modal, Popover } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "@/features/lesson/hooks/useLessonKeyboard";
import { writtenSegments } from "@/features/languages/ja/writtenForms";
import { getTrainerType, type TrainerTypeId } from "./trainerRegistry";
import type { TrainerQuestion, WordClass } from "./trainerSession";
import { CheatSheet } from "./CheatSheet";
import { FORM_TO_TILES, TYPE_GLYPH, TYPE_COLOR_VAR } from "./typeColors";

/**
 * Learners see kanji (with furigana) in the trainer from this module on —
 * pure exposure, the furigana always carries the reading (Spencer 2026-07-02:
 * "good practice to force kanji in the words here … at maybe module 10").
 */
export const KANJI_EXPOSURE_MODULE = 10;

/** After this long on one question the cheat-sheet button nudges (shake +
 *  amber) and the hint line appears. Peeking then costs half credit. */
const STUCK_HINT_MS = 20_000;

/** Kana word rendered in its written form (kanji + furigana) when enabled. */
function WrittenJa({
  kanaDict,
  kanjiDict,
  text,
  show,
}: {
  kanaDict: string;
  kanjiDict?: string;
  text: string;
  show: boolean;
}) {
  const segments = show ? writtenSegments(kanaDict, kanjiDict, text) : [{ text }];
  return (
    <span lang="ja">
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

/**
 * Conjugation-class chip: tap/click explains WHICH rule set applies — and,
 * over sessions, teaches which words are the irregulars (amber standout).
 */
function WordClassChip({ wordClass }: { wordClass: WordClass }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const LABELS: Record<WordClass, string> = {
    godan: t("practice.conjugation.classGodan", { defaultValue: "Godan verb" }),
    ichidan: t("practice.conjugation.classIchidan", { defaultValue: "Ichidan verb" }),
    irregular: t("practice.conjugation.classIrregular", { defaultValue: "Irregular verb" }),
    "i-adj": t("practice.conjugation.classIAdj", { defaultValue: "い-adjective" }),
    "i-adj-irregular": t("practice.conjugation.classIAdjIrregular", {
      defaultValue: "Irregular い-adjective",
    }),
  };
  const EXPLAIN: Record<WordClass, string> = {
    godan: t("practice.conjugation.classGodanExplain", {
      defaultValue:
        "Godan verbs conjugate by shifting the last kana along its row before the ending attaches — のむ → のみます・のまない.",
    }),
    ichidan: t("practice.conjugation.classIchidanExplain", {
      defaultValue:
        "Ichidan verbs drop る and attach the ending directly — たべる → たべます・たべない.",
    }),
    irregular: t("practice.conjugation.classIrregularExplain", {
      defaultValue:
        "する and くる follow neither pattern — the stem itself changes per form (くる → きます・こない). Worth memorizing.",
    }),
    "i-adj": t("practice.conjugation.classIAdjExplain", {
      defaultValue:
        "い-adjectives conjugate by replacing the final い — たかい → たかくない・たかかった.",
    }),
    "i-adj-irregular": t("practice.conjugation.classIAdjIrregularExplain", {
      defaultValue:
        "いい conjugates from its older form よい — よくない・よかった・よくなかった.",
    }),
  };
  const irregular = wordClass === "irregular" || wordClass === "i-adj-irregular";
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      width="w-64"
      trigger={
        // No own onClick — Popover's trigger cloning owns the toggle.
        <button
          type="button"
          className={
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition hover:brightness-110 " +
            (irregular
              ? "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-border bg-surface-muted text-text-secondary")
          }
        >
          {irregular && <Icon name="sparkles" size={12} aria-hidden />}
          {LABELS[wordClass]}
          <Icon name="info" size={11} className="opacity-60" aria-hidden />
        </button>
      }
    >
      <p className="px-3 py-2 text-xs leading-relaxed text-text-secondary" lang="und">
        {EXPLAIN[wordClass]}
      </p>
    </Popover>
  );
}

/** One glyph chip in the build stack — tap/click names its form. */
function GlyphChip({ tileId, sizeClass }: { tileId: TrainerTypeId; sizeClass: string }) {
  const [open, setOpen] = useState(false);
  const type = getTrainerType(tileId);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-end"
      width="w-56"
      trigger={
        // No own onClick — Popover's trigger cloning owns the toggle.
        <button
          type="button"
          lang="ja"
          className={`inline-flex items-center justify-center rounded-lg border-2 font-extrabold leading-none transition hover:brightness-110 ${sizeClass}`}
          style={{
            color: `var(${TYPE_COLOR_VAR[tileId]})`,
            borderColor: `color-mix(in srgb, var(${TYPE_COLOR_VAR[tileId]}) 55%, transparent)`,
            background: `color-mix(in srgb, var(${TYPE_COLOR_VAR[tileId]}) 12%, transparent)`,
          }}
        >
          {TYPE_GLYPH[tileId]}
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

/**
 * The build stack: the tiles the target form is made of, stacked vertically in
 * APPLICATION ORDER (top = apply first) with ↓ connectors — the answer to
 * "do I do たい first or past tense?". Chip size adapts to count so a lone
 * chip doesn't float undersized next to the word: 1 → large, 2 → medium,
 * 3+ → compact (scales to 4). Forms with no tile mapping render nothing.
 */
function BuildStack({ form }: { form: string }) {
  const tiles = FORM_TO_TILES[form];
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
            <Icon
              name="chevronDown"
              size={arrowSize}
              className="mt-1 text-text-muted"
              aria-hidden
            />
          )}
          <GlyphChip tileId={tileId} sizeClass={sizeClass} />
        </span>
      ))}
    </div>
  );
}

/**
 * Shared MCQ card for every trainer drill (per-type, combined). Owns the full
 * per-question lifecycle — REMOUNT IT PER QUESTION (key={index}); internal
 * state resets by construction.
 *
 * Layout (Spencer 2026-07-05, eye-tracking-informed): the word is the true
 * center of a measured 1fr/auto/1fr grid — first fixation lands on the big
 * type, the build stack sits right (end of the horizontal scan, just before
 * the eyes drop to the options), the cheat-sheet button left (discoverable,
 * low-salience). Below: tall unnumbered centered answer tiles (keyboard 1–4
 * still answers), then the permanently-reserved feedback slot.
 *
 * Cheat sheet: opens the formation tables for exactly the tiles in the
 * current question. Peeking before answering marks the question half credit.
 * After STUCK_HINT_MS the button shakes and the hint line names the deal.
 */
export function DrillQuestionCard({
  question,
  reachedModule,
  onResult,
  onNext,
}: {
  question: TrainerQuestion;
  reachedModule: number;
  /** Called once when the learner answers: 1, 0.5 (peeked), or 0. */
  onResult: (credit: number) => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [stuck, setStuck] = useState(false);

  const showKanji = reachedModule >= KANJI_EXPOSURE_MODULE;
  const tiles = FORM_TO_TILES[question.form];
  const formColor = tiles ? `var(${TYPE_COLOR_VAR[tiles[0]]})` : "var(--color-accent)";

  // The cheat sheet shows the formation tables for exactly this question's
  // tiles (a combo like なかった surfaces BOTH the ない and た tables).
  const cheatTypes = useMemo(
    () =>
      (tiles ?? [])
        .map((id) => getTrainerType(id))
        .filter((x): x is NonNullable<typeof x> => !!x),
    [tiles],
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
      {/* Measured header: 1fr/auto/1fr grid — equal side columns keep the
          word block on the card's true centerline regardless of content. */}
      <div className="mx-auto grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3">
        {cheatTypes.length > 0 ? (
          <button
            type="button"
            onClick={openCheat}
            className={
              "flex max-w-[76px] flex-col items-center gap-1 justify-self-start rounded-xl border px-2.5 py-2 text-[10px] font-semibold leading-tight transition " +
              (stuck && !showResult && !peeked
                ? // The nudge STOPS once they peek (or the modal opens): the
                  // infinite wobble kept animating BEHIND the modal's
                  // backdrop-blur overlay, invalidating the blur every frame —
                  // a full-viewport repaint per frame (the "cheat sheet lags
                  // my computer" report, 2026-07-05). Also: once they've taken
                  // the hint, keeping it wobbling is just nagging.
                  (cheatOpen ? "" : "conj-cheat-nudge ") +
                  "border-amber-500/70 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-border bg-surface-muted text-text-secondary hover:border-[color:var(--color-accent)] hover:text-text-primary")
            }
          >
            <Icon name="bookOpen" size={18} aria-hidden />
            {t("practice.conjugation.cheatButton", { defaultValue: "Cheat sheet" })}
          </button>
        ) : (
          <span aria-hidden />
        )}

        <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
          <WordClassChip wordClass={question.wordClass} />
          <p className="break-words text-4xl font-bold leading-snug text-text-primary">
            <WrittenJa
              kanaDict={question.prompt}
              kanjiDict={question.kanji}
              text={question.prompt}
              show={showKanji}
            />
          </p>
          <p className="text-sm text-text-muted">{question.meaning}</p>
        </div>

        <div className="justify-self-end">
          <BuildStack form={question.form} />
        </div>
      </div>

      {/* Answer tiles — tall targets carry the card's height */}
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
                "conj-opt-correct border-green-500 bg-green-50 text-green-800 dark:bg-green-500/15 dark:text-green-300";
            } else if (isSelected) {
              stateClass =
                "conj-opt-wrong border-red-500 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-300";
            } else {
              stateClass = "border-border bg-surface text-text-secondary opacity-40";
            }
          } else {
            stateClass =
              "border-border bg-surface text-text-primary active:translate-y-[2px]";
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
                <WrittenJa
                  kanaDict={question.prompt}
                  kanjiDict={question.kanji}
                  text={opt}
                  show={showKanji}
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback slot is permanently reserved (lesson UI stability rule:
          options must not move on submit). Pre-answer it holds the keyboard
          hint — or the stuck nudge once the timer fires. */}
      <div className="mx-auto mt-4 flex min-h-[104px] w-full max-w-sm flex-col justify-center">
        {!showResult &&
          (stuck && cheatTypes.length > 0 ? (
            <p className="text-center text-xs font-medium text-amber-700 dark:text-amber-300">
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
                  <WrittenJa
                    kanaDict={question.prompt}
                    kanjiDict={question.kanji}
                    text={question.correct}
                    show={showKanji}
                  />
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={onNext}
              className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-on-accent transition hover:bg-accent-hover active:translate-y-[2px]"
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
              <CheatSheet type={type} reachedModule={reachedModule} />
            </div>
          ))}
        </div>
      </Modal>
    </Card>
  );
}
