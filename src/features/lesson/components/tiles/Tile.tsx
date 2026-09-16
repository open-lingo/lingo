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
import { useCallback, useLayoutEffect, useRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from "react";
import { registerTile, scheduleTileFitPass, unregisterTile } from "./tileFit";

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

/**
 * THE TEXT RULE, attached (TestFlight #152/#156/#157, b20).
 *
 * Every tile registers itself with the one batched fit/fill pass in
 * `tileFit.ts`, which writes `--tile-fit-scale` and `data-tile-fit` on the
 * element; `src/index.css` § "TILE PRIMITIVE" does the rest. It lives HERE,
 * in the primitive, for the same reason every number does: Spencer,
 * 2026-09-15 — "standardize the class for tiles across everything… less code
 * to handle". A per-view fit hook would be the seven-Tailwind-strings
 * mistake again, one layer up.
 *
 * Two facts about a tile decide how the rule treats it, and the primitive is
 * the only place that knows both:
 *   `hugsContent` — a build/listen bank or tray tile is as wide as its own
 *     word (a flex item in a wrapping row), so its box can never report room
 *     to grow; the ROW is its width budget. An option or match tile is a grid
 *     cell with a fixed width — its box IS the budget.
 *   `fill` — match is excluded. Its grid is already height-capped by
 *     `--match-tile-h`, and that token is the founder's own b17 dial-in
 *     (#157); growing its font is exactly the regression he reported. Match
 *     gets the FIT half only.
 * The `sentence` option tier opts out entirely: it is a left-aligned block of
 * PROSE, and prose is supposed to wrap.
 */
function useTileFit(
  variant: TileVariant,
  size: TileSize | undefined,
  ref: Ref<HTMLElement> | undefined,
) {
  // Prose wraps; everything else is a label, and a label never wraps.
  const fit = !(variant === "option" && size === "sentence");
  // `particle` is an option by variant and a bank tile by geometry: a
  // flex-wrap row of `min-width: fit-content` tiles, sized by their own word.
  // Measured on the 15 Pro Max simulator before this line existed: のみましょう
  // read its own (content-sized) box as its whole budget and held at 0.99
  // while のもう beside it grew to 1.25 — the ragged-siblings failure the MCQ
  // view has a paragraph about.
  const hugsContent =
    variant === "build" || variant === "listen" || (variant === "option" && size === "particle");
  const fill = fit && variant !== "match";

  const node = useRef<HTMLElement | null>(null);
  const registered = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      node.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as { current: HTMLElement | null }).current = el;
    },
    [ref],
  );

  // No dependency array: a tile's CHILDREN change (a placed tile, a revealed
  // reading, a kanji swap) far more often than its identity does, and every
  // one of those changes the width the rule is fitting. `registerTile` is
  // idempotent, so the repeat cost is a Map write.
  useLayoutEffect(() => {
    const el = node.current;
    if (registered.current && registered.current !== el) {
      unregisterTile(registered.current);
      registered.current = null;
    }
    if (el && fit) {
      registerTile(el, { hugsContent, fill });
      registered.current = el;
    } else if (registered.current) {
      unregisterTile(registered.current);
      registered.current = null;
    }
    scheduleTileFitPass();
  });

  useLayoutEffect(
    () => () => {
      if (registered.current) {
        unregisterTile(registered.current);
        registered.current = null;
      }
    },
    [],
  );

  return setRef;
}

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
  // The fit/fill rule needs the node; `ref` still reaches the caller (dnd-kit
  // passes `setNodeRef` through it and would break silently if it did not).
  const fitRef = useTileFit(variant, size, ref);
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
        <span {...attrs} aria-hidden ref={fitRef}>
          {children}
        </span>
      );
    }
    if (tag === "div") {
      return (
        <div {...attrs} aria-hidden ref={fitRef}>
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
        ref={fitRef}
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
        ref={fitRef}
      >
        {children}
      </div>
    );
  }
  return (
    <button type="button" {...attrs} {...rest} ref={fitRef}>
      {children}
    </button>
  );
}
