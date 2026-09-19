/**
 * lib/schedule.mjs — deterministic step ORDER + constraint check. Takes
 * `lib/steps.mjs`'s candidates (unordered, grouped by kind) and produces
 * the final step list: `map` first (unbilled), `info` card second, the
 * middle steps interleaved to satisfy §4's shared rules, closing
 * sim -> matchLit(>=6) -> speakLit-win.
 *
 * On an unsatisfiable spec this throws naming the SMALLEST fix — never a
 * bare "constraints failed" — because a lane reading the pack should never
 * have to open this file to find out what to change.
 */
import {
  SELECTION_ONLY_KINDS, MAX_SELECTION_RUN, STEP_COUNT_MIN, STEP_COUNT_MAX,
  ANSWER_FLOOR, MAX_USES_PER_SENTENCE, MATCH_PAIR_FLOOR,
} from "./rules.mjs";

/**
 * Interleave via the classic "reorganize/task-scheduler" greedy: at every
 * step, place one item from whichever ELIGIBLE queue (kind != last placed,
 * selection-run cap not exceeded) currently holds the MOST remaining
 * items — never round-robin one-per-queue-per-pass, which starves a
 * single large queue down to its last items with nothing left to
 * interleave against (the bug a first draft of this function had: it
 * clumped every group's whole run together instead of spreading it).
 * This greedy is provably optimal for "no two adjacent equal" whenever a
 * solution exists at all; `checkAdjacency` is still the final backstop for
 * a genuinely infeasible candidate mix (e.g. one kind is > half the total).
 */
function interleave(groups) {
  const queues = groups.filter((g) => g.length).map((g) => [...g]);
  const out = [];
  let guard = queues.reduce((n, q) => n + q.length, 0) + 5;
  while (queues.some((q) => q.length) && guard-- > 0) {
    const lastKind = out.at(-1)?.kind;
    const selRun = out.slice(-MAX_SELECTION_RUN).filter((s) => SELECTION_ONLY_KINDS.has(s.kind)).length;
    const eligible = queues.filter((q) => {
      if (!q.length || q[0].kind === lastKind) return false;
      return !(SELECTION_ONLY_KINDS.has(q[0].kind) && selRun >= MAX_SELECTION_RUN);
    });
    const pick = eligible.length
      ? eligible.reduce((a, b) => (b.length > a.length ? b : a))
      : queues.filter((q) => q.length && q[0].kind !== lastKind)[0] // relax the run cap before relaxing adjacency
        ?? queues.find((q) => q.length); // last resort: checkAdjacency will name the failure
    if (!pick) break;
    out.push(pick.shift());
  }
  return out;
}

function checkAdjacency(steps) {
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].kind === steps[i - 1].kind) {
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

/** Every atom a step's correct answer credits, per es-m20-brief rule 2's
 *  own list ("build answer, cloze blank, MCQ correct, listen answer, sim
 *  right option, match pair") — most kinds carry an explicit `atoms:`
 *  field, but three don't and need their answer position derived:
 *  `imageMcq` (word_image_mcq — no field at all, real L1 doesn't carry one
 *  either; the target surface IS the "MCQ correct"), `matchLit` (every
 *  pair's `source` is a "match pair"), and `sim` (the CORRECT reply
 *  option's own words are the "sim right option" — a mirror/self-cueing
 *  reply only credits words the learner actually picked, not the NPC line). */
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

export function scheduleSteps(candidates, spec) {
  checkMatchFloor(candidates);
  const middle = interleave([
    candidates.imageMcqs,
    candidates.clozeLits,
    candidates.buildLits,
    candidates.listenCompLits,
    candidates.agreementLit ? [candidates.agreementLit] : [],
  ]);

  const info = { id: "info", kind: "info", title: spec.grammar, body: spec.info, variant: "grammar" };
  const steps = [
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
  return steps;
}
