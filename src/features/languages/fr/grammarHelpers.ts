/**
 * French grammar helpers — thin language-idiomatic wrappers over the generic
 * lesson step types, in the same shape as `es/grammarHelpers.ts`.
 *
 * SCOPE. This file carries the FRENCH-SPECIFIC factories only: the three step
 * types that exist for the sound/spelling gap (`silent_letter`,
 * `liaison_listen`, `agreement_chain`) and the two French shares with Spanish
 * (`gender_sort`, `aspect_choice_cloze`). The ~20 shared factories (`cloze`,
 * `build`, `translateStep`, `speaking`, `matchPairs`, …) are NOT ported yet,
 * deliberately: porting them before a French module exists means guessing at
 * the parameter shapes the first module's inventory will want, and the ES set
 * took two rewrites to settle. Port each one when the first module needs it.
 *
 * `stress_pattern` is absent ON PURPOSE. Its `accentRule` enum is
 * `aguda | llana | esdrujula` and its worked minimal pair is `hablo` / `habló`
 * — it is a Spanish type. French stress is phrase-final and fixed, so there is
 * no word-level stress for a learner to hear, and a French stress_pattern step
 * would be unanswerable in the strict sense of pin §1. See fr guide §0.1.
 *
 * WHY THESE FACTORIES VALIDATE SO HARD. The house rule is "spend judgment on
 * the INVENTORY, never on the OUTPUT" — a wrong step must be UNREACHABLE, not
 * merely detectable. For French the characteristic bad step is not
 * ungrammatical, it is *unanswerable*: an audio question whose two options are
 * homophones. That reads as correct in every review and fails only in a
 * learner's ear. So every check below throws at authoring time, when the
 * curriculum file is imported, rather than returning a step that renders.
 */
import type {
  AgreementChainStep,
  AspectChoiceClozeStep,
  GenderSortStep,
  LiaisonListenStep,
  SilentLetterStep,
} from "@/features/lesson/types";
import {
  elidesBefore,
  findFrAtomBySurface,
  isConsonantOnset,
  type FrAtom,
} from "./courseAtoms";

/** Resolve surfaces to atom ids for `exercisedAtoms` (graded-step SRS attribution). Unknown surfaces
 *  fall through silently — sentence-level factories legitimately contain
 *  function words that are not registered atoms (same rule as ES). */
function atomIdsFor(surfaces: readonly string[]): string[] {
  const out: string[] = [];
  for (const s of surfaces) {
    const a: FrAtom | undefined = findFrAtomBySurface(s);
    if (a && !out.includes(a.id)) out.push(a.id);
  }
  return out;
}

const fail = (id: string, msg: string): never => {
  throw new Error(`fr ${id}: ${msg}`);
};

/**
 * Refuse a distractor that SOUNDS identical to the answer on an audio-bearing
 * step. `parle`/`parles`/`parlent` are one sound ([paʁl]): offering two of
 * them as competing options in a listening step is unanswerable by ear, and
 * it reads as correct in every review (the characteristic French defect —
 * see the header). The fact lives on the atom (`homophoneKey`), so the check
 * only sees pairs whose atoms are registered and keyed. WRITTEN steps may —
 * should — drill exactly these pairs (that is the written-but-inaudible
 * agreement skill), which is why callers gate this on the step carrying
 * audio.
 */
function failOnHomophoneDistractor(
  id: string,
  where: string,
  correct: string,
  options: readonly string[],
): void {
  const key = findFrAtomBySurface(correct)?.homophoneKey;
  if (!key) return;
  for (const o of options) {
    if (o === correct) continue;
    if (findFrAtomBySurface(o)?.homophoneKey === key) {
      fail(
        id,
        `${where}: option "${o}" is homophonous with the answer "${correct}" ` +
          `(homophoneKey "${key}") — an audio-bearing step cannot be answered ` +
          `by ear. Drop the audio (a WRITTEN agreement drill over homophones ` +
          `is exactly right) or change the distractor.`,
      );
    }
  }
}

// ── silent_letter ────────────────────────────────────────────────────────

/**
 * Tap every grapheme that is not pronounced.
 *
 * `graphemes` is author-split so digraphs that behave as a unit («ch», «ou»,
 * «eau») stay together — a learner tapping the «u» of «beaucoup» separately is
 * answering a question French does not ask.
 */
export function silentLetter(opts: {
  id: string;
  /** The word as written. Checked against `graphemes` — see below. */
  writtenForm: string;
  graphemes: string[];
  silentIndices: number[];
  meaningEn: string;
  audioText?: string;
  ruleNote?: string;
  contrast?: { writtenForm: string; meaningEn: string; note?: string };
  prompt?: string;
  explanation?: string;
}): SilentLetterStep {
  const { id, graphemes, silentIndices, writtenForm } = opts;
  // The split is hand-authored, so it can drift from the word it claims to
  // spell — and a drifted split renders a word that is not the one being
  // taught, silently.
  if (graphemes.join("") !== writtenForm) {
    fail(
      id,
      `graphemes spell "${graphemes.join("")}" but writtenForm is "${writtenForm}"`,
    );
  }
  for (const i of silentIndices) {
    if (!Number.isInteger(i) || i < 0 || i >= graphemes.length) {
      fail(id, `silentIndices contains ${i}, out of range for ${graphemes.length} graphemes`);
    }
    if (graphemes[i].trim() === "") {
      // A space is not a letter, and the view does not render one as a tile —
      // so this index would be an answer the learner cannot tap.
      fail(id, `silentIndices contains ${i}, which is a space, not a letter`);
    }
  }
  if (new Set(silentIndices).size !== silentIndices.length) {
    fail(id, "silentIndices contains a duplicate");
  }
  return {
    id,
    type: "silent_letter",
    prompt: opts.prompt,
    graphemes,
    // Sorted so the view's set comparison and any snapshot are order-stable.
    silentIndices: [...silentIndices].sort((a, b) => a - b),
    meaningEn: opts.meaningEn,
    audioText: opts.audioText ?? writtenForm,
    ruleNote: opts.ruleNote,
    contrast: opts.contrast,
    explanation: opts.explanation,
    exercisedAtoms: atomIdsFor([writtenForm]),
  };
}

// ── liaison_listen ───────────────────────────────────────────────────────

/**
 * Mark the junctions where a liaison is actually pronounced.
 *
 * The pedagogical content is as much the junctions that are SILENT — h aspiré,
 * «et», singular noun + adjective — as the ones that link, because those are
 * where learners over-apply the rule.
 */
export function liaisonListen(opts: {
  id: string;
  words: string[];
  linkedJunctions: number[];
  meaningEn: string;
  audioText?: string;
  junctionNotes?: Record<number, string>;
  prompt?: string;
  explanation?: string;
}): LiaisonListenStep {
  const { id, words, linkedJunctions } = opts;
  if (words.length < 2) {
    fail(id, `needs at least 2 words to have a junction; got ${words.length}`);
  }
  const junctions = words.length - 1;
  for (const j of linkedJunctions) {
    if (!Number.isInteger(j) || j < 0 || j >= junctions) {
      fail(id, `linkedJunctions contains ${j}; valid range is 0..${junctions - 1}`);
    }
  }
  if (new Set(linkedJunctions).size !== linkedJunctions.length) {
    fail(id, "linkedJunctions contains a duplicate");
  }
  // A consonant-onset word blocks liaison — h aspiré (les | héros), and the
  // vowel-spelled glide/onze class (les | yaourts, le | onze). Claiming a
  // link into one teaches a pronunciation that does not exist, and nothing
  // downstream would catch it: the step renders, grades, and is wrong. The
  // fact lives on the atom, read through `isConsonantOnset` — the SAME single
  // source `elidesBefore` reads — precisely so this check is possible and
  // agrees with elision everywhere.
  for (const j of linkedJunctions) {
    const next = findFrAtomBySurface(words[j + 1]);
    if (next && isConsonantOnset(next)) {
      fail(
        id,
        `junction ${j} is marked as linking into "${words[j + 1]}", which is ` +
          `consonant-onset (h aspiré / glide class) — liaison is blocked ` +
          `there (le héros, les | héros; le yaourt).`,
      );
    }
  }
  // A liaison needs a consonant to carry it. A word ending in a vowel elides
  // or simply runs on; it does not liaise, so marking it is a category error.
  for (const j of linkedJunctions) {
    if (!/[bcdfghjklmnpqrstvwxz]$/i.test(words[j])) {
      fail(
        id,
        `junction ${j} links from "${words[j]}", which ends in a vowel — ` +
          `there is no consonant to carry a liaison.`,
      );
    }
  }
  // «et» NEVER links forward — one of the few categorical liaison facts in
  // French («et un café» is [e œ̃ ka.fe], never *[e.tœ̃]). Its final letter is
  // t, so the consonant test above happily passes it; refuse it by name.
  for (const j of linkedJunctions) {
    if (words[j].toLowerCase() === "et") {
      fail(
        id,
        `junction ${j} links FROM «et» — liaison after «et» is categorically ` +
          `forbidden in French (et | un, never *et‿un).`,
      );
    }
  }
  // Pin F1: learners over-apply liaison at least as often as they miss it,
  // so an item made only of linked junctions teaches "link everything" — a
  // worse error than linking nothing. At least one junction must stay silent
  // (h aspiré, «et», singular noun + adjective, or a plain consonant onset).
  // Duplicates and out-of-range indices were rejected above, so equality
  // here means every junction links.
  if (linkedJunctions.length === junctions) {
    fail(
      id,
      `every junction links (${junctions}/${junctions}) — pin F1 requires at ` +
        `least one NON-linking junction per liaison_listen item, or it ` +
        `teaches over-application.`,
    );
  }
  return {
    id,
    type: "liaison_listen",
    prompt: opts.prompt ?? "Tap every junction where you hear a link",
    audioText: opts.audioText ?? words.join(" "),
    meaningEn: opts.meaningEn,
    words,
    linkedJunctions: [...linkedJunctions].sort((a, b) => a - b),
    junctionNotes: opts.junctionNotes,
    explanation: opts.explanation,
    exercisedAtoms: atomIdsFor(words),
  };
}

// ── agreement_chain ──────────────────────────────────────────────────────

/**
 * One head noun, and every slot that must agree with it. Graded
 * all-or-nothing: a chain with one broken link is a broken chain.
 */
export function agreementChain(opts: {
  id: string;
  head: { surface: string; meaningEn: string; featureLabel: string };
  tokens: AgreementChainStep["tokens"];
  meaningEn: string;
  audioText?: string;
  ruleNote?: string;
  prompt?: string;
  explanation?: string;
}): AgreementChainStep {
  const { id, tokens } = opts;
  const slots = tokens.filter(
    (t): t is Extract<AgreementChainStep["tokens"][number], { kind: "slot" }> =>
      t.kind === "slot",
  );
  // One agreement is a cloze. The claim this step type exists to make is that
  // several agreements are ONE decision — which needs several.
  if (slots.length < 2) {
    fail(id, `an agreement CHAIN needs ≥2 slots; got ${slots.length}`);
  }
  const seen = new Set<string>();
  for (const s of slots) {
    if (seen.has(s.id)) fail(id, `duplicate slot id "${s.id}"`);
    seen.add(s.id);
    if (!s.options.includes(s.correct)) {
      fail(id, `slot "${s.id}" answer "${s.correct}" is not among its options`);
    }
    if (new Set(s.options).size !== s.options.length) {
      fail(id, `slot "${s.id}" has a duplicate option`);
    }
    if (s.options.length < 2) {
      fail(id, `slot "${s.id}" has ${s.options.length} option(s); needs ≥2`);
    }
    // Audio-bearing only: a written chain over homophones is the
    // written-but-inaudible agreement skill itself and stays authorable.
    if (opts.audioText) {
      failOnHomophoneDistractor(id, `slot "${s.id}"`, s.correct, s.options);
    }
  }
  return {
    id,
    type: "agreement_chain",
    prompt: opts.prompt,
    head: opts.head,
    tokens,
    meaningEn: opts.meaningEn,
    audioText: opts.audioText,
    ruleNote: opts.ruleNote,
    explanation: opts.explanation,
    exercisedAtoms: atomIdsFor([
      opts.head.surface,
      ...slots.map((s) => s.correct),
    ]),
  };
}

// ── gender_sort ──────────────────────────────────────────────────────────

/**
 * Sort bare nouns into their two genders. Items are printed WITHOUT their
 * article, because the article is the answer.
 */
export function genderSort(opts: {
  id: string;
  buckets: GenderSortStep["buckets"];
  items: GenderSortStep["items"];
  endingRule?: string;
  prompt?: string;
  explanation?: string;
}): GenderSortStep {
  const { id, buckets, items } = opts;
  const bucketIds = buckets.map((b) => b.id);
  if (new Set(bucketIds).size !== 2) fail(id, "the two buckets need distinct ids");
  const seen = new Set<string>();
  for (const it of items) {
    if (!bucketIds.includes(it.bucketId)) {
      fail(id, `item "${it.surface}" targets unknown bucket "${it.bucketId}"`);
    }
    if (seen.has(it.surface)) fail(id, `item "${it.surface}" appears twice`);
    seen.add(it.surface);
    // The article IS the answer — printing it in the item gives it away.
    if (/^(le|la|l'|les|un|une|des)\s|^l'/i.test(it.surface)) {
      fail(id, `item "${it.surface}" carries its article; items must be bare nouns`);
    }
    // The atom registry already knows every noun's gender. If it disagrees
    // with the step, one of them is wrong, and the step is the copy.
    const a = findFrAtomBySurface(it.surface);
    if (a?.gender) {
      const expected = bucketIds[a.gender === "m" ? 0 : 1];
      if (it.bucketId !== expected) {
        fail(
          id,
          `item "${it.surface}" is sorted into "${it.bucketId}" but its atom ` +
            `declares gender "${a.gender}". Fix whichever is wrong — do not ` +
            `let them disagree.`,
        );
      }
    }
  }
  // A bin with nothing in it turns the task into "tap everything on one side".
  for (const b of buckets) {
    if (!items.some((it) => it.bucketId === b.id)) {
      fail(id, `bucket "${b.id}" has no items; both bins must be non-empty`);
    }
  }
  return {
    id,
    type: "gender_sort",
    prompt: opts.prompt,
    buckets,
    items,
    endingRule: opts.endingRule,
    explanation: opts.explanation,
    exercisedAtoms: atomIdsFor(items.map((i) => i.surface)),
  };
}

// ── aspect_choice_cloze ──────────────────────────────────────────────────

/**
 * A short narrative where each blank is a two-way aspect choice
 * (imparfait vs passé composé). The `reason` on each blank is the teaching
 * payload — without it the step is a coin flip the learner cannot learn from.
 */
export function aspectChoiceCloze(opts: {
  id: string;
  prompt: string;
  meaningEn: string;
  segments: AspectChoiceClozeStep["segments"];
  audioText?: string;
  explanation?: string;
}): AspectChoiceClozeStep {
  const { id, segments } = opts;
  const blanks = segments.flatMap((s) => ("blank" in s ? [s.blank] : []));
  if (blanks.length < 2) {
    fail(id, `an aspect narrative needs ≥2 blanks to be a contrast; got ${blanks.length}`);
  }
  const seen = new Set<string>();
  for (const b of blanks) {
    if (seen.has(b.id)) fail(id, `duplicate blank id "${b.id}"`);
    seen.add(b.id);
    if (!b.options.includes(b.correctAnswer)) {
      fail(id, `blank "${b.id}" answer "${b.correctAnswer}" is not among its options`);
    }
    if (b.options[0] === b.options[1]) {
      fail(id, `blank "${b.id}" offers the same form twice`);
    }
    if (!b.reason?.trim()) {
      // Enforced, not merely documented: a two-way choice with no stated
      // reason is a 50% guess, and the learner has no way to convert a wrong
      // answer into knowledge.
      fail(id, `blank "${b.id}" has no reason — the reason IS the teaching payload`);
    }
    // Audio-bearing only — same rule as agreementChain: homophone contrasts
    // belong in writing, where they are answerable.
    if (opts.audioText) {
      failOnHomophoneDistractor(id, `blank "${b.id}"`, b.correctAnswer, b.options);
    }
  }
  // If every blank has the same answer the "choice" is a pattern to spot, not
  // an aspect decision. The whole point is that the narrative alternates.
  const distinct = new Set(blanks.map((b) => (b.correctAnswer === b.options[0] ? 0 : 1)));
  if (distinct.size < 2) {
    fail(id, "every blank resolves to the same option slot — the narrative never contrasts");
  }
  return {
    id,
    type: "aspect_choice_cloze",
    prompt: opts.prompt,
    meaningEn: opts.meaningEn,
    segments,
    audioText: opts.audioText,
    explanation: opts.explanation,
    exercisedAtoms: atomIdsFor(blanks.map((b) => b.correctAnswer)),
  };
}

// ── elision, exposed for build-tile banks ────────────────────────────────

/**
 * `le` + `ami` → `l'ami`. Re-exported here because tile banks and sentence
 * assembly both need it, and both must use the SAME function — the h-aspiré
 * exception has to apply everywhere or nowhere (fr pin §1).
 */
export { elidesBefore };

// ═══════════════════════════════════════════════════════════════════════════
// SHARED factories — ported from es/grammarHelpers.ts for the first FR module
// (m1, 2026-08-19). The header's "port each one when the first module needs
// it" note has now happened: these are the fifteen the frameless IR compiler
// (scripts/compile-ir-fr.mjs) emits calls to. Signatures mirror ES so the
// compiler could be a sibling; the VALIDATION is French:
//
//   · build/listening tile banks refuse an elision breach — a tile sequence
//     («le» before a vowel-onset word) that spells a form French does not
//     write (fr pin F2/F4). The elided form must be authored as ONE tile.
//   · listening_build refuses homophone tiles — two tiles one sound apart
//     («parle»/«parles») make an ear-answered step unanswerable (pin §1).
//     WRITTEN steps may drill exactly those pairs, so build() does not gate.
//   · word_image_mcq derives a gendered noun's display form WITH its article
//     (pin F6: a noun learned bare is a noun learned wrong), through
//     `elidesBefore` so «l'homme» and «le héros» come out right by
//     construction.
//
// No static review-pool fallback (ES's POOL_BY_SURFACE): FR has no prior
// modules to review, so resolution is live-registry only. Add the generated
// snapshot with the first backwards-reviewing module, per the courseAtoms
// header.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  BuildSentenceStep,
  DialogueListenStep,
  InfoStep,
  ListeningBuildStep,
  ListeningComprehensionStep,
  MatchPairsStep,
  MultipleChoiceStep,
  ParticleClozeStep,
  PhraseCardStep,
  SelfExplanationMcqStep,
  SelfExplanationOption,
  SpeakingStep,
  TranslateStep,
  WordImageMcqStep,
} from "@/features/lesson/types";

// ─── Atom resolution (live registry only — see the block header) ─────────

function resolveSurfaceGloss(surface: string): string | undefined {
  return findFrAtomBySurface(surface)?.gloss;
}

function resolveAtomId(surface: string): string | undefined {
  return findFrAtomBySurface(surface)?.id;
}

function resolveAtomIds(surfaces: ReadonlyArray<string> | undefined): string[] {
  if (!surfaces?.length) return [];
  const out: string[] = [];
  for (const s of surfaces) {
    const id = resolveAtomId(s);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

// ─── Slot rotation (FNV-1a + Murmur3 finalizer — same as ES/KO) ──────────

export function slotFor(id: string, slots: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) % slots;
}

// ─── French tile-bank validators ─────────────────────────────────────────

/** The closed set of words that MUST elide before a vowel onset (fr pin F2).
 *  `si` elides before `il`/`ils` only, so it is handled by name below. */
const ELIDING_WORDS = new Set(["le", "la", "je", "de", "que", "ne", "me", "te", "se", "ce"]);

/** Would `left + right` be written elided («le ami» → «l'ami»)? Reads the
 *  atom's consonant-onset fact through the ONE source (`elidesBefore`) when
 *  the right word is registered; for unregistered words it falls back to
 *  spelling, minus `y`/`h` (the glide and h-aspiré classes are lexical and
 *  unknowable without the atom — never guess them; fr pin F3). */
function mustElide(left: string, right: string): boolean {
  const l = left.toLowerCase();
  const r = right.toLowerCase();
  if (l === "si") return r === "il" || r === "ils";
  if (!ELIDING_WORDS.has(l)) return false;
  const atom = findFrAtomBySurface(r);
  if (atom) return elidesBefore(atom);
  return /^[aàâæeéèêëiîïoôœuùûü]/.test(r);
}

/**
 * Refuse a build/listening answer whose word sequence contains an elision
 * breach: «je ai» is not informal French, it is not French (pin F2), and a
 * correctOrder that writes it teaches a string French does not write. The
 * fix is always in the IR: author the elided form («j'ai») as one tile.
 */
function assertNoElisionBreach(id: string, orderedWords: readonly string[]): void {
  for (let i = 0; i < orderedWords.length - 1; i++) {
    if (mustElide(orderedWords[i], orderedWords[i + 1])) {
      throw new Error(
        `fr ${id}: "${orderedWords[i]} ${orderedWords[i + 1]}" must be written ` +
          `elided — author the elided form as ONE tile (fr pin F2/F4).`,
      );
    }
  }
}

/**
 * Refuse a tile bank in an EAR-answered step (listening_build) that carries
 * two tiles of one sound («parle»/«parles», homophoneKey on the atoms). The
 * learner hears [paʁl] and faces two tiles it matches — unanswerable, and it
 * reads as correct in every review (pin §1). Written builds do NOT gate:
 * spelling the inaudible agreement is exactly the written skill.
 */
function assertNoHomophoneTiles(id: string, tiles: readonly string[]): void {
  const byKey = new Map<string, string>();
  for (const t of tiles) {
    const key = findFrAtomBySurface(t)?.homophoneKey;
    if (!key) continue;
    const prev = byKey.get(key);
    if (prev !== undefined && prev !== t) {
      throw new Error(
        `fr ${id}: tiles "${prev}" and "${t}" are homophones (key "${key}") — ` +
          `an ear-answered step cannot tell them apart. Drop one, or drill ` +
          `the pair in a WRITTEN step.`,
      );
    }
    byKey.set(key, t);
  }
}

// ─── Passive-card factory (phrase / vocab) ───────────────────────────────

export function phrase(
  id: string,
  meaningEn: string,
  text: string,
  cultureNote?: string,
  opts?: { atomId?: string; emoji?: string },
): PhraseCardStep {
  const atomId = opts?.atomId ?? resolveAtomId(text);
  return {
    id,
    type: "phrase_card",
    meaningEn,
    // Shared step type: `romaji` is the transliteration slot (empty — Latin
    // script), `kana` the target-script slot (carries the French text).
    romaji: "",
    kana: text,
    cultureNote,
    ...(atomId ? { atomId } : {}),
    ...(opts?.emoji ? { emoji: opts.emoji } : {}),
  };
}

export const vocab = phrase;

// ─── Cloze (function-word fill: articles / preps / conjunctions) ─────────

export function cloze(
  id: string,
  before: string,
  after: string,
  correctParticle: string,
  options: string[],
  meaningEn: string,
  audioText: string,
  explanation?: string,
  exercisedAtomSurfaces?: string[],
): ParticleClozeStep {
  const correctIdx = options.indexOf(correctParticle);
  if (correctIdx === -1) {
    throw new Error(
      `fr cloze(${id}): correctParticle '${correctParticle}' missing from options [${options.join(", ")}]`,
    );
  }
  let rotated = options;
  const targetSlot = slotFor(id, options.length);
  if (correctIdx !== targetSlot) {
    const without = options.filter((_, i) => i !== correctIdx);
    rotated = [
      ...without.slice(0, targetSlot),
      correctParticle,
      ...without.slice(targetSlot),
    ];
  }
  return {
    id,
    type: "particle_cloze",
    prompt: { before, after },
    correctParticle,
    options: rotated,
    meaningEn,
    audioText,
    explanation,
    exercisedAtoms: [
      ...new Set(
        resolveAtomIds([correctParticle, ...(exercisedAtomSurfaces ?? [])]),
      ),
    ],
    modality: "production",
  };
}

// ─── Sentence MCQ ────────────────────────────────────────────────────────

export function sentenceMcq(opts: {
  id: string;
  prompt: string;
  promptAudioText?: string;
  correctText: string;
  distractorsText: [string, string, string];
  explanation?: string;
  exercisedAtomSurfaces?: string[];
}): MultipleChoiceStep {
  const items = [
    { id: "correct", text: opts.correctText },
    { id: "opt-1", text: opts.distractorsText[0] },
    { id: "opt-2", text: opts.distractorsText[1] },
    { id: "opt-3", text: opts.distractorsText[2] },
  ];
  const slot = slotFor(opts.id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "multiple_choice",
    prompt: opts.prompt,
    promptAudioText: opts.promptAudioText,
    options: items,
    correctOptionId: "correct",
    explanation: opts.explanation,
    optionsHideRomaji: true,
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "recognition",
  };
}

// ─── Build / translate / listening (sentence-level) ──────────────────────

export function build(
  id: string,
  prompt: string,
  target: string,
  tiles: string[],
  correctOrder: string[],
  exercisedAtomSurfaces?: string[],
): BuildSentenceStep {
  assertNoElisionBreach(id, correctOrder);
  return {
    id,
    type: "build_sentence",
    prompt,
    targetSentence: target,
    tiles,
    correctOrder,
    granularity: "word",
    audioKey: target,
    exercisedAtoms: resolveAtomIds(exercisedAtomSurfaces),
    modality: "production",
  };
}

/** NOTE fr pin F5: do not author a translate whose answer is an accent
 *  minimal pair (à/a, où/ou, sur/sûr, la/là, du/dû) until the per-language
 *  accentPolicy lands — the shared accentFold would accept the bare form. */
export function translateStep(opts: {
  id: string;
  promptEn: string;
  acceptedAnswers: string[];
  audioText?: string;
  exercisedAtomSurfaces?: string[];
}): TranslateStep {
  return {
    id: opts.id,
    type: "translate",
    sourceText: opts.promptEn,
    sourceLanguage: "native",
    acceptedAnswers: opts.acceptedAnswers,
    audioKey: opts.audioText,
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "production",
  };
}

export function listeningBuildSentence(opts: {
  id: string;
  target: string;
  tiles: string[];
  correctOrder: string[];
  promptEn: string;
  exercisedAtomSurfaces?: string[];
}): ListeningBuildStep {
  assertNoElisionBreach(opts.id, opts.correctOrder);
  assertNoHomophoneTiles(opts.id, opts.tiles);
  return {
    id: opts.id,
    type: "listening_build",
    audioKey: opts.target,
    prompt: opts.promptEn,
    targetSentence: opts.target,
    tiles: opts.tiles,
    correctOrder: opts.correctOrder,
    granularity: "word",
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "production",
  };
}

export function listeningCompSentence(opts: {
  id: string;
  audioText: string;
  correctMeaningEn: string;
  distractorsEn: [string, string, string];
  question?: string;
  exercisedAtomSurfaces?: string[];
}): ListeningComprehensionStep {
  const items = [
    { id: "correct", text: opts.correctMeaningEn },
    { id: "opt-1", text: opts.distractorsEn[0] },
    { id: "opt-2", text: opts.distractorsEn[1] },
    { id: "opt-3", text: opts.distractorsEn[2] },
  ];
  const slot = slotFor(opts.id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "listening_comprehension",
    audioKey: opts.audioText,
    transcript: opts.audioText,
    question: opts.question ?? "What does this mean?",
    options: items,
    correctOptionId: "correct",
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "recognition",
  };
}

// ─── Match pairs (vocab review grid) ─────────────────────────────────────

/**
 * ≥6 pairs is a hard floor, not a pad target: `padMatchPairsFloor` has no fr
 * fill branch (deliberate — see fr pin §7), so a short authored grid would
 * ship short. The factory refusing < 6 is what makes that unreachable.
 */
export function matchPairs(
  idPrefix: string,
  surfaces: string[],
): MatchPairsStep {
  if (surfaces.length < 6) {
    throw new Error(
      `fr matchPairs(${idPrefix}): needs >= 6 surfaces (got ${surfaces.length})`,
    );
  }
  const pairs = surfaces.map((s, i) => {
    const gloss = resolveSurfaceGloss(s);
    if (!gloss) {
      throw new Error(
        `fr matchPairs(${idPrefix}): surface '${s}' is not a registered atom`,
      );
    }
    return { id: `p-${i}`, source: s, target: gloss };
  });
  return {
    id: `${idPrefix}-match`,
    type: "match_pairs",
    prompt: "Match each French word to its meaning",
    playAudioOnSelect: true,
    pairs,
    exercisedAtoms: resolveAtomIds(surfaces),
    modality: "recognition",
  };
}

// ─── Dialogue listen ─────────────────────────────────────────────────────

export function dialogueListen(opts: {
  id: string;
  lines: Array<{ speaker: string; text: string; audioText?: string }>;
  questions: Array<{
    id: string;
    prompt: string;
    correctText: string;
    distractors: [string, string, string];
    explanation?: string;
  }>;
  transcriptRevealAfter?: "first-answer" | "all-answers" | "never";
  exercisedAtomSurfaces?: string[];
}): DialogueListenStep {
  if (opts.lines.length < 1 || opts.lines.length > 8) {
    throw new Error(
      `fr dialogueListen(${opts.id}): lines.length must be 1-8 (got ${opts.lines.length})`,
    );
  }
  if (opts.lines.some((l) => !l.speaker)) {
    throw new Error(
      `fr dialogueListen(${opts.id}): every line must have a speaker`,
    );
  }
  if (opts.questions.length < 1 || opts.questions.length > 3) {
    throw new Error(
      `fr dialogueListen(${opts.id}): questions.length must be 1-3 (got ${opts.questions.length})`,
    );
  }
  const questions = opts.questions.map((qu) => {
    const items = [
      { id: "correct", text: qu.correctText },
      { id: "opt-1", text: qu.distractors[0] },
      { id: "opt-2", text: qu.distractors[1] },
      { id: "opt-3", text: qu.distractors[2] },
    ];
    const slot = slotFor(`${opts.id}-${qu.id}`, 4);
    const correct = items.shift()!;
    items.splice(slot, 0, correct);
    return {
      id: qu.id,
      prompt: qu.prompt,
      options: items,
      correctOptionId: "correct",
      explanation: qu.explanation,
    };
  });
  return {
    id: opts.id,
    type: "dialogue_listen",
    lines: opts.lines.map((l) => ({
      speaker: l.speaker,
      kana: l.text,
      audioText: l.audioText,
    })),
    questions,
    transcriptRevealAfter: opts.transcriptRevealAfter ?? "first-answer",
    format: "dialogue",
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "recognition",
  };
}

// ─── Speaking ────────────────────────────────────────────────────────────

export function speaking(
  id: string,
  targetPhrase: string,
  translation: string,
  exercisedAtomSurfaces?: string[],
): SpeakingStep {
  return {
    id,
    type: "speaking",
    targetPhrase,
    translation,
    // Whisper supports French (SPEECH_LOCALES.fr landed 2026-08-18); graded
    // path on from day one, same as ES. Keep targets inside one phonological
    // word-group until liaison-boundary scoring is measured (fr guide §0.1
    // on ja §8).
    stubbed: false,
    audioKey: targetPhrase,
    exercisedAtoms: resolveAtomIds(exercisedAtomSurfaces),
    modality: "production",
  };
}

// ─── Info / vocab MCQ ────────────────────────────────────────────────────

export function infoStep(
  id: string,
  title: string,
  body: string,
  variant: InfoStep["variant"] = "default",
): InfoStep {
  return { id, type: "info", title, body, variant };
}

/** A gendered noun's display form WITH its definite article, derived through
 *  the ONE elision source: «le chien», «la table», «l'homme», «le héros».
 *  Pin F6 by construction — the caller cannot debut a bare noun. */
export function withArticle(surface: string): string {
  const a = findFrAtomBySurface(surface);
  if (!a || a.partOfSpeech !== "noun" || !a.gender) return surface;
  if (elidesBefore(a)) return `l'${surface}`;
  return `${a.gender === "m" ? "le" : "la"} ${surface}`;
}

/**
 * Vocab-by-image MCQ. Gendered noun options are DISPLAYED with their article
 * (pin F6: a noun learned bare is a noun learned wrong); everything else
 * displays its bare surface. exercisedAtoms stay keyed by the bare surface.
 */
export function vocabMcq(
  idPrefix: string,
  target: { surface: string; meaningEn: string; emoji?: string },
  distractorPool: { surface: string; emoji?: string }[],
): WordImageMcqStep {
  if (!target.emoji) {
    throw new Error(
      `fr vocabMcq: target '${target.surface}' has no emoji — use listeningBuild or listeningComp instead`,
    );
  }
  const filtered = distractorPool.filter(
    (d) => d.surface !== target.surface && Boolean(d.emoji),
  );
  if (filtered.length < 3) {
    throw new Error(
      `fr vocabMcq: distractor pool for '${target.surface}' has only ${filtered.length} emoji-bearing candidates (need 3)`,
    );
  }
  const slot = slotFor(idPrefix, 4);
  const picks = filtered.slice(0, 3);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: withArticle(target.surface), emoji: target.emoji });
    } else {
      const d = picks[di++];
      options.push({ id: `opt-${i}`, word: withArticle(d.surface), emoji: d.emoji! });
    }
  }
  return {
    id: idPrefix,
    type: "word_image_mcq",
    meaningEn: target.meaningEn,
    options,
    correctOptionId: "correct",
    exercisedAtoms: resolveAtomIds([target.surface]),
    modality: "recognition",
  };
}

/** Text-front vocab MCQ — the no-emoji alternative. Gendered nouns display
 *  with their article, same F6 rule as vocabMcq. */
export function vocabTextMcq(
  id: string,
  targetSurface: string,
  distractorSurfaces: string[],
  promptOverride?: string,
): MultipleChoiceStep {
  const gloss = resolveSurfaceGloss(targetSurface);
  if (!gloss) {
    throw new Error(
      `fr vocabTextMcq(${id}): target '${targetSurface}' is not a registered atom`,
    );
  }
  const distractors = distractorSurfaces.filter((s) => s !== targetSurface);
  if (distractors.length < 3) {
    throw new Error(
      `fr vocabTextMcq(${id}): needs >= 3 distractors distinct from the target (got ${distractors.length})`,
    );
  }
  const items = [
    { id: "correct", text: withArticle(targetSurface) },
    { id: "opt-1", text: withArticle(distractors[0]) },
    { id: "opt-2", text: withArticle(distractors[1]) },
    { id: "opt-3", text: withArticle(distractors[2]) },
  ];
  const slot = slotFor(id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id,
    type: "multiple_choice",
    prompt: promptOverride ?? `Which word means "${gloss}"?`,
    options: items,
    correctOptionId: "correct",
    optionsHideRomaji: true,
    exercisedAtoms: resolveAtomIds([targetSurface]),
    modality: "recognition",
  };
}

// ─── Self-explanation MCQ ────────────────────────────────────────────────

export function selfExplain(opts: {
  id: string;
  anchorLabel: string;
  anchorAudioText?: string;
  question: string;
  rule: { text: string };
  surface: { text: string };
  distractor: { text: string };
  ruleExplanation?: string;
}): SelfExplanationMcqStep {
  const base: SelfExplanationOption[] = [
    { id: `${opts.id}-rule`, text: opts.rule.text, reasonType: "rule" },
    { id: `${opts.id}-surface`, text: opts.surface.text, reasonType: "surface" },
    { id: `${opts.id}-distractor`, text: opts.distractor.text, reasonType: "distractor" },
  ];
  const slot = slotFor(opts.id, base.length);
  const options = [...base];
  const correct = options.shift()!;
  options.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "self_explanation_mcq",
    anchor: { label: opts.anchorLabel, audioText: opts.anchorAudioText },
    question: opts.question,
    options,
    correctOptionId: `${opts.id}-rule`,
    ruleExplanation: opts.ruleExplanation,
  };
}
