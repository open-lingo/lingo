# Story authoring guide

The standard for every `Story` in `src/features/practice/content/{ja,ko}/stories.ts`
and `stories-culture.ts`. Written for someone with zero prior context on this
codebase: read it top to bottom once, then keep §2 and §7 open while you write.

## 0. The problem this guide exists to fix

Two failures, both real, both measured on the content that shipped before this
guide existed.

**Failure 1 — everything was too short.** A tester's verdict was that the
stories are "so incredibly short they don't offer much value." Every story in
both languages was 6–8 sentences, at *every* module from m3 to m30. A commit
literally titled "density ramp + longer stories" topped out at 8, because the
test file capped sentence count at 4–8 regardless of module. That cap is gone.
The level bands in §1 replace it, and they go to 35.

**Failure 2 — most stories were not stories.** They were a themed *list* of
sentences. The canonical anti-pattern is `ja-m7-my-day`:

> I'm a student. / I eat a meal. / I drink green tea. / I go to school. /
> I read a book at the library. / My friend comes too. / I watch the news at home.

Seven grammatical sentences, one topic, zero narrative. Nothing happens.
Delete any line and nothing breaks; reorder them and nothing changes. The
learner has no reason to reach line 7, so length alone would not have saved it.

The pattern to copy is `ja-m17-to-the-station`:

> I go to the station. / I walk straight down the street. / I turn right in
> front of the hospital. / I cross the bridge. / The station is beside the
> building. / I get on the train. / I get off at the next station.

Same vocabulary difficulty, same length — seven lines each. But there is a
subject who persists, a start, a turn, and an arrival — the order is
load-bearing, and the seventh line means something only because the six before
it set it up.

Length is enforced by the test. Narrative is not, and cannot be. **A story that
passes the test and still reads as a longer sentence list has failed.**

---

## 1. Levels and ceilings

`Story.level` is difficulty. `Story.module` is *when it unlocks*. They are
independent on purpose: that is what lets one module carry both a comfortable
read and a stretch read.

### The level bands

Copied verbatim from `src/features/practice/content/levels.ts` (`LEVEL_BANDS`):

| level | name | sentences | max glosses | shape |
|---|---|---|---|---|
| 1 | Starter | 4–6 | 1 | simple SVO |
| 2 | Easy | 7–10 | 2 | + connectives |
| 3 | Steady | 11–16 | 4 | + subordinate clauses, dialogue |
| 4 | Stretch | 17–24 | 6 | + narration, culture notes |
| 5 | Challenge | 25–35 | 8 | + register shifts, multi-scene |

Sentence count is a **hard band**, not a target: 10 sentences at L3 fails,
17 sentences at L3 fails. The gloss count is a **ceiling** — under budget is
fine and often better (see §3).

### The module ceiling

From `levelCeiling(module)` in the same file:

| module | max level |
|---|---|
| m1–m6 | 2 |
| m7–m12 | 3 |
| m13–m20 | 4 |
| m21+ | 5 |

An m3 learner has roughly forty atoms; a 30-sentence story built from forty
words is mush, so the ceiling rises with the size of the pool. Lower levels
stay available forever — a L1 story at m25 is legal and is a perfectly good
warm-up.

`content.test.ts` enforces all three: band, budget, and ceiling.

---

## 2. The gate contract

Every target-language string a story exposes must be **fully explained by what
the course has already taught at that story's module**. That is the whole
readability invariant, and it is machine-checked.

The checker is `gateResidual(text, languageId, module, glossSurfaces)` in
`src/features/practice/content/gate.ts`. It strips punctuation, then walks each
whitespace-delimited token left to right consuming the longest *allowed
surface* at each position. Whatever it cannot consume is the **residual**.
Residual `""` means the line is comprehensible. Anything else is a failure.

The allowed set at module M is the union of:

1. **Course atoms** with `moduleOrder(atom.module) <= M`, from
   `getNormalizedCourseAtoms(lang)`. Both the display form and the secondary
   form count, and `/` or `、` separated variants are split out.
   (`sidequest-survival` atoms sort as module 0 — always available.)
2. **`FUNCTION_MORPHEMES[lang]`** — grammar the course teaches head-on but does
   not register as an SRS atom. JA: `だ / です / ではない / じゃない / ます /
   ません / ました / ませんでした / でした / ください`. KO: empty, because
   Korean registers conjugated surfaces as atoms instead.
3. **`TAUGHT_LEXICON[lang]`** — surface → module map for words the lessons
   teach but the atom registry does not carry (KO connective adverbs, verb
   eojeol, counters; JA has only two entries). Filtered by `<= M` like atoms.
4. **`PROPER_NOUNS[lang]`** — the names allowlist (トム, ミカ, 민수, 서울, …).
   Names carry no comprehension load. Small and curated on purpose: a typo in a
   name still trips the gate.
5. **The story's own `glosses[].surface`** — see §3.

Everything else fails.

### Which strings are gated

All of them. `content.test.ts` builds the gated set from
`storyTexts(story)`: every `sentences[].text`, **plus every question's `prompt`
and every one of its `options`**. A perfect story with a question option
containing an above-level word fails the same as a bad sentence. Glosses apply
to questions too, so a word you glossed in the body is usable in a distractor.

Conversations (`Conversation.lines[].text`) are gated the same way but get **no
gloss escape hatch** — `gateResidual(text, lang, conv.module)` is called with no
fourth argument. Conversations must be 100% in-module.

### Reading a CI failure

The failure message format is:

```
<story-id>[<sentence-index>] (m<module>): unexplained "<residual>" in "<text>"
<story-id> q:<question-id> prompt (m<module>): unexplained "<residual>" in "<text>"
<story-id> q:<question-id> opt<n> (m<module>): unexplained "<residual>" in "<text>"
```

The residual is the *concatenated leftover characters*, not a word. `"かえ"` in
a line containing `かえる` means the matcher consumed `る` from somewhere and
choked on the rest — read the residual as a pointer to the offending word, not
as the word itself. Find the word in the sentence, then either replace it with
one the module teaches or declare it as a gloss (§3).

The other failure families read:

```
<id>: L3 allows 11-16 sentences, got 9
<id>: L3 allows 4 glosses, got 5
<id>: m9 caps at L2, got L3
<id>: gloss "X" never appears in the story
<id>: gloss "X" is already known at m9
<id>: gloss "X" has no meaning
<id>: duplicate gloss "X"
<id> q:gist: answer "X" is not among its options
<id> q:gist: needs at least 3 options
<id> q:gist: duplicate options
<id>: no authored gist question
```

### The gate is character coverage, not parsing

This bites, so internalize it. The matcher does not know grammar; it only knows
whether the characters are covered. Two consequences:

- **False negatives** (gate rejects content the learner could read): a legitimate
  inflection whose exact surface is not an atom fails, even when the learner has
  both the stem and the rule. `ある` is an atom at m11, but `あった` residuals
  whole. `おいしい` is an atom at m8, but `おいしかった` residuals `おいし` at m12
  (and `おい` from m13 up). These are real constraints on what you can write, not
  bugs to route around: change the sentence, or buy the one form the story cannot
  do without with a gloss.

  **They are per-surface, not per-category.** `おいしかった` never gates, but
  `ほしかった` is clean from m11; `たべました` never gates, but `かきました` is
  clean from m18. You cannot predict which from the atom list — probe the exact
  surface you want. §6 lists the measured ones.

  **A clean result is not the same as an available form.** Some surfaces come
  back clean because the matcher assembled them out of unrelated atoms, which is
  the next bullet. When a probe surprises you by passing, work out *why* it
  passed before you use it.
- **False positives** (gate accepts content the learner cannot read): the
  matcher will happily assemble a word out of unrelated pieces. Four real ones:
  - `でも` "but" passes as the particle `で` (m6) + `も` "also" (m3). The learner
    has never met `でも` as a connective.
  - `よんだ` "read (past)" passes as `よん` = 四 "four" (m5) + `だ` (copula) —
    the matcher reads it as "is four". `よむ` is not an atom until m16.
  - `はなし` "talk, story" gates clean from **m13**, one module before its own
    atom (`ja:hanashi`, m14). Gating early is not the same as being taught.
  - **`まちます` / `まちました` "wait" gate clean from m8** — as `まち` 町 "town"
    (m8) + `ます` / `ました`. The matcher reads 待ちます as "town-ます". `まつ`
    itself residuals whole until its own atom at **m14**, so every module in
    **m8-m13** accepts a word the learner has no way to read. Measured sweep:

    | surface | m5 | m6 | m7 | m8 | … | m13 | m14 |
    |---|---|---|---|---|---|---|---|
    | `まちます` | `まち` | `まち` | `まち` | **clean** | clean | clean | clean |
    | `まちました` | `まち` | `まち` | `まち` | **clean** | clean | clean | clean |
    | `まつ` | `まつ` | `まつ` | `まつ` | `まつ` | `まつ` | `まつ` | **clean** |

    Below m8 the gate rejects it and you can gloss it honestly (`ja:matsu`).
    From m8 it is unglossable — `content.test.ts` answers
    `gloss "まちます" is already known` — so at m8-m13 the only correct move is
    to **write a story that does not need the word**.

  **The gate passing is necessary, not sufficient.** If you know a word is above
  level, treat it as above level even when the gate shrugs. `content.test.ts`
  will refuse to let you *gloss* such a word — `gloss "でも" is already known at
  m12` — and that message is the signal to **pick a different word**, not to
  keep it unglossed. `けど` (m16) is opaque to the matcher and is the honest
  choice for "but" at m12.

  **An odd decomposition is not by itself a false positive.** `かいました` passes
  at m12 as `かい` = 貝 "shell" (m1) + `ました`, which looks alarming — but an m12
  learner genuinely can read it, because `かいます` is an m7 atom and `ました` is
  taught. It is fine to use, and shipped content already does
  (`ja-m11-last-saturday`'s gist prompt). The test is always **"can the learner
  read this word?"**, never "did the matcher decompose it the way I would".

  A short residual is the tell for the opposite problem — a word that *fails* but
  only barely. When a residual is one or two kana out of a four-kana word
  (`たし` for `たのしかった` at m12, `な` for `かわなかった`), the matcher matched
  *something* inside your word by accident. Read the whole word, not the
  residual.

### Never widen the gate to pass content

Do not edit `gate.ts`, `FUNCTION_MORPHEMES`, `TAUGHT_LEXICON`, or
`PROPER_NOUNS` to make a story compile. Those four describe what the course
teaches. Editing them to accommodate a sentence is how the readability
invariant dies — silently, one convenient entry at a time. **If content fails
the gate, the fix is the content.**

---

## 3. Glosses

A gloss is the graded-reader mechanic: one above-level word, named and taught
in place, so the learner meets it instead of tripping over it. Declaring it
adds its surface to the allowed set for that story only.

```ts
glosses: [
  { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
  { surface: "さがす", meaning: "to look for, to search", atomId: "ja:sagasu" },
]
```

A gloss must satisfy all four:

**(a) It must appear in the story's own sentences — as a substring.** The test
does `sentences.map(s => s.text).join(" ").includes(surface)`, and the gate does
a longest-match consume, so both sides work on **substrings, not whole words**.
Two consequences:

- You may gloss a *piece* of a longer surface when the rest is already in-pool.
  `전화` is a legal gloss for a text that only ever says `전화해요`: the gloss
  clears `전화` and the m7 atom `해요` clears the rest. Same for a JA gloss of
  `けど` inside `あたらしいけど`.
- You must not gloss something so short it accidentally licenses other words.
  A one-character gloss is almost always a mistake — it silently becomes legal
  everywhere in the story.

When you *do* want the whole inflected form taught, write the whole form:
`기다려요`, `たのしかった`. Only the *sentences* count, not the questions — a
word glossed for the body may be reused in a question, but a word that appears
only in a question cannot be glossed.

**(b) It must be genuinely above level.** The test runs
`gateResidual(surface, lang, module)` with no glosses and requires a non-empty
residual. A gloss for a word the learner already has pads the budget without
teaching anything. If this test fires, the gate can already read your word —
pick a different one (and re-read the false-positive warning in §2 before you
decide the word is safe to use unglossed).

**(c) It must carry a real English meaning.** Short, plain, the kind of thing
that fits on a tap-to-reveal chip. `"but, although"`, `"to lose (something)"`,
`"hurts, is unwell"`. Empty or whitespace-only fails the test.

**(d) `atomId` when the word is a real course atom, omitted when it is not.**
Set `atomId` to the canonical atom id (`ja:kedo`, `ko:그래서`) whenever the word
*is* an atom the learner meets at a later module — that is what lets "Add to my
words" seed the canonical SRS card instead of orphaning a duplicate. When the
surface is an inflection of an atom, point at the atom it inflects from
(`기다려요` → `ko:기다리다`). Omit `atomId` entirely for story-only culture words
(추석, 花見) that have no atom anywhere in the course. Find ids by grepping the
normalized catalog: `getNormalizedCourseAtoms(lang)` exposes `id` and `module`
on every atom.

**Budget discipline.** The budget is a ceiling, not a quota. L3's four slots do
not mean "find four unknown words." Every declared gloss is a comprehension
tax the learner pays mid-read; at budget, each slot should be carrying either a
plot device or a connective the story cannot be told without. Three vivid
glosses beat six decorative ones every time.

**Gloss reach.** A gloss is an on-ramp to the *next* thing the learner will
meet, not a licence to pull any word out of the catalog. **Prefer atoms within a
few modules of the story** — a word from m15 in an m12 story is a preview; a
word from m29 in an m12 story is a stranger. Reaching far needs two
justifications, both of which you should be able to state in one line: the story
genuinely needs the meaning, *and* no nearer atom carries it. `さがす`
(`ja:sagasu`, m29) in `ja-m12-the-lost-key` is the exception the rule allows —
the story is a search and the course has no earlier word for "look for" — and
the exemplar's other two glosses are m15 and m16, which is the normal case. If
you find yourself reaching that far more than once in a story, the story wants
a different plot, not more glosses.

---

## 4. Narrative discipline

This is the part no test can check, and the reason this guide exists. Three
requirements, all non-negotiable.

### A subject who persists

One person (or one pair) whose situation the reader is tracking from line 1 to
the last line. Not "a student" in line 1 and "my friend" in line 4 and an
unattributed observation in line 6. If your sentences would read identically
with the subject removed, you have written a list.

### A change of state between the opening and closing line

Something must be different at the end. The learner should be able to answer
"what changed?" — a plan that failed and recovered, a thing lost and found, a
place reached, an opinion that moved, a person who arrived. If the closing line
could be swapped with the opening line without confusing anyone, there is no
story yet.

Sketch the arc before you write the target language:

> *free day → shopping, nothing bought → the key is missing → panic → back to
> the shop → the key is there → relief*

Then find the vocabulary that tells *that*, at the module's pool. Do not do it
the other way around — starting from "what words does m12 have?" is exactly how
the themed sentence list gets written.

### At least one connective linking consecutive sentences

`それから` / `また` / `けど` / `でも` / `そして` in Japanese; `그리고` / `그런데`
/ `그래서` / `하지만` in Korean. This is what converts adjacency into sequence
and consequence. Check the module — several of these are above level early and
have to be glossed or replaced:

- **JA, `それから` — usable from m5, not m10.** Its atom is m10, but it clears
  the gate from **m5** as `それ` (m4) + `から` (m5), and that decomposition is
  one a learner genuinely reads: "from that" *is* "after that". So it is the
  default JA connective for every module from m5 up, and it needs no gloss
  there. Measured: m3 → `それら`, m4 → `ら`, **m5 → clean**, and clean at every
  module above. At m4 and below it residuals and must be glossed (`ja:sorekara`)
  or replaced. This is the one false positive in the guide that is safe to
  exploit — contrast `でも` below.
- **JA m3-m4 have no connective at all.** `それから` needs `から` (m5); `また` is
  m11, `けど` m16, `でも` / `そして` m26. At m4 gloss `それから`. At m3 nothing
  works — `それから` has nothing to sequence when the pool has no verb that
  takes an argument — so m3 is the one module where the connective requirement
  cannot be met, and linkage falls to topic contrast (`あさは … きょうは …
  あしたは`) and `も`. Do not burn a gloss slot pretending otherwise.
- **JA m12**: `それから` (free since m5) and `また` (m11) are in-pool.
  `けど` (m16) must be glossed. `でも` and `そして` are m26. Watch out: `でも`
  *passes the gate* at m12 as `で` + `も` (§2), so nothing will stop you using
  it — don't. (Unlike `それから`, this decomposition is NOT one the learner can
  read: `で` + `も` means "also, at/by", not "but".)
- **KO m12**: only `그런데` (m8, via `TAUGHT_LEXICON`) is in-pool. `그래서` is
  m13, `그리고` m13, `하지만` m26 — gloss or replace.

Higher levels ask for more shape, not just more of the same:

- **L3** may use subordinate clauses and short quoted dialogue.
- **L4** may add narration and culture asides.
- **L5** may shift register mid-story and run multiple scenes.

A L5 story is not five L1 stories concatenated. If a 30-sentence draft breaks
cleanly into six unrelated chunks, it is a list again — at greater length.

---

## 5. Questions

Every story needs **at least one `kind: "gist"` question**, authored (not
generated). `kind: "detail"` questions are optional and welcome. Rules the test
enforces:

- the `answer` string must be one of the `options` (exact match),
- at least **3 options**, all unique,
- prompt and every option are gated exactly like a sentence (§2).

Rules the test cannot enforce:

- **Target language only.** Prompt and options are in the story's language.
- **Distractors must be plausible.** Build them from the *same category* as the
  answer, using vocabulary the module has already taught. "Where is the key?"
  → `みせに あります` / `うちに あります` / `レストランに あります` — all three
  are places in the story's world, so skimming does not find the answer. A
  distractor from a different category ("it's blue") is free marks.
- **Register.** Existing content asks questions in the polite spine (`です` /
  `~요`) even when the story body is plain form. That is the app's question
  voice; keep it.

### The gist gap — a Korean problem, only partly a Japanese one

The two languages are not in the same position here, so check yours:

- **Korean: there is no atom for `이야기` ("story") or `사람` ("person") at any
  module.** Both residual at every module 1–40. There is no way to write "what
  is this story about" or "what does the person do" in gated Korean, ever. Every
  KO gist question has to work around this.
- **Japanese: `ひと` ("person") is an m1 atom**, so person-framed prompts are
  available from the very start — `ひとは なにを かいますか。` gates clean at
  m7. `はなし` ("talk, story") gates from m13 (its atom `ja:hanashi` is m14), so
  the literal "what is this story about" framing is unavailable below m13 but
  the person framing is not.

Where the meta-question is unavailable, ask about the **central stated fact**
instead — the one a reader who followed the arc knows and a skimmer does not.
Prefer the outcome of the change of state (§4): "where did they end up watching
the movie?", "where was the key?". Those are gist questions in practice, because
answering them requires having tracked the whole story.

---

## 6. Register and tense

### Register is an authoring choice, not a gate constraint

**`FUNCTION_MORPHEMES` is not module-filtered.** Look at `gate.ts`: atoms and
`TAUGHT_LEXICON` are filtered by `<= M`, but the morpheme list is concatenated
unconditionally. So `です`, `ます`, `ました`, `ませんでした`, `でした` and
`ください` all pass at **every** module, m1 included — `gateResidual("がくせいでした",
"ja", 3)` is `""`. The gate will never tell you your register is wrong.

That means politeness is yours to decide. **The JA default, from an audit of
every story in `ja/stories.ts`: polite for m3–m10, plain for m11 and m13–m30,
with `ja-m19-my-family` the one polite exception inside the plain run, and m12
carrying one of each (`ja-m12-a-workday` polite, `ja-m12-the-lost-key` plain).**

Use that as your starting point, but **open `ja/stories.ts` at your module and
read the actual neighbours before committing** — the exception at m19 and the
split at m12 are exactly why the pattern is a default and not a rule. Whichever
you pick, hold it for the whole story.

`ko/stories.ts` is uniform: the polite `해요` spine at every module. Use it.
Plain/intimate Korean is not taught as a paradigm and its surfaces are not
atoms, so it fails the gate on contact.

Do not mix within a story without a narrative reason. A quoted line of dialogue
in a different register is a reason. Running out of forms is not — rewrite the
sentence.

### Tense IS a gate constraint — probe before you commit

This is the real trap. Probe the forms your arc needs before writing the first
sentence; do not assume a gap closes at some later module, because several of
them never do.

Everything below was measured with `gateResidual` at the modules named. Nothing
here is inferred.

**Japanese.** Plain past is available from m11 — at m12 the palette is
`たべた のんだ きいた みた かった あそんだ いった わかった だった`, all clean.
Beyond that, availability is **per-surface, not per-category**. Do not
generalize from one probe to a rule; the following are the measured facts:

- **Four common past い-adjectives never gate**, at any module 1–40:
  `おいしかった`, `よかった`, `たのしかった`, `たかかった`. If your story wants
  one of those four, it cannot have it unglossed — at any module.

  **But `stem + かった` is not blanket-blocked** — several do gate, so probe the
  specific adjective you want rather than assuming: `ほしかった` and `からかった`
  are clean from m11, `したしかった` from m17, `はやかった` from m21. Whether a
  given one gates depends on how the matcher happens to cover the stem, which
  you cannot predict by reading the atom list. One `gateResidual` call answers
  it.
- **No past `ある`.** `あった` residuals whole at every module 1–40, even though
  `ある` is an m11 atom.
- **Some `ました` forms gate and many do not — probe the specific verb.**
  Clean: `はなしました` from m13, `うたいました` from m17,
  `あるきました` / `かきました` / `ききました` from m18, and `かいました` from m1
  (odd decomposition, genuinely readable — see §2). **`まちました` also comes
  back clean from m8, but do NOT use it** — that one is the `まち` 町 "town"
  false positive in §2, not an available form; `まつ` is m14. Never clean at any module:
  `たべました`, `いきました`, `のみました`. There is no rule to memorize here;
  run the probe.
- **`でした` after a noun is fine** at any module and in any register, and
  `じゃなかった` ("wasn't", noun / な-adjective) gates clean from m12 — so a past
  *negative* copula is available even where past verbs and adjectives are not.

A workable JA shape at low modules is therefore **narrative present with a
past-tense coda**, which is idiomatic Japanese storytelling anyway. That is what
`ja-m12-the-lost-key` does: present throughout, closing on `たのしかった` — one
of the four forms that never gate — bought with one of the three gloss slots.
Note this is a shape that *works*, not the only one: probe first, and if the
past forms your arc needs happen to gate, write the past.

**Korean.** Past *action* verbs land at m10 and gate cleanly at m12 — `갔어요
왔어요 먹었어요 마셨어요 봤어요 했어요 좋았어요 맛있었어요 였어요 이었어요`,
including negated `안 갔어요` / `안 왔어요`. But the forms a narrative leans on
hardest are **not writable at any current module**: `있었어요` ("was at"),
`없었어요` ("wasn't there") and `싶었어요` ("wanted to") each residual whole at
m12, m13, m20 and m27 — the top of the Korean course. `기다렸어요` and `아팠어요`
are the same story. **These gaps do not close; do not write a story on the
assumption that a later module fixes them.**

That is why `ko-m12-waiting-for-a-friend` is present-tense: its arc turns on
exactly the "was at home" and "wanted to watch" beats. **This is a pool
constraint, not a style preference — and Korean present-tense narration is
markedly less idiomatic than the Japanese equivalent, so it is a compromise, not
a model to copy for its own sake.** Where your arc can be told with the past
action verbs that *do* gate, prefer the past; it is the better Korean. Probe the
specific forms your arc needs at your module before choosing.

---

## 7. The authoring loop

1. **Read the pool first.** The gate's allowed set is
   `getNormalizedCourseAtoms(lang)` filtered to `moduleOrder(a.module) <= M`,
   plus §2's supplements. Skim it — or dump it in a scratch test — *before*
   writing. Ten minutes reading the pool saves an hour of residual whack-a-mole.
2. **Sketch the arc in English.** Subject, change of state, the turn. §4.
3. **Probe the tense forms the arc needs**, before writing a word of the target
   language. `gateResidual("있었어요", "ko", 12)` in the same scratch test
   answers "can this be a past-tense story?" in one line. Discovering the answer
   is no after 15 sentences is the expensive way. §6.
4. **Write the target-language sentences** to the level's band. Count them.
5. **Write the questions.** Gist first, distractors from the module's own
   vocabulary. §5.
6. **Run the gate:**
   ```bash
   npm run test:run -- src/features/practice/content/content.test.ts
   ```
7. **Read the residual and fix the CONTENT.** Replace the word with one the
   module teaches, or declare it as a gloss if it is genuinely worth teaching
   and the budget allows. **Never widen the gate.**
8. **Repeat every 3–4 stories, not once at the end.** Authoring a dozen stories
   and then running the test produces an unreadable failure list where every
   entry needs its own investigation.
9. **Before committing**, run the full suite and `npx tsc --noEmit`.

A note on the scratch test: `console.log` is swallowed in this repo's vitest
setup, so have the probe `writeFileSync` its output and read the file. Delete
the scratch file before committing.

### Story shape reference

```ts
{
  id: "ja-m12-the-lost-key",     // <lang>-m<N>-<slug>, never renumbered
  languageId: "ja",              // must match the file's language
  module: 12,                    // unlock module
  level: 3,                      // difficulty; <= levelCeiling(module)
  title: "The lost key",
  theme: "A day out in town turns into a search.",
  tags: ["shopping", "friends", "town"],
  glosses: [ /* §3, within the level budget */ ],
  questions: [ /* §5, >= 1 gist */ ],
  sentences: [
    { text: "…", translation: "…" },   // `reading` is derived, do not author it
  ],
}
```

Readings (JA romaji / KO Revised Romanization) are derived at first access by
`{ja,ko}/index.ts` via `withReading`. Leave `reading` off; the data files stay
terse and the reading aid matches the rest of the app.

---

## 8. The exemplars

Two gate-verified L3 stories, both at m12 (whose ceiling is exactly L3), both
sitting above the module's existing L2 story so that m12 now carries the
comfortable-plus-stretch pair the whole `level` axis exists to produce.

**`ja-m12-the-lost-key`** — 14 sentences, 3 glosses (`けど`, `さがす`,
`たのしかった`). Plain-form narrative present with a past-tense coda (§6).
Subject: `わたし` plus a friend, both present in every scene. State change: a
free day → the key is *planted in the bag* on line 3 → a hat too expensive to
buy → ramen → evening, the key is gone → panic → a search → back to the shop →
relief → coda. Every gloss carries a beat: `けど` the contrast (and a
subordinate clause, the L3 shape), `さがす` the search, `たのしかった` the past
coda the present-tense pool cannot otherwise write (`さがす` is an m29 atom —
the long-reach exception §3 allows, since the course has no earlier word for
"look for"). Other connectives: `それから`, `また`. Gist asks where the key is,
with three options; both distractors are locations the story actually names.

**`ko-m12-waiting-for-a-friend`** — 15 sentences, 4 glosses (`기다려요`, `전화`,
`아파요`, `그래서`). Polite `해요` throughout, present tense **because
`있었어요` / `없었어요` / `싶었어요` are not writable at any module** (§6), not
by preference — treat this as a compromise to work around, not a default.
Subject: `저` and the friend.
State change: a plan to see a movie → the friend does not show → an hour of
waiting → a phone call → the friend is ill at home → the movie happens there
after all. Connectives: `그런데` (in-pool at m12 via `TAUGHT_LEXICON`), `그래서`
(glossed). Gist asks *where* they ended up watching, which only a reader who
followed the reversal can answer — the Korean "story"/"person" gap (§5) rules
out the meta-question at every module.

Neither exemplar carries a gloss without an `atomId`; both are everyday
narratives, and forcing a culture word into one to demonstrate the omit-`atomId`
case would have been exactly the gloss padding §3 warns against. That case
belongs to `stories-culture.ts`.
