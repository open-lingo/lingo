# docs/archive

Completed/superseded docs kept for historical reference — not current guidance.
Files here are moved with `git mv` (full history preserved) only after verifying
they are **(a)** dated + completed or superseded, and **(b)** not referenced by
any current doc, code, or test. Live docs live in `docs/`.

## Archived

| File | Date | Why archived |
|------|------|--------------|
| `tester-walkthrough-m1-m2-2026-05-17.md` | 2026-05-17 | One-off tester onboarding guide for the M1+M2 round; the course is now M1–M27 (JA) + KO parity. Historical; no references. |
| `m3-m7-variety-monotony-review-2026-05-18.md` | 2026-05-18 | Completed audit report that fed the M3–M7 reauthor (now shipped). Historical; no references. |
| `handoff-*.md` (8 files, 2026-05-23 → 2026-06-15) | 2026-05/06 | Session work logs. Inbound refs repointed to `archive/`. |
| `full-app-audit-2026-05-17.md` | 2026-05-17 | Pre-FSRS-6 / pre-placement app audit; items resolved. |
| `mvp-alignment-review-2026-05-25.md` | 2026-05-25 | Dated launch-scope alignment review. |
| `perf-network-audit-2026-06-07.md` | 2026-06-07 | Dated perf/network audit. |
| `ITERATION_PLAN_2026-06-14.md` | 2026-06-14 | Completed iteration plan. |
| `m1-density-restructure-plan-2026-05-17.md` | 2026-05-17 | Completed (shipped) density restructure; refs repointed. |
| `wave-4d-iteration-brief.md` | 2026-05-21 | Completed wave-4 iteration brief. |
| `emoji-art-process-2026-05-18.md` | 2026-05-18 | Emoji vendoring process notes; superseded by CLAUDE.md rules. |

**Removed entirely** (superseded *and* factually wrong — recoverable in git history): `ARCHITECTURE_REVIEW.md` (frontend-only, "SRS is SM-2" wrong conclusions → superseded by `ARCHITECTURE_REVIEW_2026-06-14.md`), `architecture-review-2026-06-14.html` (dup of the .md), `FLASHCARD-DATA.md` (retired SM-2 schema → `dataformats/flashcards/`), `curriculum-roadmap-n5-2026-05-18.md` (kanji-start contradictions → `n5-content-spec-2026-05-25.md`). *(2026-06-30 context-rot sweep.)*

## Not archived (intentionally left in `docs/`)

- `retention-architecture-design-2026-06-13.md` — superseded by `srs-scheduling-model-2026-06-15.md` but carries a "PARTIALLY SUPERSEDED" banner and is still cited by `CLAUDE.md` + `PROJECT_STATE.md`.
- `2026-05-14-japanese-followups.md` — marked "Status: Open"; left until its items are confirmed resolved.
- `m2-row-template`, `m3-m7-rebuild-spec`, `m3-m7-audit-synthesis`, `wave-4-m3-m7-reauthor`, `wave-4b-dispatch-briefs`, `card-agnostic-reviews`, `lesson-editor-research`, `ftue-design-2026-06-14` — **still referenced by current source code / tests** as design rationale for shipped behavior; archiving would orphan those code comments. Left in place per rule (b).
- `curriculum-design-v2.md` — **kept + reframed 2026-06-30** as the curriculum *pedagogy/rationale* doc (cited by 8 shipped-code files). Its stale M3–M11 module spine + "lesson types to add" table were stripped/bannered; the module-map SoT is `n5-content-spec-2026-05-25.md`.
