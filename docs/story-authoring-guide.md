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

Same vocabulary difficulty, same length. But there is a subject who persists, a
start, a turn, and an arrival — the order is load-bearing, and the last line
means something only because the first eight set it up.

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
<id> q:gist: answer "X" is not among its options
<id> q:gist: needs at least 3 options
<id>: no authored gist question
```

### The gate is character coverage, not parsing

This bites, so internalize it. The matcher does not know grammar; it only knows
whether the characters are covered. Two consequences:

- **False negatives** (gate rejects fine content): a legitimate inflection whose
  exact surface is not an atom fails. At JA m12 the plain past palette is only
  `たべた のんだ きいた みた かった あそんだ いった わかった だった` — there is
  no `よんだ`, no past `あった`, and no past form of any い-adjective. That is a
  real constraint on what you can write, not a bug to route around.
- **False positives** (gate accepts content the learner cannot read): at JA m12
  `でも` "but" passes, because it decomposes as the particle `で` (m6) plus `も`
  "also" (m3). The learner has never met `でも` as a connective. **The gate
  passing is necessary, not sufficient.** If you know a word is above level,
  treat it as above level even when the gate shrugs. (`content.test.ts` will
  refuse to let you *gloss* such a word — "already known at m12" — which is the
  signal to pick a different word, not to keep it unglossed. `けど` at m12 is
  opaque to the matcher and is the honest choice.)

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
  { surface: "なくす", meaning: "to lose (something)", atomId: "ja:nakusu" },
]
```

A gloss must satisfy all four:

**(a) It must appear in the story's own sentences.** The test does a literal
`sentences.map(s => s.text).join(" ").includes(surface)`. The surface has to be
written *exactly as it appears in the text* — `전화` (not `전화하다`) when the
text says `전화해요`; `기다려요` (not `기다리다`) when the text says `기다려요`.
Note that only the *sentences* count, not the questions: a word glossed for the
body may be reused in a question, but a word that appears only in a question
cannot be glossed.

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
and consequence. Check the module: several of these are above level early and
have to be glossed (or replaced) — at JA m12 only `それから` (m10) and `また`
(m11) are in-pool, and `けど` (m16) has to be a gloss.

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

### The gist gap: you often cannot ask "what is this story about?"

The obvious gist prompt needs the word "story" or "person", and those are not
available early:

- **Korean has no atom for `이야기` ("story") or `사람` ("person") at any
  module.** Not at m3, not at m27. There is no way to write "what is this story
  about" in gated Korean at all.
- **Japanese `はなし` ("talk, story") first lands at m14** (`ja:hanashi`), so
  it is unavailable for every story below that, and `ja-m14-a-visitor` is the
  earliest place the meta-question is even writable.

So an early gist question asks about the **central stated fact** instead — the
one a reader who followed the arc knows and a skimmer does not. Prefer the
outcome of the change of state (§4): "where did they end up watching the
movie?", "where was the key?". Those are gist questions in practice, because
answering them requires having tracked the whole story.

---

## 6. Register

Match the module's register, and hold it for the whole story.

**Japanese.** Early modules are plain form (`だ` + plain verbs); the polite
`です` / `ます` spine is the course's core politeness paradigm from m7. Both are
in use across existing stories — `ja-m12-a-workday` is polite and
`ja-m11-last-saturday` is plain — so pick one per story and stay there.
Practical constraint:
polite past for verbs is largely unwritable, because `ました` needs a bare verb
stem the atom registry does not carry (`たべました` leaves a residual). Past-tense
Japanese narration is therefore plain-form (`たべた`, `いった`, `だった`) or it
is not gated at all. `でした` after a noun is fine in either register.

**Korean.** The polite `해요` spine is the course register throughout; use it.
Plain/intimate forms are not taught as a paradigm and will fail the gate.

Do not mix within a story without a narrative reason. A quoted line of dialogue
in a different register is a reason. Running out of forms is not — rewrite the
sentence.

---

## 7. The authoring loop

1. **Read the pool first.** The gate's allowed set is
   `getNormalizedCourseAtoms(lang)` filtered to `moduleOrder(a.module) <= M`,
   plus §2's supplements. Skim it — or dump it in a scratch test — *before*
   writing. Ten minutes reading the pool saves an hour of residual whack-a-mole.
2. **Sketch the arc in English.** Subject, change of state, the turn. §4.
3. **Write the target-language sentences** to the level's band. Count them.
4. **Write the questions.** Gist first, distractors from the module's own
   vocabulary. §5.
5. **Run the gate:**
   ```bash
   npm run test:run -- src/features/practice/content/content.test.ts
   ```
6. **Read the residual and fix the CONTENT.** Replace the word with one the
   module teaches, or declare it as a gloss if it is genuinely worth teaching
   and the budget allows. **Never widen the gate.**
7. **Repeat every 3–4 stories, not once at the end.** Authoring a dozen stories
   and then running the test produces an unreadable failure list where every
   entry needs its own investigation.
8. **Before committing**, run the full suite and `npx tsc --noEmit`.

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

**`ja-m12-the-lost-key`** — 15 sentences, 3 glosses (`けど`, `なくす`,
`たのしい`). Plain-form narrative present. Subject: `わたし` plus a friend, both
present in every scene. State change: a free day → a hat not bought → the key is
gone → panic → back to the shop → relief. Connectives: `けど` (glossed, joins a
subordinate clause — the L3 shape), `それから`, `また`. Gist asks where the key
is; the three distractors are the three places the story visits.

**`ko-m12-waiting-for-a-friend`** — 15 sentences, 4 glosses (`기다려요`, `전화`,
`아파요`, `그래서`). Polite `해요` throughout. Subject: `저` and the friend.
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
