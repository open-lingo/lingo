import { describe, it, expect } from "vitest";
import {
  ES_VERB_ENTRIES,
  ES_CONJUGATION_FORM_LABELS,
  type EsVerbEntry,
} from "@/features/languages/es/conjugationTables";
import { getConjugationGridConfig, type EsPersonId, type EsTenseId } from "./gridConfig";
import {
  buildMixRound,
  buildVerbRound,
  generateAdjacentDistractors,
  makeGridQuestion,
  MIX_ROUND_SIZE,
  OPTION_COUNT,
  type GridQuestion,
} from "./gridSession";

const config = getConjugationGridConfig("es")!;
const TENSES = config.tenses.map((t) => t.id);
const PERSONS = config.persons.map((p) => p.id);

// ─── gridConfig ──────────────────────────────────────────────────────────

describe("getConjugationGridConfig", () => {
  it("exists for es only — ja keeps its engine-backed trainer", () => {
    expect(getConjugationGridConfig("es")).not.toBeNull();
    expect(getConjugationGridConfig("ja")).toBeNull();
    expect(getConjugationGridConfig("ko")).toBeNull();
  });

  it("spans 3 tenses × 6 persons whose form keys all exist on every entry", () => {
    expect(TENSES).toEqual(["present", "preterite", "imperfect"]);
    expect(PERSONS).toEqual(["yo", "tu", "el", "nosotros", "vosotros", "ustedes"]);
    for (const entry of ES_VERB_ENTRIES) {
      for (const tense of TENSES) {
        for (const person of PERSONS) {
          expect(entry.forms[config.formKey(tense, person)]).toBeTruthy();
        }
      }
    }
  });

  it("derives person labels from ES_CONJUGATION_FORM_LABELS, not hardcoded strings", () => {
    for (const p of config.persons) {
      const raw = ES_CONJUGATION_FORM_LABELS[config.formKey("present", p.id)];
      expect(raw.startsWith(p.label)).toBe(true);
      // The parenthetical tense tag never leaks into the display label.
      expect(p.label).not.toMatch(/[()]/);
    }
    expect(config.persons.find((p) => p.id === "el")!.label).toBe("él / ella / usted");
    // vosotros carries the labels map's regional note through.
    expect(config.persons.find((p) => p.id === "vosotros")!.note).toBe("Spain");
  });
});

// ─── option generation invariants — full matrix ──────────────────────────

/** Strict adjacency set for one cell: same-verb same-tense other persons,
 *  same-verb same-person other tenses, other-verb same cell. */
function adjacentValues(verb: EsVerbEntry, tense: EsTenseId, person: EsPersonId): Set<string> {
  const values = new Set<string>();
  for (const p of PERSONS) {
    if (p !== person) values.add(verb.forms[config.formKey(tense, p)]);
  }
  for (const t of TENSES) {
    if (t !== tense) values.add(verb.forms[config.formKey(t, person)]);
  }
  for (const other of ES_VERB_ENTRIES) {
    if (other.id !== verb.id) values.add(other.forms[config.formKey(tense, person)]);
  }
  return values;
}

function expectValidQuestion(q: GridQuestion, verb: EsVerbEntry) {
  // 4 options, all unique, correct present and matching the table.
  expect(q.options.length).toBe(OPTION_COUNT);
  expect(new Set(q.options).size).toBe(OPTION_COUNT);
  expect(q.options).toContain(q.correct);
  expect(q.correct).toBe(verb.forms[config.formKey(q.tense, q.person)]);
  // Labels come from the language's labels map, not ad-hoc strings.
  expect(q.formLabel).toBe(ES_CONJUGATION_FORM_LABELS[config.formKey(q.tense, q.person)]);
}

describe("option generation — every verb × tense × person", () => {
  for (const verb of ES_VERB_ENTRIES) {
    it(`${verb.lemma}: 4 unique options incl. correct, distractors from adjacent cells`, () => {
      for (const tense of TENSES) {
        for (const person of PERSONS) {
          const q = makeGridQuestion(verb, tense, person, ES_VERB_ENTRIES, config, "seed");
          expectValidQuestion(q, verb);
          const adjacent = adjacentValues(verb, tense, person);
          for (const opt of q.options) {
            if (opt === q.correct) continue;
            expect(adjacent.has(opt), `${opt} adjacent to ${verb.lemma} ${tense}.${person}`).toBe(
              true,
            );
          }
        }
      }
    });
  }

  it("survives an empty other-verb pool (same-verb tiers still fill 3 distractors)", () => {
    const verb = ES_VERB_ENTRIES[0];
    const d = generateAdjacentDistractors(verb, "present", "yo", [], config, "seed");
    expect(d.length).toBe(OPTION_COUNT - 1);
    expect(new Set(d).size).toBe(OPTION_COUNT - 1);
    expect(d).not.toContain(verb.forms["present.yo"]);
  });

  it("dedupes Spanish syncretism (imperfect yo = imperfect él) out of the options", () => {
    const hablar = ES_VERB_ENTRIES.find((v) => v.id === "hablar")!;
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const q = makeGridQuestion(hablar, "imperfect", "yo", ES_VERB_ENTRIES, config, seed);
      // "hablaba" (also the él cell) is the correct answer — it must appear
      // exactly once even though the adjacent él cell holds the same string.
      expect(q.options.filter((o) => o === "hablaba").length).toBe(1);
    }
  });
});

// ─── verb rounds ─────────────────────────────────────────────────────────

describe("buildVerbRound", () => {
  const hablar = ES_VERB_ENTRIES.find((v) => v.id === "hablar")!;

  it("asks all 6 persons of the chosen verb × tense exactly once", () => {
    const round = buildVerbRound(hablar, "preterite", ES_VERB_ENTRIES, config, "seed-1");
    expect(round.length).toBe(6);
    expect(new Set(round.map((q) => q.person)).size).toBe(6);
    for (const q of round) {
      expect(q.verbId).toBe("hablar");
      expect(q.tense).toBe("preterite");
      expectValidQuestion(q, hablar);
    }
  });

  it("is stable given a seed", () => {
    const a = buildVerbRound(hablar, "present", ES_VERB_ENTRIES, config, "stable-seed");
    const b = buildVerbRound(hablar, "present", ES_VERB_ENTRIES, config, "stable-seed");
    expect(a).toEqual(b);
  });

  it("varies with the seed (retry reshuffles)", () => {
    const a = buildVerbRound(hablar, "present", ES_VERB_ENTRIES, config, "seed-a");
    const b = buildVerbRound(hablar, "present", ES_VERB_ENTRIES, config, "seed-b");
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

// ─── mix rounds ──────────────────────────────────────────────────────────

describe("buildMixRound", () => {
  it("draws unique (verb, person) cells from the given pool and tense", () => {
    const round = buildMixRound(ES_VERB_ENTRIES, "imperfect", config, "mix-seed");
    expect(round.length).toBe(MIX_ROUND_SIZE);
    const pairs = round.map((q) => `${q.verbId}:${q.person}`);
    expect(new Set(pairs).size).toBe(round.length);
    const poolIds = new Set(ES_VERB_ENTRIES.map((v) => v.id));
    for (const q of round) {
      expect(q.tense).toBe("imperfect");
      expect(poolIds.has(q.verbId)).toBe(true);
      expectValidQuestion(q, ES_VERB_ENTRIES.find((v) => v.id === q.verbId)!);
    }
  });

  it("clamps to the available cells when the pool is small", () => {
    const one = ES_VERB_ENTRIES.slice(0, 1); // 1 verb → 6 cells
    const round = buildMixRound(one, "present", config, "seed", 10);
    expect(round.length).toBe(6);
    expect(new Set(round.map((q) => q.person)).size).toBe(6);
  });

  it("is stable given a seed", () => {
    const a = buildMixRound(ES_VERB_ENTRIES, "present", config, "same");
    const b = buildMixRound(ES_VERB_ENTRIES, "present", config, "same");
    expect(a).toEqual(b);
  });
});
