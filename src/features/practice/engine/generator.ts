/**
 * The madlibs generator — the one filler behind all four practice surfaces.
 *
 * Given a language + surface + count (+ optional seed), it:
 *  1. reads the learner's reached module/grammar + known atoms (learnedContent),
 *  2. keeps only templates whose gate the learner satisfies AND that it can fill,
 *  3. fills each slot with a KNOWN atom of the right POS, SRS-weighted toward
 *     due/struggling, no repeats within an item, never empty, never an unknown
 *     word,
 *  4. resolves target / reading / translation (and, for reading, a POS-typed
 *     blank with same-POS known distractors),
 *  5. folds in authored seed prompts where they fit.
 *
 * Deterministic given `seed` (a stable session) yet fresh across seeds.
 */
import { getSpeakingPrompts } from "@/features/practice/data/practiceDataLoader";
import { getSentenceTemplates } from "@/features/practice/data/sentenceTemplates";
import {
  getKnownAtomsByPos,
  getReachedGrammarPointIds,
  getReachedModule,
} from "./learnedContent";
import { makeRng, seededShuffle, weightedPick, type Rng } from "./prng";
import type {
  KnownAtom,
  LearnerStores,
  PartOfSpeech,
  PracticeBlank,
  PracticeItem,
  PracticeSurface,
  SentenceTemplate,
} from "./types";

export interface GenerateOptions {
  surface: PracticeSurface;
  count: number;
  /** Stable-session seed. Omitted → fresh (wall-clock derived) each call. */
  seed?: number | string;
  /** Injectable learner state (tests); omitted → real stores. */
  stores?: LearnerStores;
}

/** A single clean token — no whitespace or slashes, so it drops into a slot
 *  without breaking the pattern's grammar. */
function isCleanToken(surface: string): boolean {
  return surface.length > 0 && !/[\s/、，,・]/.test(surface);
}

/** Group clean known atoms by part of speech. */
function groupCleanByPos(known: KnownAtom[]): Map<PartOfSpeech, KnownAtom[]> {
  const byPos = new Map<PartOfSpeech, KnownAtom[]>();
  for (const atom of known) {
    if (!isCleanToken(atom.surface)) continue;
    const bucket = byPos.get(atom.pos);
    if (bucket) bucket.push(atom);
    else byPos.set(atom.pos, [atom]);
  }
  return byPos;
}

function candidatesForSlot(
  posSpec: PartOfSpeech | PartOfSpeech[],
  byPos: Map<PartOfSpeech, KnownAtom[]>,
  used: ReadonlySet<string>,
): KnownAtom[] {
  const posList = Array.isArray(posSpec) ? posSpec : [posSpec];
  const out: KnownAtom[] = [];
  for (const p of posList) {
    for (const atom of byPos.get(p) ?? []) {
      if (!used.has(atom.id)) out.push(atom);
    }
  }
  return out;
}

function gateSatisfied(
  template: SentenceTemplate,
  reachedModule: number,
  reachedGrammar: Set<string>,
): boolean {
  const gate = template.grammarGate;
  if (!gate) return true;
  if (gate.minModule != null && reachedModule < gate.minModule) return false;
  if (gate.requiresGrammarPointIds) {
    for (const id of gate.requiresGrammarPointIds) {
      if (!reachedGrammar.has(id)) return false;
    }
  }
  return true;
}

/** Can every slot be filled from the learner's known vocab? */
function fillable(
  template: SentenceTemplate,
  byPos: Map<PartOfSpeech, KnownAtom[]>,
): boolean {
  const emptyUsed = new Set<string>();
  return template.slots.every(
    (slot) => candidatesForSlot(slot.pos, byPos, emptyUsed).length > 0,
  );
}

function substitute(
  pattern: string,
  filled: Record<string, KnownAtom>,
  project: (atom: KnownAtom) => string,
): string {
  return pattern.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const atom = filled[key];
    return atom ? project(atom) : `{${key}}`;
  });
}

function buildBlank(
  filled: Record<string, KnownAtom>,
  byPos: Map<PartOfSpeech, KnownAtom[]>,
  rng: Rng,
): PracticeBlank {
  const keys = Object.keys(filled);
  const slotKey = keys[Math.floor(rng() * keys.length)];
  const answer = filled[slotKey];
  const pool = (byPos.get(answer.pos) ?? []).filter((a) => a.id !== answer.id);
  const distractors = seededShuffle(pool, rng)
    .slice(0, 3)
    .map((a) => ({ surface: a.surface, reading: a.reading, meaningEn: a.meaningEn }));
  return {
    slotKey,
    answer: answer.surface,
    answerReading: answer.reading,
    distractors,
  };
}

function fillTemplate(
  languageId: string,
  template: SentenceTemplate,
  byPos: Map<PartOfSpeech, KnownAtom[]>,
  surface: PracticeSurface,
  rng: Rng,
  index: number,
): PracticeItem | null {
  const used = new Set<string>();
  const filled: Record<string, KnownAtom> = {};
  for (const slot of template.slots) {
    const candidates = candidatesForSlot(slot.pos, byPos, used);
    if (candidates.length === 0) return null;
    const chosen = weightedPick(candidates, (a) => a.weight, rng);
    filled[slot.key] = chosen;
    used.add(chosen.id);
  }

  let target: string;
  let reading: string;
  let translation: string;
  if (template.render) {
    ({ target, reading, translation } = template.render(filled));
  } else {
    target = substitute(template.pattern, filled, (a) => a.surface);
    reading = substitute(
      template.readingPattern ?? template.pattern,
      filled,
      (a) => a.reading,
    );
    translation = substitute(
      template.translationPattern,
      filled,
      (a) => a.meaningEn,
    );
  }

  const item: PracticeItem = {
    id: `${languageId}:gen:${template.id}:${index}`,
    languageId,
    target,
    reading,
    translation,
    exercisedAtomIds: Object.values(filled).map((a) => a.id),
    promptAudioText: target,
    sourceTemplateId: template.id,
  };
  if (surface === "reading") {
    item.blank = buildBlank(filled, byPos, rng);
  }
  return item;
}

/**
 * Authored prompts folded in as seed items where their shape fits. Speaking
 * prompts are short, audio-bearing target phrases with a translation, so they
 * seed speaking / listening / writing. Reading madlibs are generated (the
 * authored comprehension passages carry MCQ questions the flat PracticeItem
 * shape doesn't model), so reading gets no seeds.
 */
function getSeedItems(
  languageId: string,
  surface: PracticeSurface,
  reachedModule: number,
): PracticeItem[] {
  if (surface === "reading") return [];
  const prompts = getSpeakingPrompts(languageId).filter(
    (p) => p.minModule <= reachedModule,
  );
  return prompts.map((p) => ({
    id: `${languageId}:seed:${p.id}`,
    languageId,
    target: p.targetPhrase,
    reading: "",
    translation: p.translation,
    exercisedAtomIds: [],
    promptAudioText: p.promptAudio ?? p.targetPhrase,
    sourceTemplateId: p.id,
  }));
}

/**
 * Generate `count` practice items for a surface from the learner's learned
 * content. Returns fewer than `count` (or `[]`) when the learner's vocab/gates
 * can't support more — surfaces handle the low-vocab case.
 */
export function generatePracticeItems(
  languageId: string,
  opts: GenerateOptions,
): PracticeItem[] {
  const { surface, count } = opts;
  if (count <= 0) return [];

  const rng = makeRng(opts.seed);
  const reachedModule = getReachedModule(languageId, opts.stores);
  const reachedGrammar = getReachedGrammarPointIds(languageId, opts.stores);
  const known = getKnownAtomsByPos(languageId, null, { stores: opts.stores });
  const byPos = groupCleanByPos(known);

  const templates = getSentenceTemplates(languageId).filter(
    (t) =>
      gateSatisfied(t, reachedModule, reachedGrammar) &&
      (!t.surfaces || t.surfaces.includes(surface)) &&
      fillable(t, byPos),
  );

  const seeds = getSeedItems(languageId, surface, reachedModule);
  // When generation is possible, seeds supplement (up to a third). When no
  // template can be filled, seeds carry the whole session (graceful low-vocab).
  const canGenerate = templates.length > 0;
  const seedQuota = seeds.length
    ? Math.min(seeds.length, canGenerate ? Math.floor(count / 3) : count)
    : 0;
  const chosenSeeds = seededShuffle(seeds, rng).slice(0, seedQuota);

  const generated: PracticeItem[] = [];
  const genTarget = Math.max(0, count - chosenSeeds.length);
  const maxAttempts = genTarget * 12 + 24;
  let attempts = 0;
  while (generated.length < genTarget && canGenerate && attempts < maxAttempts) {
    attempts++;
    const template = templates[Math.floor(rng() * templates.length)];
    const item = fillTemplate(
      languageId,
      template,
      byPos,
      surface,
      rng,
      generated.length,
    );
    if (item) generated.push(item);
  }

  return seededShuffle([...chosenSeeds, ...generated], rng).slice(0, count);
}
