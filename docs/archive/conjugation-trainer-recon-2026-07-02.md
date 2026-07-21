> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Conjugation Trainer — Product Recon + Spec Draft (2026-07-02)

Status: **v1 SHIPPED 2026-07-02** (same day — Spencer delegated the vision: "leave it mostly
scaffolded and working"). Build spec: `docs/conjugation-trainer-v1-spec-2026-07-02.md`.
What shipped: trainer hub at `/practice/conjugation` (upgrading the pre-existing drill page this
recon missed — it already had `conjugationTables.ts` with 88 module-scoped verb/adjective entries),
6 trainer types covering **9 of the 22 points** (te/ta/nai forms, polite negatives, たい,
い-adjective forms), each with Learn (curriculum rule card via `getGrammarRuleStepForPoint`) →
Cheat sheet (authored formation grid + "your verbs" strip) → Drill (MCQ, module-scoped pool,
grades Track B `production` once per session). Unlocks derive from each grammar point's module.
The 13 te-compound/aux points remain v2 (need new form columns). §(g) open questions BELOW remain
open — v1 took the least-opinionated path through each.

Original recon follows unchanged:

Problem this addresses: 22 conjugation-formation grammar points ship in Track B FSRS
(`n5-grammar-points.json`, `status: "shipped"`) but have **no review pool** — the
comprehensibility gate in `grammarReviewPools.test.ts` can't build honest cloze/build
steps because course atoms are stored in **dictionary form** (`たべる`, `たかい`), so a
conjugated surface (`たべて`, `たかくない`) always leaves an un-strippable stem. They are
frozen in `POOL_GAP_EXEMPTIONS` and filtered out of the grammar queue by the `hasPool`
guard (`grammarSrs.ts` `buildGrammarReviewQueue`). The chosen resolution is a **dedicated
Conjugation Trainer** that produces the *formation* skill directly and grades back into
those same 22 point ids so the exemptions can retire. A **Counters Trainer** (`ひとつ`/
`ひとり` + geminate readings `じゅっさい`/`いっぷん`) is a wanted sibling with the same shape.

The 22 pool-less points (from `POOL_GAP_EXEMPTIONS`):

- **i-adjective:** `i-adj-negative` (〜くない), `i-adj-past` (〜かった), `i-adj-past-negative` (〜くなかった)
- **plain / polite-negative verb:** `ta-form` (〜た), `nai-form` (〜ない), `masu-negative` (〜ません), `masu-past-negative` (〜ませんでした)
- **て-form family:** `te-form`, `te-kudasai`, `te-iru`, `te-mo-ii`, `te-wa-ikemasen`, `naide-kudasai`, `te-kara`
- **stem-attaching modals/aux:** `v-tai` (ます-stem+たい), `sugiru` (stem+すぎる), `ni-iku` (ます-stem+にいく), `koto-ga-aru` (た-form+ことがある), `tari-tari-suru` (た-form+り), `nakereba-naranai` (ない-stem+ければならない), `hou-ga-ii` (た/ない+ほうがいい)
- (`to-quotation` is also in the exemption list but is a **vocab gap**, not a conjugation
  gap — no saying-verb atom by m21 — so it is out of scope for this trainer.)

---

## PART 1 — RECON

Survey of existing Japanese conjugation-practice tools, verified against their live pages
and community threads (July 2026). For each: input method, pool selection, how the target
form is expressed, verb-class handling, wrong-answer feedback, reference design, and
what's clever or hated.

### 1. Don's Japanese Conjugation Drill (the canonical one)
Live: <https://wkdonc.github.io/conjugation/drill.html> · community:
<https://community.wanikani.com/t/dons-japanese-conjugation-drill/17384>

- **Input:** typed. You type the conjugated form (romaji→kana IME-style) and submit.
- **Pool:** a fixed built-in verb/adjective list; **not** seeded from the learner's own
  vocab. A frequently-declined feature request was linking to WaniKani level so it only
  quizzes known words — the creator *deliberately declined* it (wants the transformation
  skill decoupled from which word).
- **Target form:** shown as a **label** ("plain", "past negative", "て-form", …) beside
  the dictionary-form prompt. No sentence context.
- **Verb-class:** the drill's stated pedagogy is that you must *recognize the class
  yourself* and apply the change — it intentionally does not pre-label godan/ichidan on
  the prompt.
- **Feedback:** right/wrong only.
- **Hated / clever:** the label ambiguity is the #1 complaint. "Plain form" reads as
  present-affirmative to many but the drill uses it as an umbrella (plain-past, plain-neg).
  Users asked for (a) "plain past" style disambiguated labels, (b) a "**why?**" /
  explain-the-answer button, (c) showing **both** Ichidan/Godan *and* Group 2/Group 1
  labels because textbooks disagree. Creator's counter-position: the friction is partly
  intentional — force understanding over pattern-matching. Takeaway: **label clarity and
  an on-demand "why" are the difference between loved and hated.**

### 2. LanDon's / jp-verb-quiz — extension of Don's
Live: <https://jp-drill.morisinc.net/> · repo: <https://github.com/LandonJPGinn/jp-verb-quiz>

- Same shape as Don's (typed romaji→kana, label-driven), open-source fork adding features
  and explicit right/wrong feedback. Useful as an MIT-ish reference implementation of the
  transformation rules if we ever want to check our own generator against one.

### 3. Steven Kraft's Japanese Projects (the most-recommended today)
Index: <https://steven-kraft.com/projects/japanese/> · review:
<https://www.tofugu.com/japanese-learning-resources-database/steven-krafts-japanese-projects/>

- **Structure:** **one drill per form** — separate pages for て-form, causative,
  conditional, potential, passive, volitional, imperative, plus a "**Randomized Forms**"
  page that mixes. Adjectives get their own five drills (negative, past, conditional,
  volitional, and the なる form — its distinguishing extra).
- **Input:** typed kana; optional furigana over kanji, optional emoji cue over the form
  name; per-form and randomized modes.
- **Pool:** built-in word lists; not learner-seeded.
- **Also ships a Counters/Numbers suite** — separate drills for **Counters, Time, Days of
  the Month, Numbers**. Direct precedent for our wanted Counters Trainer, and its
  "one drill per thing + a randomized mix" IA is a clean model for us.
- **Cheat sheets:** a separate "Cheat Sheet Collection" is linked off-site — reference and
  drill are decoupled pages, not integrated.
- **Praised for:** breadth (widest adjective coverage, incl. なる), free, simple. This is
  the current community default recommendation over Don's for beginners.

### 4. Katsu (活用) — mobile PWA
Live: <https://katsu.arthurhoek.nl/> · repo: <https://github.com/ahoek/katsu> (open source)

- Mobile-first PWA covering verbs, i-adjectives, na-adjectives. Same typed-answer +
  form-label model, packaged for phone use. Relevant as the **mobile input** precedent —
  confirms typed-kana is the norm even on touch; nobody in this space ships a bespoke
  on-screen kana keypad for conjugation (they lean on the device IME). Open-source rules
  engine is another cross-check reference.

### 5. PassJapanese Verb Conjugator
Live: <https://passjapanese.com/en/tools/japanese-verb-conjugator>

- Primarily a **conjugation *table* generator** (type a dictionary verb → see every form)
  with a bolt-on drill mode. Represents the "reference table first, practice second"
  camp. No sign-up, free. Good model for the **cheat-sheet-as-generated-table** idea:
  one dictionary verb expands into the full paradigm.

### 6. Bunpro — Cram mode
Docs: <https://bunpro.jp/support/using-bunpro/Introduction-to-Cram> · review:
<https://www.tofugu.com/reviews/bunpro/>

- **Cloze deletion in a real sentence** — you're given an example sentence with a blank
  and type the correctly-conjugated grammar point to fill it. This is the **context-based**
  antithesis of Don's bare-label approach: the surrounding sentence disambiguates the
  target tense/polarity instead of a terse label. **Directly relevant:** it's exactly the
  form our comprehensibility gate blocks today (conjugated surface inside a sentence), and
  it's why Bunpro can afford it — they don't gate vocab the way Lingo does.
- **Grading:** SRS-scheduled; Cram is the off-schedule "quiz me on any parameters" mode.
- Tradeoff to note for us: sentence context is more natural but **couples the drill to
  vocab the learner may not know** — the exact wall that created the 22-point gap.

### 7. Renshuu — conjugation quizzes
Forum: <https://www.renshuu.org/forums/topics/7999/> · comparison:
<https://community.wanikani.com/t/bunpro-or-renshuu/50332>

- **Most relevant to our seeding requirement:** Renshuu conjugation practice can be run
  **"based on verbs you know"** — it pulls from the learner's studied vocab, and "study
  multiple" lets you mix selected conjugation types. Scheduling is performance-spaced
  (SRS-like) rather than fixed daily counts.
- This is the single closest precedent to "**seed the drill from the learner's already-known
  verbs and adjectives**," which is Spencer's stated design goal. Worth noting Renshuu is
  well-liked for having grammar + counters practice free.

### 8. Anki community decks
Thread: <https://community.wanikani.com/t/an-anki-deck-for-verb-adjective-conjugation/15868>
· decks: "Japanese Verb Conjugation Drills" (ankiweb 3494720507), "Mako's" (1877687672),
"drills" (922054746).

- Card front = dictionary word + target-form label; back = answer. **Type-in-the-answer**
  variants exist. The recurring complaint mirrors Don's: **a static deck can't generate
  the paradigm**, so decks are large hand-authored grids and can't seed from *your* vocab.
  Confirms the gap a generated, vocab-seeded trainer fills.

### 9. Duolingo
- No dedicated conjugation mechanic. Conjugation is absorbed implicitly via word-bank
  sentence assembly; widely criticized for never teaching the *rule*. This is the anti-
  pattern Spencer's "no babying / capable adults" pillar already rejects — call it out as
  the thing **not** to copy: token-tap alone doesn't teach *formation*.

### 10. Reference / teaching approaches for the て-form rule (for cheat-sheet design)
- **The て-form song** ("うつるって…", to *Santa Claus Is Coming to Town* /
  *Oh Christmas Tree*): う・つ・る→って, む・ぶ・ぬ→んで, く→いて, ぐ→いで, す→して,
  する→して, くる→きて, **いく→いって (the exception)**. Sources:
  <https://www.wasshoimagazine.org/blog/curiosities-of-the-japanese-language/te-form-song>,
  <https://www.mnemonic-device.com/languages/japanese/sung-to-the-tune-of-oh-christmas-tree/>.
- **Cure Dolly's て-form mind-map** groups the endings visually rather than as a list:
  <https://learnjapaneseonline.info/2017/11/05/te-form-of-verbs-made-easy-learn-te-form-in-ten-minutes-with-this-simple-mind-map/>.
- Tae Kim / Wasabi: rule-table reference (godan by final-kana row → て / で ending, ichidan
  drop る + て, two irregulars). Standard authoritative decomposition; matches the atom
  data we already have (dictionary-form verbs).

### Recon takeaways (what to steal / avoid)
1. **Two camps:** *bare-label transformation* (Don, Kraft, Katsu, Anki — teaches formation,
   decoupled from vocab, but suffers label ambiguity) vs *sentence cloze* (Bunpro — natural
   but couples to vocab the learner may not know). Lingo's gate makes camp 2 the very thing
   that's blocked; **camp 1 is the fit**, but we can beat everyone on the two things camp-1
   users beg for: unambiguous form labels + an on-demand "why".
2. **Seeding from known vocab is rare and prized** — only Renshuu really does it; it is
   Spencer's explicit goal and our unlocked-atom store makes it cheap. This is our
   differentiator.
3. **"One drill per form + a randomized mix," a generated full-paradigm cheat sheet, and a
   sibling Counters/Numbers suite** are all proven IA (Kraft). Nobody integrates
   *lesson → cheat sheet → drill* into one graded, SRS-backed loop — that's the opening.

---

## PART 2 — SPEC DRAFT

Grounded in Part 1 and the codebase. Cross-refs: atom shape
`src/features/languages/ja/courseAtoms.ts`; the 22 points
`src/features/lesson/data/grammarReviewPools.test.ts` (`POOL_GAP_EXEMPTIONS`); known-atoms
seed source `src/features/lesson/data/unlockLessonAtoms.ts` (`getUnlockedAtomIds()`); Track B
FSRS `src/features/flashcards/engine/grammarSrs.ts` (`reviewGrammarPoint`).

### (a) Proposed learner flow — lesson → cheat sheet → drill
Per conjugation *type* (map ~1:1 to a grammar point id, or to a small family — see open
Q1):

1. **Teach step (the rule).** A `grammar_rule`-style card stating the transformation, with
   worked examples drawn from the learner's *known* verbs/adjectives where possible. This
   is the "more detailed lesson on each conjugation type" Spencer asked for. Reuse the
   existing `grammarRule` builder (it already carries `grammarPointId`; see the plumbing
   tests) so a Conjugation-Trainer lesson can double as the point's `getGrammarRuleStepForPoint`
   rule card.
2. **Cheat sheet (reference).** A persistent, re-openable reference for that type — the
   full paradigm table + the pattern grouping (te-form song grid, i-adj くない/かった grid,
   etc.). Generated, not hand-authored, from the rule + the learner's seed words (Kraft has
   cheat sheets but off-page; PassJapanese generates tables; we integrate both).
3. **Drill (graded).** N transformation items, seeded from known vocab, graded into Track B
   FSRS for that point id. This is the part that retires the pool gap.

Entry point: a **Trainers** hub on the Practice page (sibling to the grammar review
session), listing each conjugation type with its Track-B due state, plus the Counters
Trainer. "One card per type + a Randomized/Mixed card" mirrors Kraft's proven IA.

### (b) Drill interaction — options + recommendation
Constraints: **no flip cards** (Spencer's law — flip = vocab-only); token-tap / kana-keypad
fits the app's existing production direction; the long-term production direction is an
on-screen JA flick keyboard (memory: `project_lingo_production_practice_direction`).

Options considered:

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Kana-tile assembly (token-tap)** | Present dictionary word + unambiguous target-form label; learner **taps kana tiles** to build the conjugated surface (bank = correct kana + distractor kana). | Zero new input infra (reuses `build_sentence`/`listening_build` tile machinery); no IME dependency; matches existing production direction; controllable difficulty via distractor set. | Tile bank can leak the answer length/shape; less "productive" than free typing. |
| **B. On-screen kana keypad / flick** | Learner types the surface on a bespoke gojūon or flick keypad. | Closest to real production; the stated long-term direction; no answer-shape leak. | New input component (flick keyboard is a project in itself) — too big for v1. |
| **C. Device IME typed input** | Free-type like Don/Kraft/Katsu. | Industry-standard; trivial. | Desktop-biased; mobile IME friction; against the app's on-screen-input direction. |
| **D. MCQ over candidate forms** | Pick the right conjugation from 4. | Trivial; unambiguous grading. | Recognition, not production — weakest for a *formation* skill; feels like babying. |

**Recommendation (flag as Q2, not final): v1 = Option A (kana-tile assembly)**, because it
reuses shipped tile infrastructure, honors no-flip-cards, and sits on the token-tap →
flick-keyboard trajectory (A now, B later as the same drill's input swap). Add an
on-demand **"why?"** reveal (the #1 unmet ask across Don/Kraft) that expands the cheat-sheet
rule inline after a miss. Avoid D as the primary mode (recognition ≠ formation). Keep the
target-form **label explicit and disambiguated** ("plain past negative", not "plain") —
the single biggest lesson from the recon.

### (c) Seeding from known verbs/adjectives — mechanics + the metadata gap
Seed source is already there: `getUnlockedAtomIds()` returns the canonical `ja:<id>` set.
Seed pool for a given conjugation type = **unlocked atom ids ∩ {atoms of the right
part-of-speech / verb-class}**.

**The metadata gap (the real work).** `CourseAtom` today has **no POS and no verb-class**.
`kind` is only `"vocab" | "particle" | "phrase"` — every verb and adjective is `kind:
"vocab"`, indistinguishable from a noun. So we cannot currently ask "which unlocked atoms
are ichidan verbs?" Confirmed against `courseAtoms.ts`:
- Dictionary-form verbs exist as atoms: `たべる` (ichidan), `いく`/`かく`/`よむ`/`のむ`
  (godan), `みる` (ichidan) — all `kind: "vocab"`, m7.
- **ます-form** duplicates also exist as separate atoms (`たべます`, `いきます`, `かきます`,
  `のみます`, `みます`, `よみます`) — useful because `masu-negative`/`masu-past-negative`
  key off the ます-stem.
- i-adjectives exist (`あおい`, `ちかい`, `とおい`, `おおきい` in a phrase, `いい/よい`) but
  aren't marked as adjectives.

**Cheapest fix (recommend, flag as Q3):** add two optional fields to `CourseAtom`:
```ts
pos?: "verb" | "i-adj" | "na-adj" | "noun" | ...;   // part of speech
verbClass?: "godan" | "ichidan" | "irregular";       // only when pos === "verb"
```
Populate them **only for the atoms a v1 trainer actually seeds from** (the ~dozen m7 verbs
+ the handful of i-adjectives), not all 660 atoms — a small, reviewable, additive change
(IDs never renumber; fields are optional so nothing else breaks). Godan/ichidan can be
seeded semi-automatically from the kana ending and hand-verified (the classic る-ending
ambiguity — `みる` ichidan vs `かえる` godan — needs a human check, so don't fully
automate). Adjective past/negative only needs the `i-adj` vs `na-adj` split, which is
trivial to tag.

Then per drill: `pool = unlockedAtoms.filter(a => a.pos === needed && (!needsClass || classesRequested.has(a.verbClass)))`.
If the learner knows too few words of a type, **fall back to a curated built-in seed set**
for that type (like every other tool) rather than blocking the drill — flag which words are
"borrowed" so we never imply they're known vocab (honors the "never show vocab they can't
reasonably know" pillar — a borrowed word is shown *with* its meaning, taught, not
assumed). Owner call: Q4.

### (d) Grading into Track B FSRS per grammar point
The drill grades into the **same** Track B store, keyed by the 22 point ids, so the pool
gap retires:

- Each drill item is tagged with its grammar point id (e.g. a て-form tile item →
  `te-form`). On answer, call `reviewGrammarPoint(pointId, modality, rating)` (`grammarSrs.ts`).
- **Modality:** building a conjugated form is *production* → grade the `production`
  modality (consistent with the two-sub-state model; `isDue` fires if either modality is
  due). Q5: should a "why?/reveal-first" easier variant grade `recognition` instead?
- **Rating parity with lessons/grammar review:** wrong → `again`; clean first-try →
  `good`; a recovery on a replay pass → `hard` (Hard-is-a-success invariant; mirrors
  `useGrammarReviewSession` grading parity noted in CLAUDE.md).
- **Retiring the exemption:** once a point has a working trainer drill, it can be removed
  from `POOL_GAP_EXEMPTIONS` **and** the `hasPool` guard should treat "has a trainer" as
  "has renderable review content" so the point re-enters `buildGrammarReviewQueue`.
  Mechanically this means the trainer becomes an alternate content source alongside
  `grammarReviewPools` — either extend `getGrammarPool`/`hasPool` to recognize
  trainer-backed points, or route those points' reviews to the trainer surface. Q6: do
  trainer-eligible points surface *in the normal grammar review session* (rendered as a
  trainer step) or *only inside the Trainers hub*? The former retires the gate cleanly;
  the latter keeps the review session simpler.
- **Activation still respects introduce-before-review:** a point is only active once its
  module is reached (`getActiveGrammarPoints` / `getReachedModules`) — unchanged.

### (e) Cheat-sheet content sketch — て-form done well (one example type)
Goal: the reference that the "why?" button expands into, and the standalone cheat sheet.

**Header:** て-form = "the connector." One line on *what it's for* (linking actions,
requests with ください, progressive with いる) — but the sheet teaches **formation only**;
the uses are their own points (`te-kudasai`, `te-iru`, …).

**The three-class rule, grouped visually (not as prose):**

- **Ichidan (る-verbs):** drop る → **て**. たべる→たべて, みる→みて.
- **Irregular:** する→して, くる→きて.
- **Godan (う-verbs), by final kana — the song grid:**

  | dict ending | て-form | example |
  |---|---|---|
  | う・つ・る | **って** | かう→かって, まつ→まって, とる→とって |
  | む・ぶ・ぬ | **んで** | のむ→のんで, あそぶ→あそんで, しぬ→しんで |
  | く | **いて** | かく→かいて |
  | ぐ | **いで** | およぐ→およいで |
  | す | **して** | はなす→はなして |
  | **いく (exception)** | **いって** | the one godan-く that breaks the rule |

**Seeded worked examples:** render the grid's example column using the **learner's known
verbs** where they cover a row (from §c seeding); fill uncovered rows with borrowed words
shown with meaning. This makes the sheet feel personal without assuming unknown vocab.

**Mnemonic hook:** offer the て-form song ("うつるって・むぶぬんで・くいて・ぐいで・すして")
as an optional audio/text aid (cite it, don't require it) — the most-loved memory device in
the recon. Avoid babying framing; present it as a tool, not a gold star.

**Common-error callouts:** the two traps — (1) mistaking an -iru/-eru **godan** verb
(かえる, はしる) for ichidan; (2) いく→いって. Surface these as the drill's smart
distractors and as a footnote, not a lecture.

### (f) v1 scope cut
Ship small, prove the loop, then fan out.

**In v1:**
- **て-form only** as the first fully-built type (teach → generated cheat sheet → kana-tile
  drill → grades `te-form` in Track B). It's the highest-leverage point (7 downstream
  points build on it) and the richest cheat sheet.
- Kana-tile assembly input (Option A) + explicit disambiguated labels + on-demand "why?".
- Additive `pos`/`verbClass` metadata on **only** the m7 verbs the drill seeds from.
- Seeding from `getUnlockedAtomIds()` with a built-in fallback set for thin vocab.
- Grade into `reviewGrammarPoint('te-form', 'production', …)`; remove `te-form` from
  `POOL_GAP_EXEMPTIONS` and let it re-enter the queue.
- A **Trainers** hub entry on the Practice page.

**Explicitly deferred:**
- The other 21 points (roll out type-by-type once the て-form loop is validated).
- The **Counters Trainer** (build after the conjugation loop proves out — same
  lesson→sheet→drill shape, seeds off number atoms + the geminate counter suffixes already
  handled by the gate's `COUNTER_SUFFIXES`; targets `ひとつ/ひとり` and geminate readings
  `じゅっさい/いっぷん`). Kraft's Counters suite is the IA model.
- On-screen **flick keyboard** input (Option B) — swap in later behind the same drill.
- Automatic verb-class inference — hand-tag for now.
- Randomized/mixed multi-type drill (add once ≥3 types exist).

### (g) OPEN QUESTIONS for the owner (all pedagogy/product judgment — Spencer's call)
1. **Type ↔ point granularity:** one trainer per grammar-point id (22 drills), or grouped
   families (e.g. one "て-form" trainer that also feeds `te-kudasai`/`te-iru`)? Affects how
   Track B grading fans out.
2. **Primary drill interaction:** confirm kana-tile assembly (Option A) for v1 vs
   jumping to the flick keyboard, vs allowing typed IME as an option.
3. **Metadata approach:** OK to add optional `pos`/`verbClass` to `CourseAtom` and
   hand-populate incrementally? Any preference on where verb-class lives (atom vs a side
   table) so it doesn't bloat the deck?
4. **Thin-vocab fallback:** when the learner knows too few verbs of a class, borrow from a
   curated set (shown-with-meaning) or block the drill until they know enough? How hard is
   the "never show unknown vocab" line here?
5. **Which modality does formation grade** — always `production`, or does an easier
   reveal-first variant grade `recognition`?
6. **Where trainer-backed points surface:** inside the normal grammar review session
   (rendered as a trainer step, cleanly retiring the gate) or only in the Trainers hub?
7. **Label taxonomy:** what exact form labels do we show? (Recon's clearest lesson: pick
   unambiguous names — "plain past negative" not "plain" — and stick to them course-wide.)
8. **Mnemonic framing:** include the て-form song / mind-map, given the no-babying pillar?
   (Recommend: offer as an optional tool, no streak/gamification wrapper.)
9. **Cheat-sheet placement:** integrated re-openable panel inside the trainer, a Practice-
   page reference section, or both?
10. **Counters Trainer priority:** strictly after the conjugation loop ships, or parallel
    if the shape is proven identical?

---

### Source URLs (Part 1)
- Tofugu conjugation-practice DB: <https://www.tofugu.com/japanese-learning-resources-database/japanese-conjugation-practice/>
- Don's drill: <https://wkdonc.github.io/conjugation/drill.html> · thread <https://community.wanikani.com/t/dons-japanese-conjugation-drill/17384>
- Bailey Snyder jconj: <https://baileysnyder.com/jconj/>
- LanDon's fork: <https://jp-drill.morisinc.net/> · <https://github.com/LandonJPGinn/jp-verb-quiz>
- Steven Kraft: <https://steven-kraft.com/projects/japanese/> · review <https://www.tofugu.com/japanese-learning-resources-database/steven-krafts-japanese-projects/>
- Katsu: <https://katsu.arthurhoek.nl/> · <https://github.com/ahoek/katsu>
- PassJapanese conjugator: <https://passjapanese.com/en/tools/japanese-verb-conjugator>
- Bunpro Cram: <https://bunpro.jp/support/using-bunpro/Introduction-to-Cram> · review <https://www.tofugu.com/reviews/bunpro/>
- Renshuu: <https://www.renshuu.org/forums/topics/7999/> · BunPro-vs-Renshuu <https://community.wanikani.com/t/bunpro-or-renshuu/50332>
- Anki decks thread: <https://community.wanikani.com/t/an-anki-deck-for-verb-adjective-conjugation/15868>
- Hayai app roundup: <https://www.hayailearn.com/blog/five-great-apps-for-japanese-conjugation-practice>
- て-form song/mnemonic: <https://www.wasshoimagazine.org/blog/curiosities-of-the-japanese-language/te-form-song> · <https://www.mnemonic-device.com/languages/japanese/sung-to-the-tune-of-oh-christmas-tree/> · Cure Dolly mind-map <https://learnjapaneseonline.info/2017/11/05/te-form-of-verbs-made-easy-learn-te-form-in-ten-minutes-with-this-simple-mind-map/>
</content>
</invoke>
