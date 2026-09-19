/**
 * lib/ttsExtract.mjs — every TTS string a compiled lesson needs, with the
 * hash the TTS lane keys clips by: `sha256("pt:" + text).hex.slice(0,16)`
 * (verified against PTAUTH-L1-report.md's own table — every row there
 * reproduces under this exact recipe).
 *
 * `text` is the COMPILED audio string — `lower1(bare(pt))` for most kinds
 * (mirrors `assemble.mjs`'s own normalization before a string becomes real
 * `audioText`), except `sim` NPC/reply lines, which `simLit`'s emitter
 * passes through VERBATIM (no normalization) — see PTAUTH-L1-report.md's
 * own caveat row.
 */
import { createHash } from "node:crypto";
import { bare, lower1 } from "../../../draft/pt-ir/assemble.mjs";

const hash = (text) => createHash("sha256").update(`pt:${text}`, "utf8").digest("hex").slice(0, 16);
const norm = (pt) => lower1(bare(pt));

export function extractTts(lesson, atoms) {
  const seen = new Map(); // normalized text -> {hash, text, sources: []}
  const add = (text, source) => {
    if (!text) return;
    const entry = seen.get(text) ?? { hash: hash(text), text, sources: [] };
    entry.sources.push(source);
    seen.set(text, entry);
  };

  for (const a of atoms ?? []) add(norm(a.surface), "atom");

  for (const s of lesson.steps ?? []) {
    switch (s.kind) {
      case "map":
        add(s.audioText, `${s.id} (map audioText, author-normalized)`);
        break;
      case "sim":
        for (const t of s.turns ?? []) {
          add(t.npc.audioText ?? t.npc.pt, `${s.id}.${t.id} (npc, raw — simLit does not normalize)`);
          const r = t.reply;
          if (r.mode === "choice") for (const o of r.options ?? []) add(o.text, `${s.id}.${t.id} (reply option, raw)`);
          if (r.audioText) add(r.audioText, `${s.id}.${t.id} (reply audioText, raw)`);
        }
        break;
      case "agreementLit":
        if (s.audioText) add(s.audioText, `${s.id} (agreementLit audioText, raw)`);
        break;
      case "matchLit":
        break; // pairs are text-only in the closing match, no dedicated audio
      default:
        if (s.pt) add(norm(s.pt), `${s.id} (${s.kind})`);
    }
  }

  return [...seen.values()].sort((a, b) => a.hash.localeCompare(b.hash));
}
