/**
 * TestFlight build-12 feedback ledger, structured for the review page
 * (`/qa/feedback-b12`). Sourced verbatim from
 * `docs/user-feedback/2026-09-14-testflight-b12.md` (rows 63, 65–86; #63 is
 * carried forward from the b5/b6 ledger, still open. #86 is a prod web
 * incident Spencer hit directly, not a TestFlight screenshot submission —
 * added to this ledger anyway so it goes through the same review flow).
 *
 * `decision` currently mirrors that doc's "Proposed fix" column — it is a
 * plan, not a completed outcome. `link` / `eyeball` are left undefined for
 * every row; the wave coordinator fills those in per item once each lane's
 * work lands (and will overwrite `decision` with what was actually done).
 */

export type FeedbackTester = "Spencer" | "mom" | "sister" | "tester";
export type FeedbackStatus = "open" | "built" | "fixed" | "discuss";
export type FeedbackLane = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type FeedbackB12Item = {
  n: number;
  build: number;
  tester: FeedbackTester;
  /** Screenshot file name under docs/user-feedback/2026-09-05-testflight-shots/, no extension. */
  shot: string;
  screen: string;
  /** Full verbatim tester quote — never truncated. */
  verbatim: string;
  cls: string;
  /** What we did / decided. For now, copied from the doc's "Proposed fix" column. */
  decision: string;
  needsSpencer: boolean;
  status: FeedbackStatus;
  /** Relative in-app path, e.g. "/ja/learn/lessons/xxx?step=3". Undefined until wired. */
  link?: string;
  /** One-line "what to eyeball" note. Undefined until filled in. */
  eyeball?: string;
  lane: FeedbackLane;
};

export const FEEDBACK_B12_ITEMS: FeedbackB12Item[] = [
  {
    n: 63,
    build: 10,
    tester: "Spencer",
    shot: "63",
    screen:
      'Listening comprehension MCQ 「やすかったから かっておいた」 (ListeningComprehensionStepView.tsx)',
    verbatim:
      "Scrolls here are ugly, maybe we limit these to 3 answers and then convert a few more of them into the sentence build for English… Big decision",
    cls: "feature",
    decision: "Touch/mobile listening MCQs render 3 options (correct + 2 seeded distractors); desktop/web renders all authored options. Same coarse-pointer detector as the learn map. No authoring change. (6bdd332e)",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-challenge?step=1",
    eyeball: "Spencer: 3 on mobile, keep 4 on web (lane J). Exactly 3 option buttons, no scroll before CONTINUE. Decide: extend the cap to dialogue questions?",
    lane: "E",
  },
  {
    n: 65,
    build: 12,
    tester: "Spencer",
    shot: "65",
    screen: "Sign-up flow, setup screen not clearing after account creation",
    verbatim:
      "Not this screenshot but when making an account, it creates a username and name and saves login but it doesn't clear the setup screen, issue Aralia ran into",
    cls: "nav-behavior",
    decision:
      "Fixed — setup screen now clears after account creation.",
    needsSpencer: false,
    status: "fixed",
    lane: "C",
  },
  {
    n: 66,
    build: 12,
    tester: "mom",
    shot: "66",
    screen: "Spanish lesson, play button (mom, iPhone13_4)",
    verbatim: "The play button doesn't work",
    cls: "feature",
    decision:
      "Fixed — root cause was 589 unuploaded Spanish TTS clips (m13–m15) missing manifest entries; clips pushed.",
    needsSpencer: false,
    status: "fixed",
    lane: "C",
  },
  {
    n: 67,
    build: 12,
    tester: "sister",
    shot: "67",
    screen: 'Spanish "Which word do you hear?" MCQ, no audio (sister, iPhone17_3)',
    verbatim:
      "Listen here bitch…except I can't because there was no audio playing🙄",
    cls: "feature",
    decision: "Fixed — same Spanish audio gap as #66.",
    needsSpencer: false,
    status: "fixed",
    lane: "C",
  },
  {
    n: 68,
    build: 12,
    tester: "tester",
    shot: "68-2",
    screen:
      'Own-profile tap → PublicProfilePage.tsx ("This profile is private") (tester, iPhone15_4)',
    verbatim: "Trying to open my own profile",
    cls: "nav-behavior",
    decision: "BUILT: your own profile no longer falls into 'This profile is private' — the owner branch now wins before the private/404 branch (isPrivate && !isSelf). Regression test added (12/12 profile tests). Not screenshot-verified live: the dev server has no backend, so /u/* errors instead of 404ing here.",
    needsSpencer: false,
    status: "built",
    link: "/home",
    eyeball: "Spencer 2026-09-14: SHIP. Tap your avatar → View profile: you should see your own profile with the Edit button. (Needs the real backend, so check on the phone build or the web app.)",
    lane: "C",
  },
  {
    n: 69,
    build: 12,
    tester: "Spencer",
    shot: "69",
    screen: "JA m30-class Build step, tile bank (BuildSentenceStepView.tsx)",
    verbatim:
      "Still some concerns with this lesson type, seems like too much padding on the blocks still, they take up so much vertical space, maybe we shrink build tiles size by 15% overall and decrease internal padding by 10-15% where we can, might feel a little tight. Also the build what you hear takes up too much space, go research recent Duolingo screenshots and see how they format it.",
    cls: "layout-fit",
    decision: "BUILT: build + listening-build tiles −15% size / −12.5% padding (big tiles 20/12 px → 17.5/10.5 px padding, font −15%; dense tiles 16 → 13.6 px). Listening-build play button 56×56 → 44×44 px with a lighter shadow (compact Duolingo-style control; Duolingo numbers were NOT verified online, taken from memory). Single-answer MCQ-shaped pickers left alone (they mirror MultipleChoice sizing).",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-1?step=6",
    eyeball: "Spencer 2026-09-14: SHIP. Play button vs the prompt text; tiles never wrap mid-word; does −15% feel too tight?",
    lane: "A",
  },
  {
    n: 70,
    build: 12,
    tester: "Spencer",
    shot: "70",
    screen: "JA m30-class Cloze step (ParticleClozeStepView.tsx)",
    verbatim:
      "Fukuyama should be a bit smaller here, there shouldn't be word spacing like near raigetsu and gaikoku and the ? Isn't aligned with the complete the sentence leaving wasted dead space. Look for similar defect/visual blemish class",
    cls: "layout-fit",
    decision: "BUILT: furigana ratio 0.65 em → 0.55 em (the 12 px floor you set on 2026-09-09 is kept; ruby over 外国 measured 15.6 → 13.2 px). The word gap at authored bunsetsu spaces tightened 5.4 → 2.5 px via word-spacing on Japanese text (a hint of gap kept so words don't run together). The ? hint now sits on the same row as COMPLETE THE SENTENCE. #62 centring untouched. Shared CSS: applies to every furigana step (build/listen/dialogue checked).",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-challenge?step=7",
    eyeball: "Spencer 2026-09-14: SHIP. Ruby size over 外国, the gap before it, the ? row. Also glance at a build and a dialogue step since this is shared.",
    lane: "E",
  },
  {
    n: 71,
    build: 12,
    tester: "Spencer",
    shot: "71",
    screen: "JA m30-class typed-translate step (TranslateStepView.tsx)",
    verbatim:
      "This looks visually pretty boring, maybe we make their typing a little bigger? Move the box up vertically a bit more or include images or something?",
    cls: "visual-polish",
    decision: "BUILT: typed-translate textarea 16 → 18 px; on mobile the prompt + box sit ~117 px higher (label top 230 → 112 px) instead of vertically centred; desktop unchanged. No images (that would be a per-sentence content change — say if you want it scoped).",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-1?step=12",
    eyeball: "Spencer 2026-09-14: SHIP. Box near the top, bigger typing. Still boring? Images are the next lever.",
    lane: "C",
  },
  {
    n: 72,
    build: 12,
    tester: "Spencer",
    shot: "72",
    screen:
      'JA m30 L12-class Build step, "I took music lessons from my older brother and saw…" (BuildSentenceStepView.tsx, content: curriculum/ir/m30.ir.yaml:896)',
    verbatim:
      'These kinds of English aren\'t natural, there has to be a better way to illustrate Miru here right? Maybe "I had a go at taking music lessons from my older brother" or maybe something. It\'s nice to try and emulate Japanese sentence ordering by keeping miru/saw at the end but it\'s just unnatural',
    cls: "content-gloss",
    decision: "BUILT: 'I took music lessons from my older brother and saw, but I was bad at it' → 'I tried taking music lessons from my older brother, but I was bad at it'. Plus 38 more '…and saw / …and see' sentence glosses across all 13 m30 lessons reworded to 'tried Xing' (module's own ban on 'try to' kept). Rule cards keep 'and see' as their recognition test on purpose. Authoring note in m30 IR updated so the pattern doesn't return. Japanese/audio untouched, no new clips.",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-challenge?step=12",
    eyeball: "Spencer: likes it; sweep for the same unnaturalness class later (delayed to-do). Does 'tried Xing' read natural? Spot-check ja-m30-neo-1?step=0 and ja-m30-neo-3?step=0 too.",
    lane: "D",
  },
  {
    n: 73,
    build: 12,
    tester: "Spencer",
    shot: "73",
    screen:
      "JA m30-class Listening/dialogue step, furigana + sentence sizing (DialogueListenStepView.tsx or ListeningComprehensionStepView.tsx prompt block)",
    verbatim:
      "Sentence takes up a bit too much space, same Furigana shrink if we can, and shrink sentence text by 20% at least,",
    cls: "layout-fit",
    decision: "Furigana kept at 0.55em; hairline gap added above the kanji (margin-bottom −3px → −3px + 0.1em). Build tile grows 50.25 → 51.45 px (+1.2 px), inside the approved trim. (8316fcf6)",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-challenge?step=1",
    eyeball: "Spencer: super close — a touch more gap between kanji and furigana (lane K). Transcript size and the 窓/前 furigana.",
    lane: "E",
  },
  {
    n: 74,
    build: 12,
    tester: "Spencer",
    shot: "74",
    screen: "Same step as #73, options visible (content: m30.ir.yaml:885)",
    verbatim:
      "Also note same translation issues I had earlier, gengo is used for language no? Isn't kotoba a bad usage here? Is this just a limit due to their vocab? Do we maybe want to scope in teaching the words that makes these sentences more realistic and stop teaching these less common usages as the MAIN meaning?",
    cls: "content-gloss",
    decision: "Taught 言語（げんご）and 日本語（にほんご）in m30-neo-7 (the ならう lesson, beside えいご: listening step 8 + build step 9 + a recognition touch at step 18) and used げんご — not ことば — for 'the language' in the module's abroad sentences. Country names skipped: m30 avoids copula sentences, so 'Xご is a language' would be off-pattern. Bonus: registering にほんご fixed m32/m38 mis-tokenising it as にほん + ご (five). 6 clips staged. (9d3a33d7; follow-up lane reuses げんご in a later module so the exposure audit stays at 95.)",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-7?step=8",
    eyeball: "Spencer: teach 言語 and use it, plus にほんご/country names if untaught (lane M). Is 'learn the language' acceptable with ことば, or do you want げんご authored in?",
    lane: "D",
  },
  {
    n: 75,
    build: 12,
    tester: "Spencer",
    shot: "75",
    screen:
      "JA m30-class Build step, empty target box (BuildSentenceStepView.tsx target area, ~line 602/617)",
    verbatim: "Sentence box defaults too big here, too much scroll initially forced",
    cls: "layout-fit",
    decision: "Desktop/fine-pointer only: the grammar example-sentence furigana renders at 0.62em instead of 0.55em, with the same gap; mobile floor and every other furigana host untouched. (8316fcf6)",
    needsSpencer: false,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-1?step=15",
    eyeball: "Spencer: desktop example-sentence furigana slightly bigger + same gap (lane K). No forced scroll before placing a tile; CHECK doesn't overlap the last row.",
    lane: "A",
  },
  {
    n: 76,
    build: 12,
    tester: "Spencer",
    shot: "76",
    screen:
      'Same step as #75, filled (content: m30.ir.yaml:885, gloss "I\'m going abroad next month, so I\'ll take lessons in the language in advance")',
    verbatim:
      "This is also a bad translation no? Definitely an authoring note, we need to use the CLOSEST English 1-1 word translation, I may misunderstand naratte but lesson and language feel off to me.",
    cls: "content-gloss",
    decision: "Shipped with #74: m30-neo-challenge's two がいこく sentences and their cloze now read げんご instead of ことば; EN unchanged ('learn the language'). (9d3a33d7)",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/lessons/ja-m30-neo-challenge?step=0",
    eyeball: "Spencer: ship with the 言語 teach-and-replace (lane M). Closest-gloss reading of ならう / ことば.",
    lane: "D",
  },
  {
    n: 77,
    build: 12,
    tester: "Spencer",
    shot: "77",
    screen:
      "JA course map, vertical night-metro view (VerticalNetworkMap.tsx + transitLearnPage.css)",
    verbatim:
      "Background is slightly too transparent, maybe increase opacity 10%, love the background art though find the recipe we used to make it and then do it for the other languages, also the zone markers shouldn't take up as much space as that and maybe we give like a little even slightly darker rounded background for the 13 lessons and the module names. Similar to how the side quests have.",
    cls: "visual-polish",
    decision: "Desktop map now paints the same pinned photo layer as mobile (0.44 opacity) from an mflux/Z-Image-Turbo wide torii render (1792×1024, 269 KB), parallaxing with the horizontal pan. NEEDS YOUR EYES: the desktop panel is a light day-skyline, so the night photo reads as muddy grey behind it — options: darken the desktop panel to match the mobile night metro, drop opacity, or keep. (bbce5c3f)",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn",
    eyeball: "Desktop 1440 wide: /ja/learn, dismiss the placement modal; compare the sky band with the mobile map. Say darken / lower opacity / keep.",
    lane: "B",
  },
  {
    n: 78,
    build: 12,
    tester: "Spencer",
    shot: "78",
    screen: "Module/station sheet modal (DistrictView.tsx)",
    verbatim:
      "I also think this menu needs a small visual pass, delete next and previous station buttons and the module naming up top can remove the module 30 and just keep N4 or remove begins actually, that's better, the X button needs infill and then we can shrink the whole box vertically by like 15% half on top and bottom. Buttons need to just feel a bit more alive.",
    cls: "visual-polish",
    decision: "BUILT: prev/next station buttons removed; eyebrow shows only the level token ('N4', nothing for modules without one); X button infilled; header/footer padding −15%; lesson rows, Test-out link and Continue get pressed (scale 95%) + hover states.",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn?tier=n4",
    eyeball: "Spencer: probably good. Tap a station to open the sheet. Press the rows — static shots can't show the pressed state.",
    lane: "B",
  },
  {
    n: 79,
    build: 12,
    tester: "Spencer",
    shot: "79",
    screen: "Practice tab landing (PracticePage.tsx)",
    verbatim:
      "We need to make sure that when they open the practice page it always starts at the top of the page, sometimes issues happen there.",
    cls: "nav-behavior",
    decision: "BUILT: the Practice tab resets scroll to the top on mount (same pattern as the lesson shell). Local coder wrote it on the 2nd run (1st run claimed success and wrote nothing).",
    needsSpencer: false,
    status: "built",
    link: "/ja/practice",
    eyeball: "Spencer 2026-09-14: SHIP. Scroll down in Practice, leave, come back — it opens at the top.",
    lane: "C",
  },
  {
    n: 80,
    build: 12,
    tester: "Spencer",
    shot: "80",
    screen: "Flashcard reviewer / test-out completion (feature request, not a bug in this screenshot)",
    verbatim:
      'Also, we want to make it so when people test out modules, their fsrs state gets coded on an exponential scale or something if we can, or maybe a linear function at 5 days per module I.e if you test out of module 30 and all below, then module one gets 120 days fsrs? And then maybe for anything over 90 days we mark the word as "known" and they don\'t see it anymore or we exponentially do this somehow so they see it almost never and anything over 60 days or something gets a little further, that make sense? I don\'t want people reviewing words they already know if they don\'t have to',
    cls: "feature",
    decision: "Verified end to end: m14 pass seeds 325 atoms 5…70 d; m30 pass seeds 563 atoms 5…150 d with m13 = 90 d = known (>=); never shortens; known never due (311/0); banded placement shares the same path; survives reload. Two defects found and being fixed (lane O): seeding did one full store write PER atom (563 round-trips, 0.7–1.4 s desktop, iOS slower) → batched to one write; JA skill tiers stopped at m29 so banded placement could never credit m30–m46.",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn/test-out/m30",
    eyeball: "Spencer: ship, but Fable QAs the seeding further (lane L). Pass the m30 test-out, then /ja/practice/flashcards/cards → Status: Known; /ja/practice/flashcards/review must never show them. Want the 120-day anchor or an exponential curve instead?",
    lane: "F",
  },
  {
    n: 81,
    build: 12,
    tester: "Spencer",
    shot: "81",
    screen: "Home page, Recent Progress + Quests (HomeVariant1.tsx)",
    verbatim:
      "Recent progress doesn't need individual things named maybe just expand to include lesson counts or some other overall progress tracker if we have it? XP gained? Something idk, this page is just too much vertical scroll and could be broken slightly more into sub pages, also we need to emulate Duolingo's quests if we can",
    cls: "info-density",
    decision: "BUILT: 'Recent progress' is now one fixed-height stat row (Lessons done / XP earned / Day streak, from data that already existed) instead of a per-lesson list that grew with history; quest reward is a persistent pill next to the progress bar (Duolingo-style). No sub-pages added.",
    needsSpencer: true,
    status: "built",
    link: "/home",
    eyeball: "Spencer 2026-09-14: SHIP. Less vertical scroll; does the stat row carry enough? Want quests broken into their own page?",
    lane: "C",
  },
  {
    n: 82,
    build: 12,
    tester: "Spencer",
    shot: "82",
    screen: "Shop page, item grid (ShopPage.tsx)",
    verbatim:
      "Shop items take up too much space, a 3x grid for these repeating cosmetics would be good and a 2x for these usable items.",
    cls: "info-density",
    decision: "BUILT: shop grid is now 2 columns from the phone width for power-ups and 3 columns for the repeating cosmetics (frames, titles, banners); same on the profile inventory. Cards reflow without clipping at 1/3 width. Local coder did both files (accepted after its first combined run fabricated a diff).",
    needsSpencer: false,
    status: "built",
    link: "/ja/shop",
    eyeball: "Spencer 2026-09-14: SHIP. 3-up cosmetics, 2-up usables, no clipped text.",
    lane: "C",
  },
  {
    n: 83,
    build: 12,
    tester: "Spencer",
    shot: "83",
    screen: "Settings modal, tab row + Accessibility panel (SettingsNav.tsx)",
    verbatim:
      "Scroll bar up top needs to be indicated as a scroll somehow and the settings page feels too flat, spruce it up some how please",
    cls: "visual-polish",
    decision: "BUILT: the settings tab row shows a right-edge fade (left fade appears once scrolled) so it reads as scrollable — no native scrollbar, per the touch doctrine. 'Too flat': each settings group now sits in the app's card style (border + shadow) with row insets. Restrained on purpose — say what 'spruce it up' means if you want more (icons, colour accents, section headers).",
    needsSpencer: true,
    status: "built",
    link: "/settings",
    eyeball: "Spencer 2026-09-14: SHIP. Fade on the tab row; groups read as cards. Enough, or push further?",
    lane: "C",
  },
  {
    n: 84,
    build: 12,
    tester: "Spencer",
    shot: "84",
    screen: "Course map top header card (TransitSignageHeader.tsx, subtitle from transitStrings.ts)",
    verbatim:
      "The top Japanese for beginners label seems useless, might be better to remove or replace with something else, they won't look at module view too often I think but it is wasted space",
    cls: "info-density",
    decision: "BUILT: the '学習路線図 — Japanese for Beginners' header card is hidden on mobile/touch (below the md breakpoint), desktop unchanged; a small spacer keeps the map off the top bar. Nothing replaces it for now.",
    needsSpencer: true,
    status: "built",
    link: "/ja/learn",
    eyeball: "Spencer 2026-09-14: SHIP. Map starts right under the top bar — enough breathing room? Want something useful in its place?",
    lane: "B",
  },
  {
    n: 85,
    build: 12,
    tester: "Spencer",
    shot: "85",
    screen: "Test-out flow, Build what you hear step mid-run (works in this shot)",
    verbatim:
      'I tried to test out and it seems like it didn\'t wait for the fetch the first time and instantly errored saying "no test out questions found" maybe this one needs a better wait',
    cls: "nav-behavior",
    decision: "Fixed by 3e444529 (test-out waits for courseReady before deriving the bank) — shipped after build 12 was cut. Retested cold on the build-13 code: 8/8 headless cold-opens of /ja/learn/test-out/m14 and /m30 loaded a real step, never 'no test-out questions'. testOutColdLoad.test.tsx 2/2.",
    needsSpencer: false,
    status: "built",
    link: "/ja/learn/test-out/m14",
    eyeball: "Spencer: ship. Verify on build 13 by cold-opening this URL: loading state, then a real 0/12 step.",
    lane: "F",
  },
  {
    n: 86,
    build: 12,
    tester: "Spencer",
    shot: "86",
    screen: "Prod web app (app.openlingoapp.com), a long-lived tab/PWA session open across a deploy",
    verbatim:
      "Something went wrong — Failed to fetch dynamically imported module: https://app.openlingoapp.com/assets/ProtectedHome-DlN-DvKc.js",
    cls: "infra",
    decision:
      "BUILT, five pieces: (1) vite.config.ts now stamps every build with __LINGO_BUILD_ID__ (GITHUB_SHA in CI); (2) lazyRetry.ts keys its one-time chunk-reload guard on that build id, so a tab that already burned its reload on an OLDER deploy gets a fresh reload budget on the NEXT one instead of falling straight through to the error boundary; (3) the service worker's hashed-assets CacheFirst rule now rejects an HTML response instead of pinning the SPA shell under a chunk's URL forever (root cause: CloudFront maps a deleted chunk's 403/404 to index.html with a 200, and the old rule cached that as if it were the real .js); (4) AppErrorBoundary shows 'Update available' copy for this error class and clears the reload flag before its own manual Reload; (5) the deploy workflow no longer deletes the previous build's assets/ + hashed content/v1/ files immediately — they're kept 7 days (~0.5 GB steady state) so an already-open tab can still fetch them, then pruned.",
    needsSpencer: false,
    status: "built",
    link: "/home",
    eyeball:
      "Not reproducible on localhost (dev server has no SW/deploy). Verify on prod after the NEXT deploy following this one: keep a tab open across the deploy, then navigate Home.",
    lane: "H",
  },
];
