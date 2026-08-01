import { describe, it, expect } from "vitest";
import {
  allStories,
  allConversations,
  getStories,
  getConversations,
} from "./index";
import { gateResidual } from "./gate";
import { levelBand, levelCeiling } from "./levels";
import type { Conversation, Story } from "./types";

const LANGS = ["ja", "ko"] as const;

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

describe("curated content — comprehensibility gate", () => {
  for (const lang of LANGS) {
    it(`${lang}: every authored story is comprehensible at its module`, () => {
      const failures: string[] = [];
      for (const story of allStories(lang)) {
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
      const failures: string[] = [];
      for (const s of allStories(lang)) {
        for (const g of s.glosses ?? []) {
          if (gateResidual(g.surface, lang, s.module) === "") {
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
          if (q.options.length < 2) {
            failures.push(`${s.id} q:${q.id}: needs at least 2 options`);
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
