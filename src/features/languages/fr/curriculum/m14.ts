/**
 * m14.ts — «Hier» — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m14-brief-2026-09-10.md: the learner
 * already has «j'ai» and «tu as» (m7) — this module opens the door to
 * yesterday by adding ONE new piece, the past participle, and building the
 * avoir + participle passé composé MACHINE around it. manger/mangé is the
 * model -er→-é case; a bare, vowel-onset atom «a» (il/elle/on) carries the
 * il/elle/on auxiliary — its negative form «n'a» is registered as its OWN
 * atom (see FR_M14_ATOMS) rather than free-derived, because `frTokens()`
 * drops single-character tokens and the elision lexicon can't produce a
 * first token from a bare one-letter surface.
 *
 * SCOPE DECISIONS (brief §7, executed not re-litigated):
 *   - être-auxiliary passé composé (allé/allée, …) is DEFERRED — it would
 *     overload je suis/tu es/il est's existing grammatical role, and
 *     allé/allée would be the course's FIRST audible-silent agreement pair
 *     (needs its own homophoneKey machinery day one, whenever it ships).
 *   - Atom «a» is registered BARE, not fused into «il a», matching m11's
 *     bare «aime» — but unlike «aime», «a» is a single-letter surface, so
 *     `getFrRealFormLexicon()` cannot free-derive its elided form:
 *     `frTokens()` filters out length-1 tokens, so `frTokens("a")` is empty
 *     and the elision-derivation loop never fires. «n'a» is therefore
 *     registered as its OWN atom (see FR_M14_ATOMS below) — a deliberate
 *     departure from the m11 precedent, verified live via the
 *     vocab-provenance gate flagging "n'a" as untracked until it was added,
 *     and via `npx vitest run` / `npx tsc --noEmit` at ship time.
 *   - manger is the sole new -er verb; «parlé» ships as the ONE optional
 *     stretch atom the brief flags (its bare infinitive «parler» is already
 *     registered from m11, unlike «aimé», whose infinitive is unregistered
 *     — the brief's own "safer add"). It debuts in L9 (integration) to show
 *     the machine transfers to a second verb — a deliberate judgment call:
 *     the brief left the 11th atom open, and m13's own L9 precedent (zero
 *     new atoms) is a m13-specific choice, not a course-wide law.
 *   - «je n'ai pas» / «tu n'as pas» are registered as FROZEN chunks (L6):
 *     «j'ai»/«tu as» are CONSONANT-onset surfaces, so `elidesBefore()`
 *     never fires for them and "n'ai"/"n'as" never free-derive — the exact
 *     precedent m13 already set for the identical reason. «il n'a pas» /
 *     «elle n'a pas» are NEVER registered as their own chunk atoms — they
 *     compose live from the separately-registered `il`/`elle` + `n'a` +
 *     `pas` atoms every time.
 *   - manger/mangé [mɑ̃ʒe] are a PURE homophone — written-only distinction
 *     everywhere (particle_cloze correctParticle, build/speaking targets);
 *     never co-presented as options inside an audio-bearing/listening-
 *     graded step. Pinned by this module's own bespoke test (the shared
 *     gate has no homophoneKey machinery for two DIFFERENT words — see
 *     m14.test.ts).
 *   - «a» / «à» is the module's sharpest homophone risk (exact [a]). No
 *     audio-bearing step ever co-presents them; a/à discrimination is
 *     never asked for by ear. Separately (not this module's doing, a
 *     pre-existing course fact worth recording): `src/features/languages
 *     /fr/module.ts`'s `protectedFoldedForms` already includes "a", so the
 *     TYPED-answer accent-fold cannot conflate «a» with «à» — this module
 *     ships no typed-translate steps at all (house rule), so that machinery
 *     is not directly exercised here, but it is one fewer surface this
 *     module's homophone risk can leak through.
 *   - «pas encore» carries an explicit contrast note against m6's «encore»
 *     (different word sense: time, not quantity) — folded into L7's single
 *     info card (the ≤1-info-card-per-lesson budget forced this into ONE
 *     card alongside the déjà/pas encore debut, not a second card).
 *   - Ne-drop is authored ONLY inside `dialogue_sim` NPC lines / choice
 *     reply OPTIONS, from L7 onward — m13's law, unchanged. Grading
 *     canonical stays the written full form everywhere else.
 *   - L10's soft m15 tease names no untaught word — «on va au musée ?»
 *     gestures at a future "visiting places" module using only atoms this
 *     course already teaches (m4/m5), the same technique m13's L10 used to
 *     tease «hier» without ever writing an untaught form.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   j'ai mangé un croissant hier L1 · j'ai mangé ce matin L2 · mon frère a
 *   mangé un croissant L5 · il a mangé un croissant L4 · tu n'as pas mangé
 *   hier soir L6 · je n'ai pas encore mangé L7 · j'ai parlé hier soir L9 —
 *   7 printed targets (plus the checkpoint/mastery review speaking steps,
 *   which are themselves recalls, not new prints).
 *   recalls: j'ai un chat L1 (m7) · c'est lundi L2 (m8) · où est le musée ?
 *   L3 (m4) · j'ai mangé un croissant hier L4 (internal, L1) · j'ai un
 *   frère L5 (m7) · il a mangé un croissant L6 (internal, L4) · il ne parle
 *   pas L7 (m13) · c'est lundi L8 (m8, reused) · je vais au cinéma L9 (m5)
 *   · moi aussi L9 (m3) · parce que c'est cher L9 (m13) · tu n'as pas mangé
 *   hier soir L10 (internal, L6) · c'est cher L10 (m12). 13 recalls total,
 *   9 tracing to a prior module — comfortably over the ≥8 floor.
 *
 * Cast: reused faces (Léa, Thomas, Hugo, Marie) now talking about what
 * happened rather than where things are; a L9 café/family scene mixing
 * manger and the fresh parler-transfer; a L10 mastery sim closing on a
 * one-line tease for m15 — visiting a place, without naming it.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  vocabTextMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  matchPairs,
  slotFor,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

/**
 * Hand-built MCQ, shape-identical to grammarHelpers' vocabTextMcq(), but
 * bypassing the atom registry entirely.
 *
 * WHY THIS EXISTS: FR's `import.meta.glob` curriculum loader resolves
 * module files in LEXICOGRAPHIC order — m14.ts's own module-level lesson-
 * building code runs BEFORE m2.ts–m9.ts register their atoms into the
 * shared surface registry (m1/m10–m13 sort before m14 and are safe; m2–m9
 * do not exist yet from m14's vantage point). vocabTextMcq() (and
 * matchPairs()) call resolveSurfaceGloss()/findFrAtomBySurface() and throw
 * hard if unregistered. Same landmine + same fix m11.ts documents in full
 * (see its own `crossModuleVocabMcq`) — used here for m14's L5 «frère»
 * review target (m7-sourced).
 */
function crossModuleVocabMcq(
  id: string,
  gloss: string,
  correctText: string,
  distractorTexts: [string, string, string],
): LessonStep {
  const items = [
    { id: "correct", text: correctText },
    { id: "opt-1", text: distractorTexts[0] },
    { id: "opt-2", text: distractorTexts[1] },
    { id: "opt-3", text: distractorTexts[2] },
  ];
  const slot = slotFor(id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id,
    type: "multiple_choice",
    prompt: `Which word means "${gloss}"?`,
    options: items,
    correctOptionId: "correct",
    optionsHideRomaji: true,
    exercisedAtoms: [],
    modality: "recognition",
  } as LessonStep;
}

/**
 * Hand-built match_pairs, shape-identical to grammarHelpers' matchPairs(),
 * but bypassing the atom registry — same m2–m9 ordering landmine as
 * `crossModuleVocabMcq` above. Takes explicit [surface, gloss] pairs
 * instead of live-resolving surfaces. Used for every L1–L5 review grid
 * that mixes in an m2–m9-sourced food/family/pronoun word.
 */
function crossModuleMatchPairs(
  idPrefix: string,
  entries: Array<[surface: string, gloss: string]>,
): LessonStep {
  if (entries.length < 6) {
    throw new Error(
      `fr crossModuleMatchPairs(${idPrefix}): needs >= 6 surfaces (got ${entries.length})`,
    );
  }
  return {
    id: `${idPrefix}-match`,
    type: "match_pairs",
    prompt: "Match each French word to its meaning",
    playAudioOnSelect: true,
    pairs: entries.map(([source, target], i) => ({ id: `p-${i}`, source, target })),
    exercisedAtoms: [],
    modality: "recognition",
  } as LessonStep;
}

export const FR_M14_ATOMS: FrAtom[] = [
  atom({ surface: "hier", meaningEn: "yesterday", partOfSpeech: "adverb", fromModule: "m14", kind: "vocab", hint: "yair" }),
  atom({ surface: "hier soir", meaningEn: "last night", partOfSpeech: "adverb", fromModule: "m14", kind: "phrase", hint: "yair swahr" }),
  atom({ surface: "ce matin", meaningEn: "this morning", partOfSpeech: "adverb", fromModule: "m14", kind: "phrase", hint: "suh ma-TAN" }),
  atom({ surface: "manger", meaningEn: "to eat", partOfSpeech: "verb", fromModule: "m14", kind: "vocab", hint: "mahn-ZHAY — bare infinitive; same sound as «mangé», written-only distinction" }),
  atom({ surface: "mangé", meaningEn: "ate / eaten", partOfSpeech: "verb", fromModule: "m14", kind: "vocab", hint: "mahn-ZHAY — the past participle; pairs with j'ai/tu as/il a" }),
  atom({ surface: "a", meaningEn: "has", partOfSpeech: "verb", fromModule: "m14", kind: "vocab", hint: "ah — il/elle/on; vowel-onset, so it elides to «n'a» — and an exact homophone of «à»" }),
  // The elision-derivation lexicon (getFrRealFormLexicon) builds elided
  // clitic forms from `frTokens(atom.surface)[0]` — but frTokens drops
  // length-1 tokens, so a single-letter atom like «a» never yields a
  // derived first-token and «n'a» can't free-derive from it (verified live
  // this session: the vocab-provenance gate flagged "n'a" as untracked
  // across L6-L10 before this entry existed). Registering it directly
  // keeps the pedagogy identical — «n'a» is still composed into full
  // sentences at build/cloze time, never memorized as part of a frozen
  // "il n'a pas" chunk (see the m14.test.ts pin forbidding that).
  atom({ surface: "n'a", meaningEn: "hasn't (il/elle/on)", partOfSpeech: "verb", fromModule: "m14", kind: "vocab", hint: "na — «ne» elided before the vowel-onset «a»; the negative half of the il/elle/on machine" }),
  atom({ surface: "déjà", meaningEn: "already", partOfSpeech: "adverb", fromModule: "m14", kind: "vocab", hint: "day-ZHA" }),
  atom({ surface: "pas encore", meaningEn: "not yet", partOfSpeech: "adverb", fromModule: "m14", kind: "phrase", hint: "pa zahn-KOR — TIME, not the m6 «encore» (more/another)" }),
  atom({ surface: "je n'ai pas", meaningEn: "I haven't / didn't", partOfSpeech: "verb", fromModule: "m14", kind: "phrase", hint: "zhuh nay pa — frozen; «j'ai» is consonant-onset, so «n'ai» never free-derives" }),
  atom({ surface: "tu n'as pas", meaningEn: "you haven't / didn't", partOfSpeech: "verb", fromModule: "m14", kind: "phrase", hint: "tu na pa — frozen; «tu as» is consonant-onset, so «n'as» never free-derives" }),
  atom({ surface: "parlé", meaningEn: "spoke / spoken", partOfSpeech: "verb", fromModule: "m14", kind: "vocab", hint: "par-LAY — the machine's second verb; bare infinitive «parler» already known (m11)" }),
];

/** L1 — «J'ai mangé»: manger→mangé debuts as the model -er→-é participle,
 *  wrapped straight into the j'ai machine the learner already owns (m7),
 *  with «hier» as the first time marker. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m14-1-info-manger",
      "J'ai mangé",
      "«Manger» — to eat. Drop the -er, add -é: «mangé» — eaten. Put it after «j'ai» and you're in the past: «j'ai mangé» — I ate. Add «hier» — yesterday — to say when.",
    ),
    {
      id: "fr-m14-1-map-manger",
      type: "word_map",
      tokens: ["manger", "mangé", "j'ai mangé", "hier"],
      pairs: [
        { en: "to eat", tokenIndex: 0 },
        { en: "eaten", tokenIndex: 1 },
        { en: "I ate", tokenIndex: 2 },
        { en: "yesterday", tokenIndex: 3 },
      ],
      audioText: "manger, mangé, j'ai mangé, hier",
      revealNote: "«manger» → «mangé» — drop -er, add -é.",
    },
    vocabTextMcq("fr-m14-1-mcq-mange", "mangé", ["aime", "habite", "parle"], 'Which word means "eaten"?'),
    build(
      "fr-m14-1-build-croissant",
      "Build: 'I ate a croissant yesterday'",
      "j'ai mangé un croissant hier",
      ["j'ai", "mangé", "un croissant", "hier", "je vais"],
      ["j'ai", "mangé", "un croissant", "hier"],
    ),
    listeningCompSentence({
      id: "fr-m14-1-lc-salade",
      audioText: "j'ai mangé une salade hier",
      correctMeaningEn: "I ate a salad yesterday.",
      distractorsEn: ["I'm eating a salad today.", "I ate a sandwich yesterday.", "I have a salad today."],
    }),
    speaking("fr-m14-1-speak-croissant", "j'ai mangé un croissant hier", "I ate a croissant yesterday", ["mangé", "hier"]),
    cloze(
      "fr-m14-1-cloze-manger",
      "j'aime",
      "la salade",
      "manger",
      ["manger", "mangé", "parle"],
      "I like to eat salad",
      "j'aime manger la salade",
      "«j'aime manger» — after «aime», the verb stays in its bare infinitive form, «manger».",
    ),
    build(
      "fr-m14-1-build-gateau",
      "Build: 'I ate a cake yesterday'",
      "j'ai mangé un gâteau hier",
      ["j'ai", "mangé", "un gâteau", "hier", "je vais"],
      ["j'ai", "mangé", "un gâteau", "hier"],
    ),
    sentenceMcq({
      id: "fr-m14-1-smcq-jaimange",
      prompt: "'I ate' — pick the French.",
      correctText: "j'ai mangé",
      distractorsText: ["j'ai manger", "je mangé", "tu as mangé"],
    }),
    speaking("fr-m14-1-speak-recall-chat", "j'ai un chat", "I have a cat", [], "recall"),
    {
      id: "fr-m14-1-sim-diner",
      type: "dialogue_sim",
      scene: { emoji: "🍽️", title: "What did you eat?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-mange",
          npc: {
            speaker: "Léa",
            kana: "Tu as mangé ?",
            audioText: "tu as mangé ?",
            gloss: "Did you eat?",
          },
          goal: "Say yes, you ate a croissant.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, j'ai mangé un croissant" },
              { id: "wrong-no", text: "non, je n'aime pas" },
              { id: "wrong-tense", text: "oui, je mange un croissant" },
            ],
            correctOptionId: "correct",
            audioText: "oui, j'ai mangé un croissant",
          },
          replyGloss: "Yes, I ate a croissant.",
        },
        {
          id: "t2-hier",
          npc: {
            speaker: "Léa",
            kana: "Hier aussi ?",
            audioText: "hier aussi ?",
            gloss: "Yesterday too?",
          },
          goal: "Say yes, yesterday too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, hier aussi" },
              { id: "wrong-no", text: "non, pas hier" },
              { id: "wrong-word", text: "oui, moi aussi" },
            ],
            correctOptionId: "correct",
            audioText: "oui, hier aussi",
          },
          replyGloss: "Yes, yesterday too.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m14-1", [
      ["manger", "to eat"],
      ["mangé", "ate / eaten"],
      ["hier", "yesterday"],
      ["croissant", "croissant"],
      ["salade", "salad"],
      ["gâteau", "cake"],
    ]),
  ];
}

/** L2 — «Tu as mangé... hier soir»: two new time phrases (hier soir, ce
 *  matin), contrast cloze, interleaving m8's day recall. Avoids the
 *  untaught «c'était» entirely. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m14-2-info-hiersoir",
      "Hier soir, ce matin",
      "Two more times: «hier soir» — last night — and «ce matin» — this morning. Same machine: «tu as mangé hier soir ?» — did you eat last night?",
    ),
    {
      id: "fr-m14-2-map-hiersoir",
      type: "word_map",
      tokens: ["tu as mangé", "hier soir", "ce matin", "aujourd'hui"],
      pairs: [
        { en: "you ate", tokenIndex: 0 },
        { en: "last night", tokenIndex: 1 },
        { en: "this morning", tokenIndex: 2 },
        { en: "today", tokenIndex: 3 },
      ],
      audioText: "tu as mangé, hier soir, ce matin, aujourd'hui",
      revealNote: "«hier soir» / «ce matin» — two more times to attach to the machine.",
    },
    vocabTextMcq("fr-m14-2-mcq-hiersoir", "hier soir", ["ce matin", "aujourd'hui", "demain"]),
    build(
      "fr-m14-2-build-hiersoirq",
      "Build: 'did you eat last night?'",
      "tu as mangé hier soir ?",
      ["tu as", "mangé", "hier soir ?", "ce matin"],
      ["tu as", "mangé", "hier soir ?"],
    ),
    listeningCompSentence({
      id: "fr-m14-2-lc-cematin",
      audioText: "j'ai mangé un sandwich ce matin",
      correctMeaningEn: "I ate a sandwich this morning.",
      distractorsEn: ["I ate a sandwich last night.", "I'm eating a sandwich this morning.", "I ate a croissant this morning."],
    }),
    speaking("fr-m14-2-speak-cematin", "j'ai mangé ce matin", "I ate this morning", ["mangé", "ce matin"]),
    cloze(
      "fr-m14-2-cloze-contrast",
      "tu as mangé",
      "ou ce matin ?",
      "hier soir",
      ["hier soir", "ce matin", "aujourd'hui"],
      "did you eat last night or this morning?",
      "tu as mangé hier soir ou ce matin ?",
      "«hier soir ou ce matin ?» — same machine, two different times to choose between.",
    ),
    build(
      "fr-m14-2-build-cematin2",
      "Build: 'I ate this morning'",
      "j'ai mangé ce matin",
      ["j'ai", "mangé", "ce matin", "hier soir"],
      ["j'ai", "mangé", "ce matin"],
    ),
    sentenceMcq({
      id: "fr-m14-2-smcq-hiersoir",
      prompt: "'Last night' — pick the French.",
      correctText: "hier soir",
      distractorsText: ["ce matin", "ce soir", "aujourd'hui"],
    }),
    speaking("fr-m14-2-speak-recall-lundi", "c'est lundi", "it's Monday", [], "recall"),
    {
      id: "fr-m14-2-sim-matin",
      type: "dialogue_sim",
      scene: { emoji: "🌅", title: "This morning" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cematin",
          npc: {
            speaker: "Thomas",
            kana: "Tu as mangé ce matin ?",
            audioText: "tu as mangé ce matin ?",
            gloss: "Did you eat this morning?",
          },
          goal: "Say yes, this morning.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, ce matin" },
              { id: "wrong-soir", text: "oui, hier soir" },
              { id: "wrong-no", text: "non, pas ce matin" },
            ],
            correctOptionId: "correct",
            audioText: "oui, ce matin",
          },
          replyGloss: "Yes, this morning.",
        },
        {
          id: "t2-hiersoir",
          npc: {
            speaker: "Thomas",
            kana: "Et hier soir ?",
            audioText: "et hier soir ?",
            gloss: "And last night?",
          },
          goal: "Say yes, last night too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, hier soir aussi" },
              { id: "wrong-matin", text: "oui, ce matin aussi" },
              { id: "wrong-know", text: "je ne sais pas" },
            ],
            correctOptionId: "correct",
            audioText: "oui, hier soir aussi",
          },
          replyGloss: "Yes, last night too.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m14-2", [
      ["hier soir", "last night"],
      ["ce matin", "this morning"],
      ["mangé", "ate / eaten"],
      ["manger", "to eat"],
      ["hier", "yesterday"],
      ["aujourd'hui", "today"],
    ]),
  ];
}

/** L3 — consolidation, je/tu only, no new atoms: the machine drilled with
 *  more food nouns and both times, before il/elle enter next lesson. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m14-3-info-recap",
      "On révise",
      "«J'ai mangé», «tu as mangé» — the same machine works with any food and any time you already know. Keep building.",
    ),
    {
      id: "fr-m14-3-map-recap",
      type: "word_map",
      tokens: ["j'ai mangé", "tu as mangé", "hier soir", "ce matin"],
      pairs: [
        { en: "I ate", tokenIndex: 0 },
        { en: "you ate", tokenIndex: 1 },
        { en: "last night", tokenIndex: 2 },
        { en: "this morning", tokenIndex: 3 },
      ],
      audioText: "j'ai mangé, tu as mangé, hier soir, ce matin",
      revealNote: "Same machine, any food, any time.",
    },
    vocabTextMcq("fr-m14-3-mcq-manger", "manger", ["habite", "parle", "aime"], 'Which word means "to eat"?'),
    build(
      "fr-m14-3-build-sandwich",
      "Build: 'I ate a sandwich this morning'",
      "j'ai mangé un sandwich ce matin",
      ["j'ai", "mangé", "un sandwich", "ce matin", "hier soir"],
      ["j'ai", "mangé", "un sandwich", "ce matin"],
    ),
    listeningCompSentence({
      id: "fr-m14-3-lc-saladesoir",
      audioText: "tu as mangé une salade hier soir",
      correctMeaningEn: "You ate a salad last night.",
      distractorsEn: ["You ate a salad this morning.", "I ate a salad last night.", "You ate a sandwich last night."],
    }),
    speaking("fr-m14-3-speak-gateaumatin", "tu as mangé un gâteau ce matin", "you ate a cake this morning", ["mangé", "ce matin"]),
    cloze(
      "fr-m14-3-cloze-tuas",
      "",
      "as mangé hier soir",
      "tu",
      ["tu", "je"],
      "you ate last night",
      "tu as mangé hier soir",
      "«tu as mangé» — the subject decides which auxiliary you use.",
    ),
    build(
      "fr-m14-3-build-croissanttoi",
      "Build: 'I ate a croissant, and you?'",
      "j'ai mangé un croissant, et toi ?",
      ["j'ai mangé un croissant", "et toi ?", "tu as mangé un croissant", "j'ai mangé un gâteau"],
      ["j'ai mangé un croissant", "et toi ?"],
    ),
    sentenceMcq({
      id: "fr-m14-3-smcq-tuasmange",
      prompt: "'You ate' — pick the French.",
      correctText: "tu as mangé",
      distractorsText: ["j'ai mangé", "tu as manger", "tu as mangé hier"],
    }),
    speaking("fr-m14-3-speak-recall-musee", "où est le musée ?", "where is the museum?", [], "recall"),
    {
      id: "fr-m14-3-sim-repas",
      type: "dialogue_sim",
      scene: { emoji: "🥗", title: "Meals" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-salade",
          npc: {
            speaker: "Hugo",
            kana: "Tu as mangé une salade hier soir ?",
            audioText: "tu as mangé une salade hier soir ?",
            gloss: "Did you eat a salad last night?",
          },
          goal: "Say no, a sandwich.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, un sandwich" },
              { id: "wrong-yes", text: "oui, une salade" },
              { id: "wrong-time", text: "non, ce matin" },
            ],
            correctOptionId: "correct",
            audioText: "non, un sandwich",
          },
          replyGloss: "No, a sandwich.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m14-3", [
      ["manger", "to eat"],
      ["mangé", "ate / eaten"],
      ["hier", "yesterday"],
      ["hier soir", "last night"],
      ["ce matin", "this morning"],
      ["sandwich", "sandwich"],
    ]),
  ];
}

/** L4 — «Il a mangé»: debuts the bare atom «a» (il/elle/on), positive only
 *  — no negation yet. Vowel-onset by construction; L6 registers its
 *  negative form «n'a» as its own atom (frTokens can't derive an elided
 *  form from a single-letter surface). */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m14-4-info-ilamange",
      "Il a mangé",
      "For «il», «elle», «on», the auxiliary is «a» — not «j'ai», not «tu as». «il a mangé» — he ate. «elle a mangé» — she ate. Same participle either way.",
    ),
    {
      id: "fr-m14-4-map-ilamange",
      type: "word_map",
      tokens: ["il a mangé", "elle a mangé", "il a", "elle a"],
      pairs: [
        { en: "he ate", tokenIndex: 0 },
        { en: "she ate", tokenIndex: 1 },
        { en: "he has", tokenIndex: 2 },
        { en: "she has", tokenIndex: 3 },
      ],
      audioText: "il a mangé, elle a mangé, il a, elle a",
      revealNote: "«a» — the auxiliary for il/elle/on.",
    },
    vocabTextMcq("fr-m14-4-mcq-a", "a", ["est", "de", "aime"], 'Which word means "has"?'),
    build(
      "fr-m14-4-build-ilsandwich",
      "Build: 'he ate a sandwich'",
      "il a mangé un sandwich",
      ["il", "a", "mangé", "un sandwich", "elle"],
      ["il", "a", "mangé", "un sandwich"],
    ),
    listeningCompSentence({
      id: "fr-m14-4-lc-ellegateau",
      audioText: "elle a mangé un gâteau",
      correctMeaningEn: "She ate a cake.",
      distractorsEn: ["He ate a cake.", "She ate a sandwich.", "She has a cake."],
    }),
    speaking("fr-m14-4-speak-ilcroissant", "il a mangé un croissant", "he ate a croissant", ["a", "mangé"]),
    cloze(
      "fr-m14-4-cloze-elle",
      "elle",
      "mangé un gâteau",
      "a",
      ["a", "est", "aime"],
      "she ate a cake",
      "elle a mangé un gâteau",
      "«elle a mangé» — the auxiliary changes with the subject; «a» for il/elle/on.",
    ),
    build(
      "fr-m14-4-build-ellesalade",
      "Build: 'she ate a salad, yesterday'",
      "elle a mangé une salade, hier",
      ["elle", "a", "mangé", "une salade", "hier", "il"],
      ["elle", "a", "mangé", "une salade", "hier"],
    ),
    sentenceMcq({
      id: "fr-m14-4-smcq-ilamange",
      prompt: "'He ate' — pick the French.",
      correctText: "il a mangé",
      distractorsText: ["il a manger", "elle a mangé", "il est mangé"],
    }),
    speaking("fr-m14-4-speak-recall-croissanthier", "j'ai mangé un croissant hier", "I ate a croissant yesterday", [], "recall"),
    {
      id: "fr-m14-4-sim-leathomas",
      type: "dialogue_sim",
      scene: { emoji: "👦", title: "About Thomas" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-thomas",
          npc: {
            speaker: "Léa",
            kana: "Thomas a mangé ?",
            audioText: "thomas a mangé ?",
            gloss: "Did Thomas eat?",
          },
          goal: "Say yes, he ate a croissant.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, il a mangé un croissant" },
              { id: "wrong-no", text: "non, il n'aime pas" },
              { id: "wrong-tense", text: "oui, il mange un croissant" },
            ],
            correctOptionId: "correct",
            audioText: "oui, il a mangé un croissant",
          },
          replyGloss: "Yes, he ate a croissant.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m14-4", [
      ["a", "has"],
      ["il", "he"],
      ["elle", "she"],
      ["mangé", "ate / eaten"],
      ["manger", "to eat"],
      ["croissant", "croissant"],
    ]),
  ];
}

/** L5 — review + light interleave: the «a» machine carries to family nouns
 *  (m7) and a light adjective (m9), no new atoms, no agreementChain (no
 *  natural multi-slot agreement here). */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m14-5-info-famille",
      "Mon frère a mangé",
      "«Il a mangé» works for any name too: «mon frère a mangé», «Léa a mangé». Same «a», same participle.",
    ),
    {
      id: "fr-m14-5-map-famille",
      type: "word_map",
      tokens: ["mon frère a mangé", "ma sœur a mangé", "il a mangé", "elle a mangé"],
      pairs: [
        { en: "my brother ate", tokenIndex: 0 },
        { en: "my sister ate", tokenIndex: 1 },
        { en: "he ate", tokenIndex: 2 },
        { en: "she ate", tokenIndex: 3 },
      ],
      audioText: "mon frère a mangé, ma sœur a mangé, il a mangé, elle a mangé",
      revealNote: "«a» works with any name, not just il/elle.",
    },
    crossModuleVocabMcq("fr-m14-5-mcq-frere", "brother", "frère", ["sœur", "père", "mère"]),
    build(
      "fr-m14-5-build-monfrerecroissant",
      "Build: 'my brother ate a croissant'",
      "mon frère a mangé un croissant",
      ["mon frère", "a", "mangé", "un croissant", "ma sœur"],
      ["mon frère", "a", "mangé", "un croissant"],
    ),
    listeningCompSentence({
      id: "fr-m14-5-lc-masoeur",
      audioText: "ma sœur a mangé une salade",
      correctMeaningEn: "My sister ate a salad.",
      distractorsEn: ["My brother ate a salad.", "My sister ate a sandwich.", "My sister has a salad."],
    }),
    speaking("fr-m14-5-speak-monfrerecroissant", "mon frère a mangé un croissant", "my brother ate a croissant", ["a", "mangé", "frère"]),
    cloze(
      "fr-m14-5-cloze-masoeur",
      "ma",
      "a mangé une salade",
      "sœur",
      ["sœur", "frère"],
      "my sister ate a salad",
      "ma sœur a mangé une salade",
      "«ma sœur a mangé» — a name or family word slots into the same auxiliary «a».",
    ),
    build(
      "fr-m14-5-build-monpere",
      "Build: 'my father ate a sandwich yesterday'",
      "mon père a mangé un sandwich hier",
      ["mon père", "a", "mangé", "un sandwich", "hier", "ma mère"],
      ["mon père", "a", "mangé", "un sandwich", "hier"],
    ),
    sentenceMcq({
      id: "fr-m14-5-smcq-monfrere",
      prompt: "'My brother ate' — pick the French.",
      correctText: "mon frère a mangé",
      distractorsText: ["ma sœur a mangé", "mon frère a manger", "mon père a mangé"],
    }),
    speaking("fr-m14-5-speak-recall-frere", "j'ai un frère", "I have a brother", [], "recall"),
    {
      id: "fr-m14-5-sim-petitfrere",
      type: "dialogue_sim",
      scene: { emoji: "👦", title: "Little brother" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-petitfrere",
          npc: {
            speaker: "Marie",
            kana: "Ton petit frère a mangé ?",
            audioText: "ton petit frère a mangé ?",
            gloss: "Did your little brother eat?",
          },
          goal: "Say yes, he ate a cake.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, il a mangé un gâteau" },
              { id: "wrong-no", text: "non, il n'aime pas" },
              { id: "wrong-who", text: "oui, ma sœur a mangé" },
            ],
            correctOptionId: "correct",
            audioText: "oui, il a mangé un gâteau",
          },
          replyGloss: "Yes, he ate a cake.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m14-5", [
      ["frère", "brother"],
      ["sœur", "sister"],
      ["père", "father"],
      ["mère", "mother"],
      ["a", "has"],
      ["mangé", "ate / eaten"],
    ]),
  ];
}

/** L6 — «Je n'ai pas mangé»: debuts the frozen chunks «je n'ai pas» / «tu
 *  n'as pas», plus the standalone atom «n'a» (il/elle/on's negated form —
 *  registered directly, not free-derived, since «a» is a single-letter
 *  surface `frTokens()` can't produce an elision base from). «il/elle n'a
 *  pas» itself is never registered as a chunk — it composes live from the
 *  already-known `il`/`elle` + `n'a` + `pas` atoms. Full written register,
 *  no ne-drop yet. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m14-6-info-negation",
      "Je n'ai pas mangé",
      "Negate the auxiliary, the participle stays: «je n'ai pas mangé», «tu n'as pas mangé». For il/elle/on, «a» shrinks to «n'a» before a vowel — the same rule as «n'aime»: «il n'a pas mangé».",
    ),
    {
      id: "fr-m14-6-map-negation",
      type: "word_map",
      tokens: ["je n'ai pas", "tu n'as pas", "il n'a pas", "mangé"],
      pairs: [
        { en: "I haven't", tokenIndex: 0 },
        { en: "you haven't", tokenIndex: 1 },
        { en: "he hasn't", tokenIndex: 2 },
        { en: "eaten", tokenIndex: 3 },
      ],
      audioText: "je n'ai pas, tu n'as pas, il n'a pas, mangé",
      revealNote: "«n'a» — «a» shrinks before a vowel, same rule as «n'aime».",
    },
    vocabTextMcq("fr-m14-6-mcq-jenaipas", "je n'ai pas", ["j'ai", "tu n'as pas", "je n'aime pas"]),
    build(
      "fr-m14-6-build-jenaipas",
      "Build: 'I didn't eat yesterday'",
      "je n'ai pas mangé hier",
      ["je n'ai pas", "mangé", "hier", "tu n'as pas"],
      ["je n'ai pas", "mangé", "hier"],
    ),
    listeningCompSentence({
      id: "fr-m14-6-lc-tunaspas",
      audioText: "tu n'as pas mangé ce matin",
      correctMeaningEn: "You didn't eat this morning.",
      distractorsEn: ["You ate this morning.", "You didn't eat last night.", "I didn't eat this morning."],
    }),
    speaking("fr-m14-6-speak-tunaspas", "tu n'as pas mangé hier soir", "you didn't eat last night", ["tu n'as pas", "mangé", "hier soir"]),
    cloze(
      "fr-m14-6-cloze-na",
      "il",
      "pas mangé",
      "n'a",
      ["n'a", "a", "n'ai"],
      "he didn't eat",
      "il n'a pas mangé",
      "«il n'a pas» — «a» elides to «n'a» before a vowel, the same rule as «n'aime».",
    ),
    build(
      "fr-m14-6-build-ilnapas",
      "Build: 'he didn't eat'",
      "il n'a pas mangé",
      ["il", "n'a", "pas", "mangé", "elle", "a"],
      ["il", "n'a", "pas", "mangé"],
    ),
    listeningCompSentence({
      id: "fr-m14-6-lc-ilnapas",
      audioText: "il n'a pas mangé",
      correctMeaningEn: "He didn't eat.",
      distractorsEn: ["He ate.", "She didn't eat.", "You didn't eat."],
    }),
    speaking("fr-m14-6-speak-recall-ilcroissant", "il a mangé un croissant", "he ate a croissant", [], "recall"),
    build(
      "fr-m14-6-build-ellenapas",
      "Build: 'she didn't eat this morning'",
      "elle n'a pas mangé ce matin",
      ["elle", "n'a", "pas", "mangé", "ce matin", "il"],
      ["elle", "n'a", "pas", "mangé", "ce matin"],
    ),
    {
      id: "fr-m14-6-sim-negation",
      type: "dialogue_sim",
      scene: { emoji: "🙅", title: "Who ate?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tuas",
          npc: {
            speaker: "Marie",
            kana: "Tu as mangé ?",
            audioText: "tu as mangé ?",
            gloss: "Did you eat?",
          },
          goal: "Say no, you didn't eat.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, je n'ai pas mangé" },
              { id: "wrong-yes", text: "oui, j'ai mangé" },
              { id: "wrong-who", text: "non, il n'a pas mangé" },
            ],
            correctOptionId: "correct",
            audioText: "non, je n'ai pas mangé",
          },
          replyGloss: "No, I didn't eat.",
        },
        {
          id: "t2-il",
          npc: {
            speaker: "Marie",
            kana: "Et Thomas ?",
            audioText: "et thomas ?",
            gloss: "And Thomas?",
          },
          goal: "Say he didn't eat either.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il n'a pas mangé non plus" },
              { id: "wrong-yes", text: "il a mangé" },
              { id: "wrong-form", text: "il n'ai pas mangé" },
            ],
            correctOptionId: "correct",
            audioText: "il n'a pas mangé non plus",
          },
          replyGloss: "He didn't eat either.",
        },
      ],
    },
    matchPairs("fr-m14-6", ["je n'ai pas", "tu n'as pas", "mangé", "manger", "hier", "hier soir"]),
  ];
}

/** L7 — «Déjà / pas encore»: debuts the aspect kit. Negation wraps the
 *  auxiliary only: «je n'ai pas encore mangé». Ne-drop is licensed from
 *  here on, ONLY inside `dialogue_sim` NPC lines / choice options. */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m14-7-info-deja",
      "Déjà / pas encore",
      "«Déjà» — already: «j'ai déjà mangé». «Pas encore» — not yet — wraps the auxiliary: «je n'ai pas encore mangé». Careful: this isn't the «encore» from ordering food (more/another) — it's about TIME. In casual spoken French, people often drop the «ne»: «j'ai pas encore mangé» — you'll hear that below, but keep writing the full form.",
    ),
    {
      id: "fr-m14-7-map-deja",
      type: "word_map",
      tokens: ["déjà", "pas encore", "tu as mangé ?", "oui, déjà"],
      pairs: [
        { en: "already", tokenIndex: 0 },
        { en: "not yet", tokenIndex: 1 },
        { en: "have you eaten?", tokenIndex: 2 },
        { en: "yes, already", tokenIndex: 3 },
      ],
      audioText: "déjà, pas encore, tu as mangé ?, oui, déjà",
      revealNote: "«déjà» / «pas encore» — the aspect kit.",
    },
    vocabTextMcq("fr-m14-7-mcq-deja", "déjà", ["pas encore", "hier", "encore"]),
    build(
      "fr-m14-7-build-tuasdeja",
      "Build: 'have you already eaten?'",
      "tu as déjà mangé ?",
      ["tu as", "déjà", "mangé ?", "pas encore"],
      ["tu as", "déjà", "mangé ?"],
    ),
    listeningCompSentence({
      id: "fr-m14-7-lc-pasencore",
      audioText: "je n'ai pas encore mangé",
      correctMeaningEn: "I haven't eaten yet.",
      distractorsEn: ["I already ate.", "I haven't eaten.", "I ate already."],
    }),
    speaking("fr-m14-7-speak-pasencore", "je n'ai pas encore mangé", "I haven't eaten yet", ["je n'ai pas", "pas encore", "mangé"]),
    cloze(
      "fr-m14-7-cloze-deja",
      "j'ai",
      "mangé",
      "déjà",
      ["déjà", "pas encore", "encore"],
      "I already ate",
      "j'ai déjà mangé",
      "«j'ai déjà mangé» — «déjà» sits between the auxiliary and the participle.",
    ),
    build(
      "fr-m14-7-build-ilnapasencore",
      "Build: 'he hasn't eaten yet'",
      "il n'a pas encore mangé",
      ["il", "n'a", "pas encore", "mangé", "elle"],
      ["il", "n'a", "pas encore", "mangé"],
    ),
    sentenceMcq({
      id: "fr-m14-7-smcq-pasencore",
      prompt: "'Not yet' — pick the French.",
      correctText: "pas encore",
      distractorsText: ["déjà", "encore", "pas"],
    }),
    speaking("fr-m14-7-speak-recall-ilneparle", "il ne parle pas", "he doesn't speak", [], "recall"),
    {
      id: "fr-m14-7-sim-dejamange",
      type: "dialogue_sim",
      scene: { emoji: "🤷", title: "Already or not yet?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-deja",
          npc: {
            speaker: "Hugo",
            kana: "Tu as déjà mangé ?",
            audioText: "tu as déjà mangé ?",
            gloss: "Have you already eaten?",
          },
          goal: "Say no, not yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, j'ai pas encore mangé" },
              { id: "also-correct", text: "non, je n'ai pas encore mangé" },
              { id: "wrong-yes", text: "oui, j'ai déjà mangé" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "non, j'ai pas encore mangé",
          },
          replyGloss: "No, not yet.",
        },
        {
          id: "t2-moinonplus",
          npc: {
            speaker: "Hugo",
            kana: "Ah, moi non plus, j'ai pas encore mangé ce matin.",
            audioText: "ah, moi non plus, j'ai pas encore mangé ce matin",
            gloss: "Ah, me neither, I haven't eaten this morning.",
          },
          goal: "Agree.",
          reply: {
            mode: "choice",
            options: [
              { id: "wrong-aussi", text: "moi aussi" },
              { id: "correct", text: "moi non plus" },
              { id: "wrong-word", text: "déjà" },
            ],
            correctOptionId: "correct",
            audioText: "moi non plus",
          },
          replyGloss: "Me neither.",
        },
      ],
    },
    matchPairs("fr-m14-7", ["déjà", "pas encore", "je n'ai pas", "tu n'as pas", "mangé", "hier soir"]),
  ];
}

/** L8 — checkpoint: zero new atoms, all graded, mirroring m13 L8's own
 *  shape (a transfer-test build combines the taught atoms in a fresh
 *  sentence the course has never printed verbatim before). */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m14-8-lc-1",
      audioText: "j'ai mangé un sandwich hier soir",
      correctMeaningEn: "I ate a sandwich last night.",
      distractorsEn: ["I ate a sandwich this morning.", "I'm eating a sandwich tonight.", "I ate a salad last night."],
    }),
    cloze(
      "fr-m14-8-cloze-1",
      "elle",
      "pas mangé ce matin",
      "n'a",
      ["n'a", "a"],
      "she hasn't eaten this morning",
      "elle n'a pas mangé ce matin",
    ),
    speaking("fr-m14-8-speak-jaidejamange", "j'ai déjà mangé", "I already ate", []),
    sentenceMcq({
      id: "fr-m14-8-smcq-1",
      prompt: "'Not yet' — pick the French.",
      correctText: "pas encore",
      distractorsText: ["déjà", "encore", "hier"],
    }),
    build(
      "fr-m14-8-build-1",
      "Build: 'you haven't eaten yet'",
      "tu n'as pas encore mangé",
      ["tu n'as pas", "encore", "mangé", "déjà"],
      ["tu n'as pas", "encore", "mangé"],
    ),
    listeningCompSentence({
      id: "fr-m14-8-lc-2",
      audioText: "il n'a pas encore mangé",
      correctMeaningEn: "He hasn't eaten yet.",
      distractorsEn: ["He already ate.", "He hasn't eaten.", "She hasn't eaten yet."],
    }),
    cloze(
      "fr-m14-8-cloze-2",
      "je n'ai pas",
      "mangé",
      "encore",
      ["encore", "déjà"],
      "I haven't eaten yet",
      "je n'ai pas encore mangé",
    ),
    speaking("fr-m14-8-speak-recall-cestlundi", "c'est lundi", "it's Monday", [], "recall"),
    sentenceMcq({
      id: "fr-m14-8-smcq-2",
      prompt: "'He has' — pick the French.",
      correctText: "il a",
      distractorsText: ["il n'a pas", "elle a", "il est"],
    }),
    build(
      "fr-m14-8-build-transfer",
      "Build: 'she hasn't eaten yet this morning'",
      "elle n'a pas encore mangé ce matin",
      ["elle", "n'a", "pas encore", "mangé", "ce matin", "il"],
      ["elle", "n'a", "pas encore", "mangé", "ce matin"],
    ),
    listeningCompSentence({
      id: "fr-m14-8-lc-3",
      audioText: "mon frère a mangé, et ma sœur n'a pas encore mangé",
      correctMeaningEn: "My brother ate, and my sister hasn't eaten yet.",
      distractorsEn: [
        "My brother and sister already ate.",
        "My sister ate, and my brother hasn't eaten yet.",
        "My brother hasn't eaten yet.",
      ],
    }),
    build(
      "fr-m14-8-build-2",
      "Build: 'you ate a cake last night'",
      "tu as mangé un gâteau hier soir",
      ["tu as", "mangé", "un gâteau", "hier soir", "ce matin"],
      ["tu as", "mangé", "un gâteau", "hier soir"],
    ),
    {
      id: "fr-m14-8-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "mangé", target: "ate / eaten" },
        { id: "p-1", source: "déjà", target: "already" },
        { id: "p-2", source: "pas encore", target: "not yet" },
        { id: "p-3", source: "a", target: "has" },
        { id: "p-4", source: "hier soir", target: "last night" },
        { id: "p-5", source: "ce matin", target: "this morning" },
      ],
    },
  ];
}

/** L9 — integration: debuts the optional stretch atom «parlé» to show the
 *  machine transfers to a second verb (bare infinitive «parler» already
 *  known, m11); no info card; one big dialogue_sim tail; three
 *  cross-module recalls. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m14-9-map-parle",
      type: "word_map",
      tokens: ["j'ai parlé", "tu as parlé", "parlé", "parler"],
      pairs: [
        { en: "I spoke", tokenIndex: 0 },
        { en: "you spoke", tokenIndex: 1 },
        { en: "spoken", tokenIndex: 2 },
        { en: "to speak", tokenIndex: 3 },
      ],
      audioText: "j'ai parlé, tu as parlé, parlé, parler",
      revealNote: "The same machine, a second verb: «parler» → «parlé».",
    },
    vocabTextMcq("fr-m14-9-mcq-parle", "parlé", ["parler", "mangé", "manger"], 'Which word means "spoken"?'),
    build(
      "fr-m14-9-build-jaidejaparle",
      "Build: 'I already spoke'",
      "j'ai déjà parlé",
      ["j'ai", "déjà", "parlé", "mangé"],
      ["j'ai", "déjà", "parlé"],
    ),
    listeningCompSentence({
      id: "fr-m14-9-lc-tuasparle",
      audioText: "tu as parlé hier soir",
      correctMeaningEn: "You spoke last night.",
      distractorsEn: ["You spoke this morning.", "I spoke last night.", "You ate last night."],
    }),
    speaking("fr-m14-9-speak-jaiparle", "j'ai parlé hier soir", "I spoke last night", ["parlé", "hier soir"]),
    cloze(
      "fr-m14-9-cloze-parle",
      "il a déjà",
      "hier soir",
      "parlé",
      ["parlé", "mangé"],
      "he already spoke last night",
      "il a déjà parlé hier soir",
      "«il a déjà parlé» — the same machine, a second verb.",
    ),
    build(
      "fr-m14-9-build-tudejaparle",
      "Build: 'did you already speak?'",
      "tu as déjà parlé ?",
      ["tu as", "déjà", "parlé ?", "mangé ?"],
      ["tu as", "déjà", "parlé ?"],
    ),
    sentenceMcq({
      id: "fr-m14-9-smcq-parle",
      prompt: "'I spoke' — pick the French.",
      correctText: "j'ai parlé",
      distractorsText: ["j'ai parler", "je parle", "tu as parlé"],
    }),
    speaking("fr-m14-9-speak-recall-cinema", "je vais au cinéma", "I'm going to the movies", [], "recall"),
    listeningCompSentence({
      id: "fr-m14-9-lc-review",
      audioText: "elle n'a pas encore mangé, mais elle a déjà parlé",
      correctMeaningEn: "She hasn't eaten yet, but she already spoke.",
      distractorsEn: ["She already ate, but she hasn't spoken yet.", "She hasn't eaten or spoken yet.", "She already ate and spoke."],
    }),
    speaking("fr-m14-9-speak-recall-moiaussi", "moi aussi", "me too", [], "recall"),
    build(
      "fr-m14-9-build-elleparle",
      "Build: 'she already spoke'",
      "elle a déjà parlé",
      ["elle", "a", "déjà", "parlé", "il"],
      ["elle", "a", "déjà", "parlé"],
    ),
    speaking("fr-m14-9-speak-recall-parceque", "parce que c'est cher", "because it's expensive", [], "recall"),
    matchPairs("fr-m14-9", ["parlé", "parler", "manger", "mangé", "déjà", "hier soir"]),
    {
      id: "fr-m14-9-sim-cafefamille",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Café news" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-mangeparle",
          npc: {
            speaker: "Chloé",
            kana: "Tu as mangé ce matin ?",
            audioText: "tu as mangé ce matin ?",
            gloss: "Did you eat this morning?",
          },
          goal: "Say yes, and that you already spoke.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et j'ai déjà parlé" },
              { id: "wrong-no", text: "non, pas encore" },
              { id: "wrong-tense", text: "oui, et je parle" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et j'ai déjà parlé",
          },
          replyGloss: "Yes, and I already spoke.",
        },
        {
          id: "t2-frere",
          npc: {
            speaker: "Chloé",
            kana: "Et ton frère, il a mangé ?",
            audioText: "et ton frère, il a mangé ?",
            gloss: "And your brother, did he eat?",
          },
          goal: "Say no, he hasn't eaten yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, il a pas encore mangé" },
              { id: "also-correct", text: "non, il n'a pas encore mangé" },
              { id: "wrong-yes", text: "oui, il a déjà mangé" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "non, il a pas encore mangé",
          },
          replyGloss: "No, he hasn't eaten yet.",
        },
        {
          id: "t3-lea",
          npc: {
            speaker: "Chloé",
            kana: "Et Léa, elle a parlé hier soir ?",
            audioText: "et léa, elle a parlé hier soir ?",
            gloss: "And Léa, did she speak last night?",
          },
          goal: "Say yes, me too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, moi aussi" },
              { id: "wrong-no", text: "non, moi non plus" },
              { id: "wrong-tense", text: "oui, elle parle" },
            ],
            correctOptionId: "correct",
            audioText: "oui, moi aussi",
          },
          replyGloss: "Yes, me too.",
        },
      ],
    },
  ];
}

/** L10 — mastery: all graded, no info, every atom present, ends on the
 *  dialogue_sim, closing on a soft m15 tease using only already-taught
 *  words. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m14-10-lc-1",
      audioText: "j'ai déjà mangé un croissant ce matin",
      correctMeaningEn: "I already ate a croissant this morning.",
      distractorsEn: ["I haven't eaten a croissant this morning.", "I already ate a croissant last night.", "I'm eating a croissant this morning."],
    }),
    cloze(
      "fr-m14-10-cloze-1",
      "elle",
      "pas encore parlé",
      "n'a",
      ["n'a", "a"],
      "she hasn't spoken yet",
      "elle n'a pas encore parlé",
    ),
    speaking("fr-m14-10-speak-recall-tunaspas", "tu n'as pas mangé hier soir", "you didn't eat last night", [], "recall"),
    sentenceMcq({
      id: "fr-m14-10-smcq-1",
      prompt: "'Yesterday' — pick the French.",
      correctText: "hier",
      distractorsText: ["hier soir", "ce matin", "déjà"],
    }),
    build(
      "fr-m14-10-build-1",
      "Build: 'I haven't eaten yet'",
      "je n'ai pas encore mangé",
      ["je n'ai pas", "encore", "mangé", "déjà"],
      ["je n'ai pas", "encore", "mangé"],
    ),
    listeningCompSentence({
      id: "fr-m14-10-lc-2",
      audioText: "mon frère a mangé un gâteau hier soir",
      correctMeaningEn: "My brother ate a cake last night.",
      distractorsEn: ["My sister ate a cake last night.", "My brother ate a cake this morning.", "My brother hasn't eaten cake."],
    }),
    speaking("fr-m14-10-speak-fresh", "j'ai déjà parlé ce matin", "I already spoke this morning", ["déjà", "parlé", "ce matin"]),
    vocabTextMcq("fr-m14-10-mcq-manger", "manger", ["mangé", "parler", "parlé"], 'Which word means "to eat"?'),
    build(
      "fr-m14-10-build-2",
      "Build: 'he ate yesterday'",
      "il a mangé hier",
      ["il", "a", "mangé", "hier", "elle"],
      ["il", "a", "mangé", "hier"],
    ),
    speaking("fr-m14-10-speak-recall-cher", "c'est cher", "it's expensive", [], "recall"),
    {
      id: "fr-m14-10-sim-soiree",
      type: "dialogue_sim",
      scene: { emoji: "🌆", title: "Catching up" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-mangecematin",
          npc: {
            speaker: "Marie",
            kana: "Tu as mangé ce matin ?",
            audioText: "tu as mangé ce matin ?",
            gloss: "Did you eat this morning?",
          },
          goal: "Say yes, you already ate a croissant.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, j'ai déjà mangé un croissant" },
              { id: "wrong-no", text: "non, je n'ai pas encore mangé" },
              { id: "wrong-tense", text: "oui, je mange un croissant" },
            ],
            correctOptionId: "correct",
            audioText: "oui, j'ai déjà mangé un croissant",
          },
          replyGloss: "Yes, I already ate a croissant.",
        },
        {
          id: "t2-parle",
          npc: {
            speaker: "Marie",
            kana: "Et hier soir, tu as parlé ?",
            audioText: "et hier soir, tu as parlé ?",
            gloss: "And last night, did you talk?",
          },
          goal: "Say no, not yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, pas encore" },
              { id: "wrong-yes", text: "oui, déjà" },
              { id: "wrong-mangé", text: "non, je n'ai pas mangé" },
            ],
            correctOptionId: "correct",
            audioText: "non, pas encore",
          },
          replyGloss: "No, not yet.",
        },
        {
          id: "t3-tease",
          npc: {
            speaker: "Marie",
            kana: "D'accord. Demain, on va au musée ?",
            audioText: "d'accord, demain, on va au musée ?",
            gloss: "Okay. Tomorrow, shall we go to the museum?",
          },
          goal: "Agree.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord" },
              { id: "wrong-non", text: "non" },
              { id: "wrong-sais", text: "je ne sais pas" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord",
          },
          replyGloss: "Okay.",
        },
      ],
    },
  ];
}

const FR_M14_1: LessonContent = {
  id: "fr-m14-1",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "J'ai mangé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M14_2: LessonContent = {
  id: "fr-m14-2",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Hier soir, ce matin",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M14_3: LessonContent = {
  id: "fr-m14-3",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "On révise",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M14_4: LessonContent = {
  id: "fr-m14-4",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il a mangé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M14_5: LessonContent = {
  id: "fr-m14-5",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Mon frère a mangé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M14_6: LessonContent = {
  id: "fr-m14-6",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je n'ai pas mangé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M14_7: LessonContent = {
  id: "fr-m14-7",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Déjà / pas encore",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M14_8: LessonContent = {
  id: "fr-m14-8",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Hier",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M14_9: LessonContent = {
  id: "fr-m14-9",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Café news",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M14_10: LessonContent = {
  id: "fr-m14-10",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Catching up",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M14_MODULE: FrModuleDef = {
  title: "Hier",
  eyebrow: "Module 14",
  summary:
    "The avoir you already have opens a door to yesterday: add one new piece to «j'ai»/«tu as» and you're reporting what happened — what you ate, what you already did, what you haven't done yet.",
  lessons: [
    FR_M14_1,
    FR_M14_2,
    FR_M14_3,
    FR_M14_4,
    FR_M14_5,
    FR_M14_6,
    FR_M14_7,
    FR_M14_8,
    FR_M14_9,
    FR_M14_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M14_CHECKPOINT_INDEX = 8;

export const FR_M14_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m14-s",
    moduleId: "m14",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m14-s",
        prompt: "'I ate' — pick the French.",
        correctText: "j'ai mangé",
        distractorsText: ["j'ai manger", "je mangé", "tu as mangé"],
      }),
  },
  {
    id: "pt-fr-m14-1",
    moduleId: "m14",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m14-1",
        prompt: "'Last night' — pick the French.",
        correctText: "hier soir",
        distractorsText: ["ce matin", "ce soir", "aujourd'hui"],
      }),
  },
  {
    id: "pt-fr-m14-2",
    moduleId: "m14",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m14-2",
        prompt: "'He ate' — pick the French.",
        correctText: "il a mangé",
        distractorsText: ["il a manger", "elle a mangé", "il est mangé"],
      }),
  },
  {
    id: "pt-fr-m14-3",
    moduleId: "m14",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m14-3",
        prompt: "'He didn't eat' — pick the French.",
        correctText: "il n'a pas mangé",
        distractorsText: ["il a mangé", "elle n'a pas mangé", "tu n'as pas mangé"],
      }),
  },
  {
    id: "pt-fr-m14-4",
    moduleId: "m14",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m14-4",
        prompt: "'Not yet' — pick the French.",
        correctText: "pas encore",
        distractorsText: ["déjà", "encore", "hier"],
      }),
  },
];
