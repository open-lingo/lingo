# Spanish authoring scope — where ES stands, what the world does, what to build (2026-08-09)

**Status:** SCOPE (research + recommendation; nothing here is committed work)
**Raw research:** `docs/research/es-teaching-research-2026-08-09.md` (4-agent Sonnet pass: competitive teardown, SLA evidence, language-agnostic instruction, step-type gaps). In-repo sources: `es-content-quality-audit-2026-07-16.md`, `es-ja-parity-2026-07-15.md`, `es-rewrite-brief-2026-07-16.md`, `reverse-teaching-readiness-2026-07-29.md`, `research/multi-language-scoping-2026-07-11.md`. Counts marked *measured* were measured today against the working tree.

---

## 0. TL;DR

1. **ES is not greenfield — it's one wave behind JA.** A live, selectable 16-module A1 course (~128 lessons) was already rewritten to the JA density bar on 07-16 (18–22 steps/lesson, 66 selfExplains, 122 compounding-review draws, own CI quality gate). The Spanish is clean; the structure is good. What it lacks is everything JA gained *after* July 16: grammar SRS, review-lesson routing, IR authoring + the QA loop, and audio for the rewrite's new sentences.
2. **The cheapest, highest-leverage move is a "make-it-real" wave, not new authoring**: *measured* — **719 of 1,879 ES course texts (38%) have no TTS clip**; regeneration is build-time and costs ≈ $0 (edge) / <$1 (Azure fallback). Plus review-lesson routing (S/M), two-voice dialogues (S/M), and the first-ever ES learner-sim QA walk (the JA walk found 185 findings; ES has had zero).
3. **The research verdict on step types is: we need almost nothing new.** Of ~30 candidate mechanics across 10+ products, only four are genuinely new types, and only one Spanish-specific candidate needs new engine logic (aspect-choice narrative cloze — preterite vs imperfect where both options are valid morphology and discourse meaning decides). Everything else — accent placement, stress minimal pairs, gender sort, typed dictation, picture description — is a parameterization of types we already ship, consistent with the house "parameterize, don't fork" rule.
4. **The strategic opening is the A2 tier, not A1 polish.** Our A1 spine already converges with Vistas L1–L7 (gender→ser→estar→adjectives→tener→gustar, all present tense). The entire past-tense arc (preterite/imperfect — the classic EN→ES wall) is unwritten, and the competitive research says **nobody engineers a set-piece for the A2→B1 wall** — it's where Duolingo's plateau complaints live and where Vistas spends a third of its pages. Same shape as our JA bet: own the tier Duolingo scaled past with formula.
5. **"Teach anyone from anywhere" is validated and mostly designed already.** Duolingo's April 2025 shared-content wave (148 courses from one base, customized per L1) is exactly the anchor-keyed catalog architecture our reverse-teaching audit recommended. The one addition the research argues for: a per-L1 **weighting layer** (extra reps on concepts a learner's L1 lacks), not re-authoring. Market context: ~24.6M active Spanish students globally; English-L1 learners are likely a *minority* of them.
6. **Warning precedent:** Lingodeer — a CJK-flagship company whose Spanish course reviewers call visibly thinner than its JA/KO/ZH courses. That is the exact failure shape available to us, and the reason the make-it-real wave should precede any playtester push.

---

## 1. Where ES stands today (verified)

| Dimension | State | Evidence |
|---|---|---|
| Course | 16 modules × 8 lessons ≈ 128 lessons, CEFR A1, LatAm-neutral, tú default | `es-course-spine-2026-07-13.md` (archived; vocab tables still authoritative) |
| Quality bar | Rewritten to JA standard 07-16; `es-quality.test.ts` CI gate (density, no MCQ runs, ≥2 production/lesson, selfExplain, review tails) | `es-content-quality-audit-2026-07-16.md` §REMEDIATION |
| Language accuracy | Zero grammatical errors shipped as correct answers (16-module audit) | same audit, TL;DR |
| Production density | translate 164 · speaking 280 · build 269 · selfExplain 66 · review draws 122 (whole course) | same audit |
| ES-specific engine | `agreement_cloze`, ConjugationGrid (person×tense), accent accept-but-flag + AccentBar, language-keyed match pads, vocabTextMcq, derived test-outs 12/12 all modules | `es-ja-parity-2026-07-15.md` |
| **TTS** | ***measured today: 1,160/1,879 texts covered — 719 (38%) silent*** (rewrite sentences never generated); dialogues single-voice (Dalia detuned, no Jorge) | deck emit + manifest hash diff, 2026-08-09 |
| Grammar SRS (Track B) | **Absent** — no `es-grammar-points.json`; no grammar_rule cards, no reactive tips, no grammar deck | parity doc delta #5 |
| SRS review lessons | **Not routed** — machinery works for ES data, but no `es-mN-review-*` ids on any pathway; `REVIEW_LESSON_RE` is ja-shaped | parity doc delta #1 |
| Authoring pipeline | Hand-authored TS (~22k lines). No IR, no module-gate, no authoring-audit, no learner-sim QA has ever run on ES | INDEX.md; IR spec is ja-only |
| Reach | Selectable in-app (registry + routes enabled); ES UI locale shipped | `registry.ts`, TODO.md |

The 07-15 "do not ship es to learners before an editorial pass" warning was answered by the 07-16 rewrite — but no *learner-sim* verification ever followed. JA's walks surfaced 185 findings (53 blockers). ES has structurally identical risk with zero coverage.

## 1b. Measured walk — JA m3–m5-neo vs ES m1–m4 (2026-08-09, same day)

Spencer tried the ES course and didn't love it. A rendered-content walk (via `getMockLessonContent`, i.e. what a learner actually sees) of the first sentence-level modules on both sides says the *structure* lines up and names what doesn't:

| Metric (per topic lesson avg) | JA m3–m5-neo (28 lessons) | ES m1–m4 (32 lessons) |
|---|---:|---:|
| Steps | 20.8 | 18.3 |
| Production steps (build/translate/speak/listen-build) | 8.8 | 6.4 |
| Typed or spoken production | 3.8 | 3.7 |
| Passive cards (info/phrase/grammar_rule) | **0.8** | **2.8** |
| selfExplain | 0 (JA's live later) | 15 total |
| 3+ selection runs · adjacent same-type | 0 · 0 | 0 · 0 |
| **Audio texts with no clip** | **0% (0/220 listening steps affected)** | **41% (27/86 listening steps affected)** |

Three findings, ranked by likely contribution to the "didn't love it" feel:

1. **Audio inconsistency, not silence.** A manifest miss on ES falls back to *browser speechSynthesis tagged `es-ES`* (`shared/tts/index.ts` BCP47 map) — so ~41% of early-module sentences play in a robotic **Castilian** browser voice interleaved with recorded es-MX Dalia clips. m4 is worst (67% of its texts missing). This is precisely the "degraded/inconsistent TTS" complaint class that headlines Duolingo's AI-backlash. Fix = the Phase 0 TTS regen + set the es fallback tag to `es-MX` + **extend `audioCoverage.test.ts` to ES** so it can never re-drift.
2. **Comprehensibility debt in Spanish-language prompts.** The rewrite brief's de-leak rule ("make the learner read Spanish to choose") pushed MCQ prompts into Spanish with no comprehensibility bound — es-m2-2 asks *"Diego pregunta '¿quién eres?' Ana se señala a sí misma. ¿Qué dice ella?"* and metalinguistic *"¿Cuál es su infinitivo?"* at module 2, using untaught vocabulary (se señala, levanta la mano). JA machine-enforces "would they know this word yet" (the comprehensibility gate); ES has no equivalent. Note: already knowing Spanish HIDES this defect — a true beginner hits an unreadable wall where a knower reads past it.
3. **Passive-card density 3.5× JA** — the phrase-card→drill intro pattern (spine-sanctioned, audit-flagged as "the mechanical reason the course feels flat") survived the rewrite. JA introduces vocab through drills (`word_image_mcq` discovery); ES still deals passive cards, incl. for function words (`phrase("I am", "soy")`).

**Gate parity (answers "did we enforce the hard gates on everything?" — partially):**
- Ported and passing (walk-verified): density band, no adjacent same-type, no 3+ selection runs, production floors, selfExplain, static compounding-review check, answer-leak lint, passive-card spacing (`es-quality.test.ts` + per-module tests).
- **Not ported, and each maps to a live defect:** `audioCoverage` (render-side clip walk — JA-only; the 719-clip gap shipped invisible), comprehensibility gate (JA-only; the m2-2 prompts shipped invisible), gloss-before-production, MCQ-position distribution, recognition-exposure ratchet, tile-floor/distractor audits. Intro-before-review is moot until ES review routing exists.
- Recommendation: land the ES `audioCoverage` extension IN the Phase 0 TTS wave (gate proves the regen), and an ES comprehensibility gate (atoms + closed function-word allowlist over prompt/carrier text) + prompt de-escalation pass for m1–m6 in Phase 1. These two gates are the difference between "quality bar" and "quality bar that holds".

## 2. How the world teaches EN→ES — what actually matters for us

Full teardown in the research doc. The load-bearing findings:

- **Sequencing consensus exists and we already match it.** Vistas (the dominant US textbook): gender+ser → estar → adjectives → stem-changers → ser/estar contrast → object pronouns + preterite → gustar → … → subjunctive last (a third of the book). Our m1–m16 tracks its first seven lecciones almost exactly. The divergent school (Aula Internacional, task-based: grammar appears when a communicative task needs it) is a deliberate philosophy, not a correction. **Nobody publishes their sequencing** — doing so, with reasons ("ser/estar contrasted in m7 because acquisition research shows estar is acquired construction-by-construction"), is free differentiation.
- **The A2→B1 wall is unclaimed.** Duolingo's plateau complaints, Pimsleur's quit-at-month-six pattern, LingQ's "intermediate+ only" — all name the same zone: preterite/imperfect onset through subjunctive. No product engineers for it specifically. Our A2 tier can be *designed around* it (see §5).
- **Duolingo vacated the quality narrative** (AI-first backlash, contractor cuts, degraded TTS/Stories, CEO walk-back). "AI-assisted, human-verified, comprehensibility-gated" is a positioning we already genuinely practice on JA.
- **Speaking-with-feedback in the core loop is premium-gated everywhere** (Duo Max, Busuu Premium) or absent. Our `speaking` step is core-loop and Whisper-scored — for ES this needs the es scorer verified, but the positioning is real.
- **Progress credibility**: Cervantes' own hour ladder (A1=60h, A2=60h, B1=120h) and Dreaming Spanish's hour-gated levels are the trusted models. A Cervantes-anchored "you are ~N hours from A2" line on the ES map is cheap and no gamified app does it.
- **Pimsleur's anticipation drill** (produce before you hear confirmation) and **Mango's literal+idiomatic dual gloss** are the two competitor micro-mechanics worth stealing outright — both are parameterizations (speaking prompt-timing; a gloss-display variant).

## 3. What the evidence says to drill, mapped to our machinery

The SLA agent's findings land almost embarrassingly well on systems we already have:

| Evidence (strength) | What it says | Our hook |
|---|---|---|
| Pan et al. 2019 — *directly on Spanish preterite/imperfect drills* (strong) | Block a new paradigm within its intro session; interleave across later sessions | Exactly our lesson (blocked) + dynamic review (interleaved) split. Codify in the ES review-pool builder when Track B lands |
| PI / First Noun Principle (strong for comprehension) | For gustar/clitics/OVS: forced-choice items answerable only by correct parsing, BEFORE production; rule lecture largely dispensable | `multiple_choice`/`listening_comprehension` with misleading-word-order distractors; already half-present in m10-4; make it an authoring-brief rule for OVS structures |
| Transfer-appropriate processing (strong) | Recognition practice builds recognition; require a production-format retrieval before durable graduation | **We already track per-card `recognition`/`production` sub-states.** The gap is policy: long-interval graduation should require the production modality, not either |
| Untimed gender accuracy ≫ timed (strong) | Untimed MCQ over-reports agreement mastery | Timed "fluency rounds" drawing ONLY from mastered pool (Nation's fluency strand); `agreement_cloze` under mild time pressure as a review-only variant |
| Ser/estar acquired construction-by-construction (strong) | Don't teach one permanent/temporary rule; sequence formulaic→locative→adjectival→progressive | m7 re-audit against this order when ES gets grammar points; cheap re-sequencing, not re-authoring |
| Por/para image-schema beats use-lists on retention (strong, replicated) | Schema-first grammar cards | The `grammar_rule` step shape (rule + examples + anti-pattern) fits; write the ES cards schema-first |
| Corrective feedback: prompts > recasts; ~70% of recasts unnoticed (strong) | Error → salient flag + error-specific rule cue + **forced re-production** | Reactive grammar tips do flag+cue; the missing third is a replay of the failed step in production form — fits the existing lesson replay pass |
| CEDEL2 error corpus | Distractors from real errors: opaque-gender nouns, soy/estoy aburrido, false-friend tiers, rare por/para collocations | Build `esSiblingSets` (the JA sibling-distractor-bank pattern) seeded from the corpus taxonomy |
| HVPT minimal pairs g=0.92 (strong) | Perception training with talker variety works | `listening_comprehension` param: minimal-pair mode (hablo/habló); needs multi-voice clips — same work as two-voice dialogues |
| Cognate facilitation (strong mechanism, untested as curriculum) | Language Transfer's -ción/-dad derivation on-ramp is a bet worth instrumenting | A cognate-pattern lesson family in early A2; tag and measure, don't assume |

## 4. Language-agnostic: teach ANYONE from ANYwhere

The research **confirms the reverse-teaching architecture** (`reverse-teaching-readiness-2026-07-29.md`) is the industry-winning shape — Duolingo's shared-content system is our §3c catalog design at scale. What it adds:

1. **The mechanics shell is already L1-free.** Image↔word, audio↔image, TL-only cloze, matching, tiles, dictation, SRS — build once, serve everyone. Our grading is already instruction-language-clean (audited). The ES course's *steps* transfer to any instruction language via catalogs.
2. **The L1-coupled surface is narrow and enumerable**: translation steps, contrastive grammar prose, false-friend warnings, cognate sequencing, L1-framed pronunciation, glosses. System fixes: per-L1-pair false-friend tables (surface only to affected L1s), IPA/articulatory fallback for pronunciation, image glosses for concrete vocab.
3. **The one genuinely new idea: a per-L1 weighting layer, not re-authoring.** en→es learners need gender/agreement emphasis; zh→es learners need the entire conjugation system + articles. Keep vocab/dialogues/CEFR arc fixed; vary review-pool weights and scaffold-fade speeds per L1 family. This slots into FSRS difficulty priors (§6.4) rather than the curriculum.
4. **Authoring discipline now = options later.** The D1–D8 rules from the reverse-teaching doc apply verbatim to all future ES authoring (A2 wave especially). Cost ≈ zero if adopted at authoring time; a migration wave if not.
5. **Market stake:** ~24.6M active Spanish students; EN-L1 a minority (Brazil ~6.1M alone). An es-instructed-from-pt course is the cheapest reverse pairing on earth (Duolingo: "only a few changes"). Not now-work — but it's why D1–D8 discipline on the A2 wave isn't hygiene theater.
6. Small evidence-backed universal win: **color-code gender** in ES UI (article/noun tinting) — we already carry `gender` metadata on every noun atom.

## 5. Step types: needed vs parameterized

Verdict from the gap survey (strict, per the house parameterize-don't-fork rule):

**Genuinely new (candidates, not commitments):**
1. **Aspect-choice narrative cloze** — preterite vs imperfect in passage context where *both* options are valid conjugations and discourse meaning decides. Technically a `conjugation_cloze` extension, but the distractor logic is new (aspect-semantics, not misformation) and the carrier is multi-sentence. This is the engine piece the A2 set-piece needs. Size: M.
2. **Tap-to-gloss reading with per-word familiarity state** (LingQ's mechanic) — high-value for Spanish specifically (cognate density makes guess-then-verify reading unusually productive). We already have reading passages + atoms; the new part is per-word state feeding FSRS. Size: M/L. Also serves JA (B-item: at-level input library was gap #3 in the Duolingo survey).
3. **Open-ended LLM conversation** — the one big mechanic every premium competitor gates. We have `dialogue_sim` (scripted) and the deferred local-AI conversation-partner plan for JA; ES would ride the same build. Not ES-scoped; noted for the cross-language roadmap.
4. Async human-graded correction / image occlusion — real but low priority; skip.

**Parameterizations (content/config, no new types):** accent-placement (`fill_blank`/MCQ), stress minimal pairs (`listening_comprehension` + multi-voice clips), gender sort (`match_pairs` skin), typed dictation (`listening_build` with typed input — top rung of the listening ladder AND drills accent spelling; medium-high value), picture description (`speaking` open-prompt), spot-the-error (inverse `agreement_cloze`), translation-from-audio (`translate` param), Pimsleur anticipation timing (`speaking` param), Mango dual-gloss (display variant), branching `dialogue_sim` (data-model extension, decide when Travel-Sprint-for-ES comes up).

⚠ The Spanish-candidates section of report 4 was compiled from model knowledge after its sub-search failed — spot-check "no major app does accent-placement drills" before treating it as whitespace.

## 6. Pedagogical optimizations with current step types (fun preserved)

Ranked, filtered to what fits our architecture; most benefit JA too:

1. **Production-gated SRS graduation** — require a production-modality success before long intervals. Uses existing dual sub-state cards; policy change in the scheduler + review-pool step selection. (S/M)
2. **Forced re-production on error** — the mistake-replay pass re-serves the failed item in production form with the rule cue, instead of a bare correct-answer reveal. Extends the existing replay pass + reactive tips. (S/M)
3. **Speed rounds from the mastered pool only** — adds the fun of Duolingo's match-madness without its pedagogy cost; Nation's fluency strand says timed work on known material is *good*. A review-surface mode, no new step types. (M)
4. **FSRS difficulty priors from item metadata** — HLR's actual innovation. Seed priors per grammar tag (irregular preterite > regular -ar present) and per L1-weighting (§4.3). (M)
5. **Latency/hint-aware grading** — slow-correct strengthens less than fast-correct (Birdbrain pattern); we already capture the interaction. (M, needs care not to punish deliberate learners)
6. **Concept interleaving in review assembly** — ensure the dynamic review prefix mixes contrasting grammar points (pret/imp items shuffled together once both exist) — Taylor & Rohrer's 3× delayed-recall effect is about rule discrimination, not step-type variety. (S, builder change)
7. **PI ordering rule for OVS/parsing-trap structures** — authoring-brief rule + es-quality ratchet: referential-SI comprehension beats before first production beat for gustar/clitics. (S, authoring law)
8. **Surprise-weighted placement updates** — fewer items, same precision in placement/test-outs. (M)
9. Keep: no hearts (documented-harm mechanic we correctly lack), immediate non-variable item feedback, streak-freeze-by-default if streak stakes ever rise.

## 7. Proposed scope (phased, sized)

**Phase 0 — Make the existing course real (prereq for any playtester push):**
- TTS regeneration: 719 missing clips — emit → `pipeline.tts.generate --lang es` → manifest diff → upload (Trevor's creds). Cost: ≈$0 edge / <$1 Azure; the deck emitter walk is already env-gated and working (*measured today*). (S)
- Two-voice dialogues: per-card voice in deck + Jorge for speaker B. (S/M)
- ES review-lesson routing: `es-mN-review-*` pathway ids + de-ja-shape `REVIEW_LESSON_RE`; the builder already works for ES data. (S/M)
- **First ES learner-sim QA walk** (m1–m16) + fix wave. The JA precedent predicts a real findings list; this is the ship-confidence gate. (M — the largest Phase 0 item)

**Phase 1 — Grammar depth parity (the JA differentiators, on ES):**
- `es-grammar-points.json` (A1 set ≈ 40–60 points) → Track B grammar SRS + grammar review pools + reactive tips. Engine is language-agnostic by design; this is authoring. (M)
- `grammar_rule` cards, schema-first where evidence says (por/para, ser/estar constructional order). (M, folds into the same authoring wave)
- `esSiblingSets` + CEDEL2-informed distractor bank; opaque-gender + false-friend tiers. (S/M)
- es-quality ratchets for PI ordering + review-tail interleaving. (S)

**Phase 2 — The A2 tier (m17+): the actual growth bet.**
- Spine: preterite/imperfect as a designed multi-module set-piece (aspect-choice cloze engine + ConjugationGrid preterite/imperfect tabs — data for 18 forms already ships), object pronouns, ser/estar deepening, cognate-derivation lesson family (instrumented). Sequenced publicly, with reasons (whitespace #1).
- **Decision needed: extend the IR compiler to ES first.** Recommended yes — it buys module-gate, authoring-audit, learner-sim tooling, and catalog extraction (D1–D8) for the whole tier, and avoids growing the 22k-line hand-TS estate. Engineering M before the authoring L.

**Phase 3 — Anyone-from-anywhere (deferred, design-ready):** catalog extraction + first reverse instruction language. Sequencing per the reverse-teaching doc (ko→ja first is still the right pilot; es-from-pt is the cheapest ES pairing when its turn comes).

Cross-cutting (any phase): optimizations §6.1–6.3 — they compound every course.

## 8. Open decisions for Spencer

1. **Playtester gate:** is Phase 0 (audio + QA walk) the bar before handing ES to the Spanish-requesting testers, or do they get it warts-and-out as a feedback source? (My read: audio at 62% coverage is the credibility killer; TTS + walk first.)
2. **IR migration for ES** before the A2 wave: yes/no (recommended yes; it's the difference between A2 inheriting the JA QA loop or not).
3. **A2 commitment**: the research says A2→B1 is the strategic opening, but it's a JA-scale authoring investment competing with the live N4 wave for authoring bandwidth.
4. **Grammar-points authoring** (Phase 1) can precede or ride the A2 wave — precede, if grammar SRS for existing A1 content matters for testers.
5. Whether to adopt any Phase-0-adjacent quick wins into the same wave: gender color-coding, Cervantes hours-to-level line on the ES map, typed-dictation param.
