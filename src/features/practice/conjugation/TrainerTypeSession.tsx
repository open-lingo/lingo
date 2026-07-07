import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { GrammarRuleStepView } from "@/features/lesson/components/steps/GrammarRuleStepView";
import { getGrammarRuleStepForPoint } from "@/features/lesson/data/grammarReviewPools";
import { useCourseLevel } from "../useCourseLevel";
import {
  getTrainerType,
  effectivePoolModule,
  isSelectionAhead,
  type ConjugationTrainerType,
} from "./trainerRegistry";
import {
  buildTrainerSession,
  gradeTrainerSessionIfOnPath,
  typeMasteryPercent,
  type TrainerQuestion,
} from "./trainerSession";
import { DrillQuestionCard } from "./DrillQuestionCard";
import { SessionSummary } from "./SessionSummary";
import { CONJ_TYPE_COLOR_CSS } from "./typeColors";

/** Route guard: unknown type → hub. Locked types are allowed through since
 *  v1.5 learn-ahead — the hub's dialog is the courtesy gate, not a permission;
 *  ahead sessions run practice-only (no SRS, see DrillSegment). */
export function TrainerTypeSession() {
  const { typeId } = useParams<{ typeId: string }>();
  const reachedModule = useCourseLevel();
  const langPath = useLangPath();

  const type = typeId ? getTrainerType(typeId) : undefined;
  if (!type) {
    return <Navigate to={langPath("practice/conjugation")} replace />;
  }
  return <TrainerSession type={type} reachedModule={reachedModule} />;
}

/**
 * The type page IS the drill (tabs removed — Spencer 2026-07-05: "what is the
 * learn tab even for"). The curriculum's tagged rule card shows ONCE as a
 * first-run intro (zero mastery + a card exists) with "Got it" dropping into
 * the drill; the formation reference lives behind the drill card's cheat-sheet
 * button. Types without a tagged rule card go straight to the drill — the old
 * Learn tab only mirrored the cheat sheet for those anyway.
 */
function TrainerSession({
  type,
  reachedModule,
}: {
  type: ConjugationTrainerType;
  reachedModule: number;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  const ruleStep = useMemo(
    () => getGrammarRuleStepForPoint(type.grammarPointIds[0]),
    [type],
  );
  // Decided once at mount — completing the intro mid-session must not resurface it.
  const [intro, setIntro] = useState(
    () => !!ruleStep && typeMasteryPercent(type.id) === 0,
  );

  return (
    <div className="conj-scope mx-auto max-w-3xl space-y-5">
      <style>{CONJ_TYPE_COLOR_CSS}</style>
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
        <h1 className="text-xl font-bold text-text-primary">{type.title}</h1>
      </div>

      {intro && ruleStep ? (
        <Card padding="lg">
          <div className="flex flex-col">
            {/* GrammarRuleStepView always renders a "Got it" CTA — wire it to
                start the drill rather than leaving a dead button. */}
            <GrammarRuleStepView step={ruleStep} onContinue={() => setIntro(false)} />
          </div>
        </Card>
      ) : (
        <DrillSegment type={type} reachedModule={reachedModule} />
      )}
    </div>
  );
}

// ─── Drill ─────────────────────────────────────────────────────────────

function DrillSegment({
  type,
  reachedModule,
}: {
  type: ConjugationTrainerType;
  reachedModule: number;
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  // Learn-ahead (v1.5): an ahead session draws its pool from the type's
  // unlock module (the reached-module pool can be empty — entries start at
  // m7) and writes NO SRS. Kanji exposure stays on the REAL reachedModule
  // (DrillQuestionCard prop below) — an early learner still sees kana.
  const ahead = isSelectionAhead([type.id], reachedModule);
  const poolModule = effectivePoolModule([type.id], reachedModule);

  const [questions, setQuestions] = useState<TrainerQuestion[]>(() =>
    buildTrainerSession(type, poolModule),
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  // The once-only grade guard: grading has NO internal double-fire
  // protection, so the UI owns it. The ref flips the first time a finished
  // session is graded and blocks the StrictMode double-effect; "Drill again"
  // resets it (see restart()). Fires exactly once per completed drill.
  // (Ahead sessions flip the ref too — the skip decision lives in
  // gradeTrainerSessionIfOnPath, not here.)
  const gradedRef = useRef(false);
  useEffect(() => {
    if (finished && !gradedRef.current) {
      gradeTrainerSessionIfOnPath(type, reachedModule, results);
      gradedRef.current = true;
    }
  }, [finished, type, reachedModule, results]);

  const advance = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const restart = () => {
    gradedRef.current = false;
    setQuestions(buildTrainerSession(type, poolModule));
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
        backTo={langPath("practice/conjugation")}
      />
    );
  }

  const answered = results.length;
  const total = questions.length;
  const current = questions[index];

  return (
    <div className="space-y-4">
      {/* Numberless progress (lesson-style) */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>

      {current && (
        // key remounts the card per question — its internal answer/peek/stuck
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
