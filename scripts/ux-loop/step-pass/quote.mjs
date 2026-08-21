// quote.mjs — the vision GENERATOR (local qwen3.5-122B). Looks at one step
// screenshot and QUOTES candidate UI issues, each tagged with a machine-checkable
// claim_kind so classify.mjs can confirm it against the DOM measurement or refute
// it as a false positive. The model never decides — it only proposes.
//
// Free to run (local), so we let it be exhaustive; the measurement is the filter.
import { readFileSync } from "node:fs";
import { MEASURABLE_KINDS, TASTE_KINDS } from "./classify.mjs";

const MODEL = process.env.UX_JUDGE_MODEL ?? "qwen3.5:122b-a10b-q4_K_M";
const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
const KINDS = [...MEASURABLE_KINDS, ...TASTE_KINDS];

const SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string", description: "the region/element, e.g. 'gems pill', 'Check button', 'option 2 tile'" },
          issue: { type: "string", description: "what is visibly wrong" },
          suggestion: { type: "string", description: "a specific, concrete fix" },
          claim_kind: { type: "string", enum: KINDS, description: "which kind of problem this is" },
          severity: { type: "string", enum: ["notable", "minor", "polish"] },
        },
        required: ["area", "issue", "suggestion", "claim_kind", "severity"],
      },
    },
  },
  required: ["suggestions"],
};

const PROMPT = (stepType, viewport) => `You are a senior product designer doing a fresh-eyes UI review of ONE exercise screen from a language-learning app. This is the "${stepType}" step type, shown at ${viewport}. Report every UI/UX issue you can SEE, and classify each by claim_kind:

MEASURABLE (geometry — only claim these when you can actually see them):
- edge-bleed: an element flush against / touching a screen edge with no margin
- clipped: an element cut off / cropped by a container or the screen edge (e.g. a badge under the notch)
- tap-target: an interactive control that looks too small to tap comfortably
- truncation: text cut off with an ellipsis or hard clip when it shouldn't be
- overflow: content taller than the card so it must scroll vertically
- cta-fold: the primary action (Check/Continue) sits below the fold, off-screen
- reflow-on-submit: (only if obvious) layout that would shift when answered

TASTE (judgment — no geometry):
- hierarchy: unclear primary action / weak emphasis
- contrast: hard-to-read text, low contrast
- spacing: cramped or loose spacing, unbalanced margins
- alignment: misalignment, off-center
- consistency: inconsistent radii / sizes / styles
- copy: wording problems
- other: anything else

Be specific and actionable ("give the gems pill an 8px right margin", not "improve spacing"). Do NOT invent problems you cannot see — a clean screen should return few or zero suggestions. Prefer precision over volume. Return JSON only.`;

export async function quoteScreen(imgPath, { stepType = "step", viewport = "phone", model = MODEL } = {}) {
  const img = readFileSync(imgPath).toString("base64");
  const t0 = Date.now();
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      think: false, // qwen3.5 reasoning model — else it spends num_predict on hidden thinking
      format: SCHEMA,
      messages: [{ role: "user", content: PROMPT(stepType, viewport), images: [img] }],
      options: { num_ctx: 16384, num_predict: 3500, temperature: 0.2 },
    }),
  });
  const body = await res.json();
  const text = body?.message?.content ?? "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { suggestions: [], error: `unparseable: ${text.slice(0, 120)}`, ms: Date.now() - t0 };
  }
  return { suggestions: parsed.suggestions ?? [], ms: Date.now() - t0 };
}

// CLI: node quote.mjs <imgPath> <stepType> <viewport>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [img, stepType = "step", viewport = "phone"] = process.argv.slice(2);
  if (!img) { console.error("usage: node quote.mjs <imgPath> [stepType] [viewport]"); process.exit(1); }
  const r = await quoteScreen(img, { stepType, viewport });
  console.log(JSON.stringify(r, null, 2));
}
