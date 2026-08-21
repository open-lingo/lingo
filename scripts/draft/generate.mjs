#!/usr/bin/env node
/**
 * Draft example sentences for a module using a LOCAL model, for free.
 *
 *   node scripts/draft/generate.mjs m31 --model shisa --per 4 --rounds 3
 *   node scripts/draft/generate.mjs m31 --yaml              # emit IR beats
 *
 * The model never writes Japanese. It picks which taught words go together and
 * writes the English gloss; `frames.mjs` assembles the sentence. See that file
 * for why, and for what the two earlier designs got wrong.
 *
 * ── what this does and does not guarantee ───────────────────────────────
 *
 * GUARANTEED, by construction, with no sampling involved:
 *   - every sentence is grammatical
 *   - every word is one the learner has been taught
 *   - the module's viewpoint rules hold (each verb's slots are narrowed so the
 *     antiPattern cannot be expressed)
 *
 * NOT guaranteed, and the only thing left to read for:
 *   - that the combination means something. 「アメリカじんは わたしに シャワーを
 *     くれます」 is a perfectly grammatical sentence about being given a shower.
 *     Most of this class of error is really an inventory error — シャワー should
 *     not be in the giftable pool — so fix `semantic-pools.json` rather than
 *     patching output. That is the whole reason the pools are a committed file.
 *
 * Model notes, both measured on this repo (2026-08-15):
 *   qwen3:4b   8.8s for 24 candidates, 79% unique-and-legal, bland and
 *              repetitive pairings ("I give a boat to a person").
 *   shisa-70b  55s for 12, 100% unique-and-legal, genuinely apt pairings
 *              (doctor→medicine, friend→present). Slower, better. Default.
 */
import { readFileSync } from "node:fs";
import { taughtBefore, atomsByKana, semanticPools, giftable, pool } from "./inventory.mjs";
import { FRAMES, toBeat, beatYaml } from "./frames.mjs";

const argv = process.argv.slice(2);
const moduleId = argv.find((a) => /^m\d+$/.test(a));
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? dflt : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

if (!moduleId || !FRAMES[moduleId]) {
  console.error(
    `usage: generate.mjs <module> [--model M] [--per N] [--rounds N] [--yaml]\n` +
      `frames defined for: ${Object.keys(FRAMES).join(", ")}`,
  );
  process.exit(1);
}

const MODELS = {
  shisa: "hf.co/mradermacher/shisa-v2.1-llama3.3-70b-GGUF:Q4_K_M",
  qwen: "qwen3:4b",
};
const modelArg = flag("model", "shisa");
const model = MODELS[modelArg] ?? modelArg;
const PER = Number(flag("per", 4));
const ROUNDS = Number(flag("rounds", 3));

const frame = FRAMES[moduleId];
/**
 * The module's own declared register drives which builder `toBeat` uses. Read
 * from the IR rather than hardcoded, because the answer differs per module —
 * and read with a regex rather than a YAML parse because this is the only
 * field this script needs from the source file.
 *
 * Defaults to "plain" when the field is absent: that is the course's baseline
 * (25 of 26 IR modules) and the safe direction to fail in, since a polite draft
 * in a plain module is a hard test failure while a plain draft in a mixed
 * module is merely under-varied.
 */
const REGISTER =
  (readFileSync(
    new URL(`../../src/features/languages/ja/curriculum/ir/${moduleId}.ir.yaml`, import.meta.url),
    "utf8",
  ).match(/^register:\s*(\w+)/m)?.[1]) ?? "plain";
const taught = taughtBefore(moduleId);
const pools = semanticPools();
const atoms = atomsByKana();

// ── slot pools ──────────────────────────────────────────────────────────
const inside = frame.inside.filter((k) => taught.has(k) || k === "わたし");
const outside = pool(taught, pools, "person")
  .map((p) => p.kana)
  .filter((k) => !frame.inside.includes(k))
  // Honorific/suffix atoms (さん, さま, くん, ちゃん) and demonstratives are
  // tagged `person` in the registry but are not people who can hold a gift.
  .filter((k) => !["さま", "くん", "ちゃん", "さん", "こちら", "これ", "ぼく"].includes(k));
// Two signals, intersected. `giftable` alone admits いぬ/ねこ/かめ — a pet can
// literally be handed over, so the flag is not wrong, but "my brother gives the
// teacher a cat" is not a sentence this module wants. Requiring the CATEGORY as
// well keeps the judgment in the pools and the taste in the frame.
const OBJECT_CATEGORIES = new Set(["portable-object", "food-drink"]);
const objects = giftable(taught, pools).filter((o) => OBJECT_CATEGORIES.has(o.category));

if (!outside.length || !objects.length) {
  console.error(
    `Empty slot pool — outside people: ${outside.length}, giftable objects: ` +
      `${objects.length}. Check scripts/draft/semantic-pools.json.`,
  );
  process.exit(1);
}

const glossOf = (k) => pools[k]?.gloss ?? atoms.get(k)?.gloss ?? (k === "わたし" ? "I, me" : "");
const listFor = (kanas) => kanas.map((k) => `${k}(${glossOf(k)})`).join("、");

async function draft(variant, temperature) {
  const givers = variant.giverSide === "inside" ? inside : outside;
  const receivers = variant.receiverSide === "inside" ? inside : outside;
  const objKanas = objects.map((o) => o.kana);

  const prompt = `日本語の教材を作っています。「${variant.verb}」の例文の材料を選んでください。
${variant.hintJa}

あげる人（giver）：${listFor(givers)}
もらう人（receiver）：${listFor(receivers)}
もの（object）：${listFor(objKanas)}

場面として自然で、おたがいに違う組み合わせを${PER}個選んでください。
「だれが、だれに、なにを」が現実にありそうな組み合わせにしてください。

en には自然な英訳を書いてください。ただし日本語は【非過去形】なので、英訳も
かならず現在形か未来形にしてください。"gave" "received" "got" は使わないで
ください。（正しい例: "I'll give my friend a present" / "my friend gives me
sweets"。まちがった例: "my friend gave me a present"。）${
    variant.verb === "もらう"
      ? `\nまた「${variant.verb}」の英訳は、かならず【受け取る人】を主語にして
ください。"I get X from Y" は正しく、"Y gives me X" はまちがいです。`
      : ""
  }`;

  const schema = {
    type: "object",
    properties: {
      items: {
        type: "array",
        minItems: PER,
        maxItems: PER,
        items: {
          type: "object",
          properties: {
            giver: { type: "string", enum: givers },
            receiver: { type: "string", enum: receivers },
            object: { type: "string", enum: objKanas },
            en: { type: "string" },
          },
          required: ["giver", "receiver", "object", "en"],
        },
      },
    },
    required: ["items"],
  };

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      // Reasoning models route schema-constrained output into `thinking` and
      // return an empty `response` unless this is set at the API level.
      // `/no_think` in the prompt is NOT sufficient.
      think: false,
      format: schema,
      options: { num_ctx: 16384, num_predict: 1536, temperature },
    }),
  });
  const jj = await res.json();
  let items = [];
  try {
    items = JSON.parse(jj.response).items ?? [];
  } catch {
    // A batch that does not parse is dropped whole; oversampling covers it.
  }
  return { items, in: jj.prompt_eval_count ?? 0, out: jj.eval_count ?? 0 };
}

const seen = new Set();
const kept = [];
let tin = 0, tout = 0, produced = 0, rejected = 0;
const t0 = Date.now();

for (let r = 0; r < ROUNDS; r++) {
  const temperature = 0.55 + r * 0.2;
  const batches = await Promise.all(
    Object.values(frame.variants).map((v) => draft(v, temperature).then((b) => ({ ...b, v }))),
  );
  for (const b of batches) {
    tin += b.in;
    tout += b.out;
    for (const it of b.items) {
      produced++;
      const errs = frame.check(it, b.v);
      if (errs.length) { rejected++; continue; }
      const filled = {
        ...it,
        glossG: glossOf(it.giver),
        glossR: glossOf(it.receiver),
        glossO: glossOf(it.object),
      };
      const beat = toBeat(b.v, filled, kept.length, REGISTER);
      if (seen.has(beat.ja)) continue;
      seen.add(beat.ja);
      kept.push({ ...beat, verb: b.v.verb });
    }
  }
}

const secs = ((Date.now() - t0) / 1000).toFixed(1);

if (has("yaml")) {
  for (const k of kept) console.log(beatYaml(k));
} else {
  for (const k of kept) console.log(`${k.verb.padEnd(4)} ${k.mode.padEnd(9)} ${k.ja}\n           ${k.en}`);
}

console.error(
  `\n${kept.length} unique sentences from ${produced} candidates ` +
    `(${rejected} rejected by frame checks, ${produced - rejected - kept.length} duplicates)\n` +
    `${secs}s · ${tin} prompt / ${tout} completion tokens · model=${modelArg}\n` +
    `pools: ${inside.length} inside, ${outside.length} outside, ${objects.length} giftable`,
);
