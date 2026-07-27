/**
 * m11-neo module guards. Same 2026-07-26 module shape as m10 (invariant 25):
 * 11 teaching + 3 review + 1 challenge, reviews spread across thirds,
 * challenge lesson LAST.
 *
 * The two katakana row lessons are symbol lessons spliced in at module level
 * (not IR beats), so they are exempt from the sentence-shaped bars — hence
 * the guards run over the COMPILED lessons only, with the module-shape
 * assertions checked separately below over the full 15.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { M11_NEO_LESSONS } from "./m11-neo";
import { M10_NEO_LESSONS } from "./m10-neo";
import { M9_NEO_LESSONS } from "./m9-neo";
import { M8_NEO_LESSONS } from "./m8-neo";
import { M7_NEO_LESSONS } from "./m7-neo";
import { M3_NEO_LESSONS } from "./m3-neo";
import { M4_NEO_LESSONS } from "./m4-neo";
import { M5_NEO_LESSONS } from "./m5-neo";
import { M6_NEO_LESSONS } from "./m6-neo";

registerJaModuleContentLints("m11");

/** The IR-compiled lessons — katakana rows are a different taxonomy. */
const COMPILED = M11_NEO_LESSONS.filter((l) => !l.id.includes("-kata-"));

registerModuleBarGuards({
  moduleLabel: "m11-neo",
  lessons: COMPILED,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"],
  priorLessons: [
    ...M3_NEO_LESSONS,
    ...M4_NEO_LESSONS,
    ...M5_NEO_LESSONS,
    ...M6_NEO_LESSONS,
    ...M7_NEO_LESSONS,
    ...M8_NEO_LESSONS,
    ...M9_NEO_LESSONS,
    ...M10_NEO_LESSONS,
  ],
  canon: COURSE_CANON,
  requireChallengeStep: true,
  requireTeachFirst: true,
});

describe("m11-neo module shape (invariant 25)", () => {
  it("ships 15 lessons: 11 teaching + 3 review + 1 challenge", () => {
    expect(M11_NEO_LESSONS).toHaveLength(15);
    const reviews = M11_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M11_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M11_NEO_LESSONS.length - reviews.length - challenge.length).toBe(11);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M11_NEO_LESSONS[M11_NEO_LESSONS.length - 1].id).toBe("ja-m11-neo-challenge");
  });

  it("review lessons sit in the beginning/middle/end thirds", () => {
    const body = M11_NEO_LESSONS.filter((l) => !l.id.endsWith("-challenge"));
    const thirds = new Set(
      body
        .map((l, i) => [l, i] as const)
        .filter(([l]) => /-review(-\d+)?$/.test(l.id))
        .map(([, i]) => Math.min(2, Math.floor((i * 3) / body.length))),
    );
    expect([...thirds].sort()).toEqual([0, 1, 2]);
  });

  it("carries the two katakana row lessons (ruling 2026-07-26)", () => {
    const kata = M11_NEO_LESSONS.filter((l) => l.id.includes("-kata-")).map((l) => l.id);
    expect(kata).toEqual(["ja-m11-neo-kata-ra", "ja-m11-neo-kata-wa"]);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M11_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});
