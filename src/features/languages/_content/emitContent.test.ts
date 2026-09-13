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
 *   content/v1/ja/mined.<hash>.json          — precomputed sentence-miner index
 * Files are content-hashed so the service worker can cache them forever and
 * a regenerated module changes name; stale files are deleted on each run.
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { buildSpanishCourse } from "@/features/languages/es/curriculum";
import { buildFrenchCourse } from "@/features/languages/fr/curriculum";
import { projectTaughtVocab } from "@/features/languages/ja/curriculum/taughtVocabProjection";
import { buildEsAtomsAggregate } from "@/features/languages/es/curriculum/atomsAggregate.eager";
import { getRegisteredLesson, getRegisteredLessons } from "@/features/lesson/data/lessonRegistry";
import { computeMinedSentenceIndexes } from "@/features/lesson/data/minedSentences";
import type { ContentManifest, ContentLanguageEntry } from "@/features/lesson/data/contentLoader";
// Registers every course synchronously (tests get it via the virtual module
// too, but be explicit: this file IS the emitter).
import "@/features/lesson/data/lessonRegistry.eager";

const LANGS = ["ja", "es", "fr", "ko"] as const;
const OUT = path.resolve(process.cwd(), "src/pub/content/v1");

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
    // Clean slate: every run rewrites the whole tree so no stale hash survives.
    if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });

    const claimed = new Set<string>();
    const languages: Record<string, ContentLanguageEntry> = {};
    const lines: string[] = [];
    let total = 0;

    const write = (rel: string, obj: unknown): { file: string; bytes: number } => {
      const json = JSON.stringify(obj);
      const h = hash10(json);
      const file = rel.replace(/\.json$/, `.${h}.json`);
      const abs = path.join(OUT, file);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, json);
      total += json.length;
      return { file, bytes: json.length };
    };

    for (const lang of LANGS) {
      const course = getMockCourse(lang);
      const entry: ContentLanguageEntry = { modules: [] };
      let langBytes = 0;
      for (const mod of course.modules) {
        const ids = moduleLessonIds(mod).filter((id) => getRegisteredLesson(id));
        if (ids.length === 0) continue;
        const lessons = ids.map((id) => getRegisteredLesson(id)!);
        ids.forEach((id) => claimed.add(id));
        const { file, bytes } = write(`${lang}/${mod.id}.json`, { lessons });
        langBytes += bytes;
        entry.modules.push({ id: mod.id, file, lessons: ids });
      }
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

    const orphans = getRegisteredLessons().filter((l) => !claimed.has(l.id)).map((l) => l.id);
    expect(orphans, "every registered lesson must land in some file").toEqual([]);

    const version = hash10(
      Object.values(languages)
        .flatMap((e) => [...e.modules.map((m) => m.file), e.extra?.file ?? "", e.mined ?? ""])
        .join("\n"),
    );
    const manifest: ContentManifest = {
      schema: 1,
      version,
      generatedAt: new Date().toISOString(),
      languages,
    };
    writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
    const files = readdirSync(OUT, { recursive: true }).filter((f) => String(f).endsWith(".json"));
    console.log(
      [`content:emit → ${OUT}`, ...lines, `  ${files.length} files, ${(total / 1024 / 1024).toFixed(1)} MB, version ${version}`].join("\n"),
    );
    expect(statSync(path.join(OUT, "manifest.json")).size).toBeGreaterThan(100);
  });
});
