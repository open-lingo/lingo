#!/usr/bin/env node
/**
 * mt-translate-catalog.mjs — local-model MT drafter for KO-source
 * `<moduleId>.ko.json` sidecars (rung 1b §4 of
 * `docs/ko-source-rung1a-2026-09-10.md`, m6-pilot recipe).
 *
 * Reads the extractor's `<lang>/<moduleId>.en.json` (produced by
 * `extract-content-catalog.mjs`) and drafts a Korean translation for every
 * entry via the local Ollama server, batched to keep each call's context
 * manageable. Output is a DRAFT — per the rung-1a recipe this still needs a
 * Sonnet-subagent fidelity review before it's a ship-ready sidecar; this
 * script only produces the candidate file + a parse/count sanity check.
 *
 * Usage:
 *   node scripts/i18n/mt-translate-catalog.mjs ja m6
 *   node scripts/i18n/mt-translate-catalog.mjs ja m6 --model qwen3.5:122b-a10b-q4_K_M --batch 40
 *   node scripts/i18n/mt-translate-catalog.mjs ja m1 --missing-only   # only anchors absent from the existing .ko.json
 *
 * Model: pinned to the NON-mlx tag explicitly (`local-model-stack.md`'s
 * `ollama/ollama#16563` trap — the `-mlx` variant silently ignores the
 * `format` JSON-schema constraint and returns prose with a 200 OK, which
 * looks like success until something tries to JSON.parse it). Every
 * response is parsed and its length/anchor-set checked against the batch
 * before being accepted; a batch that fails either check is retried once
 * with a smaller batch size, then reported as failed (never silently
 * dropped or silently miscounted).
 *
 * DEFECT-CLASS FIXES (rung 1c, 2026-09-10 — see the report for the full
 * corpus evidence behind each):
 *   1. `kind === "romaji-label"` entries bypass the model entirely — the
 *      "en" IS the correct Korean output (a romaji label like "a" or "ka"
 *      is not translated, it's copied), so any model call on these can only
 *      introduce drift (e.g. transliterating "a" into "아").
 *   2. PINNED instruction prefixes (below) bypass the model for the fixed
 *      portion and send only the variable remainder — the confirmed
 *      "Build this sentence:" 3-way drift (m3/m4/m5 each used a different
 *      Korean rendering in the reviewed corpus; independently named in
 *      `docs/handoff-2026-09-10-overnight-authoring.md:122`) is exactly
 *      this failure mode.
 *   3. Register/pro-drop/mnemonic/names guidance strengthened in the prompt
 *      text itself (docs/ko-content-conventions-2026-09-10.md + its m7
 *      addendum), including a concrete negative example for each rule drawn
 *      from a real drift found in the m1-m8 reviewed corpus this session
 *      (m8's "말하기:" vs m7/canonical "말하세요:"; m8's "타나카" vs the
 *      mandated "다나카").
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { makeGovernor } from "../draft/throttle.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const [lang, moduleId] = positional;
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i > -1 && argv[i + 1] ? argv[i + 1] : d;
};
const MODEL = flag("model", "qwen3.5:122b-a10b-q4_K_M");
const BATCH_SIZE = Number(flag("batch", "40"));
const OUT_DIR = resolve(ROOT, flag("out", "src/shared/i18n/content"));
const MISSING_ONLY = argv.includes("--missing-only");

if (!lang || !moduleId) {
  console.error("Usage: node scripts/i18n/mt-translate-catalog.mjs <lang> <moduleId> [--model <tag>] [--batch <n>] [--out <dir>] [--missing-only]");
  process.exit(2);
}

const enPath = join(OUT_DIR, lang, `${moduleId}.en.json`);
if (!existsSync(enPath)) {
  console.error(`[mt] no ${enPath} — run extract-content-catalog.mjs first`);
  process.exit(1);
}
const enCatalog = JSON.parse(readFileSync(enPath, "utf-8"));
const outPath = join(OUT_DIR, lang, `${moduleId}.ko.json`);

let existingKo = null;
if (MISSING_ONLY) {
  if (!existsSync(outPath)) {
    console.error(`[mt] --missing-only requested but no existing ${outPath} to merge into`);
    process.exit(1);
  }
  existingKo = JSON.parse(readFileSync(outPath, "utf-8"));
}
const existingAnchors = existingKo ? new Set(existingKo.entries.map((e) => e.anchor)) : null;

const LIMIT = flag("limit", null);
const allEntries = LIMIT ? enCatalog.entries.slice(0, Number(LIMIT)) : enCatalog.entries;
const entries = MISSING_ONLY
  ? allEntries.filter((e) => !existingAnchors.has(e.anchor))
  : allEntries;

if (MISSING_ONLY && entries.length === 0) {
  console.log(`[mt] ${moduleId} (${lang}): --missing-only found 0 anchors absent from ${outPath} — nothing to draft`);
  process.exit(0);
}

// ── Pinned-prefix / full-pin table (Deliverable C, docs/ko-content-conventions-2026-09-10.md
// §2 + its m7-review addendum + this session's corpus audit against the
// reviewed m1-m8 .ko.json files). Checked in order, first match wins. `full`
// pins need no model call. `prefix` pins send only the remainder to the
// model and reassemble `pin + translated-remainder`. `template` pins pull a
// single quoted/word remainder, translate THAT, and splice it into a fixed
// Korean sentence frame (the frame itself never touches the model). ──
const FULL_PINS = [
  { re: /^Build what you hear\.$/, ko: "들리는 대로 만들어 보세요." },
  { re: /^\(incorrect\)$/, ko: "(틀림)" },
  { re: /^Match each Japanese word to its meaning \(review\)$/, ko: "각 일본어 단어를 뜻과 연결하세요 (복습)" },
];

const PREFIX_PINS = [
  // Audience-register cues — conventions-doc addendum, canonical form
  // confirmed against the m7 review. m8 drifted to the noun form
  // "...말하기:" instead of the imperative "...말하세요:"; this pin kills
  // that drift regardless of which form the model would otherwise favor.
  { re: /^Say very politely:\s*/, pin: "매우 정중하게 말하세요: " },
  { re: /^Say politely:\s*/, pin: "정중하게 말하세요: " },
  { re: /^Say to a friend:\s*/, pin: "친구에게 말하세요: " },
  { re: /^Say to a teacher:\s*/, pin: "선생님께 말하세요: " },
  // "Build this sentence:" — CONFIRMED 3-way drift in the reviewed corpus
  // (m3: "이 문장을 만들어 보세요:", m4: BOTH that AND "이 문장을 만드세요:"
  // inconsistently, m5: bare "만들기:"). Also named directly in
  // docs/handoff-2026-09-10-overnight-authoring.md:122. Pinned to the
  // conventions doc pin `만들기: <gloss>` (coordinator override of the
  // drafter's 이 문장을 만드세요 pick — the reviewed m5 corpus is the ground truth).
  { re: /^Build this sentence:\s*/, pin: "만들기: " },
  { re: /^Build:\s*/, pin: "만들기: " },
  { re: /^Challenge\s*—\s*/, pin: "도전 — " },
  { re: /^m(\d+) review\s*—\s*/, pin: (m) => `m${m[1]} 복습 — ` },
];

const TEMPLATE_PINS = [
  {
    re: /^Pick the word for "(.+)"$/,
    assemble: (x) => `"${x}"에 해당하는 단어를 고르세요`,
  },
  {
    // Majority form across the reviewed m1-m5 corpus (m1: 33/33, m5: 8/8);
    // minority drift in m2 (3×) and m4 (3×) reordered/re-worded this same
    // instruction — not documented in the conventions doc, added as a new
    // inferred pin from this session's corpus evidence.
    re: /^Listen and build the word for '(.+)'$/,
    assemble: (x) => `'${x}'에 해당하는 단어를 듣고 만들어 보세요`,
  },
];

function classifyPin(en) {
  for (const { re, ko } of FULL_PINS) {
    if (re.test(en)) return { type: "full", ko };
  }
  for (const { re, pin } of PREFIX_PINS) {
    const m = re.exec(en);
    if (m) {
      const prefix = typeof pin === "function" ? pin(m) : pin;
      return { type: "prefix", prefix, remainder: en.slice(m[0].length) };
    }
  }
  for (const { re, assemble } of TEMPLATE_PINS) {
    const m = re.exec(en);
    if (m) return { type: "template", remainder: m[1], assemble };
  }
  return { type: "none" };
}

// ── Category guidance keyed on the extractor's `kind` field (Deliverable A)
// when present — far more reliable than sniffing the anchor shape, which is
// all the old anchorCategory() below could do. Falls back to the anchor
// heuristic for any catalog that predates the `kind` field. ──
const KIND_CATEGORY = {
  "atom-gloss": "vocabulary gloss (atom) — short, dictionary-style, citation -다 form",
  "romaji-label": "romaji label (should not reach the model — bypassed upstream)",
  mnemonic: "kana mnemonic — RE-ANCHOR the imagery for a Korean reader, don't translate the English visual metaphor word-for-word",
  "build-prompt": "build-sentence instruction remainder (its instruction prefix is already pinned separately — translate ONLY the sentence meaning that follows it)",
  "ja-gloss": "gloss keyed to a Japanese sentence — mirror the JA sentence's structure AND register exactly",
  instruction: "plain UI instruction text",
  explanation: "grammar-teaching prose (rule/example/anti-pattern explanation)",
  title: "lesson or step title",
  "mcq-option": "multiple-choice option text",
  "story-theme": "story-mode one-line synopsis (under the story title) — no JA sentence to mirror, translate the English meaning naturally",
  "story-gloss": "story-mode above-level word gloss (Story.glosses[].meaning) — short, dictionary-style like a vocabulary gloss, citation -다 form",
};

function anchorCategory(e) {
  if (e.kind && KIND_CATEGORY[e.kind]) return KIND_CATEGORY[e.kind];
  const anchor = e.anchor;
  if (anchor.includes("/gp:")) return "grammar-point rule/example";
  if (anchor.includes("/atom:")) return "vocabulary gloss";
  if (/\/[^/]+\/ja:/.test(anchor)) return "step prompt/gloss keyed to a Japanese sentence";
  if (/\/[^/]+\/en:/.test(anchor)) return "generic step text (title, instruction, option, hint)";
  return "other";
}

// Pull the Japanese surface (or, for a kana mnemonic, the kana symbol
// itself) out of an anchor when present, so the model has the actual JA
// sentence/word/kana to translate STRUCTURE-TRUE to, not just the (often
// idiomatically-smoothed) English gloss.
function jaSurfaceFromAnchor(anchor) {
  const exMatch = anchor.match(/\/ex:(.+)$/);
  if (exMatch) return exMatch[1];
  const jaMatch = anchor.match(/\/ja:(.+)$/);
  if (jaMatch) return jaMatch[1];
  const atomMatch = anchor.match(/\/atom:([^/]+)\//);
  if (atomMatch) return atomMatch[1];
  const symMatch = anchor.match(/\/symbolIntro:([^/]+)\//);
  if (symMatch) return symMatch[1];
  const glossMatch = anchor.match(/\/gloss:(.+)$/);
  if (glossMatch) return glossMatch[1];
  return null;
}

function buildPrompt(batch) {
  const items = batch.map((e) => {
    const ja = jaSurfaceFromAnchor(e.anchor);
    return {
      anchor: e.anchor,
      category: anchorCategory(e),
      ja: ja ?? undefined,
      en: e.en,
      ...(e.note ? { note: e.note } : {}),
    };
  });
  return `You are translating English learner-facing UI strings from a JAPANESE course into KOREAN, for KOREAN-speaking learners of Japanese.

CRITICAL: translate each "en" string to Korean so it is STRUCTURE-TRUE TO THE JAPANESE ("ja" field, when present), NOT to the English wording. Japanese and Korean share SOV word order and a near 1:1 particle system (が/은/는, を/를, に/에, で/에서, の/의 …), so a structure-true Korean gloss is also natural Korean — do not smooth back toward the loose English phrasing (e.g. English "There's a book" for ほんが ある should become a Korean gloss that mirrors "book-SUBJECT exist(inanimate)", not just a free "책이 있어요" only if that itself is what a Korean speaker would say to parse the JA sentence's structure — prefer the reading that teaches the JA grammar point, matching this course's existing register).

CONVENTIONS (docs/ko-content-conventions-2026-09-10.md — follow exactly):
  - REGISTER: an "Instruction/UI-directive" (Pick/Build/Match, markers) is 해요체 imperative ("~을 고르세요"). A "gloss of a JA sentence" MIRRORS the JA sentence's own register: a JA sentence carrying です/ます/ません/ました/ましょう glosses in 해요체 (-어요/-아요/-예요/-이에요, questions -어요?/-예요?) — e.g. ねこが います。→ "고양이가 있어요."; a plain-form JA sentence (だ/る/ない/た, no です/ます) becomes plain Korean statements (-다/-는다/-ㄴ다, questions -니?), never -어요/-ㅂ니까 — e.g. ねこが いる。→ "고양이가 있다." A "vocab/atom gloss" uses citation -다 form. An audience-register-cue remainder (item carries a "note" about a pinned "Say ...:" prefix) is the sentence to be SAID at that register — translate it plainly; the register cue itself is already pinned onto the front, do not add your own honorific marker on top of it.
  - PRO-DROP: mirror JA subject presence exactly — never add 나는/저는/그는/당신 where the JA has no は/が-marked subject. This applies even inside a pinned remainder (e.g. after "정중하게 말하세요:" — translate only the content, still no inserted subject the JA doesn't have).
  - REGISTER (module-declared, for "ja-gloss"/"build-sentence instruction remainder"/"multiple-choice option text"): this module's declared register (plain or polite, from its IR header) governs when there is no "ja" field to sniff or the item is otherwise ambiguous — plain → -다/-는다/-ㄴ다 statements, questions -니?; never mix in -어요/-ㅂ니까 for a plain-register module even on an option or prefix-remainder item.
  - VOCAB GLOSS — ほしい: gloss ほしい (い-adjective, "want [a thing]") as 갖고 싶다 (want-to-have), never 필요하다 (need) or 원하다 (too generic/formal) — a confirmed drift class in the reviewed corpus.
  - NAMES: transliterate Japanese personal names using this course's FIXED Korean spellings, never ad hoc — たなか/タナカ/Tanaka → 다나카 (NEVER 타나카; a "타나카" spelling was found in the m8 corpus this session and is a confirmed defect, not a valid alternate). Reuse the identical spelling for the same name across every item in this batch.
  - MNEMONIC RE-ANCHORING: an item with category "kana mnemonic" is an English memory hook for a kana's SHAPE or SOUND (e.g. "looks like a wave"). A literal translation of the English visual metaphor often does not land for a Korean reader — prefer a Korean-natural mnemonic that evokes the same shape/sound connection over a word-for-word translation of the English phrase.
  - Instruction prefixes ("Build:", "Pick the word for...", audience-register cues, etc.) are handled OUTSIDE this prompt by a pinned-prefix table — you will only ever see the variable remainder for those, never the fixed instruction wording itself. Do not re-add an instruction prefix of your own.
  - CUE REGISTER (정중하게 말하세요:): the remainder of a pinned "정중하게 말하세요:" cue renders in 해요체 (-아요/-어요), NEVER 합니다체 — e.g. remainder "I'm sorry" → 미안해요, not 죄송합니다.
  - CUE REGISTER (친구에게 말하세요:): the remainder of a pinned "친구에게 말하세요:" cue renders spoken 해체 (반말: 안 가 / 그래 / 몰라), including past tense as -았어/-었어 (e.g. remainder "I went" → 갔어, NEVER 갔다), NEVER the written plain form -는다/-ㄴ다/-았다/-었다 and NEVER 합니다체/해요체 — e.g. remainder "I don't know" → 몰라, not 모른다 or 모릅니다; and NEVER add a demonstrative (그/이/저) the JA doesn't have — mirror a bare JA noun as a bare Korean noun, e.g. remainder for a bare 本 → 책, not 그 책.
  - CUE REGISTER (선생님께 말하세요:): the remainder of a pinned "선생님께 말하세요:" cue is a self-statement in 합니다체, with -겠- only when the JA is volitional — e.g. remainder "I'll go" → 가겠습니다, but a plain statement "I'm a student" → 학생입니다, not 학생이겠습니다.
  - YES/NO WORDS: ううん (dispreferred "no") → 아니, NEVER 응; はい/うん ("yes") → 네/응 respectively; "아니오" is not a word — use 아니요 (polite) or 아니 (plain) — e.g. ううん、ちがう。→ 아니, 아니야.
  - MNEMONIC TEMPLATE: a "kana mnemonic" item's Korean text is exactly the template 한국어 '<hangul>'와 비슷한 소리 (문화체육관광부 transliteration), never an English-pun explanation — e.g. あ → 한국어 '아'와 비슷한 소리.
  - EN-ANCHORED, NO JA SUBJECT: an item with no "ja" field (e.g. "multiple-choice option text") carries no JA subject to mirror — never add 저는/나는/저/나 unless the "en" text itself has an explicit subject pronoun AND the missing JA would mark it; default to subject-less Korean, e.g. EN "Cold" (mcq-option) → 추워요, not 저는 추워요.
  - SENTENCE FORMS: a full sentence is never left in the bare dictionary form (-다 stem); conjugate it to the register the item's register rule selects (해요체 → 놀아요, 해체 → 놀아, plain written → 논다, 합니다체 → 놉니다) — e.g. EN "I play with a friend on Thursday" (plain) → 목요일에 친구와 논다, not 놀다.
  - RELATIVE-TIME NOUNS: 올해/작년/다음 달 and similar bare JA time nouns take NO 에 particle when the JA itself has none — mirror the bare noun, don't add 에.

Categories in this batch, and how to handle each:
  - "grammar-point rule/example" / "explanation": explains or exemplifies a JA grammar point (existence verbs ある/いる, negation via ～ない, location questions, spatial relations こ/そ/あ demonstratives). Keep terminology consistent with how a Korean-language JA-grammar course would name these forms. An "en" of exactly "(incorrect)" marks a deliberately WRONG example sentence — translate it as a short Korean equivalent marker (e.g. "(틀림)"), never as a full sentence.
  - "vocabulary gloss (atom)": a single word/phrase meaning — keep it short, dictionary-style, matching the English's register (a "shortGloss" entry pairs with a longer "gloss" entry for the same word; keep the short one shorter).
  - "gloss keyed to a Japanese sentence" / "build-sentence instruction remainder": instructional or gloss text tied to one JA sentence. Give a structure-true Korean rendering of the meaning; if this item's "note" says its instruction prefix is already pinned, translate ONLY the sentence content, no prefix of your own.
  - "kana mnemonic": see MNEMONIC RE-ANCHORING above.
  - "plain UI instruction text" / "lesson or step title" / "multiple-choice option text": UI chrome. Translate naturally; these are not grammar-teaching content.
  - "story-mode one-line synopsis": a short scene-setting line under a story title (e.g. "A cold" or "Ken gets sick and stays home"). Translate the English meaning naturally into Korean prose; there is no JA sentence to mirror.
  - "story-mode above-level word gloss": a single word/phrase meaning for a word used in a story before the learner has formally studied it — treat exactly like "vocabulary gloss (atom)" (short, dictionary-style, citation -다 form).

Return ONLY a JSON array, one object per input item, in the SAME ORDER, each shaped exactly {"anchor": "<the input anchor, verbatim>", "text": "<Korean translation>"}. Do not add, drop, reorder, or merge items — the array must have exactly ${items.length} objects, one per input anchor below.

INPUT (${items.length} items):
${JSON.stringify(items, null, 1)}`;
}

const SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      anchor: { type: "string" },
      text: { type: "string" },
    },
    required: ["anchor", "text"],
    additionalProperties: false,
  },
};

async function callModel(prompt, numPredict) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      think: false,
      format: SCHEMA,
      options: {
        num_ctx: 16384,
        num_predict: numPredict,
        temperature: 0.3,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const j = await res.json();
  return JSON.parse(j.response);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Split entries into: resolved without a model call (romaji-label copy,
// full pins) vs. needing a model call (everything else — with prefix/
// template-pin entries substituting their REMAINDER for `en` so the model
// never sees the fixed instruction wording). ──
const verbatimByAnchor = new Map(); // final text, no model call
const pinPost = new Map(); // anchor -> (modelText) => finalText, for prefix/template entries
const modelEntries = [];

for (const e of entries) {
  if (e.kind === "romaji-label") {
    verbatimByAnchor.set(e.anchor, e.en);
    continue;
  }
  const pin = classifyPin(e.en);
  if (pin.type === "full") {
    verbatimByAnchor.set(e.anchor, pin.ko);
    continue;
  }
  if (pin.type === "prefix") {
    if (pin.remainder.trim().length === 0) {
      // Pure-prefix string with nothing left to translate (rare, but a
      // fixed pin covers the whole en text) — no model call needed.
      verbatimByAnchor.set(e.anchor, pin.prefix.trimEnd());
      continue;
    }
    pinPost.set(e.anchor, (modelText) => pin.prefix + modelText);
    modelEntries.push({ ...e, en: pin.remainder, note: "prefix already pinned; translate ONLY this remainder" });
    continue;
  }
  if (pin.type === "template") {
    pinPost.set(e.anchor, (modelText) => pin.assemble(modelText));
    modelEntries.push({ ...e, en: pin.remainder, note: "this is a single word/phrase to translate, which will be spliced into a fixed Korean sentence frame" });
    continue;
  }
  modelEntries.push(e);
}

const gov = makeGovernor({ duty: 0.85, label: "mt-translate" });
const batches = chunk(modelEntries, BATCH_SIZE);
console.log(
  `[mt] ${moduleId} (${lang}): ${entries.length} entries` +
    (MISSING_ONLY ? ` (missing-only, ${allEntries.length} total)` : "") +
    ` — ${verbatimByAnchor.size} resolved without a model call (romaji-label/pinned), ${modelEntries.length} to the model in ${batches.length} batches of up to ${BATCH_SIZE}, model=${MODEL}`,
);

const byAnchor = new Map(); // raw model output, keyed by anchor
let failedBatches = 0;

async function translateAttempt(attemptBatch, label) {
  const t0 = Date.now();
  const prompt = buildPrompt(attemptBatch);
  const draft = await gov.run(() => callModel(prompt, Math.max(3500, attemptBatch.length * 90)));
  if (!Array.isArray(draft) || draft.length !== attemptBatch.length) {
    throw new Error(`expected ${attemptBatch.length} items, got ${Array.isArray(draft) ? draft.length : typeof draft}`);
  }
  const inputAnchors = new Set(attemptBatch.map((e) => e.anchor));
  for (const item of draft) {
    if (!inputAnchors.has(item.anchor)) {
      throw new Error(`anchor mismatch: "${item.anchor}" not in input batch`);
    }
  }
  for (const item of draft) byAnchor.set(item.anchor, item.text);
  console.log(`[mt] ${label} (${attemptBatch.length}) ok in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const label = `batch ${i + 1}/${batches.length}`;
  try {
    await translateAttempt(batch, label);
    continue; // success — do NOT also run the fallback split attempts
  } catch (e) {
    console.error(`[mt] ${label} FAILED whole: ${e.message} — retrying as two half-batches`);
    failedBatches++;
  }
  if (batch.length <= 4) {
    console.error(`[mt] ${label} too small to split further — giving up on this batch`);
    continue;
  }
  const mid = Math.ceil(batch.length / 2);
  for (const half of [batch.slice(0, mid), batch.slice(mid)]) {
    try {
      await translateAttempt(half, `${label} half(${half.length})`);
    } catch (e) {
      console.error(`[mt] ${label} half(${half.length}) FAILED: ${e.message}`);
      failedBatches++;
    }
  }
}

// ── Final assembly: verbatim resolutions + pin reassembly over raw model
// output + anything sent to the model unpinned. ──
const finalByAnchor = new Map(verbatimByAnchor);
for (const e of entries) {
  if (finalByAnchor.has(e.anchor)) continue;
  if (!byAnchor.has(e.anchor)) continue;
  const raw = byAnchor.get(e.anchor);
  const post = pinPost.get(e.anchor);
  finalByAnchor.set(e.anchor, post ? post(raw) : raw);
}

const newKoEntries = entries
  .filter((e) => finalByAnchor.has(e.anchor))
  .map((e) => ({ anchor: e.anchor, text: finalByAnchor.get(e.anchor), enSourceHash: e.enSourceHash }));

const missing = entries.filter((e) => !finalByAnchor.has(e.anchor)).map((e) => e.anchor);

// --missing-only preserves every existing entry byte-for-byte; new anchors
// are appended (never re-translates or reorders what's already there).
const koEntries = MISSING_ONLY ? [...existingKo.entries, ...newKoEntries] : newKoEntries;

const koCatalog = {
  schema: 1,
  moduleId,
  lang: "ko",
  generatedAt: new Date().toISOString().slice(0, 10),
  draftedBy: MODEL,
  entryCount: koEntries.length,
  entries: koEntries,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(koCatalog, null, 2) + "\n");

console.log(`[mt] wrote ${koEntries.length}${MISSING_ONLY ? ` (${newKoEntries.length} new + ${existingKo.entries.length} preserved)` : ""}/${MISSING_ONLY ? allEntries.length : entries.length} entries → ${outPath}`);
if (missing.length) {
  console.log(`[mt] MISSING (${missing.length}):`);
  for (const a of missing) console.log(`  - ${a}`);
  process.exitCode = 1;
}
const r = gov.report();
console.log(`[mt] wall ${(r.wallMs / 1000 / 60).toFixed(1)}min busy ${(r.busyMs / 1000 / 60).toFixed(1)}min`);
