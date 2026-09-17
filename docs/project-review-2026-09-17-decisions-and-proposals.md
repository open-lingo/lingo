# Project review 2026-09-17 — decisions, information, and proposals

Companion to `docs/project-review-2026-09-17.md` (facts, research, ranked queue) and the ledger `docs/handoff-2026-09-17-project-review.md`. This file records what Spencer decided or told us, the bigger changes that need his call, and the smaller proposals he asked to have saved in plain language.

## 1. Decisions and information from Spencer (2026-09-17)

| When | What Spencer said or chose | How it is applied |
|---|---|---|
| ~10:50 | Run a broad project review: primitives, optimization, data storage, testing, lesson authoring. Search online for many perspectives even where a solution exists. | Eight research lanes, 12–20 sources each, contrarian views required; findings in the review doc §2. |
| ~10:55 | Include the added areas: accessibility, observability, dependency/platform audit, learning science, cost. | Areas 6–10 in the queue. |
| ~10:55 | Go straight to implementing after the research; heavy Sonnet search lanes; lift the authoring block for this review. | Implementation lanes started as soon as inventory landed; A7 built the procedural QA set. |
| ~10:58 | Fully unattended; user-facing first; a TestFlight build per landed area; server schema/endpoint changes, major dependency upgrades, tool-driven content re-shaping and Android work all allowed without asking. | No check-ins; build 26 = areas 1–4; server fixes landed on lingo-core main (not pushed — see §2). |
| ~10:59 (goal) | "It's ok to not change anything if the optimization or change is barely beneficial after researching, but consider this in everything. We have a few users now, small things can broadly affect everyone, mostly iOS some Android. Make sure we address each item." | Every lane reports DO/SKIP with numbers; several items were deliberately skipped (dictionary CDN, atomic rollup marker, MessagePack). |
| ~11:00 | "In case we run out of usage start on the most impactful too, complete them one by one or like 3 at a time max." | Never more than three implementation lanes at once; each runs to completion. |
| ~13:45 | "Love all the ideas above. Document everything that is decisions or info from me; bigger changes or ideas that are hard to implement, let me know; save smaller proposals with good plain language and examples; continue." | This file. |

Information still needed from Spencer: the learner mix by course (how many of the current users are on Japanese vs Spanish/Korean/French). It decides §2 item 2.

## 2. Bigger changes that need Spencer's call

Each of these is real work with a real trade-off. Nothing here is started.

1. **Per-course content packs (install shrinks; gloss fixes without a build).** Today the binary carries every course's lesson JSON (13 MB) and the Japanese dictionary (15 MB). Proposal: ship the app shell plus the learner's chosen course; download other courses on first switch from the CDN, verified by hash, cached on device. Benefit: install drops from ~24 MB to roughly 8–10 MB for a non-Japanese learner; a wording fix ships without TestFlight. Cost: 5–8 days; needs a persistent on-device cache, a versioned CDN prefix (`/content/v2/`, `/dict/v1/`) so a web deploy can never delete files from under installed apps, and a first-run download screen. Risk: Apple treats data downloads as allowed, but our lesson JSON encodes step logic, so step-type or gating changes must stay binary-gated (review doc §2 storage, counter-argument). Decision: yes/no, and if yes, whether the dictionary goes too (only worth it if many learners are not on Japanese).

2. **Japanese dictionary out of the install.** Same mechanism as 1, dictionary only (15 MB, 52 % of the install). Every Japanese learner needs it at their first speaking step, so for them it is 15 MB either way, only later and over the network. Worth it only if most users are on other courses. Waiting on the learner-mix number.

3. **Vendor error reporting (Sentry) vs the in-house endpoint.** In-house is built and free; it needs Spencer to push lingo-core, create a CloudWatch alarm (no ops alert topic exists in lingo-infra yet), and confirm log retention. Sentry adds native crash symbolication and a UI for $0–26/month but needs an account and an App Store privacy-label update. Decision: stay in-house, add Sentry, or both.

4. **Major dependency upgrades: TypeScript 5.6→7, Vite 6→8, Vitest 4→5.** Each has breaking changes (native tsgo compiler with unverified `--build` support; Rolldown; mocks now clear before each test). Two majors behind on two of them; deferring past early 2027 stacks the risk. Cost: one spike branch each, ~1 day each with the full suite; risk 3/5 of a week of fallout on Vitest. Decision: do them one at a time this month, or defer until forced.

5. **Drag-and-drop library.** dnd-kit has had no release since Dec 2024 and the maintainer is silent on its future; it still works. react-aria's drag-and-drop has the strongest screen-reader evidence. Cost of a migration spike on the two build views: 5–8 days. Recommendation: not now; revisit if two consecutive months pass with no upstream fix for a bug we hit.

6. **Review grids driven by the forgetting model (FSRS).** Lane A8 is landing this behind a flag, off by default. Turning it on changes which words come back for review in every lesson. The evidence (Duolingo: 45 % lower recall-prediction error, 12 % more engagement) is strong in general, but our heuristics already approximate spacing. Proposal: run it per learner, alternating on/off per lesson, and compare one-week-later accuracy on the words served. Decision: allow the experiment on the live beta (yes/no), and for how long.

7. **Lanes on their own branches.** Today every lane commits to one shared branch; twice the SHA I preflighted was already behind by the time I pushed. Proposal: each lane on its own branch, merged into the review branch only after its report. Cost: a few minutes per lane; benefit: the pushed SHA is always the preflighted one. Decision: adopt for the rest of this review.

8. **Google Play closed test.** New personal developer accounts must run a closed test with at least 12 testers opted in for 14 continuous days before production access. The clock has not started. Only Spencer can recruit the testers.

9. **VoiceOver.** Nobody has ever turned it on with the app. Twenty minutes with the five-step script in `docs/accessibility-2026-09-17.md` §5 settles whether the App Store accessibility label can say anything other than "No". Only a person with the phone can do it.

10. **Filler-pool review selection inside the module compiler.** Lane A8 found that two of the four review surfaces already rank by the forgetting model, and the one that does not (the filler and match-grid pools in `moduleCompiler.ts`) is compiled eagerly when the app's JavaScript loads, before any flag or learner state exists. Making it learner-aware means compiling those pools lazily or adding a post-pass at lesson start. Cost: 3–5 days; risk 3/5 (touches how every module is built). Decision: worth doing only if the flagged experiment in item 6 shows a real gain first.

## 3. Smaller proposals (saved, not started)

Each one: what it is, why, an example, rough cost.

- **Golden-learner replay.** DONE 2026-09-17 (lane A2d): `npm run sim:replay`, three goldens, docs/golden-replay-2026-09-17.md; Spencer can record on his phone from the Layout-trace panel ("Copy tap replay"). Record one real tester's tap sequence through a lesson (the session log already stores events), then replay exactly those taps in the simulator on every build and compare the frame trace and the stage pixels against the last approved run. Why: it turns one of Spencer's walks into a regression test that repeats itself. Example: the b24 "tile shrinks at tap 9" bug would have failed the replay on the next build instead of waiting for a screenshot. Cost: 2 days; pieces exist (`--simulate build`, pixel baselines).

- **Sweep for checks that cannot fail.** P1b found two verdicts that had passed for weeks because their sample was empty (no `<h2>` on listening routes). Proposal: one pass over every gate and verdict to assert its sample is non-empty, and a rule that a new check ships with a planted-failure test. Example: `h2Stable` now prints N/A instead of PASS when there is nothing to sample. Cost: 1 day.

- **Within-learner A/B for flags.** With a handful of users, a normal A/B never reaches significance. Alternating a flag on and off per lesson for the same learner, then comparing that learner's own outcomes, gives a usable signal with 10 users. Example: FSRS-fed grids on for odd lessons, off for even; compare one-week-later accuracy per learner. Cost: half a day once the flag exists.

- **Lazy-load interface translations.** DONE 2026-09-17 (lane A9, entry chunk −76.8 KB gzip). The interface strings for every UI language load eagerly (about 77 KB compressed per user that is never used). Load only the learner's UI language. Example: an English-UI learner never downloads the Korean UI strings. Cost: 1–2 hours; measured by lane A4.

- **In-major dependency bumps.** DONE 2026-09-17 for router, react-query, Playwright, i18next; auth0-react HELD (see below). react-router-dom 7.0→7.18, react-query 5.62→5.103, Playwright, auth0-react: bug and security fixes within the same major, low risk, behind a preflight. Cost: 1 hour.

- **Android 16 KB page check.** DONE 2026-09-17: no native library in android/ or any of the 4 plugins, nothing to do until one appears. Google requires 16 KB page-size support by 2027-02-01 for apps shipping native libraries. A five-minute check of installed Capacitor plugins for bundled `.so` files says whether we are affected at all. Cost: 5 minutes.

- **API Gateway cost check.** The cost model shows REST API Gateway as the biggest line per learner (~$5 per 1,000 monthly learners); HTTP API is usually cheaper. A 30-minute pricing-calculator pass with real request counts from CloudWatch decides whether to switch. Cost: 30 minutes plus Trevor's Terraform if yes.

- **One missing audio clip.** Module 42, dialogue 4, line 2 has no recorded clip; the learner hears a silent gap. Only true miss out of 655 reported (the rest were the checker's mistake). Goes on the next TTS batch.

- **Kana-row lessons outside the 10–25 step band.** DONE 2026-09-17: exempted by design (docs/procedural-qa-2026-09-17.md §4a). Four module-1 kana lessons fall outside the step-count rule the French course enforces. Either they are exempt by design (say so in the rule) or they get padded. Cost: an hour to decide and document.

- **Dead code: `jaRomanizer`.** DONE 2026-09-17. Registered on the language module, never called anywhere. Remove. Cost: 30 minutes.

- **Auth0 library bump, held back.** The login library (`@auth0/auth0-react`) is 11 minor versions behind (2.15 → 2.26). The changelog adds passkeys, an "IPSIE session-expiry ceiling" that can shorten how long a local session lives, and a fix for an open-redirect bug. Why hold it: every user goes through login, and native login has bitten us four times before (see the App Store real-auth notes). A green unit-test run proves nothing about the real Auth0 round-trip on a phone. Proposal: bump it on its own lap, then do one real login on the simulator and one on a phone, and check that a backgrounded app still has a session the next day. The one code change it needs (guard against an empty token) is already in. Cost: 1 hour plus one overnight wait. Risk if we skip forever: we miss security fixes; the open-redirect fix matters only for web, where our returnTo is fixed.

- **Icon library major (lucide-react 1.x).** The 1.x release removed every brand icon, including the GitHub icon we show in two places. Bumping means picking a replacement (text link, our own SVG, or a different icon set). Cost: 30 minutes once someone picks. Nothing else in 1.x is needed today, so leave it.

- **French: 13 build tiles carry two content words.** The new French Q3 check (one content word per tile) found 13 tiles across modules 14–26 such as «mangé de gâteau», «visité le parc ?», «un jus de pomme», «une cuisine et un jardin». They are not wrong French, but a tile that already contains verb + object gives the learner nothing to build. Proposal: split each into its words in the French IR (a Sonnet lane, then recompile), which also makes those 13 steps harder in the intended way. The list is in docs/procedural-qa-2026-09-17.md §11. Cost: 1 hour plus a build. Baseline is 13 today, so the gate stops any new ones.

- **Korean Q3 stays informational.** The one-content-word check for Korean has 0 true hits out of 8 (Kiwi's tags alone cannot tell a compound from a phrase). It needs a Korean dictionary of fixed expressions like Japanese's JMdict before it can be enforced. Proposal: leave it informational until a Korean lexicon lane runs; do not spend time tuning it.

- **Procedural checks were partly blind on CI.** DONE 2026-09-17 (lane A7f, verified on a real runner). "Enforced" questions whose Python sidecar is missing count zero applicable steps and pass. On CI there is no Python venv, so the Japanese Q3 check (4,134 steps locally) was passing vacuously. Fix in progress (lane A7f): the baseline gains an applicable-steps floor per question and CI installs the sidecars, so a missing tool fails loudly.

- **Judge calibration.** Log a one-line rationale with every local-judge verdict and compute agreement (Cohen's kappa) against a Sonnet-labelled sample per model tier. Research: rationale-first prompting lifts agreement from ~0.55 to ~0.75; few-shot calibration helped Gemma-class models and hurt small Qwen. Cost: 1 day.

- **Blocked warm-up on first exposure.** For a brand-new grammar point, the first three review reps are the same type before interleaving resumes (one 2025 study finds struggling learners need this floor). Lane A8 is checking whether the sequencing code has a clean hook; if not, this stays a proposal.

- **Doctrine wording.** The evidence rewards explicit, guided discovery (examples first, rule card after), not literal deduction. A one-paragraph clarification in the doctrine doc, no renaming across 200 docs. Lane A8 is adding it.

## 4. Things Spencer must do (collected)

1. Push lingo-core main (telemetry endpoint + the two sync data-loss fixes). Nothing reaches production until then.
2. Create the CloudWatch alarm for client errors (command in `docs/observability-2026-09-17.md`); confirm 30-day retention is applied.
3. Answer the learner mix by course (§1).
4. Start the Play closed test (12 testers, 14 days).
5. Run the VoiceOver script once (§2 item 9).
6. Walk build 26 when it lands: a normal build step, a 13-tile step at both slider positions, listen-and-build, settings at the largest text size, the learn map.
