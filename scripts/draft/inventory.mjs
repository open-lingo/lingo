#!/usr/bin/env node
/**
 * Taught-vocabulary inventory for slot-filling draft generation.
 *
 * Answers one question: arriving at module N, which words does the learner
 * own, and what kind of thing is each one? The first half comes from the
 * course; the second half comes from `semantic-pools.json`, which is
 * classified once by a model and then reused by every module.
 *
 * WHY THE SECOND HALF EXISTS. The generator picks words to drop into
 * grammatical slots. Slots have semantic requirements the course data does not
 * record: `を` before あげる wants something a person can hand over, and
 * `courseAtoms.ts` knows only that がくせい is a noun. The first version of the
 * generator filtered the object pool with a hand-written regex blocklist and
 * produced 「ちちはともだちにがくせいをあげます」 — "my father gives a student
 * to a friend". Every blocklist in this project has leaked the same way (`ー`
 * read as punctuation, a zsh word-split that silently matched nothing, a `pos`
 * filter that returned zero rows). So the pools are enumerated per word, not
 * pattern-matched, and they live on disk where they can be read and checked.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../..");
const CUR = join(ROOT, "src/features/languages/ja/curriculum");

/**
 * Kana the learner owns arriving at `moduleId`.
 *
 * `getJaTaughtKanaBeforeModule` (the runtime's own answer) can only speak for
 * modules that already have an IR, so it is no use while authoring the next
 * one — it returns course furniture and nothing else. This reproduces the same
 * derivation one module further on: everything the previous module listed as
 * prior, plus everything that module itself introduced.
 */
export function taughtBefore(moduleId) {
  const n = Number(String(moduleId).replace(/\D/g, ""));
  const prevIr = join(CUR, `ir/m${n - 1}.ir.json`);
  if (!existsSync(prevIr)) {
    throw new Error(
      `No IR for m${n - 1}. taughtBefore() derives module ${moduleId}'s ` +
        `starting vocabulary from the previous module's compiled IR, so the ` +
        `previous module has to be compiled first (scripts/compile-ir.mjs).`,
    );
  }
  const ir = JSON.parse(readFileSync(prevIr, "utf8"));
  return new Set([...(ir.priorVocab ?? []), ...(ir.newAtoms ?? []).map((a) => a.kana)]);
}

/**
 * Atom metadata by kana. Parsed out of `courseAtoms.ts` with a regex, the same
 * way `scripts/authoring-context.mjs` does it — the registry is a flat literal
 * and keeping this dependency-free means the drafting tools run without a
 * TypeScript build step.
 *
 * NOTE: keyed by kana, and kana collide. かぜ is both "wind" and "a cold"; はな
 * is both "flower" and "nose". The map keeps the LAST definition, so any caller
 * that cares about the distinction has to work from `all()` instead.
 */
export function atomsByKana() {
  const src = readFileSync(join(ROOT, "src/features/languages/ja/courseAtoms.ts"), "utf8");
  const out = new Map();
  for (const m of src.matchAll(/\{\s*id:[^}]*\}/g)) {
    const b = m[0];
    const f = (re) => b.match(re)?.[1];
    const kana = f(/kana:\s*"([^"]+)"/);
    if (!kana) continue;
    out.set(kana, {
      kana,
      id: f(/id:\s*"([^"]+)"/) ?? "",
      gloss: f(/meaningEn:\s*"([^"]+)"/) ?? "",
      pos: f(/pos:\s*"([^"]+)"/) ?? "",
      emoji: f(/emoji:\s*"([^"]+)"/) ?? "",
    });
  }
  return out;
}

/**
 * The semantic pools. Shape:
 *   { "<kana>": { gloss, category, giftable, note? } }
 * `category` ∈ person | place | time | abstract | portable-object |
 *              food-drink | animal | body-part | other
 *
 * Regenerate with `scripts/draft/classify.mjs`, then have the `ja-lexicon-judge`
 * agent audit the result before committing it — the local model is reliable
 * only where the gloss states the category outright, and gets world knowledge
 * (a phone is carried, a window is not) wrong often enough to matter.
 */
export function semanticPools() {
  const p = join(HERE, "semantic-pools.json");
  if (!existsSync(p)) {
    throw new Error(
      `Missing ${p}. Generate it with:\n` +
        `  node scripts/draft/classify.mjs > /dev/null\n` +
        `then audit it with the ja-lexicon-judge agent before committing.`,
    );
  }
  return JSON.parse(readFileSync(p, "utf8"));
}

/** Words in `taught` whose pool category is one of `cats`. */
export function pool(taught, pools, ...cats) {
  const want = new Set(cats);
  return Object.entries(pools)
    .filter(([kana, v]) => taught.has(kana) && want.has(v.category))
    .map(([kana, v]) => ({ kana, gloss: v.gloss, ...v }));
}

/** Words in `taught` that a person could hand to another person. */
export function giftable(taught, pools) {
  return Object.entries(pools)
    .filter(([kana, v]) => taught.has(kana) && v.giftable)
    .map(([kana, v]) => ({ kana, gloss: v.gloss, ...v }));
}
