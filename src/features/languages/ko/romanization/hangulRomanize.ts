/**
 * Korean → Revised Romanization (RR), pronunciation-based.
 *
 * Hangul is algorithmic: every syllable block (U+AC00–U+D7A3) decomposes by
 * arithmetic into an initial consonant (choseong), a medial vowel (jungseong),
 * and an optional final consonant (jongseong). RR romanizes the *pronunciation*,
 * so we apply the common cross-syllable phonological rules before emitting
 * letters:
 *   - liaison        (linking a final consonant onto a following ㅇ-onset)
 *   - ㅎ elision      (좋아요 → joayo) and aspiration (좋다 → jota, 축하 → chuka)
 *   - nasalization   (학년 → hangnyeon, 입니다 → imnida, 종로 → jongno)
 *   - lateralization (신라 → silla, 칼날 → kallal)
 *   - palatalization (같이 → gachi, 굳이 → guji)
 *   - final neutralization to one of [k n t l m p ng] when a coda is blocked
 *
 * Assimilation is applied only *within* a run of adjacent syllables — RR does
 * not carry it across a space, so spacing/punctuation break the chain. Tensing
 * (경음화) is intentionally not reflected: RR spells 국밥 "gukbap", not "gukppap".
 *
 * This covers the vast majority of learner text. A few rare morphophonemic
 * cases (ㄴ-insertion across morpheme boundaries, some double-final clusters in
 * unusual environments) are approximated rather than perfectly resolved.
 */

const S_BASE = 0xac00;
const S_COUNT = 19 * 21 * 28;
const V_COUNT = 21;
const T_COUNT = 28;

/** Choseong (initial) romanization, indexed 0–18. `ㅇ` (11) is a silent onset. */
const CHO = [
  "g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s",
  "ss", "", "j", "jj", "ch", "k", "t", "p", "h",
] as const;

/** Jungseong (vowel) romanization, indexed 0–20. */
const JUNG = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa",
  "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i",
] as const;

/**
 * Jongseong (final) descriptor, indexed 0–27 (0 = no final).
 *   rep      — representative consonant sound when the coda is *blocked* (before
 *              a consonant or at a boundary), already neutralized to k/n/t/l/m/p/ng.
 *   link     — onset consonant it becomes when it *links* onto a following ㅇ.
 *   residual — coda left behind after a cluster links its last consonant.
 *   isH      — final contains ㅎ (drives aspiration / elision).
 */
type Jong = { rep: string; link: string; residual: string; isH: boolean };
const JONG: Jong[] = [
  { rep: "", link: "", residual: "", isH: false }, //  0  (none)
  { rep: "k", link: "g", residual: "", isH: false }, //  1 ㄱ
  { rep: "k", link: "kk", residual: "", isH: false }, //  2 ㄲ
  { rep: "k", link: "s", residual: "k", isH: false }, //  3 ㄳ (ㄱㅅ)
  { rep: "n", link: "n", residual: "", isH: false }, //  4 ㄴ
  { rep: "n", link: "j", residual: "n", isH: false }, //  5 ㄵ (ㄴㅈ)
  { rep: "n", link: "n", residual: "", isH: true }, //  6 ㄶ (ㄴㅎ)
  { rep: "t", link: "d", residual: "", isH: false }, //  7 ㄷ
  { rep: "l", link: "r", residual: "", isH: false }, //  8 ㄹ
  { rep: "k", link: "g", residual: "l", isH: false }, //  9 ㄺ (ㄹㄱ)
  { rep: "m", link: "m", residual: "l", isH: false }, // 10 ㄻ (ㄹㅁ)
  { rep: "l", link: "b", residual: "l", isH: false }, // 11 ㄼ (ㄹㅂ)
  { rep: "l", link: "s", residual: "l", isH: false }, // 12 ㄽ (ㄹㅅ)
  { rep: "l", link: "t", residual: "l", isH: false }, // 13 ㄾ (ㄹㅌ)
  { rep: "p", link: "p", residual: "l", isH: false }, // 14 ㄿ (ㄹㅍ)
  { rep: "l", link: "r", residual: "", isH: true }, // 15 ㅀ (ㄹㅎ)
  { rep: "m", link: "m", residual: "", isH: false }, // 16 ㅁ
  { rep: "p", link: "b", residual: "", isH: false }, // 17 ㅂ
  { rep: "p", link: "s", residual: "p", isH: false }, // 18 ㅄ (ㅂㅅ)
  { rep: "t", link: "s", residual: "", isH: false }, // 19 ㅅ
  { rep: "t", link: "ss", residual: "", isH: false }, // 20 ㅆ
  { rep: "ng", link: "", residual: "", isH: false }, // 21 ㅇ
  { rep: "t", link: "j", residual: "", isH: false }, // 22 ㅈ
  { rep: "t", link: "ch", residual: "", isH: false }, // 23 ㅊ
  { rep: "k", link: "k", residual: "", isH: false }, // 24 ㅋ
  { rep: "t", link: "t", residual: "", isH: false }, // 25 ㅌ
  { rep: "p", link: "p", residual: "", isH: false }, // 26 ㅍ
  { rep: "t", link: "", residual: "", isH: true }, // 27 ㅎ
];

/** Onset index → its aspirated form when preceded by an ㅎ-type final. */
const ASPIRATE: Record<number, string> = { 0: "k", 3: "t", 12: "ch", 7: "p", 9: "ss" };

const CHO_IDX = { N: 2, R: 5, M: 6, SILENT: 11, H: 18 } as const;
const JONG_IDX = { D: 7, T: 25, H: 25 } as const; // ㄷ / ㅌ (palatalization)
const JUNG_I = 20; // ㅣ

type Syllable = { cho: number; jung: number; jong: number };
type Token =
  | { syl: true; s: Syllable; onset: string; vowel: string; coda: string }
  | { syl: false; text: string };

function decompose(code: number): Syllable | null {
  const idx = code - S_BASE;
  if (idx < 0 || idx >= S_COUNT) return null;
  return {
    cho: Math.floor(idx / (V_COUNT * T_COUNT)),
    jung: Math.floor(idx / T_COUNT) % V_COUNT,
    jong: idx % T_COUNT,
  };
}

/**
 * Resolve one syllable boundary: given syllable A (with final) directly
 * followed by syllable B, mutate A's emitted coda and B's emitted onset per the
 * phonological rules. Only called when both sides are Hangul syllables.
 */
function applyBoundary(a: Token & { syl: true }, b: Token & { syl: true }): void {
  const jm = JONG[a.s.jong];
  const oCho = b.s.cho;

  if (a.s.jong === 0) return; // no final — nothing links or assimilates

  // ── Liaison: final slides onto a following silent ㅇ-onset ──────────────
  if (oCho === CHO_IDX.SILENT) {
    if (jm.link === "" && jm.isH) {
      // plain ㅎ before a vowel: ㅎ drops, no consonant to carry (좋아 → joa)
      a.coda = jm.residual;
      b.onset = "";
      return;
    }
    if (jm.link === "") return; // ㅇ / none — no relink (강아지 → gangaji)
    let link = jm.link;
    // Palatalization: ㄷ/ㅌ + 이 → ji / chi (굳이 → guji, 같이 → gachi)
    if (a.s.jong === JONG_IDX.D && b.s.jung === JUNG_I) link = "j";
    if (a.s.jong === JONG_IDX.T && b.s.jung === JUNG_I) link = "ch";
    b.onset = link;
    a.coda = jm.residual;
    return;
  }

  // ── Blocked coda: neutralized rep, then assimilate with the next onset ──
  let coda: string = jm.rep;
  let onset: string = CHO[oCho];

  // ㅎ-final aspirates a following plain obstruent (많고 → manko, 좋다 → jota)
  if (jm.isH && ASPIRATE[oCho] !== undefined) {
    onset = ASPIRATE[oCho];
    coda = a.s.jong === 27 ? "" : jm.rep; // plain ㅎ leaves no coda; clusters keep ㄴ/ㄹ
  }
  // Reverse aspiration: k/t/p coda + ㅎ onset → aspirated onset (축하 → chuka)
  if (oCho === CHO_IDX.H && (coda === "k" || coda === "t" || coda === "p")) {
    onset = coda; // k/t/p — RR writes the plain letter
    coda = "";
  }

  if (oCho === CHO_IDX.R) {
    // ㄹ onset
    if (coda === "n") {
      coda = "l"; // ㄴ+ㄹ → ll (신라 → silla)
      onset = "l";
    } else if (coda === "l") {
      onset = "l"; // ㄹ+ㄹ → ll
    } else if (coda === "") {
      onset = "r";
    } else {
      // obstruent/nasal + ㄹ → ㄹ nasalizes to n (종로 → jongno, 백리 → baengni)
      onset = "n";
      if (coda === "k") coda = "ng";
      else if (coda === "p") coda = "m";
      else if (coda === "t") coda = "n";
    }
  } else if (oCho === CHO_IDX.N) {
    // ㄴ onset
    if (coda === "l") onset = "l"; // ㄹ+ㄴ → ll (칼날 → kallal)
    else if (coda === "k") coda = "ng"; // 국내 → gungnae
    else if (coda === "t") coda = "n"; // 받는 → banneun
    else if (coda === "p") coda = "m"; // 입는 → imneun
  } else if (oCho === CHO_IDX.M) {
    // ㅁ onset — nasalization of a preceding obstruent
    if (coda === "k") coda = "ng"; // 국물 → gungmul
    else if (coda === "t") coda = "n";
    else if (coda === "p") coda = "m"; // 밥맛 → bammat
  }

  a.coda = coda;
  b.onset = onset;
}

/** Tokenize into Hangul syllables (with default emission) and literal runs. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let literal = "";
  const flush = () => {
    if (literal) {
      tokens.push({ syl: false, text: literal });
      literal = "";
    }
  };
  for (const ch of text) {
    const syl = decompose(ch.codePointAt(0) ?? -1);
    if (syl) {
      flush();
      tokens.push({
        syl: true,
        s: syl,
        onset: CHO[syl.cho],
        vowel: JUNG[syl.jung],
        coda: JONG[syl.jong].rep,
      });
    } else {
      literal += ch;
    }
  }
  flush();
  return tokens;
}

function resolve(tokens: Token[]): void {
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (a.syl && b.syl) applyBoundary(a, b);
  }
}

/** Romanize a Korean string to Revised Romanization (pronunciation-based). */
export function romanizeKorean(text: string): string {
  const tokens = tokenize(text);
  resolve(tokens);
  return tokens
    .map((t) => (t.syl ? t.onset + t.vowel + t.coda : t.text))
    .join("");
}

/**
 * Reading-annotation fragments for the shared `AnnotatedText` renderer: each
 * maximal run of Hangul syllables becomes one ruby fragment (word text + its
 * romanization above it); literal runs (spaces, punctuation, Latin) pass
 * through with no reading.
 */
export function annotateKorean(
  text: string,
): { text: string; reading?: string }[] {
  const tokens = tokenize(text);
  resolve(tokens);
  const fragments: { text: string; reading?: string }[] = [];
  let word = "";
  let reading = "";
  const flushWord = () => {
    if (word) {
      fragments.push({ text: word, reading });
      word = "";
      reading = "";
    }
  };
  for (const t of tokens) {
    if (t.syl) {
      word += String.fromCodePoint(
        S_BASE + (t.s.cho * V_COUNT + t.s.jung) * T_COUNT + t.s.jong,
      );
      reading += t.onset + t.vowel + t.coda;
    } else {
      flushWord();
      fragments.push({ text: t.text });
    }
  }
  flushWord();
  return fragments;
}
