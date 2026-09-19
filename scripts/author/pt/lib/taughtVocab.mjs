/**
 * lib/taughtVocab.mjs — the taught-vocabulary list, read from the
 * COMMITTED source of truth (`courseAtoms.m<n>-l<m>.ts`), not re-derived
 * by hand. These files are plain `atom({...})` call literals (see
 * `courseAtoms.ts`'s header) — a lightweight regex scan is enough; a full
 * TS parser would be scope creep for a stable, repetitive shape.
 *
 * Used by: `pack.mjs` (the taught-vocabulary section) and `from-spec.mjs`
 * (prior-lesson distractor pool + matchLit padding).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const FIELD_RE = /(surface|meaningEn|partOfSpeech|fromModule|kind|gender|emoji|hint)\s*:\s*"((?:[^"\\]|\\.)*)"/g;

function parseAtomBlocks(src) {
  const atoms = [];
  const calls = src.split(/atom\(\{/).slice(1);
  for (const chunk of calls) {
    const end = chunk.indexOf("}),");
    const body = end === -1 ? chunk : chunk.slice(0, end);
    const fields = {};
    for (const m of body.matchAll(FIELD_RE)) fields[m[1]] = m[2].replace(/\\"/g, '"');
    if (fields.surface) atoms.push(fields);
  }
  return atoms;
}

/**
 * Every `courseAtoms.<mod>-l<n>.ts` file under `pt/`, in filename order
 * (m1-l1, m1-l2, … m1-l10, m2-l1, …). Returns
 * `[{ module, lesson, atoms: [{surface, meaningEn, partOfSpeech, gender?, emoji?, hint?}] }]`.
 */
export function readTaughtVocab(ptDir) {
  if (!existsSync(ptDir)) return [];
  const files = readdirSync(ptDir)
    .filter((f) => /^courseAtoms\.m\d+-l\d+\.ts$/.test(f))
    .sort((a, b) => {
      const [, ma, la] = a.match(/m(\d+)-l(\d+)/);
      const [, mb, lb] = b.match(/m(\d+)-l(\d+)/);
      return Number(ma) - Number(mb) || Number(la) - Number(lb);
    });
  return files.map((f) => {
    const [, mod, lesson] = f.match(/m(\d+)-l(\d+)/);
    const atoms = parseAtomBlocks(readFileSync(join(ptDir, f), "utf8"));
    return { module: `m${mod}`, lesson: Number(lesson), atoms };
  });
}

/**
 * ROUND 4 (lane PTTOOL4, item 4): "prior" across MODULES, not just within
 * one — `from-spec.mjs`/`check-lesson.mjs` used to filter prior vocab by
 * `lesson < targetLesson` alone, which silently drops an EARLIER module's
 * atoms for any target lesson number <= that module's own lesson count
 * (m2-L1's target lesson is 1, so `l.lesson < 1` is never true for ANY
 * m1 lesson — m1's entire 42-atom vocabulary would vanish from m2-L1's
 * distractor pool and residual-check "known" set). Module number always
 * wins; lesson number only breaks a tie within the SAME module.
 */
export function isBeforeLesson(entry, targetModule, targetLesson) {
  const entryMod = Number(String(entry.module).replace(/^m/, ""));
  const targetMod = Number(String(targetModule).replace(/^m/, ""));
  if (entryMod !== targetMod) return entryMod < targetMod;
  return entry.lesson < targetLesson;
}

/**
 * ITEM 10 (lane PTTOOL5): the registry half of shared atom metadata — the
 * only field the real `courseAtoms.m<n>-l<m>.ts` registry can carry today
 * (its `PtAtom` type has no `imageable`/`imageableReason`/`class`; see
 * `lib/spine.mjs`'s `spineWordsByPt` for those). Fills a spec word's
 * missing `emoji` from an already-registered atom of the SAME surface (an
 * earlier lesson taught it with one), and FAILS when the spec's own value
 * contradicts the registry — the same surface silently re-registering
 * with different metadata across lessons is a real authoring bug, not a
 * style choice.
 */
export function resolveEmojiFromRegistry(words, priorVocab) {
  if (!priorVocab || !priorVocab.size) return words;
  return words.map((w) => {
    const registered = priorVocab.get(w.pt);
    if (!registered?.emoji) return w;
    if (w.emoji !== undefined && w.emoji !== registered.emoji) {
      throw new Error(
        `taughtVocab: words: "${w.pt}".emoji = "${w.emoji}" contradicts the registry's "${registered.emoji}" (already taught with that emoji) — ` +
          `smallest fix: match the registered emoji, or this is genuinely a different word than the earlier "${w.pt}"`,
      );
    }
    return w.emoji === undefined ? { ...w, emoji: registered.emoji } : w;
  });
}

/** Flat surface -> atom map across every lesson already on disk — the
 *  "taught so far" pool `from-spec.mjs` draws distractors/match-pairs from. */
export function flatVocab(taught) {
  const map = new Map();
  for (const { atoms } of taught) for (const a of atoms) map.set(a.surface, a);
  return map;
}
