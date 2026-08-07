/**
 * m8-neo module guards. First module registered against the 2026-07-26
 * module shape (invariant 25): 11 teaching + 3 review + 1 challenge, reviews
 * spread across thirds, challenge lesson LAST.
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
import { M8_NEO_LESSONS } from "./m8-neo";
import { M7_NEO_LESSONS } from "./m7-neo";
import { M3_NEO_LESSONS } from "./m3-neo";
import { M4_NEO_LESSONS } from "./m4-neo";
import { M5_NEO_LESSONS } from "./m5-neo";
import { M6_NEO_LESSONS } from "./m6-neo";

registerJaModuleContentLints("m8");

/** The IR-compiled lessons — katakana rows are a different taxonomy. */
const COMPILED = M8_NEO_LESSONS.filter((l) => !l.id.includes("-kata-"));

registerModuleBarGuards({
  moduleLabel: "m8-neo",
  lessons: COMPILED,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
  priorLessons: [
    ...M3_NEO_LESSONS,
    ...M4_NEO_LESSONS,
    ...M5_NEO_LESSONS,
    ...M6_NEO_LESSONS,
    ...M7_NEO_LESSONS,
  ],
  canon: COURSE_CANON,
  requireChallengeStep: true,
  requireTeachFirst: true,
});

describe("m8-neo module shape (invariant 25)", () => {
  // 17, not the inv 25 ceiling of 15 — a DOCUMENTED per-module exemption
  // (Spencer 2026-08-06). The sound-change table is the one fact in the course
  // that pays twice (て here, た at m11), and it has five rows plus the
  // rebels; teaching each ending its own beat costs two lesson slots that
  // no other module needs. The ceiling holds everywhere else.
  it("ships 17 lessons: 13 teaching + 3 review + 1 challenge", () => {
    expect(M8_NEO_LESSONS).toHaveLength(17);
    const reviews = M8_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M8_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M8_NEO_LESSONS.length - reviews.length - challenge.length).toBe(13);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M8_NEO_LESSONS[M8_NEO_LESSONS.length - 1].id).toBe("ja-m8-neo-challenge");
  });

  it("review lessons sit in the beginning/middle/end thirds", () => {
    const body = M8_NEO_LESSONS.filter((l) => !l.id.endsWith("-challenge"));
    const thirds = new Set(
      body
        .map((l, i) => [l, i] as const)
        .filter(([l]) => /-review(-\d+)?$/.test(l.id))
        .map(([, i]) => Math.min(2, Math.floor((i * 3) / body.length))),
    );
    expect([...thirds].sort()).toEqual([0, 1, 2]);
  });

  it("carries the two katakana row lessons (ruling 2026-07-26)", () => {
    const kata = M8_NEO_LESSONS.filter((l) => l.id.includes("-kata-")).map((l) => l.id);
    expect(kata).toEqual(["ja-m8-neo-kata-sa", "ja-m8-neo-kata-ta"]);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M8_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});
