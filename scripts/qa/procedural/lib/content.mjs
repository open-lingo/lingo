/**
 * Runtime-JSON content loading for the procedural QA runner. Reads the
 * emitted bundle under `src/pub/content/v1/<lang>/` (the same artifact the
 * app fetches at runtime — see `docs/content-ships-in-the-binary.md`), never
 * IR/YAML, per the lane's runner contract.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);
const CONTENT_ROOT = path.join(REPO_ROOT, "src/pub/content/v1");

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

/** The manifest mapping module id -> hashed filename, per language. */
export function loadManifest() {
  return readJson(path.join(CONTENT_ROOT, "manifest.json"));
}

/** Resolve and parse the emitted JSON for `lang`'s `moduleId` (e.g. "m34"). */
export function loadModuleJson(lang, moduleId) {
  const manifest = loadManifest();
  const langEntry = manifest.languages?.[lang];
  if (!langEntry) throw new Error(`manifest has no language "${lang}"`);
  const mod = langEntry.modules.find((m) => m.id === moduleId);
  if (!mod)
    throw new Error(
      `manifest has no module "${moduleId}" for "${lang}" (have: ${langEntry.modules.map((m) => m.id).join(", ")})`,
    );
  const filePath = path.join(CONTENT_ROOT, mod.file);
  const json = readJson(filePath);
  return { file: mod.file, filePath, json };
}

/** Every module id known to the manifest for `lang`, in manifest order. */
export function listModuleIds(lang) {
  const manifest = loadManifest();
  const langEntry = manifest.languages?.[lang];
  if (!langEntry) throw new Error(`manifest has no language "${lang}"`);
  return langEntry.modules.map((m) => m.id);
}

/** Numeric module number from an id like "m34" -> 34; "m3-v2"-style ids are
 *  not used by ja, but guard anyway by taking the leading digits. */
export function moduleNumber(moduleId) {
  const m = /^m(\d+)/.exec(moduleId);
  if (!m) throw new Error(`cannot parse module number from "${moduleId}"`);
  return Number(m[1]);
}

/** Find one lesson by id inside a loaded module JSON ({lessons: [...]}). */
export function findLesson(moduleJson, lessonId) {
  const lesson = moduleJson.lessons.find((l) => l.id === lessonId);
  if (!lesson)
    throw new Error(
      `module has no lesson "${lessonId}" (have: ${moduleJson.lessons.map((l) => l.id).join(", ")})`,
    );
  return lesson;
}

/** All lessons across a module id's languages/modules (used for full-module
 *  or full-course scans). */
export function allLessons(lang, moduleId) {
  const { json } = loadModuleJson(lang, moduleId);
  return json.lessons;
}
