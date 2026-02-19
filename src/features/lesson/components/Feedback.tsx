type Props = {
  correct: boolean;
  explanation?: string;
};

export function Feedback({ correct, explanation }: Props) {
  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
        correct
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      <span className="font-semibold">{correct ? "Correct!" : "Incorrect"}</span>
      {explanation && <p className="mt-1">{explanation}</p>}
    </div>
  );
}
