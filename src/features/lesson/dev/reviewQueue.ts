/**
 * DEV · Review-queue catalog — the entries behind /:lang/qa/review.
 *
 * This is the plain-language decision/finding queue for Spencer, in the
 * same family as the QA test-drive page: he reads entries in the app,
 * marks a verdict, types a note; notes persist in his browser AND mirror
 * to /tmp/lingo-review-queue.json so an agent can pick answers up live.
 *
 * AGENTS FILL THIS FILE IN. The read-me below renders at the top of the
 * page and is the contract for new entries — the catalog test enforces
 * the mechanical half of it (unique ids, non-empty body/example/ask).
 * The machine backlog (docs/backlog/items.yaml) still gets a record for
 * every piece of real work; this queue is the human front door, not a
 * replacement.
 */

export const REVIEW_QUEUE_READ_ME: string[] = [
  "For agents adding entries (Spencer: skip this box): entries live in reviewQueue.ts — add yours to the array and it renders here.",
  "Write for Spencer scanning fast, probably on his phone, not steeped in today's code. Plain language, and err on the verbose side — two to four short paragraphs beats one dense line. Explain any term of art the first time you use it. Keep file paths and code identifiers out of the prose — park them on the entry's details line.",
  "A concrete example of the issue is MANDATORY — a real word, a real sentence, a real screen a learner would actually hit. If you can't produce one, you don't understand the issue well enough to file it yet. The catalog test fails entries without one.",
  "End with exactly what you need from him — one clear question where possible, options when there are natural ones.",
  "When Spencer answers (watch /tmp/lingo-review-queue.json, or he'll export): copy his words VERBATIM into the relevant backlog record's note: field, then move the entry to the resolved list at the bottom of the catalog with a one-line outcome. Never delete entries. IDs: R# for decisions, Q# for findings — take the next free number.",
];

export type ReviewVerdict = "" | "yes" | "discuss" | "no";
export type ReviewKind = "decision" | "finding";

export type ReviewLink = {
  label: string;
  /** Language-relative path ("/learn/…") — the page prefixes /:lang. */
  href: string;
};

export type ReviewEntry = {
  /** "R#" (decision) or "Q#" (finding) — unique, never reused. */
  id: string;
  kind: ReviewKind;
  /** Plain-language title — no code identifiers. */
  title: string;
  /** YYYY-MM-DD the entry was filed. */
  added: string;
  /** Plain-language paragraphs: what's going on, in Spencer-voice. */
  body: string[];
  /** MANDATORY concrete example — real word / sentence / screen. */
  example: string;
  /** Exactly what we need from Spencer. */
  ask: string;
  /** File paths, backlog ids, report locations — rendered monospace. */
  details?: string;
  /** In-app links (fixtures, lessons) — open in the shared play tab. */
  links?: ReviewLink[];
  /** Set when the entry waits on someone other than Spencer. */
  blockedOn?: string;
  /** One-line outcome + date. Set ⇒ entry renders in the resolved section. */
  resolved?: string;
};

export const REVIEW_ENTRIES: ReviewEntry[] = [
  {
    id: "R7",
    kind: "decision",
    title: "Waiting on Trevor: audio upload credentials",
    added: "2026-08-09",
    blockedOn: "Trevor",
    body: [
      "Any NEW audio requires uploading clips to the CDN, and Trevor holds the AWS credentials. The 08-09 content fixes deliberately reused sentences that already have recordings, so nothing shipped broken — but this blocks authoring the new n4-01 lesson (and any future content that needs fresh audio).",
    ],
    example:
      "Authoring n4-01 means new example sentences → new audio clips → an upload we currently cannot perform.",
    ask: "Ping Trevor for the creds (or tell us the alternative).",
  },
  {
    id: "R13",
    kind: "decision",
    title: "Parked by you in July: rework typed translation, or flip listening-build to English?",
    added: "2026-08-14",
    body: [
      "You flagged both step types in a July play session and said “dont touch or update anything there yet but note.” Nothing has been touched — this entry just moves the parked decision into the queue so it can't get lost.",
      "The two directions on file: (a) make the typed-translation step more forgiving and Duolingo-like; (b) change listening-build so the learner hears the Japanese but assembles the ENGLISH — proof of understanding rather than transcription. Option (b) quietly changes what the step means in every lesson that already uses it, which is why it needs your ruling before anyone builds.",
    ],
    example:
      "Today a listening-build step plays あしたは しごとが あるんだ and asks you to reassemble that same Japanese from tiles — a learner can succeed by ear alone without knowing what it means. Under direction (b) the same audio would ask them to build “I have work tomorrow.”",
    ask: "No urgency — it stays parked until you pick. When ready: direction (a), direction (b), both, or neither?",
    details: "backlog B026 (found 2026-07-28, spencer-qa) · effort XL — decide before building",
  },
  {
    id: "R15",
    kind: "decision",
    title: "あした, かえる, くすり, ねつ can never show their kanji — widen the catalog?",
    added: "2026-08-14",
    body: [
      "Kanji display only turns on for a word when every character it needs is in the course's 113-character N5 catalog. 明日, 帰る, 薬 and 熱 each use a character that's conventionally N4-level, so these four very common taught words render as kana forever, at every module — while classmates like 見る, 飲む, 行く, 食べる all graduate to kanji on schedule.",
      "This is the catalog working as designed; the question is whether N5-strictness or real-world exposure wins for a handful of high-frequency words. Adding the four characters with a late unlock module would let the words show kanji without pretending they're N5 — at the cost of widening what the course asks a learner to read. Related precedent: your earlier kanji ruling that exposure beats protection.",
    ],
    example:
      "あした (“tomorrow”) is taught in module 12 and used constantly, but it can never appear as 明日 anywhere in the course, because 明 sits just outside the 113-character catalog.",
    ask: "Add 明・帰・薬・熱 with a late unlock so these words can show kanji — or keep the catalog strictly N5 and let them stay kana?",
    details: "backlog B059 · N5_KANJI catalog (113 chars) + KANJI_ELIGIBLE_ATOMS gate",
  },
  {
    id: "Q3",
    kind: "finding",
    title: "Ten seconds on your phone: is the clock readable over the app in dark mode?",
    added: "2026-08-09",
    body: [
      "The app draws underneath the strip at the very top of the iPhone screen — the one with the clock, battery and signal. That's on purpose, it's what makes the app look full-screen. But the app never tells iOS whether that strip's text should be dark or light, so iOS guesses, and it has no idea the app just switched to a dark theme.",
      "The likely failure is dark clock text sitting on the app's dark header, which reads as smudged or plain invisible. I can't check it: the automated screen testing runs a desktop browser engine, which has no clock strip at all. This is one of the small set of things only a real phone can answer.",
      "If it is wrong, the fix is a small plugin wired to the theme switch — under an hour. If it looks fine, we close this and never think about it again.",
    ],
    example:
      "Open the app on your phone, switch to the dark theme, and look at the clock in the top-left corner where it sits over the app's own header. Then switch to light and look again.",
    ask: "Can you read the clock and battery clearly in BOTH themes? A photo of each is ideal; a yes/no is enough.",
    details:
      "backlog B100 (suspected, unverified) · would need @capacitor/status-bar driven from the theme · why the gate can't answer it: docs/mobile-ui-testing-2026-08-09.md §6",
  },
  {
    id: "R17",
    kind: "decision",
    title: "Sixty seconds of listening decides whether the \u201cha/wa\u201d fix is 14 clips or 2,563",
    added: "2026-08-19",
    body: [
      "You caught the voice reading the topic marker as \u201cha\u201d where it must be \u201cwa\u201d. That marker is written with the same character as the syllable \u201cha\u201d, and Japanese readers know which is which from context; the synthesizer apparently does not, at least in the sentence you hit.",
      "What nobody has established is how wide the problem is. If the voice only trips where the context is genuinely ambiguous, the repair is fourteen sentences. If it gets the marker wrong generally, it is 2,563 sentences \u2014 every line in the course carrying that marker or its two cousins \u2014 and the whole picture changes.",
      "I sent you six short clips. Three of them are ordinary sentences using each of the three markers; the other three are the failing sentence plus the two candidate fixes. The only question that matters is whether the ORDINARY ones are right.",
      "One thing got cheaper since this was filed. Both candidate fixes were recorded as changing the file address of every affected clip, which would have meant a bookkeeping churn on top of the re-recording. That turns out to be avoidable: the pipeline can keep addressing clips by the text the learner SEES while feeding the synthesizer something different. So whichever fix you pick, the cost is re-recording the affected clips and nothing else \u2014 and the rule that the learner must always see the correct spelling holds by construction rather than by discipline.",
    ],
    example:
      "Clip A is \u300c\u308f\u305f\u3057\u306f \u304c\u304f\u305b\u3044\u3067\u3059\u300d \u2014 the most ordinary sentence in the language. If that one says \u201cwatashi wa\u201d, the bug is confined to the awkward cases. If it says \u201cwatashi ha\u201d, every listening step in the course is affected.",
    ask: "Do clips A, C and D sound right? And between E (feed the synthesizer the kanji spelling) and F (feed it the phonetic spelling), which do we ship?",
    details:
      "clips + scope table + the four-line pipeline change: docs/issues/tts-topic-wa-mispronounced-2026-08-18.md (2026-08-19 section) \u00b7 sequencing: decide before Trevor's upload run or the affected clips get made twice",
    links: [{ label: "listen: the six clips (A\u2013F)", href: "/qa/tts-probe" }],
  },
];

/** Entries answered/settled — rendered collapsed at the bottom of the page. */
export const RESOLVED_ENTRIES: ReviewEntry[] = [
  {
    id: "R16",
    kind: "decision",
    title: "Matching grids can deal a word the course never taught — suppress it, or teach the words?",
    added: "2026-08-19",
    body: [
      "Every matching exercise is guaranteed a minimum number of pairs. When a lesson's authored grid comes up short, the app quietly tops it up with other words the learner should know by that point in the course. That top-up picks from the vocabulary table, filtered only by \u201cthis word belongs to a module you have already reached\u201d.",
      "The problem is that the vocabulary table contains words no lesson anywhere actually teaches \u2014 leftovers from the rewrite, words that were registered and then never got a lesson slot. The top-up cannot tell the difference, so it can deal one of those into a grid. The learner is asked to match a word they have genuinely never seen, and there is no way for them to know that is what happened.",
      "I measured how bad it is today rather than guessing. Across the whole Japanese course the top-up adds 101 pairs, and eight of those show a word nothing teaches. But the pool it draws from holds 116 such words, and which grids run short depends on the learner's own review state \u2014 so eight is today's draw, not the ceiling.",
      "Two ways out. Suppress: mark those 116 as ineligible for the top-up, and add a permanent check so a newly registered word that no lesson teaches fails the build rather than leaking into a grid. Or teach them: they are real words, spread across fourteen modules, and giving each one a lesson slot is genuine authoring work.",
    ],
    example:
      "Lesson 6 of module 32 ends with a review matching grid. Alongside \u307e\u3063\u3059\u3050, \u3048\u304d and \u307f\u3061 sits \u3057\u3093\u3076\u3093 \u2014 \u201cnewspaper\u201d \u2014 which no lesson in the entire course teaches. \u304e\u3093\u3053\u3046 (\u201cbank\u201d) does the same thing in five separate module 6 lessons.",
    ask: "ANSWERED 2026-08-19 \u2014 teach them. Spencer, verbatim: \u201cfor r16 we should probably teach them, required side quests can be some and ideally we bake them into the course by adding one or two lessons here or there would be better/preferable.\u201d Outcome: no suppression flag; the 116 become vocab-pack lessons slotted into their own modules (the B067 pattern, already run six times), with side quests only where a cluster does not fit a module.",
    details:
      "measurement + method: docs/issues/orphan-courseatoms-rows-2026-08-18.md (2026-08-19 correction) \u00b7 code: src/features/lesson/data/matchPairsFloor.ts (the es path already carries the cutoff the ja path ignores)",
    resolved:
      "Teach them, do not suppress. Spencer 2026-08-19: \u201cwe should probably teach them, required side quests can be some and ideally we bake them into the course by adding one or two lessons here or there would be better/preferable.\u201d The 116 become vocab-pack lessons inside their own modules (the B067 pattern), side quests only where a cluster has no home.",
  },
  {
    id: "R1",
    kind: "decision",
    title: "Word “first taught” labels: big proposed correction — approve it?",
    added: "2026-08-09",
    body: [
      "Every vocabulary word in the course carries a label saying which module first teaches it. Those labels were written for the OLD course and were never corrected after the rewrite — we've been patching around them one consumer at a time. An analysis agent has now computed the true label for all 932 words and produced a script that can correct them all in one shot. Nothing has been changed yet — this is the report-first review you asked for.",
      "If we apply it: 351 labels change (152 of them are words the current course never teaches at all — those get parked as “future”). Visible effects: the placement test-out shrinks from 664 to 533 flashcards (152 phantom cards disappear); review decks shrink to only truly-taught words; the frequency practice deck reshuffles wholesale; 158 more words become earnable just by walking the course. One cost: existing learners' due cards for words that moved LATER go dormant until the word's true module.",
      "One catch: with honest labels, 40 authored grammar-practice steps fail the “everything in this sentence has been taught” gate — those are real pre-existing content bugs that have to be fixed as part of landing this.",
    ],
    example:
      "ちち (“my father”) is labeled as taught in module 8, but the current course doesn't teach it until module 17. So the review deck and the placement test both treat it as a word an early learner already knows — a module-8 learner can be dealt flashcards for a word they have never once seen.",
    ask: "Go / no-go on the landing sequence in the report's §6. (R2 below — your ruling on 40 words — is step one of that sequence either way.)",
    details:
      "report: docs/fromModule-restamp-report-2026-08-09.md (§6 = landing order) · diff: docs/fromModule-restamp-diff-2026-08-09.txt · script: scripts/restamp-from-module.mjs (dry-run by default)",
    resolved:
      "Approved 2026-08-20 — Spencer: “confirm whats wrong here, then have someone else audit what we think is wrong, and then fix the module assignment … and prevent this regression from ever happening please.” LANDED same day: independent audit (0 evidence failures) → 311 restamps + 7 repoints applied under docs/restamp-rulings.json → 9 leak words taught in-module, 6 picture debuts (4-persona audited), 37 census-blocked → fromModuleDrift.test.ts rewritten as the standing drift guard. Suite green at 10,347 (B104).",
  },
  {
    id: "R2",
    kind: "decision",
    title: "40 words the analysis couldn't classify — need your ruling on each",
    added: "2026-08-09",
    body: [
      "For 40 of the 932 words, the evidence genuinely points two ways and a human has to decide what counts as “taught.” Each ambiguous row in the diff file carries its evidence.",
    ],
    example:
      "よむ (“to read”) appears in a module-1 kana row — where it's really just spelling practice — and then again in a module-16 vocab pack as a proper debut with meaning attached. Does the kana-row appearance count as teaching the word? That's a judgment call, and it moves which module the label points to.",
    ask: "Walk the 40 rows marked `ambiguous` in the diff file and rule each one. Any format works — margin notes in the file, a voice memo, notes here — an agent will apply them.",
    details: "docs/fromModule-restamp-diff-2026-08-09.txt (rows marked ambiguous)",
    resolved:
      "Ruled 2026-08-20 — Spencer: “we should count the word as taught the moment its introduced, and this should only exist for a select few. figure this one out please.” Applied as the default for the 40 ambiguous rows; exceptions argued case-by-case (B104).",
  },
  {
    id: "R3",
    kind: "decision",
    title: "Negative verbs (ない-form) are used but never taught — where does the lesson go?",
    added: "2026-08-09",
    body: [
      "Exercises use negative verb forms, but no lesson or rule card ever introduces how they work before that. The walk agent — playing a learner with zero outside knowledge — met a ない-form verb in an exercise and had no way to know it meant “don't / doesn't,” because nothing had ever said that verbs ending in ない are negatives. (The N5 course never teaches it; the first real teaching is module 29, in the N4 tier.)",
      "You already called the shape of the fix: “we can probably just insert another lesson somewhere but we can divide those later.” What's missing is the WHERE.",
    ],
    example:
      "A learner mid-course hits a sentence built around a ない-form verb with nothing ever having explained the pattern — the first formal ない lesson today is all the way out at module 29.",
    ask: "Which module should the ない-form intro lesson slot into — or should an agent propose 2–3 candidate spots with tradeoffs first?",
    details: "backlog B090 · found by docs/learner-sim/m8-rebuild-walk-2026-08-09.md",
    links: [
      { label: "where ない IS taught today (m29, N4)", href: "/learn/lessons/ja-m29-3-1" },
    ],
    resolved:
      "Approved 2026-08-20 — Spencer: “use the conjuigation teaching design we have already implemented in other lessons and modules, and teach this a good bit sooner and decide where.” Placement analysis in flight (B090).",
  },
  {
    id: "R4",
    kind: "decision",
    title: "Particle rule cards should name the exact mix-up — scope the pass",
    added: "2026-08-09",
    body: [
      "When a learner picks the wrong particle, today's rule cards explain the right answer generically. Your note: “we probably want to do a larger pass on rule cards marking specific failure (one particle vs the other) and then explain why.” So the card should recognize WHICH confusion just happened and speak to it directly.",
    ],
    example:
      "Illustrative: a learner marks “I study at school” as がっこうにべんきょうする instead of がっこうでべんきょうする. Today the card just re-explains で. Under the pass you're describing it would say: “You picked に — that's for destinations you move toward. This sentence needs で — the place where an action happens.”",
    ask: "Go / no-go on the pass, and scope: which particle pairs first (に/で and は/が are the obvious openers), which modules' cards, and whether this lands before or after the R1 re-stamp.",
    details: "backlog B089",
    links: [{ label: "particle cloze fixture", href: "/lesson-preview#step-particle_cloze" }],
    resolved:
      "Approved 2026-08-20 — Spencer: “the pass scope and the fix can occur by you … our current explanations are too verbose, we need to be a little simpler in them.” Scoping in flight (B089).",
  },
  {
    id: "R5",
    kind: "decision",
    title: "Two-minute action: log in again so visual checks can run",
    added: "2026-08-09",
    body: [
      "The automated visual QA stage can't run because its stored login session expired — it times out at the Auth0 login screen. Every other check on the current work is green; this is the only blocked stage, and it's been blocked since the m8 fixes.",
    ],
    example:
      "Every module-gate run now ends with the visual stage failing at a login screen it can't get past, while all the mechanical stages pass.",
    ask: "Run `npm run test:e2e:auth` (it opens a browser), navigate to /login, sign in. Done.",
    resolved:
      "Done — “already logged in recently.” .auth/user.json refreshed 2026-08-19 10:29 (6 cookies); the visual stage is unblocked.",
  },
  {
    id: "R6",
    kind: "decision",
    title: "How do you want the current work committed?",
    added: "2026-08-09",
    body: [
      "The walk-wave work from 08-09 is still sitting uncommitted on main. (The later sessions that day — the mobile pass and the Spanish wave — committed their own work; this set was deliberately left for your call.) Re-verified green 2026-08-14: types clean, 9,227 tests, 0 failures. The chunks, roughly: (a) m8 lesson fixes + the audio-lookup ellipsis fix, (b) the m30 pilot retirement, (c) the pad-tile “only offer taught words” engine fix, (d) the word-label analysis deliverables — report, diff, script, nothing applied, (e) this review-queue page + docs.",
    ],
    example:
      "`git status` shows 73 modified/deleted/new files spanning curriculum, engine, and docs — five days old now, still zero commits.",
    ask: "One commit, or sliced (e.g. the five chunks above)? Say the word and an agent shapes it.",
    details: "full record: docs/handoff-2026-08-09-walk-wave.md",
    resolved:
      "2026-08-20 — Spencer: “commit what we can for now, hold off on what we shouldnt or whats incomplete, dont get too hung up here.” Committed in slices the same night; ES/FR files and the other session’s in-flight work left untouched.",
  },
  {
    id: "R8",
    kind: "decision",
    title: "Spanish quiz questions use words the course never taught — greenlight the rewrite pass?",
    added: "2026-08-09",
    body: [
      "We traced part of why the Spanish course felt off when you played it. The quiz questions themselves are written in Spanish — that's deliberate, it stops the English from giving the answer away — but nobody ever checked that the words INSIDE the question have been taught yet. Japanese has a machine check for exactly this (“would the learner know this word yet?”); Spanish never got one.",
      "We built the Spanish twin of that check and measured today's debt: 470 places where a question leans on an untaught word, 229 of them in the first six modules — the stretch a new learner actually plays. The number is now frozen so new content can't add to it. Shrinking it is an authoring pass: rewrite the worst lessons' questions using only vocabulary taught by that point.",
      "Worth naming: because you already know some Spanish, these questions read fine to YOU — a true beginner just sees a wall of unknown words where the question should be. That gap between your experience and a beginner's is probably a chunk of the “didn't love it” feeling.",
    ],
    example:
      "In module 2 — a learner maybe eight lessons in — a question reads “Diego pregunta ‘¿quién eres?’ Ana se señala a sí misma” (“Diego asks ‘who are you?’ Ana points to herself”). None of pregunta / señala / sí misma has been taught by module 2. Answering it requires already knowing Spanish.",
    ask: "Go / no-go on the rewrite pass — worst four lessons first, then module order? The per-lesson worklist is already generated.",
    details:
      "instrument: es/__tests__/esPromptComprehensibility.test.ts (ratchet 470) · worst: es-m9-4 (31), es-m2-8 (20), es-m2-2 (17), es-m8-3 (17) · scope: docs/es-authoring-scope-2026-08-09.md §1b",
    resolved:
      "Closed NO 2026-08-20 — Spencer: “this is being resolved in a reauthor.”",
  },
  {
    id: "R9",
    kind: "decision",
    title: "Spanish roadmap: which phases do we schedule?",
    added: "2026-08-09",
    body: [
      "The Spanish scope work you asked for is done: a research pass on how English→Spanish is taught elsewhere, a step-by-step walk comparing the first Japanese and Spanish sentence modules, and a phased plan. The walk's good news: the two courses line up structurally — same steps per lesson, same typed-and-spoken load, zero pacing violations on either side. The measured gaps are the audio (Q2), the quiz-question vocabulary (R8), and one pacing delta: Spanish deals about 2.8 passive card-flip steps per lesson where Japanese deals 0.8 — more watching, less doing.",
      "Everything further needs your call, phase by phase: trimming those passive cards; giving Spanish the due-cards-first review lessons Japanese has; a second recorded voice for dialogues; and the bigger structural items (a grammar track, moving authoring to the IR format, an A2 tier). The scope doc's decision section lays each out with costs.",
    ],
    example:
      "A Spanish dialogue lesson today has Ana AND the stranger both speaking in the same Dalia voice — one person interviewing themselves — where Japanese dialogues give Keita a distinct second voice.",
    ask: "Read §8 of the scope doc (eight numbered decisions) and mark yes / no / later on each — or just name the two or three that matter most and we'll sequence around those.",
    details:
      "docs/es-authoring-scope-2026-08-09.md §7 (phases) + §8 (decisions) · walk measurements §1b",
    resolved:
      "Closed NO 2026-08-20 — Spencer: “being reauthored.”",
  },
  {
    id: "R10",
    kind: "decision",
    title: "The empty band at the bottom of a lesson — keep it, or halve it on small phones?",
    added: "2026-08-09",
    body: [
      "You asked for the bottom 10%, maybe 15%, of the lesson screen to stay empty — a band below the Continue button so nothing important sits under your thumb. That shipped, and it holds on the phones you actually use: it measures 14.3% of the screen on your 15 Pro Max.",
      "On a small phone it is also the main thing standing between several exercise types and fitting on screen. I measured all twenty exercise types at old-iPhone-SE size. Six of them run off the bottom, so the learner has to scroll inside an exercise that was designed to fit in one view. Halving the band on short screens only would fix four of those six outright.",
      "The cost is exactly the thing you asked for, and only on small phones: the band would go from about 12% of the screen to about 7.5%. Nothing changes on your phone or on any recent one — this would sit behind a screen-height cutoff no current iPhone is short enough to hit. On phones from roughly the last four years, all twenty exercise types already fit with the band at full size.",
      "I already did the half of this that has no trade-off — tightening the spacing inside the exercises on short screens, which fixed two of the eight that were failing. I stopped here rather than quietly reverse something you'd asked for.",
    ],
    example:
      "On an old iPhone SE, the exercise where you match Japanese words to their English runs about 19 pixels past the bottom of its box — the last row is clipped until you nudge it up. With the smaller band it fits with room to spare. On your phone that same exercise already fits either way.",
    ask: "Leave the empty band alone everywhere, or halve it on short phones only to buy four exercise types a clean fit?",
    details:
      "backlog B098 · one line in src/index.css (--stage-tail, inside the existing short-screen block) · measurements: docs/mobile-ui-testing-2026-08-09.md §7–8",
    links: [{ label: "match pairs fixture", href: "/lesson-preview#step-match_pairs" }],
    resolved:
      "Shipped 2026-08-20 — Spencer: “we can canibalize it/dig into it on small phones, your fix works fine for that.” --stage-tail 10cqh → 5cqh behind the existing ≤700px cutoff. Measured after landing: kanji_reading fits (8→0), match_pairs 243→222, dialogue_listen 121→100, speaking 100→79; nothing changes on full-height phones (B098 fixed).",
  },
  {
    id: "R11",
    kind: "decision",
    title: "The iPhone build settings have your personal Apple team baked in, and have never been saved",
    added: "2026-08-09",
    body: [
      "The file Xcode reads to build the app for a phone has your personal Apple developer team written into it, and that file has never been committed. Every build setting for the iPhone wrapper exists on this Mac and nowhere else.",
      "Two ways to go. Save it as-is: the settings are finally in the repo and survive a wiped machine, but anyone else who ever builds it has to change that one field before Xcode will sign anything. Or spend about ten minutes moving the team out into a small local-only settings file first, then save everything else — that's the version that stays correct the day there's a second developer.",
      "While it's one person building, either is fine. The reason to decide now rather than later is that a machine migration or a fresh checkout loses the whole configuration silently — you'd find out at the moment you were trying to get a build onto a phone.",
    ],
    example:
      "If this Mac died today, putting the app back on your phone would mean rebuilding the Xcode signing setup by hand from notes, rather than checking the repo out and pressing build.",
    ask: "Save it as-is, or split the team out into a local-only file first (about ten minutes)?",
    details:
      "backlog B099 · ios/App/App.xcodeproj/project.pbxproj, uncommitted · hardcodes DEVELOPMENT_TEAM Y462YZGXCZ",
    resolved:
      "Saved as-is 2026-08-20 — Spencer: “theres only one person, im the only mobile developer, save it however we need to please.” project.pbxproj committed (B099).",
  },
  {
    id: "R12",
    kind: "decision",
    title: "Nine retired katakana lessons are still reachable by direct link — keep or drop?",
    added: "2026-08-14",
    body: [
      "The old course taught katakana as one big lesson per module; the rewrite replaced those with the two-rows-per-module versions on the map today. The nine old lessons came off the map but were never deleted — they still open if something links to them directly, which in practice means QA shortcuts and old notes.",
      "The wrinkle stopping a simple delete: four words — コンビニ, カップ, ナイフ, ノート — are only ever taught inside those retired lessons. Word packs that re-teach them properly are drafted for later modules but haven't landed yet. The standing recommendation from the July decision brief: drop the retired lessons once those packs land. (The word-label correction in R1 sweeps up these same words, so ruling R1 first makes this one mostly mechanical.)",
    ],
    example:
      "コンビニ (“convenience store”) unlocks only via the retired module-12 katakana lesson — a lesson no map tile has pointed at since the rewrite. A learner walking today's course never has it unlocked, while the retired lesson still opens by direct link and plays fine.",
    ask: "Confirm the standing recommendation (drop the retired lessons once the replacement packs land)? Or keep them deep-linkable indefinitely — or drop now and accept the four words go dark until the packs arrive.",
    details:
      "backlog B079 · docs/decision-brief-2026-07-29.md §2 · lessons ja-m4-kata…ja-m12-kata · コンビニ→pack 10 draft, ノート→pack 5 draft",
    links: [
      { label: "a retired kata lesson — still opens", href: "/learn/lessons/ja-m12-kata" },
    ],
    resolved:
      "Confirmed 2026-08-20 — Spencer: “go with your recommendation.” Standing plan holds: drop the nine retired lessons once the replacement packs land — those packs are now part of the R16 teach-the-116 wave (B079).",
  },
  {
    id: "R14",
    kind: "decision",
    title: "A build demands うちに though the sentence is right without it — one-off fix or new mechanism?",
    added: "2026-08-14",
    body: [
      "In a module-28 lesson, the “I have to go home” build only accepts うちに かえらなきゃ. But かえる already means going home — plain かえらなきゃ is what people actually say, and you called this out in play yourself (“technically this sentence is right without uchi ni right?” — correct).",
      "Why it needs a ruling rather than a patch: the answer-checker can flex particles and politeness, but it has no concept of an optional CONTENT word. Three ways to go: give build steps a per-step list of accepted alternatives (safe, doesn't generalise); teach the engine a small lexicon of redundant pairings like うちに+かえる (powerful, riskier); or just reword the prompt so うちに is genuinely required (zero engineering).",
    ],
    example:
      "The tile tray offers うち and に as ordinary tiles with no cue they're mandatory — a learner who builds the natural かえらなきゃ。あしたは しごとが あるんだ is marked wrong for skipping words the sentence doesn't need.",
    ask: "Which mechanism — per-step alternatives, the redundant-pairing lexicon, or reword the prompt to require うち?",
    details: "backlog B056 · lesson ja-m28-neo-1, build_sentence step",
    links: [
      { label: "the m28 lesson with this build", href: "/learn/lessons/ja-m28-neo-1" },
    ],
    resolved:
      "Resolved 2026-08-20 — Spencer: “we except the partial answers and did a big pass here … -uchini was accepted now.” Verified in code: word-granularity builds grade through the same variant expander as typed answers, so plain かえらなきゃ passes. Optional follow-up he named: an authoring-guideline line about not requiring redundant destination words.",
  },
  {
    id: "Q1",
    kind: "finding",
    title: "The match-pairs game probably offers words the learner was never taught",
    added: "2026-08-09",
    body: [
      "We just fixed the word-building tile trays so they only offer words the learner has actually been taught — they had been trusting the stale “first taught in module N” labels and slipping in vocabulary from the old course. The match-pairs game builds its word pool THE SAME OLD WAY and was not part of that fix, so the same class of leak is very likely still live there. Flagged during the fix, not yet verified in play.",
      "How bad: confusing rather than blocking — the learner can still finish the exercise, but they're being quizzed on vocabulary the course never gave them, which is exactly the trust-breaker the walks keep flagging. Suggested fix: point the match-pairs pool at the same truthful “taught before module N” accessor the tile-tray fix introduced, with the same style of regression test.",
      "UPDATE 2026-08-14 — confirmed and written down. The code really does build the pool the old way, so this is no longer a suspicion. It also turns out to be the worse of the two places it can happen: an unwanted word in a word-building tray is a wrong answer the learner can simply ignore, but an unwanted word in a matching grid is a card on the board — they cannot finish the exercise without touching it and committing its meaning. One detail in our favour: the romaji version of the grid was already building its pool the honest way, so only the word-to-meaning grids are affected. What is still unknown is HOW MANY words leak, and into which modules — nobody has run that count yet.",
    ],
    example:
      "In the 08-09 walks, tile trays offered ぷりん (“pudding”) to a learner who had never been taught the word — pulled in purely because a stale label claimed an earlier module covered it. Match-pairs draws from the same kind of pool, so expect the equivalent: a pairing card asking the learner to match a word they've never seen.",
    ask: "Nothing needed unless you want it jumped — it's verified and written down now, and it sits behind the bigger label correction you're already being asked about above. Say the word if you'd rather it went first.",
    details:
      "backlog B102 (filed 2026-08-14, major/S) · matchPairsFloor.ts buildMeaningFill, ~line 398, draws from getAtomsUpToModule · same bug family as B088 (fixed) · truthful accessor: getJaTaughtKanaBeforeModule in taughtVocab.ts · root cause is the fromModule re-stamp, B104 / R1",
    links: [{ label: "match pairs fixture", href: "/lesson-preview#step-match_pairs" }],
    resolved:
      "Answered 2026-08-20 — Spencer: “this should be fixed once we fix the module listings in a early R something right?” Mostly: the R1 restamp fixes the stale labels and R16 teaches the 116 orphans, but match-pairs must ALSO switch to the truthful accessor (B102) — that swap rides the R1 landing.",
  },
  {
    id: "Q2",
    kind: "finding",
    title: "Spanish audio: robot voice fixed, all 719 missing clips recorded — one upload from done",
    added: "2026-08-09",
    blockedOn: "Trevor",
    body: [
      "The single worst thing in your Spanish playthrough is diagnosed and mostly fixed. 719 of the course's 1,879 spoken lines — 38% — had no recording at all; in modules 1–4 that's roughly a third of the listening steps. When a recording is missing the app falls back to your device's built-in synthetic voice, and that fallback was mis-tagged as Spain-Spanish: mid-lesson, the recorded Mexican studio voice would hand off to a robotic Castilian one. Japanese has zero such gaps, which is why it never showed there.",
      "Already shipped: the fallback now at least speaks Mexican Spanish, and a permanent check now watches Spanish audio coverage the way Japanese has always been watched — this gap grew silently precisely because the old check only covered Japanese. All 719 missing lines are now recorded and verified locally. The last step, pushing them to the CDN, is the same credentials wait as R7; once the push lands, one config copy locks the check to zero-gaps forever.",
    ],
    example:
      "In an early Spanish lesson, “¿Cómo te llamas?” plays in the warm recorded Dalia voice and the reply lands in a robotic Spain-accented synthesizer — 27 of the 86 listening steps in modules 1–4 did this.",
    ask: "Nothing beyond R7 — add Spanish to the Trevor ping. React here only if you want the upload jumped up the queue.",
    details:
      "fix + gates: commit 9e5a52e4 · clips staged: lingo-data/out/tts/es (1,974 mp3s) + emitted manifest · post-upload: copy manifest → src/shared/tts/manifests/es.json, then ratchet esAudioCoverage.test.ts 719→0",
    resolved:
      "Updated 2026-08-20 — clips recorded and the manifest landed by the reauthor session (full suite green, esAudioCoverage included); the CDN upload still rides Trevor’s credentials (R7).",
  },
  {
    id: "Q4",
    kind: "finding",
    title: "Heads up: every lesson link on the QA page you reach this queue from is dead",
    added: "2026-08-09",
    body: [
      "This review queue is linked from the QA test-drive page — the checklist page with the shortcuts into individual lessons. Every one of those shortcuts is broken: 37 links, 37 dead. They point at lesson names from the old course that were renamed during the rewrite, so each one lands on “Lesson not found.”",
      "So the page you'd naturally use to eyeball a particular exercise type is currently unusable, and this queue happens to live on it. No user-facing damage — it's a developer page — but I'd rather you knew before you clicked one and assumed something bigger was broken.",
      "The fix is to build that link list from the live course instead of typing names in by hand, which is what let it rot in the first place. Half a day at most, and it can't recur afterwards.",
    ],
    example:
      "The shortcut labelled for module 29 points at a lesson id that stopped existing in the rewrite — clicking it shows “Lesson not found” rather than the lesson. Sixteen of the 37 dead links are module 29 alone.",
    ask: "Nothing needed — flagging it so a dead link doesn't read as a real bug. Say the word if you want it fixed before the other mobile items.",
    details:
      "backlog B097 (verified 2026-08-09, corrects an earlier estimate of 31/35) · reproduce: STALE_REPORT=1 npx vitest run staleLessonIdReferences, then grep QaTestDrivePage in /tmp/ja-stale-lesson-ids.txt",
    resolved:
      "Fixed 2026-08-20 — the two dead-drive sections (m29 pilot, the 2026-07-12 fixes list) deleted, every remaining link remapped to measured live lessons, and a new binding test fails the build on any dead link from now on.",
  },
];
