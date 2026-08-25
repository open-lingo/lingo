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
  // Table columns only (ADJ_ENTRIES has no "ba" column, same as ChainForm's
  // stacked forms) — narrower than IAdjForm so it stays assignable into
  // `entry.forms: Record<AdjForm, string>`.
  const iAdjForms: Array<Exclude<IAdjForm, "ba">> = ["negative", "past", "past-negative"];
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

  it("volitional (let's) — godan う-row → お-row + う", () => {
    expect(conjugateVerb("のむ", "godan", "volitional")).toBe("のもう");
    expect(conjugateVerb("かう", "godan", "volitional")).toBe("かおう");
    expect(conjugateVerb("いく", "godan", "volitional")).toBe("いこう");
    expect(conjugateVerb("まつ", "godan", "volitional")).toBe("まとう");
    expect(conjugateVerb("あそぶ", "godan", "volitional")).toBe("あそぼう");
    expect(conjugateVerb("はなす", "godan", "volitional")).toBe("はなそう");
  });

  it("volitional (let's) — ichidan drops る, adds よう", () => {
    expect(conjugateVerb("たべる", "ichidan", "volitional")).toBe("たべよう");
    expect(conjugateVerb("みる", "ichidan", "volitional")).toBe("みよう");
  });

  it("volitional (let's) — irregular", () => {
    expect(conjugateVerb("する", "irregular", "volitional")).toBe("しよう");
    expect(conjugateVerb("くる", "irregular", "volitional")).toBe("こよう");
  });

  it("ba (if) — godan う-row → え-row + ば", () => {
    expect(conjugateVerb("のむ", "godan", "ba")).toBe("のめば");
    expect(conjugateVerb("いく", "godan", "ba")).toBe("いけば");
    expect(conjugateVerb("かう", "godan", "ba")).toBe("かえば");
    expect(conjugateVerb("まつ", "godan", "ba")).toBe("まてば");
    expect(conjugateVerb("はなす", "godan", "ba")).toBe("はなせば");
    expect(conjugateVerb("あそぶ", "godan", "ba")).toBe("あそべば");
    expect(conjugateVerb("しぬ", "godan", "ba")).toBe("しねば");
    expect(conjugateVerb("およぐ", "godan", "ba")).toBe("およげば");
    expect(conjugateVerb("とる", "godan", "ba")).toBe("とれば");
  });

  it("ba (if) — ichidan drops る, adds れば", () => {
    expect(conjugateVerb("たべる", "ichidan", "ba")).toBe("たべれば");
    expect(conjugateVerb("みる", "ichidan", "ba")).toBe("みれば");
  });

  it("ba (if) — irregular", () => {
    expect(conjugateVerb("する", "irregular", "ba")).toBe("すれば");
    expect(conjugateVerb("くる", "irregular", "ba")).toBe("くれば");
  });

  it("い-adjective ば (if) — drop い, add ければ", () => {
    expect(conjugateIAdj("たかい", "ba")).toBe("たかければ");
    expect(conjugateIAdj("やすい", "ba")).toBe("やすければ");
  });

  it("ない conjugates as an い-adjective for ば (なければ)", () => {
    expect(conjugateIAdj("ない", "ba")).toBe("なければ");
  });

  it("いい adjective ば uses the よ- stem", () => {
    expect(conjugateIAdj("いい", "ba")).toBe("よければ");
  });
});
