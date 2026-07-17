/**
 * PLAUSIBLE WRONG READINGS for the `kanji_reading` step (2026-07-16).
 *
 * lesson-authoring-guide §13.7 is a real quality bar, not a nicety: a
 * distractor must be a NEAR-MISS the learner could actually produce.
 * "Random filler solvable by elimination" fails the step's whole purpose —
 * if three options are obviously not readings of this word, the learner
 * picks the survivor without reading anything.
 *
 * The three mistake families we model, in priority order (most diagnostic
 * first — a wrong on/kun is a real knowledge gap; a rendaku slip is a
 * phonological one):
 *
 *   1. VALID-BUT-WRONG ON/KUN — the glyph really does have this reading,
 *      just not in this word. 水 is みず (kun) but also スイ (on) → すい.
 *      Sourced from the `N5_KANJI` catalog, so these are never invented.
 *   2. WRONG OKURIGANA STEM — for a kanji+okurigana surface (食べる), the
 *      trailing kana are fixed by the surface and only the STEM varies.
 *      た(べる) vs しょく(べる): exactly the error of reaching for the
 *      on-reading of a kun-reading verb. Generated stems keep the real
 *      okurigana so the option stays orthographically well-formed.
 *   3. RENDAKU / GEMINATION / LONG-VOWEL slips — でんしゃ→てんしゃ (rendaku
 *      undone), みっつ→みつ (small tsu dropped), きゅう→きゅ (long vowel
 *      dropped). These share the initial mora with the answer, satisfying
 *      §13.7's "distractors should share initial mora" rule.
 *
 * Family 3 is the fallback that guarantees we can always fill 4 options for
 * multi-kanji compounds, where there is no reliable way to split the reading
 * across component glyphs (電車 → で+んしゃ? んし+ゃ?) and so family 1/2 don't
 * apply. Authors can always override via `kanjiReading(..., {distractors})`.
 */
import { isKana } from "@/shared/japanese/kanaTable";
import { N5_KANJI } from "./n5Kanji";

const HAS_HAN = /\p{Script=Han}/u;

/** Katakana → hiragana (on-readings are catalogued in katakana). */
function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60),
  );
}

function isPureKana(s: string): boolean {
  return s.length > 0 && Array.from(s).every(isKana);
}

/**
 * Rendaku (sequential voicing) pairs. Toggling either way models both the
 * "forgot to voice" and "voiced when you shouldn't" errors.
 */
const VOICING: ReadonlyArray<readonly [string, string]> = [
  ["か", "が"], ["き", "ぎ"], ["く", "ぐ"], ["け", "げ"], ["こ", "ご"],
  ["さ", "ざ"], ["し", "じ"], ["す", "ず"], ["せ", "ぜ"], ["そ", "ぞ"],
  ["た", "だ"], ["ち", "ぢ"], ["つ", "づ"], ["て", "で"], ["と", "ど"],
  ["は", "ば"], ["ひ", "び"], ["ふ", "ぶ"], ["へ", "べ"], ["ほ", "ぼ"],
];
const VOICE = new Map<string, string>();
for (const [u, v] of VOICING) {
  VOICE.set(u, v);
  VOICE.set(v, u);
}

/** All catalogued readings of a single glyph, in kana, okurigana stripped.
 *  Kunyomi are stored as "た.べる" — the part before the dot is the stem
 *  that the kanji itself spells; the rest is okurigana. */
function catalogReadings(ch: string): { on: string[]; kunStems: string[] } {
  const on: string[] = [];
  const kunStems: string[] = [];
  for (const e of N5_KANJI) {
    if (e.character !== ch) continue;
    for (const o of e.onyomi) on.push(toHiragana(o));
    for (const k of e.kunyomi) kunStems.push(toHiragana(k.split(".")[0]));
  }
  return { on, kunStems };
}

/** Trailing kana of a surface — the okurigana, fixed by the spelling.
 *  食べる → "べる"; 水 → ""; 電車 → "". */
function okurigana(kanji: string): string {
  const chars = Array.from(kanji);
  let i = chars.length;
  while (i > 0 && isKana(chars[i - 1])) i--;
  return chars.slice(i).join("");
}

/** Han glyphs of a surface, in order. */
function hanChars(kanji: string): string[] {
  return Array.from(kanji).filter((c) => HAS_HAN.test(c));
}

/**
 * Homophone kana pairs learners genuinely mix up when writing a reading:
 * ず/づ and じ/ぢ are pronounced identically in standard Japanese, so the
 * choice is pure orthographic knowledge — a strong, non-eliminable
 * distractor (みず → みづ).
 */
const HOMOPHONE = new Map<string, string>([
  ["ず", "づ"], ["づ", "ず"], ["じ", "ぢ"], ["ぢ", "じ"],
]);

/**
 * Family 3: phonological near-misses. Every one shares the initial mora
 * with the answer (§13.7's audio rule) and is a real learner error.
 *
 * Deliberately all IN-PLACE mutations (substitute / delete a mora) — never
 * an append. An appended mora (たべる → たべるう) is orthographically
 * impossible for a verb and reads as filler, which §13.7 forbids.
 */
function phonologicalNearMisses(reading: string): string[] {
  const out: string[] = [];
  const chars = Array.from(reading);

  // small-tsu dropped (みっつ → みつ) / long vowel dropped (きゅう → きゅ)
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "っ" || chars[i] === "ー" || (chars[i] === "う" && i > 0)) {
      out.push([...chars.slice(0, i), ...chars.slice(i + 1)].join(""));
    }
  }
  // rendaku toggled, word-internal site first (the real rendaku position),
  // then the head (でんしゃ → てんしゃ).
  for (let i = chars.length - 1; i >= 0; i--) {
    const alt = VOICE.get(chars[i]);
    if (!alt) continue;
    out.push([...chars.slice(0, i), alt, ...chars.slice(i + 1)].join(""));
  }
  // ず/づ · じ/ぢ orthographic confusion (みず → みづ).
  for (let i = 0; i < chars.length; i++) {
    const alt = HOMOPHONE.get(chars[i]);
    if (!alt) continue;
    out.push([...chars.slice(0, i), alt, ...chars.slice(i + 1)].join(""));
  }
  return out;
}

/**
 * Family 1b (compounds): swap ONE glyph's reading in a multi-kanji word,
 * keeping the other — the 重箱/湯桶読み error, i.e. mixing on- and
 * kun-readings across a compound. 電車 でんしゃ → でんくるま (車 read as its
 * kun くるま instead of its on シャ). Every result is built from catalogued
 * readings, so these are wrong words but never invented sounds.
 *
 * Only handles the 2-glyph case, which is every multi-kanji word in the
 * shipped catalog (21 of them, per the spec's dry-run §6). Longer compounds
 * fall through to family 3 + author-supplied distractors.
 */
function compoundNearMisses(glyphs: string[], reading: string): string[] {
  if (glyphs.length !== 2) return [];
  const a = catalogReadings(glyphs[0]);
  const b = catalogReadings(glyphs[1]);
  const aReadings = [...new Set([...a.on, ...a.kunStems])];
  const bReadings = [...new Set([...b.on, ...b.kunStems])];
  const out: string[] = [];
  for (const head of aReadings) {
    if (!reading.startsWith(head)) continue;
    const rest = reading.slice(head.length);
    // vary the tail glyph, keeping the (correct) head
    for (const alt of bReadings) if (alt !== rest) out.push(head + alt);
    // vary the head glyph, keeping the (correct) tail
    for (const alt of aReadings) if (alt !== head) out.push(alt + rest);
  }
  return out;
}

/**
 * Plausible wrong readings of `kanji`, best-first, excluding `reading`
 * itself. Deterministic. May return fewer than 3 for exotic surfaces —
 * `kanjiReading` throws in that case so the gap surfaces at authoring time
 * rather than shipping a 2-option MCQ.
 */
export function readingDistractors(kanji: string, reading: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>([reading]);
  const push = (c: string) => {
    if (!isPureKana(c) || seen.has(c)) return;
    seen.add(c);
    out.push(c);
  };

  const oku = okurigana(kanji);
  const glyphs = hanChars(kanji);

  if (glyphs.length === 1) {
    // Families 1 + 2 — a single glyph, so its catalogued readings ARE the
    // candidate stems and the okurigana (if any) rides along unchanged.
    const { on, kunStems } = catalogReadings(glyphs[0]);
    for (const stem of [...on, ...kunStems]) push(stem + oku);
  } else {
    // Family 1b — cross-glyph on/kun mixing.
    for (const c of compoundNearMisses(glyphs, reading)) push(c);
  }
  // Family 3 — always available, and the backstop for long compounds.
  // Mutate the STEM only, then re-append the okurigana: the okurigana is
  // spelled out by the surface the learner is looking at, so a distractor
  // that alters it (食べる → たへる) is orthographically impossible and gets
  // eliminated on sight. Only the stem is genuinely in question.
  const stem = oku && reading.endsWith(oku)
    ? reading.slice(0, reading.length - oku.length)
    : reading;
  for (const c of phonologicalNearMisses(stem)) push(c + oku);

  return out;
}
