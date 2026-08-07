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
 * **A form with no ruleset here renders NO TABLE AND NO PEEK** — the view
 * gates both on `ruleset &&` (`ConjugationTransformStepView` ~219/224), so
 * the card silently degrades from "teach → guide → do" to a bare prompt.
 * That is a defect, not a soft default: measured 2026-08-06, 52 of the
 * course's 59 transform cards were shipping without their teaching half
 * because this map held one key. Adding a form = adding a ruleset here AND
 * its alternates below; `transformRulesets.test.ts` is the ratchet.
 */
import type { TransformClass } from "./transformCells";

export type RuleChip = {
  text: string;
  kind?: "out" | "in" | "add" | "sep";
};

export type RulesetRow = {
  /** Word class this row explains — used for highlight matching. */
  group: TransformClass;
  /**
   * Sub-row within the class, for forms whose rule branches inside one class.
   * て/た are the case: all nine godan endings are class `godan`, but the
   * ending picks the row. A row with a `subgroup` highlights only when the
   * card's own `subgroup` matches; rows without one highlight on class alone.
   * Without this the て table lights all five う-verb rows at once.
   */
  subgroup?: string;
  /** Learner-facing class label (course vocabulary, not linguist jargon). */
  label: string;
  /**
   * The canonical word(s) this row demonstrates, named explicitly.
   *
   * The leak mask used to look for the drilled base among `chips`, which
   * silently never matched a multi-chip word: the ichidan row renders たべる
   * as `たべ` + `る`, so no single chip equals "たべる" and the alternate for
   * it could not fire (found 2026-08-06 — the m6 たべる and のむ cards had
   * been printing their own answer since the card shipped). Naming the
   * example is not derivable from the chips, so it is declared.
   */
  examples: string[];
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
        examples: ["たべる"],
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
        examples: ["のむ"],
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
        examples: ["する", "くる"],
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

  // ─── m7 · the polite layer ────────────────────────────────────────────
  // ます and ません share one shape: reach the i-stem, then append. Taught
  // as one rule with two endings rather than two unrelated paradigms, which
  // is also why the godan row shows the vowel shift (む→み) explicitly —
  // that shift IS the rule; the ending is just the suffix.
  masu: {
    label: "ます form — the rule, every class",
    rows: [
      {
        group: "ichidan",
        label: "る-verbs",
        examples: ["たべる"],
        chips: [
          { text: "たべ" },
          { text: "る", kind: "out" },
          sep("→"),
          { text: "たべ" },
          { text: "ます", kind: "add" },
        ],
      },
      {
        group: "godan",
        label: "う-verbs",
        examples: ["のむ"],
        chips: [
          { text: "の" },
          { text: "む", kind: "out" },
          sep("→"),
          { text: "の" },
          { text: "み", kind: "in" },
          sep("＋"),
          { text: "ます", kind: "add" },
        ],
      },
      {
        group: "irregular",
        label: "irregular",
        examples: ["する", "くる"],
        chips: [
          { text: "する", kind: "out" },
          sep("→"),
          { text: "します", kind: "in" },
          sep("·"),
          { text: "くる", kind: "out" },
          sep("→"),
          { text: "きます", kind: "in" },
        ],
      },
    ],
  },

  // ─── m8 · the sound-change table ──────────────────────────────────────
  // The one table in the course that pays twice — た (m11) reuses these rows
  // exactly. Every ENDING gets its own row and its own worked example
  // (Spencer 2026-08-06: "individual teaching for every te form ending …
  // this is the most important thing to learn"), so the godan class is split
  // five ways by `subgroup` rather than collapsed into one う-verb row.
  //
  // ぬ rides the んで row with しぬ shown but never drilled: しぬ is the only
  // common ぬ verb and m8 is the "please do X" module, so the learner sees a
  // complete system without meeting "please die" (Spencer ruling 2026-08-06).
  //
  // いく is its own row, not a footnote on く. It is the single most common
  // verb that breaks the table, and burying it inside the く row is how
  // learners end up producing いいて.
  te: {
    label: "て form — the sound-change table",
    rows: [
      {
        group: "ichidan",
        label: "る-verbs",
        examples: ["たべる"],
        chips: [
          { text: "たべ" },
          { text: "る", kind: "out" },
          sep("→"),
          { text: "たべ" },
          { text: "て", kind: "add" },
        ],
      },
      {
        group: "godan",
        subgroup: "tte",
        label: "う・つ・る",
        examples: ["かう"],
        chips: [
          { text: "か" },
          { text: "う", kind: "out" },
          sep("→"),
          { text: "か" },
          { text: "って", kind: "add" },
        ],
      },
      {
        group: "godan",
        subgroup: "nde",
        label: "む・ぶ・ぬ",
        examples: ["のむ"],
        chips: [
          { text: "の" },
          { text: "む", kind: "out" },
          sep("→"),
          { text: "の" },
          { text: "んで", kind: "add" },
        ],
      },
      {
        group: "godan",
        subgroup: "ite",
        label: "く",
        examples: ["きく"],
        chips: [
          { text: "き" },
          { text: "く", kind: "out" },
          sep("→"),
          { text: "き" },
          { text: "いて", kind: "add" },
        ],
      },
      {
        group: "godan",
        subgroup: "ide",
        label: "ぐ",
        examples: ["いそぐ"],
        chips: [
          { text: "いそ" },
          { text: "ぐ", kind: "out" },
          sep("→"),
          { text: "いそ" },
          { text: "いで", kind: "add" },
        ],
      },
      {
        group: "godan",
        subgroup: "shite",
        label: "す",
        examples: ["かす"],
        chips: [
          { text: "か" },
          { text: "す", kind: "out" },
          sep("→"),
          { text: "か" },
          { text: "して", kind: "add" },
        ],
      },
      {
        group: "godan",
        subgroup: "iku",
        label: "いく only",
        examples: ["いく"],
        chips: [
          { text: "いく", kind: "out" },
          sep("→"),
          { text: "いって", kind: "in" },
          sep("·"),
          { text: "not いいて", kind: "sep" },
        ],
      },
      {
        group: "irregular",
        label: "irregular",
        examples: ["する", "くる"],
        chips: [
          { text: "する", kind: "out" },
          sep("→"),
          { text: "して", kind: "in" },
          sep("·"),
          { text: "くる", kind: "out" },
          sep("→"),
          { text: "きて", kind: "in" },
        ],
      },
    ],
  },

  "masu-neg": {
    label: "ません — the rule, every class",
    rows: [
      {
        group: "ichidan",
        label: "る-verbs",
        examples: ["たべる"],
        chips: [
          { text: "たべ" },
          { text: "る", kind: "out" },
          sep("→"),
          { text: "たべ" },
          { text: "ません", kind: "add" },
        ],
      },
      {
        group: "godan",
        label: "う-verbs",
        examples: ["のむ"],
        chips: [
          { text: "の" },
          { text: "む", kind: "out" },
          sep("→"),
          { text: "の" },
          { text: "み", kind: "in" },
          sep("＋"),
          { text: "ません", kind: "add" },
        ],
      },
      {
        group: "irregular",
        label: "irregular",
        examples: ["する", "くる"],
        chips: [
          { text: "する", kind: "out" },
          sep("→"),
          { text: "しません", kind: "in" },
          sep("·"),
          { text: "くる", kind: "out" },
          sep("→"),
          { text: "きません", kind: "in" },
        ],
      },
    ],
  },
};

/**
 * Alternate canonical examples, used when the drilled base IS a row's
 * canonical word — otherwise the pinned table prints the card's literal
 * answer (worst for irregulars: drilling する with する→しない on screen
 * was a read-the-screen freebie — Fable sweep 2026-07-24).
 *
 * Keyed `form → drilled base → replacement row`. Every ruleset above owns an
 * entry for each of its `examples` that the course actually drills; the
 * ratchet test asserts that, so a new ruleset cannot ship half-masked.
 *
 * Irregular rows show two words at once, so their alternate keeps the OTHER
 * pair visible and blanks the drilled half to ？ — the rule stays on screen,
 * the answer does not.
 */
const RULESET_ALTERNATES: Record<string, Record<string, RulesetRow>> = {
  nai: {
    たべる: {
      group: "ichidan",
      label: "る-verbs",
      examples: ["みる"],
      chips: [
        { text: "み" },
        { text: "る", kind: "out" },
        sep("→"),
        { text: "み" },
        { text: "ない", kind: "add" },
      ],
    },
    のむ: {
      group: "godan",
      label: "う-verbs",
      examples: ["いく"],
      chips: [
        { text: "い" },
        { text: "く", kind: "out" },
        sep("→"),
        { text: "い" },
        { text: "か", kind: "in" },
        sep("＋"),
        { text: "ない", kind: "add" },
      ],
    },
    する: {
      group: "irregular",
      label: "irregular",
      examples: ["くる"],
      chips: [
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "こない", kind: "in" },
        sep("·"),
        { text: "する", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
    くる: {
      group: "irregular",
      label: "irregular",
      examples: ["する"],
      chips: [
        { text: "する", kind: "out" },
        sep("→"),
        { text: "しない", kind: "in" },
        sep("·"),
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
  },

  masu: {
    たべる: {
      group: "ichidan",
      label: "る-verbs",
      examples: ["みる"],
      chips: [
        { text: "み" },
        { text: "る", kind: "out" },
        sep("→"),
        { text: "み" },
        { text: "ます", kind: "add" },
      ],
    },
    のむ: {
      group: "godan",
      label: "う-verbs",
      examples: ["いく"],
      chips: [
        { text: "い" },
        { text: "く", kind: "out" },
        sep("→"),
        { text: "い" },
        { text: "き", kind: "in" },
        sep("＋"),
        { text: "ます", kind: "add" },
      ],
    },
    する: {
      group: "irregular",
      label: "irregular",
      examples: ["くる"],
      chips: [
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "きます", kind: "in" },
        sep("·"),
        { text: "する", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
    くる: {
      group: "irregular",
      label: "irregular",
      examples: ["する"],
      chips: [
        { text: "する", kind: "out" },
        sep("→"),
        { text: "します", kind: "in" },
        sep("·"),
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
  },

  // て. Nearly every row's canonical verb is drilled somewhere in m8, so
  // nearly every row needs an alternate.
  //
  // Where a row has a SECOND taught verb, the alternate uses it — and that is
  // a bonus, not a compromise: drilling かう while the row shows まつ→まって
  // is the clearest possible demonstration that う・つ・る really are one rule.
  //
  // ぐ and す have exactly one taught verb each (およぐ, はなす), so their
  // alternates drop to the ABSTRACT rule (ぐ → いで). That is consistent with
  // what the mask is for: it stops the table printing the literal answer, not
  // the rule — m6's たべる alternate still shows "drop る, add ない". The
  // learner must still apply it to their own verb.
  te: {
    たべる: {
      group: "ichidan",
      label: "る-verbs",
      examples: ["みる"],
      chips: [
        { text: "み" },
        { text: "る", kind: "out" },
        sep("→"),
        { text: "み" },
        { text: "て", kind: "add" },
      ],
    },
    かう: {
      group: "godan",
      subgroup: "tte",
      label: "う・つ・る",
      examples: ["たつ"],
      chips: [
        { text: "た" },
        { text: "つ", kind: "out" },
        sep("→"),
        { text: "た" },
        { text: "って", kind: "add" },
      ],
    },
    たつ: {
      group: "godan",
      subgroup: "tte",
      label: "う・つ・る",
      examples: ["かう"],
      chips: [
        { text: "か" },
        { text: "う", kind: "out" },
        sep("→"),
        { text: "か" },
        { text: "って", kind: "add" },
      ],
    },
    やる: {
      group: "godan",
      subgroup: "tte",
      label: "う・つ・る",
      examples: ["かう"],
      chips: [
        { text: "か" },
        { text: "う", kind: "out" },
        sep("→"),
        { text: "か" },
        { text: "って", kind: "add" },
      ],
    },
    のむ: {
      group: "godan",
      subgroup: "nde",
      label: "む・ぶ・ぬ",
      examples: ["あそぶ"],
      chips: [
        { text: "あそ" },
        { text: "ぶ", kind: "out" },
        sep("→"),
        { text: "あそ" },
        { text: "んで", kind: "add" },
      ],
    },
    あそぶ: {
      group: "godan",
      subgroup: "nde",
      label: "む・ぶ・ぬ",
      examples: ["のむ"],
      chips: [
        { text: "の" },
        { text: "む", kind: "out" },
        sep("→"),
        { text: "の" },
        { text: "んで", kind: "add" },
      ],
    },
    きく: {
      group: "godan",
      subgroup: "ite",
      label: "く",
      examples: ["はたらく"],
      chips: [
        { text: "はたら" },
        { text: "く", kind: "out" },
        sep("→"),
        { text: "はたら" },
        { text: "いて", kind: "add" },
      ],
    },
    いそぐ: {
      group: "godan",
      subgroup: "ide",
      label: "ぐ",
      examples: [],
      chips: [
        { text: "ぐ", kind: "out" },
        sep("→"),
        { text: "いで", kind: "add" },
      ],
    },
    かす: {
      group: "godan",
      subgroup: "shite",
      label: "す",
      examples: [],
      chips: [
        { text: "す", kind: "out" },
        sep("→"),
        { text: "して", kind: "add" },
      ],
    },
    // Drilling いく, the useful thing on screen is the CONTRAST: く normally
    // gives いて — and this one doesn't. Teaches the exception without
    // handing over いって.
    いく: {
      group: "godan",
      subgroup: "iku",
      label: "いく only",
      examples: [],
      chips: [
        { text: "きく" },
        sep("→"),
        { text: "きいて", kind: "in" },
        sep("·"),
        { text: "いく", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
    する: {
      group: "irregular",
      label: "irregular",
      examples: ["くる"],
      chips: [
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "きて", kind: "in" },
        sep("·"),
        { text: "する", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
    くる: {
      group: "irregular",
      label: "irregular",
      examples: ["する"],
      chips: [
        { text: "する", kind: "out" },
        sep("→"),
        { text: "して", kind: "in" },
        sep("·"),
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
  },

  "masu-neg": {
    たべる: {
      group: "ichidan",
      label: "る-verbs",
      examples: ["みる"],
      chips: [
        { text: "み" },
        { text: "る", kind: "out" },
        sep("→"),
        { text: "み" },
        { text: "ません", kind: "add" },
      ],
    },
    のむ: {
      group: "godan",
      label: "う-verbs",
      examples: ["いく"],
      chips: [
        { text: "い" },
        { text: "く", kind: "out" },
        sep("→"),
        { text: "い" },
        { text: "き", kind: "in" },
        sep("＋"),
        { text: "ません", kind: "add" },
      ],
    },
    する: {
      group: "irregular",
      label: "irregular",
      examples: ["くる"],
      chips: [
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "きません", kind: "in" },
        sep("·"),
        { text: "する", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
    くる: {
      group: "irregular",
      label: "irregular",
      examples: ["する"],
      chips: [
        { text: "する", kind: "out" },
        sep("→"),
        { text: "しません", kind: "in" },
        sep("·"),
        { text: "くる", kind: "out" },
        sep("→"),
        { text: "？", kind: "add" },
      ],
    },
  },
};

export function getTransformRuleset(form: string): TransformRuleset | undefined {
  return TRANSFORM_RULESETS[form];
}

/** The forms this module can mask a leak for — the ratchet test reads it. */
export function getRulesetAlternates(
  form: string,
): Record<string, RulesetRow> | undefined {
  return RULESET_ALTERNATES[form];
}

/**
 * Ruleset with the answer leak masked for a specific drilled base: any row
 * whose canonical example IS `base` swaps to its alternate (a sibling verb of
 * the same class, or the irregular pair with the drilled half blanked to ？).
 * Rows that don't demonstrate `base` are untouched.
 *
 * Matching is on the row's declared `examples`, NOT on chip text — see the
 * note on `RulesetRow.examples` for why the chip-text version was silently
 * a no-op for every multi-chip word.
 */
export function getTransformRulesetFor(
  form: string,
  base: string,
): TransformRuleset | undefined {
  const rs = TRANSFORM_RULESETS[form];
  if (!rs) return rs;
  const alternate = RULESET_ALTERNATES[form]?.[base];
  if (!alternate) return rs;
  return {
    ...rs,
    rows: rs.rows.map((row) => (row.examples.includes(base) ? alternate : row)),
  };
}
