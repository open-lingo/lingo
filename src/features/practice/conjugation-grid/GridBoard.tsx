import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui";

export type GridCellStatus = "pending" | "current" | "correct" | "wrong";

export type GridBoardCell = {
  key: string;
  /** Person label ("él / ella / usted") — mix rounds prefix the lemma. */
  label: string;
  /** Regional note ("Spain" on vosotros). */
  note?: string;
  status: GridCellStatus;
  /** The CORRECT form — shown once the cell is answered (wrong answers are
   *  shown corrected, marked). */
  value?: string;
  /** The learner's incorrect pick, struck through under the corrected form. */
  picked?: string;
};

/**
 * The visible paradigm: 6 cells that fill in as the round is answered
 * (right = filled green; wrong = the correct form shown, marked red with the
 * learner's pick struck through — the grid always ends up a true table).
 *
 * `columnMajor` renders the classic textbook layout — singulars down the
 * first column (yo/tú/él), plurals down the second — for single-verb rounds.
 * Mix rounds pass cells in question order (row-major fill).
 */
export function GridBoard({
  cells,
  columnMajor = false,
}: {
  cells: GridBoardCell[];
  columnMajor?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", columnMajor && "grid-flow-col grid-rows-3")}>
      {cells.map((cell) => (
        <BoardCell key={cell.key} cell={cell} />
      ))}
    </div>
  );
}

const CELL_CLASS: Record<GridCellStatus, string> = {
  pending: "border-border bg-surface",
  current: "border-accent bg-surface shadow-card",
  correct: "border-green-500/60 bg-green-50 dark:border-green-500/50 dark:bg-green-500/10",
  wrong: "border-red-500/60 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10",
};

function BoardCell({ cell }: { cell: GridBoardCell }) {
  const { label, note, status, value, picked } = cell;
  const answered = status === "correct" || status === "wrong";

  return (
    <div
      className={cn(
        "flex min-h-[64px] flex-col justify-center rounded-lg border-2 px-3 py-1.5 transition-colors",
        CELL_CLASS[status],
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span lang="es" className="truncate text-[10px] font-semibold text-text-muted">
          {label}
          {note ? <span className="font-normal opacity-75"> — {note}</span> : null}
        </span>
        {status === "correct" && (
          <Icon
            name="check"
            size={12}
            className="shrink-0 text-green-600 dark:text-green-400"
            aria-hidden
          />
        )}
        {status === "wrong" && (
          <Icon
            name="close"
            size={12}
            className="shrink-0 text-red-600 dark:text-red-400"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span
          lang={answered ? "es" : undefined}
          className={cn(
            "truncate text-sm font-semibold",
            status === "correct" && "text-green-800 dark:text-green-300",
            status === "wrong" && "text-red-800 dark:text-red-300",
            status === "current" && "text-accent",
            status === "pending" && "text-text-muted/50",
          )}
        >
          {answered && value ? value : status === "current" ? "?" : "···"}
        </span>
        {status === "wrong" && picked && picked !== value ? (
          <span
            lang="es"
            className="truncate text-[10px] text-red-700/70 line-through dark:text-red-300/60"
          >
            {picked}
          </span>
        ) : null}
      </div>
    </div>
  );
}
