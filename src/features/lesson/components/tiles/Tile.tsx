/**
 * `Tile` — the ONE tile-shaped surface in the app.
 *
 * Spencer, 2026-09-15 (TestFlight #137, and the b16 tile-sizing wave):
 * "standardize the class for tiles across everything and then populate them
 * differently on load depending on step type… better for maintainability."
 * Before this, seven step views composed their own Tailwind sizing strings —
 * three build tiers with hand-written ratios, a listen tier with
 * 1.142857-style multipliers, four `clamp()` match formulas, four MCQ option
 * layouts — which is why 20 of 143 TestFlight items were tile sizing and why
 * eight commits in nine days each fixed one tier on one surface (see
 * `docs/user-feedback/2026-09-15-recurring-complaints-rca.md` §2.1).
 *
 * THE DEAL: this component renders a box with `data-*` attributes and NO
 * classes of its own. Every number lives in ONE CSS block, `src/index.css`
 * § "TILE PRIMITIVE". A view picks a variant/density/state; it never picks a
 * padding.
 *
 * `data-state` (not `data-selected`, not a `selected` boolean) is the
 * Radix/shadcn convention, so Tailwind's `data-[state=…]` variants and any
 * future Radix parity keep working, and a view never composes a colour
 * ternary again.
 *
 * className IS MERGED, never replaced — `SortableBuildTiles` appends the
 * drag-overlay lift (`scale-105 opacity-90 shadow-lg`) and the pop animation
 * on top. Note the precedence: the CSS block sits after `@tailwind
 * utilities` with (0,2,0)+ selectors, so a utility in `className` CANNOT
 * override a property the block sets without Tailwind's `!` modifier. That
 * is deliberate (it is what keeps sizing out of the views); the one case
 * that legitimately needs to fight it — the pill tray's zero-width
 * pre-sizer — is the `collapsed` prop instead.
 *
 * WHY THERE IS NO `chip` VARIANT: the 18 round chips and 23 eyebrow labels
 * go to `src/shared/components/ui/Badge.tsx`, which already has variants,
 * sizes, a `pill` flag and tests. Two competing chip primitives would be the
 * same mistake one level up.
 */
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from "react";

/** Which family of tile this is. Drives geometry AND state colours. */
export type TileVariant = "build" | "listen" | "match" | "option";

/**
 * Size tier.
 *
 * `big` (≤6-tile bank / word build), `dense` (7–11-tile sentence bank),
 * `huge` (12+) are the build tiers. `dense`/`wide` are ALSO the match
 * tiers (`wide` = fewer than six rows, `dense` = six or more) — they share
 * the word because they mean the same thing (more rows, less room).
 *
 * `listening_build` deliberately passes NO density: it has exactly one tier
 * today, and giving it `dense` would inherit the dense build tier's
 * kana-only word growth (`--tile-kana-font`), which listen tiles have never
 * had. That would be a visible change, not a migration.
 */
export type TileDensity = "big" | "dense" | "huge" | "wide";

/**
 * What the learner has done to this tile. Colour is a pure function of it.
 *
 * `spent` = a bank tile already placed, a matched pair, a not-picked option
 * after submit — "used up", per variant. `ghost` = the invisible pre-sizer
 * the trays render to reserve their height (identical box, identical
 * glyphs, zero interaction). `slot` = the dashed empty outline a word-build
 * tile pops into. `wrong` on a build tray = the learner's own tiles flipped
 * to the error palette after a wrong submit.
 */
export type TileState =
  | "idle"
  | "placed"
  | "selected"
  | "correct"
  | "wrong"
  | "spent"
  | "ghost"
  | "slot";

/**
 * Which container the tile sits in. Exists for exactly two shipped
 * divergences, both disclosed rather than unified: the listen BANK's
 * desktop padding-block is ×2 where its tray's is ×1.25, and the word-build
 * SLOTS branch draws a 2px border where every other build surface draws
 * 1.5px.
 */
export type TileSlot = "tray" | "bank" | "slots" | "pill";

/**
 * Option geometry tier — one value per option layout that shipped.
 *
 * `sentence` (regular/long-text MCQ), `word` (word-only grid, longest
 * option 3+ glyphs), `word-glyph` (word-only grid, all ≤2 glyphs), `glyph`
 * (≤2-glyph option in a MIXED grid — same type, no horizontal padding),
 * `reveal` (translate-MCQ reveal-on-select, 120px floor), `pick`
 * (BuildSentence's single-answer picker), `pick-fluid` (ListeningBuild's,
 * container-relative padding), `particle` (the particle-cloze row).
 */
export type TileSize =
  | "sentence"
  | "word"
  | "word-glyph"
  | "glyph"
  | "reveal"
  | "pick"
  | "pick-fluid"
  | "particle";

/**
 * The one real colour divergence in the option family: MCQ marks the right
 * answer with a filled accent tile, particle-cloze with a success tint.
 * Both mean "correct". `tone` carries that verbatim so this migration stays
 * pixel-identical; picking one is the owner's call.
 */
export type TileTone = "accent" | "success";

/** Length-based type step (particle-cloze steps long options down a size). */
export type TileText = "sm" | "md" | "lg";

type TileOwnProps = {
  variant: TileVariant;
  density?: TileDensity;
  /** Defaults to `idle`. */
  state?: TileState;
  slot?: TileSlot;
  /** Option variant only. */
  size?: TileSize;
  /** Option variant only; defaults to `accent`. */
  tone?: TileTone;
  /** Option variant only — the view's length-based type step. */
  text?: TileText;
  /** Match variant only. */
  side?: "source" | "target";
  /** Match variant only — audio-on-select tiers run a size larger. */
  audio?: boolean;
  /**
   * Zero-width pre-sizer: fixes a row's height without occupying width, so
   * the word-build pill grows horizontally only and nothing below it moves.
   */
  collapsed?: boolean;
  /**
   * `span` for the pre-sizers (no interactive attributes at all), `div`
   * where a tile is not a control. Defaults to `span` for `state="ghost"`
   * and `button` everywhere else.
   */
  as?: "button" | "div" | "span";
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
};

export type TileProps = TileOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof TileOwnProps>;

export function Tile({
  variant,
  density,
  state = "idle",
  slot,
  size,
  tone,
  text,
  side,
  audio,
  collapsed,
  as,
  className,
  children,
  ref,
  ...rest
}: TileProps) {
  const tag = as ?? (state === "ghost" ? "span" : "button");
  const attrs = {
    "data-tile": "",
    "data-variant": variant,
    "data-state": state,
    ...(density ? { "data-density": density } : {}),
    ...(slot ? { "data-slot": slot } : {}),
    ...(size ? { "data-size": size } : {}),
    ...(tone ? { "data-tone": tone } : {}),
    ...(text ? { "data-text": text } : {}),
    ...(side ? { "data-side": side } : {}),
    ...(audio === undefined ? {} : { "data-audio": audio ? "true" : "false" }),
    ...(collapsed ? { "data-collapsed": "true" } : {}),
    className,
  };

  // A pre-sizer is not a control: no click target, no focus stop, no
  // accessible name. It carries the SAME markup and box as a real tile so
  // the tray it sizes cannot mis-measure, and nothing else.
  if (state === "ghost") {
    if (tag === "span") {
      return (
        <span {...attrs} aria-hidden ref={ref as Ref<HTMLSpanElement>}>
          {children}
        </span>
      );
    }
    if (tag === "div") {
      return (
        <div {...attrs} aria-hidden ref={ref as Ref<HTMLDivElement>}>
          {children}
        </div>
      );
    }
  }

  if (tag === "span") {
    return (
      <span
        {...attrs}
        {...(rest as HTMLAttributes<HTMLSpanElement>)}
        ref={ref as Ref<HTMLSpanElement>}
      >
        {children}
      </span>
    );
  }
  if (tag === "div") {
    return (
      <div
        {...attrs}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
        ref={ref as Ref<HTMLDivElement>}
      >
        {children}
      </div>
    );
  }
  return (
    <button type="button" {...attrs} {...rest} ref={ref as Ref<HTMLButtonElement>}>
      {children}
    </button>
  );
}
