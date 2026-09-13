import type { LessonContent } from "../types";
import { hasRegisteredLesson, registerLessons } from "./lessonRegistry";
import { setMinedSentenceIndexes, type MinedSentenceIndexes } from "./minedSentences";

/**
 * Lesson content as data (2026-09-13).
 *
 * `scripts`-side: `npm run content:emit` evaluates the curriculum once (the
 * Japanese IR through `compileModule`, the Spanish/French factories, the
 * Korean tables — exactly what the browser used to do on every open) and
 * writes one JSON file per module plus a manifest to `src/pub/content/v1/`.
 * Vite's publicDir ships them next to the bundle: on the web behind
 * CloudFront + the service worker (hashed names → CacheFirst, immutable), on
 * iOS/Android inside the app bundle itself (capacitor://localhost/content/…
 * is a local file read; nothing goes over the network).
 *
 * Browser-side, this module is the only writer of the lesson registry. The
 * shape of a load is always "the module the learner is entering plus every
 * earlier module of that course": review tails, grammar pools and the
 * dynamic review prefix mine earlier lessons, so a module is only complete
 * with its predecessors. JSON.parse of a whole course is ~50–100 ms on a
 * phone (JA is 6.6 MB across 46 files); the old path was 3.3 s of
 * `compileModule` for the same data, and ran before Home could paint.
 *
 * Every `ensure*` is idempotent and memoised per file; concurrent callers
 * share one fetch. Failures reject (and are NOT memoised, so a retry can
 * succeed) — callers on a page decide what to show.
 */

export type ContentModuleEntry = {
  id: string;
  file: string;
  lessons: string[];
};

export type ContentLanguageEntry = {
  modules: ContentModuleEntry[];
  /** Lessons of this language that belong to no course-map module. */
  extra?: { file: string; lessons: string[] };
  /** Precomputed sentence-miner index (Japanese only today). */
  mined?: string;
};

export type ContentManifest = {
  schema: 1;
  version: string;
  generatedAt: string;
  languages: Record<string, ContentLanguageEntry>;
};

type ModuleFile = { lessons: LessonContent[] };

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");
export const CONTENT_ROOT = `${BASE}/content/v1`;

export function contentUrl(relative: string): string {
  return `${CONTENT_ROOT}/${relative}`;
}

async function fetchJson<T>(relative: string): Promise<T> {
  const url = contentUrl(relative);
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`content fetch ${res.status} ${url}`);
  const type = res.headers.get("content-type") ?? "";
  // The CDN maps 403/404 → the SPA shell with a 200 (see vite.config.ts,
  // tts-clips). Never parse HTML as a module.
  if (type.includes("text/html")) throw new Error(`content fetch got HTML ${url}`);
  return (await res.json()) as T;
}

let manifestPromise: Promise<ContentManifest> | null = null;
let manifest: ContentManifest | null = null;
let lessonIndex: Map<string, { lang: string; moduleIndex: number; file: string }> | null = null;

export function getLoadedContentManifest(): ContentManifest | null {
  return manifest;
}

export function loadContentManifest(): Promise<ContentManifest> {
  if (!manifestPromise) {
    manifestPromise = fetchJson<ContentManifest>("manifest.json")
      .then((m) => {
        manifest = m;
        lessonIndex = new Map();
        for (const [lang, entry] of Object.entries(m.languages)) {
          entry.modules.forEach((mod, moduleIndex) => {
            for (const id of mod.lessons) lessonIndex!.set(id, { lang, moduleIndex, file: mod.file });
          });
          if (entry.extra) {
            for (const id of entry.extra.lessons) {
              lessonIndex!.set(id, { lang, moduleIndex: -1, file: entry.extra.file });
            }
          }
        }
        return m;
      })
      .catch((e) => {
        manifestPromise = null;
        throw e;
      });
  }
  return manifestPromise;
}

const filePromises = new Map<string, Promise<void>>();
const loadedFiles = new Set<string>();

function ensureFileLoaded(file: string): Promise<void> {
  if (loadedFiles.has(file)) return Promise.resolve();
  let p = filePromises.get(file);
  if (!p) {
    p = fetchJson<ModuleFile>(file)
      .then((data) => {
        registerLessons(data.lessons ?? []);
        loadedFiles.add(file);
      })
      .catch((e) => {
        filePromises.delete(file);
        throw e;
      });
    filePromises.set(file, p);
  }
  return p;
}

export function isContentFileLoaded(file: string): boolean {
  return loadedFiles.has(file);
}

/** Load one module's lessons (and nothing else). */
export async function ensureModuleLoaded(lang: string, moduleId: string): Promise<void> {
  const m = await loadContentManifest();
  const mod = m.languages[lang]?.modules.find((x) => x.id === moduleId);
  if (!mod) return;
  await ensureFileLoaded(mod.file);
}

/**
 * Load a course up to and including `upToModuleId` (all of it when
 * omitted), plus the language's extra lessons. Files load in parallel.
 */
export async function ensureCourseLoaded(lang: string, upToModuleId?: string): Promise<void> {
  const m = await loadContentManifest();
  const entry = m.languages[lang];
  if (!entry) return;
  let mods = entry.modules;
  if (upToModuleId) {
    const idx = mods.findIndex((x) => x.id === upToModuleId);
    if (idx >= 0) mods = mods.slice(0, idx + 1);
  }
  const files = mods.map((x) => x.file);
  if (entry.extra) files.push(entry.extra.file);
  await Promise.all(files.map(ensureFileLoaded));
}

/**
 * Make `getMockLessonContent(lessonId)` answerable: the lesson's module and
 * every earlier module of its course. Resolves immediately when the lesson
 * is already registered (eager runtime, or a second visit).
 */
export async function ensureLessonLoaded(lessonId: string): Promise<void> {
  if (hasRegisteredLesson(lessonId) && loadedFiles.size === 0) return; // eager runtime
  const m = await loadContentManifest();
  const loc = lessonIndex?.get(lessonId);
  if (!loc) return; // unknown id: the caller's null-lesson path handles it
  const entry = m.languages[loc.lang];
  if (!entry) return;
  if (loc.moduleIndex < 0) {
    await ensureFileLoaded(loc.file);
    return;
  }
  await ensureCourseLoaded(loc.lang, entry.modules[loc.moduleIndex].id);
}

/** Everything, every language — admin/dev surfaces that enumerate the world. */
export async function ensureAllContentLoaded(): Promise<void> {
  const m = await loadContentManifest();
  await Promise.all(Object.keys(m.languages).map((lang) => ensureCourseLoaded(lang)));
}

const minedPromises = new Map<string, Promise<void>>();

/** The precomputed sentence-miner index for a language (JA today). */
export function ensureMinedSentencesLoaded(lang: string): Promise<void> {
  let p = minedPromises.get(lang);
  if (!p) {
    p = loadContentManifest()
      .then(async (m) => {
        const file = m.languages[lang]?.mined;
        if (!file) return;
        const data = await fetchJson<MinedSentenceIndexes>(file);
        setMinedSentenceIndexes(data);
      })
      .catch((e) => {
        minedPromises.delete(lang);
        throw e;
      });
    minedPromises.set(lang, p);
  }
  return p;
}

/** Test-only reset. */
export function __resetContentLoader(): void {
  manifestPromise = null;
  manifest = null;
  lessonIndex = null;
  filePromises.clear();
  loadedFiles.clear();
  minedPromises.clear();
}
