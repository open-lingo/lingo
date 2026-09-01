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
 *    `scripts/compile-ir.mjs` where the filesystem is available. The JSONs
 *    are already statically imported by each `mN-neo.ts`, so importing them
 *    again here adds no bundle weight.
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
import { JA_COURSE_FURNITURE_KANA } from "@/features/lesson/data/moduleCompiler";
import { getAtomsForLesson } from "@/features/lesson/data/lessonAtomIndex";
import { tryGetLanguageModule } from "@/shared/language/registry";

import m6Ir from "./ir/m6.ir.json";
import m7Ir from "./ir/m7.ir.json";
import m8Ir from "./ir/m8.ir.json";
import m9Ir from "./ir/m9.ir.json";
import m10Ir from "./ir/m10.ir.json";
import m11Ir from "./ir/m11.ir.json";
import m12Ir from "./ir/m12.ir.json";
import m13Ir from "./ir/m13.ir.json";
import m14Ir from "./ir/m14.ir.json";
import m15Ir from "./ir/m15.ir.json";
import m16Ir from "./ir/m16.ir.json";
import m17Ir from "./ir/m17.ir.json";
import m18Ir from "./ir/m18.ir.json";
import m19Ir from "./ir/m19.ir.json";
import m20Ir from "./ir/m20.ir.json";
import m21Ir from "./ir/m21.ir.json";
import m22Ir from "./ir/m22.ir.json";
import m23Ir from "./ir/m23.ir.json";
import m24Ir from "./ir/m24.ir.json";
import m25Ir from "./ir/m25.ir.json";
import m26Ir from "./ir/m26.ir.json";
import m27Ir from "./ir/m27.ir.json";
import m28Ir from "./ir/m28.ir.json";
import m29Ir from "./ir/m29.ir.json";
import m30Ir from "./ir/m30.ir.json";
import m31Ir from "./ir/m31.ir.json";
import m32Ir from "./ir/m32.ir.json";
import m33Ir from "./ir/m33.ir.json";
import m34Ir from "./ir/m34.ir.json";
import m35Ir from "./ir/m35.ir.json";
import m36Ir from "./ir/m36.ir.json";
import m37Ir from "./ir/m37.ir.json";
import m38Ir from "./ir/m38.ir.json";

type IrWithPriorVocab = { priorVocab?: string[] };

const IR_BY_MODULE: Readonly<Record<string, IrWithPriorVocab>> = {
  m6: m6Ir,
  m7: m7Ir,
  m8: m8Ir,
  m9: m9Ir,
  m10: m10Ir,
  m11: m11Ir,
  m12: m12Ir,
  m13: m13Ir,
  m14: m14Ir,
  m15: m15Ir,
  m16: m16Ir,
  m17: m17Ir,
  m18: m18Ir,
  m19: m19Ir,
  m20: m20Ir,
  m21: m21Ir,
  m22: m22Ir,
  m23: m23Ir,
  m24: m24Ir,
  m25: m25Ir,
  m26: m26Ir,
  m27: m27Ir,
  m28: m28Ir,
  m29: m29Ir,
  m30: m30Ir,
  m31: m31Ir,
  m32: m32Ir,
  m33: m33Ir,
  m34: m34Ir,
  m35: m35Ir,
  m36: m36Ir,
  m37: m37Ir,
  m38: m38Ir,
};

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
