# INDEX.md — research map for agents

**Status:** LIVE · built 2026-07-26 · maintained by the daily session-start index job — keep entries to one line, keep status tags current, don't reformat.

Read this file FIRST when researching the project, then jump straight to the named doc. Don't grep docs/ blind: ~half of the 160 md files are stale or archival, and most (but not all) self-flag it.

## Precedence when docs disagree

1. `authoring-invariants-pinned.md` — the pinned JA law
2. `CLAUDE.md` (repo root) — code invariants, SRS write surfaces, commands
3. `retrospective-2026-07-17.md`
4. `lesson-authoring-guide.md` (§13 = locked template)

`PROJECT_STATE.md` is STALE (self-flagged; still ok for launch/feature-flag picture only). `docs/tasks/*` = backlog, unverified — never current state.

## Where to look for X

| Question | Go to |
|---|---|
| JA authoring rules / invariants | `authoring-invariants-pinned.md` → `lesson-authoring-guide.md`; process: `authoring-workflow.md`; per-module packs: `context/mN-context.md` (regen: `node scripts/authoring-context.mjs mN`) |
| IR→compiler pipeline (the pivot) | `content-ir-spec-2026-07-20.md` (APPROVED 07-23); build: `node scripts/compile-ir.mjs mN`. ⚠️ only m6 uses it — m4-neo/m5-neo are hand-authored TS |
| SRS / scheduling | CLAUDE.md §SRS (six write surfaces, binding) + `srs-scheduling-model-2026-06-15.md`; research: `srs-memory-retention-research-2026-07-19.md` |
| Max-acceptance grading, sibling distractor banks | **NOT in docs/** — code comments in `src/features/languages/ja/jaAcceptedForms.ts` + `jaSiblingSets.ts` (2026-07-24, newer than all docs) |
| Gate 10 visual QA | `visual-qa-gate-2026-07-17.md` + `scripts/visual-qa/judge-prompt.md` (judge protocol, abort-don't-improvise); run: `npm run visual-qa:contracts` / `visual-qa:capture` |
| Module readiness gate | `npm run module-gate -- mN` (vitest + TTS coverage + tsc + optional capture/exposure) |
| Pedagogy / what explanations may claim | `pedagogy-principles-2026-07-05.md` (binding); source recon: `jouzu-juls-cure-dolly-recon-2026-07-02.md` |
| Rewrite status / spine | `rewrite-cycle-report-2026-07-20.md` (living log); `spine-draft2-adversarial-audit-2026-07-19.md`, `vocab-frequency-audit-2026-07-19.md`; module specs: `m4-neo-` / `m5-neo-authoring-spec-2026-07-20.md` |
| ES course | style contract: `es-rewrite-brief-2026-07-16.md`; vocab tables: `es-course-spine-2026-07-13.md` (style section there superseded); quality: `es-content-quality-audit-2026-07-16.md`, `es-ja-parity-2026-07-15.md` |
| Kanji behavior | CLAUDE.md (LIVE from M8 via `applyKanjiSurfaces.ts`) — all three kanji docs (furigana-plan / implementation-spec / timing-research) are STALE |
| Grammar deck / conjugation trainer | `grammar-deck-v1-spec-2026-07-02.md`, `conjugation-trainer-v1-spec-2026-07-02.md`; new step type draft: `conjugation-transform-spec-2026-07-23.md` |
| Placement / test-out | 2026-07-15 specs in `superpowers/specs/` (placement-level-gate, testout-improvements); the 07-08 placement proposals are STALE |
| TTS | CLAUDE.md §TTS (emitter landmine) + `../lingo-core/docs/TTS.md`; voice QA tooling: `lingo-core/scripts/tts/` |
| Emoji / vocab art | `n5-vocab-emoji-reference-2026-05-18.md` (canonical map) + `emoji-blocked-words-2026-05-18.md` (blocklist current; its ja phrase_card advice stale) |
| Architecture | `ARCHITECTURE_REVIEW_2026-06-14.md` (cross-repo); backend: `../lingo-core/docs/INDEX.md` |
| Product backlog / current tasks | `TODO.md` (LIVE 07-17); ignore FEATURES / PRODUCT_BACKLOG / MVP_* (all pre-launch-era STALE) |
| Frontend follow-ups | `followups.md` (LIVE 07-26) — backend/frontend contract gaps and deferred cleanups |
| Real-user feedback | `user-feedback/` (higher product signal than synthesized audits) |
| Competitive / research | `research/` — all 6 active (duolingo survey/teardown/gap, multi-language scoping, onboarding audit, spencer migration) |
| AI-workflow / agent process | `ai-workflow-optimization-research-2026-07-17.md`, `dispatch-economics-log.md` (LIVE), `authoring-workflow.md` |
| Ads / finance / economics | `ADS_AND_FINANCE_ARCHITECTURE.md`, `ADS_PLACEMENT.md`, `ECONOMICS.md`, `finance-transparency-endpoint-spec-2026-05-25.md` |
| Past session decisions | thread index + grep cookbook: `~/.claude/projects/-mnt-c-Users-Spencer/memory/thread-index.md` |

## Landmines (cost real research time)

- **-neo convention:** `m3-neo.ts` fully replaced m3, but `m6-neo.ts` coexists with `m6.ts` — resolve via course map (`src/shared/domain/mockCourse.ts`), never filename. m2 rows carry `ja-m1-*` ids. m28 does not exist (m27→m29).
- **Docs contradicting shipped code:** `dataformats/flashcards/anki-import.md` says not-implemented — it IS built (`anki-import-spec-2026-07-07.md` + `scripts/anki-export-known.py`). `lingo-core/docs/xp-curve-design-2026-05-25.md` claims client-side XP — server-authoritative `XpEconomyConfig` won.
- **Dead links:** `docs/SETTINGS_AND_DATES.md` (from settings README) and `FLASHCARD-DATA.md` (from docs/README) don't exist — don't chase them.
- **CI ≠ all tests:** `.github/workflows/ci.yml` runs tsc+vitest+build (lingo) / ruff+pytest (core) only. Playwright e2e and Gate 10 visual QA are local/manual.
- **`__discover.mjs`** at lingo root is a throwaway debug probe, not infrastructure.
- Large uncommitted volume on main is normal mid-cycle here (fast-walk-loop pattern), not drift.

## Stale/superseded clusters (skip unless doing history)

- **May m3–m7 wave (4 docs):** m3-m7-audit-synthesis, m3-m7-rebuild-spec, wave-4-m3-m7-reauthor, wave-4b-dispatch-briefs
- **Kanji (3 docs):** kanji-furigana-plan, kanji-implementation-spec, kanji-timing-research — superseded by shipped `kanjiRollout.ts` / `applyKanjiSurfaces.ts`
- **Placement 07-08 pair:** placement-questions-proposal, placement-testout-derived
- **Launch-era product docs:** FEATURES, MVP_PAGES_PLAN, MVP_PRODUCTION_READINESS, PRODUCTION_ROADMAP, PRODUCT_BACKLOG, n5-content-spec
- **Shipped-and-archival:** katakana-rollout-romaji-fade-spec, ko-conjugation-phase1, conjugation-trainer-recon, flashcards-anki-scoping, info-step-audit, qa-live-findings, workshop-agenda, practice-features-spec, handoff-*, learning-science-foundation (frozen), card-agnostic-reviews, lesson-editor-research (claims SM-2 — wrong), retention-architecture-design (partially superseded), n4-scoping (corrected by n4-pilot-spine; pilot-spine itself carries a dict-form-first risk banner)

## Directory policy

- `archive/` — all historical; its README is the policy. `superpowers/specs/` — May files stale; only the two 2026-07-15 placement/testout designs active. `tasks/` — backlog, unverified (homepage-ux + practice-hub explicitly closed; japanese-content/particle-practice/lesson-reauthor superseded). `dataformats/` — active except flashcards/anki-import. `context/` — generated packs, regen don't hand-edit. `agents/basecontext/` — dispatch context (AUTH_STRATEGY duplicated by tasks/auth-session-strategy).
