/**
 * Word-level romaji lexicon + kana-aware annotator (2026-07-06).
 *
 * Spencer: per-kana romaji ruby ("ga ku se i" spaced glyph-by-glyph over
 * がくせい) is hard to read once a learner is past the kana-learning phase —
 * group it into ONE authored word romaji ("gakusei") rendered once above the
 * whole word.
 *
 * Two hard rules baked in:
 *  1. NEVER algorithmically join per-glyph romaji — sokuon/long vowels make
 *     that wrong (がっこう would join to "ga?kou", not "gakkou"). Only
 *     authored word romaji enters the lexicon: the 750 course atoms all
 *     carry a hand-written `romaji` field, plus a small hand-authored
 *     function-word list below.
 *  2. Word grouping only applies past the kana phase (reached module > 2).
 *     For M1–M2 learners the per-kana alignment IS the lesson — they're
 *     mapping kana to sounds glyph by glyph.
 *
 * Segmentation: greedy longest-match alone is a trap — ねこはいぬです would
 * match はい ("yes") across the particle boundary (ねこ|はい|ぬ…). We run a
 * tiny dynamic program over the tokenized kana instead: lexicon words cost 0,
 * a lone particle kana costs 1, any other lone kana costs 2; cheapest
 * segmentation wins, ties prefer the longer leading word. That parses
 * ねこはいぬです as ねこ|は|いぬ|です. Unmatched runs (conjugated verb stems
 * etc.) simply stay per-kana — the safe fallback is always yesterday's
 * behavior.
 */
import type { AnnotationFragment } from "@/shared/language/types";
import { KANA_ROMAJI, tokenizeJapanese, isKana, type JaToken } from "@/shared/japanese/kanaTable";
import { JA_COURSE_ATOMS } from "./courseAtoms";

// ── Lexicon ──────────────────────────────────────────────────────────────

/**
 * Hand-authored romaji for high-frequency function words the atom registry
 * doesn't carry as standalone atoms. Deliberately conservative — only forms
 * whose romanization is unambiguous. Applied AFTER atoms so these deliberate
 * spellings win any collision.
 */
const FUNCTION_WORD_ROMAJI: Record<string, string> = {
  です: "desu",
  でした: "deshita",
  じゃない: "janai",
  ます: "masu",
  ました: "mashita",
  ません: "masen",
  ましょう: "mashou",
  ませんでした: "masen deshita",
};

type Lexicon = {
  /** kana surface → authored romaji. Keys are pure kana, ≥2 tokenized units. */
  map: Map<string, string>;
  /** Longest key length in tokenized units — bounds the DP lookahead. */
  maxUnits: number;
};

let _lexicon: Lexicon | null = null;

function getLexicon(): Lexicon {
  if (_lexicon) return _lexicon;
  const map = new Map<string, string>();
  let maxUnits = 0;

  const add = (kana: string, romaji: string) => {
    if (!romaji) return;
    const chars = Array.from(kana);
    if (chars.length === 0 || !chars.every(isKana)) return;
    const units = tokenizeJapanese(kana).length;
    // Single-unit surfaces never group: particles (は must keep contextual
    // per-kana treatment) and one-syllable words render identically anyway.
    if (units < 2) return;
    map.set(kana, romaji);
    maxUnits = Math.max(maxUnits, units);
  };

  for (const atom of JA_COURSE_ATOMS) add(atom.kana, atom.romaji);
  for (const [kana, romaji] of Object.entries(FUNCTION_WORD_ROMAJI)) {
    add(kana, romaji);
  }

  _lexicon = { map, maxUnits };
  return _lexicon;
}

/** Single-kana particles (topic は, object を …) — cheap lone-kana in the DP
 *  so segmentations that isolate a real particle beat ones that orphan an
 *  arbitrary syllable (the ねこ|はい|ぬ trap). */
let _particleKana: Set<string> | null = null;

function getParticleKana(): Set<string> {
  if (_particleKana) return _particleKana;
  _particleKana = new Set(
    JA_COURSE_ATOMS.filter(
      (a) => a.kind === "particle" && Array.from(a.kana).length === 1,
    ).map((a) => a.kana),
  );
  return _particleKana;
}

// ── Annotator ────────────────────────────────────────────────────────────

function perKanaFragment(tok: JaToken): AnnotationFragment {
  return tok.kana
    ? {
        text: tok.text,
        reading: tok.romaji ?? KANA_ROMAJI[tok.text] ?? "",
        symbolId: `ja:${tok.text}` as `${string}:${string}`,
      }
    : { text: tok.text };
}

const LONE_PARTICLE_COST = 1;
const LONE_KANA_COST = 2;

/**
 * Tokenize + annotate a JA string. With `groupWords` false this reproduces
 * the historical per-kana emission exactly. With it true, kana spans that
 * segment into lexicon words become single word fragments (`symbols` carries
 * the contained units for exposure tracking).
 */
export function annotateJapaneseText(
  token: string,
  groupWords: boolean,
): AnnotationFragment[] {
  const tokens = tokenizeJapanese(token);
  if (!groupWords) return tokens.map(perKanaFragment);

  const { map, maxUnits } = getLexicon();
  if (map.size === 0 || maxUnits < 2) return tokens.map(perKanaFragment);
  const particles = getParticleKana();

  const n = tokens.length;
  // best[i] = cheapest cost to segment tokens[i..n); choice[i] = segment
  // length taken at i on that cheapest path. Iterating lengths descending
  // with strict `<` improvement prefers the longer word on cost ties.
  const best = new Array<number>(n + 1).fill(Infinity);
  const choice = new Array<number>(n).fill(1);
  best[n] = 0;

  for (let i = n - 1; i >= 0; i--) {
    const maxLen = Math.min(maxUnits, n - i);
    for (let len = maxLen; len >= 1; len--) {
      let cost: number;
      if (len === 1) {
        const tok = tokens[i];
        cost = !tok.kana ? 0 : particles.has(tok.text) ? LONE_PARTICLE_COST : LONE_KANA_COST;
      } else {
        if (!tokens[i].kana) continue;
        const joined = tokens
          .slice(i, i + len)
          .map((t) => t.text)
          .join("");
        if (!map.has(joined)) continue;
        cost = 0;
      }
      const total = cost + best[i + len];
      if (total < best[i]) {
        best[i] = total;
        choice[i] = len;
      }
    }
  }

  const fragments: AnnotationFragment[] = [];
  for (let i = 0; i < n; ) {
    const len = choice[i];
    if (len === 1) {
      fragments.push(perKanaFragment(tokens[i]));
    } else {
      const span = tokens.slice(i, i + len);
      const text = span.map((t) => t.text).join("");
      fragments.push({
        text,
        reading: map.get(text)!,
        symbols: span.map((t) => t.text),
      });
    }
    i += len;
  }
  return fragments;
}

// ── Kana-phase gate ──────────────────────────────────────────────────────

/**
 * Mirror of `unlockLessonAtoms.ts` STORAGE_KEY. Deliberately NOT imported:
 * that module pulls `lessonAtomIndex` → the language registry, and the
 * registry consumes `jaModule` at top level — importing it from here (which
 * `module.ts` imports) would create the app's first module.ts → registry
 * evaluation cycle (TDZ crash risk depending on boot order). A read-only
 * key mirror with a fail-safe default is the lesser evil; if the key ever
 * renames, the symptom is per-kana romaji (yesterday's behavior), not a
 * crash.
 */
const UNLOCKED_ATOMS_STORAGE_KEY = "lingo:unlocked-atoms";

let _atomModuleById: Map<string, string> | null = null;

function getAtomModuleById(): Map<string, string> {
  if (_atomModuleById) return _atomModuleById;
  _atomModuleById = new Map(
    JA_COURSE_ATOMS.map((a) => [a.id, a.fromModule as string]),
  );
  return _atomModuleById;
}

const PHASE_CACHE_TTL_MS = 2_000;
let _phaseCache: { value: boolean; at: number } | null = null;

/**
 * True once the learner has any unlocked atom from beyond the M1–M2 kana
 * phase. TTL-cached (annotate runs on every AnnotatedText mount); the cache
 * self-heals within ~2s of unlocks or a Start Over. Fail-safe: any parse
 * problem → false → per-kana rendering (the historical behavior).
 */
export function isPastKanaPhase(): boolean {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  if (_phaseCache && now - _phaseCache.at < PHASE_CACHE_TTL_MS) {
    return _phaseCache.value;
  }
  let value = false;
  try {
    const raw = window.localStorage.getItem(UNLOCKED_ATOMS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) {
        const byId = getAtomModuleById();
        for (const id of arr) {
          if (typeof id !== "string") continue;
          const bare = id.startsWith("ja:") ? id.slice(3) : id;
          const mod = byId.get(bare);
          if (mod && mod !== "m1" && mod !== "m2") {
            value = true;
            break;
          }
        }
      }
    }
  } catch {
    value = false;
  }
  _phaseCache = { value, at: now };
  return value;
}

/** Test hook: drop the memoized phase verdict (and lexicon, for isolation). */
export function __resetRomajiLexiconCachesForTest(): void {
  _phaseCache = null;
  _lexicon = null;
  _particleKana = null;
  _atomModuleById = null;
}
