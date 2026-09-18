# TestFlight feedback — build 32 (2026-09-18)

Pulled via `scripts/asc/pull-feedback.mjs` (manifest + numbered `.jpg` shots in `testflight-feedback/`, untracked). Spencer walked build 32 (JA course, iPhone 16 Pro, iOS 26.6.1) 2026-09-18 22:15–22:21 UTC and filed 5 items this pull, rows 196–200. **Row→item mapping: item = pull row + 10** (rows 196–198 → items #206–#208). Rows 199–200 (screenshots only, no comment — one iPhone, one iPad) are the sync screenshots referenced in the lead's clarification and are handled by the lead, not this lane.

**Measured, not guessed:** step locations were confirmed with `scripts/lane/step-url.mjs`/`scripts/lane/find.mjs` against the freshly emitted runtime content (`npm run content:emit`, after symlinking `artifacts/lexical` in from the primary worktree — see §0), never guessed from the screenshot. #208's fix was verified with real Playwright interaction (click → click → assert) against an isolated dev server at 390×844 — Chromium, so it proves DOM/logic + a first pixel number, not a device-authoritative claim; see §2.3 for what is and isn't device-verified.

## §0 Environment note / already in flight

- **Stale compiled artifact, unrelated to this pull:** the first `node scripts/compile-ir.mjs m34` in this worktree produced a 30-line diff entirely in an unrelated そつぎょう particle-cloze (the same cloze-stem-fold drift B28B/FB30 already documented — missing `artifacts/lexical/jmdict/index.json` in this worktree). Symlinked `artifacts/lexical` in from the primary worktree (`/Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/feedback-b12/artifacts/lexical`) and recompiled clean (zero diff) before touching anything. Not committed (gitignored); not this lane's defect.
- **REPORTBTN lane (concurrent):** per the lead's clarification, REPORTBTN is adding a "Report a problem" entry to the same account-menu "Sync & diagnostics" row this lane touches for #208. This lane kept that row's markup (`data-testid="auth-menu-sync-row"`, the label, the nested `SyncManagerTrigger`) unchanged and only changed its `onClickCapture` handler — REPORTBTN should rebase onto `lane/FB32`'s two commits (`2e2c9d75`, and the item-specific commits below) rather than the pre-#208 shape.

## §1 Items

| # | Row | Time (UTC) | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 206 | 196 | 22:15 | "3 tile sentence again, did we fix that yet? Wasn't that something we were going to do?" | content — selection floor (RCA C2/C8-adjacent) | **answered — a floor exists, this step is a tracked/budgeted exemption, not an uncaught bug**; course-wide count + offending-step list produced for a content lane |
| 207 | 197 | 22:17 | "Not this lesson but one before, is nishita ni + shita or its own word" | content — grammar explanation gap | fixed, `m34.ir.yaml` (`koto-ni-suru` rule card) |
| 208 | 198 | 22:21 | "Can't see this make it a menu on phone" | mobile UI — C3 shared-component overflow | fixed, `AuthMenu.tsx` / `SyncManager.tsx` / `SyncManagerTrigger.tsx` |

## §2 Root-cause notes and fixes

### §2.1 — #206: the 3-tile build answer (row 196)

**Located:** `scripts/lane/step-url.mjs "しごとでがんばる" --lang ja` → `ja-m34-neo-10?step=5` (0-indexed), type `listening_build`. Confirmed against the emitted runtime JSON (`src/pub/content/v1/ja/m34.*.json`): step id **`ja-m34-neo-10-s-2`**, `correctOrder: ["しごと", "で", "がんばる"]` — exactly 3 answer tiles, sentence 「しごとで がんばる」 "I do my best at work" (`m34.ir.yaml:541`, beat comment: "Second carrier (rep-audit 2026-09-09): bare がんばる (non-past) had one distinct carrier. A domain (work), not a frequency adverb."). The tile bank shown in his screenshot (しごと/で/がんばる as answer, に/窓/を as extra bank tiles) is `padBuildTileFloor`'s runtime distractor padding — the answer itself is the 3 tiles, per `codebase-search` §5's "runtime bank ≠ source bank" landmine.

**The floor already exists — this is not an uncaught bug.** `src/features/lesson/data/contentFloors.ts`: `ANSWER_TILE_FLOOR = 5`, binding from `ANSWER_FLOOR_FIRST_MODULE = 12` onward — Spencer's own rule from 2026-09-15 ("5 tiles in the answer, and yeah m11 is good for a cutoff — at LEAST 5 tiles in the answer in anything after m11," `docs/spencer-product-sentiment.md` Topic 3). It is enforced as a **ratchet**, not a hard zero, by `src/features/languages/ja/__tests__/buildAnswerFloor.test.ts`: a per-module `SHORT_ANSWER_BUDGET` records today's authored debt (656 short answers found 2026-09-15, cut to 203 course-wide the same evening by a local-model extension-lane pass — 454 patches applied) and the gate fails only if a module's count **exceeds** its recorded budget, or a module with **no** budget entry has any violation at all.

**Why this exact step passed:** `m34`'s budget is **15** short (<5-tile) build/listening_build answers, and `ja-m34-neo-10-s-2` (this step) plus its neighbour `ja-m34-neo-10-s-1` ("まいにち がんばる", 2 tiles, one step earlier in the same lesson) are two of those 15 already-tracked, not-yet-repaired entries. `buildAnswerFloor.test.ts` passes clean on this worktree (6/6) — the gate is doing its job; the step is a **budgeted exemption**, exactly analogous to how a module with 0 recorded debt would fail immediately on any new violation. This is not a gap in the gate; it's authored debt the gate is deliberately not yet blocking on, per the ratchet design.

**Course-wide count (2026-09-18, measured against fresh `content:emit`, m12+):**

- **≤3 answer tiles: 117 steps across 20 of 35 in-scope modules** (out of 3,366 in-scope build/listening_build sentence steps m12–m46).
- For cross-check: the full **<5**-tile class (everything the existing gate already tracks) is **203 steps** — this matches `SHORT_ANSWER_TOTAL_BUDGET = 203` in `buildAnswerFloor.test.ts` **exactly**, confirming this sweep replicates the gate's own predicate (`isSentenceBuildStep` / `answerTileCount` from `contentFloors.ts`) rather than a new, looser count.
- Per-module ≤3-tile counts: m12:20, m13:1, m14:4, m16:2, m20:2, m24:1, m27:4, m28:2, m29:1, m33:10, **m34:12**, m35:5, m36:6, m37:5, m38:12, m39:20, m43:1, m44:2, m45:2, m46:5.
- Full 117-line list (module, lesson, step id, tile count, sentence) is in `sweep-206-output.txt`, handed to the lead alongside this doc — **not pasted inline** to keep this sheet walkable.
- Sweep script + full output copied to the session scratchpad (`briefs/FB32-artifacts/sweep-206.py`, `sweep-206-output.txt` — not committed to the repo, handed to the lead/content lane directly) for whoever picks this up.

**Did NOT rewrite content in this lane**, per the brief.

**On adding a Q13 procedural-QA question — my position: don't, and here's why.** The brief proposed an informational Q13 ("build answers have ≥4 tiles unless debut") for the case where no floor exists. One already does — `ANSWER_TILE_FLOOR`/`buildAnswerFloor.test.ts`, both enforced today and already producing exactly the 203-count cross-check above. A second, differently-thresholded (4 vs 5) and differently-exempted (debut vs module-cutoff-plus-per-module-budget) gate over the *same* defect class is precisely the "two independent leniency lists, both stale, neither backfilled" pattern `codebase-search` §3 warns about, and `pipeline-judgment-in-inventory` doctrine ("narrow the pools, don't add checks"). If Spencer wants the ≤3-tile steps flagged as a *more severe* priority subset within the existing 203-item backlog (which they plainly are — a 2–3 tile answer is worse than a 4-tile one), the right move is a report cut from the **existing** gate's data (exactly what `sweep-206-output.txt` is), not a parallel gate with its own drift risk. Flagging this as a genuine judgment call for Spencer to override if he disagrees.

### §2.2 — #207: ことにする rule card doesn't name に (row 197)

**Located:** at 22:15 he was on `ja-m34-neo-10` (per #206 above); "not this lesson but one before" is `ja-m34-neo-9` in the course-map lesson order (`manifest.json`'s `m34` module lesson list: `…, ja-m34-neo-9, ja-m34-neo-10, …`), OR — the more likely reading given the two-minute gap — he'd moved on from `m34-neo-10` by 22:17 and "one before" meant `m34-neo-10` itself, which is where the ことにする review beats sit (`m34.ir.yaml:543–544`: 「まいにち あるくことにする」/「らいねん ちょきんすることにした」). Both readings converge on the same fix: **`m34-neo-9` teaches ようとした, not ことにする at all** (confirmed by reading its beats — no にした content there), so the construction he's asking about can only be the ことにする review beats living in `m34-neo-10`, whose explanation lives in the single canonical rule card `koto-ni-suru`, first taught in `m34-neo-6` ("「やめることにした」 — deciding, hands on the wheel") and reused (never re-authored) everywhere else it's shown, including the two lessons above. Grepped the whole JA course for a sibling copy (`grep -rl "id: koto-ni-suru" src/features/languages/ja/curriculum/ir/*.ir.yaml`) — one file, one definition, no drift risk.

**Root cause:** the rule card explained こと (module 15's nominalizer) and する (the decision verb) but never named に as a separate piece — it read ことにする as one lump ("Take the whole action as a こと … and する it"), which is exactly why にした looked like it might be its own fused word rather than に + した.

**Fix (IR yaml only, `m34.ir.yaml:140`):**

- Before: *"「〜ことにする」 is deciding, with your hands on the wheel. Take the whole action as a こと — a thing, module 15's nominalizer — and する it: 「かいしゃを やめることにした」, I decided to quit the company. する is the tell that YOU pushed: the decision has an owner, and it is the speaker. Present tense decides now (ことにする); past tense reports the decision already made (ことにした), which is how it usually appears — we mostly tell people about decisions after making them."*
- After: *"「〜ことにする」 is three real pieces, not one fused word: こと turns the action into a thing (module 15's nominalizer), に marks what that thing becomes, する makes it so. 「かいしゃを やめることにした」 = quitting the company (こと) became (に) the decision made (した): I decided to quit. に is the same particle you've had since module 6 — にした is に + した, never its own word, and する's subject is always the decider (the speaker pushed it). Past tense (ことにした) is how this usually appears, since we mostly report decisions after making them."*

Kept the quoted course sentence (かいしゃを やめることにした) and the existing `examples`/`antiPattern` unchanged — only the `rule` prose changed, and it stays inside the ~3-line explanation budget (`docs/lesson-authoring-guide.md`'s "Explanation text budget"). **Verified に's own module before writing "since module 6"**: grepped every earlier module's IR for a registered に atom (`romaji: ni`) — first hit is `m6.ir.yaml:144` (`gloss: "at / in (location of existence)"`); an earlier draft said "module 4" and was wrong before I checked.

**Sibling check:** `koto-ni-suru` is a JA-only grammar point (no KO/ES/FR equivalent frame at this tier); single source of truth confirmed above, so every surface that shows it (lesson rule peek, grammar review "see the rule") picks up the fix automatically.

**Cross-item theme, for the record:** this is the same class as b30 §2's ようとした/てみた aspect-gloss fix (#200/#201) and the Q12 gloss-aspect sweep (`docs/procedural-qa-2026-09-17.md` §"Q12") — a rule card that names *some* of a construction's pieces but leaves one implicit reads to a learner as "maybe this is one word." Worth a mention next to Q12's scope (currently gloss-aspect only) if a broader "every named particle inside a taught construction must be called out as a particle" sweep is ever run — not proposing that sweep in this lane, just flagging the pattern.

### §2.3 — #208: phone account menu, Sync & diagnostics row overflows (row 198)

**Lead's clarification (received mid-lane, addressed before completing):** the surface is the Sync & diagnostics panel *inside* the phone-only account-menu row (`AuthMenu.tsx`, added for #196/build 30) — it expands `SyncManagerTrigger`'s own absolutely-positioned popover **inline** inside the account dropdown, with no scroll container anywhere in that chain, so the combined stack (dropdown items + Sync header + per-source rows + diagnostics + Layout-trace + reset-flag panels) ran past the viewport with the Learn map hidden underneath.

**Fix — the row becomes a submenu entry that opens its own sheet:**

- `src/shared/components/sync/SyncManager.tsx` — new `renderMode?: "popover" | "inline"` prop. Extracted the panel body (status header, per-source list, diagnostics, `extra`) into one shared JSX fragment so **both** modes render identical controls; `"popover"` (default, unchanged) keeps the trigger button + absolutely-positioned `w-[210px]` panel; `"inline"` renders that same fragment as a plain in-flow block — no trigger button, no absolute positioning, no click-outside listener (the host now owns open/close).
- `src/features/sync/SyncManagerTrigger.tsx` — passes `renderMode` through.
- `src/shared/components/AuthMenu.tsx` — the phone-only sync row's **markup is unchanged** (`data-testid="auth-menu-sync-row"`, the label, the nested `<SyncManagerTrigger />`), per the lead's instruction to coordinate with the concurrent REPORTBTN lane touching the same row. Only what tapping it *does* changed: the click is intercepted in the **capture phase** (`onClickCapture`, `stopPropagation` + `preventDefault` before `SyncManagerTrigger`'s own nested button sees it, so its popover never opens), closes the account dropdown (`setOpen(false)`), and opens the panel in its own full-height bottom `Sheet` (`src/shared/components/ui/Sheet.tsx`, the same primitive already used by `ReviewDetailsSheet`/`VocabCardSheet`/`DictionaryEntrySheet` elsewhere — scrollable body, close button, safe-area padding, `max-h-[88vh]`) via `<SyncManagerTrigger renderMode="inline" />`.
- Desktop/tablet header trigger (`routes/Layout.tsx`, `routes/SidebarNav.tsx`) is untouched — both call `<SyncManagerTrigger />` with no `renderMode`, so they stay on `"popover"`. Layout.tsx already hides the trigger below `sm` (line 324's own comment), which is why the phone-only row inside `AuthMenu` is the only phone route to this panel.

**Tests (failing-test-first):** `SyncManager.test.tsx` (4/4, new) — `"popover"` shows nothing until the trigger is clicked; `"inline"` shows every control (source rows, diagnostic line + action button, `extra` content) immediately with no trigger button and no `role="menu"` chrome. `AuthMenu.test.tsx` (4/4, new) — the sync row's markup is present; tapping it closes the dropdown (`Theme` etc. gone) and opens a `role="dialog"`, not `SyncManagerTrigger`'s own popover; the dialog contains the inline-mode trigger; the dialog closes on its own close control.

**Verified — Chromium, real interaction, 390×844** (`mobile-ui-verify` §1: this proves DOM/logic + a first pixel number, not a device-authoritative claim — see the device-verification gap below): isolated dev server (`VITE_DEV_AUTH_BYPASS=true npx vite --port 5477`), real click sequence (avatar → sync row → close), against `/home`:

| engine | surface | viewport | element | result |
|---|---|---|---|---|
| Chromium (Playwright) | `/home`, account menu | 390×844 | account dropdown → sync row tap | dropdown closes, `role="dialog"` opens |
| Chromium | sheet | 390×844 | dialog bounding box | `{x:0, y:411, w:390, h:433}` — bottom = 844 = viewport height exactly (no overflow) |
| Chromium | sheet | 390×844 | page | no horizontal scroll (390 vs 390) |
| Chromium | sheet | 390×844 | close button | 32×32px (≥24px WCAG 2.2 SC 2.5.8 target) |
| Chromium | sheet | 390×844 | close button tap | dialog closes |

Screenshots (session scratchpad, `briefs/FB32-artifacts/`, not committed to the repo): `208-dropdown-open-390x844.png` (matches his #198 shot's dropdown exactly — same "SYNC & DIAGNOSTICS" row, same items above it) and `208-sheet-open-390x844.png` (Sync/Flashcards/Lessons/reconcile/Layout trace (#174)/Diagnostics/Sync diagnostics (#176a)/Pull-from-server — every control from his shot, now inside the sheet, fully visible, nothing clipped).

**What is NOT device-verified, stated explicitly (`mobile-ui-verify` §6):** attempted one real 15 Pro Max simulator capture (`node scripts/ux-loop/sim-capture.mjs --route "/home" --tap "[aria-label='Account menu']"`, `sim.lock` held for the duration) — the app built and launched (real WKWebView render of `/home` confirmed visually, dark theme + real fonts/safe-area), but the harness's `nativeMode` validation failed for this route+tap combination after 3 attempts and did not promote a canonical screenshot. `sim-capture.mjs`/`sim-proof.sh` are built around lesson-route build simulations (a single `--tap` for a post-mount click); they don't support this two-tap non-lesson-route sequence today, and extending that tooling is out of scope for this lane. The `Sheet` primitive itself is already shipped and reused across several other features, which lowers the risk of this specific gap, but per doctrine this is reported as **unverified on device**, not as fixed-and-proven.

## §3 Tests run

- `npx tsc --noEmit -p tsconfig.app.json` — clean, twice (after each of #208's edits).
- `src/shared/components/AuthMenu.test.tsx` — 4/4 new, green.
- `src/shared/components/sync/SyncManager.test.tsx` — 4/4 new, green.
- `npx vitest run --project app src/shared/components src/features/sync src/routes` (sibling scope for #208) — 93/93 green, no regressions.
- `npx vitest run --project curriculum src/features/languages/ja/__tests__/buildAnswerFloor.test.ts` — 6/6 green (confirms #206's step is within budget, not a new violation).
- `src/features/languages/ja/curriculum/__tests__/m34-neo.test.ts` — 123/123 green (#207).
- `npx vitest run --project curriculum src/features/languages/ja` (full JA curriculum suite, after #207) — **8111 passed, 6 skipped** (0 failed).
- `npm run content:emit` — green, both after #206's investigation compile and after #207's fix.
- `npm run module-gate -- m34 --compact --skip-visual`:
  - **PASS** — m34 module tests, `tsc --noEmit`, exposure audit (informational).
  - **FAIL** — TTS deck emit: 6/11489 cards missing clips, all unrelated to this lane's edit (きかい/うごく machine sentences from elsewhere in the hiragana deck, a train-rumor sentence) — environment gap (no sibling `lingo-data` checkout).
  - **FAIL** — FULL vitest (CI parity): `proceduralQa.test.ts` ja Q3 — 0 applicable steps, below the committed floor of 3927 — **the same pre-existing gap `docs/user-feedback/2026-09-18-testflight-b30.md` §3 already documented**: this worktree's JA lexical sidecar venv (`scripts/lexical/ja/.venv`) has no `sudachipy` installed, confirmed even after symlinking both `artifacts/lexical` and `scripts/lexical/ja/.venv` in from the primary worktree (`python -c "import sudachipy"` still fails in the primary worktree's own venv too). Re-ran the JA curriculum suite directly (bypassing the two infra-gated stages, see above) — 8111/8117 (6 pre-existing skips), 0 failed, confirming the content diff itself is sound.

## §4 Not done this lap

- #206's 117 (≤3-tile) / 203 (<5-tile) offending build/listening_build steps — located and listed (`sweep-206-output.txt`), **not rewritten**, per the hard rule against inline bulk authoring; queued for a content lane.
- The TTS-deck-emit and procedural-QA-Q3 environment gaps (no sibling `lingo-data` checkout; JA lexical sidecar missing `sudachipy`) — pre-existing, documented twice now (b30 and this doc), not fixed by either lane; whoever next needs the full `module-gate` green in this worktree should provision both.
- #208's real-device (WKWebView) verification of the two-tap sheet-open sequence — Chromium-verified only; `sim-capture.mjs` doesn't support a chained non-lesson-route tap sequence today (see §2.3).
