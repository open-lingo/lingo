# Spine draft-2 — adversarial audit findings (2026-07-19)

Three independent adversarial passes over `spinePlan.ts` draft-2
(linguistics, implementation-vs-codebase, learner-experience), each
instructed to refute. Compiled; severity is the auditor's. Full agent
reports were session-ephemeral; everything decision-relevant is here.

## Convergent HIGH findings (multiple lenses hit independently)

### A. Closed-class systems that NO TILE OWNS — the biggest hole class
- **が is never taught.** Appears only fused in patterns (のがすき,
  ことがある, のほうが). n06a's existence sentences are BUILT on が.
  Cure Dolly cited 3× as parity while her whole method is が-first.
- **Question words have no home**: 何 #19, どう #60, どこ #96, いつ #149,
  なんで — none in any teaches list. Traveler can't ask where anything is
  (どこ costs one line in n06a, which already salvages a directions
  dialogue containing it).
- **No no-words**: いいえ/ううん/ちがう (#68!) absent while the yes-triple
  got a named slot. うん without ううん = unflagged minimal-pair hazard.
- **Survival phrases re-stranded**: すみません/ありがとう/ごめん/
  だいじょうぶ/ちょっと (#41) in zero tiles — the audit ordered this fix
  and draft-2 only re-homed the yes-words.
- **Copula paradigm never completed**: だった smuggled in a parenthetical,
  じゃない filed under adjectives, じゃなかった NOWHERE.
- Also absent: もう #31/まだ #117 (the canonical ている spend), やる #36
  (the casual する, while lower-ranked かう/きく made the seed set).

**Auditor's meta-diagnosis (adopt for draft-3): the plan is strongest
where Spencer's review forced splits, weakest where no tile owns a
closed-class system. Fix = a closed-class coverage checklist + lint,
not more reordering.**

### B. s07 is a 9-concept avalanche that violates its own thesis
Learner lens counted: stem grid, ます derivation, ません/ました/
ませんでした (3 cells), です+"です≠だ", か, yes-triple, pronoun register,
the register-explicit mechanic debut, romaji cutoff — all in one module.
Linguistics adds: **ました/ませんでした teach polite past two modules
before plain past exists** (inverts "polite is a layer on plain");
"か as the POLITE question marker" is a false generalization (embedded
questions need plain か; casual questions use の); the yes-triple differs
in FUNCTION not just register (はい as aizuchi ≠ agreement).
NOTE: Spencer's draft-1 "keep" predates the draft-2 additions — the
verdict doesn't cover the tile as it stands.
Fix direction: s07 = ます/ません + the register mechanic only; polite
past joins n04 beside た; ませんでした joins s13 beside なかった;
yes-triple + pronouns move to a lighter beat (n03 shops hear はい/ええ).

### C. "In-place 7 waves" is borderline incoherent against the codebase
Implementation lens, receipts at file:line in the agent report:
- **Push-later moves break un-rewritten consumers**: wave 1 makes m5
  verbs; numbers don't exist again until wave 2 — meanwhile old m12
  (hours), m14 review pools (`fromModule === "m5"` filters), and
  intro-before-use lints all still assume old m5. In-place waves only
  work for pull-earlier moves.
- **Atom-id corruption**: 269 atoms have module-embedded ids;
  N5_KANJI anchors number kanji to literal `ja-m5-*` ids — delete them
  and number kanji silently drop from eligibility; REUSE the namespace
  and the kanji pass resolves a different word.
- **Register mixing is structural during rollout**: the sentence miner
  is register-blind and course-global; after wave 1 SRS reviews serve
  plain sentences into the polite stretch and vice versa. No mid-rollout
  consistent state exists for: n5Kanji schedule, miner register,
  cross-module review pools.
- **Kanji ladder needs re-derivation**: new m8 (て) has zero m8-anchored
  vocab (recognition starts vacuously); number-kanji furigana window
  half-spent before numbers are taught; adjective kanji unlock 2 modules
  before adjectives.
- **TTS salvage optimistic**: m3-v2 has 383 です occurrences — "copula
  reframe only" = re-record nearly every sentence clip. Estimate: word
  clips ~90% salvage, sentence clips in flipped/moved modules ~10–20%.
  JA manifest misses are SILENT by design → full TTS rerun gates every
  wave ship.
**Realistic delivery shapes: (1) one atomic m3–m14 mega-wave, then small
waves; or (2) parallel course id + migration. The 7 independent waves as
drawn are not shippable.** ← needs Spencer's re-decision.

## Other HIGH
- **Anime-learner decode tools end-loaded**: ている mod 15, してる mod 28,
  んだ mod 26 — the highest-frequency anime patterns explained
  second-to-last. Fix: recognition-preview cards riding n06b/n08.
- **Traveler asks-where never**: navigation kit at mod 18; どこ never
  taught (see A).

## MED (selected, decision-relevant)
- **Spiral needs consolidation + retention insurance**: the 2×2 plain
  paradigm (nonpast/past × pos/neg) is never shown as one object after
  the sprinkle (add a synthesis card in s13); deepen beats sit 7–9
  modules after intros and silently assume SRS compliance — every deepen
  beat should open with an unconditional 60-second intro-beat rehash.
- **だろう production trap**: blunt/masculine; drill でしょ(う)/かな for
  production, だろう recognition + 何だろう self-talk only.
- **おいしい #95 over うまい #197** in the s09 set (register hazard picked
  over the frequency winner). ら抜き (食べれる) needs a recognition line
  in s21. たい/ほしい need a 1st-person authoring constraint. ぼく/おれ
  must stay recognition-capped in n07 (currently drifts).
- **とき hides relative tense** (行くとき vs 行ったとき) — restrict s11 to
  matched-tense; the contrast belongs to the s22 deepen.
- **n04 still stacks 6 things + a new mechanic**; push days-of-week to
  the drip. The advisory gate as specced is DOA: the only mastery
  definition is 21-day FSRS and n03/n04 are adjacent — needs a
  recall-based check + UI plumbing that doesn't exist.
- **Wave-3 grammar wall**: 4 abstract modules (s09→n05→s11→s13), an
  11-module milestone drought; swap s13↔n06b to break it (also shortens
  the n02 spiral gap).
- **Register-doubling drill tax**: both-registers production on every
  concept ≈ 2× drills; scope fresh-drills to the new concept's registers,
  warm-keeping belongs to SRS.
- **Drip threads unassigned = the ぜんぜん failure recurring**: add a
  lintable `carries: []` per tile against the thread's rank list.
- **Capstone fail-routing overstated**: ordinary steps carry no concept
  tag (only exercisedAtoms); routing needs a per-step concept-tag schema.
  m28 capstone sentinel (`CAPSTONE_MODULE_IDS`), per-module complexity
  floor calibrations, and recognition-only atoms (やばい/まじ vs
  invariant 14's ≥3-surfaces) all need explicit handling.
- **Katakana homeless**: only ア-row + "continues" are scheduled; 8+ rows
  unassigned; the m17 cutoff constant + invariant doc + QA contracts must
  move in lockstep with whatever wave shifts it.
- **Placement banks test the old curriculum** per slot (pt-m5-num at a
  verbs module, etc.) — stage-1/2 items need re-authoring per wave;
  test-outs self-heal (derived).
- **m29/m30 absorption double-ships then orphans** — interim learners see
  the same drills twice; deletion orphans lesson progress; atom-id moves
  need the existing srsAtomIdMigration machinery budgeted.

## Attacks that FAILED (the spine holds here)
て-before-た derivation (Genki direction, coherent); counter drip;
ください-before-numbers (adjacent, deliberate); function-noun-with-grammar
principle (こと/とき/ほう/もの); frequency-picked seed verbs; s17
body/health placement (corpus-validated); potential formation as
corrected (godan e-stem / ichidan られる / できる); です≠だ framing;
もの compositionality; test-out derivation and visual-QA contracts
self-heal per wave; register-explicit-early is UNVALIDATED but
unrefuted (flagged as a bet, not an error).
