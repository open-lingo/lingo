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

  it("shows the drilled word's own chips — no alternate-example swap (#131)", () => {
    // Spencer, TestFlight #131 (2026-09-15): "ideally show the drilled
    // word's chips while they are learning" — no alternate-example
    // convention. かう's canonical て row IS かう, so drilling かう must show
    // か＋って on screen, never a swapped-in たつ/まつ.
    render(
      <TransformRuleTable form="te" highlight="godan" highlightSubgroup="tte" focus />,
    );
    const table = screen.getByTestId("transform-rule-table");
    expect(within(table).getByText("かう")).toBeTruthy();
    expect(within(table).queryByText("たつ")).toBeNull();
  });

  it("shows the drilled word's own chips for a single-example row too", () => {
    // す's canonical て row example is かす — with masking removed, the
    // row's own example is what renders, never blanked or swapped.
    render(
      <TransformRuleTable form="te" highlight="godan" highlightSubgroup="shite" focus />,
    );
    const table = screen.getByTestId("transform-rule-table");
    expect(within(table).getByText("かす")).toBeTruthy();
  });

  it("prints the literal answer chips in focus mode (masking removed)", () => {
    // Pre-#131 the leak rule blanked the focused row so it couldn't answer
    // the card. Spencer reversed that call — the focused row now IS たべ＋て.
    render(<TransformRuleTable form="te" highlight="ichidan" focus />);
    const table = screen.getByTestId("transform-rule-table");
    // The stem chip "たべ" appears twice (struck side + replacement side).
    expect(within(table).getAllByText("たべ").length).toBe(2);
  });
});
