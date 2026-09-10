/**
 * m16.ts — «Allé, allée» — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m16-brief-2026-09-10.md: the passé
 * composé machine's SECOND auxiliary. The learner already owns "avoir chunk
 * + participle = a completed action" (m14, extended m15); this module
 * reveals that a small, closed family of motion verbs — aller, venir — use
 * être instead, and that the participle now AGREES with the subject like an
 * adjective (m9's grand/grande pattern) rather than staying frozen like
 * avoir's participles do. The whole teaching claim: the SAME verb form the
 * learner has used since m2 for identity («je suis Léa») now does a second,
 * unrelated job (event report, «je suis allé»), and this time the agreement
 * it carries is invisible in speech.
 *
 * SCOPE DECISIONS (brief §7, executed not re-litigated):
 *   - Verbs: `aller` + `venir` are core (given). `arriver`/`arrivé`/
 *     `arrivée` (the brief's ONE optional stretch pair) is CUT — same
 *     "coverage, not volume" discipline m15 used to cut content/contente:
 *     this module already carries two new subsystems (a second auxiliary,
 *     the course's first SILENT gender-agreement pair) and a third verb
 *     would dilute both without a unique thematic payoff. `partir`/`rester`
 *     stay REJECTED per the brief (§7.2) — no re-litigation needed.
 *   - `aller` (bare infinitive) and `allé` (masc. participle) are a pure
 *     written-only homophone PAIR OF DIFFERENT WORDS — [ale] either way,
 *     same law as m14's manger/mangé and m15's visiter/visité: no
 *     `homophoneKey` (that machinery is for ONE word's own forms, not two
 *     different words sharing a sound); instead this module carries its own
 *     bespoke pin (m16.test.ts) confirming aller/allé are never co-presented
 *     in an audio-bearing bank, the exact technique m14/m15 used.
 *   - `allé`/`allée` DO share `homophoneKey: "ale"` — this is the SAME word
 *     (the participle) varying only by gender agreement, the course's first
 *     SILENT gender pair (m9's grand/grande is gender agreement too, but
 *     AUDIBLE, so it carries no homophoneKey at all — a real sound
 *     difference needs no guard). Because `agreementChain()` hard-fails
 *     (`failOnHomophoneDistractor`) whenever `audioText` is set and two
 *     slot options share a `homophoneKey`, this module's two agreement_chain
 *     steps (L2, L5) are written-only by construction — omitting `audioText`
 *     is not a style choice, it's what makes the factory itself refuse to
 *     ship an audio-graded gender guess.
 *   - `venir` carries NO `homophoneKey` — its participle `venu` is
 *     IRREGULAR (not the expected -ir→-i pattern), so `venir` and `venu` do
 *     NOT sound alike ([vəniʁ] vs [vəny]); there is no homophone risk to
 *     guard between the infinitive and the participle here, unlike aller.
 *   - `venu`/`venue` DO share `homophoneKey: "vəny"` — same class as
 *     allé/allée, the module's SECOND silent gender pair.
 *   - No `speaking()` step in this module EVER targets a feminine
 *     participle («allée»/«venue»). Feminine agreement is taught and graded
 *     exclusively through WRITTEN mechanisms: `cloze()` and `sentenceMcq()`
 *     (no homophone check exists in either factory — confirmed by reading
 *     `grammarHelpers.ts`), `agreementChain()` without `audioText`, and
 *     `build()` tile banks that carry an unused gendered decoy tile (also
 *     unchecked for homophones — `build()`'s only guard is elision, not
 *     homophones). `dialogue_sim` reply OPTIONS that show a wrong-gender
 *     spelling are safe on the same logic: only the CORRECT option's text
 *     is ever voiced (`reply.audioText`), so a wrong-gender option sits
 *     there as pure reading/spelling discrimination, never an ear test.
 *     This resolves the brief's §7.5 open question ("self-referential je/tu
 *     gender grading") — production/spoken steps stay masculine-default
 *     (named male cast: Thomas, Hugo) or third-person named-female
 *     recognition-only; no anonymous "je" position is ever graded on a
 *     choice the course cannot hear.
 *   - «tu n'es pas» gets its first-ever LIVE exercise in this module (L6),
 *     flagged per the brief §7.6 — architecturally free (bare vowel-onset
 *     «es» elides for free, `FR_FUNCTION_WORDS` already lists «n'est» as
 *     pre-authorized chrome) but textually novel; L6's own cloze step is
 *     the exact first live sentence, verified by this module's own test pin.
 *   - «avec» is used freely (L3, L5, L9 interleave beats) though never
 *     registered as its own atom anywhere in the course — confirmed safe:
 *     `FR_FUNCTION_WORDS` (moduleBarGuards.ts) already lists it as
 *     pre-authorized chrome, exactly like «et», «où», «très». No atom
 *     registration needed; the comprehensibility gate accepts it as-is.
 *   - «venir de» (origin — «je suis venu de Paris») reuses m2's already-
 *     taught «de» in its origin sense only, per the brief §5 — never let it
 *     read as licensing the still-deferred partitive «du»/«de la».
 *   - Negation composes for FREE around already-bare être forms (m13's
 *     proven ne…pas frame) — zero new atoms for L6's debut. «je ne suis
 *     pas», «il n'est pas», «elle n'est pas» were all live-proven in m13;
 *     only «tu n'es pas» is genuinely new TEXT (not new MECHANISM).
 *   - Ne-drop is authored ONLY inside `dialogue_sim` NPC lines / choice
 *     reply OPTIONS, from L7 onward — same law m13/m14/m15 set, unchanged.
 *   - L10's tease is deliberately generic — the playbook §8 arc registry
 *     names no m17 thesis (brief §4 L10), so this module invents none: "et
 *     demain, tu vas où ?" / "je ne sais pas encore" gestures at more
 *     story using only already-taught forms (m13's «je ne sais pas»), the
 *     same technique m13→m14→m15 used at their own mastery closes.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   Hugo/Thomas est allé... L1-L7 (masculine-only spoken production
 *   throughout, per the no-audio-gender-grading rule above) — printed
 *   targets across L1-L10 (see per-lesson comments below for the exact set).
 *   recalls: je vais au cinéma L1 (m5) · je suis Léa L2 (m2) · moi aussi L3
 *   (m3) · j'ai un frère L4 (m7) · il ne parle pas L5 (m13) · je ne
 *   comprends pas L6 (m2) · j'ai mangé un croissant hier L7 (m14) · c'est
 *   lundi L8 (m8) · tu vas où ? + elle est très grande L9 (m5, m9) · tu n'as
 *   pas mangé hier soir L10 (m14) — 11 recalls, all tracing to a prior
 *   module, comfortably over the ≥8 floor, with L9 carrying 2-3 that reach
 *   further back than m14/m15 (m5, m9) as the brief's §4 L9 requires.
 *
 * Cast: Thomas, Hugo (male, masculine-safe spoken production); Léa, Chloé,
 *   Marie (female, written-only agreement contrast); a L9 integration
 *   lesson debuting no new atoms, one big two-NPC dialogue_sim narrating who
 *   went where and who came when; a L10 mastery sim mixing avoir- and
 *   être-participles in the same narration, closing on a soft, unnamed
 *   tease for whatever comes next.
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
  agreementChain,
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
 * module files in LEXICOGRAPHIC order — m16.ts's own module-level lesson-
 * building code runs BEFORE m2.ts–m9.ts register their atoms into the
 * shared surface registry (m1/m10–m15 sort before m16 and are safe; m2–m9
 * do not exist yet from m16's vantage point). vocabTextMcq() (and
 * matchPairs()) call resolveSurfaceGloss()/findFrAtomBySurface() and throw
 * hard if unregistered. Same landmine + same fix m11.ts/m14.ts/m15.ts
 * document in full — used here for m16's place-noun / pronoun review
 * (m4/m2-sourced).
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

export const FR_M16_ATOMS: FrAtom[] = [
  atom({ surface: "aller", meaningEn: "to go", partOfSpeech: "verb", fromModule: "m16", kind: "vocab", hint: "ah-LAY — bare infinitive; sounds IDENTICAL to its own participle «allé» (regular -er→-é, same as manger/mangé, visiter/visité) — no homophoneKey needed, that machinery pairs one word's own forms, not two different words; see the module header for the bespoke test pin instead" }),
  atom({ surface: "allé", meaningEn: "went / gone (m)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab", homophoneKey: "ale", hint: "ah-LAY — past participle, masculine; [ale] either way against «allée» — the course's first SILENT gender pair, never graded by ear" }),
  atom({ surface: "allée", meaningEn: "went / gone (f)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab", homophoneKey: "ale", hint: "same sound as «allé» — only the spelling agrees with a feminine subject" }),
  atom({ surface: "venir", meaningEn: "to come", partOfSpeech: "verb", fromModule: "m16", kind: "vocab", hint: "vuh-NEER — bare infinitive; a genuinely new verb, no present-tense chunk to lean on (unlike aller's je vais / tu vas / on va)" }),
  atom({ surface: "venu", meaningEn: "came (m)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab", homophoneKey: "vəny", hint: "vuh-NU — IRREGULAR participle, not the -ir→-i pattern; does NOT rhyme with «venir»" }),
  atom({ surface: "venue", meaningEn: "came (f)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab", homophoneKey: "vəny", hint: "same sound as «venu» — [vəny] either way; the module's second silent gender pair" }),
];

/** L1 — «Je suis... allé»: the bridge card (identity → adjective → event),
 *  debuts «aller»/«allé», masculine-only spoken production. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m16-1-info-bridge",
      "Je suis... allé",
      "«Je suis Léa» — who you are. «Il est grand» — what's true. «Je suis allé» — what happened. Same verb, a new job: reporting where you've been.",
    ),
    {
      id: "fr-m16-1-map-aller",
      type: "word_map",
      tokens: ["aller", "allé", "je suis allé", "tu es allé"],
      pairs: [
        { en: "to go", tokenIndex: 0 },
        { en: "went / gone", tokenIndex: 1 },
        { en: "I went", tokenIndex: 2 },
        { en: "you went", tokenIndex: 3 },
      ],
      audioText: "aller, allé, je suis allé, tu es allé",
      revealNote: "«allé» — regular -er→-é, the same pattern as mangé, visité.",
    },
    vocabTextMcq("fr-m16-1-mcq-aller", "aller", ["manger", "visiter", "parler"], 'Which word means "to go"?'),
    cloze(
      "fr-m16-1-cloze-voudraisaller",
      "je voudrais",
      "au musée",
      "aller",
      ["aller", "manger"],
      "I would like to go to the museum",
      "je voudrais aller au musée",
      "«aller» stays bare after «je voudrais» — no conjugation on the second verb.",
    ),
    build(
      "fr-m16-1-build-jesuisallemusee",
      "Build: 'I went to the museum'",
      "je suis allé au musée",
      ["je suis allé", "au musée", "à la gare"],
      ["je suis allé", "au musée"],
    ),
    listeningCompSentence({
      id: "fr-m16-1-lc-tuesallegare",
      audioText: "tu es allé à la gare",
      correctMeaningEn: "You went to the train station.",
      distractorsEn: ["You're going to the train station.", "You went to the museum.", "I went to the train station."],
    }),
    speaking("fr-m16-1-speak-thomasparc", "Thomas est allé au parc", "Thomas went to the park", ["est", "allé"]),
    cloze(
      "fr-m16-1-cloze-ilestalle",
      "",
      "est allé à la gare",
      "il",
      ["il", "elle"],
      "he went to the train station",
      "il est allé à la gare",
      "«il est allé» — masculine subject, matching «allé», the same pattern as «il est grand».",
    ),
    build(
      "fr-m16-1-build-hugoecole",
      "Build: 'Hugo went to the school'",
      "Hugo est allé à l'école",
      ["Hugo", "est", "allé", "à l'école", "au musée"],
      ["Hugo", "est", "allé", "à l'école"],
    ),
    sentenceMcq({
      id: "fr-m16-1-smcq-alle",
      prompt: "'went / gone (masculine)' — pick the French.",
      correctText: "allé",
      distractorsText: ["aller", "mangé", "visité"],
    }),
    speaking("fr-m16-1-speak-recall-cinema", "je vais au cinéma", "I'm going to the movies", [], "recall"),
    {
      id: "fr-m16-1-sim-oualle",
      type: "dialogue_sim",
      scene: { emoji: "🚶", title: "Where did they go?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-thomasmusee",
          npc: {
            speaker: "Léa",
            kana: "Thomas est allé au musée ?",
            audioText: "thomas est allé au musée ?",
            gloss: "Did Thomas go to the museum?",
          },
          goal: "Say yes, and Hugo went to the park.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et Hugo est allé au parc" },
              { id: "wrong-place", text: "non, il est allé à la gare" },
              { id: "wrong-verb", text: "oui, et il a mangé" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et hugo est allé au parc",
          },
          replyGloss: "Yes, and Hugo went to the park.",
        },
        {
          id: "t2-toi",
          npc: {
            speaker: "Léa",
            kana: "Et toi, tu es allé où ?",
            audioText: "et toi, tu es allé où ?",
            gloss: "And you, where did you go?",
          },
          goal: "Say you went to the school.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je suis allé à l'école" },
              { id: "wrong-place", text: "je suis allé au musée" },
              { id: "wrong-verb", text: "j'ai mangé à l'école" },
            ],
            correctOptionId: "correct",
            audioText: "je suis allé à l'école",
          },
          replyGloss: "I went to the school.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m16-1", [
      ["aller", "to go"],
      ["allé", "went / gone"],
      ["musée", "museum"],
      ["gare", "train station"],
      ["école", "school"],
      ["parc", "park"],
    ]),
  ];
}

/** L2 — «Il est allé, elle est allée»: debuts «allée», the course's first
 *  SILENT gender pair, explicit contrast against m9's audible grand/grande,
 *  agreement_chain debut (written-only). */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m16-2-info-allee",
      "Il est allé, elle est allée",
      "«Il est allé» / «elle est allée» — same sound, ah-LAY either way. Only the spelling agrees, unlike «il est grand» / «elle est grande», which you can actually hear.",
    ),
    {
      id: "fr-m16-2-map-allee",
      type: "word_map",
      tokens: ["il est allé", "elle est allée", "il est grand", "elle est grande"],
      pairs: [
        { en: "he went", tokenIndex: 0 },
        { en: "she went", tokenIndex: 1 },
        { en: "he is tall", tokenIndex: 2 },
        { en: "she is tall", tokenIndex: 3 },
      ],
      audioText: "il est allé, elle est allée, il est grand, elle est grande",
      revealNote: "The first pair sounds identical. The second doesn't. Both still agree — one silently.",
    },
    vocabTextMcq("fr-m16-2-mcq-allee", "allée", ["allé", "aller", "visité"], 'Which word means "went / gone" (feminine)?'),
    build(
      "fr-m16-2-build-elleallemusee",
      "Build: 'she went to the museum'",
      "elle est allée au musée",
      ["elle", "est", "allée", "au musée", "à la gare"],
      ["elle", "est", "allée", "au musée"],
    ),
    listeningCompSentence({
      id: "fr-m16-2-lc-leaallegare",
      audioText: "Léa est allée à la gare",
      correctMeaningEn: "Léa went to the train station.",
      distractorsEn: ["Léa is going to the train station.", "Thomas went to the train station.", "Léa went to the museum."],
    }),
    speaking("fr-m16-2-speak-hugomusee", "Hugo est allé au musée", "Hugo went to the museum", ["est", "allé"]),
    agreementChain({
      id: "fr-m16-2-chain-allee",
      prompt: "Dress the sentence to match «Léa».",
      head: { surface: "Léa", meaningEn: "Léa", featureLabel: "pink-f" },
      tokens: [
        { kind: "slot", id: "s-pro", options: ["il", "elle"], correct: "elle", roleLabel: "feminine subject" },
        { kind: "fixed", text: "est" },
        { kind: "slot", id: "s-part", options: ["allé", "allée"], correct: "allée", roleLabel: "feminine participle" },
        { kind: "fixed", text: "au musée" },
      ],
      meaningEn: "Léa went to the museum",
      ruleNote: "Same sound, ah-LAY either way — only the spelling agrees, never the sound.",
    }),
    build(
      "fr-m16-2-build-thomasecole",
      "Build: 'Thomas went to school'",
      "Thomas est allé à l'école",
      ["Thomas", "est", "allé", "allée", "à l'école"],
      ["Thomas", "est", "allé", "à l'école"],
    ),
    sentenceMcq({
      id: "fr-m16-2-smcq-allee",
      prompt: "'went / gone (feminine)' — pick the French.",
      correctText: "allée",
      distractorsText: ["allé", "aller", "mangé"],
    }),
    speaking("fr-m16-2-speak-recall-jesuislea", "je suis Léa", "I am Léa", [], "recall"),
    {
      id: "fr-m16-2-sim-leaou",
      type: "dialogue_sim",
      scene: { emoji: "🗺️", title: "Léa's day" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-leaou",
          npc: {
            speaker: "Chloé",
            kana: "Léa est allée où ?",
            audioText: "léa est allée où ?",
            gloss: "Where did Léa go?",
          },
          goal: "Say she went to the museum.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "elle est allée au musée" },
              { id: "wrong-spelling", text: "elle est allé au musée" },
              { id: "wrong-pronoun", text: "il est allée au musée" },
            ],
            correctOptionId: "correct",
            audioText: "elle est allée au musée",
          },
          replyGloss: "She went to the museum.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m16-2", [
      ["allé", "went (m)"],
      ["allée", "went (f)"],
      ["grand", "tall (m)"],
      ["grande", "tall (f)"],
      ["musée", "museum"],
      ["gare", "train station"],
    ]),
  ];
}

/** L3 — consolidation, no new atoms; interleave m7's «avec mon frère». */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m16-3-info-recap",
      "Quick Review",
      "«Allé», «allée» — same trick, any subject. Keep matching the spelling to who's speaking.",
    ),
    {
      id: "fr-m16-3-map-recap",
      type: "word_map",
      tokens: ["Thomas est allé", "Léa est allée", "Hugo est allé", "Chloé est allée"],
      pairs: [
        { en: "Thomas went", tokenIndex: 0 },
        { en: "Léa went", tokenIndex: 1 },
        { en: "Hugo went", tokenIndex: 2 },
        { en: "Chloé went", tokenIndex: 3 },
      ],
      audioText: "Thomas est allé, Léa est allée, Hugo est allé, Chloé est allée",
      revealNote: "Match the ending to the name.",
    },
    crossModuleVocabMcq("fr-m16-3-mcq-gare", "train station", "la gare", [
      "le musée",
      "l'école",
      "le parc",
    ]),
    build(
      "fr-m16-3-build-avecfrere",
      "Build: 'with my brother, I went to the park'",
      "avec mon frère, je suis allé au parc",
      ["avec mon frère", "je suis allé", "au parc", "à la gare"],
      ["avec mon frère", "je suis allé", "au parc"],
    ),
    listeningCompSentence({
      id: "fr-m16-3-lc-chloeecole",
      audioText: "Chloé est allée à l'école ce matin",
      correctMeaningEn: "Chloé went to school this morning.",
      distractorsEn: ["Chloé is going to school this morning.", "Thomas went to school this morning.", "Chloé went to school last night."],
    }),
    speaking("fr-m16-3-speak-hugogareavec", "Hugo est allé à la gare avec mon frère", "Hugo went to the train station with my brother", ["est", "allé"]),
    cloze(
      "fr-m16-3-cloze-elleallee",
      "",
      "est allée à l'école",
      "elle",
      ["elle", "il"],
      "she went to school",
      "elle est allée à l'école",
      "«elle est allée» — feminine subject, matching «allée».",
    ),
    build(
      "fr-m16-3-build-avecfreremusee",
      "Build: 'with my brother, he went to the museum'",
      "avec mon frère, il est allé au musée",
      ["avec mon frère", "il est allé", "au musée", "elle est allée"],
      ["avec mon frère", "il est allé", "au musée"],
    ),
    sentenceMcq({
      id: "fr-m16-3-smcq-elleallee",
      prompt: "'she went' — pick the French.",
      correctText: "elle est allée",
      distractorsText: ["elle est allé", "il est allé", "elle a mangé"],
    }),
    speaking("fr-m16-3-speak-recall-moiaussi", "moi aussi", "me too", [], "recall"),
    {
      id: "fr-m16-3-sim-frereou",
      type: "dialogue_sim",
      scene: { emoji: "👦", title: "Your brother" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-frereou",
          npc: {
            speaker: "Marie",
            kana: "Ton frère, il est allé où ce matin ?",
            audioText: "ton frère, il est allé où ce matin ?",
            gloss: "Your brother, where did he go this morning?",
          },
          goal: "Say he went to the park, with you.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il est allé au parc, avec moi" },
              { id: "wrong-spelling", text: "il est allée au parc" },
              { id: "wrong-pronoun", text: "elle est allé au parc" },
            ],
            correctOptionId: "correct",
            audioText: "il est allé au parc, avec moi",
          },
          replyGloss: "He went to the park, with me.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m16-3", [
      ["allé", "went (m)"],
      ["allée", "went (f)"],
      ["mon frère", "my brother"],
      ["gare", "train station"],
      ["musée", "museum"],
      ["parc", "park"],
    ]),
  ];
}

/** L4 — «Je suis venu(e)»: debuts «venir»/«venu», a genuinely new verb (no
 *  present-tense chunk), irregular participle, masculine-first. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m16-4-info-venir",
      "Venir, venu",
      "«Venir» — to come. A brand new verb this time, no shortcut: «venir» → «venu», a different pattern than «aller» → «allé». «je suis venu» — I came.",
    ),
    {
      id: "fr-m16-4-map-venir",
      type: "word_map",
      tokens: ["venir", "venu", "je suis venu", "tu es venu"],
      pairs: [
        { en: "to come", tokenIndex: 0 },
        { en: "came", tokenIndex: 1 },
        { en: "I came", tokenIndex: 2 },
        { en: "you came", tokenIndex: 3 },
      ],
      audioText: "venir, venu, je suis venu, tu es venu",
      revealNote: "«venu» doesn't rhyme with «venir» — an irregular participle, the first one on this machine.",
    },
    vocabTextMcq("fr-m16-4-mcq-venir", "venir", ["aller", "manger", "visiter"], 'Which word means "to come"?'),
    cloze(
      "fr-m16-4-cloze-voudraisvenir",
      "je voudrais",
      "",
      "venir",
      ["venir", "aller"],
      "I would like to come",
      "je voudrais venir",
      "«venir» stays bare after «je voudrais», same pattern as «aller».",
    ),
    build(
      "fr-m16-4-build-jesuisvenuparis",
      "Build: 'I came from Paris'",
      "je suis venu de Paris",
      ["je suis venu", "de Paris", "de New York", "au musée"],
      ["je suis venu", "de Paris"],
    ),
    listeningCompSentence({
      id: "fr-m16-4-lc-tuesvenunewyork",
      audioText: "tu es venu de New York",
      correctMeaningEn: "You came from New York.",
      distractorsEn: ["You're coming from New York.", "You came from Paris.", "I came from New York."],
    }),
    speaking("fr-m16-4-speak-hugolyon", "Hugo est venu de Lyon", "Hugo came from Lyon", ["est", "venu"]),
    cloze(
      "fr-m16-4-cloze-tuesvenu",
      "",
      "es venu de Paris",
      "tu",
      ["tu", "je"],
      "you came from Paris",
      "tu es venu de Paris",
      "«tu es venu» — the subject decides which form of «être» you use, exactly like «suis»/«es»/«est».",
    ),
    build(
      "fr-m16-4-build-thomaslyon",
      "Build: 'Thomas came from Lyon'",
      "Thomas est venu de Lyon",
      ["Thomas", "est", "venu", "de Lyon", "venue"],
      ["Thomas", "est", "venu", "de Lyon"],
    ),
    sentenceMcq({
      id: "fr-m16-4-smcq-venir",
      prompt: "'to come' — pick the French.",
      correctText: "venir",
      distractorsText: ["aller", "venu", "visiter"],
    }),
    speaking("fr-m16-4-speak-recall-frere", "j'ai un frère", "I have a brother", [], "recall"),
    {
      id: "fr-m16-4-sim-doulyon",
      type: "dialogue_sim",
      scene: { emoji: "🚉", title: "Where from?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-thomasdou",
          npc: {
            speaker: "Marie",
            kana: "Thomas est venu d'où ?",
            audioText: "thomas est venu d'où ?",
            gloss: "Where did Thomas come from?",
          },
          goal: "Say he came from Lyon.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il est venu de Lyon" },
              { id: "wrong-verb", text: "il est allé à Lyon" },
              { id: "wrong-prep", text: "il est venu à Lyon" },
            ],
            correctOptionId: "correct",
            audioText: "il est venu de lyon",
          },
          replyGloss: "He came from Lyon.",
        },
        {
          id: "t2-hugoparis",
          npc: {
            speaker: "Marie",
            kana: "Et Hugo, il est venu de Paris ?",
            audioText: "et hugo, il est venu de paris ?",
            gloss: "And Hugo, did he come from Paris?",
          },
          goal: "Say no, from New York.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, de New York" },
              { id: "wrong-yes", text: "oui, de Paris" },
              { id: "wrong-prep", text: "non, à New York" },
            ],
            correctOptionId: "correct",
            audioText: "non, de new york",
          },
          replyGloss: "No, from New York.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m16-4", [
      ["venir", "to come"],
      ["venu", "came (m)"],
      ["de", "from"],
      ["frère", "brother"],
      ["gare", "train station"],
      ["musée", "museum"],
    ]),
  ];
}

/** L5 — «Elle est venue»: debuts «venue», the module's second silent
 *  gender pair, explicit cross-recall against L2's allé/allée; light m6
 *  gâteau interleave. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m16-5-info-venue",
      "Elle est venue",
      "«Elle est venue» — same trick, new verb: vuh-NU either way, «venu» or «venue». «il est allé» / «elle est allée» taught you the pattern; this is the exact same move.",
    ),
    {
      id: "fr-m16-5-map-venue",
      type: "word_map",
      tokens: ["il est venu", "elle est venue", "il est allé", "elle est allée"],
      pairs: [
        { en: "he came", tokenIndex: 0 },
        { en: "she came", tokenIndex: 1 },
        { en: "he went", tokenIndex: 2 },
        { en: "she went", tokenIndex: 3 },
      ],
      audioText: "il est venu, elle est venue, il est allé, elle est allée",
      revealNote: "Same silent trick, two verbs now.",
    },
    vocabTextMcq("fr-m16-5-mcq-venue", "venue", ["venu", "venir", "allée"], 'Which word means "came" (feminine)?'),
    build(
      "fr-m16-5-build-ellevenuegateau",
      "Build: 'she came with a cake'",
      "elle est venue avec un gâteau",
      ["elle est venue", "avec un gâteau", "au musée", "il est venu"],
      ["elle est venue", "avec un gâteau"],
    ),
    listeningCompSentence({
      id: "fr-m16-5-lc-chloevenuegare",
      audioText: "Chloé est venue de la gare",
      correctMeaningEn: "Chloé came from the train station.",
      distractorsEn: ["Chloé is coming from the train station.", "Thomas came from the train station.", "Chloé came from the museum."],
    }),
    speaking("fr-m16-5-speak-hugogateau", "Hugo est venu avec un gâteau", "Hugo came with a cake", ["est", "venu"]),
    agreementChain({
      id: "fr-m16-5-chain-venue",
      prompt: "Dress the sentence to match «Chloé».",
      head: { surface: "Chloé", meaningEn: "Chloé", featureLabel: "pink-f" },
      tokens: [
        { kind: "slot", id: "s-pro", options: ["il", "elle"], correct: "elle", roleLabel: "feminine subject" },
        { kind: "fixed", text: "est" },
        { kind: "slot", id: "s-part", options: ["venu", "venue"], correct: "venue", roleLabel: "feminine participle" },
        { kind: "fixed", text: "de la gare" },
      ],
      meaningEn: "Chloé came from the train station",
      ruleNote: "Same move as allé/allée — vuh-NU either way, only the spelling agrees.",
    }),
    build(
      "fr-m16-5-build-mariegare",
      "Build: 'Marie came from the train station'",
      "Marie est venue de la gare",
      ["Marie", "est", "venue", "venu", "de la gare"],
      ["Marie", "est", "venue", "de la gare"],
    ),
    sentenceMcq({
      id: "fr-m16-5-smcq-venue",
      prompt: "'came (feminine)' — pick the French.",
      correctText: "venue",
      distractorsText: ["venu", "venir", "allée"],
    }),
    speaking("fr-m16-5-speak-recall-ilneparle", "il ne parle pas", "he doesn't speak", [], "recall"),
    {
      id: "fr-m16-5-sim-gateau",
      type: "dialogue_sim",
      scene: { emoji: "🍰", title: "Who brought cake?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-chloegateau",
          npc: {
            speaker: "Léa",
            kana: "Chloé est venue avec un gâteau ?",
            audioText: "chloé est venue avec un gâteau ?",
            gloss: "Did Chloé come with a cake?",
          },
          goal: "Say yes, and Marie came too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et Marie est venue aussi" },
              { id: "wrong-spelling", text: "oui, et Marie est venu aussi" },
              { id: "wrong-verb", text: "non, elle est allée" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et marie est venue aussi",
          },
          replyGloss: "Yes, and Marie came too.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m16-5", [
      ["venu", "came (m)"],
      ["venue", "came (f)"],
      ["allé", "went (m)"],
      ["allée", "went (f)"],
      ["gâteau", "cake"],
      ["gare", "train station"],
    ]),
  ];
}

/** L6 — «Je ne suis pas allé(e)»: no new atoms; negation debut around the
 *  être machine, first-ever live use of «tu n'es pas». */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m16-6-info-negation",
      "Je ne suis pas allé",
      "Negate it the same way as always: «ne … pas» around the verb. «tu es» → «tu n'es pas» — the same squeeze as «il n'est pas», now on «tu».",
    ),
    {
      id: "fr-m16-6-map-negation",
      type: "word_map",
      tokens: ["je ne suis pas allé", "tu n'es pas allé", "il n'est pas venu", "elle n'est pas venue"],
      pairs: [
        { en: "I didn't go", tokenIndex: 0 },
        { en: "you didn't go", tokenIndex: 1 },
        { en: "he didn't come", tokenIndex: 2 },
        { en: "she didn't come", tokenIndex: 3 },
      ],
      audioText: "je ne suis pas allé, tu n'es pas allé, il n'est pas venu, elle n'est pas venue",
      revealNote: "«tu n'es pas» — brand new combination, first time in the course, but it squeezes exactly like «il n'est pas».",
    },
    crossModuleVocabMcq("fr-m16-6-mcq-suis", "am", "suis", ["es", "est", "a"]),
    build(
      "fr-m16-6-build-jenesuispasalle",
      "Build: 'I didn't go to the museum'",
      "je ne suis pas allé au musée",
      ["je ne suis pas", "allé", "au musée", "à la gare"],
      ["je ne suis pas", "allé", "au musée"],
    ),
    listeningCompSentence({
      id: "fr-m16-6-lc-tunespasalle",
      audioText: "tu n'es pas allé à l'école",
      correctMeaningEn: "You didn't go to school.",
      distractorsEn: ["You went to school.", "He didn't go to school.", "You didn't go to the museum."],
    }),
    speaking("fr-m16-6-speak-ilnestpasvenu", "il n'est pas venu de Paris", "he didn't come from Paris", ["venu"]),
    cloze(
      "fr-m16-6-cloze-tunespas",
      "tu",
      "pas allé à la gare",
      "n'es",
      ["n'es", "es"],
      "you didn't go to the train station",
      "tu n'es pas allé à la gare",
      "«tu n'es pas» — first time in the course; «es» is vowel-onset, so «ne» squeezes to «n'», exactly like «n'est».",
    ),
    build(
      "fr-m16-6-build-ellenestpasvenue",
      "Build: 'she didn't come from the train station'",
      "elle n'est pas venue de la gare",
      ["elle", "n'est", "pas", "venue", "de la gare", "venu"],
      ["elle", "n'est", "pas", "venue", "de la gare"],
    ),
    sentenceMcq({
      id: "fr-m16-6-smcq-tunespas",
      prompt: "'you (tu) are not' — pick the negated French.",
      correctText: "tu n'es pas",
      distractorsText: ["tu es", "tu n'as pas", "il n'est pas"],
    }),
    speaking("fr-m16-6-speak-recall-comprends", "je ne comprends pas", "I don't understand", [], "recall"),
    {
      id: "fr-m16-6-sim-pasalle",
      type: "dialogue_sim",
      scene: { emoji: "🙅", title: "Not this time" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tuallegare",
          npc: {
            speaker: "Hugo",
            kana: "Tu es allé à la gare ?",
            audioText: "tu es allé à la gare ?",
            gloss: "Did you go to the train station?",
          },
          goal: "Say no, you didn't go.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, je ne suis pas allé" },
              { id: "wrong-aux", text: "non, je n'ai pas allé" },
              { id: "wrong-yes", text: "oui, je suis allé" },
            ],
            correctOptionId: "correct",
            audioText: "non, je ne suis pas allé",
          },
          replyGloss: "No, I didn't go.",
        },
        {
          id: "t2-chloevenue",
          npc: {
            speaker: "Hugo",
            kana: "Et Chloé, elle est venue ?",
            audioText: "et chloé, elle est venue ?",
            gloss: "And Chloé, did she come?",
          },
          goal: "Say no, she didn't come.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, elle n'est pas venue" },
              { id: "wrong-spelling", text: "non, elle n'est pas venu" },
              { id: "wrong-yes", text: "oui, elle est venue" },
            ],
            correctOptionId: "correct",
            audioText: "non, elle n'est pas venue",
          },
          replyGloss: "No, she didn't come.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m16-6", [
      ["allé", "went (m)"],
      ["allée", "went (f)"],
      ["venu", "came (m)"],
      ["venue", "came (f)"],
      ["suis", "am"],
      ["es", "are (you)"],
    ]),
  ];
}

/** L7 — «Hier, je suis allé(e)»: no new atoms; full recall of m14's time
 *  kit riding the être machine. Ne-drop legal from here on (dialogue_sim
 *  NPC lines / options only). */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m16-7-info-hier",
      "Hier, je suis allé",
      "Bring back «hier», «déjà», «pas encore» — they work the same way now, whichever auxiliary you're using. «hier, je suis allé au musée» — same time words, new auxiliary.",
    ),
    {
      id: "fr-m16-7-map-hier",
      type: "word_map",
      tokens: ["hier, je suis allé", "elle est déjà venue", "il n'est pas encore venu", "ce matin, tu es allé"],
      pairs: [
        { en: "yesterday, I went", tokenIndex: 0 },
        { en: "she already came", tokenIndex: 1 },
        { en: "he hasn't come yet", tokenIndex: 2 },
        { en: "this morning, you went", tokenIndex: 3 },
      ],
      audioText: "hier, je suis allé, elle est déjà venue, il n'est pas encore venu, ce matin, tu es allé",
      revealNote: "Same time kit, either auxiliary.",
    },
    crossModuleVocabMcq("fr-m16-7-mcq-hier", "yesterday", "hier", ["déjà", "ce matin", "pas encore"]),
    build(
      "fr-m16-7-build-hierallemusee",
      "Build: 'yesterday, I went to the museum'",
      "hier, je suis allé au musée",
      ["hier", "je suis allé", "au musée", "déjà"],
      ["hier", "je suis allé", "au musée"],
    ),
    listeningCompSentence({
      id: "fr-m16-7-lc-elledejavenue",
      audioText: "elle est déjà venue de Lyon",
      correctMeaningEn: "She already came from Lyon.",
      distractorsEn: ["She hasn't come from Lyon yet.", "He already came from Lyon.", "She already went to Lyon."],
    }),
    speaking("fr-m16-7-speak-pasencorevenu", "il n'est pas encore venu de Paris", "he hasn't come from Paris yet", ["venu"]),
    cloze(
      "fr-m16-7-cloze-elleestdejaallee",
      "elle",
      "déjà allée au musée ce matin",
      "est",
      ["est", "a"],
      "she already went to the museum this morning",
      "elle est déjà allée au musée ce matin",
      "«elle est» — «aller» takes «être», not «avoir», even with «déjà» in the sentence.",
    ),
    build(
      "fr-m16-7-build-tunespasencorevenu",
      "Build: 'you haven't come yet this morning'",
      "tu n'es pas encore venu ce matin",
      ["tu n'es pas", "encore", "venu", "ce matin", "déjà"],
      ["tu n'es pas", "encore", "venu", "ce matin"],
    ),
    sentenceMcq({
      id: "fr-m16-7-smcq-deja",
      prompt: "'already' — pick the French.",
      correctText: "déjà",
      distractorsText: ["pas encore", "hier", "ce matin"],
    }),
    speaking("fr-m16-7-speak-recall-croissant", "j'ai mangé un croissant hier", "I ate a croissant yesterday", [], "recall"),
    {
      id: "fr-m16-7-sim-hiersoir",
      type: "dialogue_sim",
      scene: { emoji: "🕰️", title: "Since yesterday" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tuallemusee",
          npc: {
            speaker: "Marie",
            kana: "Tu es allé au musée ce matin ?",
            audioText: "tu es allé au musée ce matin ?",
            gloss: "Did you go to the museum this morning?",
          },
          goal: "Say yes, already this morning.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, déjà ce matin" },
              { id: "wrong-no", text: "non, pas encore" },
              { id: "wrong-time", text: "oui, hier soir" },
            ],
            correctOptionId: "correct",
            audioText: "oui, déjà ce matin",
          },
          replyGloss: "Yes, already this morning.",
        },
        {
          id: "t2-leavenue",
          npc: {
            speaker: "Marie",
            kana: "Et Léa, elle est venue ?",
            audioText: "et léa, elle est venue ?",
            gloss: "And Léa, did she come?",
          },
          goal: "Say no, she hasn't come yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, elle est pas encore venue" },
              { id: "also-correct", text: "non, elle n'est pas encore venue" },
              { id: "wrong-yes", text: "oui, elle est venue" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "non, elle est pas encore venue",
          },
          replyGloss: "No, she hasn't come yet.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m16-7", [
      ["hier", "yesterday"],
      ["déjà", "already"],
      ["pas encore", "not yet"],
      ["ce matin", "this morning"],
      ["allé", "went (m)"],
      ["venue", "came (f)"],
    ]),
  ];
}

/** L8 — checkpoint: zero-new, all-graded, transfer test. */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m16-8-lc-1",
      audioText: "je suis allé au musée hier soir",
      correctMeaningEn: "I went to the museum last night.",
      distractorsEn: ["I'm going to the museum tonight.", "I went to the museum this morning.", "I went to the train station last night."],
    }),
    cloze(
      "fr-m16-8-cloze-1",
      "il",
      "pas encore venu",
      "n'est",
      ["n'est", "est"],
      "he hasn't come yet",
      "il n'est pas encore venu",
    ),
    speaking("fr-m16-8-speak-1", "il est déjà allé au parc", "he already went to the park", []),
    sentenceMcq({
      id: "fr-m16-8-smcq-1",
      prompt: "'came (feminine)' — pick the French.",
      correctText: "venue",
      distractorsText: ["venu", "venir", "allée"],
    }),
    build(
      "fr-m16-8-build-1",
      "Build: 'you haven't gone to school yet'",
      "tu n'es pas encore allé à l'école",
      ["tu n'es pas", "encore", "allé", "à l'école", "déjà"],
      ["tu n'es pas", "encore", "allé", "à l'école"],
    ),
    listeningCompSentence({
      id: "fr-m16-8-lc-2",
      audioText: "elle n'est pas venue hier soir",
      correctMeaningEn: "She didn't come last night.",
      distractorsEn: ["She came last night.", "He didn't come last night.", "She didn't come this morning."],
    }),
    cloze(
      "fr-m16-8-cloze-2",
      "",
      "est allée à la gare",
      "elle",
      ["elle", "il"],
      "she went to the train station",
      "elle est allée à la gare",
    ),
    speaking("fr-m16-8-speak-recall-lundi", "c'est lundi", "it's Monday", [], "recall"),
    sentenceMcq({
      id: "fr-m16-8-smcq-2",
      prompt: "'not yet' — pick the French.",
      correctText: "pas encore",
      distractorsText: ["déjà", "hier", "ce matin"],
    }),
    build(
      "fr-m16-8-build-transfer",
      "Build: 'she hasn't come yet'",
      "elle n'est pas encore venue",
      ["elle", "n'est", "pas encore", "venue", "venu"],
      ["elle", "n'est", "pas encore", "venue"],
    ),
    listeningCompSentence({
      id: "fr-m16-8-lc-3",
      audioText: "Thomas est allé à la gare, et Hugo est venu de Paris",
      correctMeaningEn: "Thomas went to the train station, and Hugo came from Paris.",
      distractorsEn: [
        "Thomas came from the train station, and Hugo went to Paris.",
        "Thomas and Hugo both went to the train station.",
        "Thomas went to Paris, and Hugo came from the train station.",
      ],
    }),
    build(
      "fr-m16-8-build-2",
      "Build: 'he came from Lyon'",
      "il est venu de Lyon",
      ["il", "est", "venu", "de Lyon", "allé"],
      ["il", "est", "venu", "de Lyon"],
    ),
    matchPairs("fr-m16-8", ["aller", "allé", "allée", "venir", "venu", "venue"]),
  ];
}

/** L9 — integration: no new atoms, ≥10 steps, no info cards, one big
 *  two-NPC dialogue_sim tail; cross-module recalls reaching to m5/m9. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m16-9-map-recap",
      type: "word_map",
      tokens: ["on est allé", "on est venu", "déjà allé", "pas encore venu"],
      pairs: [
        { en: "we went", tokenIndex: 0 },
        { en: "we came", tokenIndex: 1 },
        { en: "already went", tokenIndex: 2 },
        { en: "not yet come", tokenIndex: 3 },
      ],
      audioText: "on est allé, on est venu, déjà allé, pas encore venu",
      revealNote: "Everything so far, either verb.",
    },
    vocabTextMcq("fr-m16-9-mcq-allee", "allée", ["allé", "venu", "venue"], 'Which word means "went / gone" (feminine)?'),
    build(
      "fr-m16-9-build-ondejaalle",
      "Build: 'we already went to the museum'",
      "on est déjà allé au musée",
      ["on est déjà allé", "au musée", "à la gare", "on est déjà venu"],
      ["on est déjà allé", "au musée"],
    ),
    listeningCompSentence({
      id: "fr-m16-9-lc-tuvenumoiallle",
      audioText: "tu es venu de New York, et moi je suis allé à Paris",
      correctMeaningEn: "You came from New York, and I went to Paris.",
      distractorsEn: ["You went to New York, and I came from Paris.", "We both went to Paris.", "You came from Paris, and I went to New York."],
    }),
    speaking("fr-m16-9-speak-hugodejaalle", "Hugo est déjà allé à l'école", "Hugo already went to school", ["déjà", "allé"]),
    cloze(
      "fr-m16-9-cloze-ellenestpasencorealle",
      "elle",
      "pas encore allée au musée",
      "n'est",
      ["n'est", "n'a"],
      "she hasn't gone to the museum yet",
      "elle n'est pas encore allée au musée",
      "«elle n'est» — «aller» takes «être», never «avoir», however you negate it.",
    ),
    build(
      "fr-m16-9-build-tuvenulyon",
      "Build: 'you came from Lyon last night'",
      "tu es venu de Lyon hier soir",
      ["tu es venu", "de Lyon", "hier soir", "tu es allé"],
      ["tu es venu", "de Lyon", "hier soir"],
    ),
    sentenceMcq({
      id: "fr-m16-9-smcq-venu",
      prompt: "'came (masculine)' — pick the French.",
      correctText: "venu",
      distractorsText: ["venue", "venir", "allé"],
    }),
    speaking("fr-m16-9-speak-recall-tuvasou", "tu vas où ?", "where are you going?", [], "recall"),
    listeningCompSentence({
      id: "fr-m16-9-lc-chloehalle",
      audioText: "Chloé est venue avec un gâteau, et Marie est allée à la halle",
      correctMeaningEn: "Chloé came with a cake, and Marie went to the covered market.",
      distractorsEn: [
        "Chloé went to the covered market, and Marie came with a cake.",
        "Chloé and Marie both went to the covered market.",
        "Chloé came with a cake, and Marie is going to the covered market.",
      ],
    }),
    speaking("fr-m16-9-speak-recall-ellegrande", "elle est très grande", "she is very tall", [], "recall"),
    build(
      "fr-m16-9-build-avecfrereparc",
      "Build: 'with my brother, we went to the park'",
      "avec mon frère, on est allé au parc",
      ["avec mon frère", "on est allé", "au parc", "on est venu"],
      ["avec mon frère", "on est allé", "au parc"],
    ),
    matchPairs("fr-m16-9", ["aller", "allé", "allée", "venir", "venu", "venue"]),
    {
      id: "fr-m16-9-sim-quiestalleou",
      type: "dialogue_sim",
      scene: { emoji: "🚶", title: "Who went where" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-leaou",
          npc: {
            speaker: "Hugo",
            kana: "Léa, tu es allée où ce matin ?",
            audioText: "léa, tu es allée où ce matin ?",
            gloss: "Léa, where did you go this morning?",
          },
          goal: "Say you already went to the museum.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je suis allée au musée, déjà ce matin" },
              { id: "wrong-spelling", text: "je suis allé au musée" },
              { id: "wrong-verb", text: "je suis venue du musée" },
            ],
            correctOptionId: "correct",
            audioText: "je suis allée au musée, déjà ce matin",
          },
          replyGloss: "I went to the museum, already this morning.",
        },
        {
          id: "t2-hugothomas",
          npc: {
            speaker: "Léa",
            kana: "Et Hugo, il est venu avec Thomas ?",
            audioText: "et hugo, il est venu avec thomas ?",
            gloss: "And Hugo, did he come with Thomas?",
          },
          goal: "Say yes, and he already came this morning.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et il est déjà venu ce matin" },
              { id: "wrong-spelling", text: "oui, et il est déjà venue ce matin" },
              { id: "wrong-no", text: "non, il n'est pas venu" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et il est déjà venu ce matin",
          },
          replyGloss: "Yes, and he already came this morning.",
        },
        {
          id: "t3-chloegateau",
          npc: {
            speaker: "Hugo",
            kana: "Et Chloé, elle est venue avec un gâteau ?",
            audioText: "et chloé, elle est venue avec un gâteau ?",
            gloss: "And Chloé, did she come with a cake?",
          },
          goal: "Say no, not yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, elle est pas encore venue" },
              { id: "also-correct", text: "non, elle n'est pas encore venue" },
              { id: "wrong-yes", text: "oui, déjà" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "non, elle est pas encore venue",
          },
          replyGloss: "No, not yet.",
        },
      ],
    },
  ];
}

/** L10 — mastery: all-graded, every m16 atom present, mixes avoir- and
 *  être-participles in the same narration, ends on dialogue_sim, closes on
 *  a soft, deliberately generic tease. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m16-10-lc-1",
      audioText: "j'ai mangé un croissant, et je suis allé au musée",
      correctMeaningEn: "I ate a croissant, and I went to the museum.",
      distractorsEn: [
        "I ate a croissant, and I'm going to the museum.",
        "I went to the museum, and I ate a croissant there.",
        "I ate a croissant, and I came from the museum.",
      ],
    }),
    cloze(
      "fr-m16-10-cloze-1",
      "elle",
      "pas encore venue",
      "n'est",
      ["n'est", "n'a"],
      "she hasn't come yet",
      "elle n'est pas encore venue",
    ),
    speaking("fr-m16-10-speak-recall-tunaspas", "tu n'as pas mangé hier soir", "you didn't eat last night", [], "recall"),
    sentenceMcq({
      id: "fr-m16-10-smcq-1",
      prompt: "'to come' — pick the French.",
      correctText: "venir",
      distractorsText: ["aller", "venu", "allé"],
    }),
    build(
      "fr-m16-10-build-1",
      "Build: 'I already ate, and I already came'",
      "j'ai déjà mangé, et je suis déjà venu",
      ["j'ai déjà mangé", "et", "je suis déjà venu", "et je suis déjà allé"],
      ["j'ai déjà mangé", "et", "je suis déjà venu"],
    ),
    listeningCompSentence({
      id: "fr-m16-10-lc-2",
      audioText: "Léa est allée à la gare, et elle a mangé un croissant",
      correctMeaningEn: "Léa went to the train station, and she ate a croissant.",
      distractorsEn: [
        "Léa ate a croissant at the train station yesterday.",
        "Léa came from the train station, and she ate a croissant.",
        "Léa went to the train station, and she is eating a croissant.",
      ],
    }),
    speaking("fr-m16-10-speak-fresh", "Hugo est venu de Lyon, et il a visité la halle", "Hugo came from Lyon, and he visited the covered market", ["venu"]),
    vocabTextMcq("fr-m16-10-mcq-venue", "venue", ["venu", "venir", "allée"], 'Which word means "came" (feminine)?'),
    build(
      "fr-m16-10-build-2",
      "Build: 'you came, but you didn't eat'",
      "tu es venu, mais tu n'as pas mangé",
      ["tu es venu", "mais", "tu n'as pas mangé", "tu es allé"],
      ["tu es venu", "mais", "tu n'as pas mangé"],
    ),
    sentenceMcq({
      id: "fr-m16-10-smcq-2",
      prompt: "'went / gone (feminine)' — pick the French.",
      correctText: "allée",
      distractorsText: ["allé", "venue", "venu"],
    }),
    {
      id: "fr-m16-10-sim-catchingup",
      type: "dialogue_sim",
      scene: { emoji: "🌇", title: "Catching up, again" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tumangeallle",
          npc: {
            speaker: "Marie",
            kana: "Tu es allé au musée hier ?",
            audioText: "tu es allé au musée hier ?",
            gloss: "Did you go to the museum yesterday?",
          },
          goal: "Say yes, and you already ate there too.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, et j'ai déjà mangé là-bas" },
              { id: "wrong-aux", text: "oui, et je suis déjà mangé là-bas" },
              { id: "wrong-no", text: "non, pas encore" },
            ],
            correctOptionId: "correct",
            audioText: "oui, et j'ai déjà mangé là-bas",
          },
          replyGloss: "Yes, and I already ate there too.",
        },
        {
          id: "t2-hugovenu",
          npc: {
            speaker: "Marie",
            kana: "Et Hugo, il est venu ?",
            audioText: "et hugo, il est venu ?",
            gloss: "And Hugo, did he come?",
          },
          goal: "Say no, not yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, il est pas encore venu" },
              { id: "also-correct", text: "non, il n'est pas encore venu" },
              { id: "wrong-yes", text: "oui, il est venu" },
            ],
            correctOptionId: "correct",
            alsoCorrectOptionIds: ["also-correct"],
            audioText: "non, il est pas encore venu",
          },
          replyGloss: "No, not yet.",
        },
        {
          id: "t3-demain",
          npc: {
            speaker: "Marie",
            kana: "D'accord. Et demain, tu vas où ?",
            audioText: "d'accord, et demain, tu vas où ?",
            gloss: "Okay. And tomorrow, where are you going?",
          },
          goal: "Say you don't know yet.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je ne sais pas encore" },
              { id: "wrong-tense", text: "je suis allé demain" },
              { id: "wrong-no", text: "non, pas encore" },
            ],
            correctOptionId: "correct",
            audioText: "je ne sais pas encore",
          },
          replyGloss: "I don't know yet.",
        },
      ],
    },
  ];
}

const FR_M16_1: LessonContent = {
  id: "fr-m16-1",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je suis... allé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M16_2: LessonContent = {
  id: "fr-m16-2",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il est allé, elle est allée",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M16_3: LessonContent = {
  id: "fr-m16-3",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Quick Review",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M16_4: LessonContent = {
  id: "fr-m16-4",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je suis venu",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M16_5: LessonContent = {
  id: "fr-m16-5",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Elle est venue",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M16_6: LessonContent = {
  id: "fr-m16-6",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je ne suis pas allé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M16_7: LessonContent = {
  id: "fr-m16-7",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Hier, je suis allé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M16_8: LessonContent = {
  id: "fr-m16-8",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Allé, allée",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M16_9: LessonContent = {
  id: "fr-m16-9",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Who went where",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M16_10: LessonContent = {
  id: "fr-m16-10",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Catching up, again",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M16_MODULE: FrModuleDef = {
  title: "Allé, allée",
  eyebrow: "Module 16",
  summary:
    "«Suis», «es», «est» — you've used them since day one to say who you are. Now they do a second job: saying where you've been. New auxiliary, same verb, and an agreement this time you can't hear.",
  lessons: [
    FR_M16_1,
    FR_M16_2,
    FR_M16_3,
    FR_M16_4,
    FR_M16_5,
    FR_M16_6,
    FR_M16_7,
    FR_M16_8,
    FR_M16_9,
    FR_M16_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M16_CHECKPOINT_INDEX = 8;

export const FR_M16_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m16-s",
    moduleId: "m16",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m16-s",
        prompt: "'I went' — pick the French.",
        correctText: "je suis allé",
        distractorsText: ["j'ai allé", "je suis aller", "tu es allé"],
      }),
  },
  {
    id: "pt-fr-m16-1",
    moduleId: "m16",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m16-1",
        prompt: "'went / gone (feminine)' — pick the French.",
        correctText: "allée",
        distractorsText: ["allé", "aller", "venue"],
      }),
  },
  {
    id: "pt-fr-m16-2",
    moduleId: "m16",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m16-2",
        prompt: "'to come' — pick the French.",
        correctText: "venir",
        distractorsText: ["aller", "venu", "venue"],
      }),
  },
  {
    id: "pt-fr-m16-3",
    moduleId: "m16",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m16-3",
        prompt: "'you (tu) didn't go' — pick the French.",
        correctText: "tu n'es pas allé",
        distractorsText: ["tu es allé", "tu n'as pas allé", "il n'est pas allé"],
      }),
  },
  {
    id: "pt-fr-m16-4",
    moduleId: "m16",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m16-4",
        prompt: "'she hasn't come yet' — pick the French.",
        correctText: "elle n'est pas encore venue",
        distractorsText: ["elle n'est pas encore venu", "elle n'a pas encore venu", "il n'est pas encore venu"],
      }),
  },
];
