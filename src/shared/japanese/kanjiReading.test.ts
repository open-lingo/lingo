import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Module-scoped spies the mocks read from. Reset in beforeEach.
const state = {
  initCalls: 0,
  convertCalls: 0,
  convertImpl: (str: string) => str,
  initShouldReject: false,
};

vi.mock("kuroshiro", () => {
  class FakeKuroshiro {
    async init(analyzer: { init: () => Promise<void> }) {
      state.initCalls += 1;
      await analyzer.init();
    }
    async convert(str: string, _opts: { to: string }) {
      state.convertCalls += 1;
      return state.convertImpl(str);
    }
  }
  return { default: FakeKuroshiro };
});

vi.mock("kuroshiro-analyzer-kuromoji", () => {
  class FakeAnalyzer {
    constructor(_opts: { dictPath?: string }) {}
    async init() {
      if (state.initShouldReject) {
        throw new Error("dict 404");
      }
    }
  }
  return { default: FakeAnalyzer };
});

// Import after mocks register. We need a fresh module each test so the
// memoized `initPromise` doesn't leak across cases — use the test-only
// reset helper to do that without dynamic re-imports.
import {
  convertToHiragana,
  __resetKanjiReadingForTests,
} from "./kanjiReading";

beforeEach(() => {
  state.initCalls = 0;
  state.convertCalls = 0;
  state.convertImpl = (str) => str;
  state.initShouldReject = false;
  __resetKanjiReadingForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("convertToHiragana", () => {
  it("returns empty input unchanged without invoking kuroshiro", async () => {
    const out = await convertToHiragana("");
    expect(out).toBe("");
    expect(state.initCalls).toBe(0);
    expect(state.convertCalls).toBe(0);
  });

  it("skip-fast: pure hiragana passes through without invoking kuroshiro", async () => {
    const out = await convertToHiragana("あい");
    expect(out).toBe("あい");
    expect(state.initCalls).toBe(0);
    expect(state.convertCalls).toBe(0);
  });

  it("katakana folds to hiragana inline without invoking kuroshiro", async () => {
    // STT engines (especially Whisper) sometimes return katakana for
    // foreign-feeling kana-only utterances. Codepoint shift handles it
    // cheaply; kuroshiro is reserved for actual kanji.
    expect(await convertToHiragana("アイ")).toBe("あい");
    expect(await convertToHiragana("ガッコウ")).toBe("がっこう");
    expect(await convertToHiragana("キョウ")).toBe("きょう");
    expect(state.convertCalls).toBe(0);
  });

  it("strips Latin/ASCII without invoking kuroshiro", async () => {
    // Whisper hallucinates English for some Japanese inputs ("ryu" → "you").
    // We can't compare Latin to kana, so strip it pre-scoring; if only
    // Latin remained the comparison correctly fails and the user retries.
    expect(await convertToHiragana("ai")).toBe("");
    expect(await convertToHiragana("you")).toBe("");
    expect(state.convertCalls).toBe(0);
  });

  it("strips Latin leakage while keeping kana", async () => {
    // Mixed output — kana survives, Latin gets stripped.
    expect(await convertToHiragana("あいyou")).toBe("あい");
    expect(await convertToHiragana("hello あい")).toBe("あい");
    expect(state.convertCalls).toBe(0);
  });

  it("converts a single kanji to its hiragana reading", async () => {
    state.convertImpl = (s) => (s === "愛" ? "あい" : s);
    const out = await convertToHiragana("愛");
    expect(out).toBe("あい");
    expect(state.initCalls).toBe(1);
    expect(state.convertCalls).toBe(1);
  });

  it("converts a mixed kanji + kana sentence", async () => {
    state.convertImpl = (s) =>
      s === "私は学生です" ? "わたしはがくせいです" : s;
    const out = await convertToHiragana("私は学生です");
    expect(out).toBe("わたしはがくせいです");
    expect(state.initCalls).toBe(1);
    expect(state.convertCalls).toBe(1);
  });

  it("initializes kuroshiro only once across multiple calls", async () => {
    state.convertImpl = (s) => (s === "愛" ? "あい" : s);
    await convertToHiragana("愛");
    await convertToHiragana("愛");
    await convertToHiragana("愛");
    expect(state.initCalls).toBe(1);
    expect(state.convertCalls).toBe(3);
  });

  it("shares init across concurrent first callers", async () => {
    state.convertImpl = (s) => (s === "愛" ? "あい" : s);
    const [a, b, c] = await Promise.all([
      convertToHiragana("愛"),
      convertToHiragana("愛"),
      convertToHiragana("愛"),
    ]);
    expect([a, b, c]).toEqual(["あい", "あい", "あい"]);
    expect(state.initCalls).toBe(1);
  });

  it("falls back to the raw input + warns once if init rejects", async () => {
    state.initShouldReject = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = await convertToHiragana("愛");
    const second = await convertToHiragana("学校");
    expect(first).toBe("愛");
    expect(second).toBe("学校");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(state.convertCalls).toBe(0);
  });

  it("falls back to the raw input if convert throws", async () => {
    state.convertImpl = () => {
      throw new Error("analyzer barfed");
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await convertToHiragana("愛");
    expect(out).toBe("愛");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
