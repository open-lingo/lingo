#!/usr/bin/env node
/**
 * Reads the hiragana curriculum (TS source) and emits a flat JSON deck of
 * every phrase that needs TTS audio. The Python TTS generator picks up
 * `lingo-data/data/test_decks/*.json`, so this writes there.
 *
 * Re-run whenever the curriculum changes:
 *   node scripts/emit-tts-deck.mjs
 *   (then) cd ../lingo-data && python -m pipeline.tts.generate \
 *           --lang ja --provider edge
 *
 * Generation writes mp3s to `lingo-data/out/tts`; `pipeline.tts.emit_manifest`
 * + `pipeline.tts.upload` publish them to CloudFront. The app never sees a
 * path table — it derives `tts/v1/<lang>/<hash>.mp3` from
 * sha256("<lang>:<text>")[:16] (src/shared/tts/manifest.ts).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../src/features/lesson/data");
// 2026-06 multi-language restructure moved the JA curriculum out of
// lesson/data into languages/ja/curriculum (module files lost the
// "mock-ja-" prefix). hiraganaCurriculum.ts stayed behind.
const JA_CURRICULUM_DIR = resolve(
  __dirname,
  "../src/features/languages/ja/curriculum",
);
const CURRICULUM = resolve(DATA_DIR, "hiraganaCurriculum.ts");
const OUT = resolve(
  __dirname,
  "../../lingo-data/data/test_decks/ja-hiragana-curriculum.json",
);

// Sources to scan. Curriculum is the source of truth for kana intros and
// row anchor words; the module files carry hand-authored vocab + words
// referenced in helpers like wordImageMcq / listeningBuild / speaking /
// listeningComp.
// Authored grammar-review pools (Track B) live outside the curriculum dir but
// carry cloze audioText + sentenceMcq correctKana that need TTS clips too.
const GRAMMAR_POOLS = resolve(DATA_DIR, "grammarReviewPools.ts");
// courseAtoms is the review-tail draw pool: buildReviewTailSteps picks
// atoms struggle-weighted at RUNTIME, so any atom kana can end up in a
// listening step. 2026-07-12 audit found 7 atom words with no clip →
// silent listening steps. Scanning the atom table closes the class.
const COURSE_ATOMS = resolve(
  __dirname,
  "../src/features/languages/ja/courseAtoms.ts",
);
const sources = [CURRICULUM, GRAMMAR_POOLS, COURSE_ATOMS];
for (const f of readdirSync(JA_CURRICULUM_DIR)) {
  if (
    /^(m\d+(-[\w-]+)?|sidequest(-[\w-]+)?|katakanaRows)\.ts$/.test(f)
  ) {
    sources.push(join(JA_CURRICULUM_DIR, f));
  }
}

// CONTENT-IR MODULES (added 2026-07-26). Modules authored through the
// compiler pipeline keep their Japanese in `ir/m<N>.ir.yaml`, not in a
// `.ts` file — `m<N>-neo.ts` only calls compileModule(). Without this the
// emitter silently skipped every IR module's sentences and the manifest
// check passed while the lessons were mute. The YAML's `ja: "…"` lines are
// picked up by the existing `ja:` pattern below; dialogue lines use the
// same key, so they come along too.
const JA_IR_DIR = join(JA_CURRICULUM_DIR, "ir");
try {
  for (const f of readdirSync(JA_IR_DIR)) {
    if (/\.ir\.yaml$/.test(f)) sources.push(join(JA_IR_DIR, f));
  }
} catch {
  // no ir/ directory yet — fine
}

const kanaSet = new Set();

for (const path of sources) {
  const src = readFileSync(path, "utf-8");
  // Single-line capture patterns. Covers:
  //   { kana: "X" }, word: "X", answer: "X", correctKana = "X",
  //   targetSentence/audioKey/targetPhrase: "X", listeningComp(... "X" ...).
  for (const re of [
    /kana:\s*"([^"]+)"/g,
    /word:\s*"([^"]+)"/g,
    /answer:\s*"([^"]+)"/g,
    /correctKana:\s*"([^"]+)"/g,
    /targetSentence:\s*"([^"]+)"/g,
    /targetPhrase:\s*"([^"]+)"/g,
    // listeningBuildSentence({ target: "…" }) — the factory maps `target`
    // to the step's audioKey at runtime, so it needs a clip. (Gap found
    // 2026-07-01: keyed `target:` was never captured; JA_ONLY filters out
    // the English match_pairs `target:` values this also matches.)
    /\btarget:\s*"([^"]+)"/g,
    /audioKey:\s*"([^"]+)"/g,
    /transcript:\s*"([^"]+)"/g,
    /promptAudioText:\s*"([^"]+)"/g,
    /audioText:\s*"([^"]+)"/g,
    /ja:\s*"([^"]+)"/g,
    // IR `kind: listening-comp` carries its stimulus as `audio:` — a field
    // no other pattern here matches, so authored LC beats shipped silently
    // clipless until 2026-07-27.
    /\baudio:\s*"([^"]+)"/g,
    // Positional args: wordImageMcq("id", "あい"), listeningBuild("id", "あい", "love"),
    // speaking("id", "あい", "love"), listeningComp("id", "あい", "romaji", ...).
    // The optional leading arg is any RowContext identifier (ctx, saCtx,
    // waCtx… — the katakana rows name theirs per-row).
    /\b(?:wordImageMcq|listeningBuild|speaking|listeningComp|phraseStep)\s*\(\s*(?:\w+,\s*)?"[^"]*",\s*"([^"]+)"/g,
    // build("id", "English prompt", "TARGET", tiles, correctOrder) — the
    // grammar-spine build factory sets audioKey = target (arg 3). Same
    // 2026-07-01 gap as keyed `target:` above.
    /\bbuild\s*\(\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/g,
    // phrase|vocab("id", meaningEn, romaji, "kana", ...) — slot-4 capture.
    // Used by sidequest survival + M3 vocab lessons (the latter uses a
    // `vocab` alias). Kana is positional, not keyed, so the kana: regex
    // above misses it.
    /\b(?:phrase|vocab)\s*\(\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/g,
    // line("id", speaker, meaningEn, romaji, "kana", ...) — slot-5 for
    // M3-9 mini-dialogue factory.
    /\bline\s*\(\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/g,
    // cloze("id", before, after, correctParticle, [options], meaningEn,
    //   "audioText", ...) — positional 7th arg captures the full
    //   assembled sentence audio key. The array arg is matched
    //   lazily across newlines.
    /\bcloze\s*\([^)]*?\]\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/gs,
  ]) {
    for (const m of src.matchAll(re)) kanaSet.add(m[1]);
  }
  for (const m of src.matchAll(/distractors:\s*\[([^\]]+)\]/g)) {
    for (const s of m[1].matchAll(/"([^"]+)"/g)) kanaSet.add(s[1]);
  }
}

// IR-authored modules (compiler pipeline, 2026-07-20): phrases live in
// `curriculum/ir/*.ir.json`, not as string literals in a .ts source, so the
// regexes above miss them (JSON keys are quoted). Extract every audio-bearing
// `ja` surface — sentences, capstones, dialogue lines, assembled clozes — so
// the compiled lessons' audioKeys get clips.
try {
  const IR_DIR = join(JA_CURRICULUM_DIR, "ir");
  for (const f of readdirSync(IR_DIR)) {
    if (!f.endsWith(".ir.json")) continue;
    const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf-8"));
    for (const lesson of ir.lessons ?? []) {
      for (const b of lesson.beats ?? []) {
        if (
          (b.kind === "sentence" || b.kind === "capstone" || b.kind === "challenge") &&
          b.ja
        )
          kanaSet.add(b.ja);
        if (b.kind === "particle-cloze") kanaSet.add(`${b.stem}${b.answer}${b.tail}`);
        if (b.kind === "listening-comp" && b.audio) kanaSet.add(b.audio);
        // Kanji reading ladder: the step's audioText is the KANA reading,
        // played post-commit (it IS the answer). The word is prior-module by
        // construction so a clip usually exists already — but "usually" is
        // exactly how the five silent-line classes shipped.
        if (b.kind === "kanji" && b.kana) kanaSet.add(b.kana);
        if (b.kind === "dialogue") for (const l of b.lines ?? []) if (l.ja) kanaSet.add(l.ja);
      }
    }
    // EVERY declared atom needs a clip, not just the ones that happen to be
    // registered in courseAtoms (2026-07-27, m12). A module may legitimately
    // declare a form in the IR ONLY — m12's adjective cells (たかくない,
    // おおきかった …) are real surfaces via ADJ_ENTRIES, so registering them
    // in courseAtoms would regress flashcard import. But the compiler still
    // renders them: as the conjugation_transform card's `answer` (whose
    // correct-answer audio the view plays), as match-pair tiles, and as
    // speaking/listening filler drawn from the pool. Without this line the
    // whole ramp was mute.
    for (const a of ir.newAtoms ?? []) if (a.kana) kanaSet.add(a.kana);
  }
} catch {
  /* no ir/ dir yet — pre-compiler modules */
}

// Build the deck JSON shape the Python collector expects.
// Accept any string that is purely Japanese script (hiragana, katakana,
// long-vowel mark, punctuation, full-width spaces) — extended from
// hiragana-only when M3 introduced katakana loanwords + multi-word
// sentence audio (2026-05-16).
// ？/！ (full-width, U+FF1F/U+FF01) included since 2026-07-19: the m3-neo
// pilot teaches casual questions by CONTOUR (ねこだ。 vs ねこ？), so the
// ？-suffixed strings must reach the synthesizer as distinct keys — and
// getTtsUrl has no ？-stripping fallback on purpose (falling back to the
// statement clip would destroy the contrast being taught).
const JA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}゙゚ー　-〿？！ ]+$/u;
// Strip trailing 。 so we don't generate separate audio for "X" and "X。"
// — the runtime lookup (tts.ts) falls back to the other variant.
// Sentence-split expansion (2026-07-19): dialogue_listen now plays
// multi-sentence lines sentence-by-sentence with a breathing gap
// (whole-line clips read run-together — Spencer QA). Mirror the split in
// DialogueListenStepView.splitJaSentences so every sentence of every
// captured string has its own clip; the whole-line clip stays too as the
// view's fallback.
for (const t of Array.from(kanaSet)) {
  // Trailing 」 stays attached to its sentence (quoted speech like
  // 「すみません。」 must not shed a lone 」 fragment).
  const parts = (t.match(/[^。？！]+[。？！]?」?/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 1) for (const p of parts) kanaSet.add(p);
}

// PUNCTUATION-STRIPPED TWIN (2026-07-27). `moduleCompiler.clean()` strips
// 。、？！ from every sentence beat before it becomes a step's
// `targetSentence`/`audioText`, so a build of a question is looked up as
// 「なんじに いく」 while the deck only ever held 「なんじに いく？」 — and
// getTtsUrl deliberately has NO ？-stripping fallback (serving the statement
// clip for a question would destroy the contour contrast dialogues teach).
// The result was silent build steps in every IR module that authored a
// question (m11 shipped four). Emit BOTH: the ？-bearing string keeps its
// question intonation for dialogue playback, the stripped twin gives the
// compiled build step something to play.
// The twin must match `clean()` EXACTLY, and clean() changed on 2026-07-28:
// a 、 now becomes a SPACE rather than nothing, because deleting it fused the
// words either side (「うん、いえに いく」 was spoken as 「うんいえに いく」).
// Emit the old comma-deleted form too — clips keyed on it already exist and
// are still referenced by anything not yet recompiled.
for (const t of Array.from(kanaSet)) {
  const spaced = t
    .replace(/、/g, " ")
    .replace(/[。？！]/g, "")
    .replace(/[ 　]+/g, " ")
    .trim();
  if (spaced && spaced !== t) kanaSet.add(spaced);
  const bare = t.replace(/[。、？！]/g, "").trim();
  if (bare && bare !== t) kanaSet.add(bare);
}

const deduped = new Set();
for (const t of kanaSet) {
  if (!JA_ONLY.test(t)) continue;
  deduped.add(t.endsWith("。") ? t.slice(0, -1) : t);
}
const cards = Array.from(deduped)
  .sort()
  .map((t, i) => ({
    id: `hira-${i.toString().padStart(3, "0")}-${t}`,
    front: t,
  }));

// ── Male-speaker dialogue deck (Keita) ─────────────────────────────────
// Dialogue speakers get REAL distinct voices (Spencer 2026-07-19: "just
// generate the two different voices per speaker and do not pitch
// anything"). Male-named speakers' lines (+ sentence splits) go into a
// second deck synthesized with ja-JP-KeitaNeural under `ja-keita:` keys.
// The original synthesizer (lingo-core scripts/tts/gen_keita_dialogue.py) no
// longer exists in any repo; its 679 clips survive only as manifest overrides
// because their hashes aren't reconstructible. `ja-keita` is a first-class
// language in lingo-data's generate.py now, so regenerating from this deck
// retires those overrides.
// Roster shared with DialogueListenStepView so generation and playback cannot
// disagree — they were hand-copied twins holding only the romanized names,
// which left every kana-labelled male speaker (トム/たけし/たなか/ケン) playing
// the female Nanami voice.
const MALE_SPEAKERS = new Set(
  JSON.parse(
    readFileSync(
      new URL("../src/features/languages/ja/dialogueSpeakers.json", import.meta.url),
      "utf-8",
    ),
  ).male,
);
const keitaSet = new Set();
const nanamiSet = new Set();
for (const path of sources) {
  const src = readFileSync(path, "utf-8");
  for (const m of src.matchAll(
    /speaker:\s*"([^"]+)",\s*kana:\s*"([^"]+)"(?:,\s*audioText:\s*"([^"]+)")?/g,
  )) {
    const bucket = MALE_SPEAKERS.has(m[1]) ? keitaSet : nanamiSet;
    const text = m[3] ?? m[2];
    for (const t of [text, ...(text.match(/[^。？！]+[。？！]?」?/g) ?? [])]) {
      const trimmed = t.trim();
      if (!JA_ONLY.test(trimmed)) continue;
      bucket.add(trimmed.endsWith("。") ? trimmed.slice(0, -1) : trimmed);
    }
  }
}
// IR-authored modules (compiler pipeline): dialogue lines carry {speaker, ja}
// in ir/*.ir.json. Route by speaker into the same keita/nanami buckets, with
// the same sentence-split so multi-sentence lines get per-sentence clips.
try {
  const IR_DIR = join(JA_CURRICULUM_DIR, "ir");
  for (const f of readdirSync(IR_DIR)) {
    if (!f.endsWith(".ir.json")) continue;
    const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf-8"));
    for (const lesson of ir.lessons ?? [])
      for (const b of lesson.beats ?? [])
        if (b.kind === "dialogue")
          for (const l of b.lines ?? []) {
            const bucket = MALE_SPEAKERS.has(l.speaker) ? keitaSet : nanamiSet;
            const text = l.ja ?? "";
            for (const t of [text, ...(text.match(/[^。？！]+[。？！]?」?/g) ?? [])]) {
              const trimmed = t.trim();
              if (!JA_ONLY.test(trimmed)) continue;
              bucket.add(trimmed.endsWith("。") ? trimmed.slice(0, -1) : trimmed);
            }
          }
  }
} catch {
  /* no ir/ dir yet — pre-compiler modules */
}
function writeDialogueDeck(file, name, set, note) {
  const out = resolve(__dirname, `../../lingo-data/data/test_decks/${file}`);
  writeFileSync(
    out,
    JSON.stringify(
      {
        name,
        languageId: name,
        _note: note,
        cards: Array.from(set)
          .sort()
          .map((t, i) => ({ id: `${name}-${i.toString().padStart(3, "0")}-${t}`, front: t })),
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  );
  console.log(`wrote ${set.size} phrases → ${out}`);
}
writeDialogueDeck(
  "ja-keita-dialogue.json",
  "ja-keita-dialogue",
  keitaSet,
  "Male dialogue speakers' lines — synthesized with ja-JP-KeitaNeural under " +
    "ja-keita: keys by lingo-data's pipeline.tts.generate. Auto-emitted.",
);
writeDialogueDeck(
  "ja-nanami-dialogue.json",
  "ja-nanami-dialogue",
  nanamiSet,
  "Female/neutral dialogue speakers' lines — refreshed as ONE Nanami batch " +
    "(consistent takes) by lingo-data's pipeline.tts.generate over plain " +
    "ja: keys. Auto-emitted.",
);

const deck = {
  name: "ja-hiragana-curriculum",
  languageId: "ja",
  _note:
    "Auto-emitted by scripts/emit-tts-deck.mjs from hiraganaCurriculum.ts. " +
    "Edit the curriculum, re-run the script, then run the TTS generator.",
  cards,
};

writeFileSync(OUT, JSON.stringify(deck, null, 2) + "\n", "utf-8");
console.log(`wrote ${cards.length} phrases → ${OUT}`);
