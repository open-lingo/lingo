/**
 * `TileTray` — the attribute contract for the container `Tile` lives in.
 * Same rationale as `Tile.test.tsx`: these assert `data-*` names and
 * values (what `src/index.css` § "TILE PRIMITIVE" selects on), not sizes —
 * happy-dom applies no stylesheet.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TileTray, tileRowAttrs } from "./TileTray";

function only(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error("TileTray rendered nothing");
  return el;
}

describe("TileTray attribute contract", () => {
  it("emits data-kind and the container's data-tile-tray hook", () => {
    const { container } = render(<TileTray kind="bank">x</TileTray>);
    const el = only(container);
    expect(el.hasAttribute("data-tile-tray")).toBe(true);
    expect(el.getAttribute("data-kind")).toBe("bank");
  });

  // Review P4 gap (2026-09-17): grid cols was 1|2 only.
  it("emits data-cols for 3 and 4, matching the existing 2 contract", () => {
    for (const cols of [2, 3, 4] as const) {
      const { container } = render(
        <TileTray kind="grid" cols={cols}>
          x
        </TileTray>,
      );
      expect(only(container).getAttribute("data-cols"), `cols=${cols}`).toBe(String(cols));
    }
  });

  it("omits data-cols for 1 (and when cols is unset) — same as before 3/4 existed", () => {
    const { container: c1 } = render(
      <TileTray kind="grid" cols={1}>
        x
      </TileTray>,
    );
    expect(only(c1).hasAttribute("data-cols")).toBe(false);
    const { container: c2 } = render(<TileTray kind="grid">x</TileTray>);
    expect(only(c2).hasAttribute("data-cols")).toBe(false);
  });

  it("combines cols with fr for the equal-row contract, same as any other cols value", () => {
    const { container } = render(
      <TileTray kind="grid" cols={3} fr>
        x
      </TileTray>,
    );
    const el = only(container);
    expect(el.getAttribute("data-cols")).toBe("3");
    expect(el.getAttribute("data-fr")).toBe("true");
  });

  // Review P4 (2026-09-17): the dead `clamp` prop/attribute, removed.
  it("has no clamp prop at all — data-clamp can never be written", () => {
    // Type-level pin: "clamp" is not a key of TileTray's own prop type any
    // more (compile error if it ever comes back).
    // @ts-expect-error — `clamp` is not a valid TileTray prop key.
    const neverClamp: keyof Parameters<typeof TileTray>[0] = "clamp";
    void neverClamp;
    // Runtime pin: a normal row/ghost render never carries data-clamp.
    const { container } = render(
      <TileTray kind="row" ghost>
        x
      </TileTray>,
    );
    expect(only(container).hasAttribute("data-clamp")).toBe(false);
  });

  it("tileRowAttrs (the SortableBuildTiles spread) also carries no clamp key", () => {
    const attrs = tileRowAttrs({ layer: true });
    expect(Object.keys(attrs)).not.toContain("clamp");
    expect(Object.keys(attrs)).not.toContain("data-clamp");
  });

  it("carries the match-grid row-count formula through inline style", () => {
    const { container } = render(
      <TileTray kind="match-grid" rows={3}>
        x
      </TileTray>,
    );
    const el = only(container);
    expect(el.style.gridTemplateRows).toBe("repeat(3, minmax(min-content, 1fr))");
    expect(el.style.maxHeight).toContain("var(--match-tile-h)");
  });
});
