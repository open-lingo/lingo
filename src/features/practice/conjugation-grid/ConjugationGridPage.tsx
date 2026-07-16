import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SegmentedControl } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import type { EsVerbEntry } from "@/features/languages/es/conjugationTables";
import { getConjugationVerbEntries } from "../data/practiceDataLoader";
import { useCourseLevel } from "../useCourseLevel";
import { getConjugationGridConfig, type ConjugationGridConfig, type EsTenseId } from "./gridConfig";
import {
  buildMixRound,
  buildVerbRound,
  makeRoundSeed,
  type GridQuestion,
} from "./gridSession";
import { VerbPicker } from "./VerbPicker";
import { GridBoard, type GridBoardCell, type GridCellStatus } from "./GridBoard";
import { GridDrillCard } from "./GridDrillCard";
import { GridRoundSummary } from "./GridRoundSummary";

type Round = {
  kind: "verb" | "mix";
  tense: EsTenseId;
  /** Drilled verb — verb rounds only (mix draws across the pool). */
  verbId?: string;
  /** Round seed — also the session's remount key, so "Drill again" (same
   *  verb×tense, new seed) rebuilds the drill state from scratch. */
  seed: string;
  questions: GridQuestion[];
};

/**
 * Conjugation Grid — the ES person×tense trainer (`practice/conjugation` for
 * languages with tabular verb data; App.tsx routes ja to its own hub). Pick a
 * verb (grouped by class, advisory module chips — never hard-blocked) and a
 * tense tab, then drill the 6-person paradigm one cell at a time; answered
 * cells fill into the visible grid. Rounds are seeded (gridSession.ts);
 * practice-only — no SRS writes, ES has no Track B conjugation points yet.
 */
export function ConjugationGridPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const reachedModule = useCourseLevel();

  const entries = useMemo(() => getConjugationVerbEntries(lang), [lang]);
  const config = useMemo(() => getConjugationGridConfig(lang), [lang]);

  const [tense, setTense] = useState<EsTenseId>("present");
  // Default verb: the most recently introduced verb the learner has reached —
  // "what you're learning now"; before any unlock, the earliest verb (ser, M2).
  const defaultVerbId = useMemo(() => {
    const unlocked = entries.filter((v) => v.introducedAtModule <= reachedModule);
    const pick = (list: EsVerbEntry[], best: (a: number, b: number) => boolean) =>
      list.reduce<EsVerbEntry | null>(
        (acc, v) => (!acc || best(v.introducedAtModule, acc.introducedAtModule) ? v : acc),
        null,
      );
    return (
      (unlocked.length > 0
        ? pick(unlocked, (a, b) => a > b)
        : pick(entries, (a, b) => a < b)
      )?.id ?? null
    );
  }, [entries, reachedModule]);
  const [pickedVerbId, setPickedVerbId] = useState<string | null>(null);
  const verbId = pickedVerbId ?? defaultVerbId;
  const selectedVerb = entries.find((v) => v.id === verbId) ?? null;

  const [round, setRound] = useState<Round | null>(null);

  if (!config || entries.length === 0) {
    // The route only sends languages with data here; keep a graceful floor.
    return (
      <Card padding="lg" className="mx-auto max-w-md text-center text-sm text-text-secondary">
        {t("practice.conjugationGrid.noData", {
          defaultValue: "No conjugation tables are available for this course yet.",
        })}
      </Card>
    );
  }

  /** Mix pool: verbs the course has introduced; before anything unlocks, the
   *  full list (advisory locks — an early wanderer still gets a round). */
  const mixPool = () => {
    const unlocked = entries.filter((v) => v.introducedAtModule <= reachedModule);
    return unlocked.length > 0 ? unlocked : entries;
  };

  const startVerbRound = (seed: string = makeRoundSeed()) => {
    if (!selectedVerb) return;
    setRound({
      kind: "verb",
      tense,
      verbId: selectedVerb.id,
      seed,
      questions: buildVerbRound(selectedVerb, tense, entries, config, seed),
    });
  };

  const startMixRound = (seed: string = makeRoundSeed()) => {
    setRound({
      kind: "mix",
      tense,
      seed,
      questions: buildMixRound(mixPool(), tense, config, seed),
    });
  };

  if (round) {
    const roundVerb = entries.find((v) => v.id === round.verbId) ?? null;
    return (
      <GridDrillSession
        key={round.seed}
        round={round}
        config={config}
        title={
          round.kind === "verb"
            ? `${roundVerb?.lemma ?? ""} · ${tenseLabelOf(config, round.tense)}`
            : t("practice.conjugationGrid.mixTitle", {
                defaultValue: "Mix · {{tense}}",
                tense: tenseLabelOf(config, round.tense),
              })
        }
        onRetry={() =>
          round.kind === "verb" ? startVerbRound(makeRoundSeed()) : startMixRound(makeRoundSeed())
        }
        onExit={() => setRound(null)}
      />
    );
  }

  const verbAhead = !!selectedVerb && selectedVerb.introducedAtModule > reachedModule;

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* Slim header, ja-hub style */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          {t("practice.conjugationGrid.title", { defaultValue: "Conjugation grid" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.conjugationGrid.subtitle", {
            defaultValue: "Pick a verb and a tense, then fill the six-person grid.",
          })}
        </p>
      </div>

      {/* Tense tabs */}
      <SegmentedControl
        value={tense}
        onChange={setTense}
        fullWidth
        ariaLabel={t("practice.conjugationGrid.tenseTabsAria", { defaultValue: "Tense" })}
        options={config.tenses.map((tn) => ({
          value: tn.id,
          label: <span lang="es">{tn.label}</span>,
        }))}
      />

      {/* Verb picker — grouped by conjugation class, advisory module chips */}
      <VerbPicker
        entries={entries}
        reachedModule={reachedModule}
        selectedId={verbId}
        onSelect={setPickedVerbId}
      />

      {/* Preview of the paradigm to be drilled — cells stay hidden until earned */}
      <GridBoard
        columnMajor
        cells={config.persons.map((p) => ({
          key: p.id,
          label: p.label,
          note: p.note,
          status: "pending" as GridCellStatus,
        }))}
      />

      {/* Actions */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => startVerbRound()}
          disabled={!selectedVerb}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-accent transition hover:bg-accent-hover active:translate-y-[2px] disabled:opacity-50"
        >
          <span>
            {t("practice.conjugationGrid.drillCta", {
              defaultValue: "Drill {{lemma}} · {{tense}}",
              lemma: selectedVerb?.lemma ?? "",
              tense: tenseLabelOf(config, tense),
            })}
          </span>
          <Icon name="arrowRight" size={16} aria-hidden />
        </button>
        {verbAhead && (
          <p className="text-center text-xs text-text-muted">
            {t("practice.conjugationGrid.aheadNote", {
              defaultValue: "Recommended from Module {{module}} — open anyway.",
              module: selectedVerb?.introducedAtModule,
            })}
          </p>
        )}
        <button
          type="button"
          onClick={() => startMixRound()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-text-primary transition active:translate-y-[2px]"
        >
          <Icon name="refresh" size={16} aria-hidden />
          {t("practice.conjugationGrid.mixCta", {
            defaultValue: "Mix round — random cells · {{tense}}",
            tense: tenseLabelOf(config, tense),
          })}
        </button>
      </div>
    </div>
  );
}

function tenseLabelOf(config: ConjugationGridConfig, tense: EsTenseId): string {
  return config.tenses.find((tn) => tn.id === tense)?.label ?? tense;
}

// ─── Drill session ───────────────────────────────────────────────────────

type Answer = { correct: boolean; picked: string };

/**
 * One round: visible grid on top (cells fill as answered), MCQ card below,
 * summary with retry when the 6 are done. Practice-only — no grading writes.
 */
function GridDrillSession({
  round,
  config,
  title,
  onRetry,
  onExit,
}: {
  round: Round;
  config: ConjugationGridConfig;
  title: string;
  onRetry: () => void;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const { questions } = round;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);

  const advance = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const statusFor = (qi: number): GridCellStatus => {
    if (qi < answers.length) return answers[qi].correct ? "correct" : "wrong";
    if (qi === index && !finished) return "current";
    return "pending";
  };

  const cellFor = (qi: number): GridBoardCell => {
    const q = questions[qi];
    const status = statusFor(qi);
    return {
      key: `${q.verbId}:${q.person}`,
      label: round.kind === "mix" ? `${q.lemma} · ${q.personLabel}` : q.personLabel,
      note: round.kind === "mix" ? undefined : q.personNote,
      status,
      value: q.correct,
      picked: status === "wrong" ? answers[qi].picked : undefined,
    };
  };

  // Verb rounds show the canonical table (questions are asked in seeded
  // order — map them back to textbook person order); mix rounds fill in
  // question order.
  const boardCells: GridBoardCell[] =
    round.kind === "verb"
      ? config.persons.map((p) => cellFor(questions.findIndex((q) => q.person === p.id)))
      : questions.map((_, qi) => cellFor(qi));

  const current = questions[index];

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Slim header: exit round + round title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
          aria-label={t("practice.conjugationGrid.backToPicker", {
            defaultValue: "Choose another verb",
          })}
        >
          <Icon name="arrowLeft" size={16} />
        </button>
        <h1 lang="es" className="text-xl font-bold text-text-primary">
          {title}
        </h1>
      </div>

      {finished ? (
        <GridRoundSummary
          questions={questions}
          results={answers.map((a) => a.correct)}
          showLemma={round.kind === "mix"}
          onRetry={onRetry}
          retryLabel={
            round.kind === "verb"
              ? t("practice.conjugationGrid.retryRound", { defaultValue: "Drill again" })
              : t("practice.conjugationGrid.newMix", { defaultValue: "New mix" })
          }
          onBack={onExit}
        />
      ) : (
        <>
          {/* Numberless progress (lesson-style) */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(answers.length / questions.length) * 100}%` }}
            />
          </div>

          <GridBoard cells={boardCells} columnMajor={round.kind === "verb"} />

          {current && (
            // key remounts the card per question — answer state resets by construction.
            <GridDrillCard
              key={index}
              question={current}
              onResult={(correct, picked) =>
                setAnswers((prev) => [...prev, { correct, picked }])
              }
              onNext={advance}
            />
          )}
        </>
      )}
    </div>
  );
}
