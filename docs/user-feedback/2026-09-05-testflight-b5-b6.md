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
| 1 | 01 | Home, continue card | "look at the scroll bar clipping on the right, bad format there" | layout: scrollbar visible on touch (home is not the lesson stage) | open (home scrollbar — not the lesson stage; touch scrollbars are hidden there only) |
| 2 | 02 | 辞書 how-do-you-read | "Scroll failure for mobile UI" | layout: step scrolls + scrollbar; options clipped behind CTA | fixed fb77a859 (0px overflow on 15PM/13) |
| 3 | 03 | Build what you hear | "clipping over the edge, build box needs to dynamically size and the top play button is huge" | layout: build target box fixed-height, tile bank clipped; play button oversized | fixed fb77a859 |
| 4 | 04 | Cloze しらべてみる | "bad lesson type, doesn't teach anything unique… shirabetemiru is basically two words" | content/design: cloze whose 3 options are all てみる compounds = tests the verb, not the helper | discuss |
| 5 | 05 | Build "ask the teacher and see" | "sizing is bad, needs to be dynamic so we got on the screen with no scroll bar" | layout: same as 3 | fixed fb77a859 |
| 6 | 06 | Listen-and-answer 時間がないから明日しらべてみる | "Too much spacing between the sentences… make sure we aren't wrapping mid word, shi > rabetemiru is bad" | layout: JA line-break inside a word (needs `word-break: keep-all` / segment-aware wrapping) + line-height too large under furigana | fixed fb77a859 (keep-all + ruby band) |
| 7 | 07 | Build result | "padding on top and bottom of the tiles is a bit much, lots of ugly vertical space" | layout: tile vertical padding | fixed fb77a859 |
| 8 | 08 | Dialogue "What does Ken say" | "get rid of the playing listen button up top and only keep room for the dialogue? They can replay individual lines" | design: drop the header play control in dialogue steps | discuss |
| 9 | 09 | Dialogue transcript この ことばの いみは？ | "audio gen here was a ha not a wa" | audio: TTS read topic は as /ha/ — regenerate clip; scan other は-topic clips | open — needs lingo-data TTS regen (no in-repo override) |
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
| 17 | 17 | Flashcard front "eat (te-form)" | "Did we really want to include te form? That's kind of useless yeah?" | content/design: conjugated forms as flashcard entries — decide whether inflections are deck items | discuss |

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
| 32 | 32 | Build "There's a big boat" tile ふねが | "Not sure if we want to separate the particle here" | content/tiling: m12 tile bank fuses noun+particle; decide per module (early modules fuse on purpose?) | discuss |

## Pulled 2026-09-06 (new since the first pull)

| # | Shot | Device | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 33 | 33 | iPhone 14 Pro, KO m21-5 speaking 이거는 김치라고 해요 | "bad recognition" — transcript 이 graded Perfect! | **grading bug**: any substring of the target scored 1 | fixed 1c85fecc |
| 34 | 34 | iPhone 14 Pro, KO m21-6 build 비빔밥하고 라면 주세요 | "buttons too tall" | layout: same tile family as #3/#7 (shared BuildSentenceStepView) | fixed fb77a859 |
| 35 | 35 | 15 Pro Max, JA m30 build あした つかうから しゃしんを おくっておいた | "Should be correct no?" — learner placed に after あした | grading/content: に is a floor particle contrast; あしたに is not natural Japanese (relative time words take no に) | discuss |

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
