/**
 * Particle-PAIR sentence miner (TestFlight #44, docs/practice-particle-training-scope.md).
 *
 * Walks the taught JA corpus up to the learner's module and returns every
 * authored sentence that carries BOTH particles of a pair as free-standing
 * tokens, with the two particle positions located in the authored text so the
 * drill can blank them. No new authoring: every sentence here was already
 * built, spoken or heard in a lesson the learner has reached.
 *
 * Tokenization is the same longest-match global tokenizer the SRS review miner
 * uses (`makeGlobalTokenizer` over every taught kana), so a particle that is
 * PART of a taught atom — これから, どこに (if registered), 〜までに… — surfaces
 * inside that atom's token and is never a candidate blank. That is the
 * "never blank an atom-internal particle" rule, and it falls out of the
 * tokenizer rather than a hand list.
 */
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { makeGlobalTokenizer } from "@/features/lesson/data/moduleCompiler";
import { getAllJaTaughtKana } from "@/features/languages/ja/curriculum/taughtVocab";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";

/** One sentence from the taught corpus, with its English line. */
export type CorpusSentence = {
  /** Stable id — `<lessonId>:<stepId>`. */
  id: string;
  text: string;
  translation: string;
  /** 1-indexed module the sentence was taught in. */
  module: number;
};

/** A blank the drill will cut out of `text`. */
export type ParticleBlank = {
  particle: string;
  /** Character offset of the particle in `text` (start, end-exclusive). */
  start: number;
  end: number;
};

/** A corpus sentence containing both particles of a pair, blanks located. */
export type PairSentence = CorpusSentence & {
  blanks: [ParticleBlank, ParticleBlank];
};

/** Strip the build/speaking prompt framing so the English reads as a translation. */
function cleanPrompt(prompt: string): string | null {
  const s = prompt.trim();
  if (!s) return null;
  // "Build: I go to school" → "I go to school"; "Say to a friend: Yeah" → "Yeah".
  const m = /^(?:Build|Say|Ask|Answer|Reply|Tell)\b[^:]*:\s*(.+)$/s.exec(s);
  const out = (m ? m[1] : s).trim();
  // A prompt that is a question ABOUT the sentence, not its meaning.
  if (/\?$/.test(out) && /\b(what|which|how|who)\b/i.test(out) && !/\byou\b/i.test(out)) return null;
  return out || null;
}

/** Pull (text, translation) pairs out of one lesson step. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sentencesFromStep(s: any): { text: string; translation: string }[] {
  const out: { text: string; translation: string }[] = [];
  if (s.type === "speaking" && typeof s.targetPhrase === "string" && typeof s.translation === "string") {
    out.push({ text: s.targetPhrase, translation: s.translation });
  }
  // `listening_build` is NOT a source: its prompt is "Build what you hear.",
  // never a meaning — the drill would show that as the translation.
  if (s.type === "build_sentence" && typeof s.targetSentence === "string" && typeof s.prompt === "string") {
    const tr = cleanPrompt(s.prompt);
    if (tr) out.push({ text: s.targetSentence, translation: tr });
  }
  if (
    s.type === "listening_comprehension" &&
    typeof s.transcript === "string" &&
    typeof s.question === "string" &&
    /sentence mean/i.test(s.question) &&
    Array.isArray(s.options)
  ) {
    const correct = s.options.find((o: { id: string; text?: string }) => o.id === s.correctOptionId);
    if (correct && typeof correct.text === "string") out.push({ text: s.transcript, translation: correct.text });
  }
  return out;
}

let corpusCache: CorpusSentence[] | null = null;

/**
 * Every translated sentence in the JA course, in course order, deduped by
 * text. Memoized — the walk materializes every lesson once.
 */
export function getJaTaughtCorpus(): CorpusSentence[] {
  if (corpusCache) return corpusCache;
  const course = getMockCourse("ja");
  const seen = new Set<string>();
  const out: CorpusSentence[] = [];
  type LessonRef = { id: string };
  type ModuleShape = { id: string; lessons?: LessonRef[]; lessonGroups?: { lessons?: LessonRef[] }[] };
  for (const mod of course.modules as unknown as ModuleShape[]) {
    const moduleNo = parseModuleIndex(mod.id);
    if (moduleNo == null) continue;
    const lessonIds = [
      ...(mod.lessons ?? []).map((l) => l.id),
      ...(mod.lessonGroups ?? []).flatMap((g) => (g.lessons ?? []).map((l) => l.id)),
    ];
    for (const lessonId of lessonIds) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        for (const sent of sentencesFromStep(step)) {
          const text = sent.text.trim();
          // Multi-word only: a bare word has no particle to blank, and a
          // one-clause sentence is the unit the drill wants.
          if (!text.includes(" ") || seen.has(text)) continue;
          seen.add(text);
          out.push({ id: `${lessonId}:${step.id}`, text, translation: sent.translation.trim(), module: moduleNo });
        }
      }
    }
  }
  corpusCache = out;
  return out;
}

let tokenizeCache: ((ja: string) => string[]) | null = null;
function tokenize(ja: string): string[] {
  tokenizeCache ??= makeGlobalTokenizer([...getAllJaTaughtKana()].map((kana) => ({ kana })));
  return tokenizeCache(ja);
}

const SENTENCE_MARK = /[。？！]$/;

/** The tokenizer's own particle inventory (moduleCompiler PARTICLES). */
const PARTICLE_TOKENS = new Set(["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か"]);

/**
 * Sentences longer than this don't fit a phone card at the drill's type size
 * with two blanks; the corpus has plenty of short ones.
 */
export const MAX_SENTENCE_CHARS = 26;

/**
 * Structural guard for a located particle token: true when the token is a
 * free particle the learner can reason about, false when it is really a
 * piece of grammar the tokenizer happened to split off.
 *  - で right after a 〜ない form is the て-negative (いかないで), not the
 *    location/means particle.
 *  - A particle stacked on another particle (には, では, までに, とは) is a
 *    compound; blanking half of it asks for a form the pair card never taught.
 */
function isFreeParticle(prev: string | undefined, tok: string, next: string | undefined): boolean {
  if (prev && PARTICLE_TOKENS.has(prev)) return false;
  if (next && PARTICLE_TOKENS.has(next)) return false;
  if (tok === "で" && prev && prev.endsWith("ない")) return false;
  return true;
}

/**
 * Locate every free-standing occurrence of `particle` in `text` as character
 * spans, by walking the tokenizer's output back over the authored string.
 * Tokens are in-order substrings of the text (minus spaces and punctuation),
 * so a cursor scan recovers each token's offset without re-tokenizing.
 * `blankable` is false when any occurrence fails the structural guard.
 */
export function locateParticle(
  text: string,
  particle: string,
): { spans: ParticleBlank[]; blankable: boolean } {
  const spans: ParticleBlank[] = [];
  let blankable = true;
  let cursor = 0;
  const tokens = tokenize(text)
    .map((raw) => raw.replace(SENTENCE_MARK, ""))
    .filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const at = text.indexOf(tok, cursor);
    if (at === -1) return { spans: [], blankable: false }; // tokenizer and text disagree
    if (tok === particle) {
      spans.push({ particle, start: at, end: at + tok.length });
      if (!isFreeParticle(tokens[i - 1], tok, tokens[i + 1])) blankable = false;
    }
    cursor = at + tok.length;
  }
  return { spans, blankable };
}

/**
 * Sentences taught up to `reachedModule` (inclusive) that contain BOTH
 * particles of the pair exactly once each as free-standing tokens. Exactly
 * once, so the two blanks are the only places those particles could go and
 * grading is never ambiguous. Corpus order is preserved (earliest module
 * first); the drill shuffles.
 */
export function minePairSentences(
  pair: readonly [string, string],
  reachedModule: number,
  corpus: readonly CorpusSentence[] = getJaTaughtCorpus(),
): PairSentence[] {
  const [a, b] = pair;
  const out: PairSentence[] = [];
  for (const s of corpus) {
    if (s.module > reachedModule) continue;
    if (s.text.length > MAX_SENTENCE_CHARS) continue;
    if (!s.text.includes(a) || !s.text.includes(b)) continue;
    const la = locateParticle(s.text, a);
    if (la.spans.length !== 1 || !la.blankable) continue;
    const lb = locateParticle(s.text, b);
    if (lb.spans.length !== 1 || !lb.blankable) continue;
    const blanks: [ParticleBlank, ParticleBlank] =
      la.spans[0].start < lb.spans[0].start ? [la.spans[0], lb.spans[0]] : [lb.spans[0], la.spans[0]];
    out.push({ ...s, blanks });
  }
  return out;
}

/** Test hook. */
export function __resetParticleCorpus(): void {
  corpusCache = null;
  tokenizeCache = null;
}
