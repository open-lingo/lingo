/**
 * Per-lesson `introduces:` word lists — Q11 (docs/procedural-qa-2026-09-17.md
 * §14, TestFlight #202/#204). Only JA has this concept: JA's IR compiler
 * carries a per-lesson `introduces: [word, ...]` array declaring which
 * surface words a lesson debuts (`m32.ir.yaml:491`'s `introduces: [ボタン,
 * おす, きかい, うごく, おと, まわす, うごいて, とお]` is the field #202 found
 * とお sitting in with zero supporting sentence). This is compiled straight
 * through into the checked-in `<module>.ir.json` artifacts (never into the
 * runtime `src/pub/content/v1/` bundle — `introducesVocabIds` is a
 * different, older, mostly-empty field on the emitted lesson, see the doc),
 * so this reads the `.ir.json` files directly — the one place this lane's
 * "never IR/YAML" runner-contract rule (`docs/procedural-qa-2026-09-17.md`
 * §1) has to bend, because the DECLARATION being audited only exists there.
 * The audited FACT (does the word ever occur) still reads the runtime JSON,
 * same as every other question.
 *
 * KO has no IR pipeline at all (no `curriculum/ir/` directory); ES has a
 * `curriculum/ir/*.yaml` directory but none of its lessons carry an
 * `introduces:` field (measured 2026-09-18: 0 hits); FR has no live IR
 * directory (`curriculum/ir` only exists under `_archive/`). None of the
 * three has a per-lesson "declared word list" concept independent of the
 * step content itself — `introducesVocabIds` exists only for JA/KO's m1
 * kana-row micro-lessons (a different, single-anchor-word-per-step shape
 * where this defect class can't occur structurally). So Q11 is JA-only,
 * `n/a` for ko/es/fr (see each check's `naReason`).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");

/** Only JA has a live IR directory with an `introduces:` field today (see
 *  the module doc comment — ES's IR dir exists but never sets the field,
 *  KO/FR have no live IR dir at all). */
const IR_DIRS = {
  ja: path.join(REPO_ROOT, "src/features/languages/ja/curriculum/ir"),
};

/** @type {Map<string, Map<string, string[]>>} lang -> (runtime lessonId -> introduces words) */
const cache = new Map();

export function introducesConceptAvailable(lang) {
  return Boolean(IR_DIRS[lang]) && existsSync(IR_DIRS[lang]);
}

/** Runtime lesson ids carry the `<lang>-` prefix the IR's own lesson ids
 *  omit (`m32-neo-5` in the IR is `ja-m32-neo-5` in `src/pub/content/v1`). */
function runtimeLessonId(lang, irLessonId) {
  return irLessonId.startsWith(`${lang}-`) ? irLessonId : `${lang}-${irLessonId}`;
}

/** lang -> Map(runtime lessonId -> introduces word array). Empty map (not an
 *  error) for a language with no IR directory or no `introduces:` usage. */
export function loadLessonIntroduces(lang) {
  if (cache.has(lang)) return cache.get(lang);
  const map = new Map();
  const dir = IR_DIRS[lang];
  if (dir && existsSync(dir)) {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".ir.json")) continue;
      let ir;
      try {
        ir = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
      } catch {
        continue; // a malformed/stale compiled artifact is not this check's concern
      }
      for (const lesson of ir.lessons ?? []) {
        if (!Array.isArray(lesson.introduces) || lesson.introduces.length === 0) continue;
        map.set(runtimeLessonId(lang, lesson.id), lesson.introduces);
      }
    }
  }
  cache.set(lang, map);
  return map;
}
