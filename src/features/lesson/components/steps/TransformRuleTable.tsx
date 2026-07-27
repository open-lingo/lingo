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
 */
export function TransformRuleTable({
  form,
  highlight,
  maskBase,
}: {
  form: string;
  highlight?: TransformClass;
  /** The drilled base verb — rows whose canonical example IS this word swap
   *  to an alternate so the table never prints the card's own answer. */
  maskBase?: string;
}) {
  const ruleset = maskBase
    ? getTransformRulesetFor(form, maskBase)
    : getTransformRuleset(form);
  if (!ruleset) return null;
  return (
    <div
      data-testid="transform-rule-table"
      className="rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3.5"
    >
      <p className="mb-2.5 text-center text-[10.5px] font-bold uppercase tracking-widest text-text-muted">
        {ruleset.label}
      </p>
      {ruleset.rows.map((row) => (
        <div
          key={row.group}
          className={`grid grid-cols-[6rem_1fr] items-center gap-3 rounded-xl border px-2.5 py-2 ${
            highlight && row.group === highlight
              ? "border-accent/50 bg-accent/5"
              : "border-transparent"
          }`}
        >
          <span
            className={`text-right text-[11px] font-bold uppercase tracking-wide ${
              highlight && row.group === highlight ? "text-accent" : "text-text-muted"
            }`}
          >
            {row.label}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 font-japanese text-lg font-bold">
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
    </div>
  );
}
