# Archived ES course (July–August 2026 authoring wave)

Archived 2026-08-21, when Spencer promoted the hand-authored §13-doctrine
m1/m2 (built and learner-sim-hardened in `features/lesson/dev/`, walked by
Spencer on the /es/qa routes) as the real Spanish course and directed:
"kill whatever we had authored for spanish and french… save the spines and
word lists and whatnot for now."

These 19 modules (152 lessons), their tests, and their IR (`ir/`) are
archived, not deleted — they are the spine/word-list reference for
re-authoring m3+ under the new doctrine (docs/es-lesson-authoring-guide.md
§13). Same ruling as `ja/curriculum/_archive/`: no function in the program
may reference them; vitest, tsc, the atom collectors, and the review-pool
generator are all blind to `_archive/`.
