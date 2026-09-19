/**
 * lib/stepsExtra.mjs — round-2 (lane PTTOOL2) candidate builders: the
 * mid-lesson `speak` role, `contrast` minimal pairs, `pattern` structured
 * input, `conjugation` cloze series, and the auto-synthesized `phrase`
 * debut `lib/schedule.mjs`'s debut-guarantee pass reaches for (finding 1b:
 * a contraction-forced cloze must never BE an atom's debut). Split from
 * `lib/stepsCore.mjs`/`lib/stepsClose.mjs` to keep every file under this
 * lane's 150-line budget.
 */
import { bare } from "../../../draft/pt-ir/assemble.mjs";
import { mapPartOfSpeech, PT_ALLOW_WORDS } from "./rules.mjs";
import { normalizeSentence, literalToken, dedupeOptionsCaseInsensitive } from "./normalizeText.mjs";

let seq = 0;
export const resetIds = () => { seq = 0; };
const nextId = (prefix) => `${prefix}-${(seq += 1)}`;

/** `speak` role — a mid-lesson `speakLit` on any tagged sentence (round-1
 *  gap: only the closing win sentence ever got one). Retention-rhythm law
 *  3 (docs/pt-course-design-2026-09-18.md, pack "known gaps"): a new form's
 *  first VOICING should print before it becomes a cloze answer — tag the
 *  sentence that introduces a form `speak` before any `cloze:<that form>`. */
export function buildSpeaks(spec) {
  return spec.sentences
    .map((s, si) => ({ s, si }))
    .filter(({ s }) => s.roles.includes("speak"))
    .map(({ s, si }) => ({ id: nextId("spk"), kind: "speakLit", _ord: si, pt: s.pt, en: s.en, atoms: s.uses }));
}

/** `contrast: [{a, b, note}]` — a minimal-pair `textMcq` per §2 row b's
 *  ladder (avó/avô, é/está).
 *
 *  ITEM 5 (lane PTTOOL5): the PROMPT is never `note` (PTGRADE found a
 *  40-45-word grammar paragraph doing double duty as the question stem —
 *  the answer, stated in the rule, made the step unfailable). The real
 *  prompt is a spec sentence that `uses` the target, with the target
 *  blanked to "___"; when no such sentence exists, a generic fallback
 *  ("Which form goes with «eu»?") — never the rule text. OPTIONS are the
 *  contrast pair itself plus AT MOST ONE same-part-of-speech padding word
 *  (never invented, never "olá"/"eu"/"sim" — a closed-set function word or
 *  a different part of speech is not a plausible foil for a verb-form
 *  contrast). */
export function buildContrastSteps(spec, priorVocab) {
  const pad = priorVocab ? [...priorVocab.values()] : [];
  return spec.contrast.map((c, i) => {
    const targetWord = spec.wordByPt.get(c.a);
    const targetPos = targetWord ? mapPartOfSpeech(targetWord.pos) : undefined;
    const samePos = pad.filter(
      (a) => a.partOfSpeech === targetPos && a.surface !== c.a && a.surface !== c.b && !PT_ALLOW_WORDS.has(a.surface.toLowerCase()),
    );
    // Runtime `vocabTextMcq` needs >= 3 distractors distinct from the target
    // (found wiring m2–m4: the generator's con step had shipped only 2 —
    // m1's IR was hand-written, so this never ran). Same-POS prior vocab
    // first, then any prior/lesson word that is not a function word.
    const chosen = new Set([c.a.toLowerCase(), c.b.toLowerCase()]);
    const distractors = [c.b];
    const CONTENT_POS = new Set(["verb", "noun", "adjective", "adverb", "determiner", "article", "verb-form"]);
    const take = (list) => { for (const x of list) { const sf = x.surface ?? x.pt; const pos = x.partOfSpeech ?? x.pos; if (distractors.length >= 3) break; if (!sf || chosen.has(sf.toLowerCase()) || PT_ALLOW_WORDS.has(sf.toLowerCase()) || sf.includes(" ") || !CONTENT_POS.has(pos)) continue; chosen.add(sf.toLowerCase()); distractors.push(sf); } };
    take(samePos);
    take(pad);
    take(spec.words ?? []);

    const sentence = spec.sentences.find((s) => s.uses.includes(c.a));
    const prompt = c.prompt ?? (sentence
      ? sentence.pt.replace(new RegExp(`\\b${c.a}\\b`, "i"), "___")
      : `Which form goes with "eu"?`);

    return {
      id: nextId("con"), kind: "textMcq", _ord: -1,
      target: c.a, distractors, prompt,
      atoms: [c.a],
    };
  });
}

/** `pattern: { frame, slots: [{pt, en, distractorsEn}] }` — structured
 *  input (§2 row c: "a new grammar point's first retrieval step is
 *  input-only"): the learner sees a FILLED frame and picks its English
 *  meaning — an `mcq` (sentenceMcq), never a production step. */
export function buildPatternSteps(spec) {
  if (!spec.pattern) return [];
  return spec.pattern.slots.map((sl, i) => ({
    id: nextId("pat"), kind: "mcq", _ord: -1,
    prompt: sl.pt, correct: sl.en, distractors: sl.distractorsEn,
    why: `Pattern: ${spec.pattern.frame}`, atoms: [],
  }));
}

/** `conjugation: { verb, forms: [{pt, en, blank}] }` — a clozeLit SERIES
 *  across persons (harder-grammar prep for m2+): each form's own sentence,
 *  blanked at its conjugated form, with every OTHER form in the set as a
 *  distractor option (the same "whole paradigm as the option pool"
 *  discipline `contrastSet` uses for round-1's ser/estar/ter pairs). */
export function buildConjugationClozes(spec) {
  if (!spec.conjugation) return [];
  const allBlanks = spec.conjugation.forms.map((f) => f.blank);
  return spec.conjugation.forms.map((f, i) => ({
    id: nextId("cnj"), kind: "clozeLit", _ord: -1,
    pt: f.pt, en: f.en, blank: f.blank,
    options: [...new Set(allBlanks)],
    atoms: [f.blank], why: `${spec.conjugation.verb}: ${f.blank} vs. ${allBlanks.filter((b) => b !== f.blank).join("/")}`,
  }));
}

/** ITEM 9c (lane PTTOOL5): when >= 3 infinitives (-ar/-er/-ir verbs) are
 *  registered in `words:`, emit ONE clozeLit blanking one of them against
 *  the OTHER infinitives as options — the "-ar/-er/-ir retrieval moment"
 *  PTGRADE found missing whenever a lesson introduces 3+ infinitives but
 *  never contrasts them (only ever a same-person cloze). Returns null
 *  (never invents a sentence) when fewer than 3 qualify or none of them
 *  is actually used in any spec sentence. */
export function buildInfinitiveCloze(spec) {
  const infinitives = spec.words.filter((w) => w.pos === "verb" && /(ar|er|ir)$/i.test(w.pt));
  if (infinitives.length < 3) return null;
  const forms = infinitives.map((w) => w.pt);
  const sentence = spec.sentences.find((s) => infinitives.some((w) => s.uses.includes(w.pt)));
  if (!sentence) return null;
  const target = infinitives.find((w) => sentence.uses.includes(w.pt));
  const finalPt = normalizeSentence(sentence.pt);
  const blank = literalToken(finalPt, target.pt) ?? target.pt;
  return {
    id: nextId("inf"), kind: "clozeLit", _ord: spec.sentences.indexOf(sentence),
    pt: sentence.pt, en: sentence.en, blank,
    options: dedupeOptionsCaseInsensitive(forms.map((f) => (f === target.pt ? blank : f)), blank),
    atoms: sentence.uses,
    why: `"${blank}" is one of this lesson's -ar/-er/-ir infinitives (${forms.join("/")}) — pick the one that fits this sentence's meaning.`,
  };
}

/** Synthesizes a `phrase` debut candidate for an atom that would otherwise
 *  first print on a non-intro-capable step (finding 1b: a build sentence
 *  forced to `clozeLit` by a contraction must never BE that sentence's
 *  other atoms' debut). `ord` should be one tick before the step it's
 *  rescuing, so the order-preserving interleave places it immediately
 *  before.
 *
 *  ITEM 1 (lane PTTOOL5): a contrast-set member must never debut as a bare
 *  one-word card («Tenho.», «Tem.», «Gosta.») — no Brazilian produces a
 *  conjugated verb form in isolation, and PTGRADE3/4/5 all flagged it
 *  identically. The debut card is now the shortest (>= 3 word) spec
 *  sentence that actually `uses` this word, glossed with THAT sentence's
 *  own `en` (never `word.en`, a dictionary gloss — see item 3). When no
 *  such sentence exists, throws naming the form: synthesizing a fake
 *  sentence would violate the same no-invention doctrine `buildContrastSteps`
 *  already follows for distractor padding. */
export function buildPhraseDebut(word, ord, spec) {
  const candidates = (spec?.sentences ?? []).filter(
    (s) => s.uses.includes(word.pt) && bare(s.pt).trim().split(/\s+/).filter(Boolean).length >= 3,
  );
  if (!candidates.length) {
    throw new Error(
      `buildPhraseDebut: no sentence of >= 3 words uses "${word.pt}" for its debut card — ` +
        `smallest fix: add one to "sentences" using "${word.pt}"`,
    );
  }
  const shortest = candidates.reduce((a, b) =>
    bare(a.pt).trim().split(/\s+/).length <= bare(b.pt).trim().split(/\s+/).length ? a : b,
  );
  return {
    id: nextId("phr"), kind: "phrase", _ord: ord,
    meaning: shortest.en, text: shortest.pt, emoji: word.emoji, atoms: [word.pt],
  };
}
