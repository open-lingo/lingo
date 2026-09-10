/**
 * Anchor-derivation helpers for the KO-source content program (rung 1b).
 *
 * These mirror `scripts/i18n/extract-content-catalog.mjs`'s `extractStep()`
 * anchor formulas EXACTLY, field-by-field, so a step view calling
 * `resolveContentString(languageId, anchor, enText, uiLocale)` with an
 * anchor built here looks up the SAME key the extractor wrote when it
 * produced `<moduleId>.en.json` / `<moduleId>.<uiLocale>.json`. If either
 * side drifts from the other, translated strings silently stop resolving
 * (safe — falls back to English) rather than mis-resolving, but the whole
 * point of rung 1b's wiring is to make them match.
 *
 * Pure string math only — no I/O, no React. Anything that isn't sure it
 * has a real module id should call `courseIdsFromLessonId` and bail (return
 * null / skip resolution) rather than guess; a wrong anchor doesn't crash
 * anything (resolveContentString just won't find a catalog entry for it),
 * but it silently drops coverage, so getting it right matters more than
 * being defensive here.
 */
import { sha256Hex16 } from "@/shared/tts/sha256";

/** Script-agnostic "is this Japanese-script text" test — identical to the
 *  extractor's own `hasJaScript`, used for prompt anchor selection (JA
 *  surface anchor vs en-hash fallback). Kept local (not imported from the
 *  extractor, which is a Node script, not a browser-safe module). */
export function hasJaScript(s: unknown): s is string {
  return typeof s === "string" && /[぀-ヿ一-鿿]/.test(s);
}

/**
 * `"ja-m6-neo-4"` → `{ languageId: "ja", moduleId: "m6" }`.
 *
 * Lesson/step ids are always prefixed `<languageId>-m<N>-...`
 * (`moduleCompiler.ts`'s `sid()`/`lid` construction), EXCEPT the m1/m2 kana
 * row landmine documented in CLAUDE.md ("m2's row lessons carry `ja-m1-*`
 * ids... NEVER infer module membership from the id prefix"). Content
 * wiring here deliberately does NOT special-case that landmine — it only
 * matters for kana rows, which carry no translatable prose (no `hint`,
 * `explanation`, MCQ `prompt`, etc. of the kind this wiring targets), so a
 * wrong moduleId there just means "no catalog for this id" (safe,
 * English-only) rather than a wrong translation ever being served.
 *
 * Returns null when the id doesn't match the convention (e.g. no provider,
 * a synthetic test id) — callers must treat that as "cannot resolve,
 * render English", never throw.
 */
export function courseIdsFromLessonId(
  lessonId: string | undefined | null,
): { languageId: string; moduleId: string } | null {
  if (!lessonId) return null;
  const m = /^([a-z]+)-(m\d+)-/.exec(lessonId);
  if (!m) return null;
  return { languageId: m[1], moduleId: m[2] };
}

/** Generic `StepBase.hint` — `scripts/i18n/extract-content-catalog.mjs`
 *  `extractStep()`'s `step.hint` branch. */
export function hintAnchor(moduleId: string, lessonId: string, hint: string): string {
  return `${moduleId}/${lessonId}/en:${sha256Hex16(hint)}`;
}

/** Generic `StepBase.explanation`. */
export function explanationAnchor(moduleId: string, lessonId: string, explanation: string): string {
  return `${moduleId}/${lessonId}/en:${sha256Hex16(explanation)}`;
}

/**
 * Generic `step.prompt` string. When the step also carries a JA sentence
 * the prompt is about (`targetSentence` / `correctKana` / `audioText` /
 * `ja` — pass whichever the step type has as `jaSurface`), the anchor keys
 * on that JA surface; otherwise it falls back to the en-string hash. Exact
 * mirror of the extractor's `step.prompt` branch.
 */
export function promptAnchor(
  moduleId: string,
  lessonId: string,
  prompt: string,
  jaSurface?: string | null,
): string {
  return hasJaScript(jaSurface)
    ? `${moduleId}/${lessonId}/ja:${jaSurface}`
    : `${moduleId}/${lessonId}/en:${sha256Hex16(prompt)}`;
}

/** Generic `step.body` (e.g. InfoStep). */
export function bodyAnchor(moduleId: string, lessonId: string, body: string): string {
  return `${moduleId}/${lessonId}/en:${sha256Hex16(body)}`;
}

/** Generic `step.cultureNote`. */
export function cultureNoteAnchor(moduleId: string, lessonId: string, cultureNote: string): string {
  return `${moduleId}/${lessonId}/en:${sha256Hex16(cultureNote)}`;
}

/** Generic `step.title`. */
export function titleAnchor(moduleId: string, lessonId: string, title: string): string {
  return `${moduleId}/${lessonId}/en:${sha256Hex16(title)}`;
}

/** MCQ-family `options[].text`. */
export function optionAnchor(moduleId: string, lessonId: string, optionText: string): string {
  return `${moduleId}/${lessonId}/en:${sha256Hex16(optionText)}`;
}

/** `match_pairs` meaning-grid `pair.target`. Romaji/kana-grid targets are
 *  never extracted (the extractor's `isGlossText` guard drops them at
 *  catalog-build time), so calling this for a romaji-mode pair is safe —
 *  the lookup just finds no catalog entry and falls back to the original
 *  text, same as today. */
export function pairTargetAnchor(moduleId: string, lessonId: string, target: string): string {
  return `${moduleId}/${lessonId}/en:${sha256Hex16(target)}`;
}

/** `grammar_rule` step's `rule` prose. `gp` is `step.grammarPointId ??
 *  \`step:${stepId}\`` — pass whichever the step actually has. */
export function grammarRuleAnchor(moduleId: string, gp: string): string {
  return `${moduleId}/gp:${gp}/rule`;
}

/** `grammar_rule` `examples[].en` / `antiPattern.en` — both keyed the same
 *  way by the extractor (the anti-pattern is just another example-shaped
 *  entry), keyed on the JA surface (`ex.ja` / `antiPattern.ja`). */
export function grammarExampleAnchor(moduleId: string, gp: string, ja: string): string {
  return `${moduleId}/gp:${gp}/ex:${ja}`;
}

/** `grammar_rule` `antiPattern.why`. */
export function grammarAntipatternWhyAnchor(moduleId: string, gp: string): string {
  return `${moduleId}/gp:${gp}/antipattern-why`;
}

/** Atom `meaningEn` gloss — `m<N>/atom:<kana>/gloss`. */
export function atomGlossAnchor(moduleId: string, kana: string): string {
  return `${moduleId}/atom:${kana}/gloss`;
}

/** Atom `shortGloss`. */
export function atomShortGlossAnchor(moduleId: string, kana: string): string {
  return `${moduleId}/atom:${kana}/shortGloss`;
}

/** `symbol_intro` step's `payload.hint` (kana mnemonic, e.g. "looks like a
 *  wave"). Module-scoped (not lesson-scoped) — the same kana carries the
 *  same mnemonic wherever it's introduced, mirroring the atom-gloss anchor
 *  shape rather than the lesson-scoped `en:`/`ja:` shape. `symbol` is
 *  `step.payload.symbol` (the kana character itself, e.g. "あ"). */
export function symbolIntroHintAnchor(moduleId: string, symbol: string): string {
  return `${moduleId}/symbolIntro:${symbol}/hint`;
}

// ── Story mode (rung 1b, 2026-09-10) ───────────────────────────────────────
// `Story` (src/features/practice/content/types.ts) is a SEPARATE content
// pipeline from compiled `LessonContent` — no lesson id, so these key on
// `story.id` instead. Mirror `scripts/i18n/extract-content-catalog.mjs`'s
// "── 3. Story content for this module ──" section EXACTLY, field-by-field.
// `story.id` (e.g. "ja-m3-about-me") also happens to satisfy
// `courseIdsFromLessonId`'s `<languageId>-m<N>-...` regex directly, so
// callers can recover `{languageId, moduleId}` from it the same way step
// views do from a lesson id.

/** `Story.title`. */
export function storyTitleAnchor(moduleId: string, storyId: string, title: string): string {
  return `${moduleId}/story:${storyId}/en:${sha256Hex16(title)}`;
}

/** `Story.theme` — the one-line synopsis under the title. No JA sentence to
 *  key off (unlike a sentence gloss), so always en-hash-keyed. */
export function storyThemeAnchor(moduleId: string, storyId: string, theme: string): string {
  return `${moduleId}/story:${storyId}/en:${sha256Hex16(theme)}`;
}

/** `StorySentence.translation`, keyed on the JA sentence's own `text`
 *  (mirrors every other JA-sentence gloss anchor in this file — register
 *  mirrors the JA line at review time, same rule). */
export function storySentenceAnchor(moduleId: string, storyId: string, jaText: string): string {
  return `${moduleId}/story:${storyId}/ja:${jaText}`;
}

/** `StoryGloss.meaning`, keyed on the JA `surface` being glossed. Distinct
 *  from `atomGlossAnchor` — story glosses are story-authored, not sourced
 *  from the `JA_COURSE_ATOMS` registry. */
export function storyGlossAnchor(moduleId: string, storyId: string, surface: string): string {
  return `${moduleId}/story:${storyId}/gloss:${surface}`;
}
