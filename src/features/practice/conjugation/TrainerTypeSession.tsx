import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { completeTrainerNode } from "./trainerNodeCompletion";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { GrammarRuleStepView } from "@/features/lesson/components/steps/GrammarRuleStepView";
import type { GrammarRuleStep } from "@/features/lesson/types";
import type { ConjugationTrainerProvider, ConjTrainerTypeMeta, ConjTrainerQuestion } from "@/shared/conjugation/types";
import { useCourseLevel } from "../useCourseLevel";
import { useConjugation } from "./useConjugation";
import { DrillQuestionCard } from "./DrillQuestionCard";
import { SessionSummary } from "./SessionSummary";

/** Route guard: unknown type / no provider → hub. Locked types pass (learn-ahead). */
export function TrainerTypeSession() {
  const { typeId } = useParams<{ typeId: string }>();
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get("node");
  const reachedModule = useCourseLevel();
  const langPath = useLangPath();
  const conj = useConjugation();

  const type = conj && typeId ? conj.getType(typeId) : undefined;
  if (!conj || !type || !typeId) {
    return <Navigate to={langPath("practice/grammar/conjugation")} replace />;
  }
  return (
    <TrainerSession
      conj={conj}
      typeId={typeId}
      type={type}
      reachedModule={reachedModule}
      nodeId={nodeId}
    />
  );
}

function TrainerSession({
  conj,
  typeId,
  type,
  reachedModule,
  nodeId,
}: {
  conj: ConjugationTrainerProvider;
  typeId: string;
  type: ConjTrainerTypeMeta;
  reachedModule: number;
  /** Path node that launched this drill, when any — see `lessonRoutePath`. */
  nodeId: string | null;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  const ruleStep = useMemo(() => conj.getIntroStep(typeId), [conj, typeId]);
  const [intro, setIntro] = useState(() => !!ruleStep && conj.typeMasteryPercent(typeId) === 0);

  return (
    <div className="conj-scope mx-auto max-w-3xl space-y-5">
      <style>{conj.scopeCss}</style>
      <div className="flex items-center gap-3">
        <Link
          to={langPath("practice/grammar/conjugation")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
          aria-label={t("practice.conjugation.backToTrainer", { defaultValue: "Back to trainer" })}
        >
          <Icon name="arrowLeft" size={16} />
        </Link>
        <h1 className="text-xl font-bold text-text-primary">{type.title}</h1>
      </div>

      {intro && ruleStep ? (
        <Card padding="lg">
          <div className="flex flex-col">
            <GrammarRuleStepView
              step={ruleStep as GrammarRuleStep}
              onContinue={() => setIntro(false)}
            />
          </div>
        </Card>
      ) : (
        <DrillSegment
          conj={conj}
          typeId={typeId}
          reachedModule={reachedModule}
          nodeId={nodeId}
        />
      )}
    </div>
  );
}

function DrillSegment({
  conj,
  typeId,
  reachedModule,
  nodeId,
}: {
  conj: ConjugationTrainerProvider;
  typeId: string;
  reachedModule: number;
  nodeId: string | null;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  const ahead = conj.isSelectionAhead([typeId], reachedModule);
  const poolModule = conj.effectivePoolModule([typeId], reachedModule);

  const [questions, setQuestions] = useState<ConjTrainerQuestion[]>(() =>
    conj.buildSession(typeId, poolModule),
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const gradedRef = useRef(false);
  useEffect(() => {
    if (finished && !gradedRef.current) {
      conj.gradeSessionIfOnPath(typeId, reachedModule, results);
      // Launched from a path node → mark that node done, or the module never
      // unlocks. No-ops for hub-launched drills (no `node` param).
      completeTrainerNode(nodeId, results);
      gradedRef.current = true;
    }
  }, [finished, conj, typeId, reachedModule, results, nodeId]);

  const advance = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const restart = () => {
    gradedRef.current = false;
    setQuestions(conj.buildSession(typeId, poolModule));
    setIndex(0);
    setResults([]);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <Card padding="lg" className="text-center text-sm text-text-secondary">
        {t("practice.conjugation.noQuestions", {
          defaultValue: "No drill items available yet for this type.",
        })}
      </Card>
    );
  }

  if (finished) {
    return (
      <SessionSummary
        questions={questions}
        results={results}
        practiceOnly={ahead}
        onAgain={restart}
        againLabel={t("practice.conjugation.drillAgain", { defaultValue: "Drill again" })}
        backTo={langPath("practice/grammar/conjugation")}
      />
    );
  }

  const answered = results.length;
  const total = questions.length;
  const current = questions[index];

  return (
    <div className="space-y-4">
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
