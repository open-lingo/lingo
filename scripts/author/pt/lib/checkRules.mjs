/**
 * lib/checkRules.mjs — independent re-check of §4's shared rules against a
 * LESSON FRAGMENT ALREADY ON DISK (not the spec that generated it, which
 * may not even exist for a hand-authored fragment). `check.sh` runs this
 * so a hand-edit made after generation still gets caught — it never trusts
 * `from-spec.mjs`'s own output blindly.
 *
 * Each check returns `{ name, ok, detail }`; `runAllChecks` never throws.
 *
 * ROUND 2 (lane PTTOOL2): `printedWords` now imports the SAME definition
 * `lib/schedule.mjs`'s debut-guarantee pass uses (moved to `lib/rules.mjs`)
 * — no drift between what generation-time and check-time consider
 * "printed". Adds `checkCapitalization` (PTGRADE) and, when the fragment
 * carries an `allow:` list and a `priorSurfaces` set is passed in,
 * `checkTaughtVocabResidual` (PTGRADE finding 3).
 */
import {
  SELECTION_ONLY_KINDS, MAX_SELECTION_RUN, STEP_COUNT_MIN, STEP_COUNT_MAX,
  ANSWER_FLOOR, MAX_USES_PER_SENTENCE, MATCH_PAIR_FLOOR, TILE_FLOOR,
  INTRO_CAPABLE_KINDS, printedWords, PT_PERSONAS, PT_ALLOW_WORDS, isProperNounToken,
} from "./rules.mjs";
import { isNormalized } from "./normalizeText.mjs";

const fail = (name, detail) => ({ name, ok: false, detail });
const pass = (name, detail = "") => ({ name, ok: true, detail });

function checkStepCount(steps) {
  const n = steps.length;
  return n >= STEP_COUNT_MIN && n <= STEP_COUNT_MAX
    ? pass("step-count", `${n} steps`)
    : fail("step-count", `${n} steps, outside ${STEP_COUNT_MIN}-${STEP_COUNT_MAX}`);
}

function checkAdjacency(steps) {
  // Mirrors `schedule.mjs`'s own exemption: two adjacent `phrase` cards
  // are a legitimate rescued-debut pair (finding 1a/1b), never the
  // monotonous selection-only run the rule exists to prevent.
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].kind === steps[i - 1].kind && steps[i].kind !== "phrase") {
      return fail("adjacency", `"${steps[i].kind}" repeats at step ${i} (id ${steps[i].id})`);
    }
  }
  return pass("adjacency");
}

function checkSelectionRun(steps) {
  let run = 0, max = 0;
  for (const s of steps) { run = SELECTION_ONLY_KINDS.has(s.kind) ? run + 1 : 0; max = Math.max(max, run); }
  return max <= MAX_SELECTION_RUN ? pass("selection-run", `max run ${max}`) : fail("selection-run", `${max} in a row (max ${MAX_SELECTION_RUN})`);
}

/** Mirrors `schedule.mjs`'s own `creditedAtoms`. */
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

function checkIntroCapable(steps, atoms) {
  // "word_map does not count" — a map's opening sentence prints every one
  // of its words, but that appearance is transparent for this rule; look
  // past it to the first NON-map step that prints the word. `printedWords`
  // (lib/rules.mjs) excludes info-card prose, closing the round-1
  // info-text workaround this check used to silently allow.
  const countable = steps.filter((s) => s.kind !== "map");
  const bad = [];
  for (const a of atoms) {
    const surface = a.surface.toLowerCase();
    const first = countable.find((s) => printedWords(s).has(surface));
    if (first && !INTRO_CAPABLE_KINDS.has(first.kind)) bad.push(`${a.surface} first printed on "${first.kind}" (${first.id})`);
  }
  return bad.length === 0 ? pass("intro-capable-first-appearance") : fail("intro-capable-first-appearance", bad.join(", "));
}

/** PTGRADE: every printed sentence starts uppercase, ends with terminal
 *  punctuation, and never lowercases a persona name mid-sentence. */
function checkCapitalization(steps) {
  const bad = [];
  for (const s of steps) {
    for (const f of ["pt", "en", "sentence", "text"]) {
      if (typeof s[f] === "string" && !isNormalized(s[f])) bad.push(`${s.id}.${f}: "${s[f]}"`);
    }
  }
  return bad.length === 0 ? pass("capitalization") : fail("capitalization", bad.join("; "));
}

/** PTGRADE finding 3: every billed `pt:` target's words must be either a
 *  taught atom (this lesson's own `atoms` + `priorSurfaces`, lessons
 *  1..n-1), on the spec's declared `allow:`/`allowExtra:` function-word
 *  list, or a capitalized proper noun (ROUND 4, item 3 — `isProperNounToken`;
 *  São/Paulo/Rio/Bia never need individual registration) — an un-taught
 *  residual word silently teaches vocabulary the learner was never shown.
 *  Only runs when `priorSurfaces` is provided (check-lesson.mjs supplies
 *  it; a standalone `runAllChecks` call without it skips this, same "n/a"
 *  discipline the rest of the toolkit uses for a missing input). */
function checkTaughtVocabResidual(steps, atoms, priorSurfaces, allow, allowExtra = []) {
  if (!priorSurfaces) return { name: "taught-vocab-residual", ok: null, detail: "n/a: no prior-taught-vocab set supplied" };
  const known = new Set([
    ...atoms.map((a) => a.surface.toLowerCase()),
    ...[...priorSurfaces].map((s) => s.toLowerCase()),
    ...allow.map((s) => s.toLowerCase()),
    ...allowExtra.map((s) => s.toLowerCase()),
    ...[...PT_PERSONAS].map((s) => s.toLowerCase()), // Sam/Bia/Pedro/Rafael are cast names, never taught vocabulary
  ]);
  const bad = [];
  for (const s of steps) {
    if (typeof s.pt !== "string") continue;
    const tokens = s.pt.split(/[^\p{L}]+/u).filter(Boolean);
    tokens.forEach((tok, i) => {
      if (i > 0 && isProperNounToken(tok)) return; // mid-sentence capital = proper noun, always exempt
      const w = tok.toLowerCase();
      if (!known.has(w)) bad.push(`${s.id}: "${w}"`);
    });
  }
  return bad.length === 0 ? pass("taught-vocab-residual") : fail("taught-vocab-residual", [...new Set(bad)].join(", "));
}

/** ROUND 3 (lane PTTOOL3, rule 1): every NON-checkpoint lesson must close
 *  on its sim — R2-L1/L2/L3 each shipped with none at all (round-1 had
 *  one in every lesson; `lib/schedule.mjs`'s own module-law throw only
 *  ever fired for `checkpoint: true`, never for a regular lesson missing
 *  `dialogue`). This is the independent, ON-DISK re-check: it never
 *  trusts that `from-spec.mjs` actually ran (a hand-edited fragment could
 *  drop the sim after generation) — same doctrine as every other check in
 *  this file. `lesson.checkpoint` is `lib/emitFragment.mjs`'s own
 *  round-3 addition (carried only when true); a checkpoint lesson's own
 *  sim requirement is `lib/schedule.mjs`'s generation-time throw, not
 *  re-verified here (the brief scopes this check to non-checkpoint). */
function checkDialogueMandatory(steps, lesson) {
  if (lesson?.checkpoint === true) return pass("dialogue-mandatory", "checkpoint lesson (sim required at generation time instead)");
  return steps.some((s) => s.kind === "sim")
    ? pass("dialogue-mandatory")
    : fail("dialogue-mandatory", `no "sim" step found — every non-checkpoint lesson must close sim -> matchLit -> speakLit-win; add a "dialogue:" block to the spec and regenerate`);
}

/** ROUND 3 (lane PTTOOL3, rule 2): every `noun` atom must carry a
 *  vendored `emoji` (imageMcq-debut-capable), or be explicitly
 *  `imageable: false` with a reason — R2-L3 shipped a noun with neither,
 *  silently losing its debut. Re-checks the ON-DISK fragment's own
 *  `atoms:` list, independent of the spec that generated it (a hand-edit
 *  could delete an atom's `emoji` field after generation). Resolvability
 *  against the vendored set is only checked when `opts.emojiIndex` (a
 *  Set<glyph>) is supplied and non-empty — same "n/a when the input isn't
 *  there" discipline `checkTaughtVocabResidual` already uses. */
function checkImageableNouns(atoms, emojiIndex) {
  const bad = [];
  for (const a of atoms) {
    if (a.partOfSpeech !== "noun") continue;
    if (a.imageable === false) {
      if (!a.imageableReason) bad.push(`${a.surface}: imageable: false with no imageableReason`);
      continue;
    }
    if (!a.emoji) { bad.push(`${a.surface}: no emoji and not imageable: false`); continue; }
    if (emojiIndex && emojiIndex.size && !emojiIndex.has(a.emoji)) bad.push(`${a.surface}: emoji "${a.emoji}" is not vendored`);
  }
  return bad.length === 0 ? pass("imageable-nouns") : fail("imageable-nouns", bad.join(", "));
}

/** ROUND 3 (lane PTTOOL3, rule 3): independent re-check of the fragment's
 *  OWN `allow:` list against the same closed set `spec.mjs` enforces at
 *  generation time — catches a hand-edit that adds a content word to an
 *  already-generated fragment's `allow:`, not just a bad spec. */
function checkAllowClosedSet(allow) {
  const bad = allow.filter((w) => !isProperNounToken(w) && !PT_ALLOW_WORDS.has(w));
  return bad.length === 0
    ? pass("allow-closed-set")
    : fail("allow-closed-set", `"${bad.join(", ")}" not in the closed function-word set {${[...PT_ALLOW_WORDS].join(", ")}} — register as a real atom instead`);
}

/** ROUND 4 (lane PTTOOL4, item 3): independent re-check of the fragment's
 *  `allowExtra:` — a non-empty list with no `allowExtraReason` is a
 *  silent second closed-set entry, exactly what `allowExtra` exists to
 *  NOT be. Informational (not a hard FAIL) when a reason IS present —
 *  same "surface, don't block" doctrine as `checkListenClozeCouplets`. */
function checkAllowExtraReason(allowExtra, reason) {
  if (!allowExtra.length) return pass("allow-extra-reason", "n/a: no allowExtra");
  if (!reason || !String(reason).trim()) {
    return fail("allow-extra-reason", `allowExtra: [${allowExtra.join(", ")}] has no allowExtraReason — a one-off exception must be named, never silent`);
  }
  return { name: "allow-extra-reason", ok: null, detail: `allowExtra: [${allowExtra.join(", ")}] — ${reason}` };
}

/** ROUND 3 (lane PTTOOL3, rule 8 — folding in PTGRADE2's generator/pack
 *  improvement #1): a `listenCompLit` immediately followed by a `clozeLit`
 *  over the IDENTICAL sentence is a legal couplet (Q9-clean, different
 *  kinds, real motion) but deadening in bulk — PTGRADE2 found 4-5 per
 *  lesson in S2's round-2 output. INFORMATIONAL only (same doctrine as
 *  `checkTileFloor`): capping it as a hard FAIL would force a content
 *  rewrite of already-shipped lessons this lane isn't scoped to re-author;
 *  it still SURFACES the count so a lane authoring new content sees it. */
function checkListenClozeCouplets(steps) {
  let couplets = 0;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i - 1].kind === "listenCompLit" && steps[i].kind === "clozeLit" && steps[i - 1].pt === steps[i].pt) couplets++;
  }
  return couplets <= 2
    ? pass("listen-cloze-couplets", `${couplets} (cap 2)`)
    : { name: "listen-cloze-couplets", ok: null, detail: `${couplets} listenCompLit->clozeLit couplets over the identical sentence (PTGRADE2 #1 recommends <= 2) — informational: break some up with an intervening production step` };
}

export function runAllChecks(lesson, atoms, opts = {}) {
  const steps = lesson.steps ?? [];
  return [
    checkStepCount(steps), checkAdjacency(steps), checkSelectionRun(steps),
    checkAnswerFloor(steps, atoms), checkSentenceUses(steps), checkMatchFloor(steps),
    checkTileFloor(steps), checkIntroCapable(steps, atoms), checkCapitalization(steps),
    checkTaughtVocabResidual(steps, atoms, opts.priorSurfaces, opts.allow ?? [], opts.allowExtra ?? []),
    checkDialogueMandatory(steps, lesson),
    checkImageableNouns(atoms, opts.emojiIndex),
    checkAllowClosedSet(opts.allow ?? []),
    checkAllowExtraReason(opts.allowExtra ?? [], opts.allowExtraReason),
    checkListenClozeCouplets(steps),
  ];
}
