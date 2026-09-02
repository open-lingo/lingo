# Wave C: emoji re-fit pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find every vocab emoji across JA/KO/ES/FR that is a poor or indirect fit or missing, propose replacements with the local 122B, verify them deterministically, hand the frontier a small audit set, generate flat-sticker art where no emoji is honest, and apply the swaps behind a course-wide integrity gate.

**Architecture:** A `scripts/emoji-refit/` pipeline on the `scripts/draft` shape: a vitest emit test dumps the atom inventory (the only faithful way to load all four registries); `score.mjs` calls Ollama in batches of 8 with the rubric in prose and a JSON schema for structure; `check.mjs` is pure deterministic filtering (Noto file exists, no in-course collision, no digit/keycap); the frontier audits only the flagged subset and writes `decisions.json`; `art.mjs` renders custom PNGs with mflux; `apply.mjs` emits search/replace pairs and a report. A shared `courseEmojiIntegrity` test generalizes the ES "one emoji, one word" gate to all courses.

**Tech Stack:** Node 22 ESM scripts, Ollama `qwen3.5:122b-a10b-q4_K_M` at `http://localhost:11434`, Vitest (emit test), `mflux-generate-z-image-turbo`, Python/Pillow post-process from the cast recipe.

**Spec:** `docs/superpowers/specs/2026-09-02-flashcards-mobile-overhaul-design.md` (section D).

## Global Constraints

- Ollama calls: `think: false` at the top level, explicit `num_ctx`, `format: <schema>`, `stream: false`, non-MLX tag `qwen3.5:122b-a10b-q4_K_M`. Categories and rubric go in the PROMPT in prose, never enum-only.
- Every script is resumable: per-batch output written as it goes; re-run skips done batches unless `--force`.
- Outputs go to `--out` (default `artifacts/emoji-refit/`, gitignored). Runs in this wave pass `--out /Users/lichfield/Documents/projects/lingle/lingo/artifacts/emoji-refit` so results survive worktree deletion.
- Emoji strings only change in the four atom registries; never atom ids, SRS keys, or step content. Live IR YAML for JA/ES is updated in the same pass where the atom originates there (the compiled TS must match the YAML or the next compile reverts it).
- Digits and keycaps are never candidates (learner-sim "digit crutch" finding).
- Every new emoji must have its Noto SVG vendored under `src/pub/noto-emoji/svg/` (filename rules in `src/shared/assets/notoEmoji.ts:17-25`: FE0F stripped, ZWJ kept, `_`-joined lowercase hex).
- Stage explicit paths only; commit on the wave worktree branch only; Spencer commits to main after his walk.
- Do not route the Claude Code harness at Ollama; shell out.

---

### Task 1: Inventory emit

**Files:**
- Create: `src/features/languages/__tests__/emojiInventory.emit.test.ts`
- Create: `scripts/emoji-refit/README.md`

**Interfaces:**
- Produces: `<out>/inventory.json` with shape
  ```ts
  type InventoryItem = {
    course: "ja" | "ko" | "es" | "fr";
    id: string;            // canonical atom id, e.g. "ja:ike"
    surface: string;       // display form (kana / hangul / word)
    secondary?: string;    // kanji for JA
    gloss: string;
    kind: "vocab" | "particle" | "phrase" | string;
    module: string;
    emoji?: string;
    srsEligible: boolean;
    blocked?: boolean;     // JA: atom.blocked OR in WORD_IMAGE_MCQ_BLOCKLIST
    note?: string;         // JA authoring note (often explains the emoji)
    pos?: string;          // JA part of speech
  };
  ```
  and a `summary` block `{ perCourse: { [course]: { total, withEmoji, gaps, blocked } } }` where `gaps` = no emoji AND not blocked AND kind in vocab/phrase.

- [ ] **Step 1: Write the emit test**

```ts
// src/features/languages/__tests__/emojiInventory.emit.test.ts
/**
 * EMOJI INVENTORY — every vocab atom in every course with its emoji, for the
 * emoji re-fit pipeline (scripts/emoji-refit/). Runs under vitest because the
 * registries are TS with the vite alias; vite-node is not reliable here.
 *
 *   EMOJI_INVENTORY_EMIT=1 EMOJI_REFIT_OUT=artifacts/emoji-refit \
 *     npx vitest run src/features/languages/__tests__/emojiInventory.emit.test.ts
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { JA_COURSE_ATOMS, canonicalAtomId } from "@/features/languages/ja/courseAtoms";
import { WORD_IMAGE_MCQ_BLOCKLIST } from "@/features/languages/ja/grammarHelpers";

const ENABLED = process.env.EMOJI_INVENTORY_EMIT === "1";
const COURSES = ["ja", "ko", "es", "fr"] as const;

describe.skipIf(!ENABLED)("emoji inventory emit", () => {
  it("writes inventory.json for all four courses", () => {
    const jaExtras = new Map(
      JA_COURSE_ATOMS.map((a) => [
        canonicalAtomId(a),
        {
          blocked: a.blocked === true || WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
          note: a.note,
          pos: a.pos,
        },
      ]),
    );
    const items = COURSES.flatMap((course) =>
      getNormalizedCourseAtoms(course).map((a) => ({
        course,
        id: a.id,
        surface: a.display,
        secondary: a.secondary,
        gloss: a.gloss,
        kind: a.kind,
        module: a.module,
        emoji: a.emoji,
        srsEligible: a.srsEligible,
        ...(course === "ja" ? jaExtras.get(a.id) ?? {} : {}),
      })),
    );
    const perCourse = Object.fromEntries(
      COURSES.map((c) => {
        const rows = items.filter((i) => i.course === c);
        const isWord = (i: (typeof rows)[number]) => i.kind === "vocab" || i.kind === "phrase";
        return [
          c,
          {
            total: rows.length,
            withEmoji: rows.filter((i) => i.emoji).length,
            gaps: rows.filter((i) => !i.emoji && !i.blocked && isWord(i)).length,
            blocked: rows.filter((i) => i.blocked).length,
          },
        ];
      }),
    );
    const out = process.env.EMOJI_REFIT_OUT ?? "artifacts/emoji-refit";
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(
      path.join(out, "inventory.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), summary: { perCourse }, items }, null, 1),
    );
    expect(items.length).toBeGreaterThan(1500);
    for (const c of COURSES) expect(perCourse[c].total).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it**

```bash
EMOJI_INVENTORY_EMIT=1 EMOJI_REFIT_OUT=/Users/lichfield/Documents/projects/lingle/lingo/artifacts/emoji-refit \
  npx vitest run src/features/languages/__tests__/emojiInventory.emit.test.ts
```
Expected: PASS; `inventory.json` exists; print `summary.perCourse` with `node -e` and compare to the mapping counts (JA ≈1020 total / ≈579 with emoji; KO ≈391/169; ES ≈176/81; FR ≈135/62). If `getNormalizedCourseAtoms` for a course throws or returns 0, report which and why (a language module may need registering in the test environment; look at how `courseDeck.test.ts` imports the registries).

- [ ] **Step 3: Confirm the normal suite still skips it**

```bash
npx vitest run src/features/languages/__tests__/emojiInventory.emit.test.ts
```
Expected: 1 skipped, 0 failed.

- [ ] **Step 4: README**

`scripts/emoji-refit/README.md`: the five commands in order (inventory, score, check, audit → decisions.json by hand, art, apply), the `--out` convention, and the rule that the audit step is frontier/human and never automatic.

---

### Task 2: `score.mjs` — local 122B fit scoring and candidates

**Files:**
- Create: `scripts/emoji-refit/score.mjs`
- Create: `scripts/emoji-refit/ollama.mjs` (the one shared call helper for this pipeline)
- Test: `scripts/emoji-refit/score.test.mjs` (node:test, exercises batching/merge with a stubbed fetch)

**Interfaces:**
- Consumes: `<out>/inventory.json` from Task 1.
- Produces: `<out>/scores/<course>-<batchIndex>.json` per batch and a merged `<out>/scores.json`:
  ```ts
  type Score = {
    id: string;
    fit: 1 | 2 | 3 | 4 | 5 | null;   // null when the item has no emoji
    indirect: boolean;               // emoji shows an associated thing, not the meaning
    reason: string;                  // ≤ 20 words
    candidates: string[];            // 0–3 single emoji
  };
  ```

- [ ] **Step 1: Shared Ollama helper**

```js
// scripts/emoji-refit/ollama.mjs
export const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
export const MODEL = process.env.EMOJI_MODEL ?? "qwen3.5:122b-a10b-q4_K_M";

/** One /api/generate call. `think:false` at the top level — with thinking on,
 *  qwen3.5 spends num_predict on hidden reasoning and returns empty content. */
export async function generateJson({ prompt, schema, numCtx = 8192, numPredict = 2048, temperature = 0, model = MODEL, fetchImpl = fetch }) {
  const res = await fetchImpl(`${OLLAMA}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model, prompt, stream: false, think: false, format: schema,
      options: { num_ctx: numCtx, num_predict: numPredict, temperature },
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text()}`);
  const j = await res.json();
  let parsed = null;
  try { parsed = JSON.parse(j.response); } catch { parsed = null; }
  return { parsed, raw: j.response, tokensIn: j.prompt_eval_count ?? 0, tokensOut: j.eval_count ?? 0 };
}
```

- [ ] **Step 2: Write the failing node:test for batching + merge**

```js
// scripts/emoji-refit/score.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, mergeBatch, chunk } from "./score.mjs";

test("chunk splits into 8s", () => {
  assert.equal(chunk(Array.from({ length: 19 }), 8).length, 3);
});

test("prompt carries the rubric in prose and lists every item", () => {
  const p = buildPrompt([
    { id: "ja:ike", surface: "いけ", gloss: "pond", emoji: "🦆" },
    { id: "ja:tsukue", surface: "つくえ", gloss: "desk" },
  ]);
  assert.match(p, /5 = the emoji IS the thing/);
  assert.match(p, /ja:ike/);
  assert.match(p, /ja:tsukue .*no emoji yet/);
});

test("mergeBatch fills missing ids with a null score and empty candidates", () => {
  const items = [{ id: "a", emoji: "🐟" }, { id: "b" }];
  const out = mergeBatch(items, { scores: [{ id: "a", fit: 5, indirect: false, reason: "fish", candidates: [] }] });
  assert.deepEqual(out.find((s) => s.id === "b"), { id: "b", fit: null, indirect: false, reason: "MODEL_MISSING", candidates: [] });
  assert.equal(out.find((s) => s.id === "a").fit, 5);
});
```

Run: `node --test scripts/emoji-refit/score.test.mjs` → FAIL (module not found).

- [ ] **Step 3: Implement `score.mjs`**

```js
// scripts/emoji-refit/score.mjs
/**
 * Score every vocab emoji for fit and propose candidates, locally.
 *
 *   node scripts/emoji-refit/score.mjs --out artifacts/emoji-refit [--course ja] [--force]
 *
 * Batches of 8 (measured on classify.mjs: bigger batches drift), rubric in
 * PROSE (schema constrains structure, the prompt carries meaning), one file per
 * batch so a killed run resumes. Skips particles and blocked atoms — they are
 * not image words.
 */
import { readFile, writeFile, mkdir, access, readdir } from "node:fs/promises";
import { join } from "node:path";
import { generateJson } from "./ollama.mjs";

export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

const SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          fit: { type: ["integer", "null"], minimum: 1, maximum: 5 },
          indirect: { type: "boolean" },
          reason: { type: "string" },
          candidates: { type: "array", items: { type: "string" }, maxItems: 3 },
        },
        required: ["id", "fit", "indirect", "reason", "candidates"],
      },
    },
  },
  required: ["scores"],
};

export function buildPrompt(items) {
  const lines = items.map((i) =>
    i.emoji
      ? `${i.id}: "${i.surface}" = ${i.gloss} — current emoji ${i.emoji}`
      : `${i.id}: "${i.surface}" = ${i.gloss} — no emoji yet`,
  );
  return `You are auditing picture cues for a language-learning app. Each word is shown to a learner with ONE emoji and no other hint; learners are 9 to 67 years old and have never seen the word. Judge how directly the emoji shows the MEANING.

fit scale (use null when there is no current emoji):
5 = the emoji IS the thing (🌙 for "moon").
4 = unmistakable to almost everyone.
3 = needs a hint; several readings are plausible.
2 = shows an associated thing rather than the meaning (🦆 duck for "pond", 🌗 half-moon for "half").
1 = wrong or misleading.

indirect: true when the emoji shows something associated with the meaning instead of the meaning itself, even if the association is strong.

candidates: up to 3 single emoji (no digits, no keycaps, no flags) that would show the meaning MORE directly than the current one. Prefer one plain object over a scene. Give an empty list when no emoji can honestly show the meaning (abstract words, function words, politeness variants).

reason: at most 20 words.

Answer for ALL ${items.length} items, in order, using the exact ids.

${lines.join("\n")}`;
}

export function mergeBatch(items, parsed) {
  const byId = new Map((parsed?.scores ?? []).map((s) => [s.id, s]));
  return items.map((i) => {
    const s = byId.get(i.id);
    if (!s) return { id: i.id, fit: null, indirect: false, reason: "MODEL_MISSING", candidates: [] };
    return {
      id: i.id,
      fit: i.emoji ? (Number.isInteger(s.fit) ? s.fit : null) : null,
      indirect: Boolean(s.indirect),
      reason: String(s.reason ?? "").slice(0, 200),
      candidates: (s.candidates ?? []).filter((c) => typeof c === "string" && c.trim()).slice(0, 3),
    };
  });
}

const flag = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const exists = (p) => access(p).then(() => true, () => false);

async function main() {
  const out = flag("out", "artifacts/emoji-refit");
  const onlyCourse = flag("course", null);
  const force = process.argv.includes("--force");
  const inv = JSON.parse(await readFile(join(out, "inventory.json"), "utf8"));
  const items = inv.items.filter((i) =>
    (!onlyCourse || i.course === onlyCourse) && !i.blocked && (i.kind === "vocab" || i.kind === "phrase"),
  );
  await mkdir(join(out, "scores"), { recursive: true });
  const t0 = Date.now();
  let tin = 0, tout = 0, done = 0;
  for (const course of ["ja", "ko", "es", "fr"]) {
    const rows = items.filter((i) => i.course === course);
    const batches = chunk(rows, 8);
    for (let b = 0; b < batches.length; b++) {
      const file = join(out, "scores", `${course}-${String(b).padStart(3, "0")}.json`);
      if (!force && (await exists(file))) { done++; continue; }
      const r = await generateJson({ prompt: buildPrompt(batches[b]), schema: SCHEMA, numCtx: 8192, numPredict: 2048 });
      tin += r.tokensIn; tout += r.tokensOut;
      await writeFile(file, JSON.stringify(mergeBatch(batches[b], r.parsed), null, 1));
      done++;
      process.stderr.write(`  ${course} ${b + 1}/${batches.length}  (${((Date.now() - t0) / 1000).toFixed(0)}s)\r`);
    }
  }
  const merged = [];
  for (const f of (await readdir(join(out, "scores"))).sort()) {
    if (f.endsWith(".json")) merged.push(...JSON.parse(await readFile(join(out, "scores", f), "utf8")));
  }
  await writeFile(join(out, "scores.json"), JSON.stringify(merged, null, 1));
  console.log(`scored ${merged.length} items in ${done} batches, ${tin} in / ${tout} out tokens, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Tests pass, then a 2-batch smoke run**

```bash
node --test scripts/emoji-refit/score.test.mjs
node scripts/emoji-refit/score.mjs --out /Users/lichfield/Documents/projects/lingle/lingo/artifacts/emoji-refit --course fr
```
Expected: node:test 3/3; the FR run (≈17 batches) completes and `scores.json` rows have non-null `fit` for items with emoji. Read 10 rows yourself before trusting the run: if `MODEL_MISSING` appears in >5% of rows or `fit` is null for items that have an emoji, the model dropped ids — lower `CHUNK` to 6 and re-run with `--force`. Report the sample you read.

- [ ] **Step 5: Full run in the background**

```bash
nohup node scripts/emoji-refit/score.mjs --out /Users/lichfield/Documents/projects/lingle/lingo/artifacts/emoji-refit > /Users/lichfield/Documents/projects/lingle/lingo/artifacts/emoji-refit/score.log 2>&1 &
```
Expected ≈240 batches; report elapsed time and token totals from the last log line.

---

### Task 3: `check.mjs` — deterministic candidate filtering and the flagged set

**Files:**
- Create: `scripts/emoji-refit/check.mjs`
- Create: `scripts/emoji-refit/noto.mjs` (Noto index fetch + filename mapping, mirrors `notoEmojiUrl` rules)
- Test: `scripts/emoji-refit/check.test.mjs`

**Interfaces:**
- Consumes: `inventory.json`, `scores.json`.
- Produces: `<out>/noto-index.json` (set of `emoji_u….svg` names in the upstream repo, fetched once), `<out>/checked.json` (scores + per-candidate `{ emoji, file, inNoto, vendored, collidesWith: string[], digit: boolean, ok: boolean }`), and `<out>/flagged.json` — the frontier audit set: items with emoji and (`fit ≤ 3` or `indirect`) plus gaps, each with its inventory row, score, and checked candidates, sorted by course then module.

- [ ] **Step 1: Failing tests**

```js
// scripts/emoji-refit/check.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { notoFilename, isDigitOrKeycap } from "./noto.mjs";
import { checkCandidate, buildFlagged } from "./check.mjs";

test("notoFilename strips FE0F, keeps ZWJ, zero-pads BMP", () => {
  assert.equal(notoFilename("❤️"), "emoji_u2764.svg");
  assert.equal(notoFilename("👨‍🍳"), "emoji_u1f468_200d_1f373.svg");
  assert.equal(notoFilename("🐟"), "emoji_u1f41f.svg");
});

test("digits and keycaps are rejected", () => {
  assert.equal(isDigitOrKeycap("3️⃣"), true);
  assert.equal(isDigitOrKeycap("7"), true);
  assert.equal(isDigitOrKeycap("🔢"), true);
  assert.equal(isDigitOrKeycap("🐟"), false);
});

test("checkCandidate flags an in-course collision and a missing Noto file", () => {
  const index = new Set(["emoji_u1f41f.svg"]);
  const used = new Map([["🐟", ["ja:sakana"]]]);
  const c = checkCandidate("🐟", { course: "ja", id: "ja:ike" }, index, new Set(), used);
  assert.deepEqual(c.collidesWith, ["ja:sakana"]);
  assert.equal(c.inNoto, true);
  assert.equal(c.ok, false);
  const d = checkCandidate("🪷", { course: "ja", id: "ja:ike" }, index, new Set(), used);
  assert.equal(d.inNoto, false);
  assert.equal(d.ok, false);
});

test("buildFlagged keeps low-fit, indirect and gap items only", () => {
  const items = [
    { id: "a", course: "ja", module: "m1", emoji: "🦆", kind: "vocab" },
    { id: "b", course: "ja", module: "m1", emoji: "🌙", kind: "vocab" },
    { id: "c", course: "ja", module: "m2", kind: "vocab" },
  ];
  const scores = [
    { id: "a", fit: 2, indirect: true, candidates: [] },
    { id: "b", fit: 5, indirect: false, candidates: [] },
    { id: "c", fit: null, indirect: false, candidates: ["🪑"] },
  ];
  const f = buildFlagged(items, scores, []);
  assert.deepEqual(f.map((x) => x.id), ["a", "c"]);
});
```

Run: `node --test scripts/emoji-refit/check.test.mjs` → FAIL.

- [ ] **Step 2: Implement `noto.mjs`**

```js
// scripts/emoji-refit/noto.mjs
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/** Same rules as src/shared/assets/notoEmoji.ts: FE0F dropped, ZWJ kept, lowercase hex, 4-digit pad below 0x100. */
export function notoFilename(emoji) {
  const cps = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp === 0xfe0f) continue;
    cps.push(cp < 0x100 ? cp.toString(16).padStart(4, "0") : cp.toString(16));
  }
  return `emoji_u${cps.join("_")}.svg`;
}

export function isDigitOrKeycap(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0));
  if (cps.includes(0x20e3)) return true;
  if (cps.length === 1 && cps[0] >= 0x30 && cps[0] <= 0x39) return true;
  if (cps[0] === 0x1f522) return true; // 🔢
  return false;
}

export function isFlag(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0));
  return cps.length === 2 && cps.every((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff);
}

/** Upstream Noto svg/ directory listing, cached once per out dir. */
export async function loadNotoIndex(out) {
  const cache = join(out, "noto-index.json");
  try { return new Set(JSON.parse(await readFile(cache, "utf8"))); } catch { /* fetch */ }
  const res = await fetch("https://api.github.com/repos/googlefonts/noto-emoji/git/trees/main?recursive=1", {
    headers: { accept: "application/vnd.github+json", "user-agent": "lingo-emoji-refit" },
  });
  if (!res.ok) throw new Error(`github tree ${res.status}`);
  const tree = (await res.json()).tree.filter((t) => t.path.startsWith("svg/emoji_u")).map((t) => t.path.slice(4));
  await writeFile(cache, JSON.stringify(tree));
  return new Set(tree);
}

export async function loadVendored(root) {
  return new Set(await readdir(join(root, "src/pub/noto-emoji/svg")));
}
```

- [ ] **Step 3: Implement `check.mjs`**

```js
// scripts/emoji-refit/check.mjs
/**
 *   node scripts/emoji-refit/check.mjs --out artifacts/emoji-refit [--root <repo>]
 * Deterministic filter over score.mjs candidates + the frontier audit set.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { notoFilename, isDigitOrKeycap, isFlag, loadNotoIndex, loadVendored } from "./noto.mjs";

export function checkCandidate(emoji, item, notoIndex, vendored, usedByCourse) {
  const file = notoFilename(emoji);
  const digit = isDigitOrKeycap(emoji) || isFlag(emoji);
  const collidesWith = (usedByCourse.get(emoji) ?? []).filter((id) => id !== item.id);
  const inNoto = notoIndex.has(file);
  return { emoji, file, inNoto, vendored: vendored.has(file), collidesWith, digit, ok: inNoto && !digit && collidesWith.length === 0 };
}

export function buildFlagged(items, scores, checked) {
  const byId = new Map(scores.map((s) => [s.id, s]));
  const checkedById = new Map(checked.map((c) => [c.id, c]));
  const order = { ja: 0, ko: 1, es: 2, fr: 3 };
  return items
    .filter((i) => {
      const s = byId.get(i.id);
      if (!s) return false;
      if (!i.emoji) return true;                       // gap
      return s.indirect || (s.fit !== null && s.fit <= 3);
    })
    .map((i) => ({ ...i, score: byId.get(i.id), candidates: checkedById.get(i.id)?.candidates ?? [] }))
    .sort((a, b) => order[a.course] - order[b.course] || a.module.localeCompare(b.module, undefined, { numeric: true }));
}

const flag = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };

async function main() {
  const out = flag("out", "artifacts/emoji-refit");
  const root = flag("root", process.cwd());
  const inv = JSON.parse(await readFile(join(out, "inventory.json"), "utf8"));
  const scores = JSON.parse(await readFile(join(out, "scores.json"), "utf8"));
  const notoIndex = await loadNotoIndex(out);
  const vendored = await loadVendored(root);
  const items = inv.items.filter((i) => !i.blocked && (i.kind === "vocab" || i.kind === "phrase"));
  const usedByCourse = new Map();
  const used = {};
  for (const i of inv.items) {
    if (!i.emoji) continue;
    (used[i.course] ??= new Map());
    used[i.course].set(i.emoji, [...(used[i.course].get(i.emoji) ?? []), i.id]);
  }
  const itemById = new Map(items.map((i) => [i.id, i]));
  const checked = scores.map((s) => {
    const item = itemById.get(s.id);
    if (!item) return { ...s, candidates: [] };
    return { ...s, candidates: s.candidates.map((c) => checkCandidate(c, item, notoIndex, vendored, used[item.course] ?? usedByCourse)) };
  });
  await writeFile(join(out, "checked.json"), JSON.stringify(checked, null, 1));
  const flagged = buildFlagged(items, scores, checked);
  await writeFile(join(out, "flagged.json"), JSON.stringify(flagged, null, 1));
  const per = {};
  for (const f of flagged) {
    const c = (per[f.course] ??= { gaps: 0, lowFit: 0, indirect: 0, withOkCandidate: 0 });
    if (!f.emoji) c.gaps++; else if (f.score.indirect) c.indirect++; else c.lowFit++;
    if (f.candidates.some((x) => x.ok)) c.withOkCandidate++;
  }
  console.table(per);
  console.log(`flagged ${flagged.length} of ${items.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Tests pass, then run**

```bash
node --test scripts/emoji-refit/check.test.mjs
node scripts/emoji-refit/check.mjs --out /Users/lichfield/Documents/projects/lingle/lingo/artifacts/emoji-refit --root /Users/lichfield/Documents/projects/lingle/lingo
```
Expected: 4/4; a per-course table; `flagged.json` written. Report the table verbatim and spot-read 10 flagged rows (include 池/`ja:ike` — it must be flagged as indirect).

---

### Task 4: Frontier audit → `decisions.json` (controller session, not a subagent)

Not a code task. The controller reads `flagged.json` in ~50-row slices and writes `<out>/decisions.json`:
```ts
type Decision = { id: string; action: "keep" | "replace" | "art" | "unsure"; emoji?: string; artPrompt?: string; why: string };
```
Rules: `replace` only with a candidate whose `ok` is true (or a controller-chosen emoji that passes `checkCandidate` — re-run check with `--decisions` to validate); `art` when no honest emoji exists but the meaning is concrete (desk, room, "half"); `keep` when the 122B was wrong; `unsure` capped at 30 for Spencer. Every `replace` on a JA atom whose `emoji` originates in `curriculum/ir/m*.ir.yaml` also lists the YAML path.

---

### Task 5: `art.mjs` — flat-sticker custom art with mflux

**Files:**
- Create: `scripts/emoji-refit/art.mjs`
- Create: `scripts/emoji-refit/postprocess.py` (from `src/pub/lingo-art/cast/README.md`: flood-fill alpha, crop, 1px erode, 64-colour quantize)
- Modify: `src/shared/assets/notoEmoji.ts:33-78` (`LINGO_CUSTOM_ART` keyed `{course}:{atomId}`; `lingoArtUrl(course, key)`), and the four callers (`WordImageMcqStepView.tsx:271,322`, `ko/module.ts:131-140`, `es/module.ts:94-100`, `fr/module.ts:88-94`).
- Test: `src/shared/assets/notoEmoji.test.ts` (extend: a KO key resolves; JA legacy kana keys still resolve).

Style clause, byte-identical across every image: `flat vector sticker, thick dark outline, three flat colours, no gradient, no text, centered on plain white background, Noto emoji style`. Seed 7, 512×512, 8 steps:
```bash
mflux-generate-z-image-turbo --steps 8 --seed 7 --width 512 --height 512 --output <out>/art/<course>-<id>.png --prompt "<artPrompt>, flat vector sticker, thick dark outline, three flat colours, no gradient, no text, centered on plain white background, Noto emoji style"
```
Output committed under `src/pub/lingo-art/vocab/<course>/<id>.png` after post-process (target ≤ 6 KB each, like the cast set).

---

### Task 6: `vendor-noto.mjs` + `apply.mjs`

**Files:**
- Create: `scripts/emoji-refit/vendor-noto.mjs` — for every `replace` decision, download `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/<file>` into `src/pub/noto-emoji/svg/` if not vendored.
- Create: `scripts/emoji-refit/apply.mjs` — emits `<out>/edits.json` as `[{ file, oldString, newString }]`: for each decision, the atom's line in its registry (`ja/courseAtoms.ts`, `ko/courseAtoms.ts`, `es/curriculum/m*.ts`, `fr/curriculum/m*.ts`) and, where the atom came from IR, the `emoji:` line in the `.ir.yaml`. `oldString` is the exact `emoji: "🦆"` fragment scoped by the atom's `id:`/`surface:` on the same line. Applies with `--apply`, refusing any `oldString` that matches ≠ 1 time.
- Test: `scripts/emoji-refit/apply.test.mjs` (edit generation on a fixture string; refuse-on-ambiguity).

---

### Task 7: Course-wide emoji integrity gate

**Files:**
- Create: `src/features/languages/__tests__/courseEmojiIntegrity.test.ts` — generalizes `es/curriculum/es-course-integrity.test.ts:54-81`: for each course, across every `word_image_mcq` step, one emoji maps to one surface; plus every `emoji` on an SRS-eligible atom has a vendored Noto SVG file (`fs.existsSync(src/pub/noto-emoji/svg/<notoFilename>)`) or a `LINGO_CUSTOM_ART` entry. Known-debt exemptions move into one exported list with the reason (the 🚪 hasta-luego/puerta debt is resolved by this wave, so it should be removable — if not, keep it and say why).
- Run the JA per-module shared-glyph tests, `es-course-integrity`, and `npm run preflight`.

Report: counts of replaced / filled / art / kept / unsure per course, the vendored-SVG delta, and the `unsure` list formatted for Spencer's walk.
