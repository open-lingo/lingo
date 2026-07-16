import { describe, it, expect } from "vitest";
import { romanizeKorean, annotateKorean } from "./hangulRomanize";

describe("romanizeKorean", () => {
  it("romanizes plain syllables (no finals)", () => {
    expect(romanizeKorean("아이")).toBe("ai");
    expect(romanizeKorean("우리")).toBe("uri");
    expect(romanizeKorean("나무")).toBe("namu");
    expect(romanizeKorean("가다")).toBe("gada");
  });

  it("romanizes blocked finals with neutralization", () => {
    expect(romanizeKorean("밥")).toBe("bap");
    expect(romanizeKorean("책")).toBe("chaek");
    expect(romanizeKorean("서울")).toBe("seoul");
    expect(romanizeKorean("부엌")).toBe("bueok"); // ㅋ final → k
    expect(romanizeKorean("꽃")).toBe("kkot"); // ㅊ final → t
  });

  it("applies liaison onto a following ㅇ onset", () => {
    expect(romanizeKorean("한국어")).toBe("hangugeo");
    expect(romanizeKorean("국어")).toBe("gugeo");
    expect(romanizeKorean("음악")).toBe("eumak");
    expect(romanizeKorean("직업")).toBe("jigeop");
    expect(romanizeKorean("강아지")).toBe("gangaji"); // ㅇ final does NOT relink
  });

  it("handles ㅎ elision and aspiration", () => {
    expect(romanizeKorean("좋아요")).toBe("joayo");
    expect(romanizeKorean("좋다")).toBe("jota");
    expect(romanizeKorean("놓고")).toBe("noko");
    expect(romanizeKorean("축하")).toBe("chuka");
    expect(romanizeKorean("입학")).toBe("ipak");
  });

  it("applies nasalization", () => {
    expect(romanizeKorean("학년")).toBe("hangnyeon");
    expect(romanizeKorean("감사합니다")).toBe("gamsahamnida");
    expect(romanizeKorean("국물")).toBe("gungmul");
    expect(romanizeKorean("종로")).toBe("jongno");
  });

  it("applies lateralization", () => {
    expect(romanizeKorean("신라")).toBe("silla");
    expect(romanizeKorean("설날")).toBe("seollal");
  });

  it("applies palatalization (ㄷ/ㅌ + 이)", () => {
    expect(romanizeKorean("굳이")).toBe("guji");
    expect(romanizeKorean("같이")).toBe("gachi");
  });

  it("resolves double-final clusters via liaison", () => {
    expect(romanizeKorean("읽어")).toBe("ilgeo");
    expect(romanizeKorean("값이")).toBe("gapsi");
    expect(romanizeKorean("앉아")).toBe("anja");
  });

  it("keeps assimilation inside words but passes literals through", () => {
    expect(romanizeKorean("안녕하세요")).toBe("annyeonghaseyo");
    expect(romanizeKorean("한국 사람")).toBe("hanguk saram");
    expect(romanizeKorean("네, 감사합니다!")).toBe("ne, gamsahamnida!");
    expect(romanizeKorean("Wi-Fi 비밀번호")).toBe("Wi-Fi bimilbeonho");
  });

  it("leaves non-Hangul text untouched", () => {
    expect(romanizeKorean("hello")).toBe("hello");
    expect(romanizeKorean("123")).toBe("123");
    expect(romanizeKorean("")).toBe("");
  });
});

describe("annotateKorean", () => {
  it("splits Hangul words into ruby fragments and passes literals through", () => {
    expect(annotateKorean("한국 사람")).toEqual([
      { text: "한국", reading: "hanguk" },
      { text: " " },
      { text: "사람", reading: "saram" },
    ]);
  });

  it("carries word-level assimilated romanization as the reading", () => {
    expect(annotateKorean("학년")).toEqual([
      { text: "학년", reading: "hangnyeon" },
    ]);
  });

  it("emits a reading-less fragment for pure punctuation", () => {
    expect(annotateKorean("좋아요!")).toEqual([
      { text: "좋아요", reading: "joayo" },
      { text: "!" },
    ]);
  });
});
