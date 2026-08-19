#!/usr/bin/env node
/**
 * Per-module authoring context pack (2026-07-20 methodology fix).
 *
 * Spencer: authoring agents ship contradictions "every single time"
 * because they start without the full picture — they don't know every
 * word/verb taught so far, where they are in the course, or the rules to
 * self-check against AS they write. This generates that briefing from the
 * live atom registry + spine, so every authoring dispatch begins with an
 * accurate, never-stale "here is exactly what the learner knows arriving
 * at module N, here is what you introduce, here are the hard rules, and
 * here is how to self-check each lesson before moving on."
 *
 * Usage:  node scripts/authoring-context.mjs m6   >  docs/context/m6-context.md
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const target = (process.argv[2] || "").trim();
const targetIdx = parseInt(target.replace(/[^\d]/g, ""), 10);
if (!targetIdx) {
  console.error("Usage: node scripts/authoring-context.mjs m<N>");
  process.exit(1);
}

// ── Parse the atom registry (source of truth for vocab) ─────────────────
const atomsSrc = readFileSync(
  resolve(ROOT, "src/features/languages/ja/courseAtoms.ts"),
  "utf8",
);
const atoms = [];
for (const m of atomsSrc.matchAll(/\{\s*id:[^}]*\}/g)) {
  const b = m[0];
  const f = (re) => (b.match(re) ? b.match(re)[1] : undefined);
  const kana = f(/kana:\s*"([^"]+)"/);
  const fromModule = f(/fromModule:\s*"([^"]+)"/);
  if (!kana || !fromModule) continue;
  atoms.push({
    kana,
    fromModule,
    meaningEn: f(/meaningEn:\s*"([^"]+)"/) ?? "",
    kind: f(/kind:\s*"([^"]+)"/) ?? "vocab",
    emoji: f(/emoji:\s*"([^"]+)"/),
    blocked: /blocked:\s*true/.test(b),
  });
}

// Grammar-taught-by-module.
//
// This WAS a hand-maintained object with a comment saying "extend per module
// as you author it". Nobody did: it stopped at m7 and stayed there through
// twenty-four modules of authoring, so every pack from m8 onward told the
// author the learner knew nothing past ます/ません. For an N4 module that is
// not a gap, it is a lie — the whole point of the pack is that it is
// "accurate, never-stale".
//
// So it is derived now. Each module's IR already names its own grammar points
// and its own lesson focus lines, which is the same information the hand digest
// held, kept current by the only thing that can keep it current: being the file
// the module is authored in. m3–m5 predate the IR and keep their hand entries.
const HAND_GRAMMAR = {
  m3: "だ (plain copula, noun+だ); は (topic); も (also); casual ？-contour questions (no か); survival chunks; です (recognition only)",
  m4: "の (possession + attributive); これ/それ/あれ/どれ (deixis by distance); だれ (who); なに/何 (what); のだ short answers",
  m5: "dictionary-form verbs as COMPLETE sentences (NO だ on verbs); を (direct object) + SOV; もの word family; いう/おもう recognition chunks",
};

const GRAMMAR_IR_DIR = resolve(ROOT, "src/features/languages/ja/curriculum/ir");

/** Grammar point ids a module teaches, in IR order, deduped. */
function irGrammar(mod) {
  let raw;
  try {
    raw = readFileSync(join(GRAMMAR_IR_DIR, `${mod}.ir.yaml`), "utf8");
  } catch {
    return undefined;
  }
  // Deliberately regex rather than a YAML parse: this script has no deps and
  // runs before anything is installed. The two shapes are stable and both are
  // asserted by `compile-ir.mjs`, which fails loudly if they change.
  const title = raw.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1];
  const points = [];
  // Stop at the next TOP-LEVEL key. Without this the slice runs into
  // `lessons:`, whose entries share the `  - id:` shape, and every module
  // reports its twenty-odd lesson ids as grammar points.
  const gpStart = raw.indexOf("\ngrammarPoints:");
  if (gpStart < 0) return title;
  const after = raw.slice(gpStart + 1);
  const nextKey = after.slice(1).search(/\n[A-Za-z_][\w-]*:/);
  const gpBlock = nextKey < 0 ? after : after.slice(0, nextKey + 1);
  for (const m of gpBlock.matchAll(/^  - id:\s*(\S+)/gm)) {
    if (!points.includes(m[1])) points.push(m[1]);
  }
  if (!title && !points.length) return undefined;
  return [title, points.length ? `points: ${points.join(", ")}` : ""]
    .filter(Boolean)
    .join(" — ");
}

const grammarFor = (mod) => HAND_GRAMMAR[mod] ?? irGrammar(mod);

/** The module's own register, from its IR rather than an N5-era sentence. */
function irRegister(mod) {
  try {
    return readFileSync(join(GRAMMAR_IR_DIR, `${mod}.ir.yaml`), "utf8").match(
      /^register:\s*"?([a-z-]+)"?/m,
    )?.[1];
  } catch {
    return undefined;
  }
}

const isVerb = (a) => a.kind === "vocab" && /^to /.test(a.meaningEn);

// ── ACCURACY FIX: derive "already known" from actual neo-course USAGE,
// not the stale fromModule tags (m5's seed verbs still carry old-course
// m7/m11/m15 tags, which would undercount what the learner really knows).
// A word is "known before m{target}" if it appears in any m{k}-neo file
// for k < target. Read those files once.
const CUR_DIR = resolve(ROOT, "src/features/languages/ja/curriculum");
const neoFiles = readdirSync(CUR_DIR).filter(
  (f) => /^m(\d+)-neo.*\.ts$/.test(f) && !f.includes(".test."),
);
const neoText = {}; // moduleIdx -> concatenated source
for (const f of neoFiles) {
  const idx = parseInt(f.match(/^m(\d+)-neo/)[1], 10);
  neoText[idx] = (neoText[idx] ?? "") + readFileSync(join(CUR_DIR, f), "utf8");
}
// CONTENT-IR MODULES. An IR module's `m<N>-neo.ts` is a two-line file that
// calls compileModule() — all of its Japanese lives in `ir/m<N>.ir.yaml`. Since
// m8 that meant this scan saw NOTHING from the most recent modules, so every
// pack understated what the learner already knows and authors had to rederive
// the prior vocabulary by hand (m13). Fold the YAML in under the same index.
const IR_DIR = join(CUR_DIR, "ir");
try {
  for (const f of readdirSync(IR_DIR)) {
    const m = f.match(/^m(\d+)\.ir\.yaml$/);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    neoText[idx] = (neoText[idx] ?? "") + readFileSync(join(IR_DIR, f), "utf8");
  }
} catch {
  // no ir/ directory yet — fine
}
const priorCorpus = Object.entries(neoText)
  .filter(([i]) => Number(i) < targetIdx)
  .map(([, t]) => t)
  .join("\n");
const thisCorpus = neoText[targetIdx] ?? "";

// The COMPILED prior vocabulary, when the predecessor module has one.
//
// `priorCorpus.includes(kana)` is a substring match over raw YAML — prose
// notes, reviewPools, English commentary and all. That is how しんぶん became
// "known": its only appearance anywhere in the course is inside an m30 note
// LISTING it as a word that was cut for being untaught. m23 and m30 both had
// to strip pack-recommended words by hand for exactly this reason ("all
// 'known' according to the pack and untaught according to every earlier
// module's IR", m30.ir.yaml). compile-ir.mjs already derives the honest
// answer per module — `priorVocab` in the compiled JSON — so use it, and keep
// the text scan only as the bootstrap path for a module with no compiled
// predecessor.
let compiledKnown = null;
try {
  const prevIr = JSON.parse(
    readFileSync(join(IR_DIR, `m${targetIdx - 1}.ir.json`), "utf8"),
  );
  const set = new Set(prevIr.priorVocab ?? []);
  for (const a of prevIr.newAtoms ?? []) set.add(a.kana);
  for (const a of prevIr.priorAtoms ?? []) set.add(a.kana);
  if (set.size > 0) compiledKnown = set;
} catch {
  // no compiled predecessor — fall through to the text scan
}

// Known = used in a prior neo module OR a kana-module (m1/m2) atom (those
// are always known by m3+, even if the neo lessons never reused them —
// without this the pack under-lists known vocab and a judge flags
// legitimate m1/m2 distractors as OOV, 2026-07-20).
let prior = atoms.filter(
  (a) =>
    (compiledKnown ? compiledKnown.has(a.kana) : priorCorpus.includes(a.kana)) ||
    ((a.fromModule === "m1" || a.fromModule === "m2") && targetIdx > 2),
);
const thisModule = atoms.filter(
  (a) => thisCorpus.includes(a.kana) && !priorCorpus.includes(a.kana),
);
// Fallback to fromModule tags when no neo files exist yet below target
// (bootstrapping a brand-new module band with no authored predecessor).
if (prior.length === 0) {
  prior = atoms.filter((a) => {
    const i = parseInt(a.fromModule.replace(/[^\d]/g, ""), 10);
    return /^m\d+$/.test(a.fromModule) && i > 0 && i < targetIdx;
  });
}

// ── ANGLE 1: under-reinforced high-frequency words (invariant 27) —
// prior-known words that appear FEW times so far; the agent should prefer
// them as carriers/review to balance exposure. Count occurrences in the
// prior corpus; cross-reference CEJC rank for "frequent but starved".
let cejc = [];
try {
  cejc = JSON.parse(
    readFileSync(resolve(ROOT, "docs/data/ja-top500-cejc.json"), "utf8"),
  );
} catch {
  cejc = [];
}
const rankByKana = new Map(cejc.map((e) => [e.kana, e.rank]));
const occ = new Map();
for (const a of uniqPre(prior)) {
  if (a.kana.length < 2) continue;
  const n = (priorCorpus.match(new RegExp(escapeRe(a.kana), "g")) || []).length;
  occ.set(a.kana, n);
}
function uniqPre(list) {
  const seen = new Set();
  return list.filter((a) => (seen.has(a.kana) ? false : seen.add(a.kana)));
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── ANGLE 2: at-level example sentences — real authored sentences from
// the immediately-preceding module, as a STYLE reference and (for review
// lessons) the verbatim-avoid list.
const exampleSentences = [
  ...(neoText[targetIdx - 1] ?? "").matchAll(/(?:audioText|target|targetSentence):\s*"([^"]+)"/g),
]
  .map((m) => m[1])
  .filter((s) => /[ 　]/.test(s)) // multi-word only
  .filter((s, i, arr) => arr.indexOf(s) === i)
  .slice(0, 25);

const uniq = (list) => {
  const seen = new Set();
  return list.filter((a) => (seen.has(a.kana) ? false : seen.add(a.kana)));
};
const fmt = (a) => `${a.kana}${a.emoji ? " " + a.emoji : ""} — ${a.meaningEn}${a.blocked ? " [no image MCQ]" : ""}`;
const section = (title, list) => {
  const u = uniq(list);
  if (!u.length) return "";
  return `\n### ${title} (${u.length})\n` + u.map((a) => "- " + fmt(a)).join("\n") + "\n";
};

const priorVerbs = prior.filter(isVerb);
const priorParticles = prior.filter((a) => a.kind === "particle");
const priorChunks = prior.filter((a) => a.kind === "phrase");
const priorNouns = prior.filter(
  (a) => !isVerb(a) && a.kind === "vocab",
);

let out = `# Authoring context pack — module m${targetIdx}\n\n`;
out += `Auto-generated from courseAtoms.ts. The learner arriving at m${targetIdx} `;
out += `has been taught everything below. **Use ONLY these words as carriers/**\n`;
out += `**distractors** (plus this module's new allocation); never introduce a word `;
out += `not listed here or in the allocation (invariant 16).\n`;

/**
 * The register line. It used to be the sentence "Plain form is the whole course
 * through m28", hard-coded — which was already stale for m29 and is simply
 * wrong for the N4 tier. The IR carries `register:` per module, so the pack
 * reports what the module the author is writing actually says.
 */
const REGISTER_LINE = (() => {
  const r = irRegister(`m${targetIdx}`);
  if (r === "plain")
    return "- **Plain form** (だ / dict-form verbs) is this module's base. です・ます\n  appears only where the audience calls for it — register is chosen by WHO is\n  being addressed, never by the topic.";
  if (r === "polite")
    return "- **Polite form** (です・ます) is this module's base. Plain form appears only\n  where the audience calls for it.";
  if (r) return `- This module's IR declares register: **${r}**.`;
  return "- This module's IR declares no `register:`. Set one before authoring — the\n  pack cannot guess it, and a module without a stated register produces\n  mixed-register beats.";
})();

out += `\n## Grammar / constructions taught BEFORE m${targetIdx}\n`;
for (let i = 3; i < targetIdx; i++) {
  const g = grammarFor(`m${i}`);
  if (g) out += `- **m${i}:** ${g}\n`;
}

out += `\n## Words the learner already knows (usable as carriers/review)\n`;
out += section("Verbs (dictionary form)", priorVerbs);
out += section("Particles", priorParticles);
out += section("Nouns / vocab", priorNouns);
out += section("Chunks / greetings / phrases", priorChunks);

out += `\n## THIS module (m${targetIdx}) introduces\n`;
const thisGrammar = grammarFor(`m${targetIdx}`);
if (thisGrammar) out += `**Grammar:** ${thisGrammar}\n`;
out += section("New verbs", thisModule.filter(isVerb));
out += section("New vocab/nouns", thisModule.filter((a) => !isVerb(a) && a.kind === "vocab"));
out += section("New particles", thisModule.filter((a) => a.kind === "particle"));
out += section("New chunks", thisModule.filter((a) => a.kind === "phrase"));
out += `\nImageable new atoms (honest emoji, NOT [no image MCQ]) MUST debut on a `;
out += `word_image_mcq (invariant 30). Blocked ones intro via build / listeningComp+speaking / rule card.\n`;

// ── ANGLE 1 output: prefer these under-reinforced carriers ──────────────
const starved = uniqPre(prior)
  .filter(
    (a) =>
      (occ.get(a.kana) ?? 99) < 6 &&
      a.kind === "vocab" &&
      !isVerb(a) &&
      !a.blocked &&
      !/[\u30A1-\u30FA]/.test(a.kana), // katakana unreadable pre-m17
  )
  .map((a) => ({ ...a, n: occ.get(a.kana) ?? 0, rank: rankByKana.get(a.kana) }))
  .sort((a, b) => (a.n - b.n) || ((a.rank ?? 9999) - (b.rank ?? 9999)))
  .slice(0, 25);
if (starved.length) {
  out += `\n## Reinforcement targets — PREFER these as carriers/review (invariant 27)\n`;
  out += `Known words seen few times so far; balance exposure by reusing them\n`;
  out += `(esp. high CEJC rank) instead of over-using this lesson's headline nouns:\n`;
  out += starved
    .map((a) => `- ${a.kana}${a.emoji ? " " + a.emoji : ""} — ${a.meaningEn} (seen ~${a.n}×${a.rank ? `, CEJC #${a.rank}` : ""})`)
    .join("\n") + "\n";
}

// ── ANGLE 2 output: at-level example sentences ──────────────────────────
if (exampleSentences.length) {
  out += `\n## At-level example sentences (from m${targetIdx - 1}) — STYLE reference\n`;
  out += `Match this register/length/shape. For a REVIEW lesson, do NOT reuse any\n`;
  out += `of these verbatim (invariant: all-new review sentences):\n`;
  out += exampleSentences.map((s) => "- " + s).join("\n") + "\n";
}

// ── ANGLE 3 output: principled distractor sibling-sets (invariant 10) ───
const priorVerbAll = uniqPre(prior).filter(isVerb).map((a) => a.kana);
const thisVerbAll = uniqPre(thisModule).filter(isVerb).map((a) => a.kana);
out += `\n## Distractor sibling-sets (invariant 10 — real confusions, not noise)\n`;
out += `- **Verb MCQ/build distractors:** draw from OTHER taught verbs (cross-verb\n`;
out += `  confusion), never invented non-words. Pool: ${[...priorVerbAll, ...thisVerbAll].join(" / ") || "(none yet)"}.\n`;
out += `- **Particle cloze options:** the sibling particles — ${uniqPre(prior).filter((a) => a.kind === "particle").map((a) => a.kana).join(" / ") || "は/の/も/を"}.\n`;
out += `- **Demonstratives:** これ/それ/あれ/どれ are each other's distractors.\n`;
out += `- **Meaning-MCQ (LC) distractors:** plausible near-meanings from the known\n`;
out += `  set above, never words the learner can't read.\n`;

out += `
## Character canon (never contradict — invariant 21)
- Tom = student, American, Mika's friend | Mika = student, Japanese |
  Tanaka = the teacher | Ken = student, Japanese.
- Speaker labels ROMANIZED (Tom/Mika/Ken/Tanaka). Male speakers get Keita
  TTS automatically.

## Register
${REGISTER_LINE}

## Hard rules to self-check EVERY step against (see authoring-invariants-pinned.md)
1. 18-24 steps; no two adjacent same-type; ≤2 selection-taps in a row;
   ≥5 distinct step types; close on match_pairs (inv 15/25).
2. One -capstone integration step per teaching lesson, before the tail,
   combining ≥2 earlier-module concepts (inv 26).
3. Imageable new atom debuts on word_image_mcq; lesson never opens on a
   dialogue; word established before sentence/dialogue use (inv 30).
4. Teach element-drops explicitly (verbs take no だ; antiPattern たべるだ)
   (inv 31).
5. NO full-sentence recognition MCQs (test-out only) — use build (inv 28).
6. NO theatrics in ANY prompt (build/translate/speaking AND LC question):
   plain "Build: X" / "What does this mean?"; no scenario, no internal
   sentence period (inv 29).
7. Persona canon consistent; dialogue questions grade on STATED facts;
   no sentence surface used >3× per lesson (inv 21/22/24).
8. Every new word debuts on an intro-capable step before any option set;
   grammar antiPattern must be genuinely WRONG Japanese (inv 12/24).
9. Register cue only where it changes the answer; だ-drop accepted in
   translate acceptedAnswers (inv 8).
10. NOBODY LIKES A PERSON. 好き/きらい take a thing, place, food, or a
   nominalized clause — never a human. 〜が すき does not distinguish
   liking from attraction, so a person in the liked slot reads as a
   confession, and worse when it is a child. 「Xが すきな Y」 (the Y that
   X likes) is a different construction and is fine (inv 50).

## Self-check protocol (do this AS you author, per lesson — not at the end)
After drafting EACH lesson, before moving to the next:
  (a) tokenize every Japanese surface — is each word in the "already
      knows" list above or this module's allocation? If not, STOP and fix.
  (b) does any sentence contradict canon or an earlier lesson's facts?
  (c) run the guard suite on the lessons drafted SO FAR:
      registerModuleBarGuards({ moduleLabel, lessons: <drafted so far>,
        priorModules: [...m1..m${targetIdx - 1}], canon: COURSE_CANON,
        minLessons: <omit until all 12 done>, requireCapstone: true,
        requireImageFirst: true })
      via a throwaway test — fix failures immediately, then continue.
This catches contradictions AS they happen, not in a post-hoc walk.
`;

process.stdout.write(out);
