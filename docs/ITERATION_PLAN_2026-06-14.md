# Open Lingo — Iteration Plan (hand-off to executing agent)

_Authored 2026-06-14 from the architecture review (`ARCHITECTURE_REVIEW_2026-06-14.md`) + Trevor's triage via the planning console (`architecture-review-2026-06-14.html`)._

This is an **executable hand-off**. Another Claude will pick this up. Trevor's triage decisions are authoritative — they're quoted verbatim under each item. Findings IDs map 1:1 to the review doc.

## Ground rules for the executing agent (read first)

1. **Pull `main` on ALL FIVE repos before doing anything** (`lingo`, `lingo-core`, `lingo-async`, `lingo-ops`, `lingo-infra`). The original review was wrong because it ran against a `lingo-core` tree 86 commits stale. Do not trust comments/docs over code — verify.
2. **Ask before building.** Confirm the approach per item before writing code (Trevor's standing instruction).
3. **Stay low-cost / MVP.** Cost is a hard constraint this phase — that's why observability (H2) and managed secrets (M4) are explicitly deferred. Don't add paid infra without asking.
4. **Branch + PR per repo**; do not commit to `main`. No AI attribution in commits.
5. Context fields (capacity / deadline / top-goal) were left blank in the brief — **ask Trevor to set scope/sequence expectations** before starting NOW if unclear.

---

## NOW — this iteration

### C3 · Verify the whole stack is really on DynamoDB  _(do this first — it's a gate)_
> Trevor: "everything should be dynamo, verify this all please"

The review found conflicting evidence on whether `social`, `tags`, `community` (5 tables), and `deck_votes` have live Dynamo repos or still fall back to SQLite/mock. **This is a verification task that gates everything else** — don't build on the data layer until it's confirmed.

- **Where:** `lingo-core/app/db/provider.py` (repo wiring + `_safe_connect` degraded mode), `lingo-core/app/db/dynamo/*`, and any `app/db/mock/*` still referenced.
- **Do:** With `DB_BACKEND=dynamodb`, enumerate every domain repo (users, subscriptions, srs, decks, deck_votes, progress, stories, quests, social, leaderboard, tags, community×5, admin_audit, platform_settings). For each, confirm it resolves to a real `Dynamo*Repository` — not `NotImplementedError`, not a `Mock*`, not a silent SQLite fallback. Repeat the same audit in `lingo-ops` and `lingo-async`.
- **Fix:** Implement any stubbed Dynamo repo so all domains run on Dynamo in prod. Remove/neuter fallbacks that silently mask a missing repo (returning `[]`/`None` instead of failing loudly).
- **Acceptance:** A startup assertion or test fails if any domain would degrade under `DB_BACKEND=dynamodb`. No domain returns empty due to a missing repo. Document the final per-domain status table.

### H3 · Async operability (callbacks + DLQ replay)
> Trevor: "yes do this"

Scope the operability pieces that **don't** require paid observability (DLQ-depth CloudWatch alarm is deferred under H2).
- **Where:** `lingo-async/app/http/lingo_core_client.py`, `lingo-async/app/handler.py`, `lingo-async/scripts/`.
- **Do:**
  1. **Circuit-breaker + bounded retry/backoff** on async→core callbacks (`bump_progress`, `add_xp`, `list_quests`) so a transient core 5xx doesn't immediately escalate to a full SQS retry storm.
  2. **`INTERNAL_SERVICE_TOKEN` startup self-check** — on cold start, make one cheap authenticated call; log a loud, unambiguous error if the token is wrong (prevents silent 401 drift between functions).
  3. **DLQ replay script** (`lingo-async/scripts/dlq-replay.py`) — dry-run by default, move N messages DLQ→main queue, with a filter option.
- **Acceptance:** transient core failure → bounded client retries then graceful give-up (message returns to queue, not hammered); bad token surfaces at boot; replay script moves messages with a dry-run preview.

### M1 · Server-backup the unlock map
- **Where:** `lingo/src/features/lesson/data/unlockLessonAtoms.ts` (client `lingo:unlocked-atoms`), `lingo-core` progress/user storage, `lingo/src/shared/hooks/useProgressMe.ts` (hydration).
- **Do:** Persist the unlocked-atom set server-side (user-scoped — a new SK on the progress/user record, or the settings blob). Client pushes the set on unlock and **unions** with the server set on login/hydrate.
- **Acceptance:** clear localStorage / switch device → the unlock ladder restores from the server (no lost progression). Reconcile is a union (never drops unlocks).

### M2 · Guard localStorage quota (no IndexedDB yet)
> Trevor: "no indexed db yet"

- **Where:** `lingo/src/features/flashcards/engine/srsStorage.ts` (and the lesson buffer writes) — currently swallow `QuotaExceededError` silently.
- **Do:** Estimate store size (`navigator.storage.estimate()` where available; size heuristic otherwise); when near the ceiling, surface a warning via the existing sync-status / toast path instead of silently dropping writes. **Stay on localStorage** — IndexedDB migration is explicitly out of scope this iteration.
- **Acceptance:** near-quota writes warn the user (and log) rather than failing silently; document the threshold.

---

## NEXT — after the NOW block

### C1 · Make async side-effects idempotent
> Trevor: "dedupe would be good, I think an atomic 'lastMessage' key would work as well so we can diff ahead of time, and still do incremental writes and stuff, so then we don't have to query before dispatching message"

Design intent (Trevor's): avoid a pre-read round-trip on the hot path. Use an **atomic 'lastMessage' marker** so a duplicate/stale delivery can be detected via a conditional write rather than a separate query, while still allowing incremental (`ADD`) writes for the actual side-effect.
- **Where:** `lingo-async/app/handler.py`, the callbacks in `lingo_core_client.py`, and the core endpoints they hit (`/_internal/.../progress`, `/_internal/users/.../xp/add`).
- **Sketch to validate with Trevor before building:** store a per-(user, handler/stream) last-processed message marker; apply the side-effect under a `ConditionExpression` keyed on message id / monotonic marker so a replayed or older message is a no-op — no pre-read needed. Leaderboard already uses atomic `ADD` (safe); the at-risk paths are `bump_progress` and non-lesson `add_xp`.
- **Acceptance:** replaying the same SQS message twice yields identical quest progress + XP (no double-count); no extra read added on the happy path.

### C2 · Wire concept-rollup recompute (offload to async)
> Trevor: "lets offload to the async worker, if stale is detected, we can best effort refresh to check new data, or have the client check it, track the 'last rollup' or oldest stale date or something"

- **Where:** `lingo-core/app/progress/router.py` (`/me` already returns rollups with `staleAt`; recompute path "never landed"), storage already has `get_attempts_for_concepts` + `put_concept_rollup`; `lingo-async` for the offloaded worker.
- **Do:** When concepts are marked stale, have the **async worker** best-effort recompute (via an event the batch handler emits, or a light periodic sweep) by calling a core internal recompute endpoint. Surface the **oldest-stale timestamp / "last rollup" marker** in `/progress/me` so the client (and the Journey/Vocab mastery UI) can tell freshness and optionally trigger a refresh.
- **Acceptance:** after completing a lesson, concept tiers refresh shortly (async, non-blocking) without slowing `/me`; the Journey page + Vocab mastery facets stop showing stale tiers. (These two surfaces are the consumers — see the `journey-progress-page` branch.)

---

## SKIP — won't do this iteration (rationale recorded so it isn't re-proposed)

- **H1 · Local Terraform state** — Trevor: "this is on purpose, I am the only one writing tf now." Intentional; revisit when a second TF author appears.
- **H2 · No observability** — Trevor: "expensive, will add cloudwatch later this is just mvp, trying to stay within low cost." Deferred for cost. (This is why H3's DLQ-depth alarm is out of scope; replay tooling + circuit-breaker are not.)
- **M4 · Secrets are manual** — Trevor: "later."
- **M5 · No staging / canary / rollback** — skip.
- **M6 · Course manifest tracking is a stub** — skip (fine until multi-language).

---

## Parking lot — untriaged, needs a decision before work

These had no priority set. **Do not start without Trevor's call.**
- **H4 · Abuse prevention is thin** (no rate limiting; community publish-then-moderate; no markdown sanitization). Security-relevant — worth a decision before any public exposure.
- **H5 · XP test/recap mirror drift** — note: this is roughly a one-line server change (add the `-test`/`-recap` bonus to `xp.py`, or drop it from `xpRules.ts`). Cheap to bundle into NEXT if desired.
- **H6 · Grammar Track B is client-only** (lost on cache clear / device switch).
- **M3 · Clock-skew lost reviews** (LWW drops a newer review from a clock-behind device).

---

## Suggested sequence

1. **C3** (gate — confirm the data layer) →
2. **H3 + M1 + M2** (independent, can parallelize) →
3. **C1 + C2** (NEXT; C1 design needs Trevor's sign-off first) →
4. Circle back on the parking lot (H5 is the cheapest win).

Source artifacts in this folder: `ARCHITECTURE_REVIEW_2026-06-14.md` (full findings + file refs), `architecture-review-2026-06-14.html` (interactive console).
