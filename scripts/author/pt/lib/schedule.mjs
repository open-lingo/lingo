/**
 * lib/schedule.mjs — deterministic step ORDER + constraint check. Takes
 * `lib/steps.mjs`'s candidates (unordered, grouped by kind) and produces
 * the final step list: `map` first (unbilled), `info` card second, the
 * middle steps interleaved to satisfy §4's shared rules, closing
 * sim -> matchLit(>=6) -> speakLit-win (or, for `checkpoint: true`,
 * matchLit -> speakLit -> sim: the module law that the LAST lesson of a
 * module always ends on the sim).
 *
 * ROUND 2 (lane PTTOOL2) changes:
 *  - `interleave()` is now ORDER-PRESERVING (finding 1c): ties are broken
 *    by each candidate's `_ord` (its sentence's position in the spec),
 *    never by "which kind's queue is longest" — permutation only happens
 *    to satisfy adjacency/selection-run.
 *  - `ensureDebuts()` (findings 1a/1b): for every new atom, if its
 *    earliest PRINTED appearance among the middle candidates is not on an
 *    intro-capable kind, either hoist an existing intro-capable candidate
 *    for it earlier, or — when none exists at all (e.g. every mention is
 *    inside a contraction-forced cloze) — synthesize a `phrase` debut
 *    immediately before the offending step. Neither path leans on the
 *    info card's prose the way round-1 lanes did.
 *  - PTGRADE checks: `checkContrastSetCoverage`, `checkListenDistractorsDistinct`.
 *
 * On an unsatisfiable spec this throws naming the SMALLEST fix — never a
 * bare "constraints failed" — because a lane reading the pack should never
 * have to open this file to find out what to change.
 */
import {
  SELECTION_ONLY_KINDS, MAX_SELECTION_RUN, STEP_COUNT_MIN, STEP_COUNT_MAX,
  ANSWER_FLOOR, MAX_USES_PER_SENTENCE, MATCH_PAIR_FLOOR, INTRO_CAPABLE_KINDS,
  printedWords,
} from "./rules.mjs";
import { buildPhraseDebut } from "./stepsExtra.mjs";
import { normalizeSentence, literalToken, dedupeOptionsCaseInsensitive } from "./normalizeText.mjs";

/** Order-preserving greedy: at every step, among ELIGIBLE queues (kind !=
 *  last placed, selection-run cap not exceeded), place whichever front
 *  item has the SMALLEST `_ord` — ties broken by queue declaration order.
 *  `checkAdjacency` is still the final backstop for a genuinely infeasible
 *  candidate mix. */
function interleave(groups) {
  const queues = groups.filter((g) => g.length).map((g) => [...g].sort((a, b) => (a._ord ?? 0) - (b._ord ?? 0)));
  const out = [];
  let guard = queues.reduce((n, q) => n + q.length, 0) + 5;
  while (queues.some((q) => q.length) && guard-- > 0) {
    const lastKind = out.at(-1)?.kind;
    const selRun = out.slice(-MAX_SELECTION_RUN).filter((s) => SELECTION_ONLY_KINDS.has(s.kind)).length;
    const eligible = queues.filter((q) => {
      if (!q.length || q[0].kind === lastKind) return false;
      return !(SELECTION_ONLY_KINDS.has(q[0].kind) && selRun >= MAX_SELECTION_RUN);
    });
    const pool = eligible.length ? eligible : queues.filter((q) => q.length && q[0].kind !== lastKind); // relax the run cap before relaxing adjacency
    const pick = pool.length
      ? pool.reduce((a, b) => ((b[0]._ord ?? 0) < (a[0]._ord ?? 0) ? b : a))
      : queues.find((q) => q.length); // last resort: checkAdjacency will name the failure
    if (!pick) break;
    out.push(pick.shift());
  }
  return out;
}

function checkAdjacency(steps) {
  for (let i = 1; i < steps.length; i++) {
    // Two adjacent `phrase` cards are exempt: they only ever appear
    // back-to-back when `ensureDebuts` rescues 2+ orphaned atoms of the
    // SAME contrastSet onto the same target step (e.g. "do"/"da" both
    // previewed as distractor options on the FIRST of the pair's two
    // clozeLits) — a rapid double flashcard intro, not the monotonous
    // selection-only run the adjacency rule exists to prevent (`phrase`
    // isn't even a SELECTION_ONLY_KINDS member).
    if (steps[i].kind === steps[i - 1].kind && steps[i].kind !== "phrase") {
      throw new Error(`schedule: two adjacent "${steps[i].kind}" steps at position ${i} — smallest fix: add one more sentence of a different role so the scheduler has a spacer`);
    }
  }
  let run = 0;
  for (const s of steps) {
    run = SELECTION_ONLY_KINDS.has(s.kind) ? run + 1 : 0;
    if (run > MAX_SELECTION_RUN) {
      throw new Error(`schedule: ${run} selection-only steps in a row ending at "${s.id}" — smallest fix: tag one nearby sentence "build" or "listen" instead of "cloze:"`);
    }
  }
}

/** Every atom a step's correct answer credits (es-m20-brief rule 2's list:
 *  "build answer, cloze blank, MCQ correct, listen answer, sim right
 *  option, match pair"); `imageMcq`, `matchLit`, `sim` derive it. */
function creditedAtoms(s, knownSurfaces) {
  if (s.kind === "imageMcq") return s.target?.surface ? [s.target.surface] : [];
  if (s.kind === "matchLit") return (s.pairs ?? []).map((p) => p.source);
  if (s.kind === "sim") {
    const words = new Set();
    for (const t of s.turns ?? []) {
      if (t.reply?.mode !== "choice") continue;
      const correct = t.reply.options.find((o) => o.id === t.reply.correctOptionId);
      for (const w of (correct?.text ?? "").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean)) {
        if (knownSurfaces.has(w)) words.add(knownSurfaces.get(w));
      }
    }
    return [...words];
  }
  return s.atoms ?? [];
}

function checkAnswerFloor(steps, spec) {
  const counts = new Map(spec.words.map((w) => [w.pt, 0]));
  const known = new Map(spec.words.map((w) => [w.pt.toLowerCase(), w.pt]));
  for (const s of steps) for (const a of creditedAtoms(s, known)) if (counts.has(a)) counts.set(a, counts.get(a) + 1);
  for (const [surface, n] of counts) {
    if (n < ANSWER_FLOOR) {
      throw new Error(`schedule: atom "${surface}" only has ${n} answer position(s) (need >= ${ANSWER_FLOOR}) — smallest fix: add "${surface}" to one more sentence's "uses" list, or add a short recall sentence using it`);
    }
  }
}

function checkSentenceUses(spec) {
  const counts = new Map();
  for (const s of spec.sentences) counts.set(s.pt, (counts.get(s.pt) ?? 0) + s.roles.length);
  for (const [pt, n] of counts) {
    if (n > MAX_USES_PER_SENTENCE) {
      throw new Error(`schedule: sentence "${pt}" is used ${n}x (max ${MAX_USES_PER_SENTENCE}) — smallest fix: drop one role, or write a second sentence for it`);
    }
  }
}

function checkMatchFloor(candidates) {
  const n = candidates.matchLit.pairs.length;
  if (n < MATCH_PAIR_FLOOR) {
    throw new Error(`schedule: matchLit only has ${n} pairs (need >= ${MATCH_PAIR_FLOOR}) — smallest fix: this lesson has no prior-lesson vocabulary to pad from (bootstrap module?); add ${MATCH_PAIR_FLOOR - n} more word(s) to "words" (up to the 8-word budget)`);
  }
}

/** PTGRADE finding 1: every declared `contrastSet` must appear as the
 *  EXACT option-set of >= 2 distinct clozeLit steps — a set that's never
 *  drilled twice (or never drilled with its full option pool) isn't
 *  actually teaching the contrast. */
function checkContrastSetCoverage(steps, spec) {
  for (const set of spec.contrastSet) {
    // ROUND 3 (lane PTTOOL3, rule 7): compared case-insensitively — a
    // sentence-initial member's clozeLit now blanks the LITERAL, capitalized
    // token ("Onde", not "onde"; see stepsCore.mjs's buildClozeLits), so an
    // exact-case Set lookup against the spec's own (always-lowercase)
    // contrastSet declaration would wrongly call a legitimate hit a miss.
    const want = new Set(set.map((w) => w.toLowerCase()));
    const hits = steps.filter((s) => s.kind === "clozeLit" && s.options.length === want.size && s.options.every((o) => want.has(o.toLowerCase())));
    if (hits.length < 2) {
      throw new Error(`schedule: contrastSet [${set.join(", ")}] appears complete in only ${hits.length} clozeLit step(s) (need >= 2) — smallest fix: add one more "cloze:<member>" sentence for this set`);
    }
  }
}

/** PTGRADE finding 3: two listenCompLit steps must never carry the exact
 *  same distractor SET — that's a sign the pool is too thin to actually
 *  test comprehension (any answer looks as plausible as any other). */
function checkListenDistractorsDistinct(steps) {
  const seen = new Map();
  for (const s of steps) {
    if (s.kind !== "listenCompLit") continue;
    const key = [...s.distractorsEn].sort().join("|");
    if (seen.has(key)) {
      throw new Error(`schedule: listenCompLit "${s.id}" and "${seen.get(key)}" share the exact same distractor set — smallest fix: write one more distinct sentence so the pool has enough variety`);
    }
    seen.set(key, s.id);
  }
}

/** Findings 1a/1b: guarantee every new atom's FIRST printed appearance is
 *  on an intro-capable step, by hoisting an existing intro-capable
 *  candidate earlier, or synthesizing a `phrase` debut when none exists —
 *  never by leaning on the info card's prose (round-1's workaround).
 *
 *  Returns `{ target, word }[]` — a synthesized phrase MUST be spliced
 *  directly before `target` by IDENTITY in the final `middle` array (not
 *  merged into the general order-preserving interleave pool): two rescues
 *  landing on the SAME sentence would otherwise fight the no-two-adjacent-
 *  same-kind rule and could get separated by the very step they're
 *  rescuing (verified against a two-orphan-atom fixture in
 *  `schedule.test.mjs`). */
function ensureDebuts(pools, spec) {
  const all = [
    ...pools.imageMcqs, ...pools.clozeLits, ...pools.buildLits, ...pools.listenCompLits,
    ...(pools.agreementLit ? [pools.agreementLit] : []), ...pools.speaks,
    ...pools.contrastSteps, ...pools.patternSteps, ...pools.conjugationClozes,
  ];
  const rescues = [];
  for (const w of spec.words) {
    const surface = w.pt.toLowerCase();
    // Ties (same `_ord` — same originating sentence) prefer an
    // intro-capable kind: a sentence tagged BOTH "listen" and "cloze:x"
    // generates a listenCompLit and a clozeLit at the identical position,
    // and the listenCompLit should win the tie rather than triggering an
    // unnecessary rescue.
    const hits = all.filter((c) => printedWords(c).has(surface)).sort((a, b) =>
      (a._ord ?? 0) - (b._ord ?? 0) ||
      (INTRO_CAPABLE_KINDS.has(a.kind) ? 0 : 1) - (INTRO_CAPABLE_KINDS.has(b.kind) ? 0 : 1),
    );
    if (!hits.length) continue; // never printed in the middle pool — answer-floor/intro checks catch a real gap elsewhere
    const first = hits[0];
    if (INTRO_CAPABLE_KINDS.has(first.kind)) continue; // already a genuine debut
    // Always SYNTHESIZE a `phrase` rescue rather than hoisting an existing
    // intro-capable candidate: hoisting by mutating `_ord` can still land
    // the hoisted step adjacent to an EARLIER same-kind step (e.g. two
    // listenCompLit candidates that are each other's nearest neighbor),
    // which the adjacency check correctly rejects — and reusing that same
    // step via splice (instead of mutation) reopens the same problem for
    // any non-`phrase` kind, since only `phrase` is exempt from the
    // no-two-adjacent-same-kind rule (checkAdjacency's own comment). A
    // synthesized phrase side-steps both failure modes at the cost of one
    // extra low-effort card — see `lib/stepsExtra.mjs`'s `buildPhraseDebut`.
    rescues.push({ target: first, phrase: buildPhraseDebut(w, (first._ord ?? 0) - 0.1) });
  }
  return { rescues, removed: new Set() };
}

/** Splices each rescue's synthesized phrase directly before its target
 *  step, by object identity, in an already-interleaved array. Multiple
 *  rescues sharing one target land together, in the order computed. */
function spliceRescues(middle, rescues) {
  if (!rescues.length) return middle;
  const byTarget = new Map();
  for (const r of rescues) {
    if (!byTarget.has(r.target)) byTarget.set(r.target, []);
    byTarget.get(r.target).push(r.phrase);
  }
  const out = [];
  for (const step of middle) {
    if (byTarget.has(step)) out.push(...byTarget.get(step));
    out.push(step);
  }
  return out;
}

/** ROUND 3 (lane PTTOOL3, rule 5): a checkpoint lesson's own contrastSet
 *  coverage requirement (>= 2 full-set clozeLit steps, PTGRADE finding 1)
 *  is easy to under-shoot by accident — a checkpoint only ever recalls
 *  atoms, so its clozes come from whichever sentences happened to get a
 *  `cloze:<word>` role, and R2-L6 simply DROPPED its contrastSet rather
 *  than hand-author a second cloze. Before scheduling, top up each
 *  declared set: for every member not yet the blank of a full-set cloze,
 *  reuse an ALREADY-AUTHORED sentence that `uses` it and carries no cloze
 *  role of its own (never invented text — the same no-invention doctrine
 *  `lib/stepsExtra.mjs`'s distractor padding uses) as an extra clozeLit.
 *  When no such sentence exists, throws naming exactly which member has
 *  nothing to draw from — "or report which recall sentence to add". */
function autoCoverContrastSets(candidates, spec) {
  if (!spec.checkpoint || !spec.contrastSet.length) return candidates;
  const pool = [...candidates.clozeLits];
  // Case-insensitive, same reasoning as `checkContrastSetCoverage` above:
  // an auto-added (or author-written) cloze's `blank`/`options` may carry
  // the sentence's LITERAL (possibly capitalized) token (rule 7), while
  // `spec.contrastSet` itself is always the plain, lowercase declaration.
  const fullSetHits = (want) => pool.filter((s) => s.options.length === want.size && s.options.every((o) => want.has(o.toLowerCase())));
  for (const set of spec.contrastSet) {
    const want = new Set(set.map((w) => w.toLowerCase()));
    let hits = fullSetHits(want);
    const covered = new Set(hits.map((s) => s.blank.toLowerCase()));
    for (const member of set) {
      if (hits.length >= 2) break;
      if (covered.has(member.toLowerCase())) continue;
      const sentence = spec.sentences.find((s) => s.uses.includes(member) && !s.roles.some((r) => r.startsWith("cloze:")));
      if (!sentence) {
        throw new Error(`schedule: checkpoint contrastSet [${set.join(", ")}] has only ${hits.length} full clozeLit(s) (need >= 2) and no spare sentence uses "${member}" without already carrying its own cloze role — smallest fix: add one more recall sentence using "${member}"`);
      }
      const blank = literalToken(normalizeSentence(sentence.pt), member) ?? member;
      pool.push({
        id: `aclz-${pool.length + 1}`, kind: "clozeLit", _ord: spec.sentences.indexOf(sentence),
        pt: sentence.pt, en: sentence.en, blank,
        options: dedupeOptionsCaseInsensitive(set.map((m) => (m === member ? blank : m)), blank),
        atoms: sentence.uses, why: `"${blank}" is part of the ${set.join("/")} contrast set — pick the one that fits here.`,
      });
      covered.add(member.toLowerCase());
      hits = fullSetHits(want);
    }
  }
  return { ...candidates, clozeLits: pool };
}

export function scheduleSteps(candidates, spec) {
  checkMatchFloor(candidates);
  if (spec.checkpoint && candidates.imageMcqs.length) {
    throw new Error(`schedule: checkpoint lesson debuts ${candidates.imageMcqs.length} new noun(s) via imageMcq — smallest fix: drop the emoji/noun debut, a checkpoint only recalls taught atoms`);
  }
  if (spec.checkpoint && !candidates.sim) {
    throw new Error(`schedule: checkpoint lesson has no "dialogue" — smallest fix: add one so it can end on the sim`);
  }
  candidates = autoCoverContrastSets(candidates, spec);

  const { rescues, removed } = ensureDebuts(candidates, spec);
  const without = (arr) => arr.filter((c) => !removed.has(c));
  // Intro-capable pools (imageMcq/buildLit/listenCompLit) are listed BEFORE
  // clozeLit on purpose: `interleave`'s tie-break keeps the earlier queue
  // on an exact `_ord` tie, so a sentence tagged both e.g. "listen" and
  // "cloze:x" schedules its (intro-capable) listenCompLit at that position
  // and its clozeLit right after — never the reverse, which would make
  // the clozeLit the atom's real first-printed appearance despite
  // `ensureDebuts` having judged the tied listenCompLit sufficient.
  const interleaved = interleave([
    without(candidates.imageMcqs), without(candidates.buildLits), without(candidates.listenCompLits), without(candidates.clozeLits),
    candidates.agreementLit && !removed.has(candidates.agreementLit) ? [candidates.agreementLit] : [],
    without(candidates.speaks), without(candidates.contrastSteps), without(candidates.patternSteps), without(candidates.conjugationClozes),
  ]);
  const middle = spliceRescues(interleaved, rescues);

  const info = { id: "info", kind: "info", title: spec.infoTitle, body: spec.info, variant: "grammar" };
  const steps = spec.checkpoint
    ? [candidates.map, info, ...middle, candidates.matchLit, candidates.speakWin, candidates.sim]
    : [
        candidates.map,
        info,
        ...middle,
        ...(candidates.sim ? [candidates.sim] : []),
        candidates.matchLit,
        candidates.speakWin,
      ];

  if (steps.length < STEP_COUNT_MIN || steps.length > STEP_COUNT_MAX) {
    throw new Error(`schedule: ${steps.length} steps, outside the ${STEP_COUNT_MIN}-${STEP_COUNT_MAX} band — smallest fix: ${steps.length < STEP_COUNT_MIN ? "add one more sentence (a listen or cloze role is cheapest)" : "cut one sentence's extra role"}`);
  }
  checkAdjacency(steps);
  checkAnswerFloor(steps, spec);
  checkSentenceUses(spec);
  checkContrastSetCoverage(steps, spec);
  checkListenDistractorsDistinct(steps);
  return steps;
}
