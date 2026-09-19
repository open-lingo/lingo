import { describe, it, expect } from "vitest";
import { DEFAULT_FEATURE_FLAGS, mergeFeatureFlags, type FeatureFlags } from "@/shared/config/featureFlags";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "./languageConfig";
import { isPtBetaUser, getVisibleLearningLanguageIds, isCourseVisible } from "./betaAccess";

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

  it("admits a match on the internal user id (GET /users/me's `id`), not just email — a user record does not always carry an email client-side", () => {
    const userId = "e651cc3e-d8c3-4649-aca2-d014d8edd13a";
    const flags = flagsWith(true, [userId]);
    // No email on hand — only the id.
    expect(isPtBetaUser(flags, userId)).toBe(true);
    expect(isPtBetaUser(flags, userId.toUpperCase())).toBe(true); // case-insensitive
    expect(isPtBetaUser(flags, "not-the-id")).toBe(false);
  });

  it("admits when EITHER identity in a [email, id] list matches — the shape useVisibleLearningLanguageIds passes", () => {
    const userId = "e651cc3e-d8c3-4649-aca2-d014d8edd13a";
    const emailOnlyAllowlist = flagsWith(true, ["spencer@lichfieldfamily.com"]);
    const idOnlyAllowlist = flagsWith(true, [userId]);

    // Email present, id missing (not yet resolved / no /users/me record).
    expect(isPtBetaUser(emailOnlyAllowlist, ["spencer@lichfieldfamily.com", undefined])).toBe(true);
    // Id present, email missing (client-side user record with no email claim).
    expect(isPtBetaUser(idOnlyAllowlist, [undefined, userId])).toBe(true);
    // Neither matches.
    expect(isPtBetaUser(emailOnlyAllowlist, ["someone-else@example.com", "some-other-id"])).toBe(false);
    // Both missing.
    expect(isPtBetaUser(emailOnlyAllowlist, [null, undefined])).toBe(false);
    expect(isPtBetaUser(emailOnlyAllowlist, [])).toBe(false);
  });

  it("a flag block can mix emails and ids in one allowlist array (the shape the lead will fill in)", () => {
    const userId = "e651cc3e-d8c3-4649-aca2-d014d8edd13a";
    const flags = flagsWith(true, ["spencer@lichfieldfamily.com", userId]);
    expect(isPtBetaUser(flags, "spencer@lichfieldfamily.com")).toBe(true);
    expect(isPtBetaUser(flags, userId)).toBe(true);
    expect(isPtBetaUser(flags, "cris@example.com")).toBe(false); // not the id, not an email match
  });

  it("mergeFeatureFlags ignores a malformed override (non-array allowlist) rather than corrupting the base", () => {
    const flags = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      courses: { ptBeta: { enabled: true, allowlist: "not-an-array" } },
    });
    expect(flags.courses.ptBeta.enabled).toBe(true);
    expect(flags.courses.ptBeta.allowlist).toEqual([]);
  });

  describe("isCourseVisible — the single visibility predicate every UI surface reads", () => {
    it("pt is invisible when the flag is off, even to the allow-listed identity", () => {
      const flags = flagsWith(false, ["spencer@lichfieldfamily.com"]);
      expect(isCourseVisible("pt", flags, "spencer@lichfieldfamily.com")).toBe(false);
    });

    it("pt is visible when the flag is on and the identity is allow-listed", () => {
      const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
      expect(isCourseVisible("pt", flags, "spencer@lichfieldfamily.com")).toBe(true);
    });

    it("pt is invisible when the flag is on but the identity is not allow-listed", () => {
      const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
      expect(isCourseVisible("pt", flags, "someone-else@example.com")).toBe(false);
    });

    it("pt is invisible to a null/undefined/empty identity regardless of the flag", () => {
      const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
      expect(isCourseVisible("pt", flags, null)).toBe(false);
      expect(isCourseVisible("pt", flags, undefined)).toBe(false);
      expect(isCourseVisible("pt", flags, "")).toBe(false);
    });

    it("every existing (non-beta) registry id is unaffected by the ptBeta gate in any flag/identity combination", () => {
      const off = flagsWith(false, []);
      const onNotListed = flagsWith(true, ["spencer@lichfieldfamily.com"]);
      const onListed = flagsWith(true, ["spencer@lichfieldfamily.com"]);
      for (const langId of AVAILABLE_LEARNING_LANGUAGE_IDS) {
        expect(isCourseVisible(langId, off, "spencer@lichfieldfamily.com")).toBe(true);
        expect(isCourseVisible(langId, onNotListed, "someone-else@example.com")).toBe(true);
        expect(isCourseVisible(langId, onListed, "spencer@lichfieldfamily.com")).toBe(true);
      }
    });

    it("admits via a [email, id] identity list, matching the useVisibleLearningLanguageIds call shape", () => {
      const userId = "e651cc3e-d8c3-4649-aca2-d014d8edd13a";
      const flags = flagsWith(true, [userId]);
      expect(isCourseVisible("pt", flags, [undefined, userId])).toBe(true);
      expect(isCourseVisible("pt", flags, [undefined, "some-other-id"])).toBe(false);
    });

    it("an id that is neither in AVAILABLE_LEARNING_LANGUAGE_IDS nor pt is never visible", () => {
      const flags = flagsWith(true, ["spencer@lichfieldfamily.com"]);
      expect(isCourseVisible("de", flags, "spencer@lichfieldfamily.com")).toBe(false);
      expect(isCourseVisible("zzz-not-a-course", flags, "spencer@lichfieldfamily.com")).toBe(false);
    });
  });
});
