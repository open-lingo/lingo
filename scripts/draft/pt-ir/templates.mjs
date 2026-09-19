/**
 * pt-ir/templates.mjs — the lesson SHAPE, as a function over an IR spec.
 *
 * Ported from `es-ir/templates.mjs`, keeping ONLY `freeLesson` (+ the
 * `lessonSource` wrapper it depends on). PT never uses ES's `topic` template
 * (the 20-step teaching lesson built from 3 anchors drawn against a frame) —
 * PT is frameless-only (design doc §1 row 1), so every PT lesson IS a `free`
 * lesson: an explicit step list the IR author writes directly, exactly the
 * way ES's own `topicLesson` doc-comment describes for "a lesson whose
 * CONTRAST is the lesson." For PT that is every lesson, not the exception,
 * so `topicLesson` and its `makeAnchor` helper (which draws (verb, person)
 * cells from a frame — PT has none) are dropped, not ported.
 *
 * The gates still apply — pt-quality (once it exists) reads the emitted
 * lesson, not the IR — so an author who writes three selection steps in a
 * row here will hear about it from vitest rather than from this function.
 * That is deliberate, same as ES: a second implementation of the gate rules
 * inside the compiler is a second thing to keep in sync.
 */
import { q } from "./assemble.mjs";

/** A lesson wrapper, identical in shape to ES's (languageId: "pt"). */
export function lessonSource({ id, moduleId, title, description, steps }) {
  return [
    `const ${id.toUpperCase().replace(/-/g, "_")}: LessonContent = {`,
    `  id: ${q(id)},`,
    `  moduleId: ${q(moduleId)},`,
    `  courseId: COURSE_ID,`,
    `  languageId: "pt",`,
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
 * The FREE template — an explicit step list, written in the IR. PT has no
 * `topic` template to fall back to, so this is the only lesson shape PT
 * compiles: `compile-ir-pt.mjs` validates every lesson's `template` field is
 * `"free"` before this is ever called.
 */
export function freeLesson(A, spec, renderStep) {
  const id = `pt-${spec.moduleId}-${spec.n}`;
  const steps = spec.steps.map((s, i) => renderStep(A, `${id}-${s.id ?? i}`, s));
  return lessonSource({
    id,
    moduleId: spec.moduleId,
    title: spec.title,
    description: spec.description,
    steps,
  });
}
