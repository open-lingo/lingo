// content-search.mjs — search the EMITTED runtime content
// (src/pub/content/v1/, see docs/content-ships-in-the-binary.md), not the
// IR/YAML source. Emitted content is what the app actually serves, and its
// `steps` arrays are the only place step numbering is reliably 0-indexed and
// matches the dev `?step=N` URL — the IR/YAML source does not map 1:1 (review
// lessons carry a dynamic prefix; see the codebase-search skill §2).
// Shared by find.mjs (--lang) and step-url.mjs so both give the same answer.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// LANE_CONTENT_ROOT overrides for tests (fixtures); real runs use the repo's
// emitted content relative to cwd.
function contentRoot() {
  return process.env.LANE_CONTENT_ROOT || path.resolve(process.cwd(), "src/pub/content/v1");
}

export function contentAvailable() {
  return existsSync(path.join(contentRoot(), "manifest.json"));
}

export function loadManifest() {
  return JSON.parse(readFileSync(path.join(contentRoot(), "manifest.json"), "utf8"));
}

export function langModules(lang) {
  const manifest = loadManifest();
  const entry = manifest.languages?.[lang];
  if (!entry) {
    const have = Object.keys(manifest.languages || {}).join(", ");
    throw new Error(`manifest has no language "${lang}" (have: ${have})`);
  }
  return entry.modules;
}

function loadModule(mod) {
  return JSON.parse(readFileSync(path.join(contentRoot(), mod.file), "utf8"));
}

/** Every lesson id known to `lang`, across all modules. */
export function allLessonIds(lang) {
  const ids = [];
  for (const mod of langModules(lang)) {
    for (const lesson of loadModule(mod).lessons ?? []) ids.push(lesson.id);
  }
  return ids;
}

/**
 * Every step (across every lesson, every module) of `lang` whose JSON
 * stringification contains `text` as a literal substring — this covers
 * sentences, glosses and ids without needing to know the step-type shape.
 * Returns [{ lessonId, moduleId, stepIndex, stepType }], stepIndex 0-based.
 */
const squash = (s) => s.replace(/[\s\u3000]+/g, "");

export function findInContent(lang, text) {
  const hits = [];
  for (const mod of langModules(lang)) {
    const json = loadModule(mod);
    for (const lesson of json.lessons ?? []) {
      lesson.steps.forEach((step, i) => {
        // Whitespace-insensitive: screenshots and IR spell "あつい コーヒーを" with
        // display spaces that a typed query usually drops.
        if (squash(JSON.stringify(step)).includes(squash(text))) {
          hits.push({ lessonId: lesson.id, moduleId: mod.id, stepIndex: i, stepType: step.type });
        }
      });
    }
  }
  return hits;
}

/** All steps of one known lesson id, for enumerating a lesson with no query text. */
export function stepsOfLesson(lang, lessonId) {
  for (const mod of langModules(lang)) {
    const json = loadModule(mod);
    const lesson = json.lessons?.find((l) => l.id === lessonId);
    if (lesson) return lesson.steps.map((s, i) => ({ stepIndex: i, stepType: s.type }));
  }
  return null;
}
