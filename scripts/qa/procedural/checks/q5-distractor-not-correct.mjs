/**
 * Q5 distractor-not-correct: no MCQ/cloze distractor is itself an
 * acceptable answer.
 *
 * Tool: literal-text identity against the correct option/particle, honoring
 * a step's own explicit "also correct" declaration
 * (`dialogue_sim` turns' `alsoCorrectOptionIds` — the one place JA content
 * declares a second acceptable choice; see `grammarHelpers.ts`). JA IR
 * currently carries zero `alsoAccepted` entries anywhere (content-change
 * doctrine, §8), so build/translate steps have nothing to cross-check here
 * — Q5 only applies to selection-style steps.
 *
 * Where two distractors carry the SAME gloss/meaning as each other (or as
 * the correct option) but different surface text, correctness is a semantic
 * call this mechanical check cannot make — answered `n/a`, per the brief
 * ("an LLM verifier pass is a later lane").
 */
export const id = "Q5";
export const question = "is every distractor option textually distinct from the correct answer?";
export const enforced = true;

const OPTION_TYPES = new Set([
  "multiple_choice",
  "word_image_mcq",
  "kanji_reading",
  "listening_comprehension",
]);

function optionsAndCorrect(step) {
  if (step.type === "word_image_mcq") {
    const opts = step.options.map((o) => ({ id: o.id, text: o.word }));
    return { opts, correctId: step.correctOptionId };
  }
  if (Array.isArray(step.options) && typeof step.correctOptionId === "string") {
    const opts = step.options.map((o) => ({ id: o.id, text: o.text }));
    return { opts, correctId: step.correctOptionId };
  }
  return null;
}

export function appliesTo(step) {
  if (OPTION_TYPES.has(step.type)) return optionsAndCorrect(step) !== null;
  if (step.type === "particle_cloze") return Array.isArray(step.options);
  if (step.type === "dialogue_sim") return Array.isArray(step.turns);
  return false;
}

function checkOptionSet(opts, correctId, alsoCorrectIds = []) {
  const correct = opts.find((o) => o.id === correctId);
  if (!correct) return { answer: "n/a", evidence: ["no correctOptionId match found — cannot resolve the answer"] };
  const alsoCorrectTexts = new Set(
    opts.filter((o) => alsoCorrectIds.includes(o.id)).map((o) => o.text),
  );
  const dupes = opts.filter(
    (o) => o.id !== correctId && !alsoCorrectIds.includes(o.id) && o.text === correct.text,
  );
  if (dupes.length > 0)
    return { answer: "no", evidence: [`distractor "${dupes[0].text}" is byte-identical to the correct answer "${correct.text}"`] };
  void alsoCorrectTexts;
  return { answer: "yes", evidence: [`${opts.length} option(s), correct answer unique`] };
}

export async function run(step) {
  if (step.type === "particle_cloze") {
    // Index-based ids, not the option TEXT itself: two options can
    // legitimately share text after a planted duplicate, and an
    // id===text scheme would then treat both as "the correct one".
    const opts = step.options.map((o, i) => ({ id: String(i), text: o }));
    const correctIndex = step.options.indexOf(step.correctParticle);
    return checkOptionSet(opts, String(correctIndex));
  }
  if (step.type === "dialogue_sim") {
    const results = [];
    for (const turn of step.turns) {
      if (turn.reply?.mode !== "choice" || !Array.isArray(turn.reply.options)) continue;
      const opts = turn.reply.options.map((o) => ({ id: o.id, text: o.text }));
      const r = checkOptionSet(opts, turn.reply.correctOptionId, turn.reply.alsoCorrectOptionIds ?? []);
      results.push({ turn: turn.id, ...r });
    }
    if (results.length === 0) return { answer: "n/a", evidence: ["no choice turns"] };
    const bad = results.filter((r) => r.answer === "no");
    if (bad.length > 0) return { answer: "no", evidence: bad.flatMap((r) => r.evidence.map((e) => `${r.turn}: ${e}`)) };
    return { answer: "yes", evidence: results.flatMap((r) => r.evidence.map((e) => `${r.turn}: ${e}`)) };
  }
  const oc = optionsAndCorrect(step);
  return checkOptionSet(oc.opts, oc.correctId);
}

/** Plant: duplicate the correct answer's text into a distractor slot. */
export function plant(step) {
  const clone = structuredClone(step);
  if (clone.type === "particle_cloze") {
    clone.options = [clone.options[0], clone.correctParticle, ...clone.options.slice(1)];
    return clone;
  }
  if (clone.type === "dialogue_sim") {
    const turn = clone.turns.find((t) => t.reply?.mode === "choice");
    if (turn) {
      const correct = turn.reply.options.find((o) => o.id === turn.reply.correctOptionId);
      turn.reply.options = turn.reply.options.map((o) =>
        o.id !== turn.reply.correctOptionId && o.id === turn.reply.options[0].id
          ? { ...o, text: correct.text }
          : o,
      );
    }
    return clone;
  }
  const oc = optionsAndCorrect(clone);
  if (oc) {
    const correct = oc.opts.find((o) => o.id === oc.correctId);
    const target = clone.options.find((o) => o.id !== oc.correctId);
    if (target && correct) {
      if (clone.type === "word_image_mcq") target.word = correct.text;
      else target.text = correct.text;
    }
  }
  return clone;
}
