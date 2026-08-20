/**
 * es-ir/templates.mjs — the lesson SHAPES, as functions over an IR spec.
 *
 * The ja IR expresses a lesson as a list of `beats` and lets the compiler
 * decide the step sequence. ES cannot copy that yet, because the ES quality
 * gates constrain the ORDER directly — no adjacent same-type steps, no run of
 * three selections, ≥2 generation steps, ≥1 typed/spoken, a passive card must
 * be followed up at i+1 AND at i+2/i+3 — and those are properties of a
 * sequence, not of a beat list. m17's 20-step template was tuned against every
 * one of those gates simultaneously, and the order it landed on is load-bearing.
 *
 * So the ES IR declares WHICH TEMPLATE a lesson uses and fills its slots. The
 * template is the part that satisfies the gates; the IR is the part that
 * carries the judgment. Moving a step here changes every module at once, which
 * is the point — m17 could only be fixed one literal at a time.
 *
 * Templates:
 *   topic   — the 20-step teaching lesson (3 anchors + extras + a bespoke 17th)
 *   free    — an explicit step list, for lessons whose contrast IS the lesson
 *             (m17's accent minimal pair, its far-past markers)
 *   review  — Repaso: no new forms, draws only from what the module taught
 *   mastery — the graded test; every step counts, no passive cards at all
 */
import { conjugate } from "../morph-es.mjs";
import { q } from "./assemble.mjs";

/** A lesson wrapper, identical for every template. */
export function lessonSource({ id, moduleId, title, description, steps }) {
  return [
    `const ${id.toUpperCase().replace(/-/g, "_")}: LessonContent = {`,
    `  id: ${q(id)},`,
    `  moduleId: ${q(moduleId)},`,
    `  courseId: COURSE_ID,`,
    `  languageId: "es",`,
    `  title: ${q(title)},`,
    `  description: ${q(description)},`,
    `  estimatedMinutes: ${steps.length >= 18 ? 10 : 8},`,
    `  xpReward: 20,`,
    `  steps: [`,
    ...steps,
    `  ],`,
    `};`,
    ``,
  ].join("\n");
}

/**
 * The 20-step TOPIC lesson. Every position is deliberate:
 *
 *   1  info            open-frame — the rule in one card
 *   2  phrase A1       passive card …
 *   3  formMcq A1      … followed up at i+1 (per-module gate)
 *   4  build A1        … and again at i+2 (the same gate's second clause)
 *   5  phrase A2       second passive card
 *   6  cloze A2        follow-up
 *   7  translate A2    a GENERATION step — the gate wants ≥2 per lesson
 *   8  speaking        the typed/spoken requirement, met early so a lesson
 *                      that runs short still satisfies it
 *   9  textMcq         breaks what would otherwise be a 3-selection run
 *   10 listenComp      recognition direction
 *   11 build           generation #2
 *   12 phrase A3       third passive card
 *   13 formMcq A3      follow-up
 *   14 listenBuild     …at i+2
 *   15 translate A3    generation #3
 *   16 speaking A1     spaced return to the first anchor
 *   17 <bespoke>       the module's own beat — usually selfExplain, which the
 *                      ES gates require ≥2 of per module
 *   18 reviewMatch     compound draw from prior modules (≥6 of m2–m8 needed)
 *   19 speaking close  the lesson's own closing sentence
 *   20 info win        close-payoff
 *
 * Reordering any of 2–4, 5–6 or 12–14 breaks a passive-card follow-up rule.
 * Reordering 8, 9 or 11 breaks the selection-run or generation-count rules.
 */
export function topicLesson(A, spec) {
  const id = `es-${spec.moduleId}-${spec.n}`;
  const { S } = A;
  const steps = [];
  steps.push(S.info(`${id}-info`, spec.info.title, spec.info.body, "grammar"));

  const [A1, A2, A3] = spec.anchors;
  steps.push(S.phrase(`${id}-p-a1`, A1.en, A1.form));
  steps.push(S.formMcq(`${id}-q-a1`, A1.verb, A1.person, A1.why));
  steps.push(S.build(`${id}-b-a1`, A1.p, A1.tiles ?? []));

  steps.push(S.phrase(`${id}-p-a2`, A2.en, A2.form));
  steps.push(S.cloze(`${id}-c-a2`, A2.p, A2.why));
  steps.push(S.translate(`${id}-tr-a2`, A2.p2 ?? A2.p));

  steps.push(S.speaking(`${id}-sp-x`, spec.extra.speaking));
  steps.push(S.textMcq(`${id}-tm-a2`, A2.form, spec.textMcqDistractors));
  steps.push(S.listenComp(`${id}-lc-y`, spec.extra.listen));
  steps.push(S.build(`${id}-b-z`, spec.extra.build, spec.extra.buildTiles ?? []));

  steps.push(S.phrase(`${id}-p-a3`, A3.en, A3.form));
  steps.push(S.formMcq(`${id}-q-a3`, A3.verb, A3.person, A3.why));
  steps.push(S.listenBuild(`${id}-lb-a3`, A3.p, A3.tiles ?? []));
  steps.push(S.translate(`${id}-tr-a3`, A3.p2 ?? A3.p));

  steps.push(S.speaking(`${id}-sp-a1`, A1.p2 ?? A1.p));
  steps.push(spec.seventeen);
  steps.push(S.reviewMatch(`${id}-rev-mp`, `${id}-rev-mp-seed`));
  steps.push(S.speaking(`${id}-sp-close`, spec.close));
  steps.push(S.info(`${id}-win`, spec.win.title, spec.win.body, "win"));

  return lessonSource({
    id,
    moduleId: spec.moduleId,
    title: spec.title,
    description: spec.description,
    steps,
  });
}

/**
 * An anchor: one (verb, person) cell, its drafted sentence, and the one-line
 * reason the form looks the way it does. `second` draws a DIFFERENT sentence
 * for the same cell so step 16's spaced return is not a verbatim repeat.
 */
export function makeAnchor(A, tense, verb, person, en, why, opts = {}) {
  return {
    verb,
    person,
    en,
    why,
    form: conjugate(verb, person, tense),
    p: A.pick(verb, person, opts.p ?? {}),
    p2: opts.second ? A.pick(verb, person, opts.second) : null,
    tiles: opts.tiles,
  };
}

/**
 * The FREE template — an explicit step list, written in the IR.
 *
 * Three kinds of lesson cannot use `topic` and are not variations of it:
 *
 *   · a lesson whose CONTRAST is the lesson (m17's accent minimal pair, its
 *     far-past markers, m18's j-stem beat). The 20-step arc assumes three
 *     anchors that differ only in person; these lessons need pairs that differ
 *     in exactly one feature, and the pairing is the pedagogy.
 *   · Repaso, which by definition introduces nothing and therefore has no
 *     anchors to introduce.
 *   · the Mastery Test, which is graded steps ONLY — no info cards, no passive
 *     vocabulary cards, nothing the learner can pass by reading.
 *
 * Rather than three near-identical templates, the IR lists the steps. That is
 * more YAML per lesson and it is the honest shape: for these lessons the order
 * IS the judgment, so it belongs in the authored file rather than in code.
 *
 * The gates still apply — es-quality reads the emitted lesson, not the IR — so
 * an author who writes three selection steps in a row here will hear about it
 * from vitest rather than from this function. That is deliberate: a second
 * implementation of the gate rules inside the compiler is a second thing to
 * keep in sync, and the m17 wave already showed what happens when the
 * instrument and the content disagree.
 */
export function freeLesson(A, spec, renderStep) {
  const id = `es-${spec.moduleId}-${spec.n}`;
  const steps = spec.steps.map((s, i) => renderStep(A, `${id}-${s.id ?? i}`, s));
  return lessonSource({
    id,
    moduleId: spec.moduleId,
    title: spec.title,
    description: spec.description,
    steps,
  });
}
