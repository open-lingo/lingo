#!/usr/bin/env node
// Local UX-critique judge (qwen3.5-122B vision tier), for the mobile UX loop.
//
// Scope, per local-model-stack memory: the 122B is a good judge AGAINST A
// RUBRIC but NOT a taste-maker or ranker. So it only ENUMERATES observable,
// checkable problems in each capture — it does not ideate fixes or rank. The
// frontier model reads this output and does the design/ranking half.
//
// Rubric is grounded in docs/mobile-ui-testing-2026-08-09.md:
//   - tap targets: WCAG 2.2 SC 2.5.8 = 24x24 CSS px (NOT 44pt)
//   - text must stay legible (small-body floor ~15px)
//   - safe-area: nothing important under the status bar / home indicator
//   - no horizontal overflow; no content clipped off an edge
//
// Usage: node scripts/ux-loop/judge-ux.mjs <captureDir>
// Reads every *--full.png in the dir; writes <captureDir>/ux-findings.json.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MODEL = process.env.UX_JUDGE_MODEL ?? "qwen3.5:122b-a10b-q4_K_M";
const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/ux-loop/judge-ux.mjs <captureDir>");
  process.exit(1);
}

const FINDINGS_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string", description: "region of the screen, e.g. header, map card, CTA, station row" },
          category: {
            type: "string",
            enum: ["spacing", "typography", "contrast", "tap-target", "overflow", "alignment", "density", "redundancy", "hierarchy", "affordance"],
          },
          observation: { type: "string", description: "what is visibly wrong, concrete and checkable" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["area", "category", "observation", "severity"],
      },
    },
  },
  required: ["findings"],
};

const PROMPT = `You are auditing ONE screen of a mobile language-learning app, captured on an iPhone at real device size with the notch/home-indicator safe areas applied. Report ONLY observable, checkable UI problems you can actually see in THIS image. Do not invent problems, do not propose fixes, do not rank. Judge against this rubric:
- Wasted vertical space / large empty gaps (a phone screen is scarce; dead space pushes content below the fold).
- Text too small to read comfortably, or cramped line spacing.
- Low contrast between text/controls and their background (e.g. grey-on-dark labels, faint "SOON" pills).
- Tap targets that look smaller than ~24x24px or too close together to hit reliably.
- Content running off an edge, clipped, or horizontally overflowing.
- Misalignment, inconsistent margins, ragged edges.
- Visual redundancy (the same icon/badge repeated, duplicated labels).
- Weak visual hierarchy (can't tell what's primary vs secondary; the main action is not obvious).
- Jarring seams (two different background colors meeting abruptly).
If the screen looks fine on a dimension, say nothing for it. Return JSON only.`;

const files = readdirSync(dir).filter((f) => f.endsWith("--full.png")).sort();
if (files.length === 0) {
  console.error(`no *--full.png in ${dir}`);
  process.exit(1);
}

const out = [];
for (const f of files) {
  const img = readFileSync(join(dir, f)).toString("base64");
  const t0 = Date.now();
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: FINDINGS_SCHEMA,
      messages: [{ role: "user", content: `${PROMPT}\n\nScreen: ${f}`, images: [img] }],
      options: { num_ctx: 16384, num_predict: 2048, temperature: 0 },
    }),
  });
  const body = await res.json();
  const text = body?.message?.content ?? "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error(`ERROR ${f}: unparseable (MLX format trap?): ${text.slice(0, 160)}`);
    continue;
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`${f}: ${parsed.findings.length} findings (${secs}s)`);
  out.push({ screen: f, findings: parsed.findings });
}

const outPath = join(dir, "ux-findings.json");
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`\nwrote ${outPath}`);
