#!/usr/bin/env node
/**
 * A5d calibration-set builder — step 1: pull candidate target-language
 * SENTENCES (not single-word atoms) out of the emitted lesson content at
 * src/pub/content/v1/<lang>/*.json, dedupe, and write a random sample
 * (fixed seed, so it's reproducible) to scratch for hand-labelling.
 *
 * This does NOT read from the repo's gitignored src/pub/content/v1 in this
 * worktree (that directory is a build output and isn't present here) — it
 * reads from a read-only copy staged at CONTENT_DIR (see --content-dir),
 * copied once from a sibling worktree's build output. No repo writes.
 *
 * Usage: node extract-sentences.mjs --lang ja --content-dir <path> --n 40 --seed 5d
 *
 * Field map per language (target-language text only, English prompts/glosses
 * excluded):
 *   build_sentence.targetSentence            (all languages)
 *   dialogue_listen.lines[].kana              (ja)
 *   dialogue_sim.turns[].npc.audioText        (es, fr, ko where present)
 *   dialogue_sim.turns[].reply.audioText      (es, fr, ko where present)
 *   dialogue_sim.turns[].reply.options[]      ONLY the option whose id ===
 *     reply.correctOptionId (es, fr, ko where present) — see the
 *     "Correction (2026-09-18)" note below.
 *   translate.acceptedAnswers[]               (ja, ko — target-language answer)
 *   particle_cloze.sentence / .fullSentence   (assembled cloze sentence, if present)
 *   listening_build / listening_comprehension .audioText or .transcript
 *
 * Correction (2026-09-18): every field this extractor reads must be an
 * ANSWER-POSITION string, never a distractor/foil string a module prints
 * on purpose (project memory "grade answers, not every string";
 * `content-change` skill §6's answer-position table). The ORIGINAL version
 * of this file pushed every `turn.reply.options[].text` in a `dialogue_sim`
 * turn — including options with ids like `wrong-yes`/`wrong-gender`/
 * `wrong-spelling`, which are deliberately ungrammatical or deliberately
 * wrong-in-context foils testing whether the learner can tell them apart
 * from the correct answer. That bug seeded 9 of the ES calibration set's
 * 40 "real" rows and 11 of FR's with foil text (see
 * `docs/judge-calibration-2026-09-17.md`'s dated correction). Now only the
 * option matching `reply.correctOptionId` is pulled (usually a byte-for-
 * byte duplicate of `reply.audioText`, which the main-loop dedupe already
 * collapses) — no other array field in this file (`acceptedAnswers[0]`,
 * `particle_cloze`'s scalar `.sentence`) reads a distractor slot; if a
 * future field map addition reads any `options[]`/`distractors[]`-shaped
 * array, it must apply the same correct-option-only filter.
 */
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const out = { n: 40, seed: "5d" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--lang") out.lang = argv[++i];
    else if (a === "--content-dir") out.contentDir = argv[++i];
    else if (a === "--n") out.n = Number(argv[++i]);
    else if (a === "--seed") out.seed = argv[++i];
    else if (a === "--out") out.out = argv[++i];
  }
  return out;
}

// Deterministic PRNG (mulberry32) seeded from a string, so re-running with
// the same --seed reproduces the same sample.
function seedFromString(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SCRIPT_TESTS = {
  ja: (s) => /[぀-ヿ一-龯]/.test(s),
  ko: (s) => /[가-힣]/.test(s),
  es: (s) => /^[a-zA-ZáéíóúñÁÉÍÓÚÑü¿¡\s.,!?'"’0-9-]+$/.test(s),
  fr: (s) => /^[a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ\s.,!?'"’0-9-]+$/.test(s),
};

function looksLikeSentence(s, lang) {
  if (typeof s !== "string") return false;
  const trimmed = s.trim();
  if (trimmed.length < 3) return false;
  if (!SCRIPT_TESTS[lang](trimmed)) return false;
  // Require at least 2 "words" (space-delimited for ko/es/fr; ja sentences
  // are often unspaced, so allow length>=4 kana/kanji chars instead).
  if (lang === "ja") return trimmed.replace(/[。、！？\s]/g, "").length >= 4;
  return trimmed.split(/\s+/).filter(Boolean).length >= 2;
}

export function collect(step, lang, out) {
  const t = step.type;
  const push = (v, field) => {
    if (typeof v === "string" && looksLikeSentence(v, lang)) {
      out.push({ text: v.trim(), stepType: t, field });
    }
  };
  if (t === "build_sentence") push(step.targetSentence, "targetSentence");
  if (t === "dialogue_listen" && Array.isArray(step.lines)) {
    for (const line of step.lines) push(line.kana ?? line.text, "lines[].kana");
  }
  if (t === "dialogue_sim" && Array.isArray(step.turns)) {
    for (const turn of step.turns) {
      push(turn.npc?.audioText ?? turn.npc?.kana, "turns[].npc.audioText");
      push(turn.reply?.audioText, "turns[].reply.audioText");
      // Answer-position only: a reply's options[] mixes the correct
      // answer with deliberately wrong foils (id-tagged wrong-*/echo
      // distractors testing the learner's discrimination). Only the
      // option matching correctOptionId is a graded/intended sentence;
      // never sample the rest. See the file-header "Correction
      // (2026-09-18)" note.
      if (Array.isArray(turn.reply?.options) && turn.reply?.correctOptionId) {
        const correctOpt = turn.reply.options.find((o) => o?.id === turn.reply.correctOptionId);
        if (correctOpt) push(correctOpt.text, "turns[].reply.options[correctOptionId].text");
      }
    }
  }
  if (t === "translate" && Array.isArray(step.acceptedAnswers)) {
    // Only the first accepted answer per row — extras are near-duplicates.
    if (step.acceptedAnswers[0]) push(step.acceptedAnswers[0], "acceptedAnswers[0]");
  }
  if (t === "particle_cloze") {
    push(step.sentence ?? step.fullSentence ?? step.targetSentence, "sentence");
  }
  if ((t === "listening_build" || t === "listening_comprehension") ) {
    push(step.audioText ?? step.transcript ?? step.targetSentence, "audioText/transcript");
  }
  if (t === "agreement_cloze" || t === "agreement_chain" || t === "conjugation_transform") {
    push(step.sentence ?? step.targetSentence ?? step.fullSentence, "sentence");
  }
  if (t === "speaking") {
    push(step.targetSentence ?? step.prompt2 ?? step.expectedText, "targetSentence");
  }
}

export function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.lang || !args.contentDir) {
    console.error("usage: extract-sentences.mjs --lang <ja|ko|es|fr> --content-dir <path> [--n 40] [--seed 5d] [--out <file>]");
    process.exit(1);
  }
  const dir = path.join(args.contentDir, args.lang);
  const files = fs.readdirSync(dir).filter((f) => /^m\d+[a-zA-Z]*\./.test(f));
  const collected = [];
  for (const f of files) {
    let j;
    try {
      j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch {
      continue;
    }
    for (const lesson of j.lessons ?? []) {
      for (const step of lesson.steps ?? []) {
        const before = collected.length;
        collect(step, args.lang, collected);
        for (let i = before; i < collected.length; i++) {
          collected[i].lessonId = lesson.id;
          collected[i].moduleId = lesson.moduleId;
          collected[i].sourceFile = f;
        }
      }
    }
  }

  // Dedupe by text.
  const seen = new Set();
  const deduped = [];
  for (const row of collected) {
    if (seen.has(row.text)) continue;
    seen.add(row.text);
    deduped.push(row);
  }

  const rng = mulberry32(seedFromString(`${args.lang}:${args.seed}`));
  const shuffled = shuffleWithRng(deduped, rng);
  const sample = shuffled.slice(0, args.n);

  console.log(
    `extract-sentences[${args.lang}]: ${collected.length} raw, ${deduped.length} unique, sampled ${sample.length}`,
  );
  const outFile = args.out ?? path.join(path.dirname(new URL(import.meta.url).pathname), `candidates-${args.lang}.json`);
  fs.writeFileSync(outFile, JSON.stringify(sample, null, 2));
  console.log(`wrote ${outFile}`);
}

// Run only when executed directly (`node extract-sentences.mjs ...`), not
// when imported by extract-sentences.test.mjs.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
