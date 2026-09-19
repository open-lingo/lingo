import { describe, it, expect } from "vitest";
import { DEFAULT_FEATURE_FLAGS, mergeFeatureFlags, type FeatureFlags } from "@/shared/config/featureFlags";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "./languageConfig";
import { isPtBetaUser, getVisibleLearningLanguageIds } from "./betaAccess";

function flagsWith(enabled: boolean, allowlist: string[]): FeatureFlags {
  return mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
    courses: { ptBeta: { enabled, allowlist } },
  });
}

describe("betaAccess — courses.ptBeta gate", () => {
  it("defaults ship disabled with an empty allowlist (never open by construction)", () => {
    expect(DEFAULT_FEATURE_FLAGS.courses.ptBeta.enabled).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.courses.ptBeta.allowlist).toEqual([]);
    expect(isPtBetaUser(DEFAULT_FEATURE_FLAGS, "spencer@lichfieldfamily.com")).toBe(false);
  });

  it("denies an allow-listed identity when the flag is disabled", () => {
    const flags = flagsWith(false, ["spencer@lichfieldfamily.com"]);
    expect(isPtBetaUser(flags, "spencer@lichfieldfamily.com")).toBe(false);
  });

  it("denies a non-listed identity even when the flag is enabled", () => {
    const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
    expect(isPtBetaUser(flags, "someone-else@example.com")).toBe(false);
  });

  it("admits an allow-listed identity, case-insensitively, when enabled", () => {
    const flags = flagsWith(true, ["Spencer@LichfieldFamily.com"]);
    expect(isPtBetaUser(flags, "spencer@lichfieldfamily.com")).toBe(true);
    expect(isPtBetaUser(flags, "  SPENCER@lichfieldfamily.com  ")).toBe(true);
  });

  it("never throws and reads false for null/undefined/empty identity", () => {
    const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
    expect(isPtBetaUser(flags, null)).toBe(false);
    expect(isPtBetaUser(flags, undefined)).toBe(false);
    expect(isPtBetaUser(flags, "")).toBe(false);
  });

  it("getVisibleLearningLanguageIds returns the SAME base array reference for a non-beta user", () => {
    const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
    const visible = getVisibleLearningLanguageIds(flags, "someone-else@example.com");
    expect(visible).toBe(AVAILABLE_LEARNING_LANGUAGE_IDS);
    expect(visible).not.toContain("pt");
  });

  it("getVisibleLearningLanguageIds returns the SAME base array reference when the flag is off, even for the allow-listed identity", () => {
    const flags = flagsWith(false, ["spencer@lichfieldfamily.com"]);
    const visible = getVisibleLearningLanguageIds(flags, "spencer@lichfieldfamily.com");
    expect(visible).toBe(AVAILABLE_LEARNING_LANGUAGE_IDS);
  });

  it("getVisibleLearningLanguageIds adds pt for an allow-listed identity when enabled, without mutating the base list", () => {
    const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
    const visible = getVisibleLearningLanguageIds(flags, "spencer@lichfieldfamily.com");
    expect(visible).toContain("pt");
    expect(visible).not.toBe(AVAILABLE_LEARNING_LANGUAGE_IDS);
    expect(AVAILABLE_LEARNING_LANGUAGE_IDS).not.toContain("pt");
  });

  it("mergeFeatureFlags ignores a malformed override (non-array allowlist) rather than corrupting the base", () => {
    const flags = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      courses: { ptBeta: { enabled: true, allowlist: "not-an-array" } },
    });
    expect(flags.courses.ptBeta.enabled).toBe(true);
    expect(flags.courses.ptBeta.allowlist).toEqual([]);
  });
});
