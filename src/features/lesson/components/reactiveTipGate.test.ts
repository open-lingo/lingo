import { describe, it, expect } from "vitest";
import { tipWrongCore, typedAnswerExhibitsTipError } from "./reactiveTipGate";

const NAI_RU_TIP = {
  wrongJa: "ごはんを たべるない。",
  rightJa: "ごはんを たべない。",
};

describe("tipWrongCore", () => {
  it("extracts the anti-pattern chunk absent from the right form", () => {
    expect(tipWrongCore(NAI_RU_TIP)).toBe("たべるない");
  });

  it("returns null when every wrong chunk also occurs in the right form", () => {
    expect(
      tipWrongCore({ wrongJa: "ごはんを たべない。", rightJa: "ごはんを たべない。" }),
    ).toBeNull();
  });
});

describe("typedAnswerExhibitsTipError", () => {
  it("fires when the learner actually produced the anti-pattern", () => {
    expect(typedAnswerExhibitsTipError(NAI_RU_TIP, "きょうたべるない")).toBe(true);
    expect(typedAnswerExhibitsTipError(NAI_RU_TIP, "ごはんを たべるない。")).toBe(true);
  });

  it("suppresses when the mistake is something else entirely (m6 walk repro: missing topic-は got the たべるない card)", () => {
    expect(typedAnswerExhibitsTipError(NAI_RU_TIP, "きょうたべない")).toBe(false);
    expect(typedAnswerExhibitsTipError(NAI_RU_TIP, "ぱんを たべない")).toBe(false);
  });

  it("keeps legacy always-fire behavior when the tip has no extractable core", () => {
    expect(
      typedAnswerExhibitsTipError(
        { wrongJa: "たべない。", rightJa: "たべない" },
        "anything",
      ),
    ).toBe(true);
  });
});
