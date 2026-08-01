import { describe, it, expect } from "vitest";
import { gateResidual, isComprehensible } from "./gate";

describe("gate — declared glosses", () => {
  it("an above-level word fails without a gloss", () => {
    // 花見 (hanami) is not a course atom at any module.
    expect(gateResidual("はなみに いきます。", "ja", 7)).not.toBe("");
  });

  it("the same word passes when declared as a gloss", () => {
    expect(gateResidual("はなみに いきます。", "ja", 7, ["はなみ"])).toBe("");
  });

  it("a gloss only clears its own surface, not other unknowns", () => {
    const residual = gateResidual("はなみと おはなみ。", "ja", 7, ["はなみ"]);
    expect(residual).toBe("お");
  });

  it("isComprehensible threads the gloss list through", () => {
    expect(isComprehensible("はなみに いきます。", "ja", 7)).toBe(false);
    expect(isComprehensible("はなみに いきます。", "ja", 7, ["はなみ"])).toBe(true);
  });

  it("omitting glosses preserves existing behavior", () => {
    // わたし is not taught until m4, so use words already in-level at m3
    // (がくせい m3 atom + です function morpheme) to prove the 3-arg call
    // still gates cleanly with the new default parameter in place.
    expect(gateResidual("がくせいです。", "ja", 3)).toBe("");
  });
});
