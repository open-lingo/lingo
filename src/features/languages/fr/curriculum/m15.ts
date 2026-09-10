/**
 * m15.ts — «La visite» — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m15-brief-2026-09-10.md: grand
 * consolidation before the être-auxiliary wave (m16). Two small unlocks
 * carried on top of the avoir + participle machine the learner already owns
 * (m14): the phrase «en ville» (L1-L2) and an h-aspiré contrast (L2's
 * «halle» against m4's already-registered mute-h «hôtel»). The rest of the
 * module (L4-L10) extends the manger/mangé machine to a THIRD verb, visiter,
 * whose present tense (visite) and past participle (visité) are a pure
 * written-only homophone [vizite] — mirroring m14's own manger/mangé
 * handling exactly.
 *
 * SCOPE DECISIONS (brief §7, executed not re-litigated):
 *   - Atom «visite» is registered as the bare il/elle/on present form
 *     (matching m11's «aime»/«habite»/«parle» precedent) — [vizit], silent
 *     final -e. Atom «visité» is the past participle — [vizite], audible
 *     final syllable. These are NOT a homophone pair with each other
 *     (different final sound); «visiter» (bare infinitive) and «visité»
 *     (past participle) ARE a pure homophone pair [vizite] for regular -er
 *     verbs — no `homophoneKey` is set (that machinery is built for ONE word
 *     sharing forms, not two different words sharing a sound); instead this
 *     module carries its own bespoke pin (see m15.test.ts) confirming
 *     visiter/visité are never co-presented in an audio-bearing bank, the
 *     exact technique m14.test.ts uses for manger/mangé.
 *   - «halle» ships `hAspire: true` — a real h aspiré word («la halle», «les
 *     Halles» with no liaison) — deliberately contrasted against m4's
 *     already-registered mute-h «hôtel» («l'hôtel»). `withArticle("halle")`
 *     resolves through `elidesBefore()`'s `isConsonantOnset()` short-circuit,
 *     which returns false — i.e. no elision — independent of «halle»'s
 *     vowel-looking spelling, BY CONSTRUCTION. Verified live via
 *     `npx vitest run` / `npx tsc --noEmit` at ship time (see the module's
 *     own bespoke test pin).
 *   - The brief's optional 6th atom («content»/«contente») is CUT — coverage
 *     not volume; this module already carries two new subsystems (h-aspiré
 *     phonology, a third verb on the avoir+participle machine) and a fourth
 *     would dilute both. docs/fr-m16-brief-2026-09-10.md (drafted
 *     concurrently, read-only) independently lists it as optional/cuttable,
 *     corroborating this call.
 *   - Negated present («on ne visite pas») needs NO new atom: general
 *     ne...pas negation of a consonant-onset -er verb is well-precedented
 *     since m13 («il ne parle pas»), and «visite» begins with consonant v —
 *     no elision, so it composes exactly like «ne parle pas».
 *   - Negated past («je n'ai pas visité» / «il n'a pas visité») needs NO new
 *     atom either — fully reuses m14's «je n'ai pas» / «tu n'as pas» / «n'a»
 *     atoms plus this module's own «visité» participle, executing the
 *     brief's claim exactly as m14's L6-L7 machine composes. «il n'a pas
 *     visité» / «elle n'a pas visité» are NEVER registered as their own
 *     chunk atoms — same rule as m14, they compose live.
 *   - «en ville» is a phrase atom (not a re-registration of m4's bare
 *     «ville», which stays registered separately by exact-surface dedup).
 *     L1 reviews m4's place nouns («musée», «gare», «école», «hôtel»,
 *     «restaurant», «parc») via the `crossModuleMatchPairs`/
 *     `crossModuleVocabMcq` pattern — see the header note on WHY these
 *     exist, copied verbatim from m14.ts/m11.ts.
 *   - Ne-drop is authored ONLY inside `dialogue_sim` NPC lines / choice
 *     reply OPTIONS, from L7 onward — the same law m13/m14 set, unchanged.
 *   - L10's soft m16 tease names no untaught être-auxiliary form — «demain,
 *     on va au musée ?» gestures at a future "where did you go" need using
 *     only atoms this course already teaches (m4/m5), the exact technique
 *     m13→m14 and m14→m15 used.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   on visite la ville L1 · j'ai visité la halle hier L2 · elle a visité le
 *   musée L4 · il visite la gare L4 · tu ne visites pas l'école L6 · je n'ai
 *   pas visité l'hôtel L7 · nous avons... — wait, "nous" untaught; dropped —
 *   mon frère a visité le parc L5 · j'ai déjà visité la halle L9 — printed
 *   targets across L1-L9 (see per-lesson comments below for the exact set).
 *   recalls: j'ai mangé un croissant hier L1 (m14) · où est le musée ? L2
 *   (m4) · c'est lundi L3 (m8) · il a mangé un croissant L4 (m14) · j'ai un
 *   frère L5 (m7) · il ne parle pas L6 (m13) · tu n'as pas mangé hier soir
 *   L7 (m14) · je vais au cinéma L8 (m5) · moi aussi L9 (m3) · c'est cher
 *   L10 (m12) — 10 recalls, all tracing to a prior module — comfortably over
 *   the ≥8 floor.
 *
 * Cast: reused faces (Léa, Thomas, Hugo, Marie, Chloé) now touring the town;
 *   a L9 integration lesson debuting no new atoms, just the whole machine in
 *   one scene; a L10 mastery sim closing on a soft tease for m16 — asking
 *   where someone went, without naming the untaught être form.
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
 * module files in LEXICOGRAPHIC order — m15.ts's own module-level lesson-
 * building code runs BEFORE m2.ts–m9.ts register their atoms into the
 * shared surface registry (m1/m10–m14 sort before m15 and are safe; m2–m9
 * do not exist yet from m15's vantage point). vocabTextMcq() (and
 * matchPairs()) call resolveSurfaceGloss()/findFrAtomBySurface() and throw
 * hard if unregistered. Same landmine + same fix m11.ts/m14.ts document in
 * full — used here for m15's place-noun review (m4-sourced).
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
 * instead of live-resolving surfaces. Used for every review grid that mixes
 * in an m2–m9-sourced word.
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

export const FR_M15_ATOMS: FrAtom[] = [
  atom({ surface: "en ville", meaningEn: "in town / around town", partOfSpeech: "adverb", fromModule: "m15", kind: "phrase", hint: "ahn veel" }),
  atom({ surface: "visiter", meaningEn: "to visit", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", hint: "vee-zee-TAY — bare infinitive; consonant-onset, no elision" }),
  atom({ surface: "visite", meaningEn: "visit(s) (il/elle/on)", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", homophoneKey: "vizit", hint: "vee-ZEET — silent final -e, unlike «visité»" }),
  atom({ surface: "visites", meaningEn: "visit (tu)", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", homophoneKey: "vizit", hint: "same sound as visite — the -s is silent, only the spelling moves" }),
  atom({ surface: "visité", meaningEn: "visited", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", hint: "vee-zee-TAY — the past participle; a pure written-only homophone of «visiter» itself — see the module header" }),
  atom({ surface: "halle", meaningEn: "covered market", partOfSpeech: "noun", fromModule: "m15", kind: "vocab", gender: "f", hAspire: true, hint: "al — h ASPIRÉ: «la halle», never «l'halle», unlike m4's «l'hôtel»" }),
];

/** L1 — «En ville»: debuts the phrase atom, reviews m4's place nouns via the
 *  cross-module pattern, introduces «visiter» bare infinitive with «il y a»
 *  (m4) as the frame. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m15-1-info-enville",
      "En ville",
      "«En ville» — in town, around town. Today we visit everything: «visiter» — to visit. «on visite la ville» — we visit the town.",
    ),
    {
      id: "fr-m15-1-map-enville",
      type: "word_map",
      tokens: ["en ville", "visiter", "on visite", "la ville"],
      pairs: [
        { en: "in town", tokenIndex: 0 },
        { en: "to visit", tokenIndex: 1 },
        { en: "we visit", tokenIndex: 2 },
        { en: "the town", tokenIndex: 3 },
      ],
      audioText: "en ville, visiter, on visite, la ville",
      revealNote: "«visiter» — bare infinitive, consonant-onset, no elision.",
    },
    crossModuleVocabMcq("fr-m15-1-mcq-musee", "museum", "musée", ["gare", "école", "restaurant"]),
    build(
      "fr-m15-1-build-onvisite",
      "Build: 'we visit the town'",
      "on visite la ville",
      ["on", "visite", "la ville", "en ville"],
      ["on", "visite", "la ville"],
    ),
    listeningCompSentence({
      id: "fr-m15-1-lc-enville",
      audioText: "aujourd'hui, on visite la ville",
      correctMeaningEn: "Today, we're visiting the town.",
      distractorsEn: ["Yesterday, we visited the town.", "Today, we're eating in town.", "Today, we live in town."],
    }),
    speaking("fr-m15-1-speak-onvisite", "on visite la ville", "we visit the town", ["visite"]),
    cloze(
      "fr-m15-1-cloze-visiter",
      "j'aime",
      "la ville",
      "visiter",
      ["visiter", "visite"],
      "I like to visit the town",
      "j'aime visiter la ville",
      "«j'aime visiter» — after «aime», the verb stays in its bare infinitive form, «visiter».",
    ),
    build(
      "fr-m15-1-build-museegare",
      "Build: 'there's a museum and a train station in town'",
      "il y a un musée et une gare en ville",
      ["il y a", "un musée", "et une gare", "en ville", "hier"],
      ["il y a", "un musée", "et une gare", "en ville"],
    ),
    sentenceMcq({
      id: "fr-m15-1-smcq-visiter",
      prompt: "'To visit' — pick the French.",
      correctText: "visiter",
      distractorsText: ["visite", "parler", "habiter"],
    }),
    speaking("fr-m15-1-speak-recall-mange", "j'ai mangé un croissant hier", "I ate a croissant yesterday", [], "recall"),
    {
      id: "fr-m15-1-sim-ontourne",
      type: "dialogue_sim",
      scene: { emoji: "🗺️", title: "A day in town" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-onvisite",
          npc: {
            speaker: "Léa",
            kana: "On visite la ville aujourd'hui ?",
            audioText: "on visite la ville aujourd'hui ?",
            gloss: "Are we visiting the town today?",
          },
          goal: "Say yes, in town.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, en ville" },
              { id: "wrong-no", text: "non, à la maison" },
              { id: "wrong-echo", text: "oui, on visite" },
            ],
            correctOptionId: "correct",
            audioText: "oui, en ville",
          },
          replyGloss: "Yes, in town.",
        },
        {
          id: "t2-musee",
          npc: {
            speaker: "Léa",
            kana: "Il y a un musée ici ?",
            audioText: "il y a un musée ici ?",
            gloss: "Is there a museum here?",
          },
          goal: "Say yes, and a train station.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et une gare" },
              { id: "wrong-no", text: "non, pas de musée" },
              { id: "wrong-word", text: "oui, et une école" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et une gare",
          },
          replyGloss: "Yes, and a train station.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m15-1", [
      ["visiter", "to visit"],
      ["en ville", "in town"],
      ["musée", "museum"],
      ["gare", "train station"],
      ["école", "school"],
      ["restaurant", "restaurant"],
    ]),
  ];
}

/** L2 — «La halle»: debuts the h-aspiré atom against m4's mute-h «hôtel»,
 *  and the past participle «visité» (model -er→-é, third verb on the
 *  machine). */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m15-2-info-halle",
      "La halle",
      "«La halle» — the covered market. «Halle» starts with an h ASPIRÉ, so the article never squeezes, unlike «l'hôtel». And «visiter» drops -er, adds -é, same as «manger» → «mangé»: «j'ai visité» — I visited.",
    ),
    {
      id: "fr-m15-2-map-halle",
      type: "word_map",
      tokens: ["la halle", "l'hôtel", "visité", "j'ai visité"],
      pairs: [
        { en: "the covered market", tokenIndex: 0 },
        { en: "the hotel", tokenIndex: 1 },
        { en: "visited", tokenIndex: 2 },
        { en: "I visited", tokenIndex: 3 },
      ],
      audioText: "la halle, l'hôtel, visité, j'ai visité",
      revealNote: "«la halle» — h aspiré, never «l'halle». Compare «l'hôtel», mute h.",
    },
    crossModuleVocabMcq("fr-m15-2-mcq-halle", "covered market", "la halle", ["l'hôtel", "la gare", "l'école"]),
    build(
      "fr-m15-2-build-jaivisite",
      "Build: 'I visited the covered market yesterday'",
      "j'ai visité la halle hier",
      ["j'ai", "visité", "la halle", "hier", "l'hôtel"],
      ["j'ai", "visité", "la halle", "hier"],
    ),
    listeningCompSentence({
      id: "fr-m15-2-lc-lhotel",
      audioText: "j'ai visité l'hôtel hier soir",
      correctMeaningEn: "I visited the hotel last night.",
      distractorsEn: ["I visited the covered market last night.", "I'm visiting the hotel tonight.", "I visited the hotel this morning."],
    }),
    speaking("fr-m15-2-speak-jaivisite", "j'ai visité la halle hier", "I visited the covered market yesterday", ["visité", "halle"]),
    cloze(
      "fr-m15-2-cloze-halle",
      "je vais à",
      "ce matin",
      "la halle",
      ["la halle", "l'hôtel", "la gare"],
      "I'm going to the covered market this morning",
      "je vais à la halle ce matin",
      "«la halle» — the article never squeezes before an h aspiré word.",
    ),
    build(
      "fr-m15-2-build-lhotelvisite",
      "Build: 'she visited the hotel yesterday'",
      "elle a visité l'hôtel hier",
      ["elle", "a", "visité", "l'hôtel", "hier", "la halle"],
      ["elle", "a", "visité", "l'hôtel", "hier"],
    ),
    sentenceMcq({
      id: "fr-m15-2-smcq-halle",
      prompt: "'The covered market' — pick the French.",
      correctText: "la halle",
      distractorsText: ["l'halle", "l'hôtel", "la gare"],
    }),
    speaking("fr-m15-2-speak-recall-musee", "où est le musée ?", "where is the museum?", [], "recall"),
    {
      id: "fr-m15-2-sim-halleouhotel",
      type: "dialogue_sim",
      scene: { emoji: "🏛️", title: "Halle or hôtel?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-halle",
          npc: {
            speaker: "Thomas",
            kana: "Tu as visité la halle ?",
            audioText: "tu as visité la halle ?",
            gloss: "Did you visit the covered market?",
          },
          goal: "Say yes, and the hotel too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et l'hôtel aussi" },
              { id: "wrong-no", text: "non, pas encore" },
              { id: "wrong-form", text: "oui, et l'halle aussi" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et l'hôtel aussi",
          },
          replyGloss: "Yes, and the hotel too.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m15-2", [
      ["halle", "covered market"],
      ["visité", "visited"],
      ["hôtel", "hotel"],
      ["musée", "museum"],
      ["gare", "train station"],
      ["restaurant", "restaurant"],
    ]),
  ];
}

/** L3 — consolidation, no new atoms: the visiter/visité machine drilled with
 *  more place nouns and both auxiliaries, before il/elle interleave next
 *  lesson. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m15-3-info-recap",
      "On révise",
      "«Visiter», «visité», «en ville», «la halle» — the same words, any place you already know. Keep building.",
    ),
    {
      id: "fr-m15-3-map-recap",
      type: "word_map",
      tokens: ["j'ai visité", "tu as visité", "en ville", "la halle"],
      pairs: [
        { en: "I visited", tokenIndex: 0 },
        { en: "you visited", tokenIndex: 1 },
        { en: "in town", tokenIndex: 2 },
        { en: "the covered market", tokenIndex: 3 },
      ],
      audioText: "j'ai visité, tu as visité, en ville, la halle",
      revealNote: "Same machine, any place, any time.",
    },
    crossModuleVocabMcq("fr-m15-3-mcq-ecole", "school", "école", ["gare", "musée", "restaurant"]),
    build(
      "fr-m15-3-build-tuasvisite",
      "Build: 'you visited the school this morning'",
      "tu as visité l'école ce matin",
      ["tu as", "visité", "l'école", "ce matin", "hier"],
      ["tu as", "visité", "l'école", "ce matin"],
    ),
    listeningCompSentence({
      id: "fr-m15-3-lc-restaurant",
      audioText: "tu as visité le restaurant hier soir",
      correctMeaningEn: "You visited the restaurant last night.",
      distractorsEn: ["You visited the restaurant this morning.", "I visited the restaurant last night.", "You visited the school last night."],
    }),
    speaking("fr-m15-3-speak-gareavisite", "tu as visité la gare ce matin", "you visited the train station this morning", ["visité", "ce matin"]),
    cloze(
      "fr-m15-3-cloze-tuas",
      "",
      "as visité la ville hier",
      "tu",
      ["tu", "je"],
      "you visited the town yesterday",
      "tu as visité la ville hier",
      "«tu as visité» — the subject decides which auxiliary you use.",
    ),
    build(
      "fr-m15-3-build-jaivisitetoi",
      "Build: 'I visited the covered market, and you?'",
      "j'ai visité la halle, et toi ?",
      ["j'ai visité la halle", "et toi ?", "tu as visité la halle", "j'ai visité l'école"],
      ["j'ai visité la halle", "et toi ?"],
    ),
    sentenceMcq({
      id: "fr-m15-3-smcq-tuasvisite",
      prompt: "'You visited' — pick the French.",
      correctText: "tu as visité",
      distractorsText: ["j'ai visité", "tu as visiter", "tu as visité hier"],
    }),
    speaking("fr-m15-3-speak-recall-lundi", "c'est lundi", "it's Monday", [], "recall"),
    {
      id: "fr-m15-3-sim-visites",
      type: "dialogue_sim",
      scene: { emoji: "🏫", title: "Which places?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ecole",
          npc: {
            speaker: "Hugo",
            kana: "Tu as visité l'école hier soir ?",
            audioText: "tu as visité l'école hier soir ?",
            gloss: "Did you visit the school last night?",
          },
          goal: "Say no, the restaurant.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, le restaurant" },
              { id: "wrong-yes", text: "oui, l'école" },
              { id: "wrong-time", text: "non, ce matin" },
            ],
            correctOptionId: "correct",
            audioText: "non, le restaurant",
          },
          replyGloss: "No, the restaurant.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m15-3", [
      ["visiter", "to visit"],
      ["visité", "visited"],
      ["en ville", "in town"],
      ["école", "school"],
      ["gare", "train station"],
      ["restaurant", "restaurant"],
    ]),
  ];
}

/** L4 — «Il visite» / «il a visité»: interleaves present (il/elle/on) and
 *  past forms side by side, no new atoms — both already registered. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m15-4-info-ilvisite",
      "Il visite, il a visité",
      "«Il visite» — he visits, right now. «Il a visité» — he visited. Same auxiliary «a» you already know from «il a mangé».",
    ),
    {
      id: "fr-m15-4-map-ilvisite",
      type: "word_map",
      tokens: ["il visite", "il a visité", "elle visite", "elle a visité"],
      pairs: [
        { en: "he visits", tokenIndex: 0 },
        { en: "he visited", tokenIndex: 1 },
        { en: "she visits", tokenIndex: 2 },
        { en: "she visited", tokenIndex: 3 },
      ],
      audioText: "il visite, il a visité, elle visite, elle a visité",
      revealNote: "«visite» (now) vs «a visité» (already happened).",
    },
    crossModuleVocabMcq("fr-m15-4-mcq-gare", "train station", "gare", ["musée", "halle", "école"]),
    build(
      "fr-m15-4-build-ilvisitegare",
      "Build: 'he visits the train station'",
      "il visite la gare",
      ["il", "visite", "la gare", "elle"],
      ["il", "visite", "la gare"],
    ),
    listeningCompSentence({
      id: "fr-m15-4-lc-ellevisite",
      audioText: "elle a visité le musée",
      correctMeaningEn: "She visited the museum.",
      distractorsEn: ["He visited the museum.", "She visits the museum.", "She has a museum."],
    }),
    speaking("fr-m15-4-speak-ilamusee", "elle a visité le musée", "she visited the museum", ["a", "visité"]),
    cloze(
      "fr-m15-4-cloze-ilvisite",
      "il",
      "la gare ce matin",
      "visite",
      ["visite", "visité", "visiter"],
      "he visits the train station this morning",
      "il visite la gare ce matin",
      "«il visite» — present tense, right now, no auxiliary needed.",
    ),
    build(
      "fr-m15-4-build-ellehalle",
      "Build: 'she visited the covered market, yesterday'",
      "elle a visité la halle, hier",
      ["elle", "a", "visité", "la halle", "hier", "il"],
      ["elle", "a", "visité", "la halle", "hier"],
    ),
    sentenceMcq({
      id: "fr-m15-4-smcq-ilvisite",
      prompt: "'He visits' — pick the French.",
      correctText: "il visite",
      distractorsText: ["il a visité", "elle visite", "il visité"],
    }),
    speaking("fr-m15-4-speak-recall-ilmange", "il a mangé un croissant", "he ate a croissant", [], "recall"),
    {
      id: "fr-m15-4-sim-thomasvisite",
      type: "dialogue_sim",
      scene: { emoji: "🚉", title: "About Thomas" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-thomasvisite",
          npc: {
            speaker: "Léa",
            kana: "Thomas visite la gare ?",
            audioText: "thomas visite la gare ?",
            gloss: "Is Thomas visiting the train station?",
          },
          goal: "Say yes, he already visited the museum.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, il a déjà visité le musée" },
              { id: "wrong-no", text: "non, il n'aime pas" },
              { id: "wrong-tense", text: "oui, il visite le musée" },
            ],
            correctOptionId: "correct",
            audioText: "oui, il a déjà visité le musée",
          },
          replyGloss: "Yes, he already visited the museum.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m15-4", [
      ["visite", "visit(s)"],
      ["visité", "visited"],
      ["il", "he"],
      ["elle", "she"],
      ["gare", "train station"],
      ["musée", "museum"],
    ]),
  ];
}

/** L5 — review + light interleave: the machine carries to family nouns
 *  (m7), no new atoms. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m15-5-info-famille",
      "Mon frère a visité",
      "«Il a visité» works for any name too: «mon frère a visité», «Léa a visité». Same «a», same participle.",
    ),
    {
      id: "fr-m15-5-map-famille",
      type: "word_map",
      tokens: ["mon frère a visité", "ma sœur a visité", "il a visité", "elle a visité"],
      pairs: [
        { en: "my brother visited", tokenIndex: 0 },
        { en: "my sister visited", tokenIndex: 1 },
        { en: "he visited", tokenIndex: 2 },
        { en: "she visited", tokenIndex: 3 },
      ],
      audioText: "mon frère a visité, ma sœur a visité, il a visité, elle a visité",
      revealNote: "«a visité» works with any name, not just il/elle.",
    },
    crossModuleVocabMcq("fr-m15-5-mcq-frere", "brother", "frère", ["sœur", "père", "mère"]),
    build(
      "fr-m15-5-build-monfrereparc",
      "Build: 'my brother visited the park'",
      "mon frère a visité le parc",
      ["mon frère", "a", "visité", "le parc", "ma sœur"],
      ["mon frère", "a", "visité", "le parc"],
    ),
    listeningCompSentence({
      id: "fr-m15-5-lc-masoeur",
      audioText: "ma sœur a visité la halle",
      correctMeaningEn: "My sister visited the covered market.",
      distractorsEn: ["My brother visited the covered market.", "My sister visited the hotel.", "My sister visits the covered market."],
    }),
    speaking("fr-m15-5-speak-monfrereparc", "mon frère a visité le parc", "my brother visited the park", ["a", "visité", "frère"]),
    cloze(
      "fr-m15-5-cloze-masoeur",
      "ma",
      "a visité la halle",
      "sœur",
      ["sœur", "frère"],
      "my sister visited the covered market",
      "ma sœur a visité la halle",
      "«ma sœur a visité» — a name or family word slots into the same auxiliary «a».",
    ),
    build(
      "fr-m15-5-build-monperegare",
      "Build: 'my father visited the train station yesterday'",
      "mon père a visité la gare hier",
      ["mon père", "a", "visité", "la gare", "hier", "ma mère"],
      ["mon père", "a", "visité", "la gare", "hier"],
    ),
    sentenceMcq({
      id: "fr-m15-5-smcq-monfrere",
      prompt: "'My brother visited' — pick the French.",
      correctText: "mon frère a visité",
      distractorsText: ["ma sœur a visité", "mon frère a visite", "mon père a visité"],
    }),
    speaking("fr-m15-5-speak-recall-frere", "j'ai un frère", "I have a brother", [], "recall"),
    {
      id: "fr-m15-5-sim-petitfrere",
      type: "dialogue_sim",
      scene: { emoji: "👦", title: "Little brother" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-petitfrerevisite",
          npc: {
            speaker: "Marie",
            kana: "Ton petit frère a visité la halle ?",
            audioText: "ton petit frère a visité la halle ?",
            gloss: "Did your little brother visit the covered market?",
          },
          goal: "Say yes, and the museum.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et le musée" },
              { id: "wrong-no", text: "non, il n'aime pas" },
              { id: "wrong-who", text: "oui, ma sœur aussi" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et le musée",
          },
          replyGloss: "Yes, and the museum.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m15-5", [
      ["frère", "brother"],
      ["sœur", "sister"],
      ["père", "father"],
      ["mère", "mother"],
      ["visité", "visited"],
      ["parc", "park"],
    ]),
  ];
}

/** L6 — «On ne visite pas»: present-tense negation, consonant-onset «visite»
 *  so no elision, composing exactly like «ne parle pas» (m13). No new
 *  atoms. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m15-6-info-negation",
      "On ne visite pas",
      "Negate a present-tense verb the same way as always: «ne … pas» around it. «visite» starts with a consonant, so no squeeze — «il ne visite pas», just like «il ne parle pas».",
    ),
    {
      id: "fr-m15-6-map-negation",
      type: "word_map",
      tokens: ["je ne visite pas", "tu ne visites pas", "il ne visite pas", "on ne visite pas"],
      pairs: [
        { en: "I don't visit", tokenIndex: 0 },
        { en: "you don't visit", tokenIndex: 1 },
        { en: "he doesn't visit", tokenIndex: 2 },
        { en: "we don't visit", tokenIndex: 3 },
      ],
      audioText: "je ne visite pas, tu ne visites pas, il ne visite pas, on ne visite pas",
      revealNote: "«ne visite pas» — consonant start, no squeeze, same as «ne parle pas».",
    },
    vocabTextMcq("fr-m15-6-mcq-nevisitepas", "visite", ["habite", "aime", "parle"], 'Which word means "visit(s)"?'),
    build(
      "fr-m15-6-build-jenevisitepas",
      "Build: 'I don't visit the hotel'",
      "je ne visite pas l'hôtel",
      ["je ne visite pas", "l'hôtel", "la halle", "tu ne visites pas"],
      ["je ne visite pas", "l'hôtel"],
    ),
    listeningCompSentence({
      id: "fr-m15-6-lc-tunevisitepas",
      audioText: "tu ne visites pas l'école",
      correctMeaningEn: "You don't visit the school.",
      distractorsEn: ["You visit the school.", "You don't visit the train station.", "I don't visit the school."],
    }),
    speaking("fr-m15-6-speak-tunevisitepas", "tu ne visites pas l'école", "you don't visit the school", ["visite"]),
    cloze(
      "fr-m15-6-cloze-nevisite",
      "il",
      "visite pas la halle",
      "ne",
      ["ne", "n'a"],
      "he doesn't visit the covered market",
      "il ne visite pas la halle",
      "«il ne visite pas» — «ne» stays whole before a consonant, unlike «n'a».",
    ),
    build(
      "fr-m15-6-build-onnevisitepas",
      "Build: 'we don't visit the park'",
      "on ne visite pas le parc",
      ["on", "ne", "visite", "pas", "le parc", "la gare"],
      ["on", "ne", "visite", "pas", "le parc"],
    ),
    listeningCompSentence({
      id: "fr-m15-6-lc-onnevisitepas",
      audioText: "on ne visite pas le parc",
      correctMeaningEn: "We don't visit the park.",
      distractorsEn: ["We visit the park.", "They don't visit the park.", "We don't visit the museum."],
    }),
    speaking("fr-m15-6-speak-recall-ilneparle", "il ne parle pas", "he doesn't speak", [], "recall"),
    build(
      "fr-m15-6-build-ellenevisitepas",
      "Build: 'she doesn't visit the train station this morning'",
      "elle ne visite pas la gare ce matin",
      ["elle", "ne", "visite", "pas", "la gare", "ce matin", "il"],
      ["elle", "ne", "visite", "pas", "la gare", "ce matin"],
    ),
    {
      id: "fr-m15-6-sim-negation",
      type: "dialogue_sim",
      scene: { emoji: "🙅", title: "Who's visiting?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tuvisites",
          npc: {
            speaker: "Marie",
            kana: "Tu visites la gare ?",
            audioText: "tu visites la gare ?",
            gloss: "Are you visiting the train station?",
          },
          goal: "Say no, you don't visit the train station.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, je ne visite pas la gare" },
              { id: "wrong-yes", text: "oui, je visite la gare" },
              { id: "wrong-who", text: "non, il ne visite pas la gare" },
            ],
            correctOptionId: "correct",
            audioText: "non, je ne visite pas la gare",
          },
          replyGloss: "No, I don't visit the train station.",
        },
        {
          id: "t2-il",
          npc: {
            speaker: "Marie",
            kana: "Et Thomas ?",
            audioText: "et thomas ?",
            gloss: "And Thomas?",
          },
          goal: "Say he doesn't either.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il ne visite pas non plus" },
              { id: "wrong-yes", text: "il visite" },
              { id: "wrong-form", text: "il ne visite" },
            ],
            correctOptionId: "correct",
            audioText: "il ne visite pas non plus",
          },
          replyGloss: "He doesn't either.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m15-6", [
      ["visiter", "to visit"],
      ["visite", "visit(s)"],
      ["visité", "visited"],
      ["en ville", "in town"],
      ["halle", "covered market"],
      ["hôtel", "hotel"],
    ]),
  ];
}

/** L7 — «Je n'ai pas visité»: negated past reuses m14's «je n'ai pas» / «tu
 *  n'as pas» / «n'a» atoms plus this module's own «visité» — no new atoms.
 *  Ne-drop debuts here, confined to dialogue_sim NPC lines / options. */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m15-7-info-pasvisite",
      "Je n'ai pas visité",
      "The past negation you already know from «je n'ai pas mangé» works here too: «je n'ai pas visité», «il n'a pas visité». Same machine, new verb.",
    ),
    {
      id: "fr-m15-7-map-pasvisite",
      type: "word_map",
      tokens: ["je n'ai pas visité", "tu n'as pas visité", "il n'a pas visité", "pas encore"],
      pairs: [
        { en: "I haven't visited", tokenIndex: 0 },
        { en: "you haven't visited", tokenIndex: 1 },
        { en: "he hasn't visited", tokenIndex: 2 },
        { en: "not yet", tokenIndex: 3 },
      ],
      audioText: "je n'ai pas visité, tu n'as pas visité, il n'a pas visité, pas encore",
      revealNote: "«n'ai pas» / «n'as pas» / «n'a pas» — the same frozen forms, new participle.",
    },
    vocabTextMcq("fr-m15-7-mcq-jenaipasvisite", "je n'ai pas", ["j'ai", "tu n'as pas", "je n'aime pas"]),
    build(
      "fr-m15-7-build-jenaipasvisite",
      "Build: 'I haven't visited the hotel'",
      "je n'ai pas visité l'hôtel",
      ["je n'ai pas", "visité", "l'hôtel", "tu n'as pas"],
      ["je n'ai pas", "visité", "l'hôtel"],
    ),
    listeningCompSentence({
      id: "fr-m15-7-lc-tunaspasvisite",
      audioText: "tu n'as pas visité la halle ce matin",
      correctMeaningEn: "You haven't visited the covered market this morning.",
      distractorsEn: ["You visited the covered market this morning.", "You haven't visited the covered market last night.", "I haven't visited the covered market this morning."],
    }),
    speaking("fr-m15-7-speak-tunaspasvisite", "tu n'as pas visité la halle", "you haven't visited the covered market", ["tu n'as pas", "visité", "halle"]),
    cloze(
      "fr-m15-7-cloze-napasvisite",
      "il",
      "pas visité",
      "n'a",
      ["n'a", "a"],
      "he hasn't visited",
      "il n'a pas visité",
      "«il n'a pas visité» — «a» shrinks to «n'a» before a vowel, the same rule as «n'aime».",
    ),
    build(
      "fr-m15-7-build-ilnapasvisite",
      "Build: 'he hasn't visited yet'",
      "il n'a pas encore visité",
      ["il", "n'a", "pas encore", "visité", "elle", "a"],
      ["il", "n'a", "pas encore", "visité"],
    ),
    listeningCompSentence({
      id: "fr-m15-7-lc-ilnapasvisite",
      audioText: "il n'a pas encore visité le musée",
      correctMeaningEn: "He hasn't visited the museum yet.",
      distractorsEn: ["He already visited the museum.", "She hasn't visited the museum yet.", "He hasn't visited the museum."],
    }),
    speaking("fr-m15-7-speak-recall-tunaspasmange", "tu n'as pas mangé hier soir", "you didn't eat last night", [], "recall"),
    build(
      "fr-m15-7-build-ellenapasvisite",
      "Build: 'she hasn't visited the school this morning'",
      "elle n'a pas visité l'école ce matin",
      ["elle", "n'a", "pas", "visité", "l'école", "ce matin", "il"],
      ["elle", "n'a", "pas", "visité", "l'école", "ce matin"],
    ),
    {
      id: "fr-m15-7-sim-negation",
      type: "dialogue_sim",
      scene: { emoji: "🙅", title: "Who visited?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tuasvisite",
          npc: {
            speaker: "Marie",
            kana: "Tu as visité la halle ?",
            audioText: "tu as visité la halle ?",
            gloss: "Did you visit the covered market?",
          },
          goal: "Say no, not yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, j'ai pas encore visité" },
              { id: "also-correct", text: "non, je n'ai pas encore visité" },
              { id: "wrong-yes", text: "oui, j'ai déjà visité" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "non, j'ai pas encore visité",
          },
          replyGloss: "No, not yet.",
        },
        {
          id: "t2-moinonplus",
          npc: {
            speaker: "Marie",
            kana: "Ah, moi non plus, j'ai pas encore visité l'hôtel.",
            audioText: "ah, moi non plus, j'ai pas encore visité l'hôtel",
            gloss: "Ah, me neither, I haven't visited the hotel.",
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
    matchPairs("fr-m15-7", ["je n'ai pas", "tu n'as pas", "visité", "visiter", "pas encore", "déjà"]),
  ];
}

/** L8 — checkpoint: zero new atoms, all graded, mirroring m14 L8's own
 *  shape (a transfer-test build combines the taught atoms in a fresh
 *  sentence the course has never printed verbatim before). */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m15-8-lc-1",
      audioText: "j'ai visité la halle hier soir",
      correctMeaningEn: "I visited the covered market last night.",
      distractorsEn: ["I visited the covered market this morning.", "I'm visiting the covered market tonight.", "I visited the hotel last night."],
    }),
    cloze(
      "fr-m15-8-cloze-1",
      "elle",
      "pas visité ce matin",
      "n'a",
      ["n'a", "a"],
      "she hasn't visited this morning",
      "elle n'a pas visité ce matin",
    ),
    speaking("fr-m15-8-speak-jaidejavisite", "j'ai déjà visité la halle", "I already visited the covered market", []),
    sentenceMcq({
      id: "fr-m15-8-smcq-1",
      prompt: "'In town' — pick the French.",
      correctText: "en ville",
      distractorsText: ["la ville", "à la halle", "hier soir"],
    }),
    build(
      "fr-m15-8-build-1",
      "Build: 'you haven't visited the museum yet'",
      "tu n'as pas encore visité le musée",
      ["tu n'as pas", "encore", "visité", "le musée", "déjà"],
      ["tu n'as pas", "encore", "visité", "le musée"],
    ),
    listeningCompSentence({
      id: "fr-m15-8-lc-2",
      audioText: "on ne visite pas la gare",
      correctMeaningEn: "We don't visit the train station.",
      distractorsEn: ["We visit the train station.", "They don't visit the train station.", "We don't visit the museum."],
    }),
    cloze(
      "fr-m15-8-cloze-2",
      "il ne",
      "pas la halle",
      "visite",
      ["visite", "visité"],
      "he doesn't visit the covered market",
      "il ne visite pas la halle",
    ),
    speaking("fr-m15-8-speak-recall-cestlundi", "c'est lundi", "it's Monday", [], "recall"),
    sentenceMcq({
      id: "fr-m15-8-smcq-2",
      prompt: "'The covered market' — pick the French.",
      correctText: "la halle",
      distractorsText: ["l'halle", "l'hôtel", "la gare"],
    }),
    build(
      "fr-m15-8-build-transfer",
      "Build: 'she hasn't visited the park yet this morning'",
      "elle n'a pas encore visité le parc ce matin",
      ["elle", "n'a", "pas encore", "visité", "le parc", "ce matin", "il"],
      ["elle", "n'a", "pas encore", "visité", "le parc", "ce matin"],
    ),
    listeningCompSentence({
      id: "fr-m15-8-lc-3",
      audioText: "mon frère a visité le parc, et ma sœur n'a pas encore visité",
      correctMeaningEn: "My brother visited the park, and my sister hasn't visited yet.",
      distractorsEn: [
        "My brother and sister already visited.",
        "My sister visited, and my brother hasn't visited yet.",
        "My brother hasn't visited yet.",
      ],
    }),
    build(
      "fr-m15-8-build-2",
      "Build: 'you visited the covered market last night'",
      "tu as visité la halle hier soir",
      ["tu as", "visité", "la halle", "hier soir", "ce matin"],
      ["tu as", "visité", "la halle", "hier soir"],
    ),
    {
      id: "fr-m15-8-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p-0", source: "visité", target: "visited" },
        { id: "p-1", source: "visiter", target: "to visit" },
        { id: "p-2", source: "visite", target: "visit(s)" },
        { id: "p-3", source: "en ville", target: "in town" },
        { id: "p-4", source: "halle", target: "covered market" },
        { id: "p-5", source: "hier soir", target: "last night" },
      ],
    },
  ];
}

/** L9 — integration: no new atoms; one big dialogue_sim tail; the whole
 *  machine (present, past, negation) in one tour scene; three cross-module
 *  recalls. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m15-9-map-tour",
      type: "word_map",
      tokens: ["on visite", "on a visité", "déjà visité", "pas encore visité"],
      pairs: [
        { en: "we visit", tokenIndex: 0 },
        { en: "we visited", tokenIndex: 1 },
        { en: "already visited", tokenIndex: 2 },
        { en: "not yet visited", tokenIndex: 3 },
      ],
      audioText: "on visite, on a visité, déjà visité, pas encore visité",
      revealNote: "Everything so far, one tour of the town.",
    },
    vocabTextMcq("fr-m15-9-mcq-visite", "visité", ["visiter", "visite", "mangé"], 'Which word means "visited"?'),
    build(
      "fr-m15-9-build-jaidejavisite",
      "Build: 'I already visited the covered market'",
      "j'ai déjà visité la halle",
      ["j'ai", "déjà", "visité", "la halle", "mangé"],
      ["j'ai", "déjà", "visité", "la halle"],
    ),
    listeningCompSentence({
      id: "fr-m15-9-lc-tuasvisite",
      audioText: "tu as visité l'hôtel hier soir",
      correctMeaningEn: "You visited the hotel last night.",
      distractorsEn: ["You visited the hotel this morning.", "I visited the hotel last night.", "You visited the covered market last night."],
    }),
    speaking("fr-m15-9-speak-jaivisite", "j'ai visité la ville hier soir", "I visited the town last night", ["visité", "hier soir"]),
    cloze(
      "fr-m15-9-cloze-visite",
      "il a déjà",
      "le musée",
      "visité",
      ["visité", "mangé"],
      "he already visited the museum",
      "il a déjà visité le musée",
      "«il a déjà visité» — the same machine, a third verb.",
    ),
    build(
      "fr-m15-9-build-tudejavisite",
      "Build: 'did you already visit the park?'",
      "tu as déjà visité le parc ?",
      ["tu as", "déjà", "visité le parc ?", "mangé ?"],
      ["tu as", "déjà", "visité le parc ?"],
    ),
    sentenceMcq({
      id: "fr-m15-9-smcq-visite",
      prompt: "'I visited' — pick the French.",
      correctText: "j'ai visité",
      distractorsText: ["j'ai visiter", "je visite", "tu as visité"],
    }),
    speaking("fr-m15-9-speak-recall-cinema", "je vais au cinéma", "I'm going to the movies", [], "recall"),
    listeningCompSentence({
      id: "fr-m15-9-lc-review",
      audioText: "elle n'a pas encore visité la halle, mais elle a déjà visité le musée",
      correctMeaningEn: "She hasn't visited the covered market yet, but she already visited the museum.",
      distractorsEn: ["She already visited both places.", "She hasn't visited either place yet.", "She visited the museum, but not the covered market, yesterday."],
    }),
    speaking("fr-m15-9-speak-recall-moiaussi", "moi aussi", "me too", [], "recall"),
    build(
      "fr-m15-9-build-ellevisite",
      "Build: 'she already visited the covered market'",
      "elle a déjà visité la halle",
      ["elle", "a", "déjà", "visité", "la halle", "il"],
      ["elle", "a", "déjà", "visité", "la halle"],
    ),
    matchPairs("fr-m15-9", ["visiter", "visite", "visité", "en ville", "halle", "déjà"]),
    {
      id: "fr-m15-9-sim-tourdelaville",
      type: "dialogue_sim",
      scene: { emoji: "🗺️", title: "Tour of the town" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-onvisite",
          npc: {
            speaker: "Chloé",
            kana: "On visite la ville aujourd'hui ?",
            audioText: "on visite la ville aujourd'hui ?",
            gloss: "Are we visiting the town today?",
          },
          goal: "Say yes, you already visited the market.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et j'ai déjà visité la halle" },
              { id: "wrong-no", text: "non, pas encore" },
              { id: "wrong-tense", text: "oui, et je visite la halle" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et j'ai déjà visité la halle",
          },
          replyGloss: "Yes, and I already visited the covered market.",
        },
        {
          id: "t2-frere",
          npc: {
            speaker: "Chloé",
            kana: "Et ton frère, il a visité le musée ?",
            audioText: "et ton frère, il a visité le musée ?",
            gloss: "And your brother, did he visit the museum?",
          },
          goal: "Say no, he hasn't visited yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, il a pas encore visité" },
              { id: "also-correct", text: "non, il n'a pas encore visité" },
              { id: "wrong-yes", text: "oui, il a déjà visité" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "non, il a pas encore visité",
          },
          replyGloss: "No, he hasn't visited yet.",
        },
        {
          id: "t3-lea",
          npc: {
            speaker: "Chloé",
            kana: "Et Léa, elle a visité la gare hier soir ?",
            audioText: "et léa, elle a visité la gare hier soir ?",
            gloss: "And Léa, did she visit the train station last night?",
          },
          goal: "Say yes, me too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, moi aussi" },
              { id: "wrong-no", text: "non, moi non plus" },
              { id: "wrong-tense", text: "oui, elle visite" },
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
 *  dialogue_sim, closing on a soft m16 tease using only already-taught
 *  words. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m15-10-lc-1",
      audioText: "j'ai déjà visité la halle ce matin",
      correctMeaningEn: "I already visited the covered market this morning.",
      distractorsEn: ["I haven't visited the covered market this morning.", "I already visited the covered market last night.", "I'm visiting the covered market this morning."],
    }),
    cloze(
      "fr-m15-10-cloze-1",
      "elle",
      "pas encore visité",
      "n'a",
      ["n'a", "a"],
      "she hasn't visited yet",
      "elle n'a pas encore visité",
    ),
    speaking("fr-m15-10-speak-recall-tunaspas", "tu n'as pas mangé hier soir", "you didn't eat last night", [], "recall"),
    sentenceMcq({
      id: "fr-m15-10-smcq-1",
      prompt: "'To visit' — pick the French.",
      correctText: "visiter",
      distractorsText: ["visite", "visité", "habiter"],
    }),
    build(
      "fr-m15-10-build-1",
      "Build: 'I haven't visited yet'",
      "je n'ai pas encore visité",
      ["je n'ai pas", "encore", "visité", "déjà"],
      ["je n'ai pas", "encore", "visité"],
    ),
    listeningCompSentence({
      id: "fr-m15-10-lc-2",
      audioText: "mon frère a visité la halle hier soir",
      correctMeaningEn: "My brother visited the covered market last night.",
      distractorsEn: ["My sister visited the covered market last night.", "My brother visited the covered market this morning.", "My brother hasn't visited the covered market."],
    }),
    speaking("fr-m15-10-speak-fresh", "j'ai déjà visité la ville ce matin", "I already visited the town this morning", ["déjà", "visité", "ce matin"]),
    vocabTextMcq("fr-m15-10-mcq-visite", "visite", ["visité", "visiter", "mangé"], 'Which word means "visit(s)"?'),
    build(
      "fr-m15-10-build-2",
      "Build: 'he visited the park yesterday'",
      "il a visité le parc hier",
      ["il", "a", "visité", "le parc", "hier", "elle"],
      ["il", "a", "visité", "le parc", "hier"],
    ),
    speaking("fr-m15-10-speak-recall-cher", "c'est cher", "it's expensive", [], "recall"),
    {
      id: "fr-m15-10-sim-soiree",
      type: "dialogue_sim",
      scene: { emoji: "🌆", title: "Catching up" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-visitecematin",
          npc: {
            speaker: "Marie",
            kana: "Tu as visité la halle ce matin ?",
            audioText: "tu as visité la halle ce matin ?",
            gloss: "Did you visit the covered market this morning?",
          },
          goal: "Say yes, you already visited it.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, j'ai déjà visité" },
              { id: "wrong-no", text: "non, je n'ai pas encore visité" },
              { id: "wrong-tense", text: "oui, je visite" },
            ],
            correctOptionId: "correct",
            audioText: "oui, j'ai déjà visité",
          },
          replyGloss: "Yes, I already visited it.",
        },
        {
          id: "t2-musee",
          npc: {
            speaker: "Marie",
            kana: "Et le musée, hier soir ?",
            audioText: "et le musée, hier soir ?",
            gloss: "And the museum, last night?",
          },
          goal: "Say no, not yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, pas encore" },
              { id: "wrong-yes", text: "oui, déjà" },
              { id: "wrong-visite", text: "non, je n'ai pas visité" },
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

const FR_M15_1: LessonContent = {
  id: "fr-m15-1",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "En ville",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M15_2: LessonContent = {
  id: "fr-m15-2",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La halle",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M15_3: LessonContent = {
  id: "fr-m15-3",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "On révise",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M15_4: LessonContent = {
  id: "fr-m15-4",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il visite",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M15_5: LessonContent = {
  id: "fr-m15-5",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Mon frère a visité",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M15_6: LessonContent = {
  id: "fr-m15-6",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "On ne visite pas",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M15_7: LessonContent = {
  id: "fr-m15-7",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je n'ai pas visité",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M15_8: LessonContent = {
  id: "fr-m15-8",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · La visite",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M15_9: LessonContent = {
  id: "fr-m15-9",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Tour of the town",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M15_10: LessonContent = {
  id: "fr-m15-10",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Catching up",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M15_MODULE: FrModuleDef = {
  title: "La visite",
  eyebrow: "Module 15",
  summary:
    "A grand tour of everything: extend the avoir + participle machine to a third verb, visiter, and pick up en ville and an h-aspiré contrast along the way.",
  lessons: [
    FR_M15_1,
    FR_M15_2,
    FR_M15_3,
    FR_M15_4,
    FR_M15_5,
    FR_M15_6,
    FR_M15_7,
    FR_M15_8,
    FR_M15_9,
    FR_M15_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M15_CHECKPOINT_INDEX = 8;

export const FR_M15_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m15-s",
    moduleId: "m15",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m15-s",
        prompt: "'I visited' — pick the French.",
        correctText: "j'ai visité",
        distractorsText: ["j'ai visiter", "je visite", "tu as visité"],
      }),
  },
  {
    id: "pt-fr-m15-1",
    moduleId: "m15",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m15-1",
        prompt: "'The covered market' — pick the French.",
        correctText: "la halle",
        distractorsText: ["l'halle", "l'hôtel", "la gare"],
      }),
  },
  {
    id: "pt-fr-m15-2",
    moduleId: "m15",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m15-2",
        prompt: "'He visits' — pick the French.",
        correctText: "il visite",
        distractorsText: ["il a visité", "elle visite", "il visité"],
      }),
  },
  {
    id: "pt-fr-m15-3",
    moduleId: "m15",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m15-3",
        prompt: "'He hasn't visited' — pick the French.",
        correctText: "il n'a pas visité",
        distractorsText: ["il a visité", "elle n'a pas visité", "tu n'as pas visité"],
      }),
  },
  {
    id: "pt-fr-m15-4",
    moduleId: "m15",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m15-4",
        prompt: "'In town' — pick the French.",
        correctText: "en ville",
        distractorsText: ["la ville", "à la halle", "hier soir"],
      }),
  },
];
