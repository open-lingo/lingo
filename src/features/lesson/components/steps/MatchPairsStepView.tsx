import { useEffect, useState } from "react";
import type { MatchPairsStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedJa } from "@/shared/japanese";

type Props = {
  step: MatchPairsStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Sub-state per tile, so we can drive the visual feedback purely from a
 * single source of truth.
 */
type TileState = "idle" | "selected" | "matched" | "wrong";

/**
 * Match Pairs — Duolingo-style. No Check button:
 *
 * - The learner taps a source OR a target first (bidirectional).
 * - Tapping the opposite column commits the pair. Correct stays green and
 *   locks; wrong shakes red ~500ms then clears selection.
 * - Step auto-completes when all pairs are matched. Continue replaces the
 *   grid in the same vertical slot (no layout jump).
 *
 * Mistake count is tracked for an optional `incorrect` Continue variant.
 * Reach into `MatchPairsStep` for the pair IDs; pairs share an `id` across
 * source/target so we don't need a second join field.
 */
export function MatchPairsStepView({ step, onComplete, onContinue }: Props) {
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<
    | { side: "source" | "target"; pairId: string }
    | null
  >(null);
  const [wrong, setWrong] = useState<{
    source: string | null;
    target: string | null;
  }>({ source: null, target: null });
  const [mistakes, setMistakes] = useState(0);

  const allMatched = matched.size === step.pairs.length;

  // Auto-complete once everything is matched. Single onComplete + a beat
  // before Continue surfaces, so the green flash is visible.
  useEffect(() => {
    if (allMatched) onComplete(step.id, mistakes === 0);
  }, [allMatched, mistakes, onComplete, step.id]);

  function attemptPair(a: { side: string; pairId: string }, b: { side: string; pairId: string }) {
    if (a.pairId === b.pairId) {
      setMatched((prev) => new Set([...prev, a.pairId]));
      setSelected(null);
      setWrong({ source: null, target: null });
      return;
    }
    // Visual shake on both sides for ~500ms, then clear selection.
    setWrong({
      source: a.side === "source" ? a.pairId : b.pairId,
      target: a.side === "target" ? a.pairId : b.pairId,
    });
    setMistakes((m) => m + 1);
    setTimeout(() => {
      setWrong({ source: null, target: null });
      setSelected(null);
    }, 520);
  }

  function handleClick(side: "source" | "target", pairId: string) {
    if (allMatched || matched.has(pairId)) return;
    if (!selected) {
      setSelected({ side, pairId });
      return;
    }
    if (selected.side === side) {
      // Same column re-tap — just move the selection.
      setSelected({ side, pairId });
      return;
    }
    attemptPair(selected, { side, pairId });
  }

  function tileState(side: "source" | "target", pairId: string): TileState {
    if (matched.has(pairId)) return "matched";
    if (side === "source" && wrong.source === pairId) return "wrong";
    if (side === "target" && wrong.target === pairId) return "wrong";
    if (selected && selected.side === side && selected.pairId === pairId)
      return "selected";
    return "idle";
  }

  const stateStyles: Record<TileState, string> = {
    idle:
      "border-border bg-surface text-text-primary hover:border-accent",
    selected:
      "border-accent bg-accent-muted text-accent",
    matched:
      "border-accent bg-accent-muted text-accent opacity-60",
    wrong:
      "motion-safe:animate-shake border-error bg-red-50 text-error dark:bg-red-950/30",
  };

  // Equal-height rows for both columns: declare a single grid that owns both
  // sides. `grid-rows-[repeat(n,minmax(0,1fr))]` keeps row heights synced.
  const rows = step.pairs.length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-xl font-semibold text-text-primary">
        {step.prompt}
      </h2>

      <div
        className="grid grid-cols-2 gap-3 sm:gap-4"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(64px, auto))` }}
      >
        {/* Render row-by-row so the auto-rows lock both columns to the same
         *  height per row even when the kana side has a ruby helper. */}
        {step.pairs.map((pair, idx) => (
          <SourceTile
            key={`s-${pair.id}`}
            pair={pair}
            style={stateStyles[tileState("source", pair.id)]}
            disabled={matched.has(pair.id) || allMatched}
            onClick={() => handleClick("source", pair.id)}
            row={idx + 1}
          />
        ))}
        {step.pairs.map((pair, idx) => (
          <TargetTile
            key={`t-${pair.id}`}
            pair={pair}
            style={stateStyles[tileState("target", pair.id)]}
            disabled={matched.has(pair.id) || allMatched}
            onClick={() => handleClick("target", pair.id)}
            row={idx + 1}
          />
        ))}
      </div>

      {allMatched && (
        <div className="motion-safe:animate-fade-up">
          <ContinueButton
            onClick={onContinue}
            variant={mistakes === 0 ? "correct" : "incorrect"}
          />
        </div>
      )}
    </div>
  );
}

type TileProps = {
  pair: MatchPairsStep["pairs"][number];
  style: string;
  disabled: boolean;
  onClick: () => void;
  row: number;
};

function SourceTile({ pair, style, disabled, onClick, row }: TileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ gridColumn: 1, gridRow: row }}
      className={`flex w-full items-center justify-start rounded-xl border-[1.5px] px-4 py-3 text-base font-medium transition-colors duration-150 ${style}`}
    >
      {pair.sourceAnnotation ? (
        <AnnotatedJa segments={pair.sourceAnnotation} />
      ) : (
        <AnnotatedJa text={pair.source} />
      )}
    </button>
  );
}

function TargetTile({ pair, style, disabled, onClick, row }: TileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ gridColumn: 2, gridRow: row }}
      className={`flex w-full items-center justify-start rounded-xl border-[1.5px] px-4 py-3 text-base font-medium transition-colors duration-150 ${style}`}
    >
      {pair.target}
    </button>
  );
}
