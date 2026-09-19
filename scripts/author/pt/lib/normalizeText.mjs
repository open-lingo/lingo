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
