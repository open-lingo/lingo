# 2026-09-05 — TestFlight feedback, builds 5 + 6 (Spencer + Mikey)

Pulled 2026-09-04 via the App Store Connect API
(`GET /v1/apps/6805652204/betaFeedbackScreenshotSubmissions`). Crash
submissions: **0**. Screenshot submissions: **32** (30 Spencer on iPhone 15 Pro
Max / iOS 26.6.1, 2 Mikey on iPhone 16 Pro / iOS 26.6). Public-link testers are
anonymous in the API, so the split is by device. Item 33 arrived from another
session (Android QA run), not TestFlight.

Screenshots: `2026-09-05-testflight-shots/NN.jpg` (reduced; the Apple-hosted
originals expire 2026-09-10). Numbering is chronological.

Status legend: `open` / `fixed <sha>` / `wontfix (reason)` / `discuss`.

## Build 5 — Spencer, 2026-09-02, JA m30 「て + helper I: 〜てみる / 〜ておく」

| # | Shot | Step | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 1 | 01 | Home, continue card | "look at the scroll bar clipping on the right, bad format there" | layout: scrollbar visible on touch (home is not the lesson stage) | cannot reproduce — no body scrollbar mounts on the native home (probe: OverlayScrollbars absent, native bar hidden on coarse pointer since 8c9792e8); need a fresh shot |
| 2 | 02 | 辞書 how-do-you-read | "Scroll failure for mobile UI" | layout: step scrolls + scrollbar; options clipped behind CTA | fixed fb77a859 (0px overflow on 15PM/13) |
| 3 | 03 | Build what you hear | "clipping over the edge, build box needs to dynamically size and the top play button is huge" | layout: build target box fixed-height, tile bank clipped; play button oversized | fixed fb77a859 |
| 4 | 04 | Cloze しらべてみる | "bad lesson type, doesn't teach anything unique… shirabetemiru is basically two words" | content/design: cloze whose 3 options are all てみる compounds = tests the verb, not the helper | fixed c1bb8da0 (5 clozes now contrast the helper) |
| 5 | 05 | Build "ask the teacher and see" | "sizing is bad, needs to be dynamic so we got on the screen with no scroll bar" | layout: same as 3 | fixed fb77a859 |
| 6 | 06 | Listen-and-answer 時間がないから明日しらべてみる | "Too much spacing between the sentences… make sure we aren't wrapping mid word, shi > rabetemiru is bad" | layout: JA line-break inside a word (needs `word-break: keep-all` / segment-aware wrapping) + line-height too large under furigana | fixed fb77a859 (keep-all + ruby band) |
| 7 | 07 | Build result | "padding on top and bottom of the tiles is a bit much, lots of ugly vertical space" | layout: tile vertical padding | fixed fb77a859 |
| 8 | 08 | Dialogue "What does Ken say" | "get rid of the playing listen button up top and only keep room for the dialogue? They can replay individual lines" | design: drop the header play control in dialogue steps | fixed 052d47eb (header play control removed) |
| 9 | 09 | Dialogue transcript この ことばの いみは？ | "audio gen here was a ha not a wa" | audio: TTS read topic は as /ha/ — regenerate clip; scan other は-topic clips | fixed 2026-09-06: 13 sentence-final は sentences re-synthesised via lingo-data speech overrides (21 clips, ja + ja-keita), uploaded to openlingoapp-site with --force, CloudFront I8088SVE0HNXJ61F0X5PTKHJG3; 7 name/loanword-final は？ lines untouched (no kanji lever); cached phones keep the old clip until eviction |
| 10 | 10 | Match review ことば ↔ language | "Kotoba is word rather than language, failure here; kanji tiles take up too much room, ruby furigana spacing less vertical padding" | content: ことば gloss (m26/m30 atom says "language") + layout: match tiles with furigana too tall | fixed 4c1acbb7 + fb77a859 |

## Build 6 — 2026-09-04 evening

### Kanji fill-in / kanji intro steps (JA, `FillBlankStepView`)

| # | Shot | Step | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 11 | 11 | Fill blank な＿をやる, tiles 姉魚二星 | "Why are we forcing kanji here?" | **content bug**: the blank in なに is filled by 二 (two) — the kanji-fill generator matched the kana に inside なに; also design question of forcing kanji at all | fixed 6af75a62 |
| 12 | 12 | "You already know this word — here is how it's written" → lone stroke, "ten" | "These aren't working period, and we probably want to look into our kanji introduction" | **rendering bug**: kanji 十 shows as a single stroke (stroke-order asset / font fallback?) | hardened (see commit) — WebKit sim runs the full sequence; the device frame is a repaint glitch not reproducible in the sim, re-test on the next build |
| 29 | 29 | Fill blank 今日はごはんがない (correct) | "The greyed out for the answer in the sentence itself looks bad" | visual: filled answer rendered dim after correct | fixed fb77a859 |
| 30 | 30 | Fill blank コーヒーを の＿ もう た, tiles 外年門庭 | "I like this lesson step a bit for kanji learning we just need to fix the formatting" | layout: sentence broken over 3 lines with the blank orphaned at right; tiles unrelated to the word (飲) | fixed fb77a859 (layout); tiles are the kanji pool by design |

### Mikey — ES test-outs (iPhone 16 Pro)

| # | Shot | Step | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 14 | 14 | Test out · Sounds & greetings 8/12, match | "screen bubbles cut off" | **layout bug**: match grid overlaps the status bar/header, bottom third blank — test-out container scrolls inside the wrong box | fixed fb77a859 (window-scroll snap; 0px overflow on 15PM/13) |
| 16 | 16 | Test out · Mi familia 4/12, which-word-do-you-hear | "words slightly cut out in the bubbles" | layout: "el hermano"/"la hermana" clipped in 3-up tiles — tile min-width / font shrink | fixed fb77a859 |

### JA m25 「Conjecture: でしょう / だろう / かな」

| # | Shot | Step | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 15 | 15 | Listen 明日あめだろう MCQ | "This is a bad answer type, we just need the plain translation" | content: answer text "It'll probably rain tomorrow — said the blunt plain way" — strip the register gloss from answer strings (grep m25 for " — said") | fixed 4c1acbb7 |

### JA m26/m30 build, flashcards

| # | Shot | Step | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 13 | 13 | Build "Of all languages, English is the most interesting" (ことばの なかで) | "Not sure if this is a true failure or not but language is 言語 right?" | content: same ことば=language issue as #10; either gloss "words/language" and reword EN, or teach げんご | fixed 4c1acbb7 |
| 17 | 17 | Flashcard front "eat (te-form)" | "Did we really want to include te form? That's kind of useless yeah?" | content/design: conjugated forms as flashcard entries — decide whether inflections are deck items | fixed 76caf531 (JA deck 1009 → 944 cards) |

### JA m30 / m37 ておく + てみる lessons (build 6 walk, 01:33–02:08 UTC)

| # | Shot | Step | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 18 | 18 | Listen らいげつ りょこうが あるから ホテルの よやくを しておく | "formatting here takes up way too much space, needs room and no tacky cutoffs" | layout: 3-line JA sentence pushes 4th option under CTA | fixed fb77a859 |
| 19 | 19 | Listen 先週ちかてつの切符をかっておいた | "Cheese are bad, chikatetsu is subway, look for similar issues please" | content: "underground ticket" → "subway ticket"; sweep JA glosses for Britishisms (underground, holiday, flat, queue, lift, mobile…) | fixed 4c1acbb7 (25 JA modules + es m13 swept) |
| 20 | 20 | Cloze しておく explanation card | "Some clipping here, might need another formatting rework" | layout: explanation card clipped | fixed fb77a859 |
| 21 | 21 | Build 朝が いそがしいから 切符を買っておいた → Not quite | "Not sure if this should be accepted or not but I think it should, maybe another failure node" | grading: bank offered が; 朝が忙しい is valid — accept the が variant (or don't offer が as a distractor) | fixed fbf952e1 (build steps honour alsoAccept; あさが listed) |
| 22 | 22 | Match review 切符/りょこう/コーヒー/ちかてつ/ホテル | "Same kanji failure, we need a way to fit these on the page; when furigana disappears it should increase in size to fill the space" | layout: match tiles — reserve furigana row only when present; fit 5 pairs without scroll | fixed fb77a859 (dense rows at 6+) |
| 23 | 23 | 電気 how-do-you-read | "make the top box a bit shallower, keep font size and increase the vertical on the buttons below; button text fills vertical height, shrinking to prevent wrapping" | design: reading-MCQ proportions | fixed fb77a859 |
| 24 | 24 | Build "class tomorrow… learn the explanation in advance" | "SOO much dead space" | layout: same family as 3/5 | fixed fb77a859 |
| 25 | 25 | Build しつもんをして こたえをきいてみた | "does mita belong here? Can't you get the same sentence without it" | content: EN "heard what the answer was" doesn't cue てみる; reword EN ("asked and found out") | fixed 4c1acbb7 |
| 26 | 26 | Word MCQ とる 📸 | "spacing here is kind of bad not enough harmony" | design: 2×2 emoji-MCQ vertical rhythm | fixed fb77a859 |
| 27 | 27 | Typed translate "I'll ask what the answer to this question is" | "Miru doesn't feel necessary here" | content: EN prompt doesn't cue てみる — reword ("I'll ask and see") | fixed 4c1acbb7 |
| 28 | 28 | Build こたえはわからないけど…とりあえず あにに きいてみる | "Is toriaezu necessary here? maybe reword the English sentence… 'first off, xxx'" | content: EN "…for now" → "first off, I'll ask my brother and see" (m37 とりあえず atom) | fixed 4c1acbb7 |
| 31 | 31 | Speak きのこや きゅうりを 買う | "More formatting issues" | layout: speak card scrolled, furigana か on its own line, mic CTA clipped | fixed fb77a859 |
| 32 | 32 | Build "There's a big boat" tile ふねが | "Not sure if we want to separate the particle here" | content/tiling: m12 tile bank fuses noun+particle; decide per module (early modules fuse on purpose?) | fixed (see commit) — not m12: the SRS review builder split mined sentences on spaces, 436/468 mined sentences fused a particle; now tokenized like compileModule |

## Pulled 2026-09-06 (new since the first pull)

| # | Shot | Device | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 33 | 33 | iPhone 14 Pro, KO m21-5 speaking 이거는 김치라고 해요 | "bad recognition" — transcript 이 graded Perfect! | **grading bug**: any substring of the target scored 1 | fixed 1c85fecc |
| 34 | 34 | iPhone 14 Pro, KO m21-6 build 비빔밥하고 라면 주세요 | "buttons too tall" | layout: same tile family as #3/#7 (shared BuildSentenceStepView) | fixed fb77a859 |
| 35 | 35 | 15 Pro Max, JA m30 build あした つかうから しゃしんを おくっておいた | "Should be correct no?" — learner placed に after あした | grading/content: に is a floor particle contrast; あしたに is not natural Japanese (relative time words take no に) | discuss — position: keep rejecting; あした takes no に |

## Build 8 — Spencer, 2026-09-06 evening (pulled 2026-09-07)

20 more screenshot submissions on build 8 (all iPhone 15 Pro Max), items 36–55.
Shots: `2026-09-05-testflight-shots/36.jpg` … `55.jpg`.

| # | Shot | Surface | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 36 | 36 | Flashcard 忙しい | "We need a way to creatively resolve the bad spacing here, what edge cases are there for the furigana being so wide it spaces the word? Maybe we can left align position it?" | furigana: WebKit widens the kanji to the reading's width → "忙 しい" | fixed c1faad87 (`.kanji-ruby { ruby-align: start }`; reading overhangs the kana; measured 68.6px == bare word) |
| 37 | 37 | Flashcard 居る | "Is this wrong? It's for the 'to exist' いる" | content: 居る is a dictionary spelling; いる is written in kana | fixed c1faad87 (atom loses `kanji`; also 御飯 family → ご飯) |
| 38 | 38 | Home | "Bad clipping here … should be no real horizontal scroll for these pages either" | layout: Recent progress rows wider than the viewport → page scrolls sideways (also the #1 scrollbar) | fixed (lane C) |
| 39 | 39 | Practice › Grammar rule card | "All the extra border space here seems inefficient … drop the blue vertical lines and just cordon off a section with the horizontal lines inside the GRAMMAR section" | layout: card padding + side rules on a phone | fixed (lane D) |
| 40 | 40 | Conjugation quiz | "This clips off the screen, we using space inefficiently anywhere? Do we need the header visible?" | layout: 4 options under the tab bar | fixed (lane D) |
| 41 | 41 | Free drill | "This screen is a little ugly on mobile, make we rework the buttons a bit and then we should scope out adding more conjugations, they should be able to see ANY verb they've learned here if they want to do 'up to X module'" | UI + scope | scoped `docs/practice-any-verb-drill-scope.md`; chips restyle folded into lane D |
| 42 | 42 | Conjugation trainer landing | "Too much info up top, they don't need the page links on mobile … correcting the star button (clipped off currently)" | layout: breadcrumbs on phone; Combined-forms toggle clipped | fixed (lane D) |
| 43 | 43 | Particle practice cloze | "Needs the UI fit fix for notch phone like my iPhone and is the kanji correctly exposed here?" | layout: no safe-area top inset on the drill shell. Kanji: かばんの うえ has none eligible at that module — correct | fixed (lane D, all drill shells) |
| 44 | 44 | Particle practice hub | "This page is a little useless as is, it's effectively grammar training. Maybe we expand the grammar training to count particle usage as training and do a better 'combined forms' …" | scope | scoped `docs/practice-particle-training-scope.md` |
| 45 | 45 | Shop | "These take up too much space here, maybe we look for better space saving or list two tiles in a row or have better categories?" | layout | fixed (lane D, 2-up cards) |
| 46 | 46 | Build tray drag | "Look and mado and tokei, weird potential failure when dragging I was moving shirabete, simulate an example like this and see if we can find why or get it to recreate" | dnd: rect-swap preview overlaps variable-width tiles mid-drag (reproduced 10/20) | fixed 40612f16 (live reorder + DragOverlay + hysteresis; 160/160 clean) |
| 47 | 47 | Listen & answer | "Way too much spacing between the sentences still with the furigana, don't they normally display it vertically next to the letters in Japanese books? … less padding vertically" | furigana band + relaxed leading | fixed c1faad87 (helper line-height 1, leading-snug; 101 → 94px for the two-line case; the band itself is the reading) |
| 48 | 48 | Kanji reading MCQ | "when you pick the answer there is a vertical movement on the play button … think of some ideas please" | layout: replay button mounted on submit | fixed 3425933b (slot reserved, locked before the answer) |
| 49 | 49 | Listening build | "Same as other, little too much vertical spacing and padding, furigana can be a bit lower close to the word, should be a bit tighter" | tiles + furigana | fixed c1faad87 (tile leading-tight: 39→35 / 50→48px) |
| 50 | 50 | Build tray | "look at how much vertical space is used here. Shitsumon has so much used" | tiles: a row is as tall as its tallest (furigana) tile | fixed c1faad87 (same; residual 11px is the reading band — smaller furigana would need a floor below 12px, Spencer's call) |
| 51 | — | ES typed answer (Mikey) | "both question marks for a Spanish sentence works but not one at the end, 'improper' but should still be a correct answer" | grading: strip was trailing-only | fixed b332803f (both edges, ¿ ¡ « » quotes dashes; 7 callers) |
| 52 | 52 | Cloze おぼえておく | "the furigana adds so much visual spacing" | as 47 | fixed c1faad87 + 3425933b |
| 53 | 53 | Cloze after answer | "Same comment on the play button … maybe a lock over the button or something until they answer?" | as 48 | fixed 3425933b (lock glyph, exactly that) |
| 54 | 54 | Dialogue comprehension | "transcript box can move a bit higher maybe, or we move the transcript text and less vertical padding on the answer buttons?" | layout | open — SE-class crowding; revisit with the next fit pass |
| 55 | 55 | Match (review) | "Still vertical crowding but better" | layout | monitor (0px overflow on 15 Pro Max; scrolls by design) |

## Other channels

| # | Source | Verbatim / summary | Class | Status |
|---|---|---|---|---|
| F1 | Android QA session + Mikey | First-time user picks a username; first `POST /users/me` is slow/opaque and the client shows "Failed to save" even though the server registered the user. Retry gets 409 "User already registered", which the client maps to "Username already taken" (`src/features/profile/useOwnProfile.ts:86` treats every 409 that way). User is stuck on the username screen though signed in. | **FTUE bug** | fixed 27a6bfa2 |

## Themes → fix lanes

1. **Lesson-stage vertical fit (12 items: 2,3,5,6,7,18,20,22,23,24,30,31).** One family: fixed-height target boxes, tile padding, furigana row reserved when absent, JA mid-word wraps, and the CTA overlapping the last option. Fix in the shared step layout, then re-shoot every step type on a 15 Pro Max viewport (headless recipe in memory).
2. **Test-out container (14, 16)** — separate component from the lesson stage; header overlap is a distinct bug.
3. **Kanji steps (11, 12, 29, 30)** — the な二 match and the 十 glyph are correctness bugs, not styling.
4. **Content strings (10, 13, 15, 19, 25, 27, 28)** — glosses and EN prompts in m25/m26/m30/m37 IR; all one-line YAML edits plus a Britishism sweep.
5. **Grading (21)** and **audio (9)**.
6. **FTUE (33)** — client: treat "User already registered" as success; re-check `GET /users/me` before surfacing a save error.
7. **Discuss with Spencer (4, 8, 17, 32)** — step-type and tiling decisions, not bugs.
