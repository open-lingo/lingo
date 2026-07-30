/**
 * Korean sentence templates — the madlibs skeletons for tailored practice.
 *
 * Korean subject/object/topic particles ALTERNATE by whether the noun ends in a
 * consonant (batchim): 이/가, 을/를, 은/는, and the copula 이에요/예요. A pattern
 * like `{subj}이/가 좋아요` isn't a real sentence until the alternation is
 * resolved, so KO templates use a per-language {@link render} hook that computes
 * the correct particle from the filler. All of this per-language grammar lives
 * HERE, in the KO data file — the engine core stays language-agnostic.
 *
 * The filler's chosen `surface` always appears verbatim in the rendered target
 * (the particle attaches after it), so the reading-madlibs blank can still mask
 * the noun and keep the particle.
 */
import type {
  KnownAtom,
  SentenceTemplate,
} from "@/features/practice/engine/types";

/**
 * True if a Hangul word ends in a final consonant (batchim). Complete-syllable
 * blocks live in [0xAC00, 0xD7A3]; jongseong index = (code − 0xAC00) % 28,
 * where 0 means "no final consonant".
 */
function hasBatchim(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** Pick a particle by batchim: `[afterConsonant, afterVowel]`. */
function josa(word: string, afterConsonant: string, afterVowel: string): string {
  return hasBatchim(word) ? afterConsonant : afterVowel;
}

/**
 * Build a KO template whose target is `{noun}<particle> <predicate>`, with the
 * particle chosen by batchim. `readingSuffix` is the romanized predicate
 * (predicate reading, particle reading auto-derived from the same alternation).
 */
function nounParticlePredicate(opts: {
  id: string;
  minModule: number;
  slotPos: KnownAtom["pos"] | KnownAtom["pos"][];
  /** e.g. `["이", "가"]` for subject, `["을", "를"]` for object. */
  particle: [string, string];
  /** romanized particle pair matching `particle`, e.g. `["i", "ga"]`. */
  particleReading: [string, string];
  predicate: string;
  predicateReading: string;
  translationPattern: string;
  patternParticle: string;
}): SentenceTemplate {
  return {
    id: opts.id,
    pattern: `{x}${opts.patternParticle} ${opts.predicate}`,
    translationPattern: opts.translationPattern,
    slots: [{ key: "x", pos: opts.slotPos }],
    grammarGate: { minModule: opts.minModule },
    render: (filled) => {
      const a = filled.x;
      const part = josa(a.surface, opts.particle[0], opts.particle[1]);
      const partR = josa(a.surface, opts.particleReading[0], opts.particleReading[1]);
      return {
        target: `${a.surface}${part} ${opts.predicate}`,
        reading: `${a.reading}${partR} ${opts.predicateReading}`,
        translation: opts.translationPattern.replace("{x}", a.meaningEn),
      };
    },
  };
}

export const KO_TEMPLATES: SentenceTemplate[] = [
  // ── Copula (m4) ───────────────────────────────────────────────────────────
  {
    id: "ko-igeon-x-ieyo",
    pattern: "이건 {x}예요",
    translationPattern: "This is {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 4 },
    render: (filled) => {
      const a = filled.x;
      const cop = josa(a.surface, "이에요", "예요");
      const copR = josa(a.surface, "ieyo", "yeyo");
      return {
        target: `이건 ${a.surface}${cop}`,
        reading: `igeon ${a.reading}${copR}`,
        translation: `This is ${a.meaningEn}.`,
      };
    },
  },
  // ── Existence / location (m6) ─────────────────────────────────────────────
  nounParticlePredicate({
    id: "ko-x-i-ga-isseoyo",
    minModule: 6,
    slotPos: "noun",
    particle: ["이", "가"],
    particleReading: ["i", "ga"],
    patternParticle: "이/가",
    predicate: "있어요",
    predicateReading: "isseoyo",
    translationPattern: "There is {x}.",
  }),
  nounParticlePredicate({
    id: "ko-x-i-ga-eopseoyo",
    minModule: 6,
    slotPos: "noun",
    particle: ["이", "가"],
    particleReading: ["i", "ga"],
    patternParticle: "이/가",
    predicate: "없어요",
    predicateReading: "eopseoyo",
    translationPattern: "There is no {x}.",
  }),
  nounParticlePredicate({
    id: "ko-x-i-ga-eodiyeyo",
    minModule: 6,
    slotPos: "noun",
    particle: ["이", "가"],
    particleReading: ["i", "ga"],
    patternParticle: "이/가",
    predicate: "어디예요?",
    predicateReading: "eodiyeyo?",
    translationPattern: "Where is {x}?",
  }),
  // ── Verbs + object/goal (m7) ──────────────────────────────────────────────
  nounParticlePredicate({
    id: "ko-x-eul-reul-meogeoyo",
    minModule: 7,
    slotPos: "noun",
    particle: ["을", "를"],
    particleReading: ["eul", "reul"],
    patternParticle: "을/를",
    predicate: "먹어요",
    predicateReading: "meogeoyo",
    translationPattern: "I eat {x}.",
  }),
  nounParticlePredicate({
    id: "ko-x-eul-reul-masyeoyo",
    minModule: 7,
    slotPos: "noun",
    particle: ["을", "를"],
    particleReading: ["eul", "reul"],
    patternParticle: "을/를",
    predicate: "마셔요",
    predicateReading: "masyeoyo",
    translationPattern: "I drink {x}.",
  }),
  nounParticlePredicate({
    id: "ko-x-eul-reul-bwayo",
    minModule: 7,
    slotPos: "noun",
    particle: ["을", "를"],
    particleReading: ["eul", "reul"],
    patternParticle: "을/를",
    predicate: "봐요",
    predicateReading: "bwayo",
    translationPattern: "I watch {x}.",
  }),
  {
    id: "ko-x-e-gayo",
    pattern: "{x}에 가요",
    readingPattern: "{x}e gayo",
    translationPattern: "I go to {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 7 },
  },
  {
    id: "ko-x-e-wayo",
    pattern: "{x}에 와요",
    readingPattern: "{x}e wayo",
    translationPattern: "I come to {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 7 },
  },
  // ── Adjectives (m8) ───────────────────────────────────────────────────────
  nounParticlePredicate({
    id: "ko-x-i-ga-joayo",
    minModule: 8,
    slotPos: "noun",
    particle: ["이", "가"],
    particleReading: ["i", "ga"],
    patternParticle: "이/가",
    predicate: "좋아요",
    predicateReading: "joayo",
    translationPattern: "I like {x}.",
  }),
  nounParticlePredicate({
    id: "ko-x-i-ga-yeppeoyo",
    minModule: 8,
    slotPos: "noun",
    particle: ["이", "가"],
    particleReading: ["i", "ga"],
    patternParticle: "이/가",
    predicate: "예뻐요",
    predicateReading: "yeppeoyo",
    translationPattern: "{x} is pretty.",
  }),
  nounParticlePredicate({
    id: "ko-x-i-ga-keoyo",
    minModule: 8,
    slotPos: "noun",
    particle: ["이", "가"],
    particleReading: ["i", "ga"],
    patternParticle: "이/가",
    predicate: "커요",
    predicateReading: "keoyo",
    translationPattern: "{x} is big.",
  }),
  nounParticlePredicate({
    id: "ko-x-i-ga-jagayo",
    minModule: 8,
    slotPos: "noun",
    particle: ["이", "가"],
    particleReading: ["i", "ga"],
    patternParticle: "이/가",
    predicate: "작아요",
    predicateReading: "jagayo",
    translationPattern: "{x} is small.",
  }),
  // ── like (verb form, m16) ─────────────────────────────────────────────────
  nounParticlePredicate({
    id: "ko-x-eul-reul-joahaeyo",
    minModule: 16,
    slotPos: "noun",
    particle: ["을", "를"],
    particleReading: ["eul", "reul"],
    patternParticle: "을/를",
    predicate: "좋아해요",
    predicateReading: "joahaeyo",
    translationPattern: "I like {x}.",
  }),
];
