#!/usr/bin/env node
/**
 * draft.mjs — GENERIC slot-choice drafting driver.
 *
 *   node scripts/draft/draft.mjs es-a2:m17 --model qwen3:4b --rounds 12 --n 16 --duty 0.8
 *
 * `generate-es.mjs` and `generate.mjs` each hard-code one frame's slot names.
 * This one reads them off the frame (`frame.slots`), so a new module — or a new
 * language — is a frame file and nothing else. The model still only ever picks
 * slot values; the frame owns every character of both languages.
 *
 * Writes `drafts/<frame.id>.json`: { frame, model, rounds, generated, picks[] }.
 * Resumable in the runner's sense — an existing output file is never clobbered
 * unless --force.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { makeGovernor } from "./throttle.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const flag = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const has = (n) => process.argv.includes(`--${n}`);

const [file, frameKey] = (process.argv[2] ?? "es-a2:m17").split(":");
const model = flag("model", "qwen3:4b");
const rounds = Number(flag("rounds", "10"));
const n = Number(flag("n", "16"));
const duty = Number(flag("duty", "1.0"));
const through = flag("through", "m16");
/**
 * COVERAGE MODE. Free-form drafting clusters: 60 rounds of "choose any
 * combination" produced 84 unique sentences that covered 13 of the 78
 * (verb, person) cells the m17 lessons actually need, so 65 cells fell through
 * to frame-fill and the model contributed almost nothing to the shipped file.
 *
 * `--cover` pins ONE verb per request and asks for one pick per person. That
 * keeps the model's judgment exactly where it is worth having — which object
 * and which time marker sound natural for this verb — and moves coverage into
 * the loop, where it is guaranteed instead of hoped for.
 */
const cover = has("cover");

const mod = await import(`./frames-${file}.mjs`);
const frame = mod[`es_${frameKey}`] ?? mod.ES_A2_FRAMES?.[frameKey];
if (!frame) {
  console.error(`no frame "${frameKey}" in frames-${file}.mjs`);
  process.exit(2);
}

// TEACH-FIRST, asserted BEFORE a single token is spent. m8 shipped an untaught
// word into a generated batch and only TMR caught it afterwards.
await mod.assertFrameVocabIsTaught(frame, through);
await mod.loadNouns(through);

const outDir = join(here, "drafts");
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, `${frame.id}.json`);
let existing = [];
try {
  existing = JSON.parse(await readFile(outPath, "utf8")).picks ?? [];
} catch {
  /* first run */
}
if (existing.length && !has("force") && !has("merge")) {
  console.log(`${outPath} exists — nothing to do (--force to redraft, --merge to add to it).`);
  process.exit(0);
}

function schemaFor(overrides = {}) {
  const properties = {};
  for (const [name, spec] of Object.entries(frame.slots)) {
    const values = overrides[name] ?? spec.enum;
    properties[name] = { type: "string", enum: spec.optional ? [...values, "none"] : values };
  }
  return {
    type: "object",
    properties: {
      picks: {
        type: "array",
        items: { type: "object", properties, required: Object.keys(properties) },
      },
    },
    required: ["picks"],
  };
}

const properties = {};
for (const [name, spec] of Object.entries(frame.slots)) {
  properties[name] = { type: "string", enum: spec.optional ? [...spec.enum, "none"] : spec.enum };
}
const schema0 = {
  type: "object",
  properties: {
    picks: {
      type: "array",
      items: { type: "object", properties, required: Object.keys(properties) },
    },
  },
  required: ["picks"],
};

const slotLines = Object.entries(frame.slots).map(
  ([name, spec]) =>
    `  ${name.padEnd(7)}: ${spec.describe} — one of ${spec.enum.join(", ")}${spec.optional ? ', or "none"' : ""}`,
);

const prompt = [
  `You are choosing word combinations for a Spanish lesson about ${frame.topic}.`,
  "",
  `Choose ${n} DIFFERENT combinations. For each pick:`,
  ...slotLines,
  "",
  "Rules that decide whether a pick is good:",
  ...frame.rules,
  "",
  // The `object` enum in the schema is GLOBAL — it has to be, one enum per
  // slot — so the model can pair any verb with any object and the frame throws
  // half of them away. Half a run wasted is cheaper to fix in the prompt than
  // in the schema: spelling the per-verb pools out here took the rejection
  // rate from 50% to single digits.
  ...(frame.objectsByVerb
    ? [
        "The ONLY object each verb may take:",
        ...Object.entries(frame.objectsByVerb).map(
          ([v, objs]) => `  ${v}: ${objs.length ? objs.join(", ") : "(none)"}`,
        ),
      ]
    : []),
  "",
  "Do not write any Spanish. Do not write any English. Only choose the slots.",
  "/no_think",
].join("\n");

/**
 * The round list. Free-form mode is `rounds` identical requests; coverage mode
 * is one request per verb, with that verb's own object pool spelled out.
 */
const ROUNDS = cover
  ? frame.verbs.map((v) => ({
      label: v.lemma,
      // Narrow the OBJECT enum to this verb's own pool too, not just the verb.
      // The prompt already spells the pairing out in prose and the model mostly
      // respects it, but "mostly" is how m19 lost ten cells to verbs whose
      // complements were not even in the global enum. A value absent from the
      // schema cannot be chosen; a rule in a prompt can be ignored.
      schema: schemaFor({
        verb: [v.lemma],
        ...(frame.objectsByVerb ? { object: frame.objectsByVerb[v.lemma] ?? [] } : {}),
      }),
      prompt: [
        `You are choosing word combinations for a Spanish lesson about ${frame.topic}.`,
        "",
        `The verb is fixed: ${v.lemma} (${v.enInf}).`,
        `Choose ONE pick for EACH of these subjects, in this order: ${frame.persons.join(", ")}.`,
        "For each pick:",
        ...Object.entries(frame.slots)
          .filter(([name]) => name !== "verb")
          .map(([name, spec]) => `  ${name.padEnd(7)}: ${spec.describe}`),
        "",
        (frame.objectsByVerb[v.lemma] ?? []).length
          ? `The ONLY objects ${v.lemma} may take: ${frame.objectsByVerb[v.lemma].join(", ")}.`
          : `${v.lemma} takes NO object — use "none".`,
        `Time markers available: ${frame.time.map((t) => t.es).join(", ")}.`,
        "Give every pick a DIFFERENT time marker where you can, and vary the object.",
        "Prefer combinations a real beginner would say about their own past week.",
        "",
        "Do not write any Spanish. Do not write any English. Only choose the slots.",
        "/no_think",
      ].join("\n"),
    }))
  : Array.from({ length: rounds }, () => ({ label: "free", schema: schema0, prompt }));

const gov = makeGovernor({ duty, label: frame.id });
const seen = new Map(has("merge") ? existing.map((p) => [p.es, p]) : []);
const rejected = [];
const t0 = Date.now();
let unparseable = 0;

for (let r = 0; r < ROUNDS.length; r++) {
  const round = ROUNDS[r];
  let res;
  try {
    res = await gov.run(() =>
      fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: round.prompt,
          stream: false,
          // Reasoning models route schema-constrained output into `thinking`
          // and return an EMPTY `response` unless this is set at the API level.
          think: false,
          format: round.schema,
          options: gov.options({
            num_ctx: 8192,
            num_predict: 2048,
            // Coverage mode wants the MOST NATURAL object for a fixed verb, not
            // a wide sample; free-form mode wants spread. Same model, opposite
            // jobs, so the temperature is not a constant.
            temperature: Number(flag("temp", cover ? "0.6" : "1.0")),
          }),
        }),
      }).then(async (x) => {
        if (!x.ok) throw new Error(`ollama ${x.status}: ${(await x.text()).slice(0, 200)}`);
        return x.json();
      }),
    );
  } catch (e) {
    console.error(`round ${r + 1}: ${e.message}`);
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(res.response);
  } catch {
    // ollama/ollama#16563 — the MLX execution path silently IGNORES `format`
    // and returns prose with a 200. Three unparseable rounds is that bug, not
    // bad luck, and continuing burns an hour producing nothing.
    unparseable += 1;
    console.error(`round ${r + 1}: response was not JSON (${unparseable}/3)`);
    if (unparseable >= 3) {
      console.error("Three unparseable rounds — `format` is being ignored. Aborting.");
      process.exit(3);
    }
    continue;
  }
  unparseable = 0;

  for (const raw of parsed.picks ?? []) {
    const pick = {};
    for (const name of Object.keys(frame.slots)) {
      const v = raw[name];
      pick[name] = v && v !== "none" ? v : null;
    }
    const errs = frame.check(pick);
    if (errs.length) {
      rejected.push({ pick, errs });
      continue;
    }
    let built;
    try {
      built = frame.build(pick);
    } catch (e) {
      rejected.push({ pick, errs: [`build: ${e.message}`] });
      continue;
    }
    if (!seen.has(built.es)) seen.set(built.es, built);
  }
  process.stdout.write(
    `round ${r + 1}/${ROUNDS.length} ${round.label.padEnd(11)}: ${seen.size} unique · ${rejected.length} rejected · ${((Date.now() - t0) / 1000).toFixed(0)}s\n`,
  );
}

const picks = [...seen.values()];
await writeFile(
  outPath,
  JSON.stringify(
    {
      frame: frame.id,
      model,
      rounds: ROUNDS.length,
      mode: cover ? "cover" : "free",
      duty,
      generatedSeconds: Math.round((Date.now() - t0) / 1000),
      accepted: picks.length,
      rejected: rejected.length,
      picks,
    },
    null,
    2,
  ),
);
console.log(`\n${picks.length} unique sentences → ${outPath}`);
console.log(`${rejected.length} picks rejected by the frame (grammar was never at risk).`);
