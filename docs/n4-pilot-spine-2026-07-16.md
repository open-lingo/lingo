# N4 pilot spine — m29 & m30 (plain form)

> **🗄️ SUPERSEDED 2026-08-06 — HISTORICAL ONLY.** The pilot is over. Its m29
> was renumbered away by the N5 rewrite spine; its m30 ("Casual register",
> `curriculum/m30.ts`) is being RETIRED so the real N4 tier can open at m30 =
> n4-01, per `docs/spine-n4.md` §0 (Spencer ratified 2026-08-06). Do not author
> against this doc. The live N4 authoring source of truth is `docs/spine-n4.md`;
> the current plan is
> `docs/superpowers/specs/2026-08-06-n4-open-and-transform-teaching-design.md`.
> Kept for the vocab-gap analysis noted below and for the record of what the
> pilot taught.

> **⚠️ FORWARD-RISK BANNER (2026-07-20).** This doc's foundational premise —
> that PLAIN FORM is an N4/m29+ innovation layered on a polite-first N5 course —
> is being DISMANTLED by the dict-form-first rewrite (plain form is now the
> taught base from m3-neo; see `authoring-invariants-pinned.md` §Register rule 7).
> Once the rewrite reaches these modules the "plain form starts here" framing is
> void. What REMAINS VALID and load-bearing: the m23–m28 vocab-gap / anchor-overlap
> analysis below (the rewrite has not reached m23+ yet). Use this doc for the vocab
> map, not for register sequencing.

2026-07-16. Vocab pre-allocation + grammar contract for the **two pilot modules** of the N4
tier. This is the artifact the authoring agents build from; it exists because the es A1 wave
proved that per-module vocab pre-allocation is what lets parallel agents author whole files
with zero collisions.

**Scope: m29 and m30 only.** The full N4 spine (m29–m55) is a later task and must not be
inferred from this doc.

---

## Corrections to `n4-scoping-2026-07-16.md` (verified against the code)

That doc was read-only recon by an agent and has three errors that matter. Do not treat it as
a spec.

1. **N4 starts at m29, not m28.** `m28` is already taken — it is the **N5 Mastery Capstone**
   (`mockCourse.ts:938-949`, review-only, "You made it!"). Its two review lessons are derived,
   not hand-authored. m28 is therefore the natural **transfer station** / graduation point
   between the N5 map and the N4 map — a better interchange than the doc's m27.
2. **The 218 `future` atoms are not an N4 pool.** They are N5 backlog (ぷりん, ぺん, きょう,
   からだ…). N4 vocab must be authored fresh. The doc's "pre-attributed pool already exists to
   draw from" is wrong.
3. **m23–m27 already teach ~5 of the doc's 12 proposed N4 anchors.** The N5/N4 boundary in this
   course is blurry:

   | Doc claims new for N4 | Actually already shipped |
   |---|---|
   | potential form (doc m32) | `m23` — できる ("Can do", `ja-m23-8-1`) |
   | 〜たことがある (doc m34) | `m25` — ことがある ("Have you ever?") |
   | つもり / 予定 (doc m35) | `m25` — つもりです ("I plan to…") |
   | 〜たほうがいい (doc m31) | `m27` — 〜ほうがいい ("Should") |
   | 〜すぎる (doc m36) | `m26` — 〜すぎる ("Too much") |

   The genuine N4 grammar gap is ~9–10 anchors: plain form + casual register, relative clauses,
   the four conditionals (たら/と/ば/なら), give/receive, plain volitional (よう+と思う),
   evidentials (そう/みたい/らしい), passive, causative, keigo, plus the smaller 〜ながら /
   〜し / 〜やすい・にくい / 〜方. Where an anchor is partially shipped it must be **extended,
   never re-taught** — e.g. m23 taught できる (the する case) but not full potential
   conjugation (食べられる / 読める).

   The 27-module count still holds: it is driven by ~700–800 words of **vocab**, not by anchor
   count. Many N4 modules are therefore vocab-and-consolidation, not new-anchor modules.

**Neither pilot module is affected by any of the above** — plain form is genuinely absent from
m1–m28 and is correctly sequenced first, because it gates relative clauses, conditionals,
casual dialogue, and volitional. That is why it is the pilot.

---

## Module shape (match m27 exactly)

The canonical M8+ template in `docs/lesson-authoring-guide.md` §13.13 describes an 8-sub-lesson
shape, but **the shipped m23–m27 shape is the one to copy** — 17 lessons:

```
m{N}-1-1  Intro      m{N}-4-2  Practice
m{N}-1-2  Practice   m{N}-5-1  Intro
m{N}-2-1  Intro      m{N}-5-2  Practice
m{N}-2-2  Practice   m{N}-6-1  Intro
m{N}-3-1  Intro      m{N}-6-2  Practice
m{N}-3-2  Practice   m{N}-story
m{N}-4-1  Intro      m{N}-7-1  Mixed drill
                     m{N}-7-2  Production
                     m{N}-review-1 / review-2  (derived — do not hand-author)
```

Reference file: `curriculum/m27.ts` (2,585 lines, 17 lessons). Copy its structure — the
`M{N}_REVIEW_POOL` derivation at the top, the per-lesson `pickReviewAtoms(...)` tail, and the
import-time `assertNoSameAnswerCluster` / `assertAnswerRotation` calls at each lesson's foot.

---

## m29 — Plain form (the dictionary form and its family)

**Grammar anchor:** plain form as a *productive register*: dictionary form, ない form, た form,
plain て. This is the single highest-leverage module in N4 — nearly everything downstream
depends on it.

**Pedagogical framing (binding — see `docs/pedagogy-principles-2026-07-05.md`):** teach plain
form as *the base the polite form is built from*, not as "casual ます". The learner already
knows ます-form; plain form is not a decoration on it. Structure-true glosses only.

**Sequencing within the module:**

| Pair | Teaches |
|---|---|
| 1 | Dictionary form — u-verbs (かう→かう, いく, のむ) and the ru/u distinction |
| 2 | Dictionary form — ru-verbs + irregulars (する, くる) |
| 3 | ない form (plain negative) |
| 4 | た form (plain past) — leverage the て-form the learner already has |
| 5 | なかった (plain past negative) |
| 6 | Mixed plain-form interleave — all four forms rotating |
| story | Two friends talking casually (plain form in the wild) |
| 7 | Mixed drill + production |

**Vocab allocation — 21 atoms, m29-owned.** No other module may claim these.

| Kana | Gloss | Kind | Emoji |
|---|---|---|---|
| ともだち | friend | vocab | 👫 |
| はなす | to speak, to talk | vocab | 💬 |
| あそぶ | to play, to hang out | vocab | 🎲 |
| まつ | to wait | vocab | ⏳ |
| はしる | to run | vocab | 🏃 |
| うたう | to sing | vocab | 🎤 |
| およぐ | to swim | vocab | 🏊 |
| つかう | to use | vocab | 🔧 |
| てつだう | to help | vocab | 🤝 |
| おぼえる | to memorise, to learn | vocab | 🧠 |
| わすれる | to forget | vocab | 💭 |
| しめる | to close | vocab | 🚪 |
| あける | to open | vocab | 🔓 |
| いそぐ | to hurry | vocab | 💨 |
| さがす | to look for | vocab | 🔍 |
| なおす | to fix, to repair | vocab | 🛠️ |
| はこぶ | to carry | vocab | 📦 |
| えらぶ | to choose | vocab | ✅ |
| かたづける | to tidy up | vocab | 🧹 |
| じぶん | oneself | vocab | *(blocked — no referent)* |
| ぜんぶ | all, everything | vocab | *(blocked — abstract)* |

Verb-heavy by design: plain form is a verb-conjugation module, so the atoms must be verbs the
learner can transform. `じぶん` / `ぜんぶ` are `blocked: true` (no honest visual referent) per
authoring guide §7 — drill them via `listeningCompSentence` / `build`, never `vocabMcq`.

---

## m30 — Casual register (plain form as speech)

**Grammar anchor:** casual↔polite *switching* — when plain form is socially correct, casual
question intonation (no か), casual sentence-enders (よ / ね / の), and dropped particles.
m29 taught the forms; m30 teaches **using** them with people.

**Depends on:** m29 (every form m30 uses). m30 must not introduce a new plain form.

**Sequencing:**

| Pair | Teaches |
|---|---|
| 1 | Casual questions — dropping か, rising intonation |
| 2 | よ / ね in casual speech |
| 3 | Casual の question (なにしてるの？) |
| 4 | When casual is wrong — register awareness (the social rule) |
| 5 | Casual invitations + responses |
| 6 | Mixed register interleave — same content, both registers |
| story | Same scenario twice: once casual, once polite |
| 7 | Mixed drill + production |

**Vocab allocation — 20 atoms, m30-owned.**

| Kana | Gloss | Kind | Emoji |
|---|---|---|---|
| せんぱい | senior (at school/work) | vocab | 🎓 |
| こうはい | junior (at school/work) | vocab | 🧑‍🎓 |
| じょうし | boss, superior | vocab | 💼 |
| どうりょう | colleague | vocab | 🧑‍💼 |
| しりあい | acquaintance | vocab | 🤵 |
| おさななじみ | childhood friend | vocab | 🧒 |
| なかま | comrade, mate | vocab | 👥 |
| けいご | polite language (keigo) | vocab | 🙇 |
| ためぐち | casual speech | vocab | 🗣️ |
| したしい | close, familiar | vocab | 💞 |
| しつれい | rude, impolite | vocab | 🙅 |
| ていねい | polite, careful | vocab | 🎀 |
| き | feeling, mind | vocab | *(blocked)* |
| なんで | why (casual) | vocab | *(blocked)* |
| どうしたの | what's up? | vocab | *(blocked)* |
| べつに | not particularly | vocab | *(blocked)* |
| やっぱり | as expected, after all | vocab | *(blocked)* |
| もちろん | of course | vocab | *(blocked)* |
| たぶん | probably | vocab | *(blocked)* |
| ぜったい | absolutely | vocab | *(blocked)* |

Social-role nouns carry the register lesson: you cannot teach "when casual is wrong" without
words for the people it is wrong with. The blocked adverbs are the texture of casual speech.

---

## Kanji reading — how it lands in the pilot

The new `kanji_reading` step (kanji → kana reading recall) is being built alongside this spine.
Rules for the pilot, per Spencer 2026-07-16 ("include this in the normal course as we start
introducing words"):

- **Sprinkle, don't saturate.** 2–3 `kanji_reading` steps per module, on kanji **already
  unlocked** (m8–m22 N5 kanji — see `secondScript/`). The pilot does not introduce new N4 kanji.
- **Never on a just-introduced word.** Reading recall is a review-tier retrieval; it belongs on
  a surface the learner has met. Same principle as authoring guide §13.6 (teach steps never grade).
- **The tested kanji must render without furigana** — otherwise the step hands over its own
  answer. This is a property of the step type, but authors must not defeat it by putting the
  reading in the prompt text.
- Authoring-guide §13.1's rubric already anticipates the inverse step (`audio_spelling_mcq`,
  sound→kanji-spelling). That is **not** this step and is not in scope.

---

## Gates every authored module must pass

Non-negotiable; these are existing CI guards, not aspirations.

- `npx tsc --noEmit` clean.
- `npx vitest run` — baseline **3380 passed / 3 skipped / 0 failed**. No regressions.
- Step count 12–25 per sub-lesson (`sub-lesson-density.test.ts`); aim 20–22, but **never pad
  to reach 20** (guide §2).
- Every introduced atom re-surfaces ≥3× across the corpus (`atom-coverage.test.ts`).
- MCQ correct-slot concentration ≤55% (`mcq-position-distribution.test.ts`) — use the factories,
  never inline literals.
- No two adjacent same-`type` steps; never 3+ selection-MCQs in a row even across differing types.
- `selfExplain` at position N-1, after 2–3 commits — never immediately after the first commit
  (guide §5.3). Distractors rule-citing-but-wrong, never dismiss-on-sight (§5.4).
- **No new `phrase_card` steps** — the type is shelved (guide §4b2).
- **No late particle clozes** — a true particle cloze is only legal within 2 modules of that
  particle's introduction (guide §4c). m29/m30 are far past every N5 particle, so particle
  clozes are effectively **banned** here; use `build` / `translateStep` instead.
- Listening is sentence-first: `listening_build` ≥3 tiles, sentence transcripts for
  `listening_comprehension` (guide §4b). `listeningGranularity.test.ts` ratchets word-level
  counts downward only.
- `translateStep` is TYPED free-recall — never add word-bank options (guide §5.2).
- Particles get their own tiles in every `build` tile bank (guide §13.10).
- Atom registry: every atom needs `fromModule: "m29"`/`"m30"` + `introducedByLessonId` pointing
  at its first formal teach (guide §13.8).
- ja info steps are **zero** — the 2026-07-16 script-ladder wave purged all 884 and conformance
  tests forbid regressions. Do not author `info` steps.

## Not in the pilot

- The N4 transit map / coast scene (separate wave — `af6963` art plan).
- Registering m29/m30 in `mockCourse.ts`'s module list. Appending stations there would push the
  ja course to 29+ stations, and `buildLayout` (`TransitLearnPage.tsx:484`) splits **all**
  stations into exactly 3 geometric zones — silently rebalancing ZONE 1/2/3 across N5+N4 and
  destroying their semantics. The pilot is reviewed through the QA drive page (`/ja/qa`), not
  the map.
- New N4 kanji (`N4_KANJI` catalog) and the TTS emit batch.
