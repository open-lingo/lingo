import { describe, it, expect } from "vitest";
import {
  REVIEW_ENTRIES,
  RESOLVED_ENTRIES,
  REVIEW_QUEUE_READ_ME,
} from "./reviewQueue";

/**
 * The mechanical half of the read-me contract: every entry Spencer sees
 * must carry the plain-language body, a concrete example, and a specific
 * ask. An agent that files an entry without an example fails here instead
 * of shipping an unanswerable card.
 */
describe("reviewQueue catalog", () => {
  const all = [...REVIEW_ENTRIES, ...RESOLVED_ENTRIES];

  it("ids are unique and follow R#/Q# (R = decision, Q = finding)", () => {
    const ids = all.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of all) {
      expect(e.id, `${e.id} prefix must match kind`).toMatch(
        e.kind === "decision" ? /^R\d+$/ : /^Q\d+$/,
      );
    }
  });

  it("every open entry has body paragraphs, a concrete example, and an ask", () => {
    for (const e of REVIEW_ENTRIES.filter((x) => !x.resolved)) {
      expect(e.title.trim(), `${e.id} title`).not.toBe("");
      expect(e.added, `${e.id} added date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.body.length, `${e.id} body`).toBeGreaterThan(0);
      for (const p of e.body) expect(p.trim(), `${e.id} body para`).not.toBe("");
      // The read-me's hard rule: no entry without a real example.
      expect(e.example.trim().length, `${e.id} example`).toBeGreaterThan(40);
      expect(e.ask.trim(), `${e.id} ask`).not.toBe("");
    }
  });

  it("links are language-relative paths the page can prefix", () => {
    for (const e of all) {
      for (const l of e.links ?? []) {
        expect(l.href, `${e.id} link ${l.label}`).toMatch(/^\//);
        expect(l.href, `${e.id} link ${l.label} must not carry a lang prefix`).not.toMatch(
          /^\/(ja|es|ko)\//,
        );
      }
    }
  });

  it("resolved entries carry their outcome", () => {
    for (const e of RESOLVED_ENTRIES) {
      expect(e.resolved?.trim(), `${e.id} outcome`).toBeTruthy();
    }
  });

  it("the read-me renders (non-empty instructions)", () => {
    expect(REVIEW_QUEUE_READ_ME.length).toBeGreaterThan(2);
    for (const p of REVIEW_QUEUE_READ_ME) expect(p.trim()).not.toBe("");
  });
});
