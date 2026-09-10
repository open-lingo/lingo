/**
 * `stripRegisterCue` — rung 1b KO-source de-coupling #4b
 * (docs/ko-source-rung1a-2026-09-10.md §2b, docs/ko-source-rung1b-
 * 2026-09-10.md). Hoisted out of `compileModule`'s closure (was a local
 * `meaningOf` const) specifically so it's directly unit-testable without
 * building a synthetic IR module.
 *
 * Two things this guards:
 *   1. Behavior-preserving for English — the exact regression the function
 *      was written for (164 filler options across m5-m20 reading "Say
 *      politely: …" as the answer to "what does this sentence mean?").
 *   2. A Korean-language cue is neither stripped (the regex is anchored on
 *      literal ASCII English verbs — Hangul can never match it) nor
 *      collapsed to empty by the `|| en` fallback — it passes through
 *      byte-for-byte unchanged. This is the safe "fails closed" behaviour
 *      documented at the function's definition; the real fix (a structured
 *      `cue?: string` field, so this function is never needed at all) is a
 *      schema change out of scope for this rung.
 */
import { describe, it, expect } from "vitest";
import { stripRegisterCue } from "./moduleCompiler";

describe("stripRegisterCue", () => {
  it("strips a 'Say politely: …' register cue, leaving just the meaning", () => {
    expect(stripRegisterCue("Say politely: I work from nine.")).toBe(
      "I work from nine.",
    );
  });

  it("strips each of the five recognized cue verbs, case-insensitively", () => {
    expect(stripRegisterCue("Ask casually: Where's the station?")).toBe(
      "Where's the station?",
    );
    expect(stripRegisterCue("answer formally: I am a student.")).toBe(
      "I am a student.",
    );
    expect(stripRegisterCue("Reply: Sounds good.")).toBe("Sounds good.");
    expect(stripRegisterCue("TELL your friend: Let's go.")).toBe("Let's go.");
  });

  it("leaves an unprefixed sentence untouched", () => {
    expect(stripRegisterCue("I am a student.")).toBe("I am a student.");
  });

  it("does not strip a sentence that genuinely MEANS a 'say' phrase with no colon", () => {
    expect(stripRegisterCue("Say it one more time.")).toBe(
      "Say it one more time.",
    );
  });

  it("never collapses to an empty string — falls back to the original text", () => {
    // A cue verb immediately followed by a colon and nothing else would
    // strip to "" without the `|| en` guard.
    expect(stripRegisterCue("Say:")).toBe("Say:");
  });

  it("passes a Korean-language cue-shaped sentence through completely unchanged", () => {
    // Hypothetical KO-authoring-convention cue ("정중하게 말해요:" ≈ "say
    // politely:") — the regex is anchored on literal ASCII English verbs,
    // so Hangul text can never match it, cue-shaped or not.
    const koCue = "정중하게 말해요: 저는 아홉 시부터 일해요.";
    expect(stripRegisterCue(koCue)).toBe(koCue);
  });

  it("passes a plain Korean sentence with no cue through unchanged", () => {
    const koPlain = "저는 학생입니다.";
    expect(stripRegisterCue(koPlain)).toBe(koPlain);
  });
});
