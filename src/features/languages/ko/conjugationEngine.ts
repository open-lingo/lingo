/**
 * Rule-based Korean conjugation engine. Pure functions, no React.
 *
 * Korean conjugation is jamo-level: to build a form the engine decomposes the
 * stem's final syllable (initial / medial / final — cho / jung / jong),
 * applies the class + vowel-harmony rule, and recomposes. This is the KO
 * analogue of the JA engine's kana-row shifts, and it is what lets a compact
 * lemma table (lemma + class) generate every drilled cell + rule-misapplication
 * distractors instead of hand-authoring ~20 forms per verb.
 *
 * Ground-truthed by `conjugationEngine.test.ts`, which pins every irregular
 * class against textbook-correct forms. Coverage:
 *   - vowel harmony (ㅏ/ㅗ → -아, else -어; 하 → 해)
 *   - regular consonant- and vowel-stems (incl. 오→와, 주→줘, 시→셔 contraction)
 *   - irregulars: ㅂ, ㄷ, ㅅ, 르, ㅎ, ㄹ, 으(ㅡ-deletion), 하다
 *   - politeness: 해요체 (polite), 반말 (casual), 합쇼체 (formal -습니다/-ㅂ니다)
 *   - tense/aspect: present, past (-았/었어요), future (-(으)ㄹ 거예요),
 *     progressive (-고 있어요)
 *   - negation: short (안 …) and long (-지 않다)
 */

export type KoStemClass =
  | "regular" // regular consonant- or vowel-stem (harmony decides -아/어)
  | "hada" // …하다 (하 → 해)
  | "p_irr" // ㅂ irregular (돕다 → 도와요, 춥다 → 추워요)
  | "t_irr" // ㄷ irregular (듣다 → 들어요)
  | "s_irr" // ㅅ irregular (짓다 → 지어요)
  | "reu_irr" // 르 irregular (모르다 → 몰라요)
  | "h_irr" // ㅎ irregular (그렇다 → 그래요)
  | "l_stem" // ㄹ-stem (살다 → 삽니다 / 살아요)
  | "eu_irr"; // 으 / ㅡ-deletion (쓰다 → 써요)

export type KoPos = "verb" | "adjective";

export type KoFormKey =
  | "dictionary"
  | "present.polite"
  | "present.casual"
  | "present.formal"
  | "past.polite"
  | "past.casual"
  | "past.formal"
  | "future.polite"
  | "future.casual"
  | "future.formal"
  | "progressive.polite"
  | "progressive.casual"
  | "progressive.formal"
  | "neg.short.present.polite"
  | "neg.short.present.casual"
  | "neg.short.past.polite"
  | "neg.long.present.polite"
  | "neg.long.present.formal"
  | "neg.long.past.polite"
  // ── Endings & connectives (the "little words" that trip learners up) ──
  | "present.plain" // 는다/ㄴ다 — plain declarative "eats / is eating" (verbs)
  | "adverbial" // -게 — adjective → adverb (예쁘게), also verbs ("so as to")
  | "prohibition" // -지 마세요 — "don't …" (verbs)
  | "honorific.command" // -(으)세요 — polite command / honorific (verbs)
  | "desiderative" // -고 싶어요 — "want to …" (verbs)
  | "connective.and" // -고 — "and / and then"
  | "connective.but" // -지만 — "but / although"
  | "connective.so" // -아서/어서 — "so / and then / because"
  | "conditional"; // -(으)면 — "if / when"

// ─── Jamo tables ─────────────────────────────────────────────────────────

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;


// Medial (jung) indices used by the rules.
const J = {
  A: 0, // ㅏ
  AE: 1, // ㅐ
  YA: 2, // ㅑ
  YAE: 3, // ㅒ
  EO: 4, // ㅓ
  E: 5, // ㅔ
  YEO: 6, // ㅕ
  O: 8, // ㅗ
  WA: 9, // ㅘ
  WAE: 10, // ㅙ
  OE: 11, // ㅚ
  U: 13, // ㅜ
  WO: 14, // ㅝ
  EU: 18, // ㅡ
  I: 20, // ㅣ
} as const;

// Final (jong) indices used by the rules.
const T = {
  NONE: 0,
  N: 4, // ㄴ
  L: 8, // ㄹ
  M: 16, // ㅁ
  P: 17, // ㅂ
  SS: 20, // ㅆ
} as const;

interface Syl {
  cho: number;
  jung: number;
  jong: number;
}

function isHangul(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return c >= HANGUL_BASE && c <= HANGUL_LAST;
}

function decompose(ch: string): Syl {
  const code = (ch.codePointAt(0) ?? 0) - HANGUL_BASE;
  return {
    cho: Math.floor(code / (21 * 28)),
    jung: Math.floor(code / 28) % 21,
    jong: code % 28,
  };
}

function compose(cho: number, jung: number, jong: number): string {
  return String.fromCodePoint(HANGUL_BASE + (cho * 21 + jung) * 28 + jong);
}

/** Replace the last character of `s`. */
function repl(s: string, ch: string): string {
  return s.slice(0, -1) + ch;
}

/** ㅏ/ㅗ vowels drive -아 harmony; everything else -어. */
function isBright(jung: number): boolean {
  return jung === J.A || jung === J.O;
}

// ─── Infinitive (the -아/어 connective stem) ──────────────────────────────
//
// This drives present-polite (+요), casual (bare) and past (+ㅆ). It is the
// single hardest computation; every other ending is a straightforward suffix.

/** Regular contraction of a vowel-final stem + -아/어 (오→와, 주→줘, 시→셔…). */
const CONTRACT: Record<number, number> = {
  [J.A]: J.A, // 가 + 아 → 가
  [J.EO]: J.EO, // 서 + 어 → 서
  [J.O]: J.WA, // 오 + 아 → 와
  [J.U]: J.WO, // 주 + 어 → 줘
  [J.I]: J.YEO, // 시 + 어 → 셔
  [J.AE]: J.AE, // 내 + 어 → 내
  [J.E]: J.E, // 세 + 어 → 세
  [J.OE]: J.WAE, // 되 + 어 → 돼
};

function regularInfinitive(stem: string): string {
  const last = decompose(stem[stem.length - 1]);
  const bright = isBright(last.jung);
  if (last.jong !== T.NONE) {
    // consonant-final: append 아/어 as a new syllable.
    return stem + (bright ? "아" : "어");
  }
  // vowel-final: contract when the pair has a canonical single-syllable form.
  const merged = CONTRACT[last.jung];
  if (merged !== undefined) {
    return repl(stem, compose(last.cho, merged, T.NONE));
  }
  return stem + (bright ? "아" : "어");
}

function infinitive(stem: string, cls: KoStemClass): string {
  const last = decompose(stem[stem.length - 1]);
  switch (cls) {
    case "hada":
      return stem.slice(0, -1) + "해";
    case "p_irr": {
      const base = repl(stem, compose(last.cho, last.jung, T.NONE)); // drop ㅂ
      // 돕/곱 take -와; all other ㅂ-irregulars take -워.
      const tail = stem[stem.length - 1] === "돕" || stem[stem.length - 1] === "곱" ? "와" : "워";
      return base + tail;
    }
    case "t_irr": {
      // ㄷ → ㄹ, then append 아/어.
      const shifted = repl(stem, compose(last.cho, last.jung, T.L));
      return shifted + (isBright(last.jung) ? "아" : "어");
    }
    case "s_irr": {
      // ㅅ drops (no contraction); append 아/어.
      const base = repl(stem, compose(last.cho, last.jung, T.NONE));
      return base + (isBright(last.jung) ? "아" : "어");
    }
    case "reu_irr": {
      // 르 → prev syllable gains ㄹ batchim + 라/러 (harmony from prev vowel).
      const prev = decompose(stem[stem.length - 2]);
      const newPrev = compose(prev.cho, prev.jung, T.L);
      return stem.slice(0, -2) + newPrev + (isBright(prev.jung) ? "라" : "러");
    }
    case "h_irr": {
      // ㅎ drops, vowel raises to ㅐ (or ㅒ after ㅑ); the ending is absorbed.
      const newJung = last.jung === J.YA ? J.YAE : J.AE;
      return repl(stem, compose(last.cho, newJung, T.NONE));
    }
    case "eu_irr": {
      // ㅡ deletes; harmony from the PREVIOUS syllable (monosyllables → 어).
      const prev = stem.length >= 2 ? decompose(stem[stem.length - 2]) : null;
      const bright = prev ? isBright(prev.jung) : false;
      return repl(stem, compose(last.cho, bright ? J.A : J.EO, T.NONE));
    }
    case "l_stem":
    case "regular":
    default:
      return regularInfinitive(stem);
  }
}

/** Past stem = infinitive with ㅆ pushed onto its final (always-open) syllable. */
function pastStem(stem: string, cls: KoStemClass): string {
  const inf = infinitive(stem, cls);
  const last = decompose(inf[inf.length - 1]);
  return repl(inf, compose(last.cho, last.jung, T.SS));
}

/** Formal -습니다 / -ㅂ니다 (built off the raw stem, not the infinitive). */
function formalStem(stem: string, cls: KoStemClass): string {
  const last = decompose(stem[stem.length - 1]);
  if (cls === "l_stem") {
    // ㄹ drops before -ㅂ니다: 살 → 삽니다.
    return repl(stem, compose(last.cho, last.jung, T.P)) + "니다";
  }
  if (last.jong === T.NONE) {
    // vowel-final (incl. 하다, 르, 으): add ㅂ → -ㅂ니다.
    return repl(stem, compose(last.cho, last.jung, T.P)) + "니다";
  }
  // consonant-final (incl. ㅂ/ㄷ/ㅅ/ㅎ irregulars — batchim kept before 습니다).
  return stem + "습니다";
}

/** Adnominal future stem (the part before " 거예요"). */
function futureStem(stem: string, cls: KoStemClass): string {
  const last = decompose(stem[stem.length - 1]);
  switch (cls) {
    case "hada":
      return stem.slice(0, -1) + "할";
    case "p_irr":
      // ㅂ → 우, then + ㄹ: 춥 → 추울, 돕 → 도울.
      return repl(stem, compose(last.cho, last.jung, T.NONE)) + "울";
    case "t_irr":
      // ㄷ → ㄹ, consonant-final → +을: 듣 → 들을.
      return repl(stem, compose(last.cho, last.jung, T.L)) + "을";
    case "s_irr":
      // ㅅ drops, still consonant-semantics → +을: 짓 → 지을.
      return repl(stem, compose(last.cho, last.jung, T.NONE)) + "을";
    case "h_irr":
      // ㅎ drops, vowel-final → +ㄹ: 그렇 → 그럴.
      return repl(stem, compose(last.cho, last.jung, T.L));
    case "reu_irr":
    case "eu_irr":
      // vowel-final stems → +ㄹ: 모르 → 모를, 쓰 → 쓸.
      return repl(stem, compose(last.cho, last.jung, T.L));
    case "l_stem":
      // already ends in ㄹ: 살 → 살.
      return stem;
    case "regular":
    default:
      return last.jong === T.NONE
        ? repl(stem, compose(last.cho, last.jung, T.L)) // 가 → 갈
        : stem + "을"; // 먹 → 먹을
  }
}

/** Drop a trailing ㄹ batchim from the last syllable (leaves other codas). */
function stripFinalL(s: string): string {
  const last = decompose(s[s.length - 1]);
  return last.jong === T.L ? repl(s, compose(last.cho, last.jung, T.NONE)) : s;
}

/**
 * Euphonic "으" stem shared by -(으)세요 / -(으)러 etc.: the future adnominal
 * stem with its ㄹ stripped. This is exactly the -(으) base — consonant stems
 * keep their 으 (먹으-), vowel stems are bare (가-), every irregular is already
 * resolved by `futureStem`, and ㄹ-stems correctly LOSE their ㄹ (살 → 사, for
 * 사세요). Endings where ㄹ-stems KEEP their ㄹ (e.g. -면: 살면) special-case
 * `l_stem` at the call site instead of using this.
 */
function euStem(stem: string, cls: KoStemClass): string {
  return stripFinalL(futureStem(stem, cls));
}

/** Plain declarative present (한다체): verbs take 는다/ㄴ다; ㄹ-stems drop ㄹ
 *  before ㄴ (살다 → 산다). Adjectives use the dictionary form and never reach
 *  here (the tile is verbs-only). */
function plainPresent(stem: string, cls: KoStemClass): string {
  const last = decompose(stem[stem.length - 1]);
  if (cls === "l_stem") {
    return repl(stem, compose(last.cho, last.jung, T.N)) + "다"; // 살 → 산다
  }
  if (last.jong === T.NONE) {
    return repl(stem, compose(last.cho, last.jung, T.N)) + "다"; // 가 → 간다, 하 → 한다
  }
  return stem + "는다"; // 먹 → 먹는다, 듣 → 듣는다
}

// ─── Public conjugator ────────────────────────────────────────────────────

function present(stem: string, cls: KoStemClass, level: "polite" | "casual"): string {
  const inf = infinitive(stem, cls);
  return level === "polite" ? inf + "요" : inf;
}

/** Short negation: 안 + verb (하다 compounds split: 공부 안 해요). */
function shortNeg(stem: string, cls: KoStemClass, form: string): string {
  if (cls === "hada") {
    const noun = stem.slice(0, -1); // drop 하
    const haPart = form.slice(noun.length); // 해요 / 했어요
    return (noun ? noun + " " : "") + "안 " + haPart;
  }
  return "안 " + form;
}

export function conjugateKo(lemma: string, cls: KoStemClass, form: KoFormKey): string {
  if (form === "dictionary") return lemma;
  if (!lemma.endsWith("다") || !isHangul(lemma[lemma.length - 2] ?? "")) {
    return lemma; // defensive: not a well-formed hangul lemma
  }
  const stem = lemma.slice(0, -1); // drop 다

  switch (form) {
    case "present.polite":
      return present(stem, cls, "polite");
    case "present.casual":
      return present(stem, cls, "casual");
    case "present.formal":
      return formalStem(stem, cls);

    case "past.polite":
      return pastStem(stem, cls) + "어요";
    case "past.casual":
      return pastStem(stem, cls) + "어";
    case "past.formal":
      return pastStem(stem, cls) + "습니다";

    case "future.polite":
      return futureStem(stem, cls) + " 거예요";
    case "future.casual":
      return futureStem(stem, cls) + " 거야";
    case "future.formal":
      return futureStem(stem, cls) + " 겁니다";

    case "progressive.polite":
      return stem + "고 있어요";
    case "progressive.casual":
      return stem + "고 있어";
    case "progressive.formal":
      return stem + "고 있습니다";

    case "neg.short.present.polite":
      return shortNeg(stem, cls, present(stem, cls, "polite"));
    case "neg.short.present.casual":
      return shortNeg(stem, cls, present(stem, cls, "casual"));
    case "neg.short.past.polite":
      return shortNeg(stem, cls, pastStem(stem, cls) + "어요");

    case "neg.long.present.polite":
      return stem + "지 않아요";
    case "neg.long.present.formal":
      return stem + "지 않습니다";
    case "neg.long.past.polite":
      return stem + "지 않았어요";

    // ── Endings & connectives ──
    case "present.plain":
      return plainPresent(stem, cls);
    case "adverbial":
      return stem + "게"; // attaches to the raw stem — no irregular change
    case "prohibition":
      return stem + "지 마세요";
    case "honorific.command":
      return euStem(stem, cls) + "세요";
    case "desiderative":
      return stem + "고 싶어요";
    case "connective.and":
      return stem + "고";
    case "connective.but":
      return stem + "지만";
    case "connective.so":
      return infinitive(stem, cls) + "서";
    case "conditional":
      // -(으)면; ㄹ-stems KEEP their ㄹ (살면), unlike -(으)세요.
      return (cls === "l_stem" ? stem : euStem(stem, cls)) + "면";
  }
}

// ─── Distractor generation (rule-misapplication, anti-elimination) ────────

/**
 * Plausible wrong conjugations for `(lemma, form)` — the same anti-elimination
 * design as the JA trainer. Every distractor is a rule the learner might
 * genuinely misapply, not a random other word:
 *   1. treat an irregular stem as REGULAR (듣어요 for 들어요) — the #1 error;
 *   2. wrong vowel harmony (먹아요 for 먹어요);
 *   3. a real sibling form of the SAME lemma (먹었어요 / 먹습니다 for 먹어요).
 * Returns up to 3 distinct strings, none equal to `correct`.
 */
export function generateKoDistractors(
  lemma: string,
  cls: KoStemClass,
  form: KoFormKey,
  correct: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  const push = (s: string | undefined) => {
    if (s && s !== correct && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  // (1) force-regular: same form conjugated as if the lemma were regular.
  if (cls !== "regular") push(conjugateKo(lemma, "regular", form));
  if (cls === "hada") push(conjugateKo(lemma, "regular", form));

  // (2) wrong harmony: flip the -아/어 (and -았/었) vowel in the surface.
  push(flipHarmony(correct));

  // (3) sibling forms of the same lemma (real, but wrong tense/politeness).
  const siblings: KoFormKey[] = SIBLINGS_FOR(form);
  for (const sib of siblings) push(conjugateKo(lemma, cls, sib));

  // Fallback: force-regular siblings, for stems where the above ran short.
  if (out.length < 3 && cls !== "regular") {
    for (const sib of siblings) push(conjugateKo(lemma, "regular", sib));
  }

  return out.slice(0, 3);
}

/** Naively swap 아↔어 / 았↔었 in the LAST vowel of the surface — a real error. */
function flipHarmony(surface: string): string | undefined {
  const flip: Record<string, string> = {
    아: "어",
    어: "아",
    았: "었",
    었: "았",
    와: "워",
    워: "와",
  };
  // find the rightmost flippable jamo cluster we can toggle
  for (let i = surface.length - 1; i >= 0; i--) {
    const ch = surface[i];
    if (flip[ch]) return surface.slice(0, i) + flip[ch] + surface.slice(i + 1);
    // decompose a syllable and flip its medial when it's ㅏ/ㅓ (open syllable)
    if (isHangul(ch)) {
      const s = decompose(ch);
      if (s.jong === T.NONE && (s.jung === J.A || s.jung === J.EO)) {
        const flipped = compose(s.cho, s.jung === J.A ? J.EO : J.A, T.NONE);
        return surface.slice(0, i) + flipped + surface.slice(i + 1);
      }
      if (s.jong === T.SS && (s.jung === J.A || s.jung === J.EO)) {
        const flipped = compose(s.cho, s.jung === J.A ? J.EO : J.A, T.SS);
        return surface.slice(0, i) + flipped + surface.slice(i + 1);
      }
    }
  }
  return undefined;
}

function SIBLINGS_FOR(form: KoFormKey): KoFormKey[] {
  // Real neighbours in the same paradigm — wrong tense/politeness are fair
  // distractors (they test that the learner picked the RIGHT cell).
  const groups: KoFormKey[][] = [
    ["present.polite", "past.polite", "present.formal", "future.polite", "present.plain"],
    ["present.casual", "past.casual"],
    ["progressive.polite", "progressive.casual", "progressive.formal", "desiderative"],
    [
      "neg.short.present.polite",
      "neg.short.past.polite",
      "neg.long.present.polite",
      "neg.short.present.casual",
    ],
    // Connectives are mutually confusable — a great distractor set for each
    // other ("먹어서" vs "먹으면" vs "먹고" vs "먹지만").
    ["connective.and", "connective.but", "connective.so", "conditional"],
    // Commands: prohibition vs honorific, plus the bare adverbial.
    ["honorific.command", "prohibition", "adverbial"],
  ];
  const group = groups.find((g) => g.includes(form)) ?? [];
  return group.filter((f) => f !== form);
}
