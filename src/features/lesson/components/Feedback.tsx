type Props = {
  correct: boolean;
  explanation?: string;
};

/**
 * Soft post-submit banner. Uses the accent token for correct (matching the
 * "tinted selected" treatment on option pills) and a muted error palette for
 * incorrect — never blaring red.
 */
export function Feedback({ correct, explanation }: Props) {
  return (
    <div
      className={`mt-4 rounded-2xl border-[1.5px] px-5 py-4 text-sm ${
        correct
          ? "border-accent bg-accent-muted text-accent"
          : "border-error bg-red-50 text-error dark:bg-red-950/30"
      }`}
    >
      <span className="text-base font-bold">{correct ? "Correct!" : "Not quite"}</span>
      {explanation && <p className="mt-1.5 leading-relaxed opacity-90">{explanation}</p>}
    </div>
  );
}
