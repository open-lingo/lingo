// ---------------------------------------------------------------------------
// Self-declared placement level bands (2026-07-15).
//
// The old placement screened every skill tier and then credited EVERY module
// below the estimated floor — so a single correct top-tier answer marked the
// whole course complete. The fix (Spencer 2026-07-15): ask the learner their
// level up front, then SAMPLE a couple of modules inside that declared band and
// bound the credit to the band's top module. No path can credit a module the
// learner never demonstrated AND declared reach for.
//
// A band maps a self-declared level to:
//   • a contiguous module range to sample (`bandModules`, in course order)
//   • the band's TOP module (the credit cap — the floor can never exceed it)
//   • a language-appropriate label/description
//
// The "complete beginner" option is a band with NO sample modules: it starts
// the learner at M1, samples nothing, and credits nothing.
//
// Adding a course = author a question bank + register bands here (mirrors
// `tiers.ts`). Unknown languages fall back to a generic 3-band split of their
// testable modules.
// ---------------------------------------------------------------------------

import { getAllTestableModules } from "./tiers";

export type PlacementLevelBand = {
  /** Stable id — used as the self-select option key + engine band key. */
  id: string;
  /** Short label for the self-select tile (e.g. "I know kana and some words"). */
  label: string;
  /** One-line clarifier under the label. */
  description: string;
  /**
   * Modules to sample from, in course order. Empty = "complete beginner"
   * (no sampling, no credit — start at M1). The engine picks ~2 spread across
   * this list; the LAST entry is the band top (credit cap).
   */
  bandModules: readonly string[];
};

// Japanese — tiers 0=m3-4, 1=m5-6, 2=m7-9, 3=m10-11, 4=m12-14, 5=m15-18,
// 6=m19-23, 7=m24-27, 8=m28-29 (see tiers.ts). Bands group those into
// learner-facing self-declarations. M1/M2 are hiragana/katakana script
// (auto-completed on any grammar pass), so bands start at M3.
//
// ⚠️ A BAND'S LAST ENTRY IS THE CREDIT CAP, so this list gates the tier list —
// adding tier 8 to tiers.ts without extending the n5 band below would have left
// m28/m29 unreachable at any score, and the tier would have looked installed
// while crediting nothing (2026-08-14, B103). Whenever a tier is appended,
// extend the top band in the same commit.
const JA_LEVEL_BANDS: readonly PlacementLevelBand[] = [
  {
    id: "beginner",
    label: "Complete beginner — new to Japanese",
    description: "Start from the very beginning with hiragana.",
    bandModules: [],
  },
  {
    id: "kana",
    label: "I know kana and some words",
    description: "You can read hiragana and recognize basic vocabulary.",
    bandModules: ["m3", "m4", "m5", "m6"],
  },
  {
    id: "basic-sentences",
    label: "I can make basic sentences",
    description: "You can form simple polite sentences and use particles.",
    bandModules: ["m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14"],
  },
  {
    id: "n5",
    label: "I'm around JLPT N5 (or higher)",
    description: "You know te-form, past tense, and everyday grammar.",
    bandModules: [
      "m15",
      "m16",
      "m17",
      "m18",
      "m19",
      "m20",
      "m21",
      "m22",
      "m23",
      "m24",
      "m25",
      "m26",
      "m27",
      // m28 (なきゃ / ほうがいい) and m29 (the N5 capstone) added 2026-08-14
      // with tier 8. This band is the top one, so its last entry is the
      // highest module the whole placement flow can credit — it has to reach
      // the end of the authored N5 line or a learner who finished N5 places
      // two modules short of where they are.
      "m28",
      "m29",
    ],
  },
];

// Korean — tiers 0=m1-2 script, 1=m3-4, 2=m5-6, 3=m7-9, 4=m10-11, 5=m12-14,
// 6=m15-18, 7=m19-23, 8=m24-27. Script is m1/m2; grammar bands start at m3.
const KO_LEVEL_BANDS: readonly PlacementLevelBand[] = [
  {
    id: "beginner",
    label: "Complete beginner — new to Korean",
    description: "Start from the very beginning with Hangul.",
    bandModules: [],
  },
  {
    id: "hangul",
    label: "I can read Hangul and some words",
    description: "You can read Hangul blocks and recognize basic vocabulary.",
    bandModules: ["m3", "m4", "m5", "m6"],
  },
  {
    id: "basic-conversation",
    label: "I can hold a basic conversation",
    description: "You can form polite sentences and use core particles.",
    bandModules: ["m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14"],
  },
  {
    id: "topik1",
    label: "I'm around TOPIK I / intermediate",
    description: "You know past tense, connectors, and everyday grammar.",
    bandModules: [
      "m15",
      "m16",
      "m17",
      "m18",
      "m19",
      "m20",
      "m21",
      "m22",
      "m23",
      "m24",
      "m25",
      "m26",
      "m27",
    ],
  },
];

const BANDS_BY_LANGUAGE: Record<string, readonly PlacementLevelBand[]> = {
  ja: JA_LEVEL_BANDS,
  ko: KO_LEVEL_BANDS,
};

/**
 * Generic fallback for a language without authored bands: a beginner option
 * plus a 3-way split of its testable modules. Keeps the flow functional (never
 * crashes) even if a course ships a question bank before registering bands.
 */
function buildGenericBands(languageId: string): PlacementLevelBand[] {
  const mods = [...getAllTestableModules(languageId)];
  if (mods.length === 0) {
    return [
      {
        id: "beginner",
        label: "Complete beginner",
        description: "Start from the very beginning.",
        bandModules: [],
      },
    ];
  }
  const third = Math.ceil(mods.length / 3);
  const low = mods.slice(0, third);
  const mid = mods.slice(third, third * 2);
  const high = mods.slice(third * 2);
  const bands: PlacementLevelBand[] = [
    {
      id: "beginner",
      label: "Complete beginner",
      description: "Start from the very beginning.",
      bandModules: [],
    },
  ];
  if (low.length > 0)
    bands.push({
      id: "some",
      label: "I know some basics",
      description: "You recognize basic words and phrases.",
      bandModules: low,
    });
  if (mid.length > 0)
    bands.push({
      id: "intermediate",
      label: "I can make basic sentences",
      description: "You can form simple sentences.",
      bandModules: mid,
    });
  if (high.length > 0)
    bands.push({
      id: "advanced",
      label: "I'm fairly comfortable",
      description: "You know most everyday grammar.",
      bandModules: high,
    });
  return bands;
}

/** Bands for a language. Falls back to a generic split for unregistered ids. */
export function getLevelBands(languageId: string): readonly PlacementLevelBand[] {
  return BANDS_BY_LANGUAGE[languageId] ?? buildGenericBands(languageId);
}

/** Look up a single band by id for a language. */
export function getLevelBand(
  languageId: string,
  bandId: string,
): PlacementLevelBand | undefined {
  return getLevelBands(languageId).find((b) => b.id === bandId);
}

/** Is the "complete beginner" (no-sample, no-credit) band? */
export function isBeginnerBand(band: PlacementLevelBand): boolean {
  return band.bandModules.length === 0;
}
