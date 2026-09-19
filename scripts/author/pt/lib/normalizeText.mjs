/**
 * lib/normalizeText.mjs — PTGRADE's capitalization + terminal-punctuation
 * finding: L3-L5's hand-authored lessons shipped lowercase sentence-initial
 * text with no final punctuation. `normalizeSentence` fixes both
 * mechanically at emission time; `checkCapitalization` (used by
 * `lib/checkRules.mjs`) independently re-verifies the ON-DISK fragment so a
 * later hand-edit can't silently reintroduce the bug.
 */
import { PT_PERSONAS } from "./rules.mjs";

const PERSONA_RE = new RegExp(`\\b(${[...PT_PERSONAS].join("|")})\\b`, "gi");

/** Capitalize the sentence-initial letter, restore persona capitalization
 *  anywhere they appear mid-sentence, and append "." when the sentence has
 *  no terminal .?!… already. Leaves everything else (accents, punctuation
 *  mid-sentence) untouched — this is a targeted fix, not a rewrite. */
export function normalizeSentence(s) {
  if (!s) return s;
  let out = s.replace(PERSONA_RE, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  out = out.charAt(0).toUpperCase() + out.slice(1);
  if (!/[.?!…]$/.test(out.trim())) out = out.trim() + ".";
  return out;
}

/**
 * ROUND 3 (lane PTTOOL3, rule 7): finds the LITERAL token in `sentence`
 * (already run through `normalizeSentence`, so sentence-initial
 * capitalization is the FINAL, emitted capitalization) matching `surface`
 * case-insensitively with trailing punctuation stripped — e.g. `surface:
 * "onde"` against "Onde é a capital?" returns "Onde", not "onde". R2-L2
 * hit exactly this: a cloze `blank: "onde"` didn't literally appear as a
 * token of a sentence that opened "Onde ...", and `assemble.mjs`'s own
 * `words(pt).indexOf(blank)` requires an EXACT (case + punctuation)
 * match — the round-1 workaround was to re-word the sentence so the atom
 * was never sentence-initial. Returns `null` when no token matches at
 * all (a genuine authoring error elsewhere will still name it). */
export function literalToken(sentence, surface) {
  const bareSentence = sentence.replace(/\.$/, ""); // mirrors assemble.mjs's own `bare`
  const tokens = bareSentence.split(" ");
  const target = surface.toLowerCase();
  return tokens.find((t) => t.replace(/[.,!?;:]+$/, "").toLowerCase() === target) ?? null;
}

/**
 * Collapses options that are the SAME word differing only by case (R2-L2:
 * a cloze offered "Onde" and "onde" as two distinct options of one cloze)
 * into one entry — always keeping `mustKeep`'s exact literal form for its
 * own key, so the true blank's answer is never the form that got dropped.
 */
export function dedupeOptionsCaseInsensitive(options, mustKeep) {
  const seen = new Map();
  for (const o of options) {
    const key = o.toLowerCase();
    if (!seen.has(key)) seen.set(key, o);
  }
  seen.set(mustKeep.toLowerCase(), mustKeep);
  return [...seen.values()];
}

/**
 * ITEM 3 (lane PTTOOL5): a `map` pair glosses a single PRINTED TOKEN, so it
 * must take only the FIRST clause of a multi-clause atom `meaningEn`
 * ("to speak, to talk" -> "to speak"; "of / from" -> "of") — the whole
 * dictionary entry read out for one word is not a translation of that
 * word in context, and PTGRADE3/4/5 all found it leaking through
 * (`falar`'s "to speak, to talk." inside a sentence-level gloss). Comma
 * wins over slash when a gloss has both, since "," is always the
 * dictionary-sense separator in this course's `meaningEn` values, while
 * "/" sometimes appears WITHIN a single sense ("of / from" as one loose
 * preposition sense) — splitting on comma first keeps that sense intact.
 */
export function firstGloss(meaningEn) {
  if (!meaningEn) return meaningEn;
  const parts = meaningEn.includes(",") ? meaningEn.split(",") : meaningEn.split("/");
  return parts[0].trim();
}

/** True when `s` already satisfies the rule (used by the independent
 *  check — never auto-fixes, only reports). */
export function isNormalized(s) {
  if (!s) return true;
  const trimmed = s.trim();
  if (!/^[A-ZÀ-Ý]/.test(trimmed)) return false;
  if (!/[.?!…]$/.test(trimmed)) return false;
  for (const m of trimmed.matchAll(/\b([a-zà-ÿ]+)\b/g)) {
    if (PT_PERSONAS.has(m[1].charAt(0).toUpperCase() + m[1].slice(1))) return false;
  }
  return true;
}
