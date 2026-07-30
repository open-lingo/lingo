/**
 * Conjugation Trainer — type registry (data layer, Task 1).
 *
 * Six trainer types cover 9 of the 22 pool-exempt Track B grammar points
 * (see `POOL_GAP_EXEMPTIONS` in `grammarReviewPools.test.ts`). The trainer IS
 * the review surface for these points — they stay excluded from the step-pool
 * review session by design. Adding the remaining 13 exempt points later is
 * additive: a new entry here (plus the form data they need in
 * `conjugationTables.ts`), nothing else.
 */
import grammarPointsJson from "@/features/lesson/data/n5-grammar-points.json";
import {
  type ChainForm,
  type IAdjForm,
} from "../conjugationEngine";
import {
  getGrammarCardState,
  type GrammarPoint,
} from "@/features/flashcards/engine/grammarSrs";

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];

export type TrainerTypeId =
  | "te-form"
  | "ta-form"
  | "nai-form"
  | "masu"
  | "v-tai"
  | "i-adj-forms";

export type FormationRow = {
  groupLabel: string; // "Godan — う・つ・る endings", "Ichidan", "Irregular"
  pattern: string; // "〜う/つ/る → 〜って"
  exampleDict: string; // かう  (a real dictionary form in the tables)
  exampleForm: string; // かって (a real conjugated value of that entry)
  /**
   * Set on rows whose example can't be verified against VERB_ENTRIES/
   * ADJ_ENTRIES — literal reference content only (e.g. ある→ない, whose
   * dictionary form ある isn't a drilled entry, or the たい→たくない note row
   * that has no table column). The formation-coverage test skips these.
   */
  exampleNotInTables?: true;
};

export type ConjugationTrainerType = {
  id: TrainerTypeId;
  title: string;
  subtitle: string; // one factual line, no hype
  category: "verb" | "i-adj";
  verbForms?: ChainForm[]; // when category === "verb" (includes stacked chains)
  adjForms?: IAdjForm[]; // when category === "i-adj"
  grammarPointIds: string[];
  formation: FormationRow[]; // cheat-sheet rows
};

// ─── Type definitions ──────────────────────────────────────────────────

export const CONJUGATION_TRAINER_TYPES: ConjugationTrainerType[] = [
  {
    id: "te-form",
    title: "て-form",
    subtitle: "The connective form — sound changes by verb ending.",
    category: "verb",
    verbForms: ["te"],
    grammarPointIds: ["te-form"],
    formation: [
      {
        groupLabel: "Godan — う・つ・る",
        pattern: "〜う/つ/る → 〜って",
        exampleDict: "かう",
        exampleForm: "かって",
      },
      {
        groupLabel: "Godan — む・ぶ・ぬ",
        pattern: "〜む/ぶ/ぬ → 〜んで",
        exampleDict: "のむ",
        exampleForm: "のんで",
      },
      {
        groupLabel: "Godan — く",
        pattern: "〜く → 〜いて",
        exampleDict: "かく",
        exampleForm: "かいて",
      },
      {
        groupLabel: "Godan — ぐ",
        pattern: "〜ぐ → 〜いで",
        exampleDict: "およぐ",
        exampleForm: "およいで",
      },
      {
        groupLabel: "Godan — す",
        pattern: "〜す → 〜して",
        exampleDict: "けす",
        exampleForm: "けして",
      },
      {
        groupLabel: "Ichidan",
        pattern: "〜る → 〜て",
        exampleDict: "たべる",
        exampleForm: "たべて",
      },
      {
        groupLabel: "Irregular",
        pattern: "する → して",
        exampleDict: "する",
        exampleForm: "して",
      },
      {
        groupLabel: "Irregular",
        pattern: "くる → きて",
        exampleDict: "くる",
        exampleForm: "きて",
      },
      {
        groupLabel: "Irregular (special)",
        pattern: "いく → いって",
        exampleDict: "いく",
        exampleForm: "いって",
      },
    ],
  },
  {
    id: "ta-form",
    title: "Plain past (た)",
    subtitle: "Same sound changes as て-form, with た/だ instead.",
    category: "verb",
    verbForms: ["ta"],
    grammarPointIds: ["ta-form"],
    formation: [
      {
        groupLabel: "Godan — う・つ・る",
        pattern: "〜う/つ/る → 〜った",
        exampleDict: "かう",
        exampleForm: "かった",
      },
      {
        groupLabel: "Godan — む・ぶ・ぬ",
        pattern: "〜む/ぶ/ぬ → 〜んだ",
        exampleDict: "のむ",
        exampleForm: "のんだ",
      },
      {
        groupLabel: "Godan — く",
        pattern: "〜く → 〜いた",
        exampleDict: "かく",
        exampleForm: "かいた",
      },
      {
        groupLabel: "Godan — ぐ",
        pattern: "〜ぐ → 〜いだ",
        exampleDict: "およぐ",
        exampleForm: "およいだ",
      },
      {
        groupLabel: "Godan — す",
        pattern: "〜す → 〜した",
        exampleDict: "けす",
        exampleForm: "けした",
      },
      {
        groupLabel: "Ichidan",
        pattern: "〜る → 〜た",
        exampleDict: "たべる",
        exampleForm: "たべた",
      },
      {
        groupLabel: "Irregular",
        pattern: "する → した",
        exampleDict: "する",
        exampleForm: "した",
      },
      {
        groupLabel: "Irregular",
        pattern: "くる → きた",
        exampleDict: "くる",
        exampleForm: "きた",
      },
      {
        groupLabel: "Irregular (special)",
        pattern: "いく → いった",
        exampleDict: "いく",
        exampleForm: "いった",
      },
    ],
  },
  {
    id: "nai-form",
    title: "Plain negative (ない)",
    subtitle: "The short negative — godan verbs shift to the あ-row first.",
    category: "verb",
    // Individual tile drills the BASE form only (Spencer 2026-07-02, post-Task-6):
    // stacked chains (なかった) are combo-exclusive. Individuals teach base
    // formation; combining tiles is the ONLY drill path to stacked forms — combos
    // are genuinely additive progression, per the owner's design. The stacked
    // FormationRows below stay as cheat-sheet reference content.
    verbForms: ["nai"],
    grammarPointIds: ["nai-form"],
    formation: [
      {
        groupLabel: "Godan",
        pattern: "final う-row kana → あ-row + ない",
        exampleDict: "のむ",
        exampleForm: "のまない",
      },
      {
        groupLabel: "Godan (う → わ)",
        pattern: "〜う → 〜わない (not 〜あない)",
        exampleDict: "かう",
        exampleForm: "かわない",
      },
      {
        groupLabel: "Ichidan",
        pattern: "〜る → 〜ない",
        exampleDict: "たべる",
        exampleForm: "たべない",
      },
      {
        groupLabel: "Irregular",
        pattern: "する → しない",
        exampleDict: "する",
        exampleForm: "しない",
      },
      {
        groupLabel: "Irregular",
        pattern: "くる → こない",
        exampleDict: "くる",
        exampleForm: "こない",
      },
      {
        groupLabel: "Irregular (special)",
        pattern: "ある → ない",
        exampleDict: "ある",
        exampleForm: "ない",
        exampleNotInTables: true,
      },
      {
        groupLabel: "Stacked — past",
        pattern: "ない → なかった (plain negative past)",
        exampleDict: "のむ",
        exampleForm: "のまなかった",
        exampleNotInTables: true,
      },
    ],
  },
  {
    // v1.2 addendum (Spencer 2026-07-02): the masu tile drills ONLY the plain
    // polite stem (ます). The negative/past suffixes (ません・ました・ませんでした)
    // are combo content, unlocked by stacking this tile with nai-form / ta-form
    // (see comboForms.ts). grammarPointIds stay the two polite-negative points so
    // unlock derivation + the due badge are unchanged, but those points are
    // graded ONLY when their combo forms appear (see FORM_TO_POINT in
    // trainerSession.ts) — an individual masu drill writes NOTHING to Track B.
    id: "masu",
    title: "ます form",
    subtitle: "The polite form — built from the ます-stem.",
    category: "verb",
    verbForms: ["masu"],
    grammarPointIds: ["masu-negative", "masu-past-negative"],
    formation: [
      {
        groupLabel: "Godan",
        pattern: "final う-row kana → い-row + ます",
        exampleDict: "のむ",
        exampleForm: "のみます",
      },
      {
        groupLabel: "Ichidan",
        pattern: "〜る → 〜ます",
        exampleDict: "たべる",
        exampleForm: "たべます",
      },
      {
        groupLabel: "Irregular",
        pattern: "する → します",
        exampleDict: "する",
        exampleForm: "します",
      },
      {
        groupLabel: "Irregular",
        pattern: "くる → きます",
        exampleDict: "くる",
        exampleForm: "きます",
      },
    ],
  },
  {
    id: "v-tai",
    title: "Want to (たい)",
    subtitle: "ます-stem + たい; then conjugates like an い-adjective.",
    category: "verb",
    // Base form only (see nai-form note): たくない/たかった/たくなかった are
    // combo-exclusive — stacking v-tai with nai-form/ta-form is the only drill
    // path to them. Stacked FormationRows below remain cheat-sheet reference.
    verbForms: ["tai"],
    grammarPointIds: ["v-tai"],
    formation: [
      {
        groupLabel: "Formation",
        pattern: "ます-stem + たい",
        exampleDict: "のむ",
        exampleForm: "のみたい",
      },
      {
        groupLabel: "Stacked — negative",
        pattern: "たい → たくない",
        exampleDict: "のむ",
        exampleForm: "のみたくない",
        exampleNotInTables: true,
      },
      {
        groupLabel: "Stacked — past",
        pattern: "たい → たかった",
        exampleDict: "のむ",
        exampleForm: "のみたかった",
        exampleNotInTables: true,
      },
      {
        groupLabel: "Stacked — negative past",
        pattern: "たい → たくなかった",
        exampleDict: "のむ",
        exampleForm: "のみたくなかった",
        exampleNotInTables: true,
      },
    ],
  },
  {
    id: "i-adj-forms",
    title: "い-adjective forms",
    subtitle: "The く-stem negative — past forms stack on by combining.",
    category: "i-adj",
    // Base form only (see nai-form note): the drilled rule is the く-stem
    // negative (い → くない). かった / くなかった are combo-exclusive — stacking
    // this tile with ta-form (+ nai-form for the negative past) is the only
    // drill path to them (comboForms.ts). The stacked FormationRows below stay
    // as cheat-sheet reference. i-adj-past / i-adj-past-negative are graded
    // ONLY when their combo forms appear (FORM_TO_POINT), mirroring ません.
    adjForms: ["negative"],
    grammarPointIds: ["i-adj-negative", "i-adj-past", "i-adj-past-negative"],
    formation: [
      {
        groupLabel: "Negative",
        pattern: "〜い → 〜くない",
        exampleDict: "たかい",
        exampleForm: "たかくない",
      },
      {
        groupLabel: "Stacked — past",
        pattern: "〜い → 〜かった",
        exampleDict: "たかい",
        exampleForm: "たかかった",
      },
      {
        groupLabel: "Stacked — past negative",
        pattern: "〜い → 〜くなかった",
        exampleDict: "たかい",
        exampleForm: "たかくなかった",
      },
      {
        groupLabel: "Irregular (いい)",
        pattern: "いい uses the よ- stem (よくない, よかった)",
        exampleDict: "いい",
        exampleForm: "よくない",
      },
    ],
  },
];

// ─── Lookups ───────────────────────────────────────────────────────────

export function getTrainerType(id: string): ConjugationTrainerType | undefined {
  return CONJUGATION_TRAINER_TYPES.find((t) => t.id === id);
}

/**
 * Module (the N of `module: "mN"`) where a Track B grammar point is taught.
 * Unknown ids resolve to +Infinity — a gate on a missing point FAILS CLOSED
 * (the form never drills on-path) instead of silently unlocking at m0.
 */
export function grammarPointModule(pointId: string): number {
  const point = GRAMMAR_POINTS.find((p) => p.id === pointId);
  if (!point) return Number.POSITIVE_INFINITY;
  const n = parseInt(point.module.slice(1), 10);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

// ─── Per-form unlock gates (B016) ────────────────────────────────────────
//
// Availability is PER FORM, not per tile. Each drillable form (individual
// base forms AND combo/stacked forms) lists the grammar point(s) that must be
// taught before an on-path session may drill it; the gate module is the
// latest of those points. Tiles unlock at their EARLIEST drilled form's gate
// (see unlockModuleForType), and the session builders draw only forms whose
// gate the pool module has reached — so one late point (masu-past-negative)
// no longer locks a whole tile, and a form is never drilled before the
// course teaches it (intro-before-review).

/**
 * FORM → grammar point(s) that teach it. Forms grading to `null` in
 * FORM_TO_POINT (trainerSession.ts) still gate on their POOLED points here
 * (ます on masu-present, ました on masu-past) — null there only means "don't
 * double-grade", not "always available". Stacked forms also list their
 * morphological ingredients (なかった needs both ない and た).
 */
export const FORM_GATE_POINTS: Record<string, string[]> = {
  te: ["te-form"],
  ta: ["ta-form"],
  nai: ["nai-form"],
  "nai-past": ["nai-form", "ta-form"],
  tai: ["v-tai"],
  "tai-neg": ["v-tai", "nai-form"],
  "tai-past": ["v-tai", "ta-form"],
  "tai-neg-past": ["v-tai", "nai-form", "ta-form"],
  masu: ["masu-present"],
  "masu-neg": ["masu-negative"],
  "masu-past": ["masu-past"],
  "masu-past-neg": ["masu-past-negative"],
  // i-adj forms — each stacked form is its own taught point.
  negative: ["i-adj-negative"],
  past: ["i-adj-past"],
  "past-negative": ["i-adj-past-negative"],
};

/**
 * The module a form becomes drillable on-path: the latest module across its
 * gate points. An unmapped form returns +Infinity (fails closed — the
 * registry test asserts every drilled form is mapped).
 */
export function formUnlockModule(form: string): number {
  const points = FORM_GATE_POINTS[form];
  if (!points || points.length === 0) return Number.POSITIVE_INFINITY;
  return Math.max(...points.map(grammarPointModule));
}

/**
 * Unlock module = the EARLIEST gate across the forms the tile itself drills
 * (B016). The old MAX-over-grammar-points aggregator meant one late point
 * locked the whole tile — e.g. masu-past-negative would have locked ます
 * practice out of the hub until its own (much later) module even though ます
 * is taught at m7. The tile opens when its first form is teachable; later
 * forms stay out of the drill pool until reached (formUnlockModule filtering
 * in trainerSession.ts).
 */
export function unlockModuleForType(type: ConjugationTrainerType): number {
  const forms: string[] =
    type.category === "verb" ? type.verbForms ?? [] : type.adjForms ?? [];
  const gates = forms.map(formUnlockModule).filter((n) => Number.isFinite(n));
  if (gates.length > 0) return Math.min(...gates);
  // Defensive fallback (no mapped forms): earliest covered grammar point.
  const points = type.grammarPointIds
    .map(grammarPointModule)
    .filter((n) => Number.isFinite(n));
  return points.length > 0 ? Math.min(...points) : 0;
}

export function isTypeUnlocked(
  type: ConjugationTrainerType,
  reachedModule: number,
): boolean {
  return reachedModule >= unlockModuleForType(type);
}

// ─── Learn-ahead (v1.5) ────────────────────────────────────────────────
//
// Locked tiles are drillable after an explicit confirmation. An "ahead"
// session is practice-only: it writes NO SRS (the learner hasn't been taught
// the forms, so scheduling reviews off it would poison Track B state), and it
// draws its drill pool from the type's unlock module instead of the learner's
// reached module (the reached-module pool can be EMPTY — table entries start
// at m7, so a m3 learner opening て-form would otherwise get no questions).

/** True when ANY of the selected types unlocks past the learner's module. */
export function isSelectionAhead(
  ids: TrainerTypeId[],
  reachedModule: number,
): boolean {
  return ids.some((id) => {
    const type = getTrainerType(id);
    return !!type && !isTypeUnlocked(type, reachedModule);
  });
}

/**
 * The module the drill pool should draw from: the learner's reached module,
 * raised to the latest unlock module among the selected types when drilling
 * ahead. On-path selections are unchanged (their unlocks are ≤ reached).
 * Kanji exposure is NOT this — the drill card keeps gating on the REAL
 * reached module (KANJI_EXPOSURE_MODULE), so an early learner still sees kana.
 */
export function effectivePoolModule(
  ids: TrainerTypeId[],
  reachedModule: number,
): number {
  let max = reachedModule;
  for (const id of ids) {
    const type = getTrainerType(id);
    if (!type) continue;
    const unlock = unlockModuleForType(type);
    if (unlock > max) max = unlock;
  }
  return max;
}

/**
 * How many of the type's grammar points need a session right now (drives the
 * hub's due badge). "Due" mirrors the grammar review queue's partition
 * (`buildGrammarReviewQueue`, grammarSrs.ts:179-191):
 *   - a point with NO Track B state is unseen-but-unlocked → counts as due
 *     (it needs its first session; the queue routes these into `newItems`);
 *   - a point WITH state counts when a sub-state is due (mirrors `isDue`:
 *     `sub.dueDate <= now`, honouring `buriedUntil`).
 * Callers only invoke this for UNLOCKED types (locked types show no badge),
 * but with per-form unlocks (B016) a tile can be open while some of its
 * points are still ahead of the learner — those are skipped (an unreached
 * point has no session that could ever clear its badge).
 */
export function dueGrammarPointCount(
  type: ConjugationTrainerType,
  reachedModule: number,
  now: Date = new Date(),
): number {
  const nowStr = now.toISOString().slice(0, 10);
  let count = 0;
  for (const id of type.grammarPointIds) {
    if (grammarPointModule(id) > reachedModule) continue; // not taught yet
    const state = getGrammarCardState(id);
    if (!state) {
      // unseen-but-unlocked — mirrors the queue's `if (!state)` unseen branch.
      count += 1;
      continue;
    }
    if (state.buriedUntil && state.buriedUntil > nowStr) continue;
    if (state.recognition.dueDate <= nowStr || state.production.dueDate <= nowStr) {
      count += 1;
    }
  }
  return count;
}
