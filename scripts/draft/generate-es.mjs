/**
 * generate-es.mjs — draft Spanish example sentences with a local model.
 *
 *   node scripts/draft/generate-es.mjs m8 --model qwen3:4b --n 12 --duty 0.8
 *
 * The model returns SLOT CHOICES only. Spanish is assembled by the frame, so
 * grammaticality and agreement are guaranteed rather than sampled — the
 * measured difference between 1/12 and 12/12 usable on the JA side.
 */
import { ES_FRAMES, gloss } from "./frames-es.mjs";
import { makeGovernor } from "./throttle.mjs";

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
const n = Number(flag("n", "12"));
const duty = Number(flag("duty", "1.0"));

const verbNames = frame.verbs.map((v) => v.lemma);
const objNames = frame.objects.map((o) => o.noun);

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
          freq: { type: "string", enum: frame.frequency.map((f) => f ?? "none") },
          en: { type: "string" },
        },
        required: ["person", "verb", "object", "freq", "en"],
      },
    },
  },
  required: ["picks"],
};

const prompt = [
  "You are choosing word combinations for a Spanish beginner lesson about daily routines.",
  "",
  `Choose ${n} DIFFERENT combinations. For each pick:`,
  `  person: one of ${frame.persons.join(", ")}`,
  `  verb:   one of ${verbNames.join(", ")}`,
  `  object: one of ${objNames.join(", ")} — or "none"`,
  `  freq:   one of ${frame.frequency.filter(Boolean).join(", ")} — or "none"`,
  `  en:     the English meaning WITHOUT the frequency word, PRESENT tense,`,
  `          matching the person you chose — e.g. "I listen to music"`,
  "",
  "Rules that decide whether a pick is good:",
  "  - The verb and object must make real-world sense together. 'escuchar música'",
  "    (listen to music) is good; 'cocinar música' (cook music) is not.",
  `  - These verbs take NO object, so use "none": ${[...frame.intransitive].join(", ")}.`,
  "  - Every other verb MUST have an object.",
  "  - Vary the person and the verb across your picks; do not repeat a combination.",
  '  - The English must match the person: yo="I", tu="you", el="he/she",',
  '    nosotros="we", ustedes="they".',
  "",
  "Do not write any Spanish sentence. Only choose the slots.",
  "/no_think",
].join("\n");

const gov = makeGovernor({ duty });
const t0 = Date.now();
const res = await gov.run(() =>
  fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      // Reasoning models route schema-constrained output into `thinking` and
      // return an EMPTY `response` unless this is set at the API level.
      // `/no_think` in the prompt is not sufficient — it looks like a broken
      // endpoint rather than a truncation, which costs a debugging round.
      think: false,
      format: schema,
      options: gov.options({ num_ctx: 8192, num_predict: 2048, temperature: 0.9 }),
    }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`ollama ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return r.json();
  }),
);

const parsed = JSON.parse(res.response);
const objByName = Object.fromEntries(frame.objects.map((o) => [o.noun, o]));

let ok = 0;
const rows = [];
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
  if (!errs.length) ok += 1;
  rows.push({ es, en: gloss(p.en, freq), errs });
}

console.log(`\nES ${moduleId} · model=${model} · ${((Date.now() - t0) / 1000).toFixed(1)}s · duty=${duty}`);
console.log(`prompt ${res.prompt_eval_count} tok / gen ${res.eval_count} tok\n`);
for (const r of rows) {
  console.log(`${r.errs.length ? "✗" : "✓"} ${r.es ?? "(no sentence)"}`);
  console.log(`   ${r.en}`);
  for (const e of r.errs) console.log(`   ! ${e}`);
}
console.log(`\n${ok}/${rows.length} passed the frame's residual checks.`);
console.log("Grammaticality is NOT part of that score — the frame guarantees it.");
