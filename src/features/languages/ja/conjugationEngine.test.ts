import { describe, it, expect } from "vitest";
import { VERB_ENTRIES, ADJ_ENTRIES, type ConjugationForm } from "./conjugationTables";
import { conjugateVerb, conjugateIAdj, type ChainForm, type IAdjForm } from "./conjugationEngine";

// The table columns the engine must reproduce (dictionary excluded). Every one
// is a valid ChainForm, so the table doubles as the engine's ground-truth fixture.
const TABLE_VERB_FORMS: ConjugationForm[] = [
  "masu",
  "masu-neg",
  "masu-past",
  "masu-past-neg",
  "nai",
  "ta",
  "te",
  "tai",
];

describe("conjugateVerb — ground truth vs VERB_ENTRIES (88 × all columns)", () => {
  for (const entry of VERB_ENTRIES) {
    for (const form of TABLE_VERB_FORMS) {
      it(`${entry.dictionary} (${entry.group}) → ${form}`, () => {
        expect(conjugateVerb(entry.dictionary, entry.group, form as ChainForm)).toBe(
          entry.forms[form],
        );
      });
    }
  }
});

describe("conjugateIAdj — ground truth vs ADJ_ENTRIES (i-adj only)", () => {
  const iAdjForms: IAdjForm[] = ["negative", "past", "past-negative"];
  for (const entry of ADJ_ENTRIES.filter((a) => a.type === "i-adj")) {
    for (const form of iAdjForms) {
      it(`${entry.dictionary} → ${form}`, () => {
        expect(conjugateIAdj(entry.dictionary, form)).toBe(entry.forms[form]);
      });
    }
  }
});

describe("stacked chain forms — explicit expected values", () => {
  it("nai chain (なかった)", () => {
    expect(conjugateVerb("みる", "ichidan", "nai-past")).toBe("みなかった");
    expect(conjugateVerb("のむ", "godan", "nai-past")).toBe("のまなかった");
    expect(conjugateVerb("する", "irregular", "nai-past")).toBe("しなかった");
    expect(conjugateVerb("くる", "irregular", "nai-past")).toBe("こなかった");
  });

  it("う → わ nai exception", () => {
    expect(conjugateVerb("かう", "godan", "nai")).toBe("かわない");
    expect(conjugateVerb("かう", "godan", "nai-past")).toBe("かわなかった");
  });

  it("いく te/ta exception", () => {
    expect(conjugateVerb("いく", "godan", "te")).toBe("いって");
    expect(conjugateVerb("いく", "godan", "ta")).toBe("いった");
  });

  it("tai family conjugates as an い-adjective", () => {
    expect(conjugateVerb("みる", "ichidan", "tai")).toBe("みたい");
    expect(conjugateVerb("みる", "ichidan", "tai-neg")).toBe("みたくない");
    expect(conjugateVerb("みる", "ichidan", "tai-past")).toBe("みたかった");
    expect(conjugateVerb("みる", "ichidan", "tai-neg-past")).toBe("みたくなかった");
    expect(conjugateVerb("のむ", "godan", "tai-neg-past")).toBe("のみたくなかった");
  });

  it("いい adjective uses the よ- stem", () => {
    expect(conjugateIAdj("いい", "negative")).toBe("よくない");
    expect(conjugateIAdj("いい", "past")).toBe("よかった");
    expect(conjugateIAdj("いい", "past-negative")).toBe("よくなかった");
  });
});
