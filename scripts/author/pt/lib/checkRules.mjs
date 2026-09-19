/**
 * lib/checkRules.mjs — independent re-check of §4's shared rules against a
 * LESSON FRAGMENT ALREADY ON DISK (not the spec that generated it, which
 * may not even exist for a hand-authored fragment). `check.sh` runs this
 * so a hand-edit made after generation still gets caught — it never trusts
 * `from-spec.mjs`'s own output blindly.
 *
 * Each check returns `{ name, ok, detail }`; `runAllChecks` never throws.
 */
import {
  SELECTION_ONLY_KINDS, MAX_SELECTION_RUN, STEP_COUNT_MIN, STEP_COUNT_MAX,
  ANSWER_FLOOR, MAX_USES_PER_SENTENCE, MATCH_PAIR_FLOOR, TILE_FLOOR,
  INTRO_CAPABLE_KINDS,
} from "./rules.mjs";

const fail = (name, detail) => ({ name, ok: false, detail });
const pass = (name, detail = "") => ({ name, ok: true, detail });

function checkStepCount(steps) {
  const n = steps.length;
  return n >= STEP_COUNT_MIN && n <= STEP_COUNT_MAX
    ? pass("step-count", `${n} steps`)
    : fail("step-count", `${n} steps, outside ${STEP_COUNT_MIN}-${STEP_COUNT_MAX}`);
}

function checkAdjacency(steps) {
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].kind === steps[i - 1].kind) return fail("adjacency", `"${steps[i].kind}" repeats at step ${i} (id ${steps[i].id})`);
  }
  return pass("adjacency");
}

function checkSelectionRun(steps) {
  let run = 0, max = 0;
  for (const s of steps) { run = SELECTION_ONLY_KINDS.has(s.kind) ? run + 1 : 0; max = Math.max(max, run); }
  return max <= MAX_SELECTION_RUN ? pass("selection-run", `max run ${max}`) : fail("selection-run", `${max} in a row (max ${MAX_SELECTION_RUN})`);
}

/** Mirrors `schedule.mjs`'s own `creditedAtoms` (es-m20-brief rule 2's
 *  answer-position list: build answer / cloze blank / MCQ correct / listen
 *  answer / sim right option / match pair) — `imageMcq`, `matchLit`, and
 *  `sim` have no `atoms:` field, so their answer position is derived. */
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

function checkAnswerFloor(steps, atoms) {
  const counts = new Map(atoms.map((a) => [a.surface, 0]));
  const known = new Map(atoms.map((a) => [a.surface.toLowerCase(), a.surface]));
  for (const s of steps) for (const a of creditedAtoms(s, known)) if (counts.has(a)) counts.set(a, counts.get(a) + 1);
  const short = [...counts].filter(([, n]) => n < ANSWER_FLOOR);
  return short.length === 0
    ? pass("answer-floor", `${counts.size} atoms, all >= ${ANSWER_FLOOR}`)
    : fail("answer-floor", short.map(([s, n]) => `${s}=${n}`).join(", "));
}

function checkSentenceUses(steps) {
  const counts = new Map();
  for (const s of steps) if (s.pt) counts.set(s.pt, (counts.get(s.pt) ?? 0) + 1);
  const over = [...counts].filter(([, n]) => n > MAX_USES_PER_SENTENCE);
  return over.length === 0 ? pass("sentence-uses") : fail("sentence-uses", over.map(([pt, n]) => `"${pt}"x${n}`).join(", "));
}

function checkMatchFloor(steps) {
  const m = steps.find((s) => s.kind === "matchLit");
  if (!m) return pass("match-floor", "no matchLit step");
  const n = (m.pairs ?? []).length;
  return n >= MATCH_PAIR_FLOOR ? pass("match-floor", `${n} pairs`) : fail("match-floor", `${n} pairs (need >= ${MATCH_PAIR_FLOOR})`);
}

function checkTileFloor(steps) {
  const short = steps.filter((s) => s.kind === "buildLit" && s.pt.trim().split(/\s+/).length < TILE_FLOOR);
  return short.length === 0
    ? pass("tile-floor")
    : { name: "tile-floor", ok: null, detail: `${short.map((s) => s.id).join(", ")} — informational: a floor sentence < ${TILE_FLOOR} tiles is only legal if it's the grammar point's debut (not recoverable from the compiled fragment; verify by hand)` };
}

/** Every literally-PRINTED word on a step, across every kind this lesson
 *  can emit — the doctrine is about PRINTED first appearance (§4 shared
 *  rules), not about which step first CREDITS the atom (that's
 *  `checkAnswerFloor`'s job, via `atoms:`) — a word can be printed on a
 *  `map`/`imageMcq` step that carries no `atoms:` field at all. */
function printedWords(s) {
  const texts = [];
  if (s.pt) texts.push(s.pt);
  if (s.tokens) texts.push(s.tokens.join(" "));
  if (s.target?.surface) texts.push(s.target.surface);
  if (s.options) texts.push(s.options.join(" "));
  if (s.body) texts.push(s.body);
  if (s.turns) for (const t of s.turns) {
    texts.push(t.npc?.pt ?? "");
    if (t.reply?.mode === "choice") texts.push((t.reply.options ?? []).map((o) => o.text).join(" "));
  }
  if (s.pairs) texts.push(s.pairs.map((p) => p.source ?? "").join(" "));
  return new Set(
    texts.join(" ").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean),
  );
}

function checkIntroCapable(steps, atoms) {
  // "word_map does not count" (es-m20-brief's rule 1 footnote, inherited
  // verbatim) — a map's opening sentence prints every one of its words,
  // but that appearance is transparent for this rule; look past it to the
  // first NON-map step that prints the word.
  const countable = steps.filter((s) => s.kind !== "map");
  const bad = [];
  for (const a of atoms) {
    const surface = a.surface.toLowerCase();
    const first = countable.find((s) => printedWords(s).has(surface));
    if (first && !INTRO_CAPABLE_KINDS.has(first.kind)) bad.push(`${a.surface} first printed on "${first.kind}" (${first.id})`);
  }
  return bad.length === 0 ? pass("intro-capable-first-appearance") : fail("intro-capable-first-appearance", bad.join(", "));
}

export function runAllChecks(lesson, atoms) {
  const steps = lesson.steps ?? [];
  return [
    checkStepCount(steps), checkAdjacency(steps), checkSelectionRun(steps),
    checkAnswerFloor(steps, atoms), checkSentenceUses(steps), checkMatchFloor(steps),
    checkTileFloor(steps), checkIntroCapable(steps, atoms),
  ];
}
