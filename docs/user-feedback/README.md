# User feedback log

Real-user observations + Spencer's product notes. This is the **product input** surface, not the architecture canon — read alongside `PROJECT_STATE.md` (current state) and the roadmap / spec docs (intended state).

**File naming:** `YYYY-MM-DD-<source-or-cohort>.md`.

**What goes here:**
- Verbatim tester observations from real-user sessions (highest signal).
- Spencer's own product notes from his own walkthroughs (flag bias when relevant).
- Synthesized cohort feedback once enough sessions accumulate.

**What does NOT go here:**
- Architecture critique → `ARCHITECTURE_REVIEW_2026-06-14.md`.
- Multi-agent persona audits → live alongside the spec they audited (e.g. `m3-m7-audit-synthesis-2026-05-18.md`). Those are *simulated* personas, not real users.
- Bug reports tied to a specific test failure → CLAUDE.md `## 🐛 Active bugs` section or the issue tracker.

**Workflow:**
1. Log the raw observations under the right `YYYY-MM-DD-…` file.
2. Tag each item `[HIGH] / [MED] / [LOW]` based on cross-user replication + actionability.
3. When an item becomes actionable, link it into the relevant queue (CLAUDE.md `Active queue`, curriculum roadmap §10, or the audit synthesis doc) — keep this folder as the *raw input*, not the action plan.
