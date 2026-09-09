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

  it("potential (can) — all four classes (m24)", () => {
    expect(conjugateVerb("たべる", "ichidan", "potential")).toBe("たべられる");
    expect(conjugateVerb("よむ", "godan", "potential")).toBe("よめる");
    expect(conjugateVerb("する", "irregular", "potential")).toBe("できる");
    expect(conjugateVerb("くる", "irregular", "potential")).toBe("こられる");
    expect(conjugateVerb("べんきょうする", "irregular", "potential")).toBe("べんきょうできる");
    expect(conjugateVerb("かう", "godan", "potential")).toBe("かえる"); // no う → わ exception
  });

  it("たら (if/when) — plain past + ら, all four classes (m32)", () => {
    expect(conjugateVerb("たべる", "ichidan", "tara")).toBe("たべたら");
    expect(conjugateVerb("よむ", "godan", "tara")).toBe("よんだら");
    expect(conjugateVerb("する", "irregular", "tara")).toBe("したら");
    expect(conjugateVerb("くる", "irregular", "tara")).toBe("きたら");
    expect(conjugateVerb("いく", "godan", "tara")).toBe("いったら"); // いく exception carries over
  });

  it("imperative (命令形, command) — all four classes (UNTAUGHT)", () => {
    expect(conjugateVerb("たべる", "ichidan", "imperative")).toBe("たべろ");
    expect(conjugateVerb("いく", "godan", "imperative")).toBe("いけ"); // regular here — no euphonic change
    expect(conjugateVerb("する", "irregular", "imperative")).toBe("しろ");
    expect(conjugateVerb("くる", "irregular", "imperative")).toBe("こい");
    expect(conjugateVerb("べんきょうする", "irregular", "imperative")).toBe("べんきょうしろ");
    expect(conjugateVerb("のむ", "godan", "imperative")).toBe("のめ");
    expect(conjugateVerb("くれる", "ichidan", "imperative")).toBe("くれ"); // hand-authored exception, not くれろ
    expect(conjugateVerb("みる", "ichidan", "imperative")).toBe("みろ"); // the regular rule くれる is an exception to
  });

  it("prohibitive (〜な, don't) — dictionary form + な, every class, no stem change (UNTAUGHT)", () => {
    expect(conjugateVerb("たべる", "ichidan", "prohibitive")).toBe("たべるな");
    expect(conjugateVerb("いく", "godan", "prohibitive")).toBe("いくな");
    expect(conjugateVerb("する", "irregular", "prohibitive")).toBe("するな");
    expect(conjugateVerb("くる", "irregular", "prohibitive")).toBe("くるな");
    expect(conjugateVerb("べんきょうする", "irregular", "prohibitive")).toBe("べんきょうするな");
  });

  it("causative (使役形, make/let) — all four classes (UNTAUGHT)", () => {
    expect(conjugateVerb("たべる", "ichidan", "causative")).toBe("たべさせる");
    expect(conjugateVerb("いく", "godan", "causative")).toBe("いかせる");
    expect(conjugateVerb("する", "irregular", "causative")).toBe("させる"); // suppletive さ-stem, not しせる
    expect(conjugateVerb("くる", "irregular", "causative")).toBe("こさせる");
    expect(conjugateVerb("べんきょうする", "irregular", "causative")).toBe("べんきょうさせる");
    expect(conjugateVerb("かう", "godan", "causative")).toBe("かわせる"); // う → わ exception carries over from naiStem
  });

  it("passive (受身形, is done to) — all four classes (UNTAUGHT)", () => {
    expect(conjugateVerb("たべる", "ichidan", "passive")).toBe("たべられる");
    expect(conjugateVerb("いく", "godan", "passive")).toBe("いかれる");
    expect(conjugateVerb("する", "irregular", "passive")).toBe("される"); // suppletive さ-stem, not しれる
    expect(conjugateVerb("くる", "irregular", "passive")).toBe("こられる");
    expect(conjugateVerb("べんきょうする", "irregular", "passive")).toBe("べんきょうされる");
    expect(conjugateVerb("かう", "godan", "passive")).toBe("かわれる");
  });

  it("passive collides byte-for-byte with potential for ichidan verbs and くる — genuine Japanese, not a bug", () => {
    expect(conjugateVerb("たべる", "ichidan", "passive")).toBe(conjugateVerb("たべる", "ichidan", "potential"));
    expect(conjugateVerb("みる", "ichidan", "passive")).toBe(conjugateVerb("みる", "ichidan", "potential"));
    expect(conjugateVerb("くる", "irregular", "passive")).toBe(conjugateVerb("くる", "irregular", "potential"));
    // godan and する: the two forms are genuinely different.
    expect(conjugateVerb("のむ", "godan", "passive")).not.toBe(conjugateVerb("のむ", "godan", "potential"));
    expect(conjugateVerb("する", "irregular", "passive")).not.toBe(conjugateVerb("する", "irregular", "potential"));
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
