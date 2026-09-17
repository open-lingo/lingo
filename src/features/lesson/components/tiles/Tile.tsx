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
 * `sentence` (regular/long-text MCQ grid cell), `row` (a full-width prose
 * row in a stacked list — listening-comprehension answers; the MCQ cell's
 * type and padding measured 44px of extra overflow on that layout), `word`
 * (word-only grid, longest option 3+ glyphs), `reading` (a 2–4 glyph word
 * answer in a two-column grid — a kana reading or a conjugated form; 56px
 * tall, nowrap, its own 24/18px FIT pair), `word-glyph` (word-only grid,
 * all ≤2 glyphs), `glyph`
 * (≤2-glyph option in a MIXED grid — same type, no horizontal padding),
 * `reveal` (translate-MCQ reveal-on-select, 120px floor), `image`
 * (WordImageMcq's square word-over-art card — an option by role, a card by
 * geometry, so `aspect-square` and a 12/16px pad instead of the word tier's
 * 32px), `pick` (BuildSentence's single-answer picker), `pick-fluid`
 * (ListeningBuild's, container-relative padding), `particle` (the
 * particle-cloze row).
 */
export type TileSize =
  | "sentence"
  | "row"
  | "word"
  | "reading"
  | "word-glyph"
  | "glyph"
  | "reveal"
  | "image"
  | "pick"
  | "pick-fluid"
  | "particle";

/**
 * The colour divergences in the option family, carried verbatim so every
 * migration stays pixel-identical: MCQ marks the right answer with a FILLED
 * accent tile, particle-cloze with a success tint, and the image-MCQ card
 * with a 10%-accent wash (its art is the subject — a white-on-accent emoji
 * card reads as a different control). All three mean "correct". Picking one
 * is the owner's call, not a migration's.
 */
export type TileTone = "accent" | "success" | "card";

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
   * Build variant, huge bank only (TestFlight #184, b23): a spent bank
   * tile's out-of-flow collapse state, driven by
   * `useHugeBankCollapse`/`BuildSentenceStepView` — `"pending"` is the
   * founder's 350ms hold at the existing spent look, `"done"` is the
   * ~150ms shrink-to-zero. `undefined` (every other tile, and every
   * non-huge bank) renders no `data-collapse` attribute at all, so
   * index.css's `[data-collapse]` rules never match and nothing changes.
   */
  collapse?: "pending" | "done";
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
 *   `fill` / `fillGrow` — match may SHRINK but never GROW. Its grid is
 *     height-capped by `--match-tile-h`, the founder's own b17 dial-in, and
 *     growing its font is exactly the regression he reported (#157). Taking
 *     it out of FILL altogether was the 2A/2B reading and it cost 103px of
 *     overflow at 125% on `ja-m3-neo-5?step=23`: the gloss wrapped to three
 *     lines, the grid's min-content rows burst the card ceiling, and the one
 *     mechanism that could have given the row back was switched off.
 *   `uniformHeight` — build and listen only. Those two render a bank and a
 *     tray of content-sized tiles that must all be ONE box height (#137), and
 *     the pass is the only thing that can know that height; a match row and an
 *     `auto-rows-fr` option cell already get theirs from their grid.
 *
 * THE `sentence` TIER NO LONGER OPTS OUT (2026-09-16, T2). The reasoning was
 * "prose is supposed to wrap", which is true of prose and false of what
 * actually lands in this tier: `MultipleChoiceStepView` demotes a WORD grid to
 * `sentence` as soon as one option is 9+ characters, so `ありがとうございます`
 * in a 2x2 grid of single words rendered as left-aligned prose and wrapped
 * mid-word — #156's screenshot. The tier now FITs against its own floor
 * (`--option-font-min`, `index.css`) and wraps only below it, which is the
 * order he asked for; a genuinely long sentence still reaches the floor and
 * still wraps, at word boundaries (see the `[data-tile-fit="floor"]` override).
 */
function useTileFit(
  variant: TileVariant,
  size: TileSize | undefined,
  ref: Ref<HTMLElement> | undefined,
) {
  // Every tile is in the rule now — prose included. What differs is whether it
  // is a LABEL (nowrap, shrink to the floor, only then wrap) or PROSE (always
  // free to wrap; shrinking just buys it fewer lines). The `sentence` tier is
  // the only prose tier, and it must stay prose: measured on the 15 Pro Max,
  // giving it nowrap made four Spanish sentence options render as one line cut
  // off at the tile edge, because a `display: block` tile's own box IS its
  // line width and the width fit can never see the overflow. See `nowrap` in
  // `tileFit.ts` for the measurement.
  const fit = true;
  // `row` is prose for the same reason `sentence` is: a `display: block`
  // tile's own box IS its line width, so the width fit can never see that it
  // is overflowing and `atFloor` — the flag that releases `nowrap` — can never
  // fire. Measured with nowrap on: four Spanish sentence options rendered as
  // ONE line cut off at the tile edge.
  const nowrap = !(variant === "option" && (size === "sentence" || size === "row"));
  // `particle` is an option by variant and a bank tile by geometry: a
  // flex-wrap row of `min-width: fit-content` tiles, sized by their own word.
  // Measured on the 15 Pro Max simulator before this line existed: のみましょう
  // read its own (content-sized) box as its whole budget and held at 0.99
  // while のもう beside it grew to 1.25 — the ragged-siblings failure the MCQ
  // view has a paragraph about.
  const hugsContent =
    variant === "build" || variant === "listen" || (variant === "option" && size === "particle");
  // `image` joins match on the FIT-only side (2026-09-16). Its card is
  // `aspect-square`, so its height is set by its width and never by the stage:
  // growing the word cannot buy the card room, it can only take room from the
  // art underneath it, which `overflow: hidden` would then clip. Shrinking to
  // fit a long word is the whole reason it is in the rule.
  // `image` joins the FIT-only side outright; `match` is in the SHRINK half
  // and out of the GROW half (2026-09-16, phase 3 — see `fillGrow` in
  // `tileFit.ts`). Growing a match label inside its `--match-tile-h` card is
  // #157 and stays forbidden; refusing to shrink one is what let
  // `ja-m3-neo-5?step=23` overflow by 103px at 125% with rows ragged by 30%.
  const fill = fit && size !== "image";
  const fillGrow = variant !== "match";
  const uniformHeight = variant === "build" || variant === "listen";

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
      registerTile(el, { hugsContent, fill, fillGrow, uniformHeight, nowrap });
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
  collapse,
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
    ...(collapse ? { "data-collapse": collapse } : {}),
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
