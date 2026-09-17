/**
 * Q6 coverage-95: for reading/listening comprehension steps, >= 95% of
 * tokens are known. Reuses Q1's tool (`jaSurfaces` + `gateResidual`);
 * reports the percentage as evidence per the brief.
 */
export const id = "Q6";
export const question =
  "does at least 95% of this comprehension step's text decompose into known words?";
// INFORMATIONAL, not enforced — shares Q1's tool and its measured
// limitation (gate.ts has no conjugation model; a listening_comprehension
// line using a just-taught conjugated form undercounts as "unknown"). See
// docs/procedural-qa-2026-09-17.md.
export const enforced = false;

const COMPREHENSION_TYPES = new Set(["listening_comprehension", "dialogue_listen"]);

export function appliesTo(step) {
  return COMPREHENSION_TYPES.has(step.type);
}

export async function run(step, ctx) {
  const surfaces = ctx.jaSurfaces(step);
  if (surfaces.length === 0) return { answer: "n/a", evidence: ["no kana surface to measure"] };
  let totalChars = 0;
  let residualChars = 0;
  const perSurface = [];
  for (const surface of surfaces) {
    const nospace = surface.replace(/\s/g, "");
    const residual = ctx.gateResidual(surface, ctx.lang, ctx.moduleNum);
    totalChars += nospace.length;
    residualChars += residual.length;
    if (residual) perSurface.push(`"${surface}" unknown: "${residual}"`);
  }
  const pct = totalChars === 0 ? 100 : Math.round(((totalChars - residualChars) / totalChars) * 1000) / 10;
  const evidence = [`${pct}% known (${totalChars - residualChars}/${totalChars} chars)`, ...perSurface];
  return { answer: pct >= 95 ? "yes" : "no", evidence };
}

/** Plant: append a long above-level clause so coverage drops well under
 *  95%. */
export function plant(step) {
  const clone = structuredClone(step);
  const junk = "ゼツメツキグシュホゴホウガイチョウジュルイガタクサンイマスガ";
  if ("transcript" in clone) clone.transcript = `${clone.transcript}${junk}`;
  else if (Array.isArray(clone.lines) && clone.lines.length > 0) {
    clone.lines = clone.lines.map((l, i) => (i === 0 ? { ...l, kana: `${l.kana}${junk}` } : l));
  }
  return clone;
}
