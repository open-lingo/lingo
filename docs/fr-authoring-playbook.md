# FR authoring playbook — m6+ operational guide

**Status:** ACTIVE · **Created:** 2026-09-01 (after the m3–m5 wave) ·
**Audience:** a fresh agent authoring the next FR module. Terse and
operational; no history. The pedagogy law is **ES guide §13 + §13.9**
(`docs/es-lesson-authoring-guide.md`) — the old fr guide/pin carry a stale
banner and are NOT the law. m1–m5 are live content; m3+ follow the shape
below. Modules awaiting Spencer's walk are never retro-edited for taste —
only for genuine defects, flagged loudly.

## 1. Gate landscape — what checks what

All run in `npx vitest run --project curriculum src/features/languages/fr`.
Iterate there; ONE full `--project curriculum` + `npx tsc --noEmit` at the end.

| File | Checks |
|---|---|
| `fr/curriculum/fr-quality.test.ts` | course-wide shape: teaching 10–25 steps, checkpoint 12–22 at its exported index, mastery ends on `dialogue_sim`, no adjacent same-type, no 4+ selection run, ≥2 gen + ≥1 spoken per teaching lesson, zero typed translate, ≥60% lessons reference prior modules. **Register each new module's `FR_M<n>_CHECKPOINT_INDEX` in its `CHECKPOINT_INDEX` map.** |
| `fr/__tests__/moduleBarGuards.ts` (via `registerFrModuleBarGuards` in your mN.test.ts) | sentence-overuse ≤3×/lesson (clozes exempt; norm ≥8 chars), full-sentence recognition MCQs banned in teaching lessons (atom-surface exemption — punctuation must match the atom exactly), MCQ distractor lint incl. echo-back (≥3-char tokens), wimcq is first-exposure-only unless audio-prompted (leading article stripped), particle_cloze intro-module scope (2-option both-taught trials exempt; exact-surface atoms are authoritative for attribution), translate ≤15%, vocab provenance (every French token = atom token, `l'`-derived elided token, function word, or proper name; new words debut on intro-capable steps — info «quotes» count). |
| `fr/__tests__/moduleContentLints.ts` (via `registerFrModuleContentLints`) | lesson ids/count, pathway resolution, unique step ids, passive-card follow-up, no explanation on passive, answer-leak on build/translate explanations, atom surface literally appears in steps, noun atoms carry gender. |
| `fr/__tests__/frContentAudits.test.ts` | **course-wide, rendered:** word-level elision breaches in COMPOSED sentences (inside multi-word tiles; sim options/accepted included), sim-reply integrity (ids resolve, unique options, accepted builds composable from tiles, confirmation audio folds-equal correct answer, NPC lines carry audioText), build banks (unique tiles, order ⊆ bank), audio-prompted wimcq has a playable `meaningEn` clip, word_map indices + tokens-in-audio, raw match_pairs ≥6 unique pairs (allowlist dated/shrink-only), course-wide voiced-first recall walk. |
| `fr/__tests__/frAudioCoverage.test.ts` | every rendered audioText/audioKey/targetSentence/targetPhrase/promptAudioText/kana resolves to a manifest clip. Ratchet **0, forever**. Fix = TTS chain (§4), never the number. |
| `fr/__tests__/frPromptComprehensibility.test.ts` | French-language MCQ prompts use taught words only. Guillemet-wrap any French in an English prompt («…») — quoted spans are exempt. |
| `fr/curriculum/mN.test.ts` (write one per module — copy m5.test.ts) | shared registrations + §13 pins: checkpoint = count−2, match in closing zone, info ≤1 (0 from checkpoint on), no phrase_card/pretest, tint dictionary for the module's word_maps, NPC-mirror rule, goal ≤8 words, cross-module recall walk (m1→…→mN, ≥8 module recalls), any module-specific inventory pins. |
| `fr/curriculum/fr-doctrine.test.ts` | m1+m2 promotion suite — never touch. |

Gate law: **fix content or educate the gate (dated comment); never weaken.**
Allowlists are per-instance, dated, shrink-only.

## 2. Module-file anatomy (exemplar: `fr/curriculum/m5.ts`)

Hand-authored TS. `compile-ir-fr.mjs` is pre-restart and unusable — do not.
Registration is the GLOB: creating `mN.ts` with the four exports IS the
registration (pathway, atoms, placement all derive). Never touch
`mockCourse`/`index.ts`.

- Header comment: scope decisions + **voicing ledger** (see §5) + cast notes.
- `FR_M<n>_ATOMS: FrAtom[]` — bare noun surfaces + gender (articled display
  derives via `withArticle`, incl. `l'`); chunks registered whole («je n'aime
  pas», «tu vas où ?»); determiners (articles, possessives) register as
  `kind: "particle"`. Every noun needs an emoji **vendored** in
  `src/pub/noto-emoji/svg/emoji_u<hex>.svg` (download from
  googlefonts/noto-emoji; ZWJ sequences join codepoints with `_200d_`, FE0F
  is never in the filename — see `shared/assets/notoEmoji.ts`). Dedup:
  never re-register an earlier surface.
- 10 lesson functions; lesson ids `fr-mN-1..10`; checkpoint = L8
  (`FR_M<n>_CHECKPOINT_INDEX = 8`), zero-new all-graded; L9 = integration
  (big sim + tail, ≥10 steps, no info); L10 = mastery, all-graded, every
  atom present, ENDS on a dialogue_sim, soft promise for mN+1.
- `FR_M<n>_MODULE: FrModuleDef`, `FR_M<n>_PLACEMENT: PlacementItem[]`
  (5 sentenceMcq items, FIRST = screener).
- Factories from `../grammarHelpers`: `infoStep, vocabMcq, vocabTextMcq,
  sentenceMcq, build, cloze, speaking, listeningCompSentence,
  listeningBuildSentence, genderSort, matchPairs, agreementChain`.
  `agreementChain` (m9+): head noun + tokens (`{kind:"fixed",text}` /
  `{kind:"slot",id,options,correct,roleLabel}`), ≥2 slots enforced,
  correct∈options, audio-bearing chains refuse homophone options;
  graded, NOT selection-typed, exposures untracked — every chain word
  must be already-taught. Its `audioText` counts toward the per-lesson
  sentence-overuse cap and needs a clip.
  `liaisonListen` (m10+): words + linkedJunctions; the factory refuses a
  link from a vowel-final word, from «et», or into a consonantOnset
  atom, and REQUIRES ≥1 silent junction per item (pin F1). Liaison
  items depend on subtle TTS phonetics: keep them a small enumerated
  set pinned in mN.test.ts (the m10 audition-set pattern), keep
  checkpoints liaison-free, and route the robust ear work through
  vowel contrasts (le/les) instead. Raw objects for
  `word_map`, `dialogue_sim`, audio-prompted `word_image_mcq`
  (meaningEn === one option's word — use the ARTICLED form as meaningEn;
  its clip arrives free because the emitter collects wimcq meaningEn and
  option words), raw `match_pairs` (≥6 pairs).
- Speaking: pass `[]` for exercisedAtoms (m2+ house pattern);
  `"recall"` as 5th arg only per §5.
- Drafting rhythm per lesson (~12–14 steps): info(≤1) → debuts
  (wimcq/map) → speak printed → sim → discrimination clozes/lc
  (alternating answers, §13.9 law 4) → 2–3 cross-module tails (1 recall,
  1 ear) → build → match (6 pairs, ~half prior) → WIN speak.
  Watch while drafting (gates catch, but cheaper to plan): no adjacent
  same-type, selection runs ≤3 (mc/wimcq/cloze/lc), full-sentence
  surfaces ≤3×/lesson, «pas de»-type chunks only before consonants.

## 3. Sim rules (frContentAudits enforces most)

- Every NPC line: `kana` (display) + `audioText` (the clip text, plain).
- choice replies: correct/alsoCorrect resolve; confirmation `audioText`
  folds-equal the CORRECT option (punctuation-insensitive — display
  «d'accord !» may use clip "d'accord"); an option mirroring the NPC line
  must be accepted; a pragmatically-natural known reply must be accepted
  (max-acceptance) or excluded from the bank; goal ≤8 words and must
  itself disambiguate the intended answer.
- build replies: every accepted string composable from the tile multiset
  (each tile ≤ once); enumerate every natural composition into
  `alsoAccepted`; no duplicate tiles; elided forms are single tiles.
- Debut-by-sim: sims are invisible to the provenance tracker — quote the
  new word in the lesson's info card («…») and/or follow with speaking.

## 4. TTS chain (as it works TODAY — run every module, additive only)

1. `EMIT_FR_TTS_DECK=1 npx vitest run --project curriculum src/features/languages/fr/__tests__/emitTtsDeck.test.ts`
   (data-walk emitter → `../lingo-data/data/test_decks/fr-course.json`;
   emits audio fields + tiles + match sources + atom surfaces + wimcq
   meaningEn/option words. `scripts/emit-tts-deck.mjs` and `module-gate`
   are JA-only — ignore for FR.)
2. Diff deck vs manifest: hash16 = sha256("fr:"+text)[:16]; membership =
   16-char chunks of manifest `hashes`. This diff IS the report's
   new-strings list.
3. `lingo-data/.venv/bin/python -m pipeline.tts.generate --provider edge --lang fr`
   (system python lacks edge_tts; skips cached; expect `failed=0`).
4. `lingo-data/.venv/bin/python -m pipeline.tts.emit_manifest` — **no
   --lang flag**; emits all languages from the shared source manifest.
5. Copy `lingo-data/out/tts/manifest/fr.json` →
   `lingo/src/shared/tts/manifests/fr.json` — **byte-identical** (cmp it).
6. `rsync -a --ignore-existing lingo-data/out/tts/fr/ lingo/tts-publish/fr/`
   — clips and manifest ship in the SAME deploy; never upload yourself;
   never commit.

CWD trap: steps 1 runs from `lingo/`, steps 3–4 from `lingo-data/`
(module-relative imports), steps 2/5/6 use paths relative to the PARENT
(`lingle/`) — shells reset cwd between calls, so prefix absolute paths.

## 5. Recall ledger (voiced-first law, §13.9 law 3)

A `speaking` with `cue: "recall"` is legal only if the EXACT targetPhrase
had a non-recall (printed) speaking earlier in course order (m1→mN).
Maintain the ledger in the module header while drafting: printed voicings
per lesson, recalls drawn (with their source), cross-module recalls
(2–3, from m1–m(N−1) printed lines). ≥8 recalls per module. Builds and
lc are NOT voicings. frContentAudits re-checks course-wide.

## 6. Deferred-items registry (do not ship by accident)

- **«en ville»** — French for "in town"; untaught, so «à la ville» is
  BANNED (pinned in m5.test.ts). Unlock when «en» gets a beat (~m15).
- **h aspiré contrast (pin F3)** — no aspiré atom exists yet; first one
  («le héros»-class, `consonantOnset: true`) must debut against a mute-h
  word (hôtel). Until then no aspiré vocabulary.
- **d'-elision** — untaught, so «il n'y a pas de» + vowel noun is banned
  (pinned in m4.test.ts); «jus d'orange»-type vocab waits.
- **Partitives (du/de la/de l')** — untaught; food modules must use
  countable orderables only («un café» ✓, «du lait» ✗). Judgment goes in
  the inventory: pick nouns that never need a partitive.
- **«mon amie» (ma + vowel → mon)** — the possessive-elision exception;
  ships WITH the «ami/amie» debut, not before. Until then no ami/amie
  vocabulary (pinned in m7.test.ts) and all possessed nouns stay
  consonant-initial.
- **Plurals + «les» + liaison_listen (pin F1)** — silent plurals need the
  homophone machinery; les‿amis liaison beat ships with them (~m10).
- **Verb machine** — full -er paradigm, `fr/conjugationTables.ts`,
  `getConjugationGridConfig("fr")`, nous/vous/ils rows, and the ES-style
  conjugation checkpoint law (~m11). Until then verbs are CHUNKS
  (je vais / tu vas / on va precedent).
- **Typed translate** — banned at this tier (§13.9 law 10); returns only
  after orthography is taught. AccentBar layout (engine) blocks typed
  steps too.
- **ne-drop register beat (pin F10)** — spoken «je sais pas»; own module
  (~m13), never mixed silently before that.

## 7. Drafting workflow + local models

Design spine → write atoms + voicing ledger → draft lessons against §2's
rhythm → run FR-scoped tests → fix → TTS chain → re-run → review pass →
full curriculum + tsc. Local tier (foreground only; background ollama
runs die silently): **qwen3.8:27b** for novel-sentence naturalness review
(may cold-timeout ~10min after memory churn — retry or fall back);
**qwen3:4b** is fine for pattern-permutation batches (m5's 36 lines were
4 validated patterns). gemma4:31b cold-timeouts; skip. Format: numbered
lines, "N OK / N FIX: … — reason". Local output is draft/review material —
final French judgment is yours; anything the model flags, re-derive
yourself. Every genuinely novel sentence gets your own grammar check
regardless of model verdict.

## 8. The arc — m6–m15 spine registry (design authority: this file; revisable)

Each module cashes the previous one's authored promise (check the
previous mastery sim's `explanation` before designing).

- **m6 «Au café»** — order things: «je voudrais», food nouns, «encore»,
  «s'il te plaît» register beat, «l'addition» (cashes m5's "what you do
  when you get there").
- **m7 «Ma famille»** — have & belong: «j'ai»/«tu as» chunks, mon/ma/ton/ta
  riding the gender sides, family nouns; chat/chien become YOURS.
- **m8 «La semaine»** — days + «aujourd'hui»/«quand ?»; the m5 plan
  machine gets a calendar (days = repetitive family → interleave 3/2/2).
- **m9 «Grand, grande»** — first adjectives, AUDIBLE agreement
  (grande/petite), `agreement_chain` debut; the étudiant/étudiante ear
  lane grows.
- **m10 «Les»** — plurals + les/des + the silent-plural homophone
  machinery + `liaison_listen` debut (les‿amis, pin F1).
- **m11 «La machine à verbes»** — -er present paradigm (aimer/parler
  promoted from chunks), conjugationTables + grid + the conjugation
  checkpoint law (ES «verb machine» precedent).
- **m12 «C'est combien ?»** — numbers 11–69, prices, shopping.
- **m13 «Je sais pas»** — negation generalized across verbs + the
  spoken ne-drop register beat (pin F10).
- **m14 «Hier»** — passé composé chunks (j'ai mangé…); aspect groundwork
  for `aspect_choice_cloze` (imparfait later).
- **m15 «La visite»** — grand consolidation; «en ville» unlocks; h-aspiré
  contrast beat; a real tour of everything.
