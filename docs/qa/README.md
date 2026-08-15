# Spencer-facing review queue — lives IN THE APP

**The queue is the baked-in dev page at `/:lang/qa/review`** (linked from the QA test-drive page at `/:lang/qa` under "Feedback"), in the same family as the test-drive checklist: plain-language entries, verdict buttons (✓ yes / ⚠ discuss / ✗ no), an answer box per entry.

- **Entries live in `src/features/lesson/dev/reviewQueue.ts`** — agents append them there. The read-me rendered at the top of the page (and exported as `REVIEW_QUEUE_READ_ME`) is the writing contract: verbose but plain language, a concrete example of the issue is MANDATORY, end with exactly what's needed from Spencer. `reviewQueue.test.ts` enforces the mechanical half (unique R#/Q# ids, non-empty body/example/ask).
- **Spencer's answers mirror live** to `/tmp/lingo-review-queue.json` while the dev server runs (`/__lingo-review-queue` middleware in `vite.config.ts`, same pattern as the QA-notes mirror); the page's Export button is the offline fallback.
- **When an answer lands:** copy Spencer's words verbatim into the relevant backlog record's `note:` (`docs/backlog/README.md`), then set the entry's `resolved:` field with a one-line outcome — it moves to the collapsed Resolved section. Never delete entries.
- This queue is the human front door; **`docs/backlog/items.yaml` remains the machine record** for all real work.

_(2026-08-09: an earlier markdown version of this queue briefly lived here as `REVIEW.md`/`FINDINGS.md`; Spencer redirected it to the in-app page and the seeded entries R1–R7/Q1 were ported into `reviewQueue.ts`.)_
