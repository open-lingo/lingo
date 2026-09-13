/**
 * THE truthful "what has the live JA course actually taught before module N"
 * accessor (B088).
 *
 * `courseAtoms.fromModule` is stale by construction — old-course provenance
 * tags that both admit untaught words and reject taught ones (the compiler
 * documents the trap at `moduleCompiler.ts` `metBefore` and killed it with IR
 * `priorVocab`). Three render/engine consumers were caught re-tripping on
 * `fromModule` in the same week — the build-tile pad (B088, this file's
 * reason to exist), the trainer drill pins (B086) and the grammar-review
 * comprehensibility gate (B070) — so the truthful set lives HERE, once,
 * instead of as scattered per-consumer filters.
 *
 * Sources, in order of truth:
 *  - IR modules (m6–m38): the compiled `mN.ir.json` `priorVocab` — the union
 *    of what every earlier module actually taught, computed by
 *    `scripts/compile-ir.mjs` where the filesystem is available. The two
 *    fields this module needs are projected into `taughtVocab.generated.json`
 *    by `npm run content:emit` (the full IR never reaches the app bundle).
 *  - Hand-authored modules with no IR (m1–m5 kana rows, the N4 pilot): real
 *    attribution via `lessonAtomIndex.getAtomsForLesson` — the introduced-by
 *    index, which honors live `introducedByLessonId` entries, is
 *    isDeadAttribution-aware (B068), and falls back to exact surface/atom-id
 *    mining of the lesson's own steps.
 *  - Course furniture (character names + interjections, present since m3):
 *    counted as met, exactly as the compiler's `metBefore` does — the list is
 *    imported from the compiler so the two can never drift.
 *
 * The set contains kana SURFACES (what a tile or option displays), not atom
 * ids — a taught surface is fair to show whichever registry row it resolves
 * to.
 */
import taughtVocabJson from "./taughtVocab.generated.json";
import { JA_COURSE_FURNITURE_KANA } from "@/features/lesson/data/moduleCompiler";
import { getAtomsForLesson } from "@/features/lesson/data/lessonAtomIndex";
import { tryGetLanguageModule } from "@/shared/language/registry";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";


type IrWithPriorVocab = {
  priorVocab?: string[];
  newAtoms?: { kana?: string }[];
};

// Content-as-data (2026-09-13): importing the 41 `mN.ir.json` files here put
// 5.4 MB of IR into the lesson chunk for the sake of two fields. The emitter
// (`npm run content:emit`) projects exactly those fields into
// `taughtVocab.generated.json` (committed; `taughtVocab.generated.test.ts`
// is the stale guard) and this module reads that.
const IR_BY_MODULE: Readonly<Record<string, IrWithPriorVocab>> =
  taughtVocabJson as Readonly<Record<string, IrWithPriorVocab>>;

const cache = new Map<string, ReadonlySet<string>>();

/**
 * Kana surfaces the live JA course has actually taught BEFORE `moduleId`
 * (course furniture included). Words taught within `moduleId` itself are
 * deliberately NOT in the set — same-module availability is per-lesson and
 * stays with the caller (e.g. the pad's neo-attribution gate).
 *
 * A `moduleId` not on the JA curriculum yields furniture only — a consumer
 * asking about an unknown module has no taught vocabulary to draw on.
 */
export function getJaTaughtKanaBeforeModule(moduleId: string): ReadonlySet<string> {
  const cached = cache.get(moduleId);
  if (cached) return cached;
  const set = new Set<string>(IR_BY_MODULE[moduleId]?.priorVocab ?? []);
  if (!IR_BY_MODULE[moduleId]) {
    // No IR (hand-authored m1–m5, the N4 pilot): union real attribution over
    // every lesson of every earlier module, in curriculum order.
    const ja = tryGetLanguageModule("ja");
    const order = ja?.curriculum ?? [];
    const cutoff = order.findIndex((m) => m.id === moduleId);
    for (const mod of cutoff === -1 ? [] : order.slice(0, cutoff)) {
      for (const lesson of mod.lessons ?? []) {
        for (const atom of getAtomsForLesson(lesson.id, "ja")) {
          for (const surface of atom.kana.split("/")) {
            const s = surface.trim();
            if (s) set.add(s);
          }
        }
      }
    }
  }
  for (const w of JA_COURSE_FURNITURE_KANA) set.add(w);
  cache.set(moduleId, set);
  return set;
}

let allTaughtCache: ReadonlySet<string> | null = null;

/**
 * Every kana surface the live JA course teaches ANYWHERE — the union across
 * every module, not "before" a cutoff. For a consumer that doesn't know
 * (and doesn't care) which module a piece of text came from — the SRS
 * review-lesson builder mines a sentence out of ANY earlier lesson and needs
 * to tokenize it correctly regardless of origin (TestFlight #32).
 *
 * `priorVocab` alone under-covers: it's "taught before module N", so the
 * LAST IR module's own new words are never anyone's "prior". `newAtoms`
 * fills that gap module-by-module, and most inflected forms (て/た-form,
 * derived adjectives) live ONLY there — `courseAtoms` deliberately excludes
 * them (see file header) so this is the one place that reassembles the
 * complete inflected-surface vocabulary.
 */
export function getAllJaTaughtKana(): ReadonlySet<string> {
  if (allTaughtCache) return allTaughtCache;
  const set = new Set<string>();
  for (const w of JA_COURSE_FURNITURE_KANA) set.add(w);
  for (const a of JA_COURSE_ATOMS) set.add(a.kana);
  for (const ir of Object.values(IR_BY_MODULE)) {
    for (const w of ir.priorVocab ?? []) set.add(w);
    for (const a of ir.newAtoms ?? []) if (a.kana) set.add(a.kana);
  }
  // m1-m5 (no IR): real attribution, same source `getJaTaughtKanaBeforeModule`
  // uses for its hand-authored branch, over every lesson of every module.
  const ja = tryGetLanguageModule("ja");
  for (const mod of ja?.curriculum ?? []) {
    for (const lesson of mod.lessons ?? []) {
      for (const atom of getAtomsForLesson(lesson.id, "ja")) {
        for (const surface of atom.kana.split("/")) {
          const s = surface.trim();
          if (s) set.add(s);
        }
      }
    }
  }
  allTaughtCache = set;
  return set;
}
