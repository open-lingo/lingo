/**
 * KO sibling-set invariants.
 *
 * These sets are the ONLY distractor source for Korean cloze items, so the bar
 * is "genuinely confusable in the same slot" — a bad entry does not merely
 * weaken an item, it makes it unanswerable. The checks below guard the two
 * failure modes that are mechanical enough to test: a set too small to ever
 * produce the two distractors a cloze needs, and a member whose "sibling" is
 * really an inflection of it (which would test conjugation, not vocabulary).
 */
import { describe, it, expect } from "vitest";
import { KO_SIBLING_SETS, siblingsOf } from "../koSiblingSets";
import { getSiblingSurfaces, hasSiblingSets } from "../../siblingResolver";
import { KO_ATOMS_BY_SURFACE } from "../courseAtoms";

describe("KO sibling sets", () => {
  it("resolves through the language-agnostic resolver", () => {
    expect(hasSiblingSets("ko")).toBe(true);
    expect(getSiblingSurfaces("ko", "커피")).toContain("우유");
    expect(getSiblingSurfaces("ko", "학교")).toContain("회사");
  });

  it("groups the words a learner would actually mix up", () => {
    expect(siblingsOf("식당")).toEqual(expect.arrayContaining(["학교", "회사", "병원"]));
    expect(siblingsOf("엄마")).toEqual(expect.arrayContaining(["아빠", "누나", "동생"]));
    expect(siblingsOf("월요일")).toEqual(expect.arrayContaining(["화요일", "일요일"]));
    expect(siblingsOf("가요")).toEqual(expect.arrayContaining(["와요", "있어요"]));
    expect(siblingsOf("비싸요")).toEqual(expect.arrayContaining(["싸요", "좋아요"]));
  });

  it("returns [] for an uncategorised word rather than throwing", () => {
    expect(siblingsOf("없는말")).toEqual([]);
  });

  it("gives every member at least the two siblings a cloze item needs", () => {
    for (const [name, members] of Object.entries(KO_SIBLING_SETS)) {
      expect(`${name}: ${members.length}`).toBe(`${name}: ${new Set(members).size}`);
      expect(members.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("never pairs a word with its own inflection", () => {
    // Same rule the cloze builder enforces at render time: a shared leading run
    // means the two are forms of one word (좋아요 / 좋았어요), and offering one
    // against the other quizzes the ending, not the vocabulary.
    for (const members of Object.values(KO_SIBLING_SETS)) {
      for (const a of members) {
        for (const b of members) {
          if (a === b) continue;
          expect(b.startsWith(a)).toBe(false);
        }
      }
    }
  });

  it("keeps Sino and native numerals in separate sets", () => {
    // Both render as "four" in the gloss the learner is shown, so an item
    // offering 사 against 넷 has two right answers.
    expect(siblingsOf("넷")).not.toContain("사");
    expect(siblingsOf("아홉")).not.toContain("구");
  });

  it("names only surfaces the course teaches, or plausible future vocab", () => {
    // Not every entry must be taught yet (the builder intersects with the
    // learner's known atoms), but the SETS THAT CARRY THE COURSE must overlap
    // the atom registry — otherwise a rename silently empties them.
    for (const key of ["place", "family", "foodNoun", "drinkNoun", "weekday", "actionVerbPolite"]) {
      const members = KO_SIBLING_SETS[key];
      const taught = members.filter((m) => KO_ATOMS_BY_SURFACE.has(m));
      expect(`${key}: ${taught.length >= 3}`).toBe(`${key}: true`);
    }
  });
});
