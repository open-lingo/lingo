> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Lingo — Japanese lesson flow handoff (2026-05-15)

Working session covering: yōon rendering fix, lesson-flow restructure,
sprinkled yōon curriculum, P0 bug pass after multi-persona audit, research
on image-MCQ + memory science + future bets. Ready to pick up cold next
session.

---

## Session changes shipped

### Build-sentence yōon tokenization
`src/features/lesson/data/lessonBuilder.ts` — `buildBuildSentence` now
calls `tokenizeJapanese` so multi-codepoint mora stay one tile.
`おちゃ` → `[お, ちゃ]` instead of `[お, ち, ゃ]`. `correctOrder` and the
hint threshold use the mora-form count.

### Yōon furigana rendering
`src/shared/domain/languageConfig.ts` — added 30 missing yōon entries to
`characterRomanization` (きゃ kya … ぴょ pyo). Tokenizer in
`shared/japanese/kanaTable.ts` already merged yōon pairs when the lookup
existed; it was silently falling back to per-codepoint for everything
except the r-row. Now `おちゃ` ruby renders `[お:o][ちゃ:cha]`.

### Lesson flow restructure (per-kana cycle)
`src/features/lesson/data/lessonBuilder.ts` — replaced:
- `buildRecognitionStep` (deleted — user feedback "they just learned it,
  don't immediately test recognition")
- `buildAudioPickStep` (deleted — codepoint indexing was wrong for yōon)
- `positionOrdinal`, `pickDistractors`, `A_ROW_VOWELS` (deleted, dead)

with `pickExampleWord(kana, words, used)` helper. New per-kana cycle:
intro → teach (a word that uses the kana). End: match → build.

### `pickExampleWord` fallback fix
Returns `null` when every word containing `kana` is already paired with
another intro — used to fall through to a `used` word, producing duplicate
back-to-back teach steps. Eliminates the "く gets paired with きく twice"
P0 the audit caught.

### Match cap 4 → 6
`buildMatchStep` was hard-capped at 4 pairs, silently dropping the 5th
anchor (drops きゃく in yo-kya-sha-cha — the only kya reinforcement).
Bumped to 6. Renderer `MatchPairsStepView.tsx` already iterates
`step.pairs`, no layout change needed.

### Orphan-kana anchor words added across all rows
`src/features/lesson/data/hiraganaCurriculum.ts`. Every basic / dakuten /
handakuten / yōon row now has an anchor word for every kana it
introduces, with two known exceptions noted in the deferred list.

| Row | Added |
|---|---|
| ka | くち, いけ |
| sa | せかい, うそ |
| ta | とけい |
| na | のこす |
| ha | へい |
| ya | よこ |
| ra | これ |
| ga | ぐあい |
| za | ざる |
| da-ba | ともだち, えび, ぼく |
| pa | ぺこぺこ |
| yo-kya-sha-cha | きゅう, ちゅうい, しゅみ, しょうゆ |
| yo-nya-hya-mya | にゃんこ, にゅうし, みゃく |
| yo-rya-gya-ja | ぎゃく, ぎょう, じゃま |
| yo-bya-pya | ぴょん |

TTS generated for all 26 via `scripts/tts/gen_phrases.py` (Nanami,
padded with 300ms trailing silence). Manifest updated.

### Sprinkled yōon into module 1 / module 2
`src/shared/domain/mockCourse.ts` — module 3 (Yōon) dissolved. Yōon
lessons now interleave with their prerequisite consonant rows.

| Module | Order |
|---|---|
| m1 Hiragana | vowels → ka → sa → ta → **yo-kya-sha-cha** → na → ha → ma → **yo-nya-hya-mya** → ya → ra → wa |
| m2 Voicing | ga → za → **yo-rya-gya-ja** → da-ba → pa → **yo-bya-pya** |
| m3 Katakana | (coming soon) |

### `を` romaji fix (modern Hepburn)
`src/shared/domain/languageConfig.ts:297` and `:570` — `を: "wo"` and
`ヲ: "wo"` changed to `"o"`. TTS audio says "o"; hint string already
acknowledged "sounds like 'o'"; only the romaji helper above the kana
was inconsistent. Curriculum hint string also updated to clarify the
spelled-vs-pronounced split.

### yo-bya-pya build decoy tokenization bug
`src/features/lesson/data/hiraganaCurriculum.ts` — `びょういん` build
had decoys `["び", "ょ", "う", "ぴ"]`. Answer mora-tokenizes to
`[びょ, う, い, ん]`; a lone `ょ` sat next to fused `びょ` in the tile
bank. Replaced decoys with mora-form: `["びゃ", "ぴょ", "ぴ"]`.

### `TeachStepView.playTerm` regression
`src/features/lesson/components/steps/TeachStepView.tsx` — manual Play
button used `new Audio(ttsUrl).play()`, regressing the
`playUntilDone()` fix CLAUDE.md says was already done. Routed through
`playJaAudio` (Web Audio API path) — eliminates priming clicks +
chromium#40354418 + GC truncation in one move.

---

## Pending decisions (queued for user)

Listed in cost-to-decide order. Each has a research / persona-driven
recommendation; not actioned per "wait for user input" instruction.

### 1. Image-MCQ feature (HIGHEST LEVERAGE)
**Recommend:** Ship for concrete nouns only. Skip for abstracts (`lie`,
`hindrance`, `opposite`, `this`, `what`, `I/me`, `leave behind`,
`wriggling`, `hop`, `sick`, etc. — picture-superiority collapses there;
sub a sentence-cloze step).

Evidence:
- [Cambridge 2024 — orthography vs images, asymmetric image→glyph transfer](https://www.cambridge.org/core/journals/bilingualism-language-and-cognition/article/impact-of-orthography-versus-images-on-foreign-language-learning-evidence-from-behavioral-and-neural-markers/3BCD137A3C88327937628A9894234D32)
- [PMC 2025 — Duolingo-inspired image-MCQ pretesting (4 experiments)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965936/)
- [Paivio Dual Coding View of Vocabulary Learning](https://www.researchgate.net/publication/238317055_A_Dual_Coding_View_of_Vocabulary_Learning)
- [Carpenter & Olson 2011 — pictures help only if you don't think they will](https://www.researchgate.net/publication/51519245_Are_Pictures_Good_for_Learning_New_Vocabulary_in_a_Foreign_Language_Only_If_You_Think_They_Are_Not)

**SVG source stack (recommended):**
- OpenMoji CC BY-SA 4.0 base — covers ~55 of 80 nouns at $0 — [openmoji.org](https://openmoji.org/) — [GH commercial-use thread](https://github.com/hfg-gmuend/openmoji/issues/462)
- AI-generated supplement (SDXL flat-vector style + vtracer) ~25 nouns @ ~$0.005/img + QC
- Noun Project fallback ($40/yr individual) for edge cases — [pricing](https://thenounproject.com/pricing/)
- **Total MVP asset cost <$50**

**Dev cost:** ~1 week + 1 day asset curation.

**Implementation sketch (Cambridge asymmetric-transfer order):**
1. Introduce (image + kana + audio, no MCQ, ~2s)
2. Image-MCQ recognition (audio → 4 image grid)
3. Glyph-MCQ recognition (kana → 4 image grid) ← the differentiator
4. Glyph production (image → type/tap kana)
5. SRS queues items that failed step 3 or 4

Grid: 2×2, 1 correct + 3 distractors from same semantic category
(prevents image-bias shortcut). Show kana on the audio button, NOT on
each image (different drill if on-image).

### 2. FSRS-6 migration
**Recommend:** Yes, ts-fsrs is mature.

Evidence: [Expertium 700M-review benchmark](https://expertium.github.io/Benchmark.html)
shows FSRS-6 has 99.6% superiority over SM-2; 20-30% fewer reviews for
same retention; ±5.3% interval accuracy vs SM-2's ±16.2%.
[Price et al. Academic Medicine 2025](https://memoforge.app/blog/fsrs-vs-sm2-anki-algorithm-guide-2025/)
— 58% vs 43% retention in 26k physicians.

**Dev cost:** 2-3 days porting `ts-fsrs`. Don't expose interval/ease
numbers to user (Anki-power-user trap). Surface SRS as a "review"
badge after session 3.

### 3. Yōon lesson split (per-consonant mini-lessons)
**Recommend:** Yes. All 4 personas + the audit subagent converged on
the 9-in-one-lesson cliff being broken.

**Dev cost:** 2-3 hours curriculum data restructure.

Proposed split:
- ka-yoon (きゃ きゅ きょ) after ka-row
- sa-yoon (しゃ しゅ しょ) after sa-row
- ta-yoon (ちゃ ちゅ ちょ) after ta-row
- na-yoon / ha-yoon / ma-yoon (sparse — capstone?)
- ra-yoon (りゃ りゅ りょ) after ra-row
- ga-yoon, za-yoon (じゃ じゅ じょ — high value)
- ba-yoon, pa-yoon

Needs new RowDef data with anchors. Many sparse-consonant yōon
(nya/mya/gya/pya) have few good anchors — consider capstone rather
than dedicated lessons for those.

### 4. Questionable anchor swaps (anime-fan persona retention pattern)
**Recommend:** Yes, swap.

Forecast: words anime-fan flagged as "weird" are exactly the ones that
didn't retain in their 1-week test. The pattern is predictable.

| Current | Swap to | Reason |
|---|---|---|
| のこす (na) | のる or のむ | godan verb, niche |
| へい (ha) | へや | universal pick for へ; "room" |
| ぐあい (ga) | drop — がっこう covers ぐ adjacency | abstract |
| ざる (za) | ざっし (magazine, N5) | kitchen niche |
| じこ (za) | jiko-as-accident only, drop "oneself" | 2 different kanji confused |
| にょろ (yo-nya-hya-mya) | drop, accept にょ sparse | mimetic |
| ぺこぺこ (pa) | ぺん (pen) | mimetic-heavy row already |
| ぴょん (yo-bya-pya) | ぴかぴか | mimetic |

Needs TTS regen after swap. ~30 min + audio gen.

### 5. ひゅ / みゅ orphans (yo-nya-hya-mya)
**Recommend:** Leave orphan; add one-line note in lesson intro
paragraph that these yōon are genuinely rare. Doc-only change. ~5 min.

Research says don't ship mimetic anchors as "real Japanese" — adding
`ひゅう` (whoosh) or `みゅう` (mew) replicates the bug the anime-fan
flagged. Better to teach honestly: "you'll meet these in the wild."

### 6. Mid-lesson match-pairs cadence
**Recommend:** Yes. Match-pairs is the dopamine hit (teen + adult both
called it out). Fire it mid-lesson after ~3 intros, not only at end.

Compounds with image-MCQ (#1) and lesson-container restructure (#9).

### 7. End-of-lesson summary card
**Recommend:** Yes. Retiree's #1 ask. Currently "Nice work! You
learned 5 hiragana and 6 words" — a count, not a recap. Want a
scannable kana table + anchor words.

**Dev cost:** half-day UI.

### 8. Mid-lesson XP / streak animation
**Recommend:** Yes, as commitment device (not loss-aversion).
[Duolingo Streak Freeze research](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)
shows 48% retention diff. [Decision Lab streak-creep critique](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)
warns against the loss-aversion grind.

Ship: Streak Freeze on day 1; visible streak counter during lesson;
XP +N animation on correct match.
Skip: hearts/lives; XP grinding; leaderboards.

**Dev cost:** half-day UI.

### 9. Multi-step lesson container with asymmetric flow
**Recommend:** Yes — this is the structural change that compounds
bets #1, #2, #6.

Re-architect lesson container so a single "vocab item" passes through
the 5-step pipeline (intro → image-MCQ → glyph-MCQ → production →
SRS) instead of the current flat step list.

**Dev cost:** ~1 week.

### 10. Diagnostic + skip-test on first launch
**Recommend:** Yes. Anime-fan persona explicit ask — 84 taps before
the first dakuten for someone who already knows hiragana is churn.

Front-load a ~30-kana quiz; >85% accuracy drops user at dakuten module.

**Dev cost:** 2-3 days.

### 11. Mnemonic illustrations (the big retention bet)
**Recommend:** Email Tofugu first for commercial license. If declined,
commission fresh art to the same schema (the schema "き looks like a
key" isn't copyrightable; only Alexis Cowan's specific illustrations
are).

Evidence: research is mixed but trending toward
**given mnemonics with high imagery > self-generated weak mnemonics**
for beginners ([keyword-generation study](https://www.researchgate.net/publication/8590180_The_Importance_of_the_Keyword-Generation_Method_in_Keyword_Mnemonics)).

DO NOT live-LLM-generate mnemonics — non-Latin hallucination rates are
elevated (Mu-SHROOM/CCHall benchmarks). One wrong-character mnemonic
poisons the foundation forever.

**Cost:** $0 (license) or $1-3k (commission, 1-2 weeks).

---

## Explicit "do nots" (research-validated)

- Live-LLM-generated kana mnemonics — hallucination risk
- XP grinding mechanics, leaderboards
- Mandatory handwriting (opt-in only; Skritter's own correlation
  drops from r=0.34 to r=0.19 by semester end)
- Conversational AI agents at beginner level — Duolingo Max own
  research suggests B1+ only
- Heisig 'Remembering the Kana' verbatim — copyrighted
- English translation in the encoding moment — show after response
  (Cambridge orthography + Rosetta-Stone dynamic-immersion)
- Hearts/lives — undermine intrinsic motivation
  ([Deci/Koestner/Ryan 2001 meta-analysis](https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf))

---

## Persona audit results (full reports archived in agent transcripts)

5 agents dispatched in parallel: 1 research, 4 learner personas. All
Opus per `feedback_subagents_always_opus.md`. See sources at bottom.

### Convergent themes (3+ personas independently flagged)

| Theme | Personas | Research signal |
|---|---|---|
| Yōon 9-in-one cliff | teen, adult, retiree, anime | Working memory 4±1 (Cowan 2001) |
| Yōon needs visual decomposition (parent + small + combined) | teen, adult, retiree | Dual coding (Paivio) |
| No spaced review across lessons | teen, adult, retiree | 8-12 encounters (Nation 2001) |
| Match-pairs is the dopamine hit but only fires once | teen, adult | Retrieval > restudy (Karpicke 2008) |
| 10+ steps between intro and any retrieval | teen, adult, retiree | First retrieval 20-60s post-intro |
| Hints/notes never read | teen, adult | Generation effect |

### Persona-specific (worth keeping)

- **Adult:** small ゃ (yōon) vs big や (ya-row) is a glyph collision
  with no bridge. Same shape, different role, no callout. Real design
  gap not previously flagged.
- **Retiree:** wants end-of-lesson summary card; wants "redo without
  losing credit"; reverses my decision to delete audio-pick — wants
  it back with mora-tokenization fix.
- **Anime fan:** flagged 5 real bugs (3 already fixed: を, decoy
  tokenization, TeachStepView playTerm; 2 design calls). Wants
  diagnostic+skip-test; documents the retention pattern that the
  questionable anchor words don't stick.

---

## Pedagogy principles (research synthesis, source-cited)

From the research agent's report. Top 15:

1. Spacing > massing; optimal gap ≈ 10-20% of target retention
   interval (Cepeda 2008, 317-experiment meta-analysis)
2. Retrieval >> restudy for long-term retention (Karpicke & Roediger
   2008, Science)
3. Metacognitive illusion: rereading feels productive, retrieval
   feels harder but learns more (Karpicke, Butler & Roediger 2009)
4. Desirable difficulties — slower in-session performance often
   predicts better long-term learning (Bjork & Bjork 1994, 2011)
5. Production > recognition (MacLeod et al. 2010, production effect)
6. Block-then-interleave (Hwang 2025, Yan et al. 2017)
7. Modality: visual + spoken audio > visual + on-screen text (Mayer)
8. Working memory ~4±1 chunks (Cowan 2001, not Miller's 7±2)
9. Vocabulary needs 8-12 meaningful encounters; 20-30 spaced
   retrievals for long-term storage (Nation 2001; Webb 2007)
10. Errorful retrieval + immediate feedback > errorless drilling
    (Potts & Shanks 2014; Metcalfe 2017)
11. Extrinsic rewards can undermine intrinsic motivation
    (Deci/Koestner/Ryan 2001)
12. FSRS predicts recall better than SM-2 for ~99% of users
13. Picture-superiority + dual coding for L2 vocab
    (Paivio; Cambridge 2024)
14. Image→glyph transfer is asymmetric (Cambridge 2024) — favored
15. Picture-superiority collapses for abstract words (ERIC 2020)

---

## File pointers for next-session pickup

| File | What's there |
|---|---|
| `src/features/lesson/data/hiraganaCurriculum.ts` | RowDef catalog: HIRAGANA_ROWS, DAKUTEN_ROWS, YOON_ROWS, ALL_ROWS |
| `src/features/lesson/data/lessonBuilder.ts` | `buildRowLesson` — per-kana cycle, match step capped at 6, build step uses tokenizeJapanese |
| `src/features/lesson/data/generatedHiraganaLessons.ts` | Module-eval registers all rows as lessons |
| `src/features/lesson/data/mockLessons.ts` | Registry |
| `src/shared/domain/mockCourse.ts` | JA branch with sprinkled yōon |
| `src/shared/domain/languageConfig.ts` | `characterRomanization` (yōon entries added, を fixed) |
| `src/shared/japanese/kanaTable.ts` | `tokenizeJapanese` mora-level tokenizer |
| `src/shared/japanese/tts.ts` | Web Audio API path, `playJaAudio`, `useAutoPlayJaAudio` |
| `src/features/lesson/components/steps/*.tsx` | Per-step renderers; SymbolIntro, Teach, MatchPairs, BuildSentence |
| `src/features/lesson/components/StepRenderer.tsx` | Dispatch by step.type |
| `lingo-core/scripts/tts/gen_phrases.py` | Multi-char Japanese phrase TTS generator (Nanami) |
| `lingo-core/scripts/tts/regen_best.py` | Single-mora Whisper-validated best-of-strategy |

---

## TTS coverage status

- 292+ mp3s in `src/pub/tts/ja/`
- Manifest at `src/pub/tts/manifest.json`
- All anchor words (including 26 new ones from this session) have
  Nanami audio
- Single-mora kana have Nanami audio (60/69 Whisper-exact, 0 doubled
  artifacts per prior session's regen_best.py run)
- Yōon single-mora: 30/33 Whisper-exact

---

## Open tasks (still tracked)

- **#43 Sprinkle yōon into earlier curriculum** — completed via
  mockCourse.ts module reordering; bundled yōon kept (not split into
  per-consonant) — see pending decision #3
- All others completed (audit, fixes, bug pass)

---

## Sources (full set, deduped)

Research agent + earlier audit references. Pre-loaded for next session.

### Image-MCQ + dual coding
- [Cambridge 2024 — orthography vs images](https://www.cambridge.org/core/journals/bilingualism-language-and-cognition/article/impact-of-orthography-versus-images-on-foreign-language-learning-evidence-from-behavioral-and-neural-markers/3BCD137A3C88327937628A9894234D32)
- [PMC 2025 — Duolingo-inspired pretesting](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965936/)
- [Paivio Dual Coding](https://www.researchgate.net/publication/238317055_A_Dual_Coding_View_of_Vocabulary_Learning)
- [Picture vs Translation Mediated Instruction](https://www.sciencedirect.com/science/article/pii/S187704281504570X)
- [Pictures only help if you don't think they will (Carpenter & Olson)](https://www.researchgate.net/publication/51519245_Are_Pictures_Good_for_Learning_New_Vocabulary_in_a_Foreign_Language_Only_If_You_Think_They_Are_Not)
- [Use of images for abstract words (ERIC)](https://files.eric.ed.gov/fulltext/EJ1271702.pdf)
- [Gestures + pictures multi-month retention](https://link.springer.com/article/10.1007/s10648-020-09527-z)
- [Pictures vs words as stimuli/responses](https://www.researchgate.net/publication/232483911_Pictures_versus_words_as_stimuli_and_responses_in_paired-associate_learning)
- [Rosetta Stone Dynamic Immersion validation](https://www.researchgate.net/publication/341291822_Using_Rosetta_Stone_Media_Through_the_Dynamic_Immersion_Method_to_Improve_Vocabulary_Mastery_for_Junior_High_School_Students)
- [Dual Coding vs Cognitive Load (Frontiers 2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8963493/)

### Spacing, retrieval, desirable difficulties
- [Cepeda et al. 2008 — Spacing effects](https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf)
- [Cepeda et al. 2006 — Distributed practice meta-analysis](https://augmentingcognition.com/assets/Cepeda2006.pdf)
- [Karpicke & Roediger 2008 — Test-enhanced learning, Science](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Karpicke-Roediger-2008_Sci.pdf)
- [Karpicke 2012 — Active retrieval](https://learninglab.psych.purdue.edu/downloads/2012/2012_Karpicke_CDPS.pdf)
- [Bjork & Bjork 2011 — Desirable difficulties](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)
- [Bjork & Bjork 2019 — Blocked-better myth](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2020/01/BjorkBjorkEducatinMythChapterPublishedFormSept2019.pdf)
- [Karpicke & Roediger 2007 — Expanding vs equal retrieval](http://psychnet.wustl.edu/coglab/wp-content/uploads/2015/01/2007-Is-expanded.pdf)
- [Carpenter et al. 2014 — Equal vs expanding long-term](https://link.springer.com/article/10.3758/s13423-014-0636-z)
- [Hwang 2025 — Interleaving for low achievers](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659)
- [Nakata & Webb 2021 — Contextual vocab spacing](https://journals.sagepub.com/doi/10.1177/0267658320927764)
- [Spaced practice CALL Japanese/Spanish (Reading 2023)](https://centaur.reading.ac.uk/109724/1/Muqaibal_Kasprowicz_Tissot_AuthorFinal%20version.pdf)

### Production + multi-modal
- [MacLeod et al. 2010 — Production effect](https://uwaterloo.ca/memory-attention-cognition-lab/sites/default/files/uploads/files/jep10.pdf)
- [Mayer Multimedia Learning](https://www.jsu.edu/online/faculty/MULTIMEDIA%20LEARNING%20by%20Richard%20E.%20Mayer.pdf)
- [Mayer Modality + Contiguity PDF](https://www.researchgate.net/profile/Richard-Mayer-4/publication/228698670_Cognitive_Principles_of_Multimedia_Learning_The_Role_of_Modality_and_Contiguity/links/57799c7608aead7ba0764344/Cognitive-Principles-of-Multimedia-Learning-The-Role-of-Modality-and-Contiguity.pdf)
- [Frontiers 2023 — Corrective feedback timing L2](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1026174/full)
- [Krashen 1998 — Comprehensible output](http://www.sdkrashen.com/content/articles/comprehensible_output.pdf)

### Mnemonics + handwriting
- [Tofugu hiragana mnemonics chart](https://www.tofugu.com/japanese/hiragana-mnemonics-chart/)
- [Keyword-generation method study](https://www.researchgate.net/publication/8590180_The_Importance_of_the_Keyword-Generation_Method_in_Keyword_Mnemonics)
- [Hiragana mnemonic apps study](https://www.researchgate.net/publication/334420329_Using_Mnemonic-Based_Applications_to_Learning_Japanese_Hiragana_Characters)
- [Naka/Longcamp handwriting (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11943480/)
- [N400 handwriting advantage](https://pmc.ncbi.nlm.nih.gov/articles/PMC8222525/)
- [Skritter Chinese effectiveness study](https://www.academia.edu/6258931/An_evaluation_of_the_effectiveness_of_a_Chinese_character_learning_software_on_Chinese_character_retention_for_English_speaking_background_learners_of_Chinese)

### SRS
- [FSRS benchmark (Expertium 700M reviews)](https://expertium.github.io/Benchmark.html)
- [MemoForge FSRS vs SM-2 guide 2025](https://memoforge.app/blog/fsrs-vs-sm2-anki-algorithm-guide-2025/)

### Gamification + motivation
- [Deci/Koestner/Ryan 2001 — Extrinsic rewards meta-analysis](https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf)
- [Duolingo Streak habit research](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)
- [Trophy.so Duolingo case study](https://trophy.so/blog/duolingo-gamification-case-study)
- [Decision Lab — Streak Creep critique](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)
- [DEV community — shallow learning trap](https://dev.to/yaptech/duolingos-shallow-learning-trap-gamified-streaks-harmful-habits-4134)

### Microlearning + session pacing
- [Microlearning systematic review (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2405844024174440)
- [Arizona JSLAT modality/session length](https://journals.librarypublishing.arizona.edu/jslat/article/id/7251/)

### AI / LLM caution
- [LLM Hallucinations 2026 guide (Lakera)](https://www.lakera.ai/blog/guide-to-hallucinations-in-large-language-models)
- [Duolingo Max research (Portnoff)](https://research.duolingo.com/papers/portnoff.edm21.pdf)

### SVG / image assets
- [OpenMoji site](https://openmoji.org/)
- [OpenMoji FAQ + license](https://openmoji.org/faq/)
- [OpenMoji GH commercial-use thread](https://github.com/hfg-gmuend/openmoji/issues/462)
- [Noun Project pricing](https://thenounproject.com/pricing/)
- [vtracer for raster→SVG](https://www.visioncortex.org/vtracer)

### Competitor patterns
- [Drops site](https://languagedrops.com/)
- [Drops review (Rhapsody in Lingo)](https://rhapsodyinlingo.com/en/drops-review/)

---

## Resume the conversation

When you start the next session, the agent at
`/home/beast/.claude/projects/-home-beast-projects-lingle/2935fe9b-89fc-46e7-9b10-24e59ae59fd1.jsonl`
has the full transcript including all 5 parallel-agent outputs (research
+ 4 personas) — load it if you want raw text. Otherwise this handoff
plus `MEMORY.md` should be sufficient context.

Build is clean (4.85s), 17/17 vitest tests pass. No commits made
(per standing rule). `git status` will show modified:
- `src/features/lesson/components/steps/TeachStepView.tsx`
- `src/features/lesson/data/hiraganaCurriculum.ts`
- `src/features/lesson/data/lessonBuilder.ts`
- `src/shared/domain/languageConfig.ts`
- `src/shared/domain/mockCourse.ts`
- `src/pub/tts/manifest.json` + 26 new mp3s under `src/pub/tts/ja/`
