import { describe, it, expect } from "vitest";
import { jaInflectedForms, firstKanji } from "./jaSurfaceForms";
import type { CourseAtom } from "./courseAtoms";

function atom(partial: Partial<CourseAtom> & Pick<CourseAtom, "kana" | "meaningEn">): CourseAtom {
  return {
    id: partial.id ?? partial.kana,
    kana: partial.kana,
    kanji: partial.kanji,
    romaji: partial.romaji ?? "",
    meaningEn: partial.meaningEn,
    fromModule: partial.fromModule ?? "m7",
    kind: partial.kind ?? "vocab",
    pos: partial.pos ?? "noun",
  };
}

describe("jaInflectedForms — regression cases (spec §match.ts)", () => {
  it("食べました / たべました ← たべる (ichidan, in tables)", () => {
    const forms = jaInflectedForms(atom({ kana: "たべる", kanji: "食べる", meaningEn: "to eat" }));
    expect(forms).toContain("たべました");
    expect(forms).toContain("食べました");
  });

  it("会いましょう / あいましょう ← あう (godan, gloss-inferred, not in tables)", () => {
    const forms = jaInflectedForms(atom({ kana: "あう", kanji: "会う", meaningEn: "to meet" }));
    expect(forms).toContain("あいましょう");
    expect(forms).toContain("会いましょう");
  });

  it("住んでいる / すんでいる ← すむ (godan, progressive te+いる)", () => {
    const forms = jaInflectedForms(atom({ kana: "すむ", kanji: "住む", meaningEn: "to live in" }));
    expect(forms).toContain("すんでいる");
    expect(forms).toContain("住んでいる");
  });

  it("話しました / はなしました ← はなす (godan, gloss-inferred)", () => {
    const forms = jaInflectedForms(atom({ kana: "はなす", kanji: "話す", meaningEn: "to speak" }));
    expect(forms).toContain("はなしました");
    expect(forms).toContain("話しました");
  });

  it("飲まない / のまない ← のむ (godan negative)", () => {
    const forms = jaInflectedForms(atom({ kana: "のむ", kanji: "飲む", meaningEn: "to drink" }));
    expect(forms).toContain("のまない");
    expect(forms).toContain("飲まない");
  });
});

describe("jaInflectedForms — group resolution", () => {
  it("prefers generating from known atoms over deconjugating: る-verbs over-generate both groups", () => {
    // みる is ichidan in the tables → correct みた.
    const miru = jaInflectedForms(atom({ kana: "みる", kanji: "見る", meaningEn: "to see" }));
    expect(miru).toContain("みた"); // ichidan past
    expect(miru).toContain("見ました");

    // かえる (帰る) is godan in the tables → godan た is かえった.
    const kaeru = jaInflectedForms(atom({ kana: "かえる", kanji: "帰る", meaningEn: "to return" }));
    expect(kaeru).toContain("かえった");
  });

  it("an unknown る-verb (no table entry) yields BOTH ichidan and godan forms", () => {
    // Synthetic verb not in the tables; gloss marks it a verb, る is ambiguous.
    const forms = jaInflectedForms(atom({ kana: "ためる", meaningEn: "to save up" }));
    expect(forms).toContain("ためた"); // ichidan reading
    expect(forms).toContain("ためた"); // present regardless
    // godan reading of a る-verb produces a ん-euphonic past
    expect(forms).toContain("ためます"); // ichidan masu
  });

  it("returns [] for non-verb / non-adjective atoms", () => {
    expect(jaInflectedForms(atom({ kana: "みず", kanji: "水", meaningEn: "water" }))).toEqual([]);
    expect(jaInflectedForms(atom({ kana: "がっこう", meaningEn: "school" }))).toEqual([]);
  });

  it("does not leak the plain dictionary form into the inflected bucket", () => {
    const forms = jaInflectedForms(atom({ kana: "たべる", kanji: "食べる", meaningEn: "to eat" }));
    expect(forms).not.toContain("たべる");
    expect(forms).not.toContain("食べる");
  });
});

describe("jaInflectedForms — i-adjectives (from ADJ_ENTRIES)", () => {
  it("expands a curriculum i-adjective (おおきい)", () => {
    const forms = jaInflectedForms(atom({ kana: "おおきい", kanji: "大きい", meaningEn: "big" }));
    expect(forms).toContain("おおきくない");
    expect(forms).toContain("おおきかった");
    expect(forms).toContain("大きくなかった");
  });
});

describe("firstKanji", () => {
  it("takes the first written variant", () => {
    expect(firstKanji("川 / 河")).toBe("川");
    expect(firstKanji("見る  観る")).toBe("見る");
    expect(firstKanji(undefined)).toBeUndefined();
  });
});
