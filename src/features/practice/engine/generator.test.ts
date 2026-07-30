import { describe, it, expect } from "vitest";
import { getDictionaryEntries } from "@/shared/dictionary";
import { getSentenceTemplates } from "@/features/practice/data/sentenceTemplates";
import { generatePracticeItems } from "./generator";
import { getReachedModule } from "./learnedContent";
import type { LearnerStores, PracticeItem } from "./types";
import { KO_TEMPLATES } from "@/features/practice/data/sentenceTemplates/ko";

function moduleNum(m: string | undefined): number {
  const match = /^m(\d+)$/.exec(m ?? "");
  return match ? Number(match[1]) : 0;
}

/** Unlock every atom of `lang` whose numeric unlock module is in [1, maxModule]. */
function unlockThroughModule(lang: string, maxModule: number): Set<string> {
  return new Set(
    getDictionaryEntries(lang)
      .filter((e) => {
        const n = moduleNum(e.unlockModule);
        return n >= 1 && n <= maxModule;
      })
      .map((e) => e.id),
  );
}

const LANGS = ["ja", "ko"] as const;

describe.each(LANGS)("generatePracticeItems (%s)", (lang) => {
  const unlocked = unlockThroughModule(lang, 8);
  const stores: LearnerStores = { unlocked, srs: {} };
  const reached = getReachedModule(lang, stores);

  it("fills every slot with a known, correct-POS atom — no unknown words, no empty slots", () => {
    const items = generatePracticeItems(lang, {
      surface: "reading",
      count: 12,
      seed: 42,
      stores,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      // No unfilled placeholder left behind.
      expect(item.target).not.toMatch(/\{[a-z]+\}/i);
      expect(item.translation).not.toMatch(/\{[a-z]+\}/i);
      // Every exercised atom is one the learner actually knows.
      for (const id of item.exercisedAtomIds) {
        expect(unlocked.has(id)).toBe(true);
      }
      // Generated (non-seed) items exercise at least one atom.
      if (item.sourceTemplateId?.startsWith(`${lang}:`) === false) {
        expect(item.exercisedAtomIds.length).toBeGreaterThan(0);
      }
    }
  });

  it("only offers templates the learner's reached module satisfies", () => {
    const items = generatePracticeItems(lang, {
      surface: "speaking",
      count: 20,
      seed: 7,
      stores,
    });
    const byId = new Map(getSentenceTemplates(lang).map((t) => [t.id, t]));
    for (const item of items) {
      const template = item.sourceTemplateId
        ? byId.get(item.sourceTemplateId)
        : undefined;
      if (!template) continue; // authored seed, not a template
      const min = template.grammarGate?.minModule ?? 0;
      expect(min).toBeLessThanOrEqual(reached);
    }
  });

  it("is deterministic per seed and fresh across seeds", () => {
    const a = generatePracticeItems(lang, { surface: "reading", count: 6, seed: 123, stores });
    const b = generatePracticeItems(lang, { surface: "reading", count: 6, seed: 123, stores });
    expect(a).toEqual(b);

    const firsts = new Set(
      [1, 2, 3, 4, 5, 6].map(
        (s) =>
          generatePracticeItems(lang, { surface: "reading", count: 4, seed: s, stores })[0]
            ?.target,
      ),
    );
    expect(firsts.size).toBeGreaterThan(1);
  });

  it("reading items carry a blank whose answer + distractors are all known same-POS words", () => {
    const knownSurfaces = new Set(
      getDictionaryEntries(lang)
        .filter((e) => unlocked.has(e.id))
        .map((e) => e.surface),
    );
    const items = generatePracticeItems(lang, {
      surface: "reading",
      count: 10,
      seed: 99,
      stores,
    });
    const generated = items.filter((i) => i.blank);
    expect(generated.length).toBeGreaterThan(0);
    for (const item of generated) {
      const blank = item.blank!;
      expect(knownSurfaces.has(blank.answer)).toBe(true);
      // The answer word appears verbatim in the target (so a surface can mask it).
      expect(item.target.includes(blank.answer)).toBe(true);
      for (const d of blank.distractors) {
        expect(knownSurfaces.has(d.surface)).toBe(true);
        expect(d.surface).not.toBe(blank.answer);
      }
    }
  });

  it("low-vocab learner degrades gracefully (fewer items, no crash)", () => {
    const oneNoun = getDictionaryEntries(lang, { pos: "noun", maxUnlockModule: 8 })[0];
    const tiny: LearnerStores = { unlocked: new Set([oneNoun.id]), srs: {} };
    const items = generatePracticeItems(lang, {
      surface: "reading",
      count: 8,
      seed: 5,
      stores: tiny,
    });
    // Never crashes; every produced item is still valid + uses only the known word.
    for (const item of items) {
      expect(item.target).not.toMatch(/\{[a-z]+\}/i);
      for (const id of item.exercisedAtomIds) expect(id).toBe(oneNoun.id);
    }
  });

  it("returns [] when the learner has reached nothing gateable and no seeds fit", () => {
    const m1Noun = getDictionaryEntries(lang).find((e) => e.unlockModule === "m1");
    const stores1: LearnerStores = {
      unlocked: new Set(m1Noun ? [m1Noun.id] : []),
      srs: {},
    };
    const items = generatePracticeItems(lang, {
      surface: "reading",
      count: 6,
      seed: 1,
      stores: stores1,
    });
    // m1 is below every template's gate and below every speaking-prompt minModule.
    expect(items).toEqual<PracticeItem[]>([]);
  });
});

describe("KO particle alternation (batchim honesty)", () => {
  const eat = KO_TEMPLATES.find((t) => t.id === "ko-x-eul-reul-meogeoyo")!;
  function known(surface: string, reading: string) {
    return { id: `ko:${surface}`, surface, reading, meaningEn: "x", pos: "noun" as const, tier: "new" as const, due: false, weight: 1 };
  }

  it("chooses 를 after a vowel-final noun and 을 after a consonant-final (batchim) noun", () => {
    // 커피 (coffee) ends in 피 — no batchim → 를.
    const vowel = eat.render!({ x: known("커피", "keopi") });
    expect(vowel.target).toBe("커피를 먹어요");
    expect(vowel.reading).toBe("keopireul meogeoyo");

    // 물 (water) ends in ㄹ batchim → 을.
    const consonant = eat.render!({ x: known("물", "mul") });
    expect(consonant.target).toBe("물을 먹어요");
    expect(consonant.reading).toBe("muleul meogeoyo");
  });
});
