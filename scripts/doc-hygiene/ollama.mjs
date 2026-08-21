// ollama.mjs — local-model client for the doc-hygiene loop.
//
// Carries the hard-won fixes from the local-model-stack memory:
//  * num_ctx set explicitly — Ollama defaults to 4096 and SILENTLY truncates,
//    so a long doc "fails" a task the model never fully saw.
//  * think:false at top level for the reasoning models (122b/qwen3) + generous
//    num_predict, or a `format`-constrained call returns EMPTY content.
//  * stream:true to dodge undici's 5-min HEADERS_TIMEOUT on long generations.
const HOST = process.env.OLLAMA_URL || "http://localhost:11434";

export const MODELS = {
  judge: "qwen3.5:122b-a10b-q4_K_M", // reasoning/judgment tier
  coder: "qwen3-coder-next:q4_K_M",  // mechanical, char-perfect
  fast: "qwen3:4b",                  // cheap classification
};

/**
 * Single-turn chat. Returns the assembled text (streamed). If `schema` is
 * given, sets Ollama's `format` to it and parses the JSON out.
 */
export async function chat(prompt, {
  model = MODELS.judge,
  system = "",
  schema = null,
  numCtx = 32768,
  numPredict = 4096,
  temperature = 0.1,
} = {}) {
  const body = {
    model,
    stream: true,
    think: false, // top-level — NOT in options (memory: reasoning-model trap)
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: prompt },
    ],
    options: { num_ctx: numCtx, num_predict: numPredict, temperature },
  };
  if (schema) body.format = schema;

  const res = await fetch(`${HOST}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text().catch(() => "")}`);

  let text = "";
  const dec = new TextDecoder();
  let buf = "";
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        const j = JSON.parse(line);
        if (j.message?.content) text += j.message.content;
      } catch { /* partial line; keep buffering */ }
    }
  }
  text = text.trim();
  if (!schema) return text;
  try {
    return JSON.parse(text);
  } catch (e) {
    // salvage a JSON object/array if the model wrapped it in prose
    const m = text.match(/[[{][\s\S]*[\]}]/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
    throw new Error(`non-JSON from ${model}: ${text.slice(0, 200)}`);
  }
}

/** Reachability + which of our models are actually installed. */
export async function preflight() {
  const res = await fetch(`${HOST}/api/tags`);
  if (!res.ok) throw new Error(`ollama not reachable at ${HOST}`);
  const { models } = await res.json();
  const have = new Set((models || []).map((m) => m.name));
  return {
    ok: true,
    judge: have.has(MODELS.judge),
    coder: have.has(MODELS.coder),
    fast: have.has(MODELS.fast),
  };
}
