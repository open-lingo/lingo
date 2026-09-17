/**
 * `Tile` — the contract between a step view and the one CSS block.
 *
 * WHAT THIS TEST IS FOR, AND WHAT IT IS NOT. These assertions cover the
 * ATTRIBUTE CONTRACT: the data-* names and values `src/index.css`
 * § "TILE PRIMITIVE" selects on, the element a state renders as, and the
 * className merge. They deliberately do NOT assert sizes — happy-dom applies
 * no stylesheet, so a class-string or computed-style assertion here would be
 * theatre. Geometry is verified by measurement instead, in Chromium at
 * 430×932 and 1280×900: `getBoundingClientRect` + `getComputedStyle` per
 * tier/state against the pre-migration class strings (the b16.2 lane's
 * `scripts/_tileparity.tmp.mjs` / `_tilediff.tmp.mjs`, 86/86 spec-viewport
 * pairs identical). If you change a number, that harness is the gate; if you
 * change an ATTRIBUTE NAME, this file is.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Tile } from "./Tile";
import type { TileDensity, TileState, TileVariant } from "./Tile";

function only(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error("Tile rendered nothing");
  return el;
}

describe("Tile attribute contract", () => {
  it("renders a button carrying data-tile and the variant/state the CSS selects on", () => {
    const variants: TileVariant[] = ["build", "listen", "match", "option"];
    for (const variant of variants) {
      const { container } = render(<Tile variant={variant}>あ</Tile>);
      const el = only(container);
      expect(el.tagName).toBe("BUTTON");
      expect(el.getAttribute("type")).toBe("button");
      expect(el.hasAttribute("data-tile")).toBe(true);
      expect(el.getAttribute("data-variant")).toBe(variant);
      // `idle` is the default state — the CSS has no bare-tile colour rule,
      // so a missing data-state would render an unpainted box.
      expect(el.getAttribute("data-state")).toBe("idle");
    }
  });

  it("emits every density and state verbatim", () => {
    const densities: TileDensity[] = ["big", "dense", "huge", "wide"];
    for (const density of densities) {
      const { container } = render(
        <Tile variant="build" density={density}>
          あ
        </Tile>,
      );
      expect(only(container).getAttribute("data-density")).toBe(density);
    }
    const states: TileState[] = [
      "idle",
      "placed",
      "selected",
      "correct",
      "wrong",
      "spent",
      "slot",
      "missed",
    ];
    for (const state of states) {
      const { container } = render(
        <Tile variant="build" state={state}>
          あ
        </Tile>,
      );
      expect(only(container).getAttribute("data-state")).toBe(state);
    }
  });

  it("omits the optional attributes entirely when not passed", () => {
    const { container } = render(<Tile variant="build">あ</Tile>);
    const el = only(container);
    for (const attr of [
      "data-density",
      "data-slot",
      "data-size",
      "data-tone",
      "data-text",
      "data-side",
      "data-audio",
      "data-collapsed",
    ]) {
      expect(el.hasAttribute(attr)).toBe(false);
    }
  });

  it("writes data-audio=false, not nothing, when audio is explicitly off", () => {
    // The match tiers are keyed on `[data-audio="false"]`, so a falsy value
    // must still be written — dropping it would leave a silent match tile
    // with no size tier at all.
    const { container } = render(
      <Tile variant="match" side="source" audio={false} density="wide">
        あ
      </Tile>,
    );
    const el = only(container);
    expect(el.getAttribute("data-audio")).toBe("false");
    expect(el.getAttribute("data-side")).toBe("source");
  });

  it("renders a ghost pre-sizer as a span with NO interactive attributes", () => {
    const { container } = render(
      <Tile
        variant="build"
        density="dense"
        state="ghost"
        onClick={() => {
          throw new Error("a pre-sizer must not be clickable");
        }}
      >
        あ
      </Tile>,
    );
    const el = only(container);
    expect(el.tagName).toBe("SPAN");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("type")).toBe(false);
    expect(el.hasAttribute("disabled")).toBe(false);
    expect(el.hasAttribute("tabindex")).toBe(false);
    // The handler passed above is dropped, not attached: a click on the
    // invisible copy of a tray tile must do nothing.
    el.click();
  });

  it("keeps caller classes (className is merged, not replaced)", () => {
    // SortableBuildTiles appends the drag-overlay lift and the pop animation
    // on top of a tile; losing them is how the drag feedback disappears.
    const { container } = render(
      <Tile
        variant="build"
        density="big"
        state="placed"
        className="motion-safe:animate-tile-pop scale-105 opacity-90 shadow-lg"
      >
        あ
      </Tile>,
    );
    const el = only(container);
    expect(el.className).toContain("motion-safe:animate-tile-pop");
    expect(el.className).toContain("scale-105");
    expect(el.className).toContain("shadow-lg");
    // …and the data attributes survive the merge.
    expect(el.getAttribute("data-state")).toBe("placed");
  });

  it("forwards button props and the ref", () => {
    let node: HTMLElement | null = null;
    const { container } = render(
      <Tile
        variant="build"
        density="dense"
        disabled
        aria-pressed
        data-testid="bank-tile"
        ref={(el) => {
          node = el;
        }}
      >
        あ
      </Tile>,
    );
    const el = only(container);
    expect(el.hasAttribute("disabled")).toBe(true);
    expect(el.getAttribute("aria-pressed")).toBe("true");
    expect(el.getAttribute("data-testid")).toBe("bank-tile");
    // dnd-kit needs the node itself (`setNodeRef`), not a wrapper.
    expect(node).toBe(el);
  });

  it("renders the option tiers and tones the option CSS keys on", () => {
    const { container } = render(
      <Tile
        variant="option"
        size="particle"
        tone="success"
        text="lg"
        state="correct"
      >
        は
      </Tile>,
    );
    const el = only(container);
    expect(el.getAttribute("data-size")).toBe("particle");
    expect(el.getAttribute("data-tone")).toBe("success");
    expect(el.getAttribute("data-text")).toBe("lg");
    expect(el.getAttribute("data-state")).toBe("correct");
  });

  it("marks the collapsed pill pre-sizer so it can zero its own box", () => {
    const { container } = render(
      <Tile variant="build" density="big" state="ghost" collapsed>
        あ
      </Tile>,
    );
    const el = only(container);
    expect(el.getAttribute("data-collapsed")).toBe("true");
    expect(el.getAttribute("data-state")).toBe("ghost");
    expect(el.tagName).toBe("SPAN");
  });

  // THE TEXT RULE (#152/#156/#157b): the primitive attaches every tile to the
  // one fit/fill pass. happy-dom lays nothing out, so the pass can only ever
  // decide "1" here — which is exactly the contract worth pinning: the
  // variable and the opt-in attribute must be on the element from the first
  // render, because `white-space: nowrap` keys off the attribute and a tile
  // that never got one silently goes back to wrapping. (What the numbers
  // become is measured on the simulator; see `tileFit.test.ts`.)
  it("sets --tile-fit-scale and data-tile-fit so the CSS rule can reach it", () => {
    for (const variant of ["build", "listen", "match", "option"] as TileVariant[]) {
      const { container } = render(
        <Tile variant={variant} size={variant === "option" ? "word" : undefined}>
          ばんごはん
        </Tile>,
      );
      const el = only(container);
      expect(el.style.getPropertyValue("--tile-fit-scale"), variant).toBe("1");
      expect(el.getAttribute("data-tile-fit"), variant).toBe("fit");
    }
  });

  // 2026-09-16 (T2): the prose tier used to opt OUT of the rule — "a sentence
  // is supposed to wrap". It is also where `MultipleChoiceStepView` dumps any
  // WORD grid with a 9+ character option, so #156's 2x2 grid of single
  // Japanese words rendered as prose and wrapped mid-word. It now fits like
  // every other tier, against its own `--option-font-min` floor, and wraps
  // only below it.
  it("puts the prose option tier in the rule as PROSE — scaled, never told not to wrap", () => {
    const { container } = render(
      <Tile variant="option" size="sentence">
        A friend, not a teacher
      </Tile>,
    );
    const el = only(container);
    // Not "fit": `[data-tile-fit]` is what turns `white-space: nowrap` ON, and
    // a `display: block` prose tile cannot detect its own overflow, so nowrap
    // there clips instead of wrapping (measured on the 15 Pro Max — four
    // Spanish options cut off at the tile edge).
    expect(el.getAttribute("data-tile-fit")).toBe("prose");
    expect(el.style.getPropertyValue("--tile-fit-scale")).toBe("1");
  });

  it("fits the invisible pre-sizers too — they measure the row they reserve", () => {
    const { container } = render(
      <Tile variant="build" density="dense" state="ghost">
        あそぼう？
      </Tile>,
    );
    expect(only(container).getAttribute("data-tile-fit")).toBe("fit");
  });

  it("honours an explicit `as`", () => {
    const { container } = render(
      <Tile variant="build" density="big" state="slot" as="span">
        あ
      </Tile>,
    );
    expect(only(container).tagName).toBe("SPAN");
  });

  // Review P4 (2026-09-17): the five gaps closed on the primitive itself.
  it("emits the new missed state and warning/neutral tones verbatim", () => {
    const { container: c1 } = render(
      <Tile variant="option" size="particle" state="missed">
        あ
      </Tile>,
    );
    expect(only(c1).getAttribute("data-state")).toBe("missed");

    const { container: c2 } = render(
      <Tile variant="option" size="pick" state="wrong" tone="warning">
        あ
      </Tile>,
    );
    expect(only(c2).getAttribute("data-tone")).toBe("warning");

    const { container: c3 } = render(
      <Tile variant="option" size="particle" state="placed" tone="neutral">
        あ
      </Tile>,
    );
    expect(only(c3).getAttribute("data-tone")).toBe("neutral");
  });

  it("fits the chip size tier like particle — content-hugging, no ancestor tray required", () => {
    // agreement_cloze/aspect_choice_cloze render a chip inline in running
    // prose, with NO `TileTray` ancestor — the primitive's width budget must
    // still resolve (falling back to `el.parentElement`, per tileFit.ts's
    // `groupOf`) rather than throwing or reading nothing.
    const { container } = render(
      <span>
        <Tile variant="option" size="chip" state="idle">
          Las
        </Tile>
      </span>,
    );
    const el = container.querySelector("[data-tile]");
    if (!(el instanceof HTMLElement)) throw new Error("Tile rendered nothing");
    expect(el.getAttribute("data-size")).toBe("chip");
    expect(el.getAttribute("data-tile-fit")).toBe("fit");
    expect(el.style.getPropertyValue("--tile-fit-scale")).toBe("1");
  });
});
