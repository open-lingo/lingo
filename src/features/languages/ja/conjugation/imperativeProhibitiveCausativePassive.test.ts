import { describe, expect, it } from "vitest";
import fixture18 from "./__fixtures__/chainForms18.json";
import { VERB_ENTRIES } from "../conjugationTables";
import { conjugateVerb, CHAIN_FORM_LABELS, type ChainForm } from "../conjugationEngine";
import { generateFormationDistractors } from "./formationDistractors";
import { jaConjugationTrainer, FREE_DRILL_VERB_FORM_MODULE } from "./provider";

/**
 * Imperative (命令形) / prohibitive (〜な) / causative (使役形) / passive
 * (受身形) — four more engine forms, following the potential/たら pattern
 * (potentialTara.test.ts). ALL FOUR ARE UNTAUGHT: no shipped module (m1–m38)
 * introduces them (grepped 命令/使役/受身/〜な across curriculum/ir/*.yaml and
 * curriculum/m*.ts — nothing; passive is explicitly slated for m40 and
 * causative for m45, per m33-neo.ts/m38-neo.ts, neither authored). The
 * engine still conjugates them (ground truth for whenever a module claims
 * them) and formationDistractors.ts has their distractor families, but
 * provider.ts's FREE_DRILL_VERB_FORM_MODULE gates them at `Infinity` so they
 * never appear in the free drill's toggle list (freeDrill.test.ts pins this).
 *
 * `chainForms18.json` covers the 14 pre-existing forms (unchanged) PLUS
 * these 4 new ones — potential/たら keep their own fixture/coverage in
 * potentialTara.test.ts and aren't duplicated here.
 */

const NEW_FORMS = ["imperative", "prohibitive", "causative", "passive"] as const;

describe("the 14 pre-existing forms stay byte-identical (chainForms18 fixture)", () => {
  const fx = fixture18 as { forms: string[]; entries: Record<string, Record<string, string>> };
  const OLD_14 = [
    "masu",
    "masu-neg",
    "masu-past",
    "masu-past-neg",
    "te",
    "ta",
    "nai",
    "tai",
    "nai-past",
    "tai-neg",
    "tai-past",
    "tai-neg-past",
    "volitional",
    "ba",
  ];

  it("fixture covers every table verb and exactly 14 old + 4 new forms", () => {
    expect(fx.forms).toHaveLength(18);
    for (const f of OLD_14) expect(fx.forms).toContain(f);
    for (const f of NEW_FORMS) expect(fx.forms).toContain(f);
    expect(fx.forms).not.toContain("potential");
    expect(fx.forms).not.toContain("tara");
    expect(Object.keys(fx.entries)).toHaveLength(VERB_ENTRIES.length);
  });

  for (const [key, forms] of Object.entries(fx.entries)) {
    const [dictionary, group] = key.split("|") as [string, "ichidan" | "godan" | "irregular"];
    it(`${dictionary} (${group}) — every fixture form matches the engine`, () => {
      for (const [form, expected] of Object.entries(forms)) {
        expect(conjugateVerb(dictionary, group, form as ChainForm), form).toBe(expected);
      }
    });
  }

  it("the engine now has exactly 20 forms", () => {
    expect(Object.keys(CHAIN_FORM_LABELS)).toHaveLength(20);
  });
});

describe("engine — imperative / prohibitive / causative / passive across the four classes", () => {
  it.each([
    ["たべる", "ichidan", "たべろ", "たべるな", "たべさせる", "たべられる"],
    ["みる", "ichidan", "みろ", "みるな", "みさせる", "みられる"],
    ["のむ", "godan", "のめ", "のむな", "のませる", "のまれる"],
    ["いく", "godan", "いけ", "いくな", "いかせる", "いかれる"], // regular imperative, no euphonic slip
    ["かう", "godan", "かえ", "かうな", "かわせる", "かわれる"], // う → わ exception carries over
    ["する", "irregular", "しろ", "するな", "させる", "される"], // suppletive さ-stem
    ["くる", "irregular", "こい", "くるな", "こさせる", "こられる"],
    ["べんきょうする", "irregular", "べんきょうしろ", "べんきょうするな", "べんきょうさせる", "べんきょうされる"],
    ["およぐ", "godan", "およげ", "およぐな", "およがせる", "およがれる"],
    ["はなす", "godan", "はなせ", "はなすな", "はなさせる", "はなされる"],
  ] as const)("%s (%s) → %s / %s / %s / %s", (dict, group, imperative, prohibitive, causative, passive) => {
    expect(conjugateVerb(dict, group, "imperative")).toBe(imperative);
    expect(conjugateVerb(dict, group, "prohibitive")).toBe(prohibitive);
    expect(conjugateVerb(dict, group, "causative")).toBe(causative);
    expect(conjugateVerb(dict, group, "passive")).toBe(passive);
  });

  it("くれる is the one hand-authored imperative exception — くれ, not くれろ", () => {
    expect(conjugateVerb("くれる", "ichidan", "imperative")).toBe("くれ");
  });
});

describe("passive/potential byte-identity — the collision the distractor pools must respect", () => {
  it("ichidan and くる: passive === potential", () => {
    for (const entry of VERB_ENTRIES.filter((e) => e.group === "ichidan")) {
      expect(conjugateVerb(entry.dictionary, "ichidan", "passive")).toBe(
        conjugateVerb(entry.dictionary, "ichidan", "potential"),
      );
    }
    expect(conjugateVerb("くる", "irregular", "passive")).toBe(conjugateVerb("くる", "irregular", "potential"));
  });

  it("godan and する: passive !== potential (genuinely different forms)", () => {
    for (const entry of VERB_ENTRIES.filter((e) => e.group === "godan")) {
      expect(conjugateVerb(entry.dictionary, "godan", "passive")).not.toBe(
        conjugateVerb(entry.dictionary, "godan", "potential"),
      );
    }
    expect(conjugateVerb("する", "irregular", "passive")).not.toBe(conjugateVerb("する", "irregular", "potential"));
  });

  it("a passive question never offers its own correct answer as a wrong option, even where it equals potential", () => {
    for (const entry of [
      { dictionary: "たべる", group: "ichidan" as const },
      { dictionary: "みる", group: "ichidan" as const },
      { dictionary: "くる", group: "irregular" as const },
    ]) {
      const correct = conjugateVerb(entry.dictionary, entry.group, "passive");
      const d = generateFormationDistractors(entry.dictionary, entry.group, "passive", correct);
      expect(d).not.toContain(correct);
      expect(new Set(d).size).toBe(d.length);
    }
  });
});

describe("distractors — imperative / prohibitive / causative / passive, every table verb", () => {
  for (const entry of VERB_ENTRIES) {
    for (const form of NEW_FORMS) {
      it(`${entry.dictionary} (${entry.group}) → ${form}`, () => {
        const correct = conjugateVerb(entry.dictionary, entry.group, form);
        const d = generateFormationDistractors(entry.dictionary, entry.group, form, correct);
        expect(d, `${entry.dictionary}/${form} needs 3 distractors`).toHaveLength(3);
        expect(new Set(d).size).toBe(3);
        expect(d).not.toContain(correct);
      });
    }
  }

  it("names the classic slips", () => {
    // imperative
    expect(generateFormationDistractors("のむ", "godan", "imperative", "のめ")).toContain("のみろ");
    expect(generateFormationDistractors("たべる", "ichidan", "imperative", "たべろ")).toContain("たべれ"); // ら抜き-imperative shape
    // prohibitive — wrong-stem attach, since attach-to-dictionary collides with `correct`
    expect(generateFormationDistractors("のむ", "godan", "prohibitive", "のむな")).toContain("のみな");
    expect(generateFormationDistractors("のむ", "godan", "prohibitive", "のむな")).toContain("のめな");
    // causative
    expect(generateFormationDistractors("のむ", "godan", "causative", "のませる")).toContain("のみせる");
    expect(generateFormationDistractors("たべる", "ichidan", "causative", "たべさせる")).toContain("たべせる");
    // passive
    expect(generateFormationDistractors("たべる", "ichidan", "passive", "たべられる")).toContain("たべれる"); // ら抜き
    expect(generateFormationDistractors("のむ", "godan", "passive", "のまれる")).toContain("のめる"); // potential confused for passive
    expect(generateFormationDistractors("する", "irregular", "passive", "される")).toContain("できる"); // potential confused for passive
  });
});

describe("free drill — the four new forms are UNTAUGHT and never offered", () => {
  const free = jaConjugationTrainer.freeDrill!;

  it("gate table marks them Infinity, not a real module", () => {
    for (const f of NEW_FORMS) {
      expect(FREE_DRILL_VERB_FORM_MODULE[f], f).toBe(Number.POSITIVE_INFINITY);
    }
  });

  it("never appear in the toggle list, at any level", () => {
    for (const maxModule of [7, 12, 24, 32, 37, 38, 100]) {
      const forms = free.formsFor("verbs");
      // formsFor doesn't take a level, but buildQuestion does — the toggle
      // list itself must never contain these keys regardless.
      for (const f of NEW_FORMS) expect(forms.some((x) => x.key === f)).toBe(false);
      expect(free.buildQuestion("verbs", maxModule, new Set(NEW_FORMS))).toBeNull();
    }
  });
});
