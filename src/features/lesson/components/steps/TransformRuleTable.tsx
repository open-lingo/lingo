import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getTransformRuleset,
  getTransformRulesetFor,
} from "@/features/languages/ja/conjugation/transformRulesets";
import type { TransformClass } from "@/features/languages/ja/conjugation/transformCells";

/**
 * The conjugation rule table (spec 2026-07-23): one row per verb class,
 * canonical example pinned per row (たべる・のむ always), transformation
 * rendered as glyph chips (struck part → replacement ＋ ending). Shared by
 * the transform card (pinned at stage 1, behind the peek later) and the
 * grammar rule card (the "ending → result" grid — Spencer 2026-07-23:
 * prose rules "don't look great; list them out").
 *
 * TWO MODES, and the difference is pedagogical, not cosmetic:
 *
 * - The GRAMMAR RULE card renders the whole grid. It is a reading card in a
 *   scrollable shell, and the contrast between rows IS its content.
 * - The TRANSFORM card renders `focus` — the one row it is drilling, plus an
 *   expander. て ships 8 rows; pinning all of them above the answer options
 *   pushed the actual question off a laptop viewport (Spencer 2026-08-06:
 *   "the bloat on the page is too much to show it all"). A drill card teaches
 *   one row, so it shows one row.
 */
export function TransformRuleTable({
  form,
  highlight,
  highlightSubgroup,
  maskBase,
  focus = false,
}: {
  form: string;
  highlight?: TransformClass;
  /** Sub-row within the class (て's godan endings). When the card supplies
   *  one, a row that declares a DIFFERENT subgroup is not the active row —
   *  otherwise all five う-verb rows light at once. */
  highlightSubgroup?: string;
  /** The drilled base verb — rows whose canonical example IS this word swap
   *  to an alternate so the table never prints the card's own answer. */
  maskBase?: string;
  /** Show only the highlighted row, with the rest behind an expander. */
  focus?: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const ruleset = maskBase
    ? getTransformRulesetFor(form, maskBase)
    : getTransformRuleset(form);
  if (!ruleset) return null;
  const isActive = (row: { group: TransformClass; subgroup?: string }) =>
    !!highlight &&
    row.group === highlight &&
    (row.subgroup === undefined ||
      highlightSubgroup === undefined ||
      row.subgroup === highlightSubgroup);

  // Focus mode needs a row to focus ON. A card with no `highlight` (or a
  // highlight that matches nothing) falls back to the full grid rather than
  // rendering an empty box.
  const active = ruleset.rows.filter(isActive);
  const focused = focus && active.length > 0 && !expanded;
  const rows = focused ? active : ruleset.rows;

  // て ships 8 rows where ない ships 3. Tighten the vertical rhythm past 4 so
  // the card still fits a 700px window — the lesson shell is fixed-height and
  // the step container is the only scroll area (CLAUDE.md layout rules).
  const dense = rows.length > 4;
  // Collapsed, the header is dead weight: the card's own subtitle already ends
  // with the form ("… → eat (te-form) · て form"). Expanded, it comes back —
  // that view is the reference grid and wants naming.
  const showLabel = !focused;
  return (
    <div
      data-testid="transform-rule-table"
      data-focused={focused ? "true" : undefined}
      className={`rounded-2xl border-[1.5px] border-border bg-surface px-4 ${focused ? "py-2" : dense ? "py-2.5" : "py-3.5"}`}
    >
      {showLabel ? (
        <p
          className={`text-center text-[10.5px] font-bold uppercase tracking-widest text-text-muted ${dense ? "mb-1.5" : "mb-2.5"}`}
        >
          {ruleset.label}
        </p>
      ) : null}
      {rows.map((row) => (
        <div
          key={`${row.group}:${row.subgroup ?? ""}`}
          className={`grid items-center rounded-xl border px-2.5 ${
            // Focused, the 6rem label gutter is pure cost: at 390px it pushed
            // って onto a second line, splitting it from the た it attaches to.
            focused ? "grid-cols-[auto_1fr] gap-2.5" : "grid-cols-[6rem_1fr] gap-3"
          } ${dense || focused ? "py-1" : "py-2"} ${
            // One row on a full-width card strands itself at the left edge;
            // the 6rem label gutter only earns its keep when rows stack.
            focused ? "mx-auto w-fit" : ""
          } ${
            isActive(row) && !focused
              ? "border-accent/50 bg-accent/5"
              : "border-transparent"
          }`}
        >
          <span
            className={`text-right text-[11px] font-bold uppercase tracking-wide ${
              isActive(row) ? "text-accent" : "text-text-muted"
            }`}
          >
            {row.label}
            {/* Focused, this row is the ONLY thing on screen, so nothing else
                signals that its chips spell a DIFFERENT verb than the one
                being drilled. Spencer read かう's masked row (た＋つ→た＋って)
                as the past-tense た leaking into a て lesson — reasonable, and
                exactly the failure naming the word prevents. */}
            {focused && row.examples.length > 0 ? (
              <span className="mt-0.5 block font-japanese text-sm font-bold normal-case tracking-normal text-text-secondary">
                {row.examples.join(" · ")}
              </span>
            ) : null}
          </span>
          <span
            className={`flex flex-wrap items-center gap-1.5 font-japanese font-bold ${dense ? "text-base" : focused ? "text-lg sm:text-xl" : "text-lg"}`}
          >
            {row.chips.map((chip, i) =>
              chip.kind === "sep" ? (
                <span key={i} className="text-sm text-text-muted">
                  {chip.text}
                </span>
              ) : (
                <span
                  key={i}
                  className={`rounded-lg border px-2 py-0.5 ${
                    chip.kind === "out"
                      ? "border-error/60 text-error line-through decoration-2"
                      : chip.kind === "in"
                        ? "border-success/60 text-success"
                        : chip.kind === "add"
                          ? "border-warning/60 text-warning"
                          : "border-border bg-surface-raised text-text-primary"
                  }`}
                >
                  {chip.text}
                </span>
              ),
            )}
          </span>
        </div>
      ))}
      {/* One disclosure level, same pattern as the culture chip: the rest of
          the grid is available, never in the way. */}
      {focus && active.length > 0 && ruleset.rows.length > active.length ? (
        <div className="mt-1 flex justify-center">
          <button
            type="button"
            data-testid="transform-rule-table-expand"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-text-muted transition-colors hover:text-text-secondary"
          >
            {expanded
              ? t("lesson.transform.rulesCollapse", "just this rule")
              : /* `n`, not `count` — `count` would route this through
                   i18next's plural resolver and past the inline fallback. */
                t("lesson.transform.rulesExpand", "all {{n}} rules", {
                  n: ruleset.rows.length,
                })}
          </button>
        </div>
      ) : null}
    </div>
  );
}
