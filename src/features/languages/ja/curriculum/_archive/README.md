# ARCHIVED old-course JA content (2026-07-26)

**Spencer's ruling:** the old course is *archived, not deleted*. It stays on
disk as a PLANNING reference. It must not be referenced by anything else.

- **Planning / research / Spencer** may read these files freely — coverage
  checks, "what did we used to teach here", gap-hunting.
- **Authoring agents never see them** (`docs/authoring-workflow.md`).
- **No function in the program may reference them.** They are excluded from
  `tsconfig.json` and from the vitest run, and nothing in `src/` imports them.

## What moved here

26 old-course JA grammar modules (`m3-v2`, `m4`–`m27`, `m29`) plus their test
files, and 9 test files elsewhere in `src/` that existed only to validate them.
`m30` (the N4 pilot) was deliberately LEFT in place — archiving it removes the
whole N4 tier UI, which is a separate decision.

## Why

The old course was the hidden source of a recurring class of defect: stale
`fromModule` attribution leaking into neo authoring, polite-register review
pools reaching a dict-form-first course, old-course sentences feeding the
grammar harvest, and gate exemptions calibrated against content the learner
can no longer reach. Archiving removed all of it at the root.

## Coverage this cost (re-establish against neo content)

These guards were archived with their subject matter and should be REBUILT
for the neo course, not forgotten:

- `atom-coverage.test.ts` — invariant 14 (every SRS-eligible atom needs ≥3
  authored surface occurrences). **This is a pinned invariant with no live
  guard right now.**
- `mcq-position-distribution.test.ts` — invariant 11 (rotate correct-answer
  slots).
- `sub-lesson-density.test.ts`, `wave-4-acceptance.test.ts` — density/
  acceptance sweeps.
- `ja-m3-m7-coverage.test.ts` — lesson-registration coverage.

Additionally, tests asserting behaviour for modules that no longer exist
(kanji ladder at M8+, katakana cutoff at M17, `kanji_reading` at m29) are
marked `it.skip` with a DORMANT note in place — re-enable them as each module
is authored.
