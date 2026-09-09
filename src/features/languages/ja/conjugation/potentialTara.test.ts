import { describe, expect, it } from "vitest";
import fixture14 from "./__fixtures__/chainForms14.json";
import { VERB_ENTRIES } from "../conjugationTables";
import { conjugateVerb, CHAIN_FORM_LABELS, type ChainForm } from "../conjugationEngine";
import { generateFormationDistractors } from "./formationDistractors";
import { jaConjugationTrainer, FREE_DRILL_VERB_FORM_MODULE } from "./provider";

/**
 * Potential (m24) + たら (m32) — the two engine forms added for the free drill.
 * The fixture was dumped from the engine BEFORE these forms existed, so the
 * byte-identity test is a real regression guard, not a self-fulfilling snapshot.
 */

describe("the 14 pre-existing forms are byte-identical to the pre-change engine", () => {
  const fx = fixture14 as { forms: string[]; entries: Record<string, Record<string, string>> };
  it("fixture covers every table verb and exactly the 14 old forms", () => {
    expect(fx.forms).toHaveLength(14);
    expect(fx.forms).not.toContain("potential");
    expect(fx.forms).not.toContain("tara");
    expect(Object.keys(fx.entries)).toHaveLength(VERB_ENTRIES.length);
  });
  for (const [key, forms] of Object.entries(fx.entries)) {
    const [dictionary, group] = key.split("|") as [string, "ichidan" | "godan" | "irregular"];
    it(`${dictionary} (${group})`, () => {
      for (const [form, expected] of Object.entries(forms)) {
        expect(conjugateVerb(dictionary, group, form as ChainForm), form).toBe(expected);
      }
    });
  }
  it("the engine now has exactly 16 forms", () => {
    expect(Object.keys(CHAIN_FORM_LABELS)).toHaveLength(16);
  });
});

describe("engine — potential / たら across the four classes", () => {
  it.each([
    ["たべる", "ichidan", "たべられる", "たべたら"],
    ["よむ", "godan", "よめる", "よんだら"],
    ["する", "irregular", "できる", "したら"],
    ["くる", "irregular", "こられる", "きたら"],
    ["べんきょうする", "irregular", "べんきょうできる", "べんきょうしたら"],
    ["いく", "godan", "いける", "いったら"],
    ["かう", "godan", "かえる", "かったら"],
    ["およぐ", "godan", "およげる", "およいだら"],
    ["はなす", "godan", "はなせる", "はなしたら"],
  ] as const)("%s (%s) → %s / %s", (dict, group, potential, tara) => {
    expect(conjugateVerb(dict, group, "potential")).toBe(potential);
    expect(conjugateVerb(dict, group, "tara")).toBe(tara);
  });
});

describe("distractors — potential / たら, every table verb", () => {
  const ending: Record<"potential" | "tara", RegExp> = {
    potential: /(れる|られる|える|ける|げる|せる|てる|ねる|べる|める|できる)$/,
    tara: /[ただ]ら$/,
  };
  for (const entry of VERB_ENTRIES) {
    for (const form of ["potential", "tara"] as const) {
      it(`${entry.dictionary} (${entry.group}) → ${form}`, () => {
        const correct = conjugateVerb(entry.dictionary, entry.group, form);
        const d = generateFormationDistractors(entry.dictionary, entry.group, form, correct);
        expect(d).toHaveLength(3);
        expect(new Set(d).size).toBe(3);
        expect(d).not.toContain(correct);
        for (const opt of d) {
          expect(opt, `${opt} in family of ${form}`).toMatch(ending[form]);
          if (entry.group !== "irregular") {
            expect(opt.startsWith(entry.dictionary.slice(0, -1)), `${opt} shares stem`).toBe(true);
          }
        }
      });
    }
  }
  it("names the classic slips", () => {
    expect(generateFormationDistractors("たべる", "ichidan", "potential", "たべられる")).toContain("たべれる");
    expect(generateFormationDistractors("のむ", "godan", "potential", "のめる")).toContain("のめられる");
    expect(generateFormationDistractors("する", "irregular", "potential", "できる")).toContain("される");
    expect(generateFormationDistractors("くる", "irregular", "potential", "こられる")).toContain("これる");
    // Same shape as た: the wrong-row sound changes rank first (のったら ≈ のった).
    expect(generateFormationDistractors("のむ", "godan", "tara", "のんだら")).toContain("のったら");
    expect(generateFormationDistractors("たべる", "ichidan", "tara", "たべたら")).toContain("たべったら");
  });
});

describe("free drill — potential / たら toggles and gates", () => {
  const free = jaConjugationTrainer.freeDrill!;
  it("gate rows cite the teaching modules", () => {
    expect(FREE_DRILL_VERB_FORM_MODULE.potential).toBe(24);
    expect(FREE_DRILL_VERB_FORM_MODULE.tara).toBe(32);
  });
  it("toggles carry the たべる example", () => {
    const forms = free.formsFor("verbs");
    expect(forms.find((f) => f.key === "potential")).toMatchObject({
      example: { dictionary: "たべる", form: "たべられる" },
      unlockModule: 24,
    });
    expect(forms.find((f) => f.key === "tara")).toMatchObject({
      example: { dictionary: "たべる", form: "たべたら" },
      unlockModule: 32,
    });
  });
  it("hidden at M12 / M23, served at M24 (potential) and M32 (たら)", () => {
    const only = new Set(["potential", "tara"]);
    expect(free.buildQuestion("verbs", 12, only)).toBeNull();
    expect(free.buildQuestion("verbs", 23, only)).toBeNull();
    for (let i = 0; i < 50; i++) expect(free.buildQuestion("verbs", 24, only)!.form).toBe("potential");
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(free.buildQuestion("verbs", 32, only)!.form);
    expect([...seen].sort()).toEqual(["potential", "tara"]);
  });
});
