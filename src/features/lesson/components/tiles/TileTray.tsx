/**
 * `TileTray` — the containers tiles live in: banks, drop trays, option
 * grids. Companion to `Tile`; same deal (data attributes only, every number
 * in `src/index.css` § "TILE PRIMITIVE"), so gaps come from tokens
 * (`--tile-gap`, `--tile-tray-gap`, `--listen-bank-gap`, `--match-gap`,
 * `--option-gap`) instead of a `gap-3` typed per view.
 *
 * `kind` is the container's role:
 *   bank         the tile bank under a tray (flex-wrap row, `--tile-gap`,
 *                or `--listen-bank-gap` for `variant="listen"`)
 *   tray         the dashed drop area (a GRID with one cell, see `row`)
 *   pill         the word-build review tray — hugs its tiles, centred
 *   slots        the word-build first-encounter wrapper (one grid cell)
 *   row          a row of tiles INSIDE a tray; `layer` stacks it into the
 *                tray's single grid cell so the ghost row and the real
 *                tiles share it and the tray height is max(ghost, actual)
 *   grid         an option grid (2×2 for four options, one column
 *                otherwise), `--option-gap`
 *   options-row  the particle-cloze flex-wrap option row
 *   match-grid   the two-column match grid, `--match-gap`
 *
 * The match `maxHeight` formula lives here rather than in
 * `MatchPairsStepView`: it has to stay in lockstep with the row gap token
 * (`rows * --match-tile-h + (rows-1) * --match-gap`) or rows clip the moment
 * the gap slider moves.
 */
import type { CSSProperties, ReactNode } from "react";

export type TileTrayKind =
  | "bank"
  | "tray"
  | "pill"
  | "slots"
  | "row"
  | "grid"
  | "options-row"
  | "match-grid";

type TileTrayProps = {
  kind: TileTrayKind;
  /** `listen` swaps the bank gap and the tray's border/min-height tier. */
  variant?: "build" | "listen";
  /** `row` only: stack into the parent tray's single grid cell. */
  layer?: boolean;
  /** `row` only: the invisible full-answer pre-sizer row. */
  ghost?: boolean;
  /** `row` only: cap the ghost at two phone rows (listen tray). */
  clamp?: boolean;
  /** `row` only: `align-content: flex-start` (wrapping tile rows). */
  align?: "start";
  /** `row`: `tight` = a fixed 0.5rem gap (word-build slots + pill).
   *  `grid`: `tight` = a fixed 0.75rem gap (the ≤3-option fallbacks, whose
   *  shipped `gap-3` has no `sm:` step). */
  gap?: "tray" | "tight";
  /** `bank`/`row` only: centre the row (word builds). */
  center?: boolean;
  /** `grid` only: 2 = the 2×2 four-option grid. */
  cols?: 1 | 2;
  /** `grid` only: equal-height rows (`auto-rows-fr`). */
  fr?: boolean;
  /** `match-grid` only: row count, for the template + the height ceiling. */
  rows?: number;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  id?: string;
  role?: string;
  "aria-hidden"?: boolean;
};

export function TileTray({
  kind,
  variant,
  layer,
  ghost,
  clamp,
  align,
  gap,
  center,
  cols,
  fr,
  rows,
  style,
  className,
  children,
  ...rest
}: TileTrayProps) {
  const inline: CSSProperties | undefined =
    kind === "match-grid" && rows
      ? {
          gridTemplateRows: `repeat(${rows}, minmax(min-content, 1fr))`,
          // Cap the grid so 1fr rows resolve to card-sized tiles instead of
          // stretching to fill the whole step area on tall viewports
          // (Spencer QA 2026-07-12: "don't scale the cards too tall"). Reads
          // the same `--match-gap` the row gap does, so a gap change on the
          // QA page updates this ceiling too.
          maxHeight: `calc(${rows} * var(--match-tile-h) + ${rows - 1} * var(--match-gap))`,
          ...style,
        }
      : style;

  return (
    <div
      data-tile-tray=""
      data-kind={kind}
      data-variant={variant}
      data-layer={layer ? "true" : undefined}
      data-ghost={ghost ? "true" : undefined}
      data-clamp={clamp ? "true" : undefined}
      data-align={align}
      data-gap={gap === "tight" ? "tight" : undefined}
      data-center={center ? "true" : undefined}
      data-cols={cols === 2 ? "2" : undefined}
      data-fr={fr ? "true" : undefined}
      style={inline}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * The same attributes as `<TileTray kind="row">`, for the one caller that
 * cannot render the element itself: `SortableBuildTiles` owns its row div
 * (dnd-kit's `SortableContext` child). Spread, don't reimplement.
 */
export function tileRowAttrs(opts: {
  layer?: boolean;
  align?: "start";
  gap?: "tray" | "tight";
  center?: boolean;
}): Record<string, string | undefined> {
  return {
    "data-tile-tray": "",
    "data-kind": "row",
    "data-layer": opts.layer ? "true" : undefined,
    "data-align": opts.align,
    "data-gap": opts.gap === "tight" ? "tight" : undefined,
    "data-center": opts.center ? "true" : undefined,
  };
}
