# Portuguese course design — 2026-09-18

Research + design only. No lesson content shipped, no app code touched. Written for
Spencer's friend's Portuguese course: "similar authoring to Spanish but a tiny bit
better." Recommendation: **ship Brazilian Portuguese (pt-BR)** as the only authored
variant; see §3.

---

## 1. What we copy verbatim — and what FR lost copying it

| Copy | Source |
|---|---|
| Authoring-time IR YAML → checker → TS, brief+exemplars+`check-frag.sh` shape | `docs/es-ir-sources/es-m20-brief.md` (this is the "frameless" pipeline — no `frames-*.mjs` verb-cell generator needed, an agent drafts IR directly against a brief) |
| Intro-before-review, always | `CLAUDE.md` §"The lenses we teach from"; machine-enforced `moduleConformance.test.ts` |
| Comprehensibility gating (content word ⇒ `fromModule` ≤ this point) | `CLAUDE.md` lenses |
| Image-MCQ-as-introduction, first-exposure-only | `docs/lesson-authoring-guide.md` §13.2; `docs/es-authoring-invariants-pinned.md` E11 (`imageMcq` first exposure only) |
| Build/listen-build answer banks carry extra wrong tiles so the bank is never sized exactly to the answer, and clitics/articles/prepositions get their own tile | `docs/es-ir-sources/es-m20-brief.md` (`tiles` = extra wrong tiles); `es-authoring-invariants-pinned.md` E10 |
| Interleaving — split a repetitive family across lessons with unrelated breaks | `[[interleave-dont-block-teach]]`; `CLAUDE.md` lenses |
| Compounding review tail / review grids drawn from prior atoms | `docs/lesson-authoring-guide.md` §1, §13.13; `docs/course-design-learnings-2026-08-21.md` law 1 |
| Gloss-aspect rule — English gloss must carry the form's aspect lexically, never rely on a subtle grammar contrast | `docs/lesson-authoring-guide.md` §7b; `docs/learning-loop-2026-09-17.md` §5 |
| Procedural QA question set (Q1–Q12) as the pre-ship gate | `docs/procedural-qa-2026-09-17.md` §2 |
| TTS chain (edge-tts → manifest → coverage ratchet at 0) | `docs/fr-authoring-playbook.md` §4 |
| Placement question bank | `src/features/placement/questionBank.ts` (2118 lines); `es/placementBank.ts` |

**What FR lost copying from ES — four incidents, not one:**

1. **The Vite glob-order race baked broken content invisibly.** `fr/courseAtoms.ts`'s
   eager `import.meta.glob` is not numerically ordered; `m3.ts` called `withArticle()`
   at module-eval time, so when m3 evaluated before m1 registered the noun, the
   distractor was baked bare ("café" instead of "le café") **for the worker's entire
   lifetime**, silently, because per-file guards were "exhausted as a strategy" before
   the class fix (`src/test/frEntryGuard.ts`) landed. This is the canonical failure:
   an infra assumption borrowed from ES's synchronous hand-authored-TS load order broke
   the moment FR's module count grew, and nothing caught it until CI packed workers
   differently. **If PT's atom collection ever uses a glob**, it needs the
   `frEntryGuard.ts`-equivalent test *from lesson 1*, not after the first silent-bake
   incident.
2. **TTS manifest never existed at design time.** The FR guide's own honesty banner:
   "there is no `manifests/fr.json` at all... this gates the first FR module, not a
   later polish pass." Generate `pt.json` before or alongside m1 authoring, not after.
3. **Licensing left open past the point of no return.** `docs/fr-lexical-resources-2026-08-18.md`
   §10: several of the best French frequency/morphology datasets are CC BY-SA
   (share-alike), and resolving that *after* a frame tables real vocabulary means
   "rewriting the inventory." Resolve PT's licensing (§3 below) before m1 vocabulary
   selection locks.
4. **Blind step-type copying risk, caught just in time, not by construction.** FR's
   `stress_pattern` step (Spanish-only — French has no lexical stress) would have been
   an unanswerable step if authored for French; it was caught by a human comparison
   pass, not a gate. PT needs the same explicit "which ES/FR step types actually
   transfer" pass before authoring, not an assumption that the whole cheat sheet ports.

---

## 2. Evidence-backed improvements

Session note: WebSearch hit its session-wide budget cap before this lane's turn (same
constraint the `learning-loop-2026-09-17.md` §5 lane hit). Citations below are
WebFetch-verified where marked **VERIFIED**; everything else is well-established prior
knowledge, flagged **UNVERIFIED THIS SESSION** rather than silently asserted, per
`[[research-before-declaring-limits]]`.

| # | Claim | Citation | Lesson change | Cost | Verdict |
|---|---|---|---|---|---|
| a | Cognates are recognized/produced faster and more accurately in L2 processing ("cognate facilitation effect") | Costa, Caramazza & Sebastián-Gallés 2000; de Groot & Keijzer 2000, *Language Learning* 50(1) — **UNVERIFIED THIS SESSION** (well-established bilingualism finding, fetch attempts blocked/budget-capped) | Front-load high-confidence PT–EN cognates in m1–m2 vocab selection (família, hospital, animal, filme, música); dedicate one explicit false-friend contrast step per trap word, `antiPattern`-style, for embaraçada, pasta, puxar, esquisito | Low — vocab-selection change, no new step type | **ADOPT** |
| b | Perceptual/minimal-pair discrimination training improves L2 phonemic category formation and generalizes to production (High Variability Phonetic Training) | Bradlow, Pisoni, Akahane-Yamada & Tohkura 1997, *JASA* — **UNVERIFIED THIS SESSION** (well-established, prior knowledge) | Nasal vowels (ã/õ/-ão) and open/closed vowel pairs (avó/avô, pé/pê) are PT's highest-value minimal-pair set for a beginner — reuse FR's `liaison_listen` step TYPE before building a new one (step-type discipline: reuse before invent) | Medium — needs minimal-pair TTS sets; step-type reuse keeps engineering cost low | **ADOPT**, reuse `liaison_listen` first |
| c | Comprehension-based/structured-input instruction gains BOTH comprehension and production; output-only instruction mainly gains production | VanPatten & Cadierno 1993; Shintani, Li & Ellis 2013 comparative meta-analysis, *Language Learning* — **UNVERIFIED THIS SESSION** | Already implicit: JA §13.13 and the es-m20-brief step-kind order put `vocabMcq`/`listenCompLit` (form-meaning mapping, no output) before `build`/`speak` for every new point. **Not a new step type** — make the ordering an explicit checkable rule in the PT brief: "a new grammar point's first retrieval step is input-only" | ~0 — documentation only | **ADOPT** (name it, don't build it) |
| d | Spaced retrieval + testing effect improve long-term retention | Cepeda et al. 2006; Roediger & Karpicke 2006 — already the basis for FSRS in this codebase (`docs/lesson-authoring-guide.md` §13.4 cites Roediger & Marsh 2005) | Nothing PT-specific to add — register PT atoms into the existing language-generic FSRS/Track-A engine, same as ES/FR | ~0 | **ADOPT** (reuse only) |
| e | Pushed output serves noticing, hypothesis-testing, metalinguistic functions; forced output too early raises the affective filter | Swain & Lapkin 1995 — **VERIFIED** (en.wikipedia.org/wiki/Comprehensible_output); Krashen 2003 counter-argument — **VERIFIED**, same page | Already implemented: density bar puts hard-direction (translate/speaking) at "step 12+" (§2), never the first retrieval of a new form (§13.3); 2-fail-then-choice flow (§8) answers Krashen's anxiety objection without an auto-pass | 0 — inherit template positions unchanged | **ADOPT** (already implemented) |
| f | Working-memory load should ramp one new structure at a time, not stack modifiers | Sweller 1988, Cognitive Load Theory — **UNVERIFIED THIS SESSION** | Already §4g ("richer, not longer") — PT inherits the frame-driven `esSentenceComplexity.test.ts` pattern once PT's own frame exposes `time` the same shape (fr guide §0.1 row) | 0 once the frame exists | **ADOPT unchanged** |
| g | Dual coding (image + word) beats word-alone for concrete vocabulary | Paivio 1971/1986; Mayer 2001 multimedia principles — **UNVERIFIED THIS SESSION** | Already §13.1/§13.2 — PT inherits the lexical-category → step-type rubric unchanged | 0 | **ADOPT unchanged** |
| h | Any post-2021 SLA meta-analysis finding not already covered above | — | **Honest answer: I don't know of one.** WebSearch was capped before I could pull 2021–2026 literature live, and I won't assert a specific recent finding I can't back. What I can say: nothing in my pre-2026 training suggests recent work argues against spaced retrieval, structured-input sequencing, or dual coding — the recent literature I'm aware of (e.g., corrective-feedback meta-analyses like Kim et al. 2020, **UNVERIFIED THIS SESSION**) reinforces rather than overturns (a)–(g) | — | **SKIP — say so**, flag for a follow-up research lane with a fresh WebSearch budget if Spencer wants this pushed further |

---

## 3. Portuguese-specific decisions

**BR vs EU — recommend BR, ship only one variant, keep the seam cheap.** BR has ~211M
speakers vs. EU's ~10M; default assumption absent Spencer's friend saying otherwise.
Per `course-design-learnings-2026-08-21.md` law 5 ("a content fork rots in days"), do
**not** author both in parallel. But per the brief's own ask, don't bake BR into every
string either: put voice, você-default, gerund (BR: estou fazendo) vs. EU's
`estar a + inf`, and the handful of lexical swaps (ônibus/autocarro, trem/comboio)
behind one small `ptVariant` config object — narrow surface, not a parallel course.
Trade-off: EU differs in pronoun placement (proclisis/mesoclisis vs. BR's near-universal
proclisis), tu vs. você split, and spelling (post-1990 Acordo Ortográfico is shared,
but lexical choices diverge). A future EU pass is a new course-config value, not a
rewrite, **if** the seam is kept narrow from m1.

**ser/estar/ter/ficar.** ser (identity/origin) and estar (temporary state/location) are
the classic PT/ES hard point — teach both by m4 with an explicit minimal-pair
`antiPattern` ("Sam é estudante" vs. "Sam está cansado"), same mechanism as ES's ser/estar
E3. ter (possession/age — PT uses ter, not haver, in speech) is high-frequency, m3.
**Defer ficar** to m4+ after ser/estar/ter are solid — ficar is genuinely PT-specific
(location: "fica no centro"; change of state: "ficou triste"; stay: "ficar em casa") and
introducing a fourth competing copula-shaped verb before the first three are automatic
would violate just-in-time grammar (§13.3) and law 6 (gates evolve by education, not
exemption).

**-ar/-er/-ir rollout.** Same three classes as ES. Recommend -ar first (largest,
regular, covers falar/morar/trabalhar/gostar), -er second (comer/beber), -ir third
(partir/assistir) — m1: ser/estar/ter + -ar present; m2: -er present + gostar de + inf;
m3: -ir present + ficar + contractions layer 2. Every cell must ship through a
`pt/conjugationTables.ts` the way ES's E12 requires — no hand-written paradigm in a step.

**Gender/number agreement.** PT nouns are gendered (o/a); plural of -ão is a genuinely
hard, high-frequency irregular class with three outcomes (pão→pães, mão→mãos,
irmão→irmãos) — build this as its own small table (~20–30 common nouns) before the
agreement gate can fire correctly, same precedent as `conjugationTables.ts`. ES's
`agreement_cloze` mechanism (grade the whole set together, no partial credit — E2 in
`es-authoring-invariants-pinned.md`) carries directly.

**Contractions (do/da/no/na/pelo/dele…).** PT's contraction set is much larger than
ES's two-item list (al/del) — closer to FR's burden than ES's. **Copy FR's model, not
ES's**: contractions are introduced by cloze, never separable tiles
(`fr-lesson-authoring-guide.md` §0.1, "the slot is filled"). Teach do/da/no/na first
(m1–m2, location + possession, highest frequency); defer pelo/dele/nisso etc. to m4+.

**Pronoun placement (BR proclisis).** Because the course is BR-only, this is a
non-issue for m1–m5 — BR speech defaults to proclisis ("me chamo") almost universally,
unlike EU's mixed enclisis/mesoclisis. No contrastive teaching needed unless/until an
EU variant ships; flag, don't build.

**Frequency source — name it like the FR lexical-licences precedent did.**
`wordfreq`'s `pt` wordlist — **VERIFIED this session** via PyPI: code Apache 2.0, data
CC BY-SA 4.0, 5 PT sources including OPUS OpenSubtitles2018 and SUBTLEX-PT (SUBTLEX
credit to Marc Brysbaert et al. required per the package's own licensing note, also
verified). This mirrors JA's NINJAL-CEJC-cross-checked-against-OpenSubtitles doctrine
and FR's Lexique film-subtitle frequency column — "spoken corpus chosen deliberately"
(`vocab-frequency-audit-2026-07-19.md`). Supplementary candidate for a future EU pass:
P-PAL (Soares et al., Portuguese psycholinguistic database) — name only, licence
**UNVERIFIED**.

**Lexical sidecar for PT procedural QA — mirror ES/FR exactly, verified installable
this session:**
- `simplemma` (MIT — **VERIFIED**) for lemmatization/dictionary-membership: pt reports
  927k forms, 95k lemmata, **0.94 accuracy** on UD PT-GSD — comparable to ES/FR's own
  numbers, confirmed via GitHub README.
- `wordfreq` pt (Apache 2.0 code / CC BY-SA data — **VERIFIED**) fills the
  frequency/POS-adjacent role Lexique plays for FR.
- Q1/Q6 (known-words residual): build the generic `lib/surfaces.mjs` adapter for PT
  from day one — do **not** leave PT at FR's current `n/a` state (`docs/fr-lexical-licences.md`'s
  underlying gap, per §11's "no atom adapter" note for FR).
- Q2 (tile boundaries): mechanical, space-tokenized like ES/FR — `wordChunk.mjs` ports
  unchanged, no PT-specific work.
- Q3 (one content morpheme/tile): PT's contraction density makes this closer to FR's
  elision problem than ES's — a PT contraction/deconjugation table is **required
  pre-work**, not optional, before Q3 is meaningful.
- Q4/Q8/Q10: `n/a` for PT with an explicit `naReason`, same as KO/ES/FR (script/IR
  mechanics don't apply).
- Q5/Q7/Q9: language-generic, port unchanged, zero PT work.
- Q11 (`introduces:` exposure): currently JA-only, but PT's IR-YAML brief format
  already tracks "new atoms it OWNS" per lesson (the `es-m20-brief.md` table shape) —
  cheap to wire for PT since the data already exists in the brief; recommend PT gets
  Q11 rather than staying `n/a`.
- Q12 (gloss aspect): PT needs its own house-gloss table entry, same shape as JA §7b /
  FR's row. Candidates: **ir + inf** (near-future, dominant in BR speech — gloss "going
  to X," never "will X"); **estar + gerúndio** (progressive) vs. simple present — same
  is/does trap as ES/FR; **ter que/ter de** (obligation) vs. **dever** (should/probably)
  — don't collapse to one English "must"; **pretérito perfeito vs. imperfeito** — same
  went/was discipline `es-m20-brief.md` rule 6 already documents for ES's fue/era.

---

## 4. The first five lessons, as briefs (m1 L1–L5)

Persona: reuse the cross-course learner name **Sam** (`course-design-learnings-2026-08-21.md`
law 8). PT NPC cast (candidates, not locked — verify naturalness with a native speaker
before authoring): **Bia, Pedro, Rafael**. Places: Brasil, São Paulo.

**Shared mechanical rules (mirrors `es-m20-brief.md` §"Hard rules the gates enforce"):**
new atom's first appearance must be on an intro-capable step (info/phrase/speakLit/
buildLit/listenCompLit/imageMcq — never a distractor, never a sim first); every atom
answers ≥3 times across its lesson; no two adjacent same-kind steps; ≤3 uses of any one
sentence per lesson; contractions are cloze-only, never separable tiles (§3); ser/estar
minimal pairs get an explicit `antiPattern`; every lesson closes sim → matchLit (≥6
pairs) → speakLit-win, same as ES; 10–25 step band, no 4+ selection-only run (Q9).

| L | Title | Grammar point | New atoms (≤8, cognates marked *) | Step sequence (shorthand) | Illustrative -win sentence (authoring lane may adjust) |
|---|---|---|---|---|---|
| 1 | Eu sou Sam | ser present sg. (sou/é); greetings | olá, eu, você, sou, é, estudante*, professor(a)*, Brasil* | map(unbilled) → info(ser, no antiPattern needed yet) → imageMcq×2(estudante🎓/professor👨‍🏫) → listenCompLit → clozeLit×2(sou/é rotate) → buildLit(≥5 tiles) → speakLit → clozeLit → sim(Bia) → matchLit(≥6) → speakLit-win | «Eu sou Sam, sou estudante.» |
| 2 | De onde você é? | ser + de (origin); contractions do/da debut | de, onde, do, da, cidade, país, França*, Califórnia* | info(contraction cloze-only rule) → clozeLit×2(do/da) → listenCompLit → buildLit(≥5, recall L1 ser forms) → speakLit → sim(Pedro asks "De onde você é?") → matchLit(≥6) → speakLit-win | «Eu sou do Brasil, e você?» |
| 3 | Eu tenho uma família | ter present sg.; um/uma + gender agreement debut | tenho, tem, um, uma, família*, irmã, amigo, gato | imageMcq(gato🐱) → info(agreement, antiPattern um irmã/uma irmão) → agreementLit → clozeLit×2(tenho/tem) → buildLit(≥5) → listenCompLit → sim(Rafael) → matchLit(≥6) → speakLit-win | «Eu tenho um amigo e uma irmã.» |
| 4 | Eu estou cansado | estar present sg.; ser-vs-estar minimal pair; contraction no/na | estou, está, em, no/na (recall+extend), cansado/cansada, feliz, aqui, hospital* | info(ser-vs-estar antiPattern: "Sam é estudante" / "Sam está cansado") → phraseLit×2(feliz/cansado) → clozeLit×2(estou/está) → buildLit(≥5, «Sam está no hospital») → agreementLit(feliz invariant vs. cansado/a) → listenCompLit → sim(Bia: "Você está bem?") → matchLit(≥6) → speakLit-win | «Eu estou cansado, mas estou feliz.» |
| 5 | O que você gosta de fazer? | gostar de + infinitivo; -ar/-er/-ir preview; module consolidation | gosto, gosta, falar, comer, assistir, filme*, música*, pizza* (recall) | info(gostar DE + inf, antiPattern *"gosto assistir" without de) → imageMcq×2(filme🎬/música🎵) → clozeLit×2(gosto/gosta) → buildLit(≥5) → listenBuildLit → recall×2(L1–L4) → dialogueListen/sim(mixed ser/estar/ter/contractions) → matchLit(≥6) → speakLit-win | «Sam gosta de comer pizza e assistir filme.» |

**Gates each lesson runs:** procedural QA Q1(n/a until adapter built)/Q2/Q3(once
contraction table exists)/Q5/Q7/Q9/Q12; a `pt-quality.test.ts` mirroring
`fr-quality.test.ts` (step band, checkpoint index, ≥2 gen + ≥1 spoken/lesson, zero typed
translate, ≥60% lessons reference prior modules); `moduleContentLints`-equivalent (atom
surfaces literally appear, noun atoms carry gender); TTS coverage ratchet at 0 for m1.

---

## 5. Infra checklist (scaffolding lane)

| Item | Mirrors | Est. |
|---|---|---|
| `pt` entry in `registry.ts`, registered-not-selectable | `fr: frModule` pattern (`shared/language/registry.ts:12-28`) | 0.5h |
| PT display config | `shared/domain/languageConfig.ts` | 0.5h |
| Curriculum dir + `module.ts` + `courseAtoms.ts` scaffold | `src/features/languages/es/module.ts`, `es/courseAtoms.ts` | 2h |
| `compile-ir-pt.mjs` cloned from ES's authoring-time YAML→TS compiler (not JA's runtime `moduleCompiler.ts` — different tool, see §1 table row 1) | `scripts/compile-ir-es.mjs` (557 lines) | 3h |
| Atom registry file | `es/courseAtoms.ts` | 1h |
| Procedural-QA config + PT lexical sidecar (`simplemma` + `wordfreq` pt, venv) + baselines | `scripts/lexical/es/`, `scripts/lexical/fr/` (§12 of `procedural-qa-2026-09-17.md`) | 4h |
| TTS voice wiring (pt-BR-FranciscaNeural/AntonioNeural — no `pt` entry exists in `SAMPLE_VOICES` today, verified by grep) + `pt.json` manifest | `lingo-data/pipeline/tts/generate.py`, `add_alt_voice.py`, `manifests/es.json` | 3h |
| Placement bank stub + registration | `es/placementBank.ts`, `src/features/placement/questionBank.ts` (2118 lines) | 2h |
| i18n / course display strings | `languageConfig.ts` | 1h |
| Beta visibility (Spencer + friend only) — **no existing per-user allowlist mechanism found**; needs a small design decision from the infra lane, not resolved here | registered-not-selectable pattern + a new gate | 2h |
| `/pt/qa/m1` dev walk page | `EsM1L1Page`-style dev QA pages | 2h |

**Total scaffold estimate: ~21h**, before any m1–m5 content is authored.

**Numbers.** This deliverable: 5 lessons designed (L1–L5 of an assumed 8–10 lesson m1).
~34 new content atoms across L1–L5 (≤8/lesson × 5, minus 2 recalled) + PT's contraction
set (function words, not full atoms). Estimated distinct target sentences once authored:
~50–75 across L1–L5 (10–15/lesson counting build/cloze/listen targets, not counting
distractor text). Estimated clips: ~150–200 for L1–L5 (atoms + target sentences + win
lines). Lane-hour estimate: infra scaffold ~21h + L1–L5 authoring (scaled from
`fr-authoring-playbook.md`'s own measured ~1.3M-token/module cost, ~half a module here)
≈ 15–20 Sonnet-agent-hours + gates/QA pass ~4–6h Fable coordination.
