/**
 * Fluency-level grouping for the Learn course map.
 *
 * The course model (mockCourse.ts) has no CEFR/level field, but both the
 * Japanese and Korean beginner courses share the same module semantics:
 *   - the first two content modules teach the writing system(s),
 *   - modules 3+ are grammar/vocab blocks that climb toward JLPT N5 / TOPIK I.
 *
 * Rather than invent per-module CEFR tags, we bucket modules into a small set
 * of named fluency sections keyed on the 1-indexed CONTENT-module number
 * (m1 = 1, m2 = 2, …). Review pseudo-modules carry no content number and fall
 * into whichever section their preceding content module lives in.
 *
 * The section titles are CEFR-anchored ("A1", "A2") with a plain-English
 * subtitle and a short "what you'll be able to do" outcome synthesized from
 * the authored module summaries — the page is meant to inform learners where
 * they'll be by a given point, so each level answers "what does clearing this
 * level unlock in the real world?"
 */

/** A named fluency section spanning a contiguous run of content modules. */
export type FluencyLevel = {
  /** Stable id (used for keys + persistence). */
  id: string;
  /** Short CEFR-style badge, e.g. "A1" / "Pre-A1". */
  cefr: string;
  /** Human title, e.g. "First conversations". */
  title: string;
  /** One-line "by the end of this level you can…" outcome. */
  outcome: string;
  /** Inclusive 1-indexed content-module range this level covers. */
  fromContentNumber: number;
  toContentNumber: number;
};

/**
 * Per-language level ladders. Keyed by content-module number ranges. The
 * ranges are authored to line up with the real curriculum blocks in
 * mockCourse.ts; a course with more modules than the last range simply keeps
 * everything past it inside the final (open-ended) level.
 */
const LEVELS_BY_LANGUAGE: Record<string, FluencyLevel[]> = {
  ja: [
    {
      id: "ja-foundations",
      cefr: "Pre-A1",
      title: "The writing system",
      outcome: "Read every hiragana, katakana and voiced-sound — the alphabet you need before anything else.",
      fromContentNumber: 1,
      toContentNumber: 2,
    },
    {
      id: "ja-a1-1",
      cefr: "A1",
      title: "First words & sentences",
      outcome:
        "Introduce yourself, describe everyday things, count, order in a café and say who does what.",
      fromContentNumber: 3,
      toContentNumber: 7,
    },
    {
      id: "ja-a1-2",
      cefr: "A1+",
      title: "Everyday Japanese",
      outcome:
        "Describe qualities, talk about the past, say no, and handle times, dates and schedules.",
      fromContentNumber: 8,
      toContentNumber: 13,
    },
    {
      id: "ja-a2-1",
      cefr: "A2",
      title: "Real conversations",
      outcome:
        "Use the te-form to link ideas, make requests, get around town, and talk about family, health and food.",
      fromContentNumber: 14,
      toContentNumber: 21,
    },
    {
      id: "ja-a2-2",
      cefr: "A2+",
      title: "Toward JLPT N5",
      outcome:
        "Compare things, express ability and intentions, explain reasons — everything the N5 exam expects.",
      fromContentNumber: 22,
      toContentNumber: Infinity,
    },
  ],
  ko: [
    {
      id: "ko-foundations",
      cefr: "Pre-A1",
      title: "The writing system",
      outcome: "Read all of Hangul — vowels, consonants and syllable blocks — before you build words.",
      fromContentNumber: 1,
      toContentNumber: 2,
    },
    {
      id: "ko-a1-1",
      cefr: "A1",
      title: "First words & sentences",
      outcome:
        "Greet people, introduce yourself, name everyday things, count, and order food at a café.",
      fromContentNumber: 3,
      toContentNumber: 7,
    },
    {
      id: "ko-a1-2",
      cefr: "A1+",
      title: "Everyday Korean",
      outcome:
        "Describe things, talk about where they are and what happened, and handle daily routines.",
      fromContentNumber: 8,
      toContentNumber: 13,
    },
    {
      id: "ko-a2-1",
      cefr: "A2",
      title: "Real conversations",
      outcome:
        "Link ideas, make plans and requests, and talk about people, places and activities.",
      fromContentNumber: 14,
      toContentNumber: Infinity,
    },
  ],
};

/**
 * Generic fallback ladder for any course without an authored level map — three
 * broad bands so grouping still works instead of falling back to one long list.
 */
const GENERIC_LEVELS: FluencyLevel[] = [
  {
    id: "gen-foundations",
    cefr: "Pre-A1",
    title: "Foundations",
    outcome: "The building blocks — the writing system and your very first words.",
    fromContentNumber: 1,
    toContentNumber: 2,
  },
  {
    id: "gen-a1",
    cefr: "A1",
    title: "Beginner",
    outcome: "Everyday phrases, simple sentences and the core grammar to talk about your world.",
    fromContentNumber: 3,
    toContentNumber: 13,
  },
  {
    id: "gen-a2",
    cefr: "A2",
    title: "Elementary",
    outcome: "Link ideas, handle common situations and hold basic conversations.",
    fromContentNumber: 14,
    toContentNumber: Infinity,
  },
];

/** The level ladder for a language (falls back to a generic 3-band ladder). */
export function getFluencyLevels(languageId: string): FluencyLevel[] {
  return LEVELS_BY_LANGUAGE[languageId] ?? GENERIC_LEVELS;
}

/**
 * Resolve which level a given content-module number belongs to. Review
 * modules (contentNumber == null) should be resolved against their preceding
 * content module's number by the caller. Returns null when no level covers the
 * number (shouldn't happen given the open-ended final range, but defensive).
 */
export function levelForContentNumber(
  languageId: string,
  contentNumber: number,
): FluencyLevel | null {
  const levels = getFluencyLevels(languageId);
  for (const level of levels) {
    if (
      contentNumber >= level.fromContentNumber &&
      contentNumber <= level.toContentNumber
    ) {
      return level;
    }
  }
  return null;
}

/** A contiguous run of modules that all belong to one fluency level. */
export type LevelGroup<T> = {
  level: FluencyLevel;
  items: T[];
};

/**
 * Group an ordered list of module-like items into contiguous fluency-level
 * sections, preserving input order.
 *
 * Each item exposes a 1-indexed `contentNumber` (null for review modules).
 * Review modules carry no number and inherit the level of the most recent
 * content module that preceded them, so a review always stays inside the block
 * it reviews. An item that can't be resolved to any level (defensive; the
 * final level is open-ended) inherits the last-seen level, or the first level
 * of the ladder when nothing has been seen yet.
 */
export function groupModulesByLevel<T>(
  languageId: string,
  items: T[],
  getContentNumber: (item: T) => number | null,
): LevelGroup<T>[] {
  const ladder = getFluencyLevels(languageId);
  const groups: LevelGroup<T>[] = [];
  let lastLevel: FluencyLevel | null = null;

  for (const item of items) {
    const contentNumber = getContentNumber(item);
    let level =
      contentNumber != null
        ? levelForContentNumber(languageId, contentNumber)
        : null;
    // Review / unresolved modules inherit the preceding content level.
    if (!level) level = lastLevel ?? ladder[0] ?? null;
    if (!level) continue;
    lastLevel = level;

    const tail = groups[groups.length - 1];
    if (tail && tail.level.id === level.id) {
      tail.items.push(item);
    } else {
      groups.push({ level, items: [item] });
    }
  }

  return groups;
}
