import { describe, it, expect } from "vitest";
import { romajaToHangul, koreanInputMatches } from "./romajaToHangul";
import { romanizeKorean } from "./hangulRomanize";

describe("romajaToHangul", () => {
  it("composes basic greetings", () => {
    expect(romajaToHangul("annyeong")).toBe("안녕");
    expect(romajaToHangul("annyeonghaseyo")).toBe("안녕하세요");
  });

  it("handles single consonant onsets across syllables (no false coda)", () => {
    expect(romajaToHangul("haseyo")).toBe("하세요");
    expect(romajaToHangul("seoul")).toBe("서울");
    // Romaja is lossy: RR already applied ㅂ→ㅁ nasalization, so reversing
    // "gamsahamnida" yields the literal 감사함니다, not the source 감사합니다.
    // The Writing trainer's grader compares romanizations, so both accept.
    expect(romajaToHangul("gamsahamnida")).toBe("감사함니다");
  });

  it("composes common vocab", () => {
    expect(romajaToHangul("saram")).toBe("사람"); // person
    expect(romajaToHangul("hakgyo")).toBe("학교"); // school
    expect(romajaToHangul("chingu")).toBe("친구"); // friend
    expect(romajaToHangul("ireum")).toBe("이름"); // name
    expect(romajaToHangul("mul")).toBe("물"); // water
    expect(romajaToHangul("neu")).toBe("느");
  });

  it("handles vowel-initial syllables (silent ㅇ onset)", () => {
    expect(romajaToHangul("a")).toBe("아");
    expect(romajaToHangul("eo")).toBe("어");
    expect(romajaToHangul("ui")).toBe("의");
    expect(romajaToHangul("aniyo")).toBe("아니요"); // no
  });

  it("reads 'ng' as a coda, not n+g", () => {
    expect(romajaToHangul("sarang")).toBe("사랑"); // love
    expect(romajaToHangul("gang")).toBe("강"); // river
  });

  it("passes through Hangul, spaces, and punctuation untouched", () => {
    expect(romajaToHangul("안녕")).toBe("안녕");
    expect(romajaToHangul("annyeong!")).toBe("안녕!");
    expect(romajaToHangul("na neun")).toBe("나 는");
    expect(romajaToHangul("")).toBe("");
  });

  it("degrades gracefully on partial input while typing", () => {
    // A trailing consonant with no vowel yet stays as the raw letter, so the
    // field stabilizes into Hangul as the learner keeps typing.
    expect(romajaToHangul("ann")).toBe("안n");
    expect(romajaToHangul("annyeongh")).toBe("안녕h");
  });

  it("round-trips a handful of words through the romanizer", () => {
    for (const hangul of ["안녕", "사람", "친구", "강", "서울"]) {
      const roma = romanizeKorean(hangul);
      expect(romajaToHangul(roma)).toBe(hangul);
    }
  });
});

describe("koreanInputMatches", () => {
  it("accepts exact Hangul (IME users)", () => {
    expect(koreanInputMatches("안녕", "안녕")).toBe(true);
    expect(koreanInputMatches("안녕하세요", "안녕하세요")).toBe(true);
  });

  it("accepts romaja that composes to the target (desktop QWERTY)", () => {
    expect(koreanInputMatches("annyeong", "안녕")).toBe(true);
    expect(koreanInputMatches("annyeonghaseyo", "안녕하세요")).toBe(true);
    expect(koreanInputMatches("chingu", "친구")).toBe(true);
    expect(koreanInputMatches("saram", "사람")).toBe(true);
  });

  it("accepts pronunciation-equivalent romaja through RR assimilation", () => {
    // 감사합니다 romanizes to gamsahamnida (ㅂ→ㅁ); literal reversal gives
    // 감사함니다, but the pronunciation compare still passes.
    expect(koreanInputMatches("gamsahamnida", "감사합니다")).toBe(true);
  });

  it("is case/space insensitive", () => {
    expect(koreanInputMatches("Annyeong", "안녕")).toBe(true);
    expect(koreanInputMatches("na neun", "나는")).toBe(true);
  });

  it("rejects a wrong answer", () => {
    expect(koreanInputMatches("annyeong", "감사합니다")).toBe(false);
    expect(koreanInputMatches("", "안녕")).toBe(false);
  });
});
