import { describe, it, expect } from "vitest";
import {
  allStories,
  allConversations,
  getStories,
  getConversations,
} from "./index";
import { gateResidual, moduleOrder } from "./gate";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { levelBand, levelCeiling } from "./levels";
import type { Conversation, Story } from "./types";

const LANGS = ["ja", "ko"] as const;

/**
 * Gist questions must reach 3+ options — a 2-way gist is a 50% coin flip,
 * unlike the 4-way generated `detail` questions (see `storyQuestions.ts`).
 * Fix-round-2 (2026-07-31) re-verified all 13 fix-round-1 "exceptions"
 * against the real gate and found every one had a genuine third option once
 * the prompt was reframed away from the binary the author happened to pick
 * (or, for the two-price/turn cases, once a same-category distractor from
 * the module's own catalog was added). None survived — see Task 14
 * fix-round-2 report. Empty on purpose: don't add to this list to dodge the
 * bar; only add an entry after confirming, with an actual `gateResidual()`
 * run at the story's module, that no coherent third option exists.
 */
const TWO_OPTION_EXCEPTIONS = new Set<string>([]);

/** Every target string an item exposes, with the glosses that clear it. */
function storyTexts(s: Story): { label: string; text: string }[] {
  const lines = s.sentences.map((line, i) => ({ label: `${s.id}[${i}]`, text: line.text }));
  const questions = s.questions.flatMap((q) => [
    { label: `${s.id} q:${q.id} prompt`, text: q.prompt },
    ...q.options.map((o, i) => ({ label: `${s.id} q:${q.id} opt${i}`, text: o })),
  ]);
  return [...lines, ...questions];
}

function glossSurfaces(s: Story): string[] {
  return (s.glosses ?? []).map((g) => g.surface);
}

function conversationTexts(c: Conversation): { label: string; text: string }[] {
  return c.lines.map((line, i) => ({ label: `${c.id}[${i}]`, text: line.text }));
}

describe("curated content — gating", () => {
  for (const lang of LANGS) {
    it(`${lang}: getStories returns only module <= reached`, () => {
      const all = allStories(lang);
      for (const reached of [1, 3, 6, 12, 27]) {
        const got = getStories(lang, reached);
        expect(got.every((s) => s.module <= reached)).toBe(true);
        expect(got.length).toBe(all.filter((s) => s.module <= reached).length);
      }
    });

    it(`${lang}: getConversations returns only module <= reached`, () => {
      const all = allConversations(lang);
      for (const reached of [1, 3, 6, 12, 27]) {
        const got = getConversations(lang, reached);
        expect(got.every((c) => c.module <= reached)).toBe(true);
        expect(got.length).toBe(
          all.filter((c) => c.module <= reached).length,
        );
      }
    });

    it(`${lang}: a higher reached module is a superset of a lower one`, () => {
      const low = new Set(getConversations(lang, 5).map((c) => c.id));
      const high = getConversations(lang, 27).map((c) => c.id);
      for (const id of low) expect(high).toContain(id);
    });
  }

  it("empty for a language with no curated content", () => {
    expect(getStories("es", 27)).toEqual([]);
    expect(getConversations("es", 27)).toEqual([]);
    expect(getStories("zz", 27)).toEqual([]);
  });
});


// RESTAMP DEBT (2026-08-20, R1 landing). The fromModule restamp made the
// registry truthful, and truth moved a band of very common words LATER than
// the curated corpus assumed (がっこう→m19, こうえん→m32, へや/おかね→m27,
// ちかい/とおい→m20, テスト→m33, よみます/います→future, …): the live course
// USES them early without ever formally introducing them — Spencer's R2 says
// that class should be "a select few", and the R16 teach-them wave is the fix.
// Every piece below was comprehensible under the stale tags and clears as R16
// lands each word's early introduction. Frozen BY NAME with a stale check
// below: remove entries as they clear; NEW content faces the strict gate.
const JA_RESTAMP_DEBT = new Set([
  "ja-m6-the-missing-phone", "ja-m6-where-is-it", "ja-m7-at-the-airport",
  "ja-m7-my-day", "ja-m8-the-old-hat", "ja-m9-a-lively-town", "ja-m9-hanami",
  "ja-m9-the-english-test", "ja-m10-back-to-school", "ja-m10-the-wrong-train",
  "ja-m11-last-saturday", "ja-m11-two-oclock-at-the-station", "ja-m12-a-workday",
  "ja-m12-the-late-night-shop", "ja-m12-the-lost-key", "ja-m13-likes-and-wants",
  "ja-m13-the-day-off", "ja-m14-a-visitor", "ja-m14-the-letter-to-tom",
  "ja-m14-the-new-year-envelope", "ja-m15-the-trip-i-didnt-want",
  "ja-m15-the-weekend-ahead", "ja-m16-a-day-at-school", "ja-m16-the-first-hot-spring",
  "ja-m16-the-second-notebook", "ja-m17-the-building-behind-the-station",
  "ja-m17-the-quiet-carriage", "ja-m17-to-the-station", "ja-m18-a-warm-day",
  "ja-m18-the-tree-next-door", "ja-m19-my-family", "ja-m19-the-girl-in-the-photo",
  "ja-m19-the-town-that-dances", "ja-m20-feeling-sick", "ja-m20-the-wrong-tooth",
  "ja-m21-a-packed-lunch", "ja-m21-dinner-at-home", "ja-m21-exactly-five",
  "ja-m22-the-fish-i-said-i-hated", "ja-m22-what-i-eat", "ja-m23-a-day-at-the-sea",
  "ja-m23-a-party", "ja-m23-the-song-for-my-mother", "ja-m24-the-radio-next-door",
  "ja-m24-things-i-can-do", "ja-m25-an-old-friend", "ja-m25-studying-abroad",
  "ja-m25-the-watch-i-gave-away", "ja-m26-a-tiring-day",
  "ja-m26-the-call-i-kept-putting-off", "ja-m27-getting-stronger",
  "ja-m27-practice-every-day", "ja-m27-the-pictures-in-the-notebook",
  "ja-m29-cleaning-day", "ja-m29-two-broken-bicycles", "ja-m30-people-at-work",
  "ja-m30-the-club", "ja-m30-the-senior-i-grew-up-with",
]);

function contentGateFlags(lang: string): Set<string> {
  const flagged = new Set<string>();
  for (const story of allStories(lang))
    for (const { text } of storyTexts(story))
      if (gateResidual(text, lang, story.module, glossSurfaces(story)) !== "")
        flagged.add(story.id);
  for (const conv of allConversations(lang))
    for (const { text } of conversationTexts(conv))
      if (gateResidual(text, lang, conv.module) !== "") flagged.add(conv.id);
  return flagged;
}

describe("curated content — comprehensibility gate", () => {
  for (const lang of LANGS) {
    it(`${lang}: every authored story is comprehensible at its module`, () => {
      const failures: string[] = [];
      for (const story of allStories(lang)) {
        if (lang === "ja" && JA_RESTAMP_DEBT.has(story.id)) continue;
        for (const { label, text } of storyTexts(story)) {
          const residual = gateResidual(text, lang, story.module, glossSurfaces(story));
          if (residual !== "") {
            failures.push(`${label} (m${story.module}): unexplained "${residual}" in "${text}"`);
          }
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: every authored conversation is comprehensible at its module`, () => {
      const failures: string[] = [];
      for (const conv of allConversations(lang)) {
        if (lang === "ja" && JA_RESTAMP_DEBT.has(conv.id)) continue;
        for (const { label, text } of conversationTexts(conv)) {
          const residual = gateResidual(text, lang, conv.module);
          if (residual !== "") {
            failures.push(`${label} (m${conv.module}): unexplained "${residual}" in "${text}"`);
          }
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }

  it("ja: RESTAMP_DEBT entries stay honest — stale ones must be removed", () => {
    const flagged = contentGateFlags("ja");
    const stale = [...JA_RESTAMP_DEBT].filter((id) => !flagged.has(id)).sort();
    expect(
      stale,
      `these debt entries no longer fail the gate (an R16 landing cleared them — remove):\n${stale.join("\n")}`,
    ).toEqual([]);
  });
});

describe("curated content — structure", () => {
  for (const lang of LANGS) {
    it(`${lang}: every conversation learnerRole + line speaker is a declared speaker`, () => {
      for (const conv of allConversations(lang)) {
        const ids = new Set(conv.speakers.map((s) => s.id));
        expect(ids.size, `${conv.id}: duplicate speaker ids`).toBe(conv.speakers.length);
        if (conv.learnerRole !== undefined) {
          expect(ids.has(conv.learnerRole), `${conv.id}: learnerRole "${conv.learnerRole}" not a speaker`).toBe(true);
        }
        for (const line of conv.lines) {
          expect(ids.has(line.speaker), `${conv.id}: line speaker "${line.speaker}" not declared`).toBe(true);
        }
      }
    });

    it(`${lang}: ids are unique and language-tagged; sentences non-empty`, () => {
      const ids = new Set<string>();
      for (const item of [...allStories(lang), ...allConversations(lang)]) {
        expect(ids.has(item.id), `duplicate id ${item.id}`).toBe(false);
        ids.add(item.id);
        expect(item.languageId).toBe(lang);
        expect(item.module).toBeGreaterThan(0);
      }
      for (const c of allConversations(lang)) {
        expect(c.lines.length).toBeGreaterThanOrEqual(2);
      }
    });

    it(`${lang}: every line/sentence has a derived reading`, () => {
      for (const s of allStories(lang)) {
        for (const line of s.sentences) expect(line.reading, `${s.id}`).toBeTruthy();
      }
      for (const c of allConversations(lang)) {
        for (const line of c.lines) expect(line.reading, `${c.id}`).toBeTruthy();
      }
    });
  }
});

describe("curated content — level discipline", () => {
  for (const lang of LANGS) {
    it(`${lang}: sentence count is inside the level's band`, () => {
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        const band = levelBand(s.level);
        const n = s.sentences.length;
        if (n < band.minSentences || n > band.maxSentences) {
          failures.push(
            `${s.id}: L${s.level} allows ${band.minSentences}-${band.maxSentences} sentences, got ${n}`,
          );
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: gloss count is inside the level's budget`, () => {
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        const band = levelBand(s.level);
        const n = (s.glosses ?? []).length;
        if (n > band.maxGlosses) {
          failures.push(`${s.id}: L${s.level} allows ${band.maxGlosses} glosses, got ${n}`);
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: level never exceeds the module's ceiling`, () => {
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        const ceiling = levelCeiling(s.module);
        if (s.level > ceiling) {
          failures.push(`${s.id}: m${s.module} caps at L${ceiling}, got L${s.level}`);
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: every declared gloss appears in its story's text`, () => {
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        const body = s.sentences.map((x) => x.text).join(" ");
        for (const g of s.glosses ?? []) {
          if (!body.includes(g.surface)) {
            failures.push(`${s.id}: gloss "${g.surface}" never appears in the story`);
          }
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: every declared gloss is genuinely above level`, () => {
      // A gloss for a word the learner already knows at this module pads the
      // budget without teaching anything.
      //
      // "Knows it" means the SURFACE ITSELF is a taught atom by then. The
      // residual check alone is not enough: it is a greedy longest-match over
      // atom surfaces, so a word can come out fully "explained" by two shorter
      // atoms that have nothing to do with it — うるさい (m28) decomposes into
      // うる "to sell" (m9) + さい, the counter, and reads as known at m18.
      const atomFor = (surface: string) =>
        getNormalizedCourseAtoms(lang).find((a) => a.display === surface);
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        for (const g of s.glosses ?? []) {
          const atom = atomFor(g.surface);
          const known = atom
            ? moduleOrder(atom.module) <= s.module
            : gateResidual(g.surface, lang, s.module) === "";
          if (known) {
            failures.push(`${s.id}: gloss "${g.surface}" is already known at m${s.module}`);
          }
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: every gloss has a meaning, and atom-linked glosses are unique`, () => {
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        const seen = new Set<string>();
        for (const g of s.glosses ?? []) {
          if (!g.meaning.trim()) failures.push(`${s.id}: gloss "${g.surface}" has no meaning`);
          if (seen.has(g.surface)) failures.push(`${s.id}: duplicate gloss "${g.surface}"`);
          seen.add(g.surface);
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: every question's answer is one of its options`, () => {
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        for (const q of s.questions) {
          if (!q.options.includes(q.answer)) {
            failures.push(`${s.id} q:${q.id}: answer "${q.answer}" is not among its options`);
          }
          const minOptions = TWO_OPTION_EXCEPTIONS.has(s.id) ? 2 : 3;
          if (q.options.length < minOptions) {
            failures.push(`${s.id} q:${q.id}: needs at least ${minOptions} options`);
          }
          if (new Set(q.options).size !== q.options.length) {
            failures.push(`${s.id} q:${q.id}: duplicate options`);
          }
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it(`${lang}: every story has at least one authored gist question`, () => {
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        if (!s.questions.some((q) => q.kind === "gist")) {
          failures.push(`${s.id}: no authored gist question`);
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
});
