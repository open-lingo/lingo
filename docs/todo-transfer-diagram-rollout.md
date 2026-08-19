# TODO — roll the transfer diagram out to the rest of the course

Opened 2026-08-18. Shipped in m31 (L1 axis, L2 もらう, L7 かす/かりる) and
awaiting Spencer's walk-through + grade before any of the below is started.

## What exists now

| piece | where |
|---|---|
| spec type (language-agnostic) | `features/lesson/types.ts` — `TransferDiagramSpec` |
| renderer | `features/lesson/components/steps/TransferScene.tsx` |
| rule-card slot | `GrammarRuleStepView` — diagram LEADS, prose is its caption |
| IR field | `diagram:` on a grammar point; passes through `compile-ir.mjs` untouched |
| compiler | `moduleCompiler.ts` → `grammarRule({ transferDiagram })` |
| learner peek | `RuleHint` + `RuleHintCard`, 3 per lesson, attached across the drill span |
| dev driver | `/:lang/qa/transfer-diagram` |

Authoring a new one is IR-only: add `diagram:` to the grammar point, trim the
prose it replaces, `node scripts/compile-ir.mjs mN`.

## Candidates, best first

Direction pairs — the diagram fits as-is, no renderer work:

| pair | module | note |
|---|---|---|
| いく / くる | ~m11 | Same うち/そと axis as m31, taught **20 modules earlier**. Strongest candidate: the learner meets the axis here first and currently gets no picture of it. |
| のる / おりる | m17 | on/off a vehicle — boundary is the vehicle, not うち. Needs `insideLabel` to say so. |
| おしえる / ならう | gap 16 | teach/learn, one event two ends. Direct fit. |
| あげる / くれる re-teach | m31 L5 (`ageru`/`limits`) | The BAN. Needs a new render mode (a crossed / blocked arrow) — not just a spec. Scope separately. |

Needs a different picture — do NOT force this renderer onto them:

| pair | module | why |
|---|---|---|
| みる / みえる, きく / きこえる | 17, m24 | volition, not direction. Two parties and an arrow is the wrong diagram. |
| transitivity pairs | m33 | agent present vs absent. Different axis. |
| たら / と, のに / ので | m32, m39 | contrast, not direction — these want the proposed `kind: contrast` beat instead. |

## Open rulings needed before rollout

1. **inv 30 / the m14 trap.** The picture is safe by construction — the object
   is a GENERIC parcel, never the named atom. But if a `diagram:` ever names an
   imageable atom in TEXT (the `object.label` is rendered), it could still steal
   that atom's `word_image_mcq` debut. Decide: keep object labels to
   already-introduced atoms, or exempt diagram-only mentions in the compiler.
2. **Peek budget.** 3 per lesson, spent across all points, no persistence
   between lessons. Confirm the number and whether a peek should cost XP.
3. **Desktop width.** The scene is an SVG, so it SCALES with width while prose
   REFLOWS. Measured at 700px the diagram is taller than the prose it replaces;
   at 390px it is much shorter. Lessons are phone-first so this shipped as-is —
   if desktop matters, cap the scene's max-width.

## Measured, m31, 700px viewport

Step-container overflow (`scrollHeight - clientHeight`), phone width:

| card | rule chars before → after | overflow |
|---|---|---|
| L1 axis | 840 → 365 | 469 → **159** |
| L2 もらう | 787 → 398 | — → **228** |
| L7 かす/かりる | 800 → 352 | — → **165** |

L1's 469 was measured with the diagram added but the prose still leading; the
159 is after the picture was moved above the prose and the redundant example
tile suppressed. Both changes matter — adding a picture without cutting the
words makes the card WORSE.

## Layout, final (2026-08-18)

Spencer: "we can probably inset the buttons a little better ... and the continue
button can fit on one page for my mac at least."

Step-container overflow, m31 L1:

| viewport | before | after |
|---|---|---|
| 1440×900 (Mac) | 70 | **0** |
| 1280×800 | — | **0** |
| 430×700 (phone) | 159 | **78** |

Three changes, in order of payoff: both questions + Replay share ONE wrapping
row (a row per control cost ~34px each for no clarity); the SVG's vertical
extent tightened ~15% (viewBox 210 → 178); card padding and the diagram/prose
gap trimmed. The last 10px came from cutting the rule's final sentence —
"Flip the direction above and watch the verb, the particles and the subject all
move with it" — which told the learner to do something the control already asks
in plain words ("Which way did it go?"). Axis rule is now **272 chars**, down
from the 840 it shipped with.

---

## Survey, 2026-08-18 — all 231 grammar points read

Spencer: *"roll out the diagram in other places, and look for more grammar
rules that can be explained visually."* I read every `- id:` grammar point
with a `rule:` across m6–m31 (231 of them) and sorted them by which PICTURE
they want, not by whether they mention movement.

### Correction to this doc's own candidate list

**いく/くる and のる/おりる are NOT transfer diagrams.** They were listed above
as "the diagram fits as-is, no renderer work". That is wrong, and it is worth
saying why so nobody re-adds them: a transfer moves an OBJECT between two
people, and the picture's whole content is which way the object crossed a
boundary. In 「えきに いく」 nothing crosses anything — the SUBJECT moves along
a path. Forcing the transfer renderer onto it draws a parcel labelled "me"
flying between two blobs, which teaches the wrong thing about a sentence that
has no object at all.

### Where the transfer diagram genuinely still fits

| point | module | status |
|---|---|---|
| くださる / いただく | m31 L9 | **the one real gap.** Same picture, politeness axis. NOT authored yet — deliberately left alone while Spencer walks m31. |
| おしえる / ならう | gap 16 | direct fit, module not authored |
| かす / かりる | m31 L7 | already shipped |

That is the whole list. The transfer diagram is a give/receive instrument and
give/receive lives in m31. Rolling it further would be padding.

### The next primitive: a JOURNEY — built, staged, not wired

`JourneyDiagramSpec` (types.ts) + `JourneyScene.tsx`, on the QA page at
`/:lang/qa/transfer-diagram` under the new **journey** mode.

One traveller, one path, and the roles hung along it at the positions they
describe. The learner selects a role and the picture says what that role
does. Three bands so nothing collides: traveller + means above the path, the
path, place labels below.

Two things the picture does that prose cannot:

- **に vs へ is a SWAP IN PLACE, not two rows.** They mark the same slot and
  differ only in feel. Two static rows would show a difference that is not
  there; a toggle on the one chip shows the difference that is.
- **まで actually stops the traveller.** Selecting the limit ends the travel
  animation at the limit marker instead of the arrowhead — which is the
  entire content of the note "the walking stops there".

**m19 is the densest visual opportunity left in the course**: it teaches に
(destination), へ (heading), で (means) and まで (as far as) in one module,
and から (origin) arrived in m16. Five particles whose only real difficulty is
which ROLE each assigns — one picture covers all five.

Reach for the journey renderer, best first:

| point | module | note |
|---|---|---|
| e-direction (に/へ) | m19 | the swap-in-place case; the module's one new particle |
| de-action (means で) | m19 | で rides on the traveller, not the path |
| made-until / made-ni | m16, m19 | the limit case |
| kara-origin | m16, m31 | origin end of the same path |
| ni-location (destination) | m19 | overlaps e-direction — ONE diagram on the pair, not two |

### Primitives 3 and 4, found but not built

Ranked by how many points they would serve:

- **TIMELINE — ~9 points.** `mae-ni` (m15, m30), `te-kara` (m15, m23), `toki`
  (m15, m23), `te-iru` (m14 ×2), `ta-form`, `kara-time`/`made-ni` (m19).
  Every one of them is "which event sits where on a line", and every one is
  currently a paragraph. This is the biggest single win left.
- **SCALE — ~5 points.** `yori-comparison` (m20, m26, m28),
  `ichiban-superlative` (m26), `hou-ga-ii` (m28). A ranked axis with two or
  three items on it.

### Still needs a different picture — do not force any existing renderer

`mieru/kikoeru` (m24, volition not direction), transitivity pairs (m33, agent
present vs absent), `ni-location-location` vs `de-action-action` (m6 — one
place, two jobs; wants a "same place, different verb" contrast), `tara`/`to`
and `noni`/`node` (m32, m39 — these want the proposed `kind: contrast` beat).

---

## 2026-08-18 · Spencer's review of the three primitives

Verbatim: *"good so far! the timeline is kind of confusing to me, the intersect
doesnt mean much, but its a great idea we might be able to use … the politeness
register is good, I think we DO want images we preload of who each person is …
the scale display is perfect."*

### Timeline — REBUILT, not tweaked

The crossing-connectors version is gone. The complaint was exactly right: two
beziers meeting in the middle only mean "out of order" once someone tells you
so, which makes the picture a thing to be taught rather than a thing that
teaches. It was decoration standing where the explanation should be.

Replaced with **numbered moments**. The clock carries ① and ②; each clause
carries the badge of the moment it names; the verdict line reads "You say ②
first." No key required — 2-then-1 is already legible to anyone who can count.

Two other changes that came out of the same complaint:

- **The example was bad and that mattered more than the diagram.** 「ねる まえに
  ごはんを たべる」 is a strange thing to say, and a strange sentence makes the
  whole picture feel arbitrary. Both sentences are now VERBATIM m15 beats
  (`m15.ir.yaml:208`, `:217`) over the same two events — 「だいがくに いく まえに
  ごはんを たべる」 / 「ごはんを たべてから だいがくに いく」.
- **The axis was an unlabelled arrow, i.e. a diagram of nothing.** Moments now
  carry wall-clock stamps (7:00 / 9:00).

The said-row is HTML and the clock-row is SVG on purpose: long clauses have to
wrap on a phone, and a fixed viewBox cannot wrap. Measured at 390px: no
horizontal overflow, section 443px.

`TimelineFrame.moments` was added for とき, which is not an ordering connective
at all — both clauses name one moment, so the scene draws ONE node instead of
dimming an irrelevant second one.

### Register — generated cast art, local, 23.6 KB

Spencer asked for preloaded character images generated with the local model,
transparent background. All three landed. Recipe, the two traps, and the
post-processing are in `src/pub/lingo-art/cast/README.md`. Numbers:

| | |
|---|---|
| generation | Z-Image-Turbo via mflux, 8 steps, ~25 s/image, fully offline |
| cast total | **23.6 KB** for four characters (139×256, alpha, 64-colour palette) |
| per file | friend 5.9 · teacher 7.2 · grandmother 6.0 · clerk 5.1 KB |

Three things that were not obvious:

1. **Use `mflux-generate-z-image-turbo`, not `mflux-generate --base-model
   z-image-turbo`.** The generic entry point resolves a weight definition with
   a `text_encoder_2` component the model does not have and dies on a complete
   cache. Cost four failed runs before the per-model binary worked first try.
2. **Background→alpha must flood-fill from the borders, not key on white.** A
   colour key deletes the teacher's shirt and the clerk's sleeves, which are
   white but are not background.
3. **The bow must SKEW, not rotate.** Rotating the image about the feet swings
   the whole rectangle: a foot lifts off the ground line and the character
   reads as toppling. `skewX` pins the bottom edge and slides the top, plus a
   `scaleY` squash so the head actually descends — a bow the head doesn't come
   down for isn't a bow. The lean is re-centred by half its offset or a level-3
   head clears its selection ring by 19px.

The drawn `CastFigure` fallback (`castArt.tsx`) is kept and staged on the QA
page, because the portraits are an asset that can go missing and a register
beat cannot degrade to nothing.

### Scale — unchanged mechanism, real art

*"the scale display is perfect. we can use it at every example a comparison
word is taught, works good as an image mcq replacement."* Rollout is unblocked
at every より/いちばん/ほうがいい point (~5). The only change made: each item now
carries its own course art, resolved through `lookupKanaEmoji` from the vocab
map — so the picture on the axis is the same picture the learner met on the
flashcard. The bar still encodes RANK, which art cannot.

### Politeness match — prototyped, one real constraint found

*"that might be a little too childish, but just an idea."* It isn't childish,
and it earns its place by asking the INVERSE of every other register exercise:
here is a form, who is it for. A learner who can only go form→politeness has
memorised a table.

**The constraint it surfaced: a match grid needs one person per politeness
level, and the cast has TWO level-3 audiences** (おばあさん, てんいん). A
four-way match over うん/はい/ええ has no unique answer. Any real step type must
pick a distinct-level subset or accept many-to-one pairing — it cannot hand the
whole cast to a match grid. The prototype's state machine mirrors
`MatchPairsStepView` so promoting it is a port, not a redesign.

### Still open

- Journey scene: built, staged on `/qa/transfer-diagram`, not wired to m19.
- くださる/いただく transfer diagram at m31 L9 — the one real remaining gap for
  that renderer. Unblocked now that m31 is cleared.
- Peek budget / XP cost, desktop max-width cap on scenes, and whether inv 30
  applies when a diagram names an imageable atom in text.

---

## 2026-08-18 (second pass) · Spencer's review of the rebuild

Verbatim: *"I think the boxes should probably be replaced with the images
themselves … image gens were a bit weird, everyone else is like tilted some
way, was the image transformed weird? … politeness match is cool, I think we
can use it sparingly in the intro lessons for the different registers, and then
occasionally to illustrate politeness as its integral to course pieces, like
itadaku and kudaseru and whatnot. timeline looks good, needs space for sentence
translation to be included."*

### Scale — the art IS the bar now

The coloured rectangle asked the learner to decode a legend before they could
read the axis. Gone. The art is drawn at a size that encodes its rank, which is
the pictogram-bar idiom and needs no key at all.

Spencer suggested grape / apple / watermelon. **No fruit is taught anywhere in
the course** — ぶどう, りんご and すいか are not atoms — but the course already
owns a better ladder: **ねこ / いぬ / ぞう, m1 / m1 / m2**, which order
unambiguously and order the SAME WAY for おおきい and おもい. One picture, two
adjectives, every word available from module 2 onward.

**OPEN RULING.** Size-as-rank is literally true for おおきい/おもい and merely
conventional for たかい — a book drawn larger than a shoe to mean "more
expensive" is a claim the picture cannot check. Both are staged side by side on
the QA page. Either is defensible; it needs a decision before rollout.

### Register — the tilt was mine, not the generator's

Spencer: *"image gens were a bit weird, everyone else is like tilted some way,
was the image transformed weird?"* Yes — the art was fine and the transform was
wrong. `skewX` shears EVERY part of the image, so a head becomes a slanted oval
instead of a rotated circle, and the figures read as melting rather than
bowing. It was a cheaper failure than the rotate it replaced, but still a
failure: **you cannot fake a pose with an affine transform on a raster.**

Fixed by generating the pose. `mflux-generate-qwen-edit` against
Qwen-Image-Edit-2509 (also already cached) EDITS the existing portrait instead
of regenerating it, so the face, palette and outline weight survive and only
the body moves. ~50 s per image.

Two findings worth keeping:

- **Edit, don't re-generate, when identity must hold.** Re-prompting with a
  pose clause produces a different person in the same style.
- **The "small nod" prompt does not land.** It came back as a three-quarter
  turn, not a shallow bow, and the face drifted. Level 2 therefore uses the
  upright portrait with a ~7° lean — small enough that the shear is invisible —
  and only level 3 gets a drawn pose. That is also true to the register:
  です・ます is the polite default, not a deferential act.

### Politeness match — rollout ruled

Spencer: *"use it sparingly in the intro lessons for the different registers,
and then occasionally to illustrate politeness as its integral to course
pieces, like itadaku and kudaseru and whatnot."*

So: **register-intro beats (m7 / m10 / m29) plus the keigo-adjacent
give/receive points** — いただく and くださる at m31 L9, which is also the one
remaining home for the transfer diagram. Those two land on the same lesson,
which is worth noticing before authoring: the beat should not carry both
instruments.

Sparingly is a real constraint, not a hedge — the exercise has one trick and it
does not survive repetition.

### Timeline — translation line added, and more homes than I listed

`TimelineFrame.en` renders the whole sentence in English under the clause row.
Without it the learner decodes two clauses AND an ordering rule at once.

Spencer named three more connectives: **まで, あとで, さいしょ(に)**. まで and
あとで are straightforwardly the same picture (あとで is てから's twin; まで is a
SPAN rather than a point, so the axis may want a shaded band for it). さいしょに
is an ORDINAL rather than a relation, so it wants ①②③ over three moments —
which the numbered design supports natively and the crossing design never
could. Verify each against taught vocabulary before authoring; ordering words
are not automatically atoms.

---

## 2026-08-18 (third pass) · readiness audit before wiring

Spencer: *"for comparison ranking, you can use dollar signs or something if
needed, we probably want to teach fruit somewhere, and from there, i think we
are ready to implement, what am i missing?"*

### Resolved: price ranks by COUNT

`ScaleSpec.rankAs: "count"` + `rankGlyph: "¥"`. Every item draws at one size and
the glyph stack carries the rank. Height still encodes position so the axis
reads identically; only the unit changed from "how big" to "how many". ¥ rather
than $ — the course is Japanese and えん is taught at m5.

### The integration path is proven — this part is not the risk

`ir/mN.ir.yaml` grammar point `diagram:` → `moduleCompiler.ts:983` maps
`gp.diagram` → `transferDiagram` on the `grammar_rule` step →
`GrammarRuleStepView` renders the scene, `RuleHintCard` renders it in hints,
`deriveGrammarMicroSteps` carries it into derived steps. `compile-ir.mjs` is a
pass-through with no field whitelist, so three sibling fields cost nothing new.

**Note the swap:** `GrammarRuleStepView:338` renders `examples[0]` only when
there is NO diagram. The scene REPLACES the first example tile. That is the
mechanism by which a picture removes prose rather than adding to it.

### Five things NOT covered by that path — all verified by grep, not assumed

1. **Scene Japanese is outside the script ladder.** `TransferScene` renders raw
   SVG `<text>`: no `AnnotatedText`, no `applyKanjiSurfaces`, no furigana, no
   romaji, and `applyKanjiSurfaces` never mentions `diagram`. Past M8 that only
   means the scene shows kana while the lesson around it shows kanji —
   inconsistent, harmless. **The register scene is the dangerous one: it targets
   m7/m10, and hiragana romaji retires at M7.** A register beat at or before m7
   shows a romaji-dependent learner text they cannot read. Same class of defect
   as the test-out ladder bug.

2. **Scene Japanese is invisible to the TTS emitter unless the key is literally
   `ja:`.** The emitter is a regex sweep over the YAML
   (`/ja:\s*"([^"]+)"/g`, `emit-tts-deck.mjs:100`). ScaleScene's frames use
   `ja:` and WOULD be picked up — which creates new TTS demand, and uploading
   needs Trevor's AWS creds. TimelineScene (`first.text`/`second.text`) and
   RegisterScene (`forms.1/2/3`) would be **silently skipped**, and
   "wrote=0 cached_skipped=N" reads as success. Decide per scene: rename the
   field to `ja:` and generate clips, or ship mute on purpose.

3. **Nothing gates scene vocabulary.** Authored grammar-review pools are
   comprehensibility-gated — every content word must decompose into atoms with
   `fromModule` ≤ the point's module (`grammarReviewPools.test.ts`). No
   equivalent exists for a diagram. Hand-verification worked for four specs; it
   will not survive ~19 points.

4. **The prose the scene replaces has to actually be cut.** The shell is
   fixed-height and six step types already overflow at 375×667. Dropping
   `examples[0]` is automatic; trimming `step.rule` is not. Every wired point
   needs a before/after `scrollHeight - clientHeight` reading at ≤700px.

5. **No scene has a test.** There is no `*Scene*.test*` anywhere; the transfer
   diagram shipped without one.

### Fruit — m22, and it does not solve m20

m22 is the food module (にく, やさい, さかな). くだもの + fruit belongs there.
Cost: new atoms in `courseAtoms.ts`, emoji vendoring (🍎 is vendored; 🍌 🍊 🍇
🍉 are all MISSING from `src/pub/noto-emoji/svg/`), IR beats, TTS clips, and
`moduleConformance` updates.

**Timing trap: より is m20, before m22.** Fruit can serve m26 いちばん and m28
ほうがいい but not the m20 より point, which still needs pre-m20 vocabulary —
which is exactly why ねこ / いぬ / ぞう (m1/m1/m2) earn their place regardless of
whether fruit gets taught.

---

## 2026-08-18 (fourth pass) · Spencer's rulings, and the corrected fruit plan

Verbatim: *"we likely dont need the diagrams for review, they are just an
effective teaching method. we can wait until after m7 to use the new register
lessons, they should be used sparingly, mostly for teaching. introduce fruit
however you want, maybe sprinkle a few in for earlier lessons, author fruit
images as needed."*

### Diagrams are teaching-only — with one thing worth knowing

Ruled: do not build review support for scenes. But the code already puts them
on a review surface, and it is worth seeing before deciding to strip it.
`grammarReviewPools.ts:301` indexes every tagged `grammar_rule` step and the
session shows that whole card — diagram included — **before a point's FIRST
scheduled review** (teach-before-test). That is a teaching moment inside
review rather than review furniture, so it is being LEFT AS IS. Removing it is
a one-line filter if that reads wrong.

The learner-initiated peek (`RuleHintCard` via `deriveGrammarMicroSteps`) is
also teaching, not review — it re-opens the card that taught them, inside the
teaching lesson.

### Register scenes: m8 and later

Verified rather than assumed: `isRomajiVisible` returns false once
`reachedModuleIndex >= HIRAGANA_ROMAJI_OFF_MODULE` (= 7), so hiragana romaji is
already off AT m7 and a scene there would technically be safe. Spencer's
"after m7" is the safer line and costs nothing, so **m8+**. The m7
register-audience point does not get a scene; m10 and m29 do.

The cast labels are all hiragana, so the katakana ladder (M17) is not in play.

### Fruit — CORRECTING an earlier claim, and where it actually goes

**The third-pass note said m22 is the food module. That is wrong.** m22 is
"Body, health & help: 〜が いたい"; にく / やさい / さかな merely landed there.

The real home is **m9, "Numbers and first purchases"**. It teaches ひとつ /
ふたつ / みっつ and rides on m8's ください, and **every one of its 21 atoms is
`imageable: false`** — it teaches counting and owns nothing countable to count.
Fruit fixes a gap that already exists rather than being sprinkled in.

m9 is also 11 modules ahead of より (m20), so fruit would be available to every
comparison point, which m22 never could have been.

**Script constraint that picks the first fruit.** Katakana rows land two per
module m7–m11 (m9 = na, ha). バナナ needs ナ and バ in the module that
introduces those rows — feasible but tight. **りんご and みかん are pure
hiragana and have no such dependency**, so they go first. すいか and ぶどう
(also hiragana) are the natural pair for a size scale later; バナナ waits for
m11+ or rides m21's や lesson.

### Art: done

All five fruit are now vendored in `src/pub/noto-emoji/svg/` — 🍇 and 🍎 were
already there; 🍉 `emoji_u1f349`, 🍊 `emoji_u1f34a` and 🍌 `emoji_u1f34c` were
fetched from googlefonts/noto-emoji per the documented workflow. **8.7 KB for
the three**, all verified rendering at 96px through the dev server.

---

## 2026-08-18 (fifth pass) · rulings closed, review preface removed

Spencer: *"local tts is fine for now while we wait for trevor to get back, link
the ha clips and make them a to-do, grammar review should not show the card
again, they can just have access to the hint button if that works."*

### DONE — the rule card is a hint in review, not a step

It worked. `useGrammarReviewSession` no longer pushes a passive
`grammar_rule` preface before a new point's first review; it attaches the same
card as `ruleHint` on the scored step (`hintFromRule`, now exported from
`deriveGrammarMicroSteps`). `GrammarReviewSessionPage` renders a **"Show the
rule"** button and the existing `RuleHintCard`.

Three details that are not obvious:

- **The hint attaches for NEW points only.** A point already reviewed does not
  get the rule offered; that mirrors the old `qi.isNew` gate exactly, so the
  change is "same audience, different affordance" rather than a widening.
- **The peek is UNMETERED here** (`remaining={Infinity}`). In a lesson the
  budget exists to stop a learner reading the rule instead of recalling it on a
  first encounter. In review the card is something they were already taught,
  and rationing it just makes them guess. That closes the open "peek budget /
  XP cost" ruling for this surface: **no XP cost, no cap, in review.**
- **The card closes on step change.** An open hint carried into the next
  question would be showing the previous point's rule.
- **`RuleHintCard` now hides its counter when `remaining` is not finite.**
  Passing `Infinity` printed the literal string **"Infinity peeks left"**.
  Caught by reading the component rather than by a test — the live check could
  not reach the button, because a fresh browser has no grammar SRS state and
  the review page renders "No grammar due". That gap is real: **the button and
  card render path is covered only by the hook's unit tests**, not end to end.

`subPhase` is gone from the hook entirely — the state machine is one step per
item now. The test that pinned the old behaviour was rewritten to assert the
new contract in both directions (scored step first AND hint present; no hint
for a non-new point).

### Remaining rulings — closed with defaults

- **Desktop max-width cap on scenes:** none needed. Every scene renders inside
  the rule card, which is already width-capped, and each uses a `viewBox` with
  `className="w-full"` so it scales rather than sprawls.
- **Inv 30 when a diagram names an imageable atom in text:** does not apply.
  Inv 30 exists so an imageable word gets a picture; a scene that draws the
  word IS the picture. Requiring a second one would put an emoji next to a
  drawing of the same thing.

### TTS: local generation is authorised, upload is not

Spencer: *"local tts is fine for now while we wait for trevor."* So new
sentences get clips generated locally (`../lingo-data/.venv`, edge_tts 7.2.8)
and **staged in `tts-publish/`** for Trevor's run. `pipeline.tts.upload` is
still not to be attempted. Standing hazard: a manifest hash with no uploaded
object serves the SPA shell as `text/html` and breaks playback mid-lesson, so
the manifest must not be copied into `src/shared/tts/manifests/` until the
objects are actually up.

The は decision is now a written to-do at
`docs/issues/tts-topic-wa-mispronounced-2026-08-18.md`, with the exact command
to regenerate the three A/B clips (they are not committed — this repo carries
no audio). **It should be answered BEFORE Trevor's run**, or the affected 21
sentences get generated and uploaded twice.
