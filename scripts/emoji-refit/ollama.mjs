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
