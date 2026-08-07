/**
 * THE RATCHET FOR THE TRANSFORM CARD'S TEACHING HALF.
 *
 * A `conjugation_transform` card is meant to teach → guide → do: the rule
 * table pinned open at stage 1, then behind a half-credit peek. Both the
 * table and the peek are gated on `ruleset &&` in
 * `ConjugationTransformStepView`, so a form with no entry in
 * `TRANSFORM_RULESETS` renders a bare "produce this form" prompt instead —
 * and NOTHING FAILS. That is exactly how the course reached 2026-08-06 with
 * 52 of its 59 transform cards silently missing their teaching half.
 *
 * This test asks the corpus, not the map: for every form a live lesson
 * actually drills, is there a rule table? Unbacked forms are listed in
 * `FORMS_AWAITING_RULESET`, and that list is a RATCHET — it may shrink,
 * never grow. Adding a form to it is not a fix; authoring its ruleset is.
 */
import { describe, expect, it } from "vitest";
import {
  TRANSFORM_RULESETS,
  getRulesetAlternates,
  getTransformRuleset,
  getTransformRulesetFor,
} from "./transformRulesets";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

/**
 * Forms drilled by a live card that still have no rule table. Every entry is
 * a module whose conjugation teaching is currently missing its worked
 * example. Ordered by the module that first drills them.
 *
 *   ta             m11       ← reuses て's rows; needs the same subgroup split
 *   masu-past      m11
 *   negative       m12, m13  ← い-adjective cells
 *   past           m12, m13
 *   past-negative  m12, m13
 *   tai            m13
 *   nai-past       m16
 *   masu-past-neg  m16
 *
 * Spec: docs/superpowers/specs/2026-08-06-n4-open-and-transform-teaching-design.md
 */
const FORMS_AWAITING_RULESET: ReadonlySet<string> = new Set([
  "ta",
  "masu-past",
  "negative",
  "past",
  "past-negative",
  "tai",
  "nai-past",
  "masu-past-neg",
]);

type Drill = { form: string; base: string; answer: string; stepId: string };

/**
 * The RESULT side(s) a row demonstrates — what sits after each "→", joined.
 *
 * A row leaks only when the whole word it produces IS the card's answer. It
 * does NOT leak because the answer happens to be a substring of a longer
 * word: the す row shows はなす→はなして, which contains して, but a learner
 * asked する→？ still has to know that する is irregular, and はなして is not
 * copyable. Substring-matching Japanese is Rule Zero's exact failure mode
 * (RUN-PLAN standing hazards) and the first version of this check did it —
 * it reported a leak on m8's する card that was not there.
 */
function rowOutputs(row: { chips: { text: string; kind?: string }[] }): string[] {
  const out: string[] = [];
  let collecting = false;
  let buf = "";
  for (const chip of row.chips) {
    if (chip.kind === "sep") {
      if (collecting) {
        out.push(buf);
        buf = "";
      }
      collecting = chip.text === "→";
      continue;
    }
    if (collecting) buf += chip.text;
  }
  if (collecting && buf) out.push(buf);
  return out;
}

function liveDrills(): Drill[] {
  const out: Drill[] = [];
  for (const mod of getMockCourse("ja").modules) {
    for (const lesson of mod.lessons as Array<{ id: string }>) {
      const content = getMockLessonContent(lesson.id);
      if (!content) continue;
      for (const step of content.steps as Array<Record<string, unknown>>) {
        if (step.type !== "conjugation_transform") continue;
        out.push({
          form: String(step.form),
          base: String(step.base),
          answer: String(step.answer),
          stepId: String(step.id),
        });
      }
    }
  }
  return out;
}

describe("every drilled conjugation form has its rule table", () => {
  it("finds the live transform cards at all", () => {
    // A check that matches nothing looks exactly like a check that passes
    // (RUN-PLAN standing hazard). Assert the scan is non-empty first.
    expect(liveDrills().length).toBeGreaterThan(50);
  });

  it("no form is missing a ruleset outside the ratchet list", () => {
    const missing = [
      ...new Set(
        liveDrills()
          .filter((d) => !getTransformRuleset(d.form))
          .map((d) => d.form),
      ),
    ].filter((f) => !FORMS_AWAITING_RULESET.has(f));
    expect(missing).toEqual([]);
  });

  it("keeps no stale ratchet entries", () => {
    // A form that got its ruleset must leave the list, or the list slowly
    // becomes a licence for the next untaught card to hide in.
    const stale = [...FORMS_AWAITING_RULESET].filter((f) =>
      getTransformRuleset(f),
    );
    expect(stale).toEqual([]);
  });
});

describe("the rule table never prints the card's own answer", () => {
  it("masks every drilled base that IS a row's canonical example", () => {
    const leaks: string[] = [];
    for (const drill of liveDrills()) {
      const ruleset = getTransformRulesetFor(drill.form, drill.base);
      if (!ruleset) continue; // no table shown at all — covered above
      for (const row of ruleset.rows) {
        if (!rowOutputs(row).includes(drill.answer)) continue;
        leaks.push(
          `${drill.stepId} (${drill.base} → ${drill.answer}) — the ${row.group}${
            row.subgroup ? `/${row.subgroup}` : ""
          } row prints "${row.chips.map((c) => c.text).join("")}"`,
        );
      }
    }
    expect(leaks).toEqual([]);
  });

  it("every ruleset owns an alternate for each canonical example it drills", () => {
    const drilledBases = new Set(liveDrills().map((d) => `${d.form}::${d.base}`));
    const gaps: string[] = [];
    for (const [form, ruleset] of Object.entries(TRANSFORM_RULESETS)) {
      const alternates = getRulesetAlternates(form) ?? {};
      for (const row of ruleset.rows) {
        for (const example of row.examples) {
          if (!drilledBases.has(`${form}::${example}`)) continue;
          if (!alternates[example]) {
            gaps.push(`${form}: "${example}" is drilled and canonical, but has no alternate row`);
          }
        }
      }
    }
    expect(gaps).toEqual([]);
  });

  it("an alternate never reintroduces the example it replaces", () => {
    const bad: string[] = [];
    for (const form of Object.keys(TRANSFORM_RULESETS)) {
      for (const [base, row] of Object.entries(getRulesetAlternates(form) ?? {})) {
        if (row.examples.includes(base)) {
          bad.push(`${form}/${base}: alternate still lists "${base}" as its example`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("ruleset shape", () => {
  it("covers every verb class the cards can highlight", () => {
    for (const [form, ruleset] of Object.entries(TRANSFORM_RULESETS)) {
      const groups = new Set(ruleset.rows.map((r) => r.group));
      const drilled = new Set(
        liveDrills()
          .filter((d) => d.form === form)
          .map((d) => d.form),
      );
      if (drilled.size === 0) continue;
      // Verb forms drill all three classes; い-adjective forms are their own
      // class and are not in this map yet (they sit in the ratchet list).
      expect(groups, `${form} is missing a class row`).toEqual(
        new Set(["ichidan", "godan", "irregular"]),
      );
      for (const row of ruleset.rows) {
        expect(row.examples.length, `${form}/${row.group} names no example`).toBeGreaterThan(0);
      }
    }
  });
});
