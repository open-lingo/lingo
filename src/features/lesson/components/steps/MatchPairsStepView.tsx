import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MatchPairsStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedJa } from "@/shared/japanese";
import { playJaAudio, getTtsUrl } from "@/shared/japanese/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

/** Tiny seeded shuffle so the order is deterministic per step.id but
 *  the two columns scramble independently. Without this the source +
 *  target lined up adjacent because both columns iterated `step.pairs`
 *  in author order, which gave away the answer on every row. */
function shuffleSeeded<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 16807) % 2147483647;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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

/** Max wrong taps before the step fails out. Three-strike model per
 *  Spencer 2026-05-17: per-match grading, 3 dots at top, fail on 3rd
 *  mistake — no retry, step is marked incorrect and Continue appears. */
const MAX_MISTAKES = 3;

/**
 * Match Pairs — Duolingo-style with 3-strike grading.
 *
 * - Learner taps a source OR a target first (bidirectional).
 * - Tapping the opposite column commits the pair. Correct stays green and
 *   locks; wrong shakes red ~500ms, dot turns off at the top.
 * - 3 mistakes → step fails out: tiles disable, "Out of attempts" surfaces,
 *   Continue with `incorrect` variant. Otherwise step auto-completes when
 *   all pairs matched.
 *
 * Dots at top render as 3 small circles — filled accent when available,
 * outlined muted once spent. No words; learners infer from the red flash
 * on miss + the dot dimming in sync.
 */
export function MatchPairsStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
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
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const allMatched = matched.size === step.pairs.length;
  const failed = mistakes >= MAX_MISTAKES;
  const finished = allMatched || failed;

  useLessonKeyboard({
    onEnter: () => {
      if (finished && !celebrating) onContinue();
    },
    enabled: finished && !celebrating,
  });

  // Auto-complete on either pass (all matched, <MAX mistakes) or fail
  // (>=MAX mistakes mid-grid). Pass criterion is now "no fail" so the
  // learner is allowed up to 2 mistakes without the step being marked
  // incorrect — Spencer's call.
  useEffect(() => {
    if (failed) onComplete(step.id, false);
    else if (allMatched) {
      onComplete(step.id, mistakes < MAX_MISTAKES);
      // Celebrate only on a clean pass — finished without any wrong taps.
      // Matches the MCQ "first-attempt correct" semantics: a flawless run.
      if (mistakes === 0) {
        setCelebrationText(pickCelebrationText(t));
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      }
    }
  }, [allMatched, failed, mistakes, onComplete, step.id, t]);

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
    if (finished || matched.has(pairId)) return;
    // Audio-on-select: kana side plays its TTS when tapped so the learner
    // hears the sound while pairing. Gated by step.playAudioOnSelect so
    // M1 review match steps (English↔English) stay silent.
    if (step.playAudioOnSelect && side === "source") {
      const pair = step.pairs.find((p) => p.id === pairId);
      if (pair && getTtsUrl(pair.source)) {
        void playJaAudio(pair.source);
      }
    }
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
      "motion-safe:animate-shake border-error bg-error/10 text-error",
  };

  // Independently shuffle each column so source[i] never lines up with
  // target[i]. Deterministic per step.id (different seed suffix per
  // column so the two scrambles diverge).
  const sourceOrder = useMemo(
    () => shuffleSeeded(step.pairs, `${step.id}::src`),
    [step.id, step.pairs],
  );
  const targetOrder = useMemo(
    () => shuffleSeeded(step.pairs, `${step.id}::tgt`),
    [step.id, step.pairs],
  );

  // Equal-height rows for both columns: declare a single grid that owns both
  // sides. `grid-rows-[repeat(n,minmax(0,1fr))]` keeps row heights synced.
  const rows = step.pairs.length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-text-primary">
          {step.prompt}
        </h2>
        <MistakeDots used={mistakes} max={MAX_MISTAKES} />
      </div>

      <div
        className="relative grid grid-cols-2 gap-3 sm:gap-4"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(64px, auto))` }}
      >
        {/* Render row-by-row so the auto-rows lock both columns to the same
         *  height per row even when the kana side has a ruby helper. */}
        {sourceOrder.map((pair, idx) => (
          <SourceTile
            key={`s-${pair.id}`}
            pair={pair}
            style={stateStyles[tileState("source", pair.id)]}
            disabled={matched.has(pair.id) || finished}
            onClick={() => handleClick("source", pair.id)}
            row={idx + 1}
            audioOnSelect={!!step.playAudioOnSelect}
          />
        ))}
        {targetOrder.map((pair, idx) => (
          <TargetTile
            key={`t-${pair.id}`}
            pair={pair}
            style={stateStyles[tileState("target", pair.id)]}
            disabled={matched.has(pair.id) || finished}
            onClick={() => handleClick("target", pair.id)}
            row={idx + 1}
            audioOnSelect={!!step.playAudioOnSelect}
          />
        ))}
        {celebrating && <CelebrationToast text={celebrationText} />}
      </div>

      {failed && (
        <div className="motion-safe:animate-fade-up rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          Out of attempts. Continuing — you can come back to this lesson later.
        </div>
      )}

      {finished && (
        celebrating ? (
          <div className="invisible" aria-hidden>
            <ContinueButton onClick={() => {}} />
          </div>
        ) : (
          <div className="motion-safe:animate-fade-up">
            <ContinueButton
              onClick={onContinue}
              variant={failed || mistakes > 0 ? "incorrect" : "correct"}
            />
          </div>
        )
      )}
    </div>
  );
}

/** Three small dots showing mistakes remaining. Solid accent = available,
 *  outlined muted = spent. No labels — Spencer's call: learners infer
 *  from the red flash on miss + the dot dimming. */
function MistakeDots({ used, max }: { used: number; max: number }) {
  return (
    <div className="flex items-center gap-1.5 pt-1" aria-label={`${max - used} attempts left`}>
      {Array.from({ length: max }, (_, i) => {
        const spent = i < used;
        return (
          <span
            key={i}
            className={`block h-2.5 w-2.5 rounded-full border transition-colors duration-200 ${
              spent
                ? "border-border bg-transparent"
                : "border-accent bg-accent"
            }`}
            aria-hidden
          />
        );
      })}
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

type SourceTileProps = TileProps & {
  /** When the step has playAudioOnSelect, the source side is a kana
   *  recall cue — render plain text in a larger font, no ruby (the
   *  audio is the romaji channel; on-tile ruby gives away the answer). */
  audioOnSelect: boolean;
};

function SourceTile({ pair, style, disabled, onClick, row, audioOnSelect }: SourceTileProps) {
  const sizeClass = audioOnSelect
    ? "text-3xl sm:text-4xl font-semibold py-5"
    : "text-base font-medium py-3";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ gridColumn: 1, gridRow: row }}
      className={`flex w-full items-center justify-center rounded-xl border-[1.5px] px-4 transition-colors duration-150 ${sizeClass} ${style}`}
    >
      {audioOnSelect ? (
        // Plain text — no ruby, no AnnotatedJa. Romaji on this side
        // would defeat the recall (it IS the answer).
        <span>{pair.source}</span>
      ) : pair.sourceAnnotation ? (
        <AnnotatedJa segments={pair.sourceAnnotation} />
      ) : (
        <AnnotatedJa text={pair.source} />
      )}
    </button>
  );
}

function TargetTile({ pair, style, disabled, onClick, row, audioOnSelect }: SourceTileProps) {
  const sizeClass = audioOnSelect
    ? "text-2xl sm:text-3xl font-semibold py-5"
    : "text-base font-medium py-3";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ gridColumn: 2, gridRow: row }}
      className={`flex w-full items-center justify-center rounded-xl border-[1.5px] px-4 transition-colors duration-150 ${sizeClass} ${style}`}
    >
      {pair.target}
    </button>
  );
}
