import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { completeTrainerNode } from "./trainerNodeCompletion";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import type { ConjugationTrainerProvider, ConjTrainerQuestion } from "@/shared/conjugation/types";
import { useCourseLevel } from "../useCourseLevel";
import { useConjugation } from "./useConjugation";
import { DrillQuestionCard } from "./DrillQuestionCard";
import { SessionSummary } from "./SessionSummary";

/**
 * Combined multi-tile drill route (`practice/grammar/conjugation/train?types=a,b,c`).
 * Provider-driven — the language decides whether combos exist; when they don't
 * it degrades to a free-mix of the selected tiles' individual forms.
 */
export function CombinedSession() {
  const [params] = useSearchParams();
  const reachedModule = useCourseLevel();
  const langPath = useLangPath();
  const conj = useConjugation();

  const selected = useMemo<string[]>(() => {
    if (!conj) return [];
    const raw = (params.get("types") ?? "").split(",").map((s) => s.trim());
    const valid: string[] = [];
    for (const id of raw) {
      if (conj.getType(id)) valid.push(id);
    }
    return [...new Set(valid)];
  }, [conj, params]);

  const withCombos = (conj?.supportsCombos ?? false) && params.get("combos") !== "0";
  const nodeId = params.get("node");

  if (!conj || selected.length < 2) {
    return <Navigate to={langPath("practice/grammar/conjugation")} replace />;
  }
  return (
    <Session
      conj={conj}
      selected={selected}
      reachedModule={reachedModule}
      withCombos={withCombos}
      nodeId={nodeId}
    />
  );
}

function Session({
  conj,
  selected,
  reachedModule,
  withCombos,
  nodeId,
}: {
  conj: ConjugationTrainerProvider;
  selected: string[];
  reachedModule: number;
  withCombos: boolean;
  /** Path node that launched this drill, when any — see `lessonRoutePath`. */
  nodeId: string | null;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  const ahead = conj.isSelectionAhead(selected, reachedModule);
  const poolModule = conj.effectivePoolModule(selected, reachedModule);

  const [questions, setQuestions] = useState<ConjTrainerQuestion[]>(() =>
    conj.buildCombinedSession(selected, poolModule, withCombos),
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const gradedRef = useRef(false);
  useEffect(() => {
    if (finished && !gradedRef.current) {
      const forms = questions.map((q) => q.form);
      conj.gradeCombinedSessionIfOnPath(selected, reachedModule, forms, results);
      // Launched from a path node → mark that node done, or the module never
      // unlocks. No-ops for hub-launched drills (no `node` param).
      completeTrainerNode(nodeId, results);
      gradedRef.current = true;
    }
  }, [finished, conj, questions, results, selected, reachedModule, nodeId]);

  const advance = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const restart = () => {
    gradedRef.current = false;
    setQuestions(conj.buildCombinedSession(selected, poolModule, withCombos));
    setIndex(0);
    setResults([]);
    setFinished(false);
  };

  const header = (
    <div className="flex items-center gap-3">
      <style>{conj.scopeCss}</style>
      <Link
        to={langPath("practice/grammar/conjugation")}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
        aria-label={t("practice.conjugation.backToTrainer", { defaultValue: "Back to trainer" })}
      >
        <Icon name="arrowLeft" size={16} />
      </Link>
      <h1 className="flex items-center gap-2 text-xl font-bold text-text-primary">
        {t("practice.conjugation.combinedTitle", { defaultValue: "Train together" })}
        <span className="flex items-center gap-1">
          {selected.map((id, i) => (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-sm font-bold text-text-muted" aria-hidden>
                  +
                </span>
              )}
              <span
                className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-sm font-bold leading-none"
                style={{
                  color: `var(${conj.colorVar(id)})`,
                  borderColor: `color-mix(in srgb, var(${conj.colorVar(id)}) 55%, transparent)`,
                  background: `color-mix(in srgb, var(${conj.colorVar(id)}) 12%, transparent)`,
                }}
              >
                {conj.glyph(id)}
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
          backTo={langPath("practice/grammar/conjugation")}
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

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>

      {current && (
        <DrillQuestionCard
          key={index}
          conj={conj}
          question={current}
          reachedModule={reachedModule}
          onResult={(credit) => setResults((prev) => [...prev, credit])}
          onNext={advance}
        />
      )}
    </div>
  );
}
