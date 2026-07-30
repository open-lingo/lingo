import { describe, it, expect } from "vitest";
import {
  allStories,
  allConversations,
  getStories,
  getConversations,
} from "./index";
import { gateResidual } from "./gate";
import type { Conversation, Story } from "./types";

const LANGS = ["ja", "ko"] as const;

/** Every target string an item exposes (used by the comprehensibility gate). */
function storyTexts(s: Story): { label: string; text: string }[] {
  return s.sentences.map((line, i) => ({ label: `${s.id}[${i}]`, text: line.text }));
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
          const residual = gateResidual(text, lang, story.module);
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
      for (const s of allStories(lang)) {
        expect(s.sentences.length).toBeGreaterThanOrEqual(4);
        expect(s.sentences.length).toBeLessThanOrEqual(8);
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
