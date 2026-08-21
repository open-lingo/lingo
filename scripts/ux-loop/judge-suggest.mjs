#!/usr/bin/env node
// Local UX OPTIMIZATION judge (qwen3.5-122B vision). Unlike judge-ux (which only
// enumerates problems), this asks for concrete improvements: for each observable
// issue, a specific suggested fix. Feeds the /qa/ux-audit page. Uses the
// viewport-height shots (not --full) — the 122B is far more reliable on those.
//
// Usage: node scripts/ux-loop/judge-suggest.mjs <captureDir>
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MODEL = process.env.UX_JUDGE_MODEL ?? "qwen3.5:122b-a10b-q4_K_M";
const dir = process.argv[2];
if (!dir) { console.error("usage: judge-suggest.mjs <captureDir>"); process.exit(1); }

const SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string", description: "region, e.g. header, gems pill, tab bar, hero card" },
          issue: { type: "string", description: "what is visibly suboptimal" },
          suggestion: { type: "string", description: "a specific, concrete improvement" },
          severity: { type: "string", enum: ["polish", "minor", "notable"] },
        },
        required: ["area", "issue", "suggestion", "severity"],
      },
    },
  },
  required: ["suggestions"],
};

const PROMPT = `You are a senior product designer reviewing ONE screen of a mobile language-learning app (iPhone, real device size, notch/home-indicator safe areas applied). Suggest concrete UI/UX OPTIMIZATIONS you can justify from what is visible. For each: the area, the issue, a specific suggested fix, and severity (polish | minor | notable). Look hard for:
- elements touching or bleeding into the screen edge / each other (e.g. a status pill flush against the border), unbalanced margins;
- a badge, marker, or icon that is clipped or cut off by a container or the top edge;
- weak visual hierarchy (unclear primary action), cramped or loose spacing, misalignment;
- low contrast, text that truncates when it shouldn't, inconsistent corner radii / sizes;
- tap targets that look small; wasted vertical space; anything that would read as unpolished to a paying user.
Be specific and actionable ("give the gems pill 8px right margin and center it in a 44px tap area", not "improve spacing"). Do not invent problems you cannot see. Return JSON only.`;

const files = readdirSync(dir).filter((f) => f.endsWith("--iphone-14-promax.png") && !f.includes("--full")).sort();
if (!files.length) { console.error(`no viewport PNGs in ${dir}`); process.exit(1); }

const out = [];
for (const f of files) {
  const img = readFileSync(join(dir, f)).toString("base64");
  const t0 = Date.now();
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // think:false — qwen3.5 is a reasoning model; left on, it spends the whole
      // num_predict on hidden thinking and returns an empty body (local-model-stack).
      model: MODEL, stream: false, think: false, format: SCHEMA,
      messages: [{ role: "user", content: `${PROMPT}\n\nScreen: ${f.replace("--iphone-14-promax.png", "")}`, images: [img] }],
      options: { num_ctx: 16384, num_predict: 3500, temperature: 0.2 },
    }),
  });
  const body = await res.json();
  const text = body?.message?.content ?? "";
  let parsed;
  try { parsed = JSON.parse(text); } catch { console.error(`ERROR ${f}: unparseable: ${text.slice(0, 140)}`); continue; }
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  const page = f.replace("--iphone-14-promax.png", "");
  console.log(`${page}: ${parsed.suggestions.length} suggestions (${secs}s)`);
  out.push({ page, suggestions: parsed.suggestions });
}
writeFileSync(join(dir, "ux-suggestions.json"), JSON.stringify(out, null, 2));
console.log(`\nwrote ${join(dir, "ux-suggestions.json")}`);
