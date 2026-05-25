export type SkillTier = {
  tier: number;
  modules: string[];
  screeningModuleId: string;
  label: string;
};

export const SKILL_TIERS: readonly SkillTier[] = [
  { tier: 0, modules: ["m3", "m4"],                          screeningModuleId: "m3",  label: "は/か, これ/それ, の" },
  { tier: 1, modules: ["m5", "m6"],                          screeningModuleId: "m5",  label: "Counters, に/で/が" },
  { tier: 2, modules: ["m7", "m8", "m9"],                    screeningModuleId: "m7",  label: "ます-form, adjectives" },
  { tier: 3, modules: ["m10", "m11"],                        screeningModuleId: "m10", label: "Past tense, negation" },
  { tier: 4, modules: ["m12", "m13", "m14"],                 screeningModuleId: "m12", label: "Time, て-form" },
  { tier: 5, modules: ["m15", "m16", "m17", "m18"],          screeningModuleId: "m15", label: "たい, permissions, modals" },
  { tier: 6, modules: ["m19", "m20", "m21", "m22", "m23"],   screeningModuleId: "m22", label: "Family, comparisons" },
  { tier: 7, modules: ["m24", "m25", "m26", "m27"],          screeningModuleId: "m25", label: "ことがある, なければならない" },
];

export const ALL_TESTABLE_MODULES: readonly string[] =
  SKILL_TIERS.flatMap((t) => t.modules);

export function getTierForModule(moduleId: string): number | null {
  for (const tier of SKILL_TIERS) {
    if (tier.modules.includes(moduleId)) return tier.tier;
  }
  return null;
}

export function getModulesForTier(tierIdx: number): string[] {
  return SKILL_TIERS[tierIdx]?.modules ?? [];
}
