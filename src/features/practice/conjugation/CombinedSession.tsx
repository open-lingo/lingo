import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import type { ChainForm, IAdjForm } from "@/features/languages/ja/conjugationEngine";
import { useCourseLevel } from "../useCourseLevel";
import {
  getTrainerType,
  effectivePoolModule,
  isSelectionAhead,
  type TrainerTypeId,
} from "./trainerRegistry";
import {
  buildCombinedSession,
  gradeCombinedSessionIfOnPath,
  type TrainerQuestion,
} from "./trainerSession";
import { DrillQuestionCard } from "./DrillQuestionCard";
import { SessionSummary } from "./SessionSummary";
import { TYPE_GLYPH, TYPE_COLOR_VAR, CONJ_TYPE_COLOR_CSS } from "./typeColors";

/**
 * Combined multi-tile drill route (`practice/conjugation/train?types=a,b,c`,
 * v1.2 Task 7). Same per-question card as TrainerTypeSession, driven by
 * buildCombinedSession + gradeCombinedSessionIfOnPath. Grading fires exactly ONCE per
 * completed session (gradedRef, mirroring the trainer).
 */
export function CombinedSession() {
  const [params] = useSearchParams();
  const reachedModule = useCourseLevel();
  const langPath = useLangPath();

  // Locked types pass the guard since v1.5 learn-ahead — the hub's dialog
  // already interposed (or was "don't ask again"-ed); a selection containing
  // ANY ahead type runs practice-only (no SRS, see Session below).
  const selected = useMemo<TrainerTypeId[]>(() => {
    const raw = (params.get("types") ?? "").split(",").map((s) => s.trim());
    const valid: TrainerTypeId[] = [];
    for (const id of raw) {
      const type = getTrainerType(id);
      if (type) valid.push(type.id);
    }
    // Dedupe preserving order.
    return [...new Set(valid)];
  }, [params]);

  // Combos are explicit hub intent (v1.4.1): "&combos=0" = mixed drill
  // (individuals only); anything else — including legacy links without the
  // param — includes the selection's stacked forms unconditionally.
  const withCombos = params.get("combos") !== "0";

  // A combined session needs 2+ valid, unlocked tiles; otherwise fall back to hub.
  if (selected.length < 2) {
    return <Navigate to={langPath("practice/conjugation")} replace />;
  }
  return (
    <Session selected={selected} reachedModule={reachedModule} withCombos={withCombos} />
  );
}

function Session({
  selected,
  reachedModule,
  withCombos,
}: {
  selected: TrainerTypeId[];
  reachedModule: number;
  withCombos: boolean;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  // Learn-ahead (v1.5): one ahead tile makes the whole session practice-only.
  // The pool rises to the latest unlock module among the selection; kanji
  // exposure stays on the REAL reachedModule (DrillQuestionCard prop below).
  const ahead = isSelectionAhead(selected, reachedModule);
  const poolModule = effectivePoolModule(selected, reachedModule);

  const [questions, setQuestions] = useState<TrainerQuestion[]>(() =>
    buildCombinedSession(selected, poolModule, { combos: withCombos ? "on" : "off" }),
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  // Once-per-completion grade guard (mirrors TrainerTypeSession's gradedRef):
  // grading is a pure grade-now primitive with no double-fire protection, so
  // the UI owns the guard. "Train again" resets it (restart()). Ahead sessions
  // flip the ref too — the skip lives in gradeCombinedSessionIfOnPath.
  const gradedRef = useRef(false);
  useEffect(() => {
    if (finished && !gradedRef.current) {
      const formsDrilled = questions.map((q) => q.form as ChainForm | IAdjForm);
      gradeCombinedSessionIfOnPath(selected, reachedModule, formsDrilled, results);
      gradedRef.current = true;
    }
  }, [finished, questions, results, selected, reachedModule]);

  const advance = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const restart = () => {
    gradedRef.current = false;
    setQuestions(buildCombinedSession(selected, poolModule, { combos: withCombos ? "on" : "off" }));
    setIndex(0);
    setResults([]);
    setFinished(false);
  };

  const header = (
    <div className="flex items-center gap-3">
      <style>{CONJ_TYPE_COLOR_CSS}</style>
      <Link
        to={langPath("practice/conjugation")}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
        aria-label={t("practice.conjugation.backToTrainer", {
          defaultValue: "Back to trainer",
        })}
      >
        <Icon name="arrowLeft" size={16} />
      </Link>
      <h1 className="flex items-center gap-2 text-xl font-bold text-text-primary">
        {t("practice.conjugation.combinedTitle", { defaultValue: "Train together" })}
        {/* The selected tiles as their hub glyph chips — same visual language
            as the drill card's build stack. */}
        <span className="flex items-center gap-1" lang="ja">
          {selected.map((id, i) => (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-sm font-bold text-text-muted" aria-hidden>
                  +
                </span>
              )}
              <span
                className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-sm font-extrabold leading-none"
                style={{
                  color: `var(${TYPE_COLOR_VAR[id]})`,
                  borderColor: `color-mix(in srgb, var(${TYPE_COLOR_VAR[id]}) 55%, transparent)`,
                  background: `color-mix(in srgb, var(${TYPE_COLOR_VAR[id]}) 12%, transparent)`,
                }}
              >
                {TYPE_GLYPH[id]}
              </span>
            </span>
          ))}
        </span>
      </h1>
    </div>
  );

  if (questions.length === 0) {
    return (
      <div className="conj-scope mx-auto max-w-3xl space-y-5">
        {header}
        <Card padding="lg" className="text-center text-sm text-text-secondary">
          {t("practice.conjugation.noQuestions", {
            defaultValue: "No drill items available yet for this type.",
          })}
        </Card>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="conj-scope mx-auto max-w-3xl space-y-5">
        {header}
        <SessionSummary
          questions={questions}
          results={results}
          practiceOnly={ahead}
          onAgain={restart}
          againLabel={t("practice.conjugation.trainAgain", { defaultValue: "Train again" })}
          backTo={langPath("practice/conjugation")}
        />
      </div>
    );
  }

  const answered = results.length;
  const total = questions.length;
  const current = questions[index];

  return (
    <div className="conj-scope mx-auto max-w-3xl space-y-5">
      {header}

      {/* Numberless progress (lesson-style) */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>

      {current && (
        // key remounts the card per question — internal answer/peek/stuck
        // state resets by construction.
        <DrillQuestionCard
          key={index}
          question={current}
          reachedModule={reachedModule}
          onResult={(credit) => setResults((prev) => [...prev, credit])}
          onNext={advance}
        />
      )}
    </div>
  );
}
