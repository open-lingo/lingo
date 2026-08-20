/**
 * batch-es.mjs — oversample a Spanish module's sentences in the background.
 *
 *   node scripts/draft/batch-es.mjs m8 --rounds 20 --duty 0.8 --out drafts/es-m8.json
 *   nohup node scripts/draft/batch-es.mjs m8 --rounds 40 > drafts/es-m8.log 2>&1 &
 *
 * Local inference is free, so the strategy is OVERSAMPLE AND DISCARD rather
 * than tune for first-pass yield. Rounds are deduplicated on the assembled
 * Spanish sentence, and only picks that clear the frame's residual checks are
 * kept. Everything runs through the governor, so a long run holds the duty
 * cycle and the laptop does not cook.
 *
 * Output is a corpus file plus a report. The corpus is INPUT to the paid
 * verify tier — never content that reaches a learner unread.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { ES_FRAMES, gloss } from "./frames-es.mjs";
import { makeGovernor, thermalState } from "./throttle.mjs";

const flag = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const moduleId = (process.argv[2] ?? "m8").replace(/^es-/, "");
const frame = ES_FRAMES[moduleId];
if (!frame) {
  console.error(`no ES frame for "${moduleId}". Have: ${Object.keys(ES_FRAMES).join(", ")}`);
  process.exit(2);
}
const model = flag("model", "qwen3:4b");
const rounds = Number(flag("rounds", "20"));
const perRound = Number(flag("n", "12"));
const duty = Number(flag("duty", "1.0"));
const outPath = flag("out", `drafts/es-${moduleId}.json`);

const verbNames = frame.verbs.map((v) => v.lemma);
const objNames = frame.objects.map((o) => o.noun);
const objByName = Object.fromEntries(frame.objects.map((o) => [o.noun, o]));

const schema = {
  type: "object",
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          person: { type: "string", enum: frame.persons },
          verb: { type: "string", enum: verbNames },
          object: { type: "string", enum: [...objNames, "none"] },
          freq: { type: "string", enum: [...frame.frequency.filter(Boolean), "none"] },
          en: { type: "string" },
        },
        required: ["person", "verb", "object", "freq", "en"],
      },
    },
  },
  required: ["picks"],
};

const basePrompt = [
  "You are choosing word combinations for a Spanish beginner lesson about daily routines.",
  "",
  `Choose ${perRound} DIFFERENT combinations. For each pick:`,
  `  person: one of ${frame.persons.join(", ")}`,
  `  verb:   one of ${verbNames.join(", ")}`,
  `  object: one of ${objNames.join(", ")} — or "none"`,
  `  freq:   one of ${frame.frequency.filter(Boolean).join(", ")} — or "none"`,
  "  en:     the English meaning WITHOUT the frequency word, PRESENT tense,",
  "          matching the person you chose — e.g. \"I listen to music\".",
  "",
  "Rules that decide whether a pick is good:",
  "  - The verb and object must make real-world sense together. 'escuchar música'",
  "    is good; 'cocinar música' is not.",
  `  - These verbs take NO object, use "none": ${[...frame.intransitive].join(", ")}.`,
  `  - These verbs REQUIRE an object: ${[...frame.transitive].join(", ")}.`,
  "  - Write natural English: include articles — 'I study the book', never 'I study book'.",
  "  - Do NOT put always/never/sometimes/every day in the English. That is added for you.",
  '  - The English must match the person: yo="I", tu="You", el="He", nosotros="We", ustedes="They".',
  "",
  "Do not write any Spanish sentence. Only choose the slots.",
  "/no_think",
].join("\n");

const gov = makeGovernor({ duty });
const before = await thermalState();
const seen = new Set();
const kept = [];
const rejected = [];
let calls = 0;
let parseFailures = 0;

const ts = () => new Date().toISOString().replace("T", " ").slice(0, 19);
console.log(`[${ts()}] batch-es ${moduleId}: ${rounds} rounds × ${perRound}, model=${model}, duty=${duty}`);
console.log(`[${ts()}] thermal before: throttled=${before.throttled}`);

for (let round = 0; round < rounds; round += 1) {
  let parsed;
  try {
    const res = await gov.run(() =>
      fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          // Vary the prompt by round rather than by seed: the script must stay
          // deterministic-friendly, and Math.random is unavailable in some of
          // our runners. A different framing per round is enough to decorrelate.
          prompt: `${basePrompt}\n\n(Set ${round + 1}: prefer combinations you have not used in earlier sets.)`,
          stream: false,
          think: false,
          format: schema,
          options: gov.options({ num_ctx: 8192, num_predict: 2048, temperature: 0.9 }),
        }),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`ollama ${r.status}`);
        return r.json();
      }),
    );
    calls += 1;
    parsed = JSON.parse(res.response);
  } catch (e) {
    // A parse failure is NOT routine. Ollama's MLX execution path silently
    // ignores the `format` JSON-schema parameter (ollama/ollama#16563, open
    // since 2026-06-06): you get a 200 and prose. Given that the whole design
    // rests on schema-constrained slot choices, that bug would gut this
    // pipeline while every request still "succeeded" — so a run that cannot
    // parse anything aborts loudly instead of quietly producing an empty
    // corpus. Pin non-MLX model tags.
    console.log(`[${ts()}] round ${round + 1} dropped: ${e.message}`);
    parseFailures += 1;
    if (parseFailures >= 3 && kept.length === 0) {
      console.error(
        `\nABORT: ${parseFailures} rounds returned unparseable output and nothing has been kept.\n` +
        `The model is probably ignoring the JSON schema. If "${model}" is an -mlx tag,\n` +
        `that is ollama#16563 — switch to the non-MLX tag. Do not "fix" this by relaxing the schema.`,
      );
      process.exit(1);
    }
    continue;
  }

  for (const p of parsed.picks ?? []) {
    const object = p.object && p.object !== "none" ? objByName[p.object] : null;
    const freq = p.freq && p.freq !== "none" ? p.freq : null;
    frame.lastPerson = p.person;
    // MUST be set before check(): the gloss-drops-the-adverb rule reads it, and
    // without this assignment that rule is DEAD CODE. It shipped dead once and
    // «yo nunca descanso» came back glossed "I rest" — a meaning INVERSION.
    frame.lastFreq = freq;
    const errs = frame.check({ verb: p.verb, object, en: p.en });
    let es = null;
    try {
      es = frame.build({ person: p.person, verb: p.verb, object, freq });
    } catch (e) {
      errs.push(`build failed: ${e.message}`);
    }
    if (!es) continue;
    if (seen.has(es)) continue;
    seen.add(es);
    (errs.length ? rejected : kept).push({ es, en: gloss(p.en, freq), errs });
  }
  if ((round + 1) % 5 === 0)
    console.log(`[${ts()}] round ${round + 1}/${rounds}: ${kept.length} kept, ${rejected.length} rejected`);
}

const after = await thermalState();
const r = gov.report();
await mkdir(dirname(outPath), { recursive: true });
await writeFile(
  outPath,
  JSON.stringify(
    {
      module: moduleId,
      lang: "es",
      model,
      generatedBy: "scripts/draft/batch-es.mjs",
      // Loud on purpose. This file is INPUT to a verification pass, not content.
      warning:
        "DRAFT. Grammaticality is guaranteed by the frame; MEANING is not. " +
        "A frontier model must read every sentence before any of it reaches a learner.",
      calls,
      kept,
      rejected,
    },
    null,
    2,
  ),
);

console.log(`\n[${ts()}] done — ${kept.length} unique kept, ${rejected.length} rejected, ${calls} model calls`);
console.log(`wall ${(r.wallMs / 60000).toFixed(1)}min · busy ${(r.busyMs / 60000).toFixed(1)}min · achieved duty ${r.actualDuty} (target ${r.targetDuty})`);
console.log(`thermal after: throttled=${after.throttled} ${after.warnings.join("; ")}`);
console.log(`corpus → ${outPath}`);
