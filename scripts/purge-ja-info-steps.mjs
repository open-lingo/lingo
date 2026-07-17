#!/usr/bin/env node
/**
 * Codemod: remove flagged `info` steps from the ja curriculum.
 *
 * Approved change per docs/info-step-audit-2026-07-16.md:
 *   - Categories A + B (842 steps) are REMOVED outright.
 *   - Category C (20 steps) are hand-converted to `grammar_rule` FIRST
 *     (so by the time this runs they are no longer info steps); their ids
 *     are listed in KEEP_CONVERTED below purely for the safety assertion.
 *
 * Bracket-aware: handles both the `infoStep(...)` helper calls (m3-m27)
 * and the literal `{ id: "...", type: "info", ... }` objects (m1/m2 +
 * katakanaRows). Removes a step element together with its trailing comma
 * and its own line's leading indentation, leaving the surrounding array
 * intact.
 *
 * Usage:
 *   node scripts/purge-ja-info-steps.mjs --list      # dry-run: print every info step
 *   node scripts/purge-ja-info-steps.mjs --apply     # remove REMOVE_IDS
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURRICULUM_DIR = path.resolve(
  __dirname,
  "../src/features/languages/ja/curriculum",
);

/** The 20 category-C ids that are converted to grammar_rule by hand.
 *  This codemod must NEVER touch these (they are no longer info steps by
 *  the time --apply runs; listed here so --apply can assert they're gone
 *  from the info set and were not accidentally scheduled for removal). */
const KEEP_CONVERTED = new Set([
  "ja-ka3-info-desu-ka", //   m1-ka.ts   です + か
  "ja-wa2-info-0", //         m1-wa.ts   を — the particle kana
  "ja-g1-info-open", //       m2-g.ts    Dakuten — the voicing mark
  "ja-b1-info-open", //       m2-b.ts    H → B (+ handakuten preview)
  "ja-d1-info-open", //       m2-d.ts    T → D (two ghosts)
  "ja-z1-info-open", //       m2-z.ts    S → Z (し→じ twist)
  "ja-p1-info-open", //       m2-p.ts    Handakuten — the circle mark
  "ja-yi1-info-open", //      m2-yoon-intro.ts    Yōon
  "ja-ysc1-info-open", //     m2-yoon-sh-ch.ts    sh + ch yōon
  "ja-m3-1-info-system", //   m3-v2.ts   Katakana — hiragana's twin
  "ja-m3-1-info-chouon", //   m3-v2.ts   The long-vowel mark ー
  "ja-m4-2-2-info-open", //   m4.ts      Beyond possession (の "kind of")
  "ja-m5-1-1-info-open", //   m5.ts      Numbers — two systems
  "ja-m5-3-2-info-open", //   m5.ts      Generic counters for ordering
  "ja-m5-4-2-info-open", //   m5.ts      number + にん (people counter)
  "ja-m5kata-info-juice", //  katakanaRows.ts     Decode: ジュース
  "ja-m6-3-2-info-open", //   m6.ts      Means of motion (で)
  "ja-m6kata-info-sokuon", // katakanaRows.ts     Small ッ (gemination)
  "ja-m7-1-1-info-open", //   m7.ts      The citation form (dictionary form)
  "ja-m12kata-info-pa", //    katakanaRows.ts     Decode: パン
]);

// ─── string/comment-aware forward delimiter matcher ────────────────────
const OPEN = { "(": ")", "{": "}", "[": "]" };

/** Given the index of an opening delimiter, return the index just AFTER
 *  its matching close, skipping strings and comments. */
function matchDelim(src, openIdx) {
  const stack = [OPEN[src[openIdx]]];
  let i = openIdx + 1;
  while (i < src.length && stack.length) {
    const c = src[i];
    // line comment
    if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i < 0) i = src.length;
      continue;
    }
    // block comment
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    // strings
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(src, i);
      continue;
    }
    if (c in OPEN) {
      stack.push(OPEN[c]);
    } else if (c === ")" || c === "}" || c === "]") {
      if (c !== stack[stack.length - 1]) {
        throw new Error(`delimiter mismatch at ${i}: expected ${stack[stack.length - 1]}, got ${c}`);
      }
      stack.pop();
    }
    i++;
  }
  return i; // index just after the matching close
}

/** Given the index of a quote char, return index just after the closing quote. */
function skipString(src, quoteIdx) {
  const q = src[quoteIdx];
  let i = quoteIdx + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (q === "`" && c === "$" && src[i + 1] === "{") {
      // template expression
      i = matchDelim(src, i + 1);
      continue;
    }
    if (c === q) return i + 1;
    i++;
  }
  return i;
}

/** Single linear scan collecting every info step in one file.
 *  Returns [{ id, kind, start, end }] where [start,end) is the element
 *  span (delimiter to delimiter, not including trailing comma). */
function findInfoSteps(src) {
  const found = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i < 0) i = src.length;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(src, i);
      continue;
    }
    // infoStep( helper call
    if (
      src.startsWith("infoStep", i) &&
      !isIdentChar(src[i - 1]) &&
      nextNonSpace(src, i + "infoStep".length) === "("
    ) {
      const parenIdx = src.indexOf("(", i + "infoStep".length);
      const end = matchDelim(src, parenIdx);
      const id = firstStringLiteral(src.slice(parenIdx, end));
      found.push({ id, kind: "call", start: i, end });
      i = end;
      continue;
    }
    // literal object whose OWN (top-level) type field is "info"
    if (c === "{") {
      const end = matchDelim(src, i);
      if (topLevelTypeIsInfo(src, i, end)) {
        const inner = src.slice(i, end);
        const id = matchField(inner, "id");
        found.push({ id, kind: "object", start: i, end });
        i = end;
        continue;
      }
      // not an info object — descend so we still catch nested infoStep()
    }
    i++;
  }
  return found;
}

/** True iff the object [openIdx, closeIdx) has a DIRECT (depth-1) field
 *  `type: "info"`. Ignores type fields inside nested objects/arrays. */
function topLevelTypeIsInfo(src, openIdx, closeIdx) {
  let i = openIdx + 1;
  while (i < closeIdx - 1) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i < 0 || i >= closeIdx) return false;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? closeIdx : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(src, i);
      continue;
    }
    if (c in OPEN) {
      // skip nested object/array/paren wholesale
      i = matchDelim(src, i);
      continue;
    }
    if (src.startsWith("type", i) && !isIdentChar(src[i - 1])) {
      const m = /^type\s*:\s*["']info["']/.exec(src.slice(i, closeIdx));
      if (m) return true;
    }
    i++;
  }
  return false;
}

function isIdentChar(ch) {
  return ch !== undefined && /[A-Za-z0-9_$]/.test(ch);
}
function nextNonSpace(src, i) {
  while (i < src.length && /\s/.test(src[i])) i++;
  return src[i];
}
function firstStringLiteral(s) {
  const m = /["'`]([^"'`]*)["'`]/.exec(s);
  return m ? m[1] : null;
}
function matchField(objText, field) {
  const m = new RegExp(`\\b${field}:\\s*["']([^"']+)["']`).exec(objText);
  return m ? m[1] : null;
}

/** Extend an element span to swallow its trailing comma + own-line indent. */
function expandForRemoval(src, start, end) {
  // swallow leading indentation on the element's first line
  let s = start;
  while (s > 0 && (src[s - 1] === " " || src[s - 1] === "\t")) s--;
  // swallow trailing comma + whitespace up to and including one newline
  let e = end;
  while (e < src.length && /[ \t]/.test(src[e])) e++;
  if (src[e] === ",") e++;
  while (e < src.length && /[ \t]/.test(src[e])) e++;
  if (src[e] === "\n") e++;
  return [s, e];
}

// ─── main ──────────────────────────────────────────────────────────────
const mode = process.argv[2] ?? "--list";
const files = fs
  .readdirSync(CURRICULUM_DIR)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .sort();

const all = [];
for (const f of files) {
  const full = path.join(CURRICULUM_DIR, f);
  const src = fs.readFileSync(full, "utf8");
  const steps = findInfoSteps(src);
  for (const s of steps) all.push({ file: f, ...s });
}

if (mode === "--list") {
  for (const s of all) {
    console.log(`${s.file}\t${s.kind}\t${s.id}`);
  }
  console.error(`\nTOTAL info steps: ${all.length}`);
  const byFile = {};
  for (const s of all) byFile[s.file] = (byFile[s.file] ?? 0) + 1;
  console.error("per-file:");
  for (const [f, n] of Object.entries(byFile)) console.error(`  ${f}: ${n}`);
  process.exit(0);
}

if (mode === "--apply") {
  // REMOVE_IDS = every info id EXCEPT the 20 hand-converted ones.
  const removeIds = new Set(
    all.map((s) => s.id).filter((id) => !KEEP_CONVERTED.has(id)),
  );
  // Safety: none of the KEEP_CONVERTED ids should still be present as info.
  const stillInfo = all.filter((s) => KEEP_CONVERTED.has(s.id));
  if (stillInfo.length) {
    console.error(
      `REFUSING: ${stillInfo.length} category-C id(s) still present as info steps (convert them first):`,
    );
    for (const s of stillInfo) console.error(`  ${s.file}\t${s.id}`);
    process.exit(1);
  }
  let removed = 0;
  for (const f of files) {
    const full = path.join(CURRICULUM_DIR, f);
    let src = fs.readFileSync(full, "utf8");
    // re-scan this file, remove matching spans from the BOTTOM up so
    // indices stay valid.
    const steps = findInfoSteps(src).filter((s) => removeIds.has(s.id));
    if (!steps.length) continue;
    steps.sort((a, b) => b.start - a.start);
    for (const s of steps) {
      const [rs, re] = expandForRemoval(src, s.start, s.end);
      src = src.slice(0, rs) + src.slice(re);
      removed++;
    }
    fs.writeFileSync(full, src);
    console.error(`  ${f}: removed ${steps.length}`);
  }
  console.error(`\nTOTAL removed: ${removed}`);
  process.exit(0);
}

console.error(`unknown mode ${mode}`);
process.exit(1);
