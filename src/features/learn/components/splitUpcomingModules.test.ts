import { describe, expect, it } from "vitest";
import { splitUpcomingModules, moduleGroup } from "./LearnCourseMap";

describe("moduleGroup", () => {
  it("labels modules before / at / after the current index", () => {
    expect(moduleGroup(0, 2)).toBe("completed");
    expect(moduleGroup(1, 2)).toBe("completed");
    expect(moduleGroup(2, 2)).toBe("current");
    expect(moduleGroup(3, 2)).toBe("upcoming");
  });

  it("treats the first module as current when nothing is done", () => {
    expect(moduleGroup(0, 0)).toBe("current");
    expect(moduleGroup(1, 0)).toBe("upcoming");
  });
});

const mods = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `m${i}` }));

describe("splitUpcomingModules", () => {
  it("keeps completed + current + next 2 visible, collapses the rest", () => {
    const { visible, collapsed, splitIndex } = splitUpcomingModules(
      mods(10),
      3,
    );
    // currentIdx 3 + teaser 2 + 1 (inclusive of current) = 6 visible.
    expect(splitIndex).toBe(6);
    expect(visible.map((m) => m.id)).toEqual([
      "m0",
      "m1",
      "m2",
      "m3",
      "m4",
      "m5",
    ]);
    expect(collapsed.map((m) => m.id)).toEqual(["m6", "m7", "m8", "m9"]);
  });

  it("respects a custom teaser count", () => {
    const { visible, collapsed } = splitUpcomingModules(mods(10), 0, 1);
    // current m0 + 1 teaser = m0, m1 visible.
    expect(visible.map((m) => m.id)).toEqual(["m0", "m1"]);
    expect(collapsed.map((m) => m.id)).toEqual([
      "m2",
      "m3",
      "m4",
      "m5",
      "m6",
      "m7",
      "m8",
      "m9",
    ]);
  });

  it("does not collapse a single trailing module (folds it in)", () => {
    // currentIdx 4 + 2 + 1 = 7; modules.length 8 → tail of 1, not worth a row.
    const { visible, collapsed } = splitUpcomingModules(mods(8), 4);
    expect(collapsed).toHaveLength(0);
    expect(visible).toHaveLength(8);
  });

  it("does not collapse when current is near the end", () => {
    const { collapsed } = splitUpcomingModules(mods(6), 5);
    expect(collapsed).toHaveLength(0);
  });

  it("collapses exactly two trailing modules", () => {
    // currentIdx 3 + 2 + 1 = 6; length 8 → tail [m6, m7], worth collapsing.
    const { visible, collapsed } = splitUpcomingModules(mods(8), 3);
    expect(visible).toHaveLength(6);
    expect(collapsed.map((m) => m.id)).toEqual(["m6", "m7"]);
  });
});
