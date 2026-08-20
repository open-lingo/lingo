/**
 * French curriculum assembly — DERIVED, not hand-maintained.
 *
 * ES keeps a literal import list plus a hand-ordered `ES_MODULE_META` array;
 * its own headers record what hand-maintenance costs (m17's atoms shipped
 * unlisted and went unscheduled). The FR pathway is instead derived by
 * globbing `./m*.ts` — the same house pattern as `../placementBank.ts` and
 * `../courseAtoms.ts` — so adding a module file IS adding its map entry.
 * Each curriculum module file exports its metadata + lessons as
 *
 *   export const FR_M<n>_MODULE: FrModuleDef = {
 *     title, eyebrow?, summary?, accent?, lessons: [...],
 *   };
 *
 * The module's id is derived from the FILE NAME (`m3.ts` → `"m3"`), so it
 * cannot drift from the export, and a number/file-name mismatch THROWS —
 * same contract as the atoms and placement collectors.
 *
 * First real module (m1, IR-compiled) landed 2026-08-19; before that the
 * honest state was `[]` — an empty pathway draws no modules and places every
 * learner at the start. (Until 2026-08-19, `getMockCourse("fr")` fell
 * through to the generic placeholder course instead: three fake
 * English-titled modules, eight placeholder lessons, and an
 * `m1-l0-alphabet` trainer node — for a Latin-script language whose own
 * module header says it needs no alphabet trainer.)
 */
import type { CourseModule } from "@/shared/domain/course";
import type { LessonContent } from "@/features/lesson/types";

/** Metadata + lessons for one FR module. The id is NOT a field — it derives
 *  from the file name, so there is nothing to fall out of sync. */
export type FrModuleDef = {
  title: string;
  /** Short eyebrow line shown above the module title in the pathway UI. */
  eyebrow?: string;
  /** Optional subtitle / summary shown in the preview body. */
  summary?: string;
  /** Gradient endpoints for the banner header. */
  accent?: { from: string; to: string };
  /** Hand-authored lesson content; array order IS lesson order (es E11). */
  lessons: LessonContent[];
};

// The negative pattern matters: module TESTS live beside their modules
// (`m1.test.ts`), and an eager glob that swallowed one would import it into
// the collector's module graph — a cycle straight back through mockLessons.
const CURRICULUM_MODULES = import.meta.glob<Record<string, unknown>>(
  ["./m*.ts", "!./m*.test.ts"],
  { eager: true },
);

const MODULE_NO = /\/m(\d+)\.ts$/;
const MODULE_EXPORT = /^FR_M(\d+)_MODULE$/;

/**
 * Pure collector behind `buildFrenchCourse`, exported so its guards can be
 * negative-control tested: authoring a real defective module file would
 * poison the live globs (this one, the atoms glob and the placement glob),
 * so the tests inject a fake record instead.
 */
export function collectFrModules(
  modules: Record<string, Record<string, unknown>>,
): { n: number; def: FrModuleDef }[] {
  const found: { n: number; def: FrModuleDef }[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const fileNo = MODULE_NO.exec(path);
    if (!fileNo) continue;
    let def: FrModuleDef | undefined;
    for (const [exportName, value] of Object.entries(mod)) {
      const m = MODULE_EXPORT.exec(exportName);
      if (!m) continue;
      if (m[1] !== fileNo[1]) {
        // m12.ts exporting FR_M11_MODULE is a copy-paste from the previous
        // module file, and the derived id would mis-attribute everything in
        // it. Same contract as the atoms/placement collectors.
        throw new Error(
          `fr/curriculum: ${path} exports ${exportName} — the module number ` +
            `must match the file name.`,
        );
      }
      const v = value as Partial<FrModuleDef> | null | undefined;
      if (
        typeof v !== "object" ||
        v == null ||
        typeof v.title !== "string" ||
        !Array.isArray(v.lessons)
      ) {
        // The export NAME claims to be this module's definition; skipping a
        // wrong shape would silently drop the module from the learn map —
        // the silent-omission class every collector in fr/ throws on.
        throw new Error(
          `fr/curriculum: ${path} exports ${exportName} with the wrong ` +
            `shape. Expected { title: string; eyebrow?; summary?; accent?; ` +
            `lessons: LessonContent[] }.`,
        );
      }
      def = value as FrModuleDef;
    }
    if (!def) {
      // A curriculum file whose module export is missing or misnamed would
      // otherwise have its atoms taught (the atoms glob still sees it) but
      // never appear on the map — taught-but-never-scheduled, the exact ES
      // m17 failure this derivation exists to close.
      throw new Error(
        `fr/curriculum: ${path} has no FR_M${fileNo[1]}_MODULE export — ` +
          `every curriculum module file must export its module definition.`,
      );
    }
    if (def.lessons.length === 0) {
      // FR does not ship stub modules. The pathway derives from the glob, so
      // ABSENCE of the file is the correct way to say "not yet" — an empty
      // lessons array can only be a half-authored module.
      throw new Error(
        `fr/curriculum: ${path} exports FR_M${fileNo[1]}_MODULE with zero ` +
          `lessons — author the lessons or delete the file (absence, not a ` +
          `stub, is how the derived pathway says "not yet").`,
      );
    }
    found.push({ n: Number(fileNo[1]), def });
  }
  found.sort((a, b) => a.n - b.n);
  return found;
}

/**
 * Assemble the FR pathway `CourseModule[]` for `getMockCourse("fr")`.
 */
export function buildFrenchCourse(): CourseModule[] {
  return collectFrModules(CURRICULUM_MODULES).map(({ n, def }) => ({
    id: `m${n}`,
    title: def.title,
    eyebrow: def.eyebrow,
    summary: def.summary,
    accent: def.accent,
    lessons: def.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      status: "available" as const,
    })),
  }));
}

/**
 * Flat list of every authored FR lesson, in pathway order. Derived from the
 * same glob as the pathway itself, so a lesson cannot be schedulable without
 * being resolvable (or resolvable without being scheduled) — this is what
 * `mockLessons.ts` spreads into its LESSONS map and what the FR audio
 * coverage / TTS deck gates walk.
 */
export const FR_ALL_LESSONS: LessonContent[] = collectFrModules(
  CURRICULUM_MODULES,
).flatMap(({ def }) => def.lessons);
