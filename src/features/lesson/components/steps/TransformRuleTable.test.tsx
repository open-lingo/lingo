/**
 * TransformRuleTable's `focus` contract.
 *
 * The transform card pins this table above its answer options inside a
 * FIXED-height shell. て ships eight rows; pinning all eight pushed the
 * options ~300px below the fold (measured 2026-08-06, 900×700: step-container
 * overflow 296px full vs 0px focused). Spencer: "we need something to ONLY
 * show the relevant line when it is teaching here."
 *
 * So the invariant this file protects is: focus mode shows the ONE row being
 * drilled — and, crucially, degrades to the full grid rather than to an empty
 * box when the card gives it nothing to focus on. A silently blank rule table
 * on a LEARN card is a worse failure than a tall one.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      def?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const template = typeof def === "string" ? def : key;
      const vars = (typeof def === "object" ? def : opts) ?? {};
      return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
        String(vars[k] ?? ""),
      );
    },
  }),
}));

import { TransformRuleTable } from "./TransformRuleTable";
import { getTransformRuleset } from "@/features/languages/ja/conjugation/transformRulesets";

afterEach(() => {
  cleanup();
});

/** Rows are the only grid children of the table box. */
function rowLabels(): string[] {
  const table = screen.getByTestId("transform-rule-table");
  return [...table.querySelectorAll(":scope > div.grid")].map((el) => {
    // Focus mode nests the example word inside the label cell, so read the
    // label's own text node rather than the cell's whole textContent.
    const own = [...(el.firstElementChild?.childNodes ?? [])]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? "")
      .join("");
    return own.trim();
  });
}

const TE_ROWS = getTransformRuleset("te")!.rows.length;

describe("TransformRuleTable focus mode", () => {
  it("renders every row when focus is off", () => {
    render(<TransformRuleTable form="te" highlight="godan" highlightSubgroup="nde" />);
    expect(rowLabels()).toHaveLength(TE_ROWS);
    expect(TE_ROWS).toBeGreaterThan(4);
  });

  it("renders only the drilled row when focus is on", () => {
    render(
      <TransformRuleTable form="te" highlight="godan" highlightSubgroup="nde" focus />,
    );
    expect(rowLabels()).toEqual(["む・ぶ・ぬ"]);
    // The header names the whole grid — dead weight over a single row, and
    // the card's own subtitle already says which form this is.
    expect(screen.queryByText(/sound-change table/i)).toBeNull();
  });

  it("keeps five godan rows apart — subgroup, not class, picks the row", () => {
    // Without `subgroup` every う-verb ending shares class `godan`, so a
    // class-only match would focus five rows at once (or the wrong one).
    render(<TransformRuleTable form="te" highlight="godan" highlightSubgroup="ite" focus />);
    expect(rowLabels()).toEqual(["く"]);
  });

  it("falls back to the full grid when nothing matches the highlight", () => {
    // `highlight` omitted: a card that lost its verbClass must not render an
    // empty rule box on a LEARN step.
    render(<TransformRuleTable form="te" focus />);
    expect(rowLabels()).toHaveLength(TE_ROWS);
  });

  it("expands to the full grid on request, and collapses back", () => {
    render(
      <TransformRuleTable form="te" highlight="ichidan" focus />,
    );
    const expand = screen.getByTestId("transform-rule-table-expand");
    expect(expand.textContent).toContain(`all ${TE_ROWS} rules`);

    fireEvent.click(expand);
    expect(rowLabels()).toHaveLength(TE_ROWS);
    expect(screen.getByTestId("transform-rule-table-expand").textContent).toContain(
      "just this rule",
    );

    fireEvent.click(screen.getByTestId("transform-rule-table-expand"));
    expect(rowLabels()).toEqual(["る-verbs"]);
  });

  it("counts the expander against the real ruleset, and drops it when already full", () => {
    // ない ships 3 rows, not て's 8 — the chip must name the form it is on.
    render(<TransformRuleTable form="nai" highlight="ichidan" focus />);
    expect(screen.getByTestId("transform-rule-table-expand").textContent).toContain(
      "all 3 rules",
    );
    cleanup();

    // Fallback view is ALREADY the full grid, so an expander would be a
    // control that does nothing.
    render(<TransformRuleTable form="nai" focus />);
    expect(screen.queryByTestId("transform-rule-table-expand")).toBeNull();
  });

  it("names the example verb, so a masked row can't read as the drilled one", () => {
    // かう's row is masked to たつ. Alone on screen the chips た＋つ→た＋って
    // read as past-tense た in a て lesson (Spencer, 2026-08-06: "did we
    // accidentally insert ta here?"). Spelling out たつ is what stops that.
    render(
      <TransformRuleTable
        form="te"
        highlight="godan"
        highlightSubgroup="tte"
        maskBase="かう"
        focus
      />,
    );
    const table = screen.getByTestId("transform-rule-table");
    expect(within(table).getByText("たつ")).toBeTruthy();
  });

  it("names no example when the masked row falls back to the abstract rule", () => {
    // す has exactly one taught verb (はなす), so かす's mask has no sibling to
    // show and drops to `す → して` with `examples: []`. An empty caption slot
    // must not render.
    render(
      <TransformRuleTable
        form="te"
        highlight="godan"
        highlightSubgroup="shite"
        maskBase="かす"
        focus
      />,
    );
    const table = screen.getByTestId("transform-rule-table");
    expect(within(table).queryByText("かす")).toBeNull();
    expect(within(table).queryByText("はなす")).toBeNull();
  });

  it("still masks the drilled verb in focus mode", () => {
    // The leak rule outranks the layout rule: the focused row is the ONLY row
    // on screen, so if it printed たべ＋て the card would answer itself.
    render(<TransformRuleTable form="te" highlight="ichidan" maskBase="たべる" focus />);
    const table = screen.getByTestId("transform-rule-table");
    expect(within(table).queryByText("たべ")).toBeNull();
  });
});
