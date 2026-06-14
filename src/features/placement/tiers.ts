export type SkillTier = {
  tier: number;
  modules: string[];
  screeningModuleId: string;
  label: string;
};

// ---------------------------------------------------------------------------
// Per-language skill tiers.
//
// A tier groups consecutive modules that sit at roughly the same difficulty.
// Stage 1 (screening) serves one representative item per tier to estimate the
// learner's floor; stage 2 (probing) narrows in module-by-module within a
// window around that floor. The tier list is therefore the only language
// pedagogy the placement engine needs — adding a new course is "author a
// question bank + register tiers", no engine changes.
//
// `JA_SKILL_TIERS` is the original JA spine (M3-M27, the first 25 grammar
// modules). `KO_SKILL_TIERS` mirrors the KO curriculum's own sequencing
// (script M1-M2 → first phrases → … → modals), derived from the authored
// `features/languages/ko/curriculum/m*.ts` content.
// ---------------------------------------------------------------------------

const JA_SKILL_TIERS: readonly SkillTier[] = [
  { tier: 0, modules: ["m3", "m4"],                          screeningModuleId: "m3",  label: "は/か, これ/それ, の" },
  { tier: 1, modules: ["m5", "m6"],                          screeningModuleId: "m5",  label: "Counters, に/で/が" },
  { tier: 2, modules: ["m7", "m8", "m9"],                    screeningModuleId: "m7",  label: "ます-form, adjectives" },
  { tier: 3, modules: ["m10", "m11"],                        screeningModuleId: "m10", label: "Past tense, negation" },
  { tier: 4, modules: ["m12", "m13", "m14"],                 screeningModuleId: "m12", label: "Time, て-form" },
  { tier: 5, modules: ["m15", "m16", "m17", "m18"],          screeningModuleId: "m15", label: "たい, permissions, modals" },
  { tier: 6, modules: ["m19", "m20", "m21", "m22", "m23"],   screeningModuleId: "m22", label: "Family, comparisons" },
  { tier: 7, modules: ["m24", "m25", "m26", "m27"],          screeningModuleId: "m25", label: "ことがある, なければならない" },
];

const KO_SKILL_TIERS: readonly SkillTier[] = [
  { tier: 0, modules: ["m1", "m2"],                          screeningModuleId: "m1",  label: "Hangul script" },
  { tier: 1, modules: ["m3", "m4"],                          screeningModuleId: "m3",  label: "이에요/예요, 의, 이거/그거/저거" },
  { tier: 2, modules: ["m5", "m6"],                          screeningModuleId: "m5",  label: "Counters, 있어요/없어요, 에/에서" },
  { tier: 3, modules: ["m7", "m8", "m9"],                    screeningModuleId: "m7",  label: "해요 present, adjectives, 하고/도" },
  { tier: 4, modules: ["m10", "m11"],                        screeningModuleId: "m10", label: "Past tense, 안/못 negation" },
  { tier: 5, modules: ["m12", "m13", "m14"],                 screeningModuleId: "m12", label: "Time, 부터/까지, 고/아서" },
  { tier: 6, modules: ["m15", "m16", "m17", "m18"],          screeningModuleId: "m15", label: "고 있어요, permissions, 거예요" },
  { tier: 7, modules: ["m19", "m20", "m21", "m22", "m23"],   screeningModuleId: "m22", label: "Family, body, comparisons" },
  { tier: 8, modules: ["m24", "m25", "m26", "m27"],          screeningModuleId: "m25", label: "거나, 려고 하다, 아/어야 되다" },
];

const TIERS_BY_LANGUAGE: Record<string, readonly SkillTier[]> = {
  ja: JA_SKILL_TIERS,
  ko: KO_SKILL_TIERS,
};

const DEFAULT_LANGUAGE = "ja";

/** Tiers for a language. Falls back to the JA spine for languages that don't
 *  declare their own (so the engine never crashes on an unknown id), but a
 *  course should always register its own tiers for accurate leveling. */
export function getSkillTiers(languageId: string): readonly SkillTier[] {
  return TIERS_BY_LANGUAGE[languageId] ?? JA_SKILL_TIERS;
}

/** Is the language a first-class placement citizen (has its own tiers)? */
export function hasSkillTiers(languageId: string): boolean {
  return languageId in TIERS_BY_LANGUAGE;
}

export function getAllTestableModules(languageId: string): readonly string[] {
  return getSkillTiers(languageId).flatMap((t) => t.modules);
}

export function getTierForModule(
  moduleId: string,
  languageId: string = DEFAULT_LANGUAGE,
): number | null {
  for (const tier of getSkillTiers(languageId)) {
    if (tier.modules.includes(moduleId)) return tier.tier;
  }
  return null;
}

export function getModulesForTier(
  tierIdx: number,
  languageId: string = DEFAULT_LANGUAGE,
): string[] {
  return getSkillTiers(languageId)[tierIdx]?.modules ?? [];
}

// ── Back-compat JA aliases (existing call sites + tests) ─────────────────────

export const SKILL_TIERS: readonly SkillTier[] = JA_SKILL_TIERS;
export const ALL_TESTABLE_MODULES: readonly string[] =
  JA_SKILL_TIERS.flatMap((t) => t.modules);
