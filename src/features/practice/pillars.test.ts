import { describe, expect, it } from "vitest";
import { getPillar, getPillarsForLanguage } from "./pillars";
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from "@/shared/config/featureFlags";

const flags: FeatureFlags = {
  ...DEFAULT_FEATURE_FLAGS,
  practice: { stories: true, externalContent: true },
};

const allActivityIds = (ps: ReturnType<typeof getPillarsForLanguage>) =>
  ps.flatMap((p) => p.activities.map((a) => a.id));

describe("getPillarsForLanguage", () => {
  it("returns all six pillars in order", () => {
    expect(getPillarsForLanguage("ja", flags).map((p) => p.id)).toEqual([
      "vocabulary",
      "grammar",
      "reading",
      "listening",
      "speaking",
      "writing",
    ]);
  });

  it("includes kanji/components/counters for ja only", () => {
    const ja = allActivityIds(getPillarsForLanguage("ja", flags));
    const ko = allActivityIds(getPillarsForLanguage("ko", flags));
    expect(ja).toEqual(expect.arrayContaining(["kanji", "components", "counters"]));
    expect(ko).not.toContain("kanji");
    expect(ko).not.toContain("components");
    expect(ko).not.toContain("counters");
    expect(ko).toContain("conjugation");
  });

  it("drops stories activities when the stories flag is off", () => {
    const noStories: FeatureFlags = {
      ...flags,
      practice: { ...flags.practice, stories: false },
    };
    const acts = allActivityIds(getPillarsForLanguage("ja", noStories));
    expect(acts).not.toContain("stories-read");
    expect(acts).not.toContain("stories-listen");
  });

  it("hides community-gated activities while community ships dark", () => {
    // DEFAULT_FEATURE_FLAGS has community.enabled: false (MVP)
    const acts = allActivityIds(getPillarsForLanguage("ja", DEFAULT_FEATURE_FLAGS));
    expect(acts).not.toContain("browse-decks");
  });
});

describe("getPillar", () => {
  it("resolves a pillar by id and filters its activities", () => {
    expect(getPillar("listening", "ja", flags)?.activities[0]?.id).toBe("listen-choose");
  });

  it("returns null for unknown ids", () => {
    expect(getPillar("nope", "ja", flags)).toBeNull();
  });
});
