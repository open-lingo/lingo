/**
 * Rule-table display data for the conjugation transform card (spec
 * 2026-07-23). One ruleset per ChainForm; rows = verb classes, each with a
 * pinned CANONICAL example — たべる (ichidan) and のむ (godan) always, per
 * Spencer's ruling ("the rule needs to be shown for all words with an
 * example for each … display them always"). The row matching the current
 * card's class is highlighted by the view.
 *
 * Chips render the transformation glyph-by-glyph: `out` = struck (the part
 * that leaves), `in` = the replacement, `add` = the appended ending.
 * Backed by the worked-example / guidance-fading evidence (research review
 * 2026-07-23): pinned at stage 1, collapsed after 2 in-session corrects,
 * behind the half-credit peek from stage 2.
 *
 * Adding a form later (te / ta / adjectives) = adding a ruleset here; the
 * card and compiler never hard-code ない.
 */
import type { TransformClass } from "./transformCells";

export type RuleChip = {
  text: string;
  kind?: "out" | "in" | "add" | "sep";
};

export type RulesetRow = {
  /** Word class this row explains — used for highlight matching. */
  group: TransformClass;
  /** Learner-facing class label (course vocabulary, not linguist jargon). */
  label: string;
  chips: RuleChip[];
};

export type TransformRuleset = {
  /** Card-top label, e.g. "ない form — the rule, every class". */
  label: string;
  rows: RulesetRow[];
};

const sep = (text: string): RuleChip => ({ text, kind: "sep" });

export const TRANSFORM_RULESETS: Record<string, TransformRuleset> = {
  nai: {
    label: "ない form — the rule, every class",
    rows: [
      {
        group: "ichidan",
        label: "る-verbs",
        chips: [
          { text: "たべ" },
          { text: "る", kind: "out" },
          sep("→"),
          { text: "たべ" },
          { text: "ない", kind: "add" },
        ],
      },
      {
        group: "godan",
        label: "う-verbs",
        chips: [
          { text: "の" },
          { text: "む", kind: "out" },
          sep("→"),
          { text: "の" },
          { text: "ま", kind: "in" },
          sep("＋"),
          { text: "ない", kind: "add" },
        ],
      },
      {
        group: "irregular",
        label: "irregular",
        chips: [
          { text: "する", kind: "out" },
          sep("→"),
          { text: "しない", kind: "in" },
          sep("·"),
          { text: "くる", kind: "out" },
          sep("→"),
          { text: "こない", kind: "in" },
        ],
      },
    ],
  },
};

/** Alternate canonical examples, used when the drilled base IS a row's
 *  canonical word — otherwise the pinned table prints the card's literal
 *  answer (worst for irregulars: drilling する with する→しない on screen
 *  was a read-the-screen freebie — Fable sweep 2026-07-24). */
const NAI_ALTERNATES: Record<string, RulesetRow> = {
  たべる: {
    group: "ichidan",
    label: "る-verbs",
    chips: [
      { text: "み" },
      { text: "る", kind: "out" },
      { text: "→", kind: "sep" },
      { text: "み" },
      { text: "ない", kind: "add" },
    ],
  },
  のむ: {
    group: "godan",
    label: "う-verbs",
    chips: [
      { text: "い" },
      { text: "く", kind: "out" },
      { text: "→", kind: "sep" },
      { text: "い" },
      { text: "か", kind: "in" },
      { text: "＋", kind: "sep" },
      { text: "ない", kind: "add" },
    ],
  },
  する: {
    group: "irregular",
    label: "irregular",
    chips: [
      { text: "くる", kind: "out" },
      { text: "→", kind: "sep" },
      { text: "こない", kind: "in" },
      { text: "·", kind: "sep" },
      { text: "する", kind: "out" },
      { text: "→", kind: "sep" },
      { text: "？", kind: "add" },
    ],
  },
  くる: {
    group: "irregular",
    label: "irregular",
    chips: [
      { text: "する", kind: "out" },
      { text: "→", kind: "sep" },
      { text: "しない", kind: "in" },
      { text: "·", kind: "sep" },
      { text: "くる", kind: "out" },
      { text: "→", kind: "sep" },
      { text: "？", kind: "add" },
    ],
  },
};

export function getTransformRuleset(form: string): TransformRuleset | undefined {
  return TRANSFORM_RULESETS[form];
}

/**
 * Ruleset with the answer leak masked for a specific drilled base: any row
 * whose canonical example equals `base` swaps to its alternate (a sibling
 * verb of the same class, or the irregular pair with the drilled half
 * blanked to ？). Rows that don't mention `base` are untouched.
 */
export function getTransformRulesetFor(
  form: string,
  base: string,
): TransformRuleset | undefined {
  const rs = TRANSFORM_RULESETS[form];
  if (!rs) return rs;
  if (form !== "nai" || !NAI_ALTERNATES[base]) return rs;
  return {
    ...rs,
    rows: rs.rows.map((row) =>
      row.chips.some((c) => c.text === base) ? NAI_ALTERNATES[base] : row,
    ),
  };
}
