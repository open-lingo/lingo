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

/** Flat surface -> atom map across every lesson already on disk — the
 *  "taught so far" pool `from-spec.mjs` draws distractors/match-pairs from. */
export function flatVocab(taught) {
  const map = new Map();
  for (const { atoms } of taught) for (const a of atoms) map.set(a.surface, a);
  return map;
}
