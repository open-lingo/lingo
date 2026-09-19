/**
 * `npm run content:emit` — writes the lesson curriculum as JSON to
 * `src/pub/content/v1/` (gitignored; regenerated before every dev/build).
 *
 * Lives under the vitest `curriculum` project on purpose: that runtime has
 * the `@/` aliases, the eager lesson registry (`virtual:lesson-registry-
 * bootstrap`) and the preloaded TTS manifests — everything the curriculum
 * needs to evaluate — and the repo has no other TS runner installed. Without
 * `CONTENT_EMIT=1` the file is a no-op skip, so ordinary test runs never
 * touch disk.
 *
 * Output (content-as-data, 2026-09-13; see lesson/data/contentLoader.ts):
 *   content/v1/manifest.json                 — unhashed; lists every file
 *   content/v1/<lang>/<moduleId>.<hash>.json — { lessons: LessonContent[] }
 *   content/v1/<lang>/_extra.<hash>.json     — lessons in no course-map module
 *   content/v1/<lang>/index.<hash>.json      — ModuleIndex[]: per-module
 *                                               lesson counts + vocab samples
 *                                               (the course map's small read)
 *   content/v1/ja/mined.<hash>.json          — precomputed sentence-miner index
 * Files are content-hashed so the service worker can cache them forever and
 * a regenerated module changes name; stale files are deleted on each run.
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync, existsSync, statSync, readFileSync, renameSync, rmdirSync } from "node:fs";
import path from "node:path";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { buildSpanishCourse } from "@/features/languages/es/curriculum";
import { buildFrenchCourse } from "@/features/languages/fr/curriculum";
import { projectTaughtVocab } from "@/features/languages/ja/curriculum/taughtVocabProjection";
import { buildEsAtomsAggregate } from "@/features/languages/es/curriculum/atomsAggregate.eager";
import { buildFrAtomsAggregate } from "@/features/languages/fr/curriculum/atomsAggregate.eager";
import { buildEsPlacementAggregate } from "@/features/languages/es/curriculum/placementAggregate.eager";
import { buildFrPlacementAggregate } from "@/features/languages/fr/curriculum/placementAggregate.eager";
import { getRegisteredLesson, getRegisteredLessons } from "@/features/lesson/data/lessonRegistry";
import { computeMinedSentenceIndexes } from "@/features/lesson/data/minedSentences";
import type { ContentManifest, ContentLanguageEntry } from "@/features/lesson/data/contentLoader";
import { buildModuleIndexEntry, type ModuleIndex } from "@/features/learn/moduleVocabIndex";
import { buildPortugueseCourse } from "@/features/languages/pt/curriculum";
// Registers every course synchronously (tests get it via the virtual module
// too, but be explicit: this file IS the emitter).
import "@/features/lesson/data/lessonRegistry.eager";

// `pt` (2026-09-18, lane PTFIX; lessons wired into the registry 2026-09-18,
// lane PTQA): `pt/curriculum/index.ts`'s own header explains why PT
// deliberately does NOT route through `shared/domain/mockCourse.ts`
// (avoids the registry↔mockCourse import cycle) — so unlike ja/es/fr/ko,
// its module list comes straight from `buildPortugueseCourse()`, not
// `getMockCourse("pt")` (whose generic placeholder branch would fabricate
// fake `m1-l3`/`m2-l1`-style modules that don't correspond to any
// registered pt lesson — see `courseModules` below). m1 now compiles (6
// lessons, 42 atoms) AND those lessons are registered
// (`lessonRegistry.eager.ts`'s `PORTUGUESE_LESSONS` spread, mirroring
// SPANISH_LESSONS/FRENCH_LESSONS) — so pt now writes a real
// `pt/m1.<hash>.json` module file same as every other language, and
// contributes to the manifest `version` hash same as every other
// language (see the version-hash comment below).
const LANGS = ["ja", "es", "fr", "ko", "pt"] as const;
type Lang = (typeof LANGS)[number];

function courseModules(lang: Lang) {
  if (lang === "pt") return buildPortugueseCourse();
  return getMockCourse(lang).modules;
}
const OUT = path.resolve(process.cwd(), "src/pub/content/v1");
// Concurrency (2026-09-17): Playwright starts THREE dev servers at once and
// each `npm run dev` runs `predev` = this emitter, so three processes used to
// rm+rewrite `OUT` at the same moment. On the Linux CI runner one server's
// Vite public-file scan ran while another's emit had just deleted the tree,
// so `/content/v1/manifest.json` fell through to the SPA shell and every
// lesson route showed "This lesson could not be loaded" (ci run 35276428181,
// Playwright trace). Three rules now: (1) one writer at a time — a mkdir
// lock; (2) nothing is written when the tree on disk already matches the
// manifest we would produce (`version` + every file present), so the
// predev emits that follow an explicit `content:emit` are no-ops; (3) the
// write is staged in a sibling tmp dir and swapped in with two renames, so
// a reader never sees a half-written tree.
const LOCK = path.resolve(process.cwd(), "src/pub/content/.emit.lock");
const TMP = OUT + ".tmp";
const LOCK_STALE_MS = 10 * 60_000;
const LOCK_WAIT_MS = 180_000;

function acquireLock(): void {
  mkdirSync(path.dirname(LOCK), { recursive: true }); // src/pub/content may not exist yet
  const start = Date.now();
  for (;;) {
    try {
      mkdirSync(LOCK, { recursive: false });
      return;
    } catch (e) {
      if ((e as { code?: string }).code !== "EEXIST") throw e;
      let age = 0;
      try {
        age = Date.now() - statSync(LOCK).mtimeMs;
      } catch {
        continue; // released between EEXIST and stat — retry immediately
      }
      if (age > LOCK_STALE_MS) {
        try {
          rmdirSync(LOCK);
        } catch {
          /* another waiter removed it first */
        }
        continue;
      }
      if (Date.now() - start > LOCK_WAIT_MS) {
        throw new Error(`content:emit — lock ${LOCK} held for over ${LOCK_WAIT_MS / 1000}s`);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

function releaseLock(): void {
  try {
    rmdirSync(LOCK);
  } catch {
    /* already gone */
  }
}

/** True when `OUT` already holds exactly this manifest's files (same
 *  content-hashed names) — then rewriting would only create a window in
 *  which a concurrent dev server sees no content at all. */
function treeMatches(version: string, files: Map<string, string>): boolean {
  const manifestPath = path.join(OUT, "manifest.json");
  if (!existsSync(manifestPath)) return false;
  let existing: { version?: string } | null = null;
  try {
    existing = JSON.parse(readFileSync(manifestPath, "utf8")) as { version?: string };
  } catch {
    return false;
  }
  if (existing?.version !== version) return false;
  for (const [file, json] of files) {
    const abs = path.join(OUT, file);
    try {
      if (statSync(abs).size !== Buffer.byteLength(json)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

const hash10 = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 10);

function moduleLessonIds(mod: unknown): string[] {
  const m = mod as { lessons?: { id: string }[]; lessonGroups?: { lessons?: { id: string }[] }[] };
  const ids: string[] = [];
  for (const l of m.lessons ?? []) ids.push(l.id);
  for (const g of m.lessonGroups ?? []) for (const l of g.lessons ?? []) ids.push(l.id);
  return ids;
}

describe.skipIf(!process.env.CONTENT_EMIT)("content:emit", () => {
  it("writes per-module lesson JSON + manifest", () => {
    acquireLock();
    try {
      emit();
    } finally {
      releaseLock();
    }
  }, 240_000);

  function emit(): void {
    mkdirSync(path.dirname(OUT), { recursive: true });

    const claimed = new Set<string>();
    const languages: Record<string, ContentLanguageEntry> = {};
    const lines: string[] = [];
    let total = 0;
    // Buffered: nothing touches `OUT` until every file is computed (see the
    // concurrency note at the top of this file).
    const pending = new Map<string, string>();

    const write = (rel: string, obj: unknown): { file: string; bytes: number } => {
      const json = JSON.stringify(obj);
      const h = hash10(json);
      const file = rel.replace(/\.json$/, `.${h}.json`);
      pending.set(file, json);
      total += json.length;
      return { file, bytes: json.length };
    };

    for (const lang of LANGS) {
      const modules = courseModules(lang);
      const entry: ContentLanguageEntry = { modules: [] };
      let langBytes = 0;
      for (const mod of modules) {
        const ids = moduleLessonIds(mod).filter((id) => getRegisteredLesson(id));
        if (ids.length === 0) continue;
        const lessons = ids.map((id) => getRegisteredLesson(id)!);
        ids.forEach((id) => claimed.add(id));
        const { file, bytes } = write(`${lang}/${mod.id}.json`, { lessons });
        langBytes += bytes;
        entry.modules.push({ id: mod.id, file, lessons: ids });
      }
      // Per-module lesson-count + vocab index (course map, 2026-09-13):
      // one entry per module regardless of registration state (lesson
      // counts read the course model, not the registry) — the count must
      // equal the course's module count or the map would silently drop a
      // node's index entry.
      const moduleIndex: ModuleIndex[] = modules.map((mod) =>
        buildModuleIndexEntry(mod, lang),
      );
      expect(
        moduleIndex.length,
        `${lang}: index entry count must equal module count`,
      ).toBe(modules.length);
      const { file: indexFile, bytes: indexBytes } = write(`${lang}/index.json`, moduleIndex);
      langBytes += indexBytes;
      entry.index = indexFile;
      lines.push(`  ${lang} module index: ${moduleIndex.length} entries, ${(indexBytes / 1024).toFixed(1)} KB`);

      const extra = getRegisteredLessons().filter(
        (l) => !claimed.has(l.id) && (l.languageId === lang || (!l.languageId && l.id.startsWith(lang + "-"))),
      );
      if (extra.length > 0) {
        const { file, bytes } = write(`${lang}/_extra.json`, { lessons: extra });
        langBytes += bytes;
        entry.extra = { file, lessons: extra.map((l) => l.id) };
        extra.forEach((l) => claimed.add(l.id));
      }
      if (lang === "ja") {
        const mined = computeMinedSentenceIndexes();
        const { file, bytes } = write(`ja/mined.json`, mined);
        langBytes += bytes;
        entry.mined = file;
        lines.push(`  ja mined index: ${mined.any.length} any / ${mined.translated.length} translated, ${(bytes / 1024).toFixed(0)} KB`);
      }
      languages[lang] = entry;
      lines.push(`  ${lang}: ${entry.modules.length} modules, ${entry.modules.reduce((n, m) => n + m.lessons.length, 0) + (entry.extra?.lessons.length ?? 0)} lessons, ${(langBytes / 1024).toFixed(0)} KB`);
    }

    // Course STRUCTURE for ES/FR (ids/titles/accents — no lesson bodies) is
    // committed next to the curriculum so `mockCourse.ts` can build the
    // pathway without importing every module's TS (which put ~4 MB of
    // Spanish+French lesson code in the main bundle for every user).
    // `structure.test.ts` in each curriculum fails when this is stale.
    for (const [lang, build] of [["es", buildSpanishCourse], ["fr", buildFrenchCourse]] as const) {
      const abs = path.resolve(process.cwd(), `src/features/languages/${lang}/curriculum/structure.generated.json`);
      writeFileSync(abs, JSON.stringify(build(), null, 2) + "\n");
      lines.push(`  ${lang} structure → ${path.relative(process.cwd(), abs)}`);
    }

    // JA taught-vocab projection (priorVocab + newAtoms.kana per IR module).
    {
      const abs = path.resolve(process.cwd(), "src/features/languages/ja/curriculum/taughtVocab.generated.json");
      writeFileSync(abs, JSON.stringify(projectTaughtVocab(path.resolve(process.cwd(), "src/features/languages/ja/curriculum/ir"))));
      lines.push(`  ja taughtVocab → ${path.relative(process.cwd(), abs)}`);
    }

    // ES atom aggregate (module order), read by es/courseAtoms.ts at runtime.
    {
      const abs = path.resolve(process.cwd(), "src/features/languages/es/curriculum/atoms.generated.json");
      writeFileSync(abs, JSON.stringify(buildEsAtomsAggregate()));
      lines.push(`  es atoms → ${path.relative(process.cwd(), abs)}`);
    }

    // FR atom aggregate (module order), read by fr/courseAtoms.ts at runtime.
    {
      const abs = path.resolve(process.cwd(), "src/features/languages/fr/curriculum/atoms.generated.json");
      writeFileSync(abs, JSON.stringify(buildFrAtomsAggregate()));
      lines.push(`  fr atoms → ${path.relative(process.cwd(), abs)}`);
    }

    // ES/FR placement banks (screener + per-module pool, steps materialized),
    // read by es/placementBank.ts + fr/placementBank.ts at runtime.
    {
      const abs = path.resolve(process.cwd(), "src/features/languages/es/curriculum/placement.generated.json");
      writeFileSync(abs, JSON.stringify(buildEsPlacementAggregate()));
      lines.push(`  es placement → ${path.relative(process.cwd(), abs)}`);
    }
    {
      const abs = path.resolve(process.cwd(), "src/features/languages/fr/curriculum/placement.generated.json");
      writeFileSync(abs, JSON.stringify(buildFrPlacementAggregate()));
      lines.push(`  fr placement → ${path.relative(process.cwd(), abs)}`);
    }

    const orphans = getRegisteredLessons().filter((l) => !claimed.has(l.id)).map((l) => l.id);
    expect(orphans, "every registered lesson must land in some file").toEqual([]);

    // pt (2026-09-18, lane PTFIX; lessons wired 2026-09-18 lane PTQA): must
    // be present, and its module index must come from
    // `buildPortugueseCourse()` (real), never `getMockCourse("pt")`'s
    // generic placeholder branch, which would fabricate three fake modules
    // (m1/m2/m3, "Colors" / "Please and thank you" / ...) that correspond
    // to no registered pt lesson — wrong data written to disk, not an
    // obvious throw.
    expect(languages.pt, "pt must be included in content:emit").toBeDefined();
    const ptIndexFile = languages.pt?.index;
    expect(ptIndexFile, "pt must emit an index.json").toBeDefined();
    // m1 compiles (6 lessons, 42 atoms) — the index lists real registered
    // pt lessons and never the mock placeholder modules.
    const ptIndex = JSON.parse(pending.get(ptIndexFile!)!) as Array<{ id?: string; moduleId?: string }>;
    expect(ptIndex.length, "pt index lists the compiled m1 lessons").toBeGreaterThan(0);
    for (const entry of ptIndex) expect(JSON.stringify(entry)).not.toMatch(/Colors|Please and thank you/);

    // pt's m1 lessons must actually be registered (`lessonRegistry.eager.ts`)
    // so this loop writes a real `pt/m1.<hash>.json` module file — an index
    // entry alone is not enough; the content loader reads the module file,
    // not the index (PTQA lane, 2026-09-18: caught this exact gap — the
    // index listed 6 lessons while pt's module array stayed empty because
    // PT_ALL_LESSONS was never spread into the eager registry).
    const ptModuleEntry = languages.pt?.modules.find((m) => m.id === "m1");
    expect(ptModuleEntry, "pt must write a pt/m1.<hash>.json module file").toBeDefined();
    expect(ptModuleEntry?.lessons.length, "pt m1 module file lists 6 lessons").toBe(6);
    expect(pending.has(ptModuleEntry!.file), "pt m1 module file must actually be staged").toBe(true);

    // The manifest `version` hash folds in every language that contributes
    // a module/extra/mined file. pt now legitimately contributes (m1's
    // module file above), so `version` DOES change from a pre-pt baseline
    // — that is correct, not a regression (ja/es/fr/ko's own per-language
    // module files/lesson lists are untouched; only the joined hash input
    // gains pt's file name). A language that contributes NOTHING is still
    // left out of the hash input entirely, not appended as empty strings.
    const version = hash10(
      Object.entries(languages)
        .flatMap(([, e]) =>
          e.modules.length === 0 && !e.extra && !e.mined
            ? []
            : [...e.modules.map((m) => m.file), e.extra?.file ?? "", e.mined ?? ""],
        )
        .join("\n"),
    );
    if (treeMatches(version, pending)) {
      console.log(`content:emit → ${OUT} unchanged (version ${version}, ${pending.size} files already on disk) — nothing written`);
      expect(statSync(path.join(OUT, "manifest.json")).size).toBeGreaterThan(100);
      return;
    }

    const manifest: ContentManifest = {
      schema: 1,
      version,
      generatedAt: new Date().toISOString(),
      languages,
    };
    // Stage in a sibling dir, then swap: readers see the old complete tree
    // or the new complete tree, never a half-written one.
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
    for (const [file, json] of pending) {
      const abs = path.join(TMP, file);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, json);
    }
    writeFileSync(path.join(TMP, "manifest.json"), JSON.stringify(manifest));
    const OLD = OUT + ".old";
    rmSync(OLD, { recursive: true, force: true });
    if (existsSync(OUT)) renameSync(OUT, OLD);
    renameSync(TMP, OUT);
    rmSync(OLD, { recursive: true, force: true });

    const files = readdirSync(OUT, { recursive: true }).filter((f) => String(f).endsWith(".json"));
    console.log(
      [`content:emit → ${OUT}`, ...lines, `  ${files.length} files, ${(total / 1024 / 1024).toFixed(1)} MB, version ${version}`].join("\n"),
    );
    expect(statSync(path.join(OUT, "manifest.json")).size).toBeGreaterThan(100);
  }
});
