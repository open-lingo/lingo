import type { LessonContent } from "../types";
import { bumpContentRevision, hasRegisteredLesson, registerLessons } from "./lessonRegistry";
import { setMinedSentenceIndexes, type MinedSentenceIndexes } from "./minedSentences";
import type { ModuleIndex } from "@/features/learn/moduleVocabIndex";
import {
  loadPackFile,
  prefetchPackFiles,
  getContentPackFetchRaw,
  ContentPackSchemaError,
} from "./contentPackLoader";
import { getPackStore } from "./contentPackCache";

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
  /** Precomputed per-module lesson-count + vocab index (course map). */
  index?: string;
  /**
   * Content packs (2026-09-18, docs/content-packs-2026-09-18.md): modules
   * at 0-based index >= this count were pruned from `dist/content/v1` by
   * `emit-content-packs.mjs` and must be fetched from the CDN pack
   * instead. `undefined` = every module of this language is bundled
   * (the `content.packs` flag was off for this build — today's default).
   */
  packBundledThrough?: number;
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

/**
 * Content packs (2026-09-18): the "downloading course" state a module fetch
 * can be in, surfaced to `useContentDownloadState(lang)` for the inline
 * banner on the course map and lesson open. Keyed per language since only
 * one course's content is realistically in flight at a time, but two
 * languages could both be mid-fetch (course map + a background prefetch of
 * a different course) without colliding. `"unsupported"` = the pack's
 * schemaVersion is newer than this build understands
 * (`ContentPackSchemaError`) — the bundled slice is all this session gets;
 * the caller's copy is "update the app", not "try again".
 */
export type ContentDownloadStatus = "idle" | "loading" | "ready" | "error" | "unsupported";
const contentDownloadStatus = new Map<string, ContentDownloadStatus>();
const contentDownloadListeners = new Map<string, Set<() => void>>();

function setContentDownloadStatus(lang: string, next: ContentDownloadStatus): void {
  if (contentDownloadStatus.get(lang) === next) return;
  contentDownloadStatus.set(lang, next);
  contentDownloadListeners.get(lang)?.forEach((listener) => listener());
}

export function getContentDownloadStatus(lang: string): ContentDownloadStatus {
  return contentDownloadStatus.get(lang) ?? "idle";
}

export function subscribeContentDownloadStatus(lang: string, listener: () => void): () => void {
  let set = contentDownloadListeners.get(lang);
  if (!set) {
    set = new Set();
    contentDownloadListeners.set(lang, set);
  }
  set.add(listener);
  return () => set!.delete(listener);
}

/**
 * Resolves one module file's bytes: (a) memory is `ensureFileLoaded`'s own
 * `loadedFiles`/`filePromises` memoization (checked by the caller before
 * this ever runs), (b) the bundled slice — a same-origin/local `fetch`
 * that succeeds whenever `content.packs` was off for this build, or the
 * module is within `entry.packBundledThrough`, (c)/(d) the persistent
 * Cache-Storage-backed pack store, then the CDN network — reached ONLY
 * when (b) fails AND `packCtx` says this module is genuinely pack-eligible
 * (never for `extra`/`mined`/`index` files, which pass no `packCtx` and so
 * always stay strictly bundled-or-bust). A module inside the bundled slice
 * can never be served from a pack — there is structurally nothing at that
 * pack URL to fetch (`emit-content-packs.mjs` never writes modules 1–3
 * under any `/content/v2/` prefix) — which is what makes "a pack older
 * than the bundle is never applied over a newer bundled module" true by
 * construction rather than by a runtime version check.
 */
async function loadModuleFile(
  file: string,
  packCtx?: { lang: string; moduleIndex: number },
): Promise<ModuleFile> {
  try {
    return await fetchJson<ModuleFile>(file); // (b) bundled slice
  } catch (localErr) {
    if (!packCtx) throw localErr;
    const { lang, moduleIndex } = packCtx;
    const bundledThrough = manifest?.languages[lang]?.packBundledThrough;
    if (bundledThrough === undefined || moduleIndex < bundledThrough) throw localErr;
    const contentVersion = manifest!.version;
    const filename = file.split("/").pop()!;
    setContentDownloadStatus(lang, "loading");
    try {
      const fetchRaw = await getContentPackFetchRaw();
      const data = await loadPackFile<ModuleFile>({
        // (c) persistent cache, (d) network — both inside loadPackFile
        lang,
        contentVersion,
        filename,
        fetchRaw,
        store: getPackStore(),
      });
      setContentDownloadStatus(lang, "ready");
      return data;
    } catch (packErr) {
      setContentDownloadStatus(lang, packErr instanceof ContentPackSchemaError ? "unsupported" : "error");
      throw packErr; // nothing local exists — the caller's own offline/error state is correct
    }
  }
}

function ensureFileLoaded(
  file: string,
  packCtx?: { lang: string; moduleIndex: number },
): Promise<void> {
  if (loadedFiles.has(file)) return Promise.resolve();
  let p = filePromises.get(file);
  if (!p) {
    p = loadModuleFile(file, packCtx)
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
  const entry = m.languages[lang];
  const moduleIndex = entry?.modules.findIndex((x) => x.id === moduleId) ?? -1;
  if (!entry || moduleIndex < 0) return;
  await ensureFileLoaded(entry.modules[moduleIndex].file, { lang, moduleIndex });
}

/**
 * Load a course up to and including `upToModuleId` (all of it when
 * omitted), plus the language's extra lessons. Files load in parallel.
 *
 * `moduleIndex` passed to each `ensureFileLoaded` is always the module's
 * position in the FULL `entry.modules` array (not the sliced `mods`) — safe
 * here because slicing always starts at 0, so index-within-slice equals
 * index-within-full-array for every element that survives the slice.
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
  const loads = mods.map((mod, moduleIndex) => ensureFileLoaded(mod.file, { lang, moduleIndex }));
  if (entry.extra) loads.push(ensureFileLoaded(entry.extra.file));
  await Promise.all(loads);
}

const coursePackPrefetchStarted = new Set<string>();

/**
 * Fire-and-forget: warms the persistent pack cache with every pack-eligible
 * module of a course once the learner opens it — Spencer's decision,
 * 2026-09-18: "everything else is fetched on first open of that course,
 * cached". No-ops (never constructs a request) when the manifest hasn't
 * loaded yet and doesn't resolve into a pack-eligible course, `content.packs`
 * was off for this build (`packBundledThrough` undefined), the course has
 * no modules beyond the bundled slice, or a prefetch already started this
 * session for this language (memoized like `dictPrefetch.ts`'s
 * `triggerDictPrefetch` — marked started BEFORE the async work, so
 * concurrent calls from re-renders can't race into duplicate fetch storms).
 *
 * NOT Wi-Fi gated: `@capacitor/network` is not a current dependency of this
 * app (checked directly, `package.json`'s `@capacitor/*` list has no
 * `network` — same finding `dictPrefetch.ts` documented for the dictionary
 * prefetch, 2026-09-18) and the Network Information API
 * (`navigator.connection`) that could substitute is WebKit/iOS-absent, so
 * it would only ever gate Android. Left ungated: each course's remaining
 * pack payload is fetched once (persistent cache), and the "Downloading
 * course…" banner covers the case a learner opens a lesson before it lands.
 */
export function triggerCoursePackPrefetch(lang: string): void {
  if (coursePackPrefetchStarted.has(lang)) return;
  coursePackPrefetchStarted.add(lang);
  void (async () => {
    try {
      const m = await loadContentManifest();
      const entry = m.languages[lang];
      const bundledThrough = entry?.packBundledThrough;
      if (!entry || bundledThrough === undefined || bundledThrough >= entry.modules.length) return;
      const fetchRaw = await getContentPackFetchRaw();
      setContentDownloadStatus(lang, "loading");
      const result = await prefetchPackFiles(lang, m.version, fetchRaw, getPackStore());
      setContentDownloadStatus(
        lang,
        result.succeeded.length === 0 && result.failed.length > 0 ? "error" : "ready",
      );
    } catch (e) {
      setContentDownloadStatus(lang, e instanceof ContentPackSchemaError ? "unsupported" : "error");
    }
  })();
}

/** Test-only: reset the once-per-session course-pack-prefetch memoization. */
export function __resetCoursePackPrefetchForTests(): void {
  coursePackPrefetchStarted.clear();
  contentDownloadStatus.clear();
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

const moduleIndexPromises = new Map<string, Promise<void>>();
const loadedModuleIndex = new Map<string, ModuleIndex[]>();

/**
 * The precomputed per-module index for a language (lesson counts + vocab
 * samples) — a few KB versus a whole course's lesson bodies. Consumers
 * (the course map) read it via `getLoadedModuleIndex` once this resolves
 * and fall back to computing from whatever lesson content happens to be
 * registered for modules the index doesn't cover.
 */
export function ensureModuleIndexLoaded(lang: string): Promise<void> {
  let p = moduleIndexPromises.get(lang);
  if (!p) {
    p = loadContentManifest()
      .then(async (m) => {
        const file = m.languages[lang]?.index;
        if (!file) return;
        const data = await fetchJson<ModuleIndex[]>(file);
        loadedModuleIndex.set(lang, data);
        bumpContentRevision();
      })
      .catch((e) => {
        moduleIndexPromises.delete(lang);
        throw e;
      });
    moduleIndexPromises.set(lang, p);
  }
  return p;
}

/** The loaded module index for a language, or null before it lands. */
export function getLoadedModuleIndex(lang: string): ModuleIndex[] | null {
  return loadedModuleIndex.get(lang) ?? null;
}

/** Test-only reset. */
export function __resetContentLoader(): void {
  manifestPromise = null;
  manifest = null;
  lessonIndex = null;
  filePromises.clear();
  loadedFiles.clear();
  minedPromises.clear();
  moduleIndexPromises.clear();
  loadedModuleIndex.clear();
  __resetCoursePackPrefetchForTests();
}
