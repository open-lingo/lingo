# Handoff 2026-09-09 (late) — KO done + committed; 17 Pro Max pass DONE

> **STATUS 2026-09-09 ~19:30 MT: RESUMED AND FINISHED.** Pass ran 104/104 cells clean at
> Pro Max (SE: known 83px match-grid scroll only); both Sonnet reviewers found no
> defects; 3 docs archived (`docs/archive/README.md`); mobile session told. Only the
> push remains (Spencer decides). Sections below are the resume notes as written.

Supersedes the KO half of `docs/handoff-2026-09-09-es-m20-done-ko-next.md`
(its KO queue is now marked 1–4 DONE / 5–7 PARKED; keep it for the ES state and
the m20 authoring template).

## Where things stand
| item | state |
|---|---|
| KO queue 1–4 | DONE, committed 7f3aa520 (gates m3–m27, review grids m16–m27, particle-cue gate, R1–R4 m2 fixes); preflight GREEN exit 0 / 13332 tests on that head |
| Payton handoff | `docs/ko-handoff-payton-2026-09-09.md` (a4f91cf3) — Spencer hands it to Payton himself |
| local main | 13 commits ahead of origin/main (ES m18–m20 + KO); origin/main is now 7b92d6ac (mobile session's iOS build-number bump on 82d7a3b0, ci+deploy green). NOT pushed. Rebase again before push. |
| existing mobile gate, KO routes @ iphone-17-promax | GREEN — `npx playwright test --project=mobile --grep "iphone-17-promax.*ko-"` → 12 passed, 3 skipped (stage-fit on non-lesson surfaces, expected) |
| new-step pass @ 17 Pro Max | DONE — 52 steps × {17 Pro Max, SE}: 0 flags at Pro Max; results in `artifacts/ux-loop/ko-pass/ko-pass/results.json` (gitignored) |
| doc archive sweep | DONE — 3 archived (n4-authoring-wave handoff, mcq-fit handoff, authoring-session-state-2026-08-19); ~30 other candidates KEEP because src/tests still cite them; INDEX.md repoint owed by the mobile session (lines 58, 83) |
| mobile session told "code ready" | DONE (message sent after the pass) |

## Spencer's ask (2026-09-09 evening), clause by clause
1. UI looks good on a 17 Pro Max for the KO surfaces — IN PROGRESS (gate green; step pass paused).
2. Filled-in lesson steps get the mobile QA pass already done — IN PROGRESS (same pass).
3. Then tell the other active session ("Mobile app feedback fixes [fbedc0]") the code is ready — TODO.
4. Mark off to-dos, update docs — handoff KO queue marked; memory updated; Payton doc needs a "mobile pass" line once results exist.
5. Archive anything old or unnecessary — TODO (see recipe).
Spencer also said: use Sonnet agents as needed to go faster.

## The 17 Pro Max pass — what exists and how to resume
Runner (gitignored, on disk): `artifacts/ux-loop/ko-pass/run.mjs` + `targets.json`
(52 target steps: the 21 cued particle clozes, the 3 new m2 image-MCQs
뭐/귀/왜, the 담배 card, the moved m26 listening step, all 24 review grids
m16–m27, and the two m2-bt-review steps that shifted) + `ko-steps.json`
(every KO step: lessonId/stepIndex/stepType/stepId — rebuild with the temp
vitest emitter described below if lessons change).

It reuses the step-pass probe (`scripts/ux-loop/step-pass/measure.mjs`:
tap targets <24px, clipped, edge-bleed, truncation, stage overflow, CTA
below fold, landed/seenType) at `iphone-17-promax` (440×956, insets 62/34)
and `iphone-se` (measurement only), screenshots at 2× for the Pro Max.

```bash
rm -rf node_modules/.vite            # see landmine 1
VITE_DEV_AUTH_BYPASS=true npx vite --port 5280 --strictPort &   # bypass server
node artifacts/ux-loop/ko-pass/run.mjs            # ~10 min; writes ko-pass/shots + results.json next to run.mjs
```
Then: read `results.json` (flag stageOverflow >2px, any smallTapTargets,
clipped, edgeBleed, landed:false), and dispatch TWO Sonnet reviewers over the
52 Pro Max PNGs (clozes / everything else) with the brief: 2× PNGs, look for
prompt truncation, cue text present, tiles off-edge, 12 tiles visible in
grids, nothing under the insets, blank page = harness fault not app fault.
Re-read any flagged PNG yourself before ticketing (Sonnet vision misreads).

One cell was eyeballed before the pause: `ko-m10-2-cloze-ate` renders
correctly — "Yesterday I ate rice. (object)" fits on one line, 4 particle
tiles, CHECK bar clear of the home indicator.

### Landmines hit tonight
1. **Blank white pages from the bypass server** = duplicate React
   ("Invalid hook call" / `Cannot read properties of null (reading 'useState')`
   in Auth0Provider) after Vite "Re-optimizing dependencies because vite
   config has changed". Fix: kill the server, `rm -rf node_modules/.vite`,
   restart, and hit ONE route before the batch. The second run still produced
   blanks for its first cells while Vite re-optimized lazily — the runner now
   reloads once when `landed` is false; still verify shots are not identical
   (`md5 -q shots/*.png | sort | uniq -c`) before dispatching reviewers.
   Two Sonnet reviewers were wasted on blank PNGs tonight (~40k tokens).
2. The runner must live INSIDE the repo (`artifacts/` is gitignored) so
   `@playwright/test` resolves; a copy in the scratchpad fails with
   ERR_MODULE_NOT_FOUND.
3. The mobile gate's routes/viewports have no env override for routes; filter
   by `--grep` on the test title (`"<viewport>.*<routeSlug>"`).
4. Step index emitter: a temp vitest file in `src/features/lesson/dev/` using
   `buildLessonContracts(lessonId)` over `getAvailableMockLessonIds()` filtered
   to `ko-`; `?step=` is 0-indexed and matches `stepIndex`. Delete the file
   after emitting.

## Archive sweep — recipe (nothing moved yet)
Convention: `docs/archive/README.md` — `git mv`, only docs that are (a) dated
and completed/superseded and (b) unreferenced by CLAUDE.md, src, scripts,
tests, .github. Re-dispatch the Sonnet read-only inventory (brief: table of
docs/*.md with date, superseded-by, live referrers, verdict; conservative:
anything CURRENT, 2026-09-dated, or with a live referrer is KEEP), then Fable
does the `git mv`s + README rows. **`docs/INDEX.md` is the mobile session's
dirty file — do NOT stage it.** Give the mobile session the INDEX rows to
repoint (and the two KO handoff rows to add) when they commit their INDEX
change.

## Push checklist (unchanged; Spencer decides)
Tell the mobile session → `git fetch && git rebase --autostash origin/main`
→ `npm run preflight > log 2>&1; echo $?` → `git push origin main` →
`gh run watch <id> --exit-status` + `gh run view <id> --json conclusion` →
prod fingerprint (entry chunk has "Nosotros y ellos", "Ayer hablé",
"Fui, hice, tuve"; sample ES clip hashes) → update memory `es-course-state`
+ `ko-course-state`.
