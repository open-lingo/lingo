import { describe, expect, it } from "vitest";
import { stringsFor } from "./transitStrings";

describe("stringsFor", () => {
  it("has a full ko entry (no es fallback)", () => {
    const ko = stringsFor("ko");
    expect(ko.mapTitle).toBe("학습 노선도");
    expect(ko.numerals).toEqual(["일", "이", "삼"]);
    expect(ko.seal).toBe("완");
    expect(ko.zones).toHaveLength(3);
  });

  it("falls back to es for unknown languages", () => {
    expect(stringsFor("fr").mapTitle).toBe(stringsFor("es").mapTitle);
  });

  it("keeps ja signage intact", () => {
    const ja = stringsFor("ja");
    expect(ja.seal).toBe("済");
    expect(ja.departuresBoard).toBe("Lessons · 発車標");
    expect(ja.mapTitle).toBe("学習路線図");
  });
});
