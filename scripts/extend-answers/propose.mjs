#!/usr/bin/env node
/**
 * Extend-answers lane — Step 2: propose extended sentences with a local
 * Ollama model, constrained to a JSON schema. Mirrors
 * scripts/naturalness/judge.mjs's driver pattern (REST /api/chat, `format` =
 * JSON schema, think:false default, low temperature, checkpointed resumable
 * JSONL, one Ollama model resident at a time).
 *
 * Usage:
 *   node scripts/extend-answers/propose.mjs
 *     Reads  <EXTEND_DIR>/rows.jsonl
 *     Writes <EXTEND_DIR>/proposals.jsonl (checkpointed, resumable by stepId)
 *            <EXTEND_DIR>/propose-failures.jsonl (batches that never validated)
 *            <EXTEND_DIR>/propose-stats.json
 *
 *   node scripts/extend-answers/propose.mjs --retry <rejects.jsonl>
 *     Re-proposes ONLY the stepIds in rejects.jsonl with eligibleForRetry
 *     true, appending the specific gate reason to the prompt. Overwrites
 *     those rows' entries in proposals.jsonl (marked retry:true) so a
 *     second gate pass sees fresh candidates. This is the lane's "one
 *     retry" - propose.mjs --retry is called at most once per rejected row.
 *
 * No repo content edits. Reads only scratchpad + read-only rows.jsonl.
 */
import fs from "node:fs";
import path from "node:path";

const EXTEND_DIR =
  process.env.EXTEND_DIR ||
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/extend";
fs.mkdirSync(EXTEND_DIR, { recursive: true });

const OLLAMA_URL = "http://localhost:11434";
export const MODEL = process.env.EXTEND_MODEL || "gemma4-31b-256k:latest";
const BATCH_SIZE = Number(process.env.EXTEND_BATCH_SIZE || 9);
const CONCURRENCY = Number(process.env.EXTEND_CONCURRENCY || 1);
const TEMPERATURE = 0.2;
// 2026-09-15: judge.mjs measured think:false as 5x faster at equal verdict
// quality for gemma4-31b — same default here; override with EXTEND_THINK=true.
const THINK = process.env.EXTEND_THINK ? process.env.EXTEND_THINK === "true" : false;

const ROWS_FILE = path.join(EXTEND_DIR, "rows.jsonl");
const OUT_FILE = path.join(EXTEND_DIR, "proposals.jsonl");
const FAIL_FILE = path.join(EXTEND_DIR, "propose-failures.jsonl");
const STATS_FILE = path.join(EXTEND_DIR, "propose-stats.json");

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You extend short Japanese sentences in a beginner/intermediate course so each has at least 5 tiles (bunsetsu word-tokens, particles counted separately), without changing the grammar point being taught or the sentence's core meaning.

Plain rules:
1. Add ONE OR TWO more words to the sentence — do not rewrite it. Good additions, in this PREFERENCE ORDER: (1) an object (を-marked noun), (2) a place with で or に (がっこうで, いえに…), (3) a demonstrative + noun (この/その/あの + noun), (4) an adjective placed before a noun the sentence already has, (5) a named subject — a real name or role noun, NEVER a pronoun (ミカが, たなかさんは — see rule 1a), (6) a second clause element (another word inside a から/て clause the sentence already has), (7) an adverb, (8) a time word (きのう, あした, まいにち…). Prefer the smallest addition that reaches 5 tiles. Use AT MOST ONE time word per sentence. Vary which category you reach for across different rows instead of defaulting to the same category every time.
1a. ADDING A BARE SUBJECT PRONOUN DOES NOT COUNT AS A VALID ADDITION. わたし, ぼく, あなた, かれ, かのじょ, わたしたち are never legal entries in "added" — natural Japanese drops the subject when it's obvious from context, so prepending わたしは only pads the tile count without adding real content, and it is always rejected downstream. Never produce a candidate whose only new word is a pronoun. Relatedly: never produce a sentence with は on two different bunsetsu (a double topic, e.g. わたしは あしたは …) — if the original sentence's topic already ends in は, do not add a second は-marked phrase.
1b. NEVER write a particle as its own space-separated bunsetsu. Always attach it to the word it marks, in the SAME bunsetsu: write ここで as one piece, never "ここ で" as two.
2. THE CLOSED LIST IS THE ONLY SOURCE OF WORDS. Use ONLY words from the "availableWords" list provided for this row, copied EXACTLY as they appear there (same kana, no conjugating them into a new form, no merging a word with a particle into one string). Common intensifiers like とても, すごく, かなり are NOT automatically available — if the word you want is not literally an entry in "availableWords" for THIS row, you cannot use it, no matter how basic it seems. Particles (は, が, を, に, で, と, の, も, へ, から, まで, より, か, ね, よ), the copula (だ, な), and verb/adjective endings (ます, ません, た, て, でした, ではない, じゃない, etc.) are always free to use — they are grammar, not vocabulary, and are never counted against the closed list.
3. Keep the grammar point being taught: every original content word must still appear (in the same conjugated form or a form the original grammar point covers), and the point should read as the exact same phenomenon after your edit.
4. Keep the meaning. Do not change what the sentence says beyond what your addition contributes.
5. Keep the politeness level exactly as given — a plain-form sentence (だ/plain verb endings, no です/ます) stays plain; a polite sentence (です/ます) stays polite.
6. Write the new English gloss as the closest 1-to-1 US English translation of your new sentence — no register notes baked into the text (register commentary, if any, goes in "note"). Keep the English a sentence a real person would say — never an over-literal or clause-stuffed translation like "When I've eaten my meal now, I'll sleep." If your English gloss reads awkwardly, your Japanese addition is probably wrong too — simplify.
6a. YOUR ADDITION MUST FIT THE SPEECH ACT, not just be grammatically attachable. A congratulation (おめでとう) does not naturally take a future time word — "Happy birthday to my older sister tomorrow" is not something anyone says, even though the grammar parses. A request (ください) does not naturally take an arbitrary place phrase — "Water here, please" reads forced. Ask yourself whether a real person would actually say your new sentence in that situation, not just whether it is grammatical.
7. The final tiles array is 5 to 9 tiles, inclusive. If your first idea would be longer than 9, trim the addition instead of dropping original content.
8. Never produce a sentence identical (after removing spaces/punctuation) to any sentence already in "lessonSentences" for this row, or to your own other candidate.
9. The result should sound like an average 30-year-old speaking today — natural, not textbook-stiff.

For each row, return TWO candidates (try two DIFFERENT categories from rule 1 so a downstream check has a real choice, not two near-duplicates). Each candidate: {ja, en, tiles, added, confidence, note}.
  - ja: the full new sentence, bunsetsu space-separated the same way the input "ja" is.
  - en: the new English gloss (rule 6).
  - tiles: your best guess at the tile breakdown (informational only, a downstream tokenizer re-derives the real count).
  - added: the word(s) you inserted, EACH ONE copied verbatim from "availableWords" as its own array entry (never glue a word and a particle together into one "added" entry — write them as they appear in "ja", split at the same word boundary).
  - confidence: 0-1, your certainty this candidate is correct and natural.
  - note: short, plain, any caveat (empty string if none).

Return exactly one object per row_id/stepId in the input, in the same order, with candidates as described.`;

const WORKED_EXAMPLES = [
  {
    stepId: "example-1",
    ja: "やまは おおきい",
    availableWords_hint: "available for this row: きょう, あそこ. とても is NOT in this row's list — do not use it just because it feels like an obvious adjective intensifier.",
    candidates: [
      {
        ja: "あそこの やまは おおきい",
        en: "That mountain over there is big.",
        tiles: ["あそこ", "の", "やま", "は", "おおきい"],
        added: ["あそこ"],
        confidence: 0.85,
        note: "A single place/attributive word (あそこ, from availableWords) already reaches 5 tiles — preferred over reaching for a time word or an intensifier that isn't in the list.",
      },
      {
        ja: "きょう あそこの やまは おおきい",
        en: "That mountain over there is big today.",
        tiles: ["きょう", "あそこ", "の", "やま", "は", "おおきい"],
        added: ["きょう", "あそこ"],
        confidence: 0.7,
        note: "A second option stacking a time word on top of the place phrase — offered as the lower-priority alternative, not the first choice.",
      },
    ],
  },
  {
    stepId: "example-2",
    ja: "ふるい いえに いく",
    availableWords_hint: "object/place words available: がっこう, ともだち",
    candidates: [
      {
        ja: "きのう ともだちと ふるい いえに いく",
        en: "I'm going to an old house with a friend yesterday.",
        tiles: ["きのう", "ともだち", "と", "ふるい", "いえ", "に", "いく"],
        added: ["きのう", "ともだちと"],
        confidence: 0.55,
        note: "REJECTED SHAPE — きのう (yesterday) cannot combine with plain non-past いく; do not mix a past time word into a non-past verb. This candidate is shown so you avoid this exact mistake.",
      },
      {
        ja: "まいにち ともだちと ふるい いえに いく",
        en: "I go to an old house with a friend every day.",
        tiles: ["まいにち", "ともだち", "と", "ふるい", "いえ", "に", "いく"],
        added: ["まいにち", "ともだちと"],
        confidence: 0.85,
        note: "Habitual time word matches the non-past いく; ni-location and the object-drop grammar point both survive.",
      },
    ],
  },
  {
    stepId: "example-3",
    ja: "どれが いちばん おもい？",
    availableWords_hint: "available for this row: ここ. なか ('among/inside') is NOT in this row's list — なかで would sound natural but is not allowed here.",
    candidates: [
      {
        ja: "この なかで どれが いちばん おもい？",
        en: "Among these, which one is the heaviest?",
        tiles: ["この", "なか", "で", "どれ", "が", "いちばん", "おもい？"],
        added: ["この", "なかで"],
        confidence: 0.4,
        note: "REJECTED SHAPE — なか is not literally in this row's availableWords, even though 'among/inside' feels like an obvious word to reach for. Never use a word from general Japanese knowledge; only ones copied verbatim from the list. Also wrong: 'なかで' glues a word and a particle into one added-array entry instead of splitting them.",
      },
      {
        ja: "ここで どれが いちばん おもい？",
        en: "Here, which one is the heaviest?",
        tiles: ["ここ", "で", "どれ", "が", "いちばん", "おもい？"],
        added: ["ここ"],
        confidence: 0.85,
        note: "Place phrase built only from ここ (in availableWords) plus the free で particle; this is the preferred candidate.",
      },
    ],
  },
  {
    stepId: "example-4",
    ja: "ほんは たかいです",
    availableWords_hint: "available for this row: としょかん (place). とても is NOT in this row's list.",
    candidates: [
      {
        ja: "この ほんは とても たかいです",
        en: "This book is very expensive.",
        tiles: ["この", "ほん", "は", "とても", "たかい", "です"],
        added: ["この", "とても"],
        confidence: 0.3,
        note: "REJECTED SHAPE — とても is a common intensifier but not in this row's availableWords; do not add it just because it sounds natural.",
      },
      {
        ja: "としょかんの ほんは たかいです",
        en: "The library's book is expensive.",
        tiles: ["としょかん", "の", "ほん", "は", "たかい", "です"],
        added: ["としょかん"],
        confidence: 0.85,
        note: "Possessive prenominal noun phrase built only from としょかん (availableWords) plus the free の particle — added array has one entry, not 'としょかんの' glued together. です kept exactly, not conjugated.",
      },
    ],
  },
  {
    stepId: "example-5",
    ja: "あしたは いそがしいんだ",
    availableWords_hint:
      "available for this row: ちょっと (adverb). Do NOT add わたしは — the subject is already obvious from context, and it would create a double topic with あしたは.",
    candidates: [
      {
        ja: "わたしは あしたは いそがしいんだ",
        en: "I'm busy tomorrow.",
        tiles: ["わたし", "は", "あした", "は", "いそがしい", "んだ"],
        added: ["わたし"],
        confidence: 0.2,
        note: "REJECTED SHAPE — わたし is a bare pronoun (rule 1a), never a valid addition on its own. This also creates a DOUBLE TOPIC (は on both わたしは and あしたは), which no native speaker produces.",
      },
      {
        ja: "あしたは ちょっと いそがしいんだ",
        en: "I'm a little busy tomorrow.",
        tiles: ["あした", "は", "ちょっと", "いそがしい", "んだ"],
        added: ["ちょっと"],
        confidence: 0.9,
        note: "Adverb addition; single topic (あしたは only), no pronoun padding.",
      },
    ],
  },
  {
    stepId: "example-6",
    ja: "あねの たんじょうび おめでとう",
    availableWords_hint: "available for this row: ほんとうに (adverb, 'really/truly').",
    candidates: [
      {
        ja: "あした あねの たんじょうび おめでとう",
        en: "Happy birthday to my older sister tomorrow.",
        tiles: ["あした", "あね", "の", "たんじょうび", "おめでとう"],
        added: ["あした"],
        confidence: 0.2,
        note: "REJECTED SHAPE (rule 6a) — a congratulation (おめでとう) does not naturally take a future time word. 'Happy birthday tomorrow' is not something anyone actually says, even though あした might be grammatically attachable and even in the list.",
      },
      {
        ja: "あねの たんじょうび ほんとうに おめでとう",
        en: "Happy birthday to my older sister, really!",
        tiles: ["あね", "の", "たんじょうび", "ほんとうに", "おめでとう"],
        added: ["ほんとうに"],
        confidence: 0.85,
        note: "Adverb reaches the tile floor without forcing a time word onto a speech act that doesn't take one.",
      },
    ],
  },
  {
    stepId: "example-7",
    ja: "みずを ください",
    availableWords_hint: "available for this row: つめたい (adjective, 'cold'), ちょっと (adverb, 'a little').",
    candidates: [
      {
        ja: "ここで みずを ください",
        en: "Water here, please.",
        tiles: ["ここ", "で", "みず", "を", "ください"],
        added: ["ここ"],
        confidence: 0.2,
        note: "REJECTED SHAPE (rule 6a) — a place phrase doesn't naturally attach to a bare request like this; 'water here, please' reads forced. A place addition must fit the REQUEST being made, not just be grammatically legal.",
      },
      {
        ja: "ちょっと つめたい みずを ください",
        en: "A little cold water, please.",
        tiles: ["ちょっと", "つめたい", "みず", "を", "ください"],
        added: ["ちょっと", "つめたい"],
        confidence: 0.9,
        note: "Adjective placed before the noun it modifies (rule 1 category 4), plus an adverb — natural, and the request meaning is fully preserved.",
      },
    ],
  },
];

export function buildSchema() {
  return {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            stepId: { type: "string" },
            candidates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ja: { type: "string" },
                  en: { type: "string" },
                  tiles: { type: "array", items: { type: "string" } },
                  added: { type: "array", items: { type: "string" } },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  note: { type: "string" },
                },
                required: ["ja", "en", "tiles", "added", "confidence", "note"],
              },
            },
          },
          required: ["stepId", "candidates"],
        },
      },
    },
    required: ["results"],
  };
}

function buildUserMessage(rows, retryReasons) {
  const compact = rows.map((r) => ({
    stepId: r.stepId,
    ja: r.ja,
    en: r.en,
    tiles: r.tiles,
    grammarIds: r.grammarIds,
    politeness: r.politeness,
    availableWords: r.availableWords,
    lessonSentences: r.lessonSentences,
    ...(retryReasons?.[r.stepId] ? { previousAttemptFailedBecause: retryReasons[r.stepId] } : {}),
  }));
  let msg =
    "Seven worked reference examples (calibration only — do not emit rows for these; example-2 through example-7 each include a REJECTED SHAPE candidate, shown so you can see what NOT to do: words not in availableWords even though they sound natural (とても, なかで), pronoun-padding + double-topic (example-5), and additions that are grammatical but don't fit the speech act (example-6, example-7)):\n" +
    JSON.stringify(WORKED_EXAMPLES) +
    "\n\nNow propose extensions for these rows. Return exactly one result per stepId below, in the same order, stepId copied exactly:\n" +
    JSON.stringify(compact);
  return msg;
}

// ---------------------------------------------------------------------------

async function ollamaChat(userMessage, schema) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      stream: false,
      format: schema,
      think: THINK,
      options: { temperature: TEMPERATURE },
    }),
  });
  if (!res.ok) throw new Error(`ollama http ${res.status}: ${await res.text()}`);
  return res.json();
}

function validate(parsed, expectedIds) {
  if (!parsed || !Array.isArray(parsed.results)) {
    return "top-level object must have a 'results' array";
  }
  if (parsed.results.length !== expectedIds.length) {
    return `expected ${expectedIds.length} results, got ${parsed.results.length}`;
  }
  const gotIds = parsed.results.map((v) => v.stepId);
  const expectedSet = new Set(expectedIds);
  const gotSet = new Set(gotIds);
  if (expectedSet.size !== gotSet.size || [...expectedSet].some((id) => !gotSet.has(id))) {
    return `stepId set mismatch: expected [${expectedIds.join(",")}] got [${gotIds.join(",")}]`;
  }
  for (const v of parsed.results) {
    if (!Array.isArray(v.candidates) || v.candidates.length === 0) {
      return `stepId ${v.stepId}: candidates must be a non-empty array`;
    }
    for (const c of v.candidates) {
      if (!c.ja || !c.en) return `stepId ${v.stepId}: candidate missing ja/en`;
      if (typeof c.confidence !== "number" || c.confidence < 0 || c.confidence > 1) {
        return `stepId ${v.stepId}: confidence must be in [0,1]`;
      }
    }
  }
  return null;
}

async function proposeBatch(rows, schema, stats, retryReasons) {
  const expectedIds = rows.map((r) => r.stepId);
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    let userMessage = buildUserMessage(rows, retryReasons);
    if (lastErr) {
      userMessage += `\n\nYour previous response failed validation with this error - fix it and return valid output for ALL rows again: ${lastErr}`;
    }
    const t0 = Date.now();
    let raw;
    try {
      raw = await ollamaChat(userMessage, schema);
    } catch (err) {
      lastErr = String(err);
      continue;
    }
    stats.calls++;
    stats.wallMs += Date.now() - t0;
    stats.evalCount += raw.eval_count || 0;
    stats.evalDurationNs += raw.eval_duration || 0;

    let parsed;
    try {
      parsed = JSON.parse(raw.message.content);
    } catch (err) {
      lastErr = `response was not valid JSON: ${err.message}`;
      continue;
    }
    const err = validate(parsed, expectedIds);
    if (!err) return { ok: true, results: parsed.results };
    lastErr = err;
  }
  return { ok: false, error: lastErr };
}

async function waitForModelSlot() {
  for (;;) {
    const res = await fetch(`${OLLAMA_URL}/api/ps`);
    const j = await res.json();
    const models = j.models || [];
    const busy = models.filter((m) => m.name !== MODEL);
    if (busy.length === 0) return;
    console.log(
      `propose.mjs: waiting — ${busy.map((m) => `${m.name} (${(m.size / 1e9).toFixed(1)}GB)`).join(", ")} is resident; not loading a second large model.`,
    );
    await new Promise((r) => setTimeout(r, 15000));
  }
}

function loadDoneIds(outFile) {
  const done = new Set();
  if (fs.existsSync(outFile)) {
    for (const line of fs.readFileSync(outFile, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        done.add(JSON.parse(line).stepId);
      } catch {
        /* ignore corrupt trailing line */
      }
    }
  }
  return done;
}

/** Drop existing entries for the given stepIds from a JSONL file (used by
 * --retry to overwrite with fresh candidates rather than append duplicates). */
function pruneEntries(file, stepIds) {
  if (!fs.existsSync(file)) return;
  const keep = fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter((l) => !stepIds.has(JSON.parse(l).stepId));
  fs.writeFileSync(file, keep.length ? keep.join("\n") + "\n" : "");
}

async function main() {
  const args = process.argv.slice(2);
  const retryIdx = args.indexOf("--retry");
  const isRetry = retryIdx !== -1;
  const retryFile = isRetry ? args[retryIdx + 1] : null;

  const allRows = fs
    .readFileSync(ROWS_FILE, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const rowById = new Map(allRows.map((r) => [r.stepId, r]));

  let targetRows;
  let retryReasons = {};
  if (isRetry) {
    const rejects = fs
      .readFileSync(retryFile, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    const eligible = rejects.filter((r) => r.eligibleForRetry && rowById.has(r.stepId));
    targetRows = eligible.map((r) => rowById.get(r.stepId));
    for (const r of eligible) retryReasons[r.stepId] = (r.reasons || []).join(" | ");
    console.log(`propose.mjs --retry: ${targetRows.length} rows eligible for retry`);
    pruneEntries(OUT_FILE, new Set(targetRows.map((r) => r.stepId)));
  } else {
    const done = loadDoneIds(OUT_FILE);
    targetRows = allRows.filter((r) => !done.has(r.stepId));
    console.log(
      `propose.mjs: ${allRows.length} total rows, ${done.size} already proposed, ${targetRows.length} remaining`,
    );
  }
  if (targetRows.length === 0) {
    console.log("propose.mjs: nothing to do.");
    return;
  }

  const batches = [];
  for (let i = 0; i < targetRows.length; i += BATCH_SIZE) {
    batches.push(targetRows.slice(i, i + BATCH_SIZE));
  }
  console.log(
    `propose.mjs: ${batches.length} batches of <=${BATCH_SIZE}, concurrency ${CONCURRENCY}, model ${MODEL}, think=${THINK}`,
  );

  await waitForModelSlot();

  const schema = buildSchema();
  const stats = { calls: 0, wallMs: 0, evalCount: 0, evalDurationNs: 0, failedBatches: 0 };
  const runStart = Date.now();

  let nextIdx = 0;
  let completed = 0;
  const worker = async () => {
    for (;;) {
      const idx = nextIdx++;
      if (idx >= batches.length) return;
      const batch = batches[idx];
      const result = await proposeBatch(batch, schema, stats, retryReasons);
      if (result.ok) {
        const lines = result.results
          .map((v) => JSON.stringify({ ...v, retry: isRetry }))
          .join("\n");
        fs.appendFileSync(OUT_FILE, lines + "\n");
      } else {
        stats.failedBatches++;
        fs.appendFileSync(
          FAIL_FILE,
          JSON.stringify({ stepIds: batch.map((r) => r.stepId), error: result.error }) + "\n",
        );
        console.error(`propose.mjs: batch ${idx} FAILED after retry: ${result.error}`);
      }
      completed++;
      if (completed % 5 === 0 || completed === batches.length) {
        const elapsedS = (Date.now() - runStart) / 1000;
        const rate = completed / elapsedS;
        const etaS = (batches.length - completed) / Math.max(rate, 1e-6);
        console.log(
          `propose.mjs: ${completed}/${batches.length} batches done (${elapsedS.toFixed(0)}s elapsed, ETA ${(etaS / 60).toFixed(1)}m)`,
        );
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  fs.writeFileSync(
    STATS_FILE,
    JSON.stringify(
      {
        model: MODEL,
        isRetry,
        rowsProposed: targetRows.length,
        batches: batches.length,
        failedBatches: stats.failedBatches,
        wallTimeS: (Date.now() - runStart) / 1000,
        sPerRow: (Date.now() - runStart) / 1000 / Math.max(targetRows.length, 1),
        genTokPerSec: stats.evalCount / (stats.evalDurationNs / 1e9 || 1),
        totalCalls: stats.calls,
      },
      null,
      2,
    ),
  );
  console.log(`propose.mjs: done. Stats -> ${STATS_FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("propose.mjs: fatal", err);
    process.exit(1);
  });
}
