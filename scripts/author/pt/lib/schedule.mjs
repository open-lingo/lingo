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
    const lastPt = out.at(-1)?.pt;
    const selRun = out.slice(-MAX_SELECTION_RUN).filter((s) => SELECTION_ONLY_KINDS.has(s.kind)).length;
    const eligible = queues.filter((q) => {
      if (!q.length || q[0].kind === lastKind) return false;
      return !(SELECTION_ONLY_KINDS.has(q[0].kind) && selRun >= MAX_SELECTION_RUN);
    });
    const pool = eligible.length ? eligible : queues.filter((q) => q.length && q[0].kind !== lastKind); // relax the run cap before relaxing adjacency
    // ITEM 7 (lane PTTOOL5): never place a step whose literal `pt` is
    // IDENTICAL to the step just placed — a sentence tagged both e.g.
    // "listen" and "cloze:x" generates a listenCompLit and a clozeLit of
    // the exact same text at the same `_ord`, which this tie-break used
    // to schedule back-to-back (PTGRADE's "clz-2 pt == lst-2 pt" dead
    // couplets). Prefer any OTHER eligible queue whose front step's pt
    // differs; fall back to the colliding one only when every eligible
    // queue collides (checkAdjacency-style last resort).
    const nonColliding = pool.filter((q) => !(lastPt && q[0].pt === lastPt));
    const candidates = nonColliding.length ? nonColliding : pool;
    const pick = candidates.length
      ? candidates.reduce((a, b) => ((b[0]._ord ?? 0) < (a[0]._ord ?? 0) ? b : a))
      : queues.find((q) => q.length); // last resort: checkAdjacency will name the failure
    if (!pick) break;
    out.push(pick.shift());
  }
  return out;
}

/** ITEM 6 (lane PTTOOL5): no more than 3 `listenCompLit` steps per lesson —
 *  PTGRADE found the step-mix quota flooding a lesson with 4-5. */
export function checkListenCompLitCap(steps) {
  const n = steps.filter((s) => s.kind === "listenCompLit").length;
  if (n > 3) {
    throw new Error(`schedule: ${n} listenCompLit steps (max 3) — smallest fix: change one "listen"-tagged sentence's role to "build" or "speak"`);
  }
}

/** ITEM 6 (lane PTTOOL5): no kind repeats more than 2 times in a row.
 *  `checkAdjacency` already forbids two adjacent same-kind steps for every
 *  kind EXCEPT `phrase` (its own documented exception: a rescued-debut
 *  cluster for 2+ orphaned atoms sharing one target, e.g. do/da rescued
 *  onto the same clozeLit) — `phrase` keeps that exemption here too, so a
 *  legitimate multi-atom rescue is never blocked by this rule; every other
 *  kind is already capped at a run of 1 by `checkAdjacency`, so this is
 *  the explicit, always-true re-statement of "no run of the same kind
 *  > 2" the item calls for, without re-litigating the rescue design. */
export function checkMaxRunLength(steps) {
  let run = 1;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].kind === "phrase" && steps[i - 1].kind === "phrase") { run += 1; continue; }
    run = steps[i].kind === steps[i - 1].kind ? run + 1 : 1;
    if (run > 2) {
      throw new Error(`schedule: "${steps[i].kind}" repeats ${run} times in a row ending at "${steps[i].id}" (max 2) — smallest fix: space out the rescued atoms across two spots, or add an intervening sentence`);
    }
  }
}

/** ITEM 6 (lane PTTOOL5): a step's `distractorsEn` must never equal the
 *  real answer (`en`) of a step within 3 positions either side — PTGRADE4:
 *  "lst-2's distractor 'You have a family and a cat.' is lst-4's own
 *  answer," which primes the learner to reject, a few beats later, the
 *  exact English sentence that is now correct. */
export function checkDistractorsEnNotNearbyAnswers(steps) {
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!Array.isArray(s.distractorsEn) || !s.distractorsEn.length) continue;
    for (let j = Math.max(0, i - 3); j <= Math.min(steps.length - 1, i + 3); j++) {
      if (j === i) continue;
      const answer = steps[j].en;
      if (answer && s.distractorsEn.includes(answer)) {
        throw new Error(
          `schedule: "${s.id}"'s distractorsEn includes "${answer}", the answer of nearby step "${steps[j].id}" (within 3 positions) — ` +
            `smallest fix: swap in a different sentence's en for that distractor slot`,
        );
      }
    }
  }
}

/** ITEM 6 (lane PTTOOL5) support: `buildListenCompLits` (stepsClose.mjs)
 *  picks its distractor window before the final step ORDER is known, so it
 *  cannot itself guarantee no distractor collides with a step that lands
 *  nearby post-scheduling. Repairs any such collision in place, swapping
 *  in a different sentence's `en` from the whole-lesson pool (never
 *  inventing text) BEFORE `checkDistractorsEnNotNearbyAnswers` runs as the
 *  hard backstop — same "auto-repair, then independently re-verify"
 *  doctrine as `autoCoverContrastSets` / `checkContrastSetCoverage`. */
export function fixDistractorsEnNearbyAnswers(steps) {
  const allEn = [...new Set(steps.map((s) => s.en).filter(Boolean))];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!Array.isArray(s.distractorsEn) || !s.distractorsEn.length) continue;
    const nearby = new Set();
    for (let j = Math.max(0, i - 3); j <= Math.min(steps.length - 1, i + 3); j++) {
      if (j !== i && steps[j].en) nearby.add(steps[j].en);
    }
    // `taken` starts as every SURVIVING (non-colliding) original entry, and
    // grows with each replacement chosen — otherwise two different
    // colliding slots can independently pick the SAME single available
    // candidate, replacing a cross-step collision with a same-step
    // duplicate (found via the PROVE run on mech5/mech-m1-l5.yaml: two
    // distinct nearby-answer collisions both resolved to "Bia likes to
    // watch.").
    const taken = new Set(s.distractorsEn.filter((d) => !nearby.has(d)));
    s.distractorsEn = s.distractorsEn.map((d) => {
      if (!nearby.has(d)) return d;
      const replacement = allEn.find((e) => e !== s.en && !nearby.has(e) && !taken.has(e));
      if (replacement) taken.add(replacement);
      return replacement ?? d; // no alternative exists — the backstop check below will throw, naming it
    });
  }
}

/** ITEM 7 (lane PTTOOL5): backstop for `interleave()`'s own pt-collision
 *  avoidance — a collision can still land adjacent after `spliceRescues`
 *  reshuffles the array (a rescued `phrase` card, or simply running out of
 *  non-colliding eligible queues mid-interleave). For each adjacent pair
 *  sharing an identical, non-empty `pt`, swaps the second step with a
 *  LATER step of the exact same `kind` whose `pt` differs — same kind at
 *  both ends means every kind-based invariant (adjacency, run length,
 *  selection-run count) is unaffected by the swap; only picks a donor
 *  that doesn't just relocate the collision elsewhere — checked in BOTH
 *  directions (any earlier or later same-kind step), and tried against
 *  either half of the colliding pair, since a donor may only exist on one
 *  side. */
function trySwap(steps, i, k) {
  if (i === k) return false;
  const a = steps[i], b = steps[k];
  if (a.kind !== b.kind || !a.pt || !b.pt || a.pt === b.pt) return false;
  const iPrev = i > 0 ? steps[i - 1].pt : undefined;
  const iNext = i < steps.length - 1 ? steps[i + 1].pt : undefined;
  const kPrev = k > 0 ? steps[k - 1].pt : undefined;
  const kNext = k < steps.length - 1 ? steps[k + 1].pt : undefined;
  const iNeighborsOk = (i - 1 === k || iPrev !== b.pt) && (i + 1 === k || iNext !== b.pt);
  const kNeighborsOk = (k - 1 === i || kPrev !== a.pt) && (k + 1 === i || kNext !== a.pt);
  return iNeighborsOk && kNeighborsOk;
}

function fixAdjacentIdenticalPt(steps) {
  for (let i = 1; i < steps.length; i++) {
    if (!steps[i].pt || steps[i].pt !== steps[i - 1].pt) continue;
    let fixed = false;
    for (let k = 0; k < steps.length && !fixed; k++) {
      if (trySwap(steps, i, k)) { [steps[i], steps[k]] = [steps[k], steps[i]]; fixed = true; }
    }
    for (let k = 0; k < steps.length && !fixed; k++) {
      if (trySwap(steps, i - 1, k)) { [steps[i - 1], steps[k]] = [steps[k], steps[i - 1]]; fixed = true; }
    }
  }
}

/** ITEM 8 (lane PTTOOL5): a defense-in-depth, GENERATION-TIME re-check of
 *  the same rule `ensureDebuts` exists to guarantee ("every new atom's
 *  first printed appearance is on an intro-capable step") and
 *  `checkRules.mjs`'s `checkIntroCapable` re-verifies independently against
 *  the ON-DISK fragment — this is the from-spec.mjs-time version, so a
 *  regression FAILS at generation, naming the word, instead of only
 *  surfacing later via a separate `check.sh` pass (PTGRADE's "pizza debuts
 *  via buildLit instead" — a graded production step standing in for a
 *  debut the scheduler should have guaranteed). The intro-capable set
 *  itself is untouched — read straight from `INTRO_CAPABLE_KINDS`, never
 *  widened or narrowed here. */
export function checkDebutIntroCapable(steps, words) {
  const countable = steps.filter((s) => s.kind !== "map");
  for (const w of words) {
    const surface = w.pt.toLowerCase();
    const first = countable.find((s) => printedWords(s).has(surface));
    if (first && !INTRO_CAPABLE_KINDS.has(first.kind)) {
      throw new Error(
        `schedule: "${w.pt}" first prints on "${first.kind}" (${first.id}), which is not intro-capable — ` +
          `smallest fix: add an earlier map/info/imageMcq/buildLit/speakLit/listenCompLit appearance, or tag its sentence "debut"`,
      );
    }
  }
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
    ...(pools.infinitiveCloze ? [pools.infinitiveCloze] : []),
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
    rescues.push({ target: first, phrase: buildPhraseDebut(w, (first._ord ?? 0) - 0.1, spec) });
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
  spec.contrastSet.forEach((set, setIdx) => {
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
        // ITEM 2 (lane PTTOOL5): the same spec-resolved, validated why the
        // regular clozeLit path writes (stepsCore.mjs's buildClozeLits) —
        // never the old templated "part of the X/Y contrast set" stub.
        atoms: sentence.uses, why: spec.contrastSetWhy[setIdx],
      });
      covered.add(member.toLowerCase());
      hits = fullSetHits(want);
    }
  });
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
    candidates.infinitiveCloze && !removed.has(candidates.infinitiveCloze) ? [candidates.infinitiveCloze] : [],
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
  fixAdjacentIdenticalPt(steps);
  checkAdjacency(steps);
  checkDebutIntroCapable(steps, spec.words);
  checkMaxRunLength(steps);
  checkAnswerFloor(steps, spec);
  checkSentenceUses(spec);
  checkContrastSetCoverage(steps, spec);
  fixDistractorsEnNearbyAnswers(steps);
  checkListenDistractorsDistinct(steps);
  checkListenCompLitCap(steps);
  // Backstop, not a hard fail here: `fixDistractorsEnNearbyAnswers` just
  // repaired every collision it could from the lesson's OWN sentence pool
  // — a genuinely tiny lesson (a handful of sentences total) can run out
  // of alternatives with nothing wrong in the authoring, so scheduling
  // prints an INFO line rather than blocking the lesson; `check-lesson.mjs`
  // / a direct call to `checkDistractorsEnNotNearbyAnswers` is where this
  // becomes a hard, named FAIL against the real on-disk fragment.
  try {
    checkDistractorsEnNotNearbyAnswers(steps);
  } catch (e) {
    console.log(`from-spec: ${spec.id}: INFO: ${e.message}`);
  }
  return steps;
}
