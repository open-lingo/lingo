/**
 * Q4 particle-own-tile: in a build/listen step, a particle must be its own
 * tile — "わたしは" as one tile lets the learner skip choosing は vs が vs を.
 *
 * Tool: the existing `particleTileSeparation.test.ts` rule, ported (not
 * imported — it is a `.test.ts` file that calls `describe/it` at module
 * evaluation time, which is unsafe to load outside a vitest runner). The
 * PARTICLES / LEXICALIZED / NAIDE_UNIT constants below are a literal copy of
 * that file's; keep them in sync if that file's allowlist changes (the
 * "second copy" risk `codebase-search`'s SKILL.md flags — there is no other
 * way to reuse a `.test.ts`-only rule from a plain script).
 */
const PARTICLES = ["から", "まで", "は", "が", "を", "に", "で", "と", "の", "へ", "も", "や"];

const LEXICALIZED = new Set([
  "いつも",
  "でも",
  "ので",
  "それで",
  "それから",
  "では",
  "はは",
  "もの",
  "もも",
  "この",
  "こと",
  "どうも",
  "くんで",
]);

const NAIDE_UNIT = /ないで$/;

export const id = "Q4";
export const question = "is every particle its own tile in this build/listen step?";
export const enforced = true;

const BUILD_TYPES = new Set(["build_sentence", "listening_build"]);

export function appliesTo(step) {
  return BUILD_TYPES.has(step.type) && Array.isArray(step.tiles) && step.tiles.length > 0;
}

function violationsFor(tiles, atomSurfaces) {
  const violations = [];
  for (const tok of new Set(tiles)) {
    if (typeof tok !== "string" || LEXICALIZED.has(tok) || NAIDE_UNIT.test(tok)) continue;
    for (const p of PARTICLES) {
      if (tok.length <= p.length || !tok.endsWith(p)) continue;
      const stem = tok.slice(0, -p.length);
      const stemIsParticle = PARTICLES.includes(stem);
      const knownDoubleGlue = tok === "のが";
      if ((atomSurfaces.has(stem) && !stemIsParticle) || knownDoubleGlue) {
        violations.push(`"${tok}" = ${stem} + ${p}`);
        break;
      }
    }
  }
  return violations;
}

export async function run(step, ctx) {
  const tokens = [...(step.tiles ?? []), ...(step.correctOrder ?? [])];
  const atomSurfaces = ctx.atomSurfaceSet;
  const violations = violationsFor(tokens, atomSurfaces);
  if (violations.length === 0) return { answer: "yes", evidence: [`${step.tiles.length} tile(s), none glue a word to a particle`] };
  return { answer: "no", evidence: violations };
}

/** Plant: glue a known atom to a trailing topic particle inside one tile,
 *  the exact class the real rule bans.
 *
 *  Glues onto あなた, not わたし: courseAtoms registers わたし only inside
 *  whole `partOfSpeech: "expression"` sentence atoms ("わたしは すしを
 *  たべます"), never as a bare-word atom, so `atomSurfaces.has("わたし")`
 *  is false against the real gate's own atom source (`courseAtoms.surface
 *  ?? kana` — see `lib/lexicon.mjs`'s `getCourseAtomSurfaces`) and a
 *  わたしは plant would silently pass. あなた ("you", m1) is a real bare
 *  atom there. */
export function plant(step) {
  const clone = structuredClone(step);
  if (!Array.isArray(clone.tiles) || clone.tiles.length === 0) return clone;
  clone.tiles = ["あなたは", ...clone.tiles];
  clone.correctOrder = clone.correctOrder ? ["あなたは", ...clone.correctOrder] : clone.tiles;
  return clone;
}
