import { describe, expect, it } from "vitest";
import { jaConjugationTrainer, FREE_DRILL_VERB_FORM_MODULE } from "./provider";
import { formUnlockModule } from "./trainerRegistry";
import { CHAIN_FORM_LABELS, conjugateVerb, type ChainForm } from "../conjugationEngine";
import { getVerbsUpToModule } from "../conjugationTables";

/**
 * The free drill's provider filter (TestFlight #41 — "any verb I've learned").
 *  - every engine form is exposed, gated by the module that teaches it;
 *  - the gate table can't drift from the trainer's Track B gates;
 *  - a checked-but-gated form is never served, whatever the surface holds;
 *  - a pinned word is the only word served; a pin outside the pool fails closed.
 */
const free = jaConjugationTrainer.freeDrill!;
const ALL_VERB_FORMS = Object.keys(CHAIN_FORM_LABELS) as ChainForm[];

describe("free drill — forms", () => {
  it("exposes every verb form the engine conjugates, with a たべる example", () => {
    const forms = free.formsFor("verbs");
    expect(forms.map((f) => f.key).sort()).toEqual([...ALL_VERB_FORMS].sort());
    for (const f of forms) {
      expect(f.example.dictionary).toBe("たべる");
      expect(f.example.form).toBe(conjugateVerb("たべる", "ichidan", f.key as ChainForm));
      expect(Number.isFinite(f.unlockModule), `${f.key} must have a finite gate`).toBe(true);
    }
  });

  it("gate table agrees with the trainer's per-form gates wherever those exist", () => {
    for (const form of ALL_VERB_FORMS) {
      const trainer = formUnlockModule(form);
      if (Number.isFinite(trainer)) {
        expect(FREE_DRILL_VERB_FORM_MODULE[form], `free-drill gate for ${form}`).toBe(trainer);
      }
    }
    // The two N4 forms have no Track B point — their gates are the IR modules.
    expect(formUnlockModule("volitional")).toBe(Number.POSITIVE_INFINITY);
    expect(FREE_DRILL_VERB_FORM_MODULE.volitional).toBe(34);
    expect(FREE_DRILL_VERB_FORM_MODULE.ba).toBe(37);
  });

  it("adjective forms carry gates and a one-word example", () => {
    for (const cat of ["i-adj", "na-adj"]) {
      const forms = free.formsFor(cat);
      expect(forms.map((f) => f.key)).toEqual(["present", "negative", "past", "past-negative"]);
      for (const f of forms) {
        expect(Number.isFinite(f.unlockModule)).toBe(true);
        expect(f.example.dictionary).not.toBe("");
        expect(f.example.form).not.toBe("");
      }
    }
    expect(free.formsFor("i-adj").find((f) => f.key === "negative")!.example.form).toBe("たかくない");
  });

  it("never serves a checked form whose gate is above the level", () => {
    const all = new Set<string>(ALL_VERB_FORMS);
    const gatedAt12 = new Set(ALL_VERB_FORMS.filter((f) => FREE_DRILL_VERB_FORM_MODULE[f] > 12));
    expect(gatedAt12.size).toBeGreaterThan(0); // the check can fail: たい/volitional/ば sit above 12
    for (let i = 0; i < 200; i++) {
      const q = free.buildQuestion("verbs", 12, all);
      expect(q).not.toBeNull();
      expect(gatedAt12.has(q!.form as ChainForm), `served gated form ${q!.form} at M12`).toBe(false);
    }
  });

  it("returns null when every checked form is gated", () => {
    expect(free.buildQuestion("verbs", 12, new Set(["volitional", "ba"]))).toBeNull();
  });

  it("serves the ます-suffix forms once their gates are reached", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const q = free.buildQuestion("verbs", 11, new Set(["masu-neg", "masu-past", "masu-past-neg"]));
      seen.add(q!.form);
    }
    expect([...seen].sort()).toEqual(["masu-neg", "masu-past", "masu-past-neg"]);
  });
});

describe("free drill — browser + pin", () => {
  it("lists exactly the verbs taught up to the level, with class chips", () => {
    const items = free.listItems("verbs", 10);
    expect(items.map((i) => i.id)).toEqual(getVerbsUpToModule(10).map((v) => v.id));
    expect(items.length).toBeGreaterThan(free.listItems("verbs", 7).length);
    const taberu = items.find((i) => i.id === "taberu")!;
    expect(taberu).toMatchObject({ dictionary: "たべる", written: "食べる", classChip: "る" });
    expect(items.find((i) => i.dictionary === "する")?.classChip).toBe("irregular");
    expect(new Set(items.map((i) => i.classChip))).toEqual(new Set(["る", "う", "irregular"]));
  });

  it("a pinned verb is the only verb served, across the checked forms", () => {
    const forms = new Set(["masu", "nai", "te"]);
    const seenForms = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const q = free.buildQuestion("verbs", 10, forms, "taberu")!;
      expect(q.prompt).toBe("たべる");
      expect(q.written).toBe("食べる");
      expect(q.correct).toBe(conjugateVerb("たべる", "ichidan", q.form as ChainForm));
      expect(q.options).toContain(q.correct);
      seenForms.add(q.form);
    }
    expect([...seenForms].sort()).toEqual(["masu", "nai", "te"]);
  });

  it("a pin outside the level's pool fails closed", () => {
    const late = getVerbsUpToModule(17).find((v) => v.introducedAtModule > 10)!;
    expect(free.buildQuestion("verbs", 10, new Set(["masu"]), late.id)).toBeNull();
    expect(free.buildQuestion("verbs", 10, new Set(["masu"]), "not-a-verb")).toBeNull();
  });

  it("pins adjectives too", () => {
    const first = free.listItems("i-adj", 12)[0];
    const q = free.buildQuestion("i-adj", 12, new Set(["negative"]), first.id)!;
    expect(q.prompt).toBe(first.dictionary);
    expect(q.form).toBe("negative");
  });

  it("renders the written form as ruby segments", () => {
    const segs = free.renderWritten("たべる", "食べる", "たべて");
    expect(segs).toEqual([{ text: "食", ruby: "た" }, { text: "べて" }]);
    expect(free.renderWritten("する", undefined, "して")).toEqual([{ text: "して" }]);
  });
});
