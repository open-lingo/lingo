# Spine draft-4 (2026-07-26) — proposal

**Status:** PROPOSAL for Spencer. Supersedes `spinePlan.ts` draft-3 once approved.
Inputs: Spencer's tile-by-tile notes (`spine-plan-review-draft1-2026-07-19.json`),
the three adversarial passes (`spine-draft2-adversarial-audit-2026-07-19.md`),
draft-3 as shipped in `src/features/lesson/dev/spinePlan.ts`, and the
2026-07-26 module-shape ruling (invariant 25).

## What draft-3 already fixed (verified in code, not assumed)

Re-checking the audit's HIGH findings against the shipped plan:

| Audit finding | State in draft-3 |
|---|---|
| **が never taught** | FIXED — owned by `n06a`, taught at ねこがいる/テレビがある |
| **s07 = 9-concept avalanche** | FIXED — `n15` split out; polite past de-stacked to `n04`/`s13`; か reframed |
| **じゃない homeless** | FIXED — lands in `n06a` beside ない |
| **どこ homeless** | FIXED — `n06a` with the demonstratives |
| **Wave-3 grammar wall / s13↔n06b swap** | APPLIED — order is now s09→n05→s11→n06b→s13 |
| **Closed-class checklist** | DECLARED in `thr1`, but ownership is still unassigned for most items (below) |
| **Delivery shape ("7 waves not shippable")** | STILL OPEN — this doc rules on it |

So draft-4 is a smaller delta than the audit's length suggests. Three things
remain: the delivery ruling, the unowned closed-class residue, and the
consequences of the new module shape.

---

## 1. Delivery shape — RULING (resolves audit finding C)

The audit offered two shapes: one atomic m3–m14 mega-wave, or a parallel
course id with migration. **Take neither. Abandon "waves" as a delivery unit
entirely — the unit is a MODULE, authored in strict course order.**

Every failure the audit lists traces to the same root: *push-later* moves,
where content migrates to a higher module number than it occupies today, so
un-rewritten downstream modules reference things that no longer exist yet.
Sequential in-order replacement has no such state. Each module is authored
against a context pack built from the real prior modules, and everything a
downstream old module depends on has already been taught by the time it's
reached.

This is also what the workflow already does (`authoring-workflow.md`
§"Why SEQUENTIAL"). Draft-2 invented waves as a parallelisation device and the
audit correctly killed it. Wave numbers survive in draft-4 **as descriptive
planning groupings only** — they are not delivery batches and nothing should
key off them.

Residual risks this does NOT solve, each with an owner:

- **Register mixing across the frontier.** Live today: m6-neo ends plain, old
  m7 opens polite with no bridge. Self-resolving the moment m7 is authored as
  `s07` (the ます module) — which is the next module in the queue. Until then
  it is a real learner-facing cliff, not a hypothetical.
- **The sentence miner is register-blind.** The IR has carried a
  `register:` field since m6 and *nothing reads it* (same class of defect as
  the dead `exercises:` field, now fixed). Read it and filter the miner before
  cross-module review draws start pulling plain sentences into polite modules.
- **Atom-id corruption / `N5_KANJI` anchors.** 269 atoms carry module-embedded
  ids. Budget `srsAtomIdMigration` per module rather than per wave.
- **TTS.** Full manifest rerun already gates every module ship; unchanged.

---

## 2. Module shape (invariant 25) and its capacity consequence

Each module is now **12–15 lessons = 8–11 teaching + 3 review + 1 challenge**,
reviews at the beginning/middle/end thirds, challenge lesson always last.

**This is a capacity cut nobody has costed.** The old shape was 11 teaching
lessons; the new floor is 8. A module built at the 12-lesson floor delivers
**27% less teaching capacity** than the shape the N5 content estimates
(~70–80 grammar points, ~800 words) were sized against.

**Recommendation: 15 (11 teaching) is the DEFAULT.** The 12-lesson floor is
for genuinely light modules only — never a convenience. If a module can't fit
its allocation in 11 teaching lessons, that is a signal to split the module,
not to overfill lessons past the 18–24 step band.

---

## 3. Closed-class ownership — MOSTLY ALREADY DONE (corrected 2026-07-26)

**Correction:** this table was built from the draft-2 audit without checking
where draft-3 had actually placed things. Re-verified against
`spinePlan.ts`: draft-3 already owns **何** (s04), **いつ** (n04), **どう**
(s09), **いいえ/ううん/ちがう** and **ちょっと** and **だいじょうぶ** (n15),
the **survival formulas** すみません/ありがとう/ごめんなさい (s03 micro-beat),
**やる** (s05 seed set), **もう/まだ** (n06b), **だった** (n04), and the
**2×2 paradigm synthesis card** (s13). The table below is retained as the
coverage checklist, but only two rows were real gaps:

- **じゃなかった** — owned by no tile through draft-3. **FIXED**: now lands in
  s13 with なかった/ませんでした, completing verb AND copula past-negative
  together.
- **なる (#39)** — see §4b. **FIXED**: moved s23 → s09.

| System | Item | Owner (draft-4) | Rationale |
|---|---|---|---|
| Question words | 何 (#19) | **s04** | これは何？ is the canonical first question and s04 already owns これ/それ/あれ. Currently the single highest-frequency question word with no home. |
| | どこ (#96) | n06a ✓ | already assigned |
| | いつ (#149) | **n04** | the time module is where "when" has content to ask about |
| | どう (#60) | **n15** | どう？ is an interaction move, not a content question |
| | なんで | s23 | rides the explaining module (んだ pairs with it naturally) |
| No-words | いいえ / ううん / ちがう (#68) | **n15** | うん without ううん is an unflagged minimal-pair hazard; n15 already owns the yes-triple |
| Copula cells | だ ✓ / じゃない ✓ | s03 / n06a | shipped |
| | だった | n04 | beside plain past た |
| | **じゃなかった** | **s13** | currently owned by NOTHING in draft-3. Completes the 2×2 beside なかった/ませんでした. |
| | 2×2 synthesis card | **s13** | audit MED: the paradigm is never shown as one object after the sprinkle |
| Survival formulas | ありがとう / すみません | **s03–s04 as vocab** | unanalyzable chunks — legal as plain vocab, and too useful to strand at m10. Invariant 33 forbids smuggling them into dialogues, so they need a real intro step. |
| | ごめん / だいじょうぶ / ちょっと (#41) | **n15** | these carry register/softener nuance, which is n15's job |
| ている spend | もう (#31) / まだ (#117) | **n06b** | audit: the canonical ている pairing, currently absent |
| Verbs | やる (#36) | **s05 seed set** | the casual する, outranks かう/きく which did make the set |
| Katakana | rows beyond ア | **UNASSIGNED — see gap 5** | |

---

## 4. Sequencing changes I propose

**4a. Move `n06b` (ている + permission) ahead of `s11` (relative clauses).**

Draft-3 order: s09 → n05 → s11 → n06b → s13.
Draft-4 order: s09 → n05 → **n06b → s11** → s13.

The audit's swap broke the wall's tail but left its worst tile in the middle.
Relative clauses are the most abstract structure in N5; ている is concrete,
top-frequency, and the single highest-value decode tool for anime/native
input. Teaching the abstract one first, then the concrete one, inverts the
difficulty ramp for no prerequisite reason — ている needs only て (n02, wave 2)
and s11 needs only plain-form verbs (s05, wave 1). Both are already satisfied.
This also shortens the n02⟳n06b spiral gap, which the audit wanted.

**4b. Pull なる (#39) forward to `s09`.**

Draft-3 teaches なる at `s23` (wave 6). It is a **top-40 corpus word** sitting
second-to-last. It also belongs with adjectives pedagogically — たかくなる /
しずかになる is how every mainstream course introduces it, because the
adjective-stem rule is the lesson. Leaving it at s23 means the adjective
module teaches the stem transformation and then never spends it.

**4c. Add recognition-preview cards for んだ/してる at `n06b`/`n08`.**

Audit's "anime-learner decode tools end-loaded" finding. Production stays at
s23 where it belongs; recognition rides earlier. This is a preview *card*, not
a taught production target — consistent with the です/ます precedent in rule 7.

---

## 5. Logical gaps — things no one has raised

**5a. The spine has no per-module VOCAB ALLOCATION. This is the big one.**

Invariant 16 says "never invent vocab outside the module's allocation
(spine doc)" — but `SpineUnit` has no vocab field. `teaches` carries grammar
and concepts only. There is no allocation to author against, and no way to
check that the ~800-word N5 target is actually distributed.

The Spanish course did have per-module vocab pre-allocation, and the record
names it as the method that worked. Its absence here is the most likely
structural cause of the いくら/えん/いらっしゃいませ leak into m5: with no
allocation, an authoring agent picks whatever the sentence needs.

**Proposed: add `vocab: { count: number; must: string[]; prefer: string[] }`
to `SpineUnit`**, seeded from the CEJC audit, and lint the sum against the N5
target. This should land before m7 is authored.

**5b. Katakana has no ladder owner.**

Only the ア-row plus "continues" is scheduled; 8+ rows are unassigned. The m17
romaji cutoff constant, the pinned invariant, and the QA contracts all
reference a schedule that doesn't exist. Hiragana got explicit per-module row
assignment; katakana needs the same or the cutoff is unenforceable.

**5c. Kanji anchors need re-derivation against draft-4 order.**

Recognition starts m8 with a furigana window of unlock+2. If m8 becomes the
て-form module (zero m8-anchored vocab), recognition starts vacuously.
Number-kanji windows half-expire before numbers are taught. This must be
recomputed against the final order, not carried forward.

**5d. Placement banks test the old curriculum.**

Stage-1/2 items are slot-mapped to old module contents (`pt-m5-num` at what is
now a verbs module). Test-outs self-heal because they're derived; the
placement bank does not. Re-authoring is per-module work that should ride each
module's cycle rather than being discovered at N5 completion.

**5e. `s25` (N5 capstone) has a routing dependency that doesn't exist.**

Spencer's note: "if they fail any lesson we need a good way to direct them to
reviewing it." The audit found ordinary steps carry no concept tag — only
`exercisedAtoms`. That is now **half-solved**: as of 2026-07-26 the compiler
emits `exercisedGrammar` from `exercises:`, so grammar-level fail-routing is
newly possible. It still needs the IR↔registry id reconciliation (1 of 21 ids
currently match) before a failed capstone step can point at a real review.

---

## 6. Pedagogy critique — where I'd push back on the plan itself

**The spiral is specified but unmeasured.** `thr1` requires deepen beats ≥3
modules after their intro, opening with a 60-second rehash. Nothing checks
either condition. Given the project's own finding that soft rules decay ~8×
faster than hard ones, an unlinted spiral rule will drift within two modules.
The `spiralWith` field already exists — the gap distance is trivially lintable
and should be.

**Register-explicit-early remains an unvalidated bet.** The audit flagged it as
"unrefuted, not validated," and draft-3 kept it. It is worth naming that this
is the plan's single largest untested pedagogical assumption: that naming the
audience on every production prompt from s07 onward improves register control
rather than adding cognitive load. It is cheap to A/B once the course is being
daily-driven, and expensive to unwind at m20.

**Three review lessons per module is now doing double duty, and only one job
is designed.** Invariant 25 scopes them to this-module content. But they are
also the *only* surface where Track B grammar SRS grading is enabled. Those
two purposes pull in different directions: module-scoped drilling wants recent
material; grammar SRS wants whatever is due. Until the grading gate is widened,
every grammar point's spaced review is hostage to whether its owning module's
review lessons happen to resurface it.

**The course still has no explicit listening-to-speaking ratio.** Production is
well covered (build/translate/speaking) and listening comp exists, but nothing
in the spine or the invariants states a target balance, so it is whatever each
module's author happened to do. For a learner whose stated goal includes
understanding native input, that is a policy that should be chosen rather than
emergent.

---

## 7. RULINGS (Spencer, 2026-07-26)

Recorded verbatim-in-substance so nothing is lost. Each maps to the section above.

### §1 Delivery — ACCEPTED (module is the unit, waves are descriptive)

- **1a · Register frontier.** m7 as the polite introduction is correct. From
  there polite is **interleaved through the rest of the course but stays LESS
  COMMON than plain**. The interleaving is mainly *the rest of the politeness
  system* — politeness grammar, particles, word choice — **not** re-running
  ordinary sentences in polite form. Overusing polite sentences is the failure
  mode to avoid.
- **1b · Sentence miner.** "I don't know the miner, just make that work." →
  Claude's call whether the register fix is manual or mechanical.
- **1c · Atom ids / kanji anchors.** Folded into the vocab work: build a **NEW
  word list for the neo course**, ranked **Core2k-frequency-list style**, then
  slot in words that are (a) easy to teach, (b) good for new learners, (c)
  culturally relevant. Priority order = core + new-learner words + anything
  that carries a taught kanji. **Culture arrives mostly via side quests**, only
  partially in-course. Prior art exists — reuse it or rebuild on its design.
- **1d · TTS.** Fine as-is. No action.

### §2 Module shape — REVISED (supersedes the 12–15 band)

**The floor is ALWAYS 11 teaching lessons.** 3 review lessons is the standard.
**More teaching lessons are allowed when a module needs them** — there is no
hard ceiling. So: **≥11 teaching + 3 review + 1 challenge = ≥15 lessons.**

### §3 Closed-class ownership — "resolve as needed" (Claude's call)

### §4 Sequencing — APPROVED

Make the swaps (n06b before s11; なる to s09; recognition previews), then
re-review on the spine planner dev page.

### §5 Gaps

- **5a · Vocab allocation** — resolve via the §1c frequency work. Labeling
  should be **programmatic**, and must fit the authoring process as it now
  stands (context pack → IR → compiler → gates).
- **5b · Katakana — RULING.** From **m7 on, every module carries ONE katakana
  teaching lesson**, added as needed until the learner has them all. Teach the
  **rows only**. Yōon and dakuten/handakuten are conceptually identical to
  their hiragana counterparts — **one glance-over pass covers them**, not a
  lesson each.
- **5c · Kanji anchors** — fix after the reorder lands.
- **5d · Placement banks** — relabel whatever needs relabeling.
- **5e · Capstone fail-routing** — teach it gracefully if feasible; acceptable
  to future-scope if the effort is disproportionate.

### §6 Pedagogy

- **Register — RULING.** **Favor casual until roughly m16.** The learner must
  understand the simplest form of the system before other usages are layered
  on. (Reconciles with 1a: m7 introduces polite; production stays
  casual-dominant until ~m16.)
- **Spiral lint (§6.1) and review-lesson double duty (§6.3)** — resolve both.
- **Listening : speaking ratio.** Target **roughly even**, with **backfill
  steps for listening if a learner turns audio off**.

---

## 7b. RULINGS round 2 (Spencer, 2026-07-26)

- **Katakana start = m7**, not m3 — a buffer of ~4 modules first. 2 row-lessons
  per module, **counting toward the 11 teaching lessons**. 10 row-lessons
  (9 `HIRAGANA_ROWS` shapes + the ア-row) → **m7, m8, m9, m10, m11**, complete
  at m11. Yōon and dakuten/handakuten are NOT taught — their function transfers
  from hiragana; one glance-over pass only.
- **Listening-off / speaking-off.** Session-scoped toggles (Duolingo-style),
  and **the authored steps stay IDENTICAL for learners who keep audio on**.
  The fallback is therefore a DERIVED substitution at render time, never a
  second authored variant: `listening_build` → `build_sentence` (drop audio,
  keep tiles), `listening_comprehension` → text→meaning MCQ (a reading
  exercise), `speaking` → typed `translate` (production is preserved, not
  skipped).
- **Soft ceiling: 20 lessons**, with m1/m2 exempt (kana trainers, different
  taxonomy). Above 20 → a "split this module" diagnostic, not a hard failure.
- **Listening balance denominator** — Claude's call, taken as
  **listening ≈ PRODUCTION** (speaking + build + translate), not
  listening ≈ speaking alone. Speaking is mic+ASR (least reliable grading,
  unusable in public); pinning the ratio to it would distort the course.
- **ます retention.** Accepted: ます/です ride Track B so the grammar scheduler
  keeps them warm, their sentences are scheduled into review lessons, **plus
  an explicit refresher beat when the rest of the politeness register opens
  (~m16)**.
- **Polite-production share (lintable).** **50/50 from m20 on.** Before that,
  plain-preferred on a ramp — proposed: **≤15% m7–m11, ≤20% m12–m15,
  ≤30% m16–m19, 50% m20+**. This is the number that makes "less common than
  plain" enforceable instead of decaying.
- **ください is NOT a register problem** (asked/answered): `n02` = m8 lands one
  module AFTER ます at m7, and 〜てください is a lexical formula rather than the
  ます paradigm.

### m7 start — SETTLED (Spencer: "start at 7 … just go with that")

The 4-module buffer (m3–m6) is deliberate and protects the foundational
sentence-engine modules, which keep all 11 content lessons. m7 does carry
three loads at once — `s07`'s stem grid + ます/です + か + the
register-explicit mechanic debut, the hiragana romaji cutoff, and the
katakana ladder start — with content capacity at 9 for m7–m11. Recorded as a
**watch-item for the m7 authoring cycle**, not a blocker: if m7's IR won't fit
9 teaching lessons, the soft-ceiling diagnostic (§7b) is the mechanism that
surfaces it.

### Still open: the katakana romaji cutoff is now too late

Separate from the start date — this is a script-ladder CONSTANT
(`romajiAutoFlip.ts`), not a lesson count. With katakana complete at m11, the
current **m17** cutoff leaves ~6 modules of crutch past mastery, and the spine
re-anchors it later still (s15/m19). Recommend **~2 modules after the last
row-lesson (m13)**. Needs a call when the reorder lands.

## 8. Open questions arising from the rulings

1. **Does the katakana lesson count toward the 11-teaching floor?** Read as
   ADDITIONAL until told otherwise → m7+ floor becomes 11 content teaching + 1
   katakana + 3 review + 1 challenge = **16 lessons**.
2. **Listening-off mode does not exist.** Verified: `settings/types.ts` and the
   settings panel expose TTS autoplay suppression, volume, and a UI-sfx toggle
   — there is **no listening-step toggle and no non-audio fallback path**. The
   backfill ruling therefore describes a NEW feature, not a repair. Scope
   needed: full listening-off mode with substitute steps, vs. guaranteeing
   every listening step has a text-equivalent twin.
3. **Side quests are DELETED** (2026-07-16 — all side-quest lesson content,
   `TravelSprintPage`, routes and registry entries; every quest tile is
   `comingSoon`). "Culture mostly via side quests" is blocked on rebuilding
   that system. Interim options: carry culture in-course until quests return,
   or stand the quest shell back up first.
4. **Core2k vs CEJC.** The existing audit ranks against **NINJAL CEJC spoken
   top-500** (`docs/data/ja-top500-cejc.json`). Core2k is a different,
   more written/JLPT-leaning list we do not have. Reading "Core2k style" as
   *frequency-tiered in that manner*, not as that literal word list. Either
   way the list must be **extended past 500** — N5 needs ~800 words.
