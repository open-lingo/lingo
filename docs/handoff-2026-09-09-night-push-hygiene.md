# Handoff 2026-09-09 (night) — ES m18–m20 + KO gates ON PROD; weekly hygiene run; to-dos for Spencer

Supersedes the state tables in `handoff-2026-09-09-ko-mobile-pass-paused.md`
and `handoff-2026-09-09-es-m20-done-ko-next.md` (keep both: the first has the
step-pass runner recipe + landmines, the second the m20 Sonnet-drafting template).

## What is on prod (verified)
| item | evidence |
|---|---|
| ES m18 «Nosotros y ellos», m19 «Ayer hablé», m20 «Fui, hice, tuve» | pushed 39fc9eec; ci 34432814487 + deploy 34432814493 both `success`; entry `index-DjvNBff7.js` contains all three titles; m20 clips `9b4d4bdf9142b5df`/`cde685b143c7a519` serve audio/mpeg from `/tts/v1/es/` |
| KO gates m3–m27 (intro-before-graded, compounding-review, particle-cue), review grids m16–m27, R1–R4 m2 fixes | same push |
| KO 17 Pro Max step pass | 52 touched steps × {17 Pro Max, SE}: 0 flags at Pro Max; SE only the known 83px match-grid scroll; 2 Sonnet reviewers found no defects |
| docs | 57c87543 (push record) + this commit (CLAUDE.md course state 2026-09-09, CODE_MAP regen, stale-claim sweep, this handoff) |

origin/main after this session's last push: see `git log` — nothing of this
session is unpushed. The mobile session ("Mobile app feedback fixes [fbedc0]")
was told to push its four branches + cut a build + do its own docs pass + write
its handoff (Spencer's instruction, relayed 2026-09-09 ~21:45 MT).

## Weekly maintenance (run 2026-09-10T03:49Z, stamped `--ran`)
- `node scripts/code-index/index-job.mjs`: drift=1 (`sw.js` cited in CLAUDE.md —
  generated file, not drift, ignore), grew=71, orphans=19 (the same 19 false
  orphans as 2026-08-21: lazy routes/entrypoints), offenders=182 god-files.
  `docs/CODE_MAP.md` regenerated and committed.
- `node scripts/doc-hygiene/run.mjs`: branch `doc-hygiene-2026-09-10`
  (worktree `../.doc-hygiene-worktrees/2026-09-10`), 0 auto-archived, 8 queued.
  NOT merged (prior passes never merged their report branches either; the
  branch holds only `docs/hygiene/*`). Findings:
  - "dead INDEX link" `lingo-core/docs/xp-curve-design-2026-05-25.md` is a
    FALSE POSITIVE (the file exists in `../lingo-core`; scanner is single-repo).
  - 6 self-declared-stale docs with inbound refs (ARCHITECTURE_REVIEW_2026-06-14,
    card-agnostic-reviews, info-step-audit, kanji-implementation-spec,
    m3-m7-audit-synthesis, n5-content-spec) — same set as last month; the
    coder drafted 0 repoint edits. Real fix is repoint-then-archive by hand;
    `n5-content-spec-2026-05-25.md` additionally contradicts itself (header says
    STALE, `docs/archive/README.md` calls it the module-map SoT) — pick one.
  - 58 top-level docs unlisted in INDEX.md (sample in the branch's LEDGER).
    INDEX.md is the mobile session's file; hand them the list when they are idle.
- Embedding index refreshed (`embed-cli.mjs index`).
- Manual archive sweep earlier tonight moved 3 docs (`docs/archive/README.md`
  rows); ~30 other stale-looking docs KEEP because src/tests cite them.

## To-dos that need Spencer (left as to-dos on purpose)
1. Hand Payton `docs/ko-handoff-payton-2026-09-09.md` (m2 hangul, m16–m27 with
   m16/m21/m26 first, new grids, cue wording, liaison claims).
2. KO decision: register 가게/노래/사과/귀/회사/의자 at m2 (ripples 5 gates).
3. ES walk debt m11–m20 (B111); FR m3–m10 walks + m10 liaison listen.
4. Device pass on TestFlight build 10; APK on Desktop for Maddie.
5. Review the mobile session's four branches (mobile-map-wave, filler-pool,
   n4-carriers, m31-recycle) — or confirm they landed tonight.
6. KO low-priority: m12 review carriers (ratchet 0.6, m12 at 0.625), 742
   untaught grade-A words, TTS manifest lock.
7. ES m21+ direction (plural preterite vs imperfect).
8. Hygiene judgment queue above (6 stale docs, 58 unlisted, n5-content-spec contradiction).
9. Code-index LEDGER: 19 orphan candidates — confirm false or delete.

## Resume recipes
- Next ES module: `docs/handoff-2026-09-09-es-m20-done-ko-next.md` §m20 (Sonnet
  drafting template, brief at `docs/es-ir-sources/es-m20-brief.md`).
- Next KO step pass: `docs/handoff-2026-09-09-ko-mobile-pass-paused.md` (runner
  `artifacts/ux-loop/ko-pass/run.mjs`, landmines).
- Push checklist: tell the mobile session → `git fetch && git rebase --autostash
  origin/main` → `npm run preflight > log 2>&1; echo $?` → push → `gh run watch
  <id> --exit-status` + `gh run view <id> --json conclusion` → prod fingerprint.
