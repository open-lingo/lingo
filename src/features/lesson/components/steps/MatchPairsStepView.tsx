import { useState, useCallback } from "react";
import type { MatchPairsStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";

type Props = {
  step: MatchPairsStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

type MatchState = "idle" | "selected" | "matched" | "wrong";

export function MatchPairsStepView({ step, onComplete, onContinue }: Props) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ source: string; target: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const allMatched = matched.size === step.pairs.length;

  const handleSourceClick = useCallback(
    (pairId: string) => {
      if (submitted || matched.has(pairId)) return;
      setWrongPair(null);
      setSelectedSource((prev) => (prev === pairId ? null : pairId));
    },
    [submitted, matched],
  );

  const handleTargetClick = useCallback(
    (pairId: string) => {
      if (submitted || !selectedSource || matched.has(pairId)) return;

      if (selectedSource === pairId) {
        setMatched((prev) => new Set([...prev, pairId]));
        setSelectedSource(null);
        setWrongPair(null);
      } else {
        setWrongPair({ source: selectedSource, target: pairId });
        setMistakes((m) => m + 1);
        setTimeout(() => {
          setWrongPair(null);
          setSelectedSource(null);
        }, 600);
      }
    },
    [submitted, selectedSource, matched],
  );

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, mistakes === 0);
  }

  function getSourceState(pairId: string): MatchState {
    if (matched.has(pairId)) return "matched";
    if (wrongPair?.source === pairId) return "wrong";
    if (selectedSource === pairId) return "selected";
    return "idle";
  }

  function getTargetState(pairId: string): MatchState {
    if (matched.has(pairId)) return "matched";
    if (wrongPair?.target === pairId) return "wrong";
    return "idle";
  }

  const stateStyles: Record<MatchState, string> = {
    idle: "border-gray-200 bg-white hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-emerald-600",
    selected: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-900/20",
    matched: "border-emerald-400 bg-emerald-50 opacity-60 dark:border-emerald-600 dark:bg-emerald-900/20",
    wrong: "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20",
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {step.prompt}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {step.pairs.map((pair) => (
            <button
              key={pair.id}
              type="button"
              disabled={submitted || matched.has(pair.id)}
              onClick={() => handleSourceClick(pair.id)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${stateStyles[getSourceState(pair.id)]}`}
            >
              {pair.source}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {step.pairs.map((pair) => (
            <button
              key={pair.id}
              type="button"
              disabled={submitted || matched.has(pair.id) || !selectedSource}
              onClick={() => handleTargetClick(pair.id)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${stateStyles[getTargetState(pair.id)]}`}
            >
              {pair.target}
            </button>
          ))}
        </div>
      </div>

      {submitted && (
        <Feedback correct={mistakes === 0} explanation={mistakes > 0 ? `${mistakes} mistake${mistakes > 1 ? "s" : ""}` : undefined} />
      )}

      {!submitted && allMatched ? (
        <ContinueButton onClick={handleSubmit} label="Check" />
      ) : submitted ? (
        <ContinueButton
          onClick={onContinue}
          variant={mistakes === 0 ? "correct" : "incorrect"}
        />
      ) : null}
    </div>
  );
}
