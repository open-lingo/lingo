> **Status: STALE SNAPSHOT (2026-07-20).** Point-in-time record; some specifics are now wrong. Kept for history — see docs/plan-code-reconciliation-2026-07-20.md §4.

# Architecture Review — Open Lingo (full system)

_Reviewed 2026-06-14 against latest `main` of all five repos: `lingo`, `lingo-core`, `lingo-async`, `lingo-ops`, `lingo-infra`. Supersedes the frontend-only `ARCHITECTURE_REVIEW.md` (2026-05-18)._

> **Method note.** This review verifies claims against actual code, not comments or docs (an earlier draft was run against a `lingo-core` tree 86 commits stale and reached wrong conclusions — e.g. "SRS schema is SM-2", "authz disabled", "no async pipeline" — all since fixed). Where agents disagreed or evidence was indirect, items are tagged **(verify)**.

## System topology

```
                       Auth0 (RS256 JWKS)
                            │
   Browser SPA (lingo) ─────┼───────────────► lingo-core  (Lambda, Mangum/FastAPI, Function URL)
   S3 + CloudFront          │                   │  users, srs, decks, progress, stories,
   (static, OIDC deploy)    │                   │  quests, community, admin, moderation
                            │                   │
                            │                   ├─ DynamoDB (19 tables, on-demand, per-domain)
   admin dashboard ─────────┼───────────────► lingo-ops  (Lambda, FastAPI)  finance/jobs/events
                            │                   │  Stripe + AdSense + AWS Cost Explorer + MAU
                            │                   ▼
                            │            SQS `lingo-events` (standard) ──3 fails──► DLQ (14d)
                            │                   ▼
                            └──────────► lingo-async (Lambda, SQS-triggered)
                                          handlers: xp_awarded, lesson_completed,
                                          review_completed, friend_added, ad_watched,
                                          subscription_changed → quests + leaderboard
                                          (calls back into core via INTERNAL_SERVICE_TOKEN)

   lingo-infra: Terraform for all of the above (tables, Lambdas, SQS+DLQ, S3/CloudFront,
                Route53/ACM, IAM least-priv, GitHub OIDC CI roles, cost-allocation tags)
```

## Verdict

A **cost-disciplined, cleanly-separated serverless architecture** that is production-capable for early-access traffic. Strong fundamentals across the board: real event-driven pipeline with DLQ, FSRS-6 SRS mirrored client↔server, server-authoritative XP with idempotent batch ingest, enforced authorization with full audit logging, Terraform IaC with OIDC CI and per-domain cost tags. The remaining gaps are **operational maturity** (observability, tfstate, secrets rotation) and a **handful of real correctness bugs** (async idempotency, concept-rollup staleness) — not structural flaws.

## Per-domain status

| Domain | State | Headline |
|---|---|---|
| Course storage | ✅ Solid | Client-authored curriculum, conformance-tested, stable atom IDs |
| Progress | ✅ Good, 2 gaps | Idempotent batch + server-authoritative XP; concept recompute unwired; XP test-bonus drift |
| Card / SRS | ✅ Strong | FSRS-6 modal, client↔server schema mirrored, LWW by `lastReviewedAt`; grammar track client-only |
| Async | ✅ Real, 1 sharp bug | SQS pipeline + DLQ + partial-batch-failure; **callback side-effects not idempotent** |
| Moderation / authz | ✅ Enforced | Env allow-list + DB-role gate, bans, full audit log, safe impersonation; thin abuse-prevention |
| Infrastructure | ✅ Mature, ops gaps | Terraform/OIDC/cost-tags; local tfstate, no alarms/tracing, manual secrets |

## Critical findings (correctness)

### C1 — Async side-effects are not idempotent
SQS is at-least-once. The leaderboard updater uses an atomic DynamoDB `ADD` (safe on redelivery), **but** the quest `bump_progress` and the non-lesson `add_xp` callbacks (`lingo-async/app/http/lingo_core_client.py`) are plain deltas with no idempotency key. A duplicate SQS delivery (or a timeout-then-retry mid-callback) **silently double-counts quest progress and post-hoc XP grants**. The repo's own `CLAUDE.md` acknowledges this. _Fix: idempotency key (`{messageId}:{handler}`) deduped server-side in core; or make the callbacks set-absolute rather than increment._

### C2 — Concept-rollup recompute is never wired
`/progress/me` returns concept rollups with `staleAt` set but **never recomputes them** — `lingo-core/app/progress/router.py` comments confirm "the recompute path … never landed; reads return whatever the last full recompute wrote." Storage + protocol (`get_attempts_for_concepts`, `put_concept_rollup`) exist on both SQLite and Dynamo; only the caller is missing. **This directly degrades the Journey page and the Vocab mastery facets** (both shipped on the `journey-progress-page` branch) — they render stale tiers. _Fix: recompute stale rows inline on `/me` read (ADR-0001 estimates 50–150ms), or offload to the async worker._

### C3 — DynamoDB cut-over is incomplete **(verify)**
Agents disagreed here. The infra/SRS reviews report `social`, `tags`, `community` (5 tables), and `deck_votes` provisioned in Terraform but raising `NotImplementedError` in app code (SQLite-first / mock fallback) — which on prod Lambda means lost or degraded writes. The moderation review and the `lingo-core` git log (`57d7f01 Real DynamoCommunityRepository…`, `d825c00 Real Dynamo impls: quests, story, tag, deck-votes`) suggest these **are** now implemented. **Verify directly** which domains have live Dynamo repos vs. stubs before trusting prod persistence for community/social. If any remain stubbed, the fallback masks the gap (returns empty instead of 503).

## High-priority gaps

- **H1 — Terraform state is local** (`lingo-infra`, no S3 backend/lock). No locking → concurrent-apply corruption; no audit; bus-factor of one. Single highest-leverage infra fix. → S3 backend + Dynamo lock table.
- **H2 — No observability.** No CloudWatch alarms (notably **DLQ depth > 0**), no X-Ray/tracing, plain-text logs, and `/health` returns 200 even when repos are down. Silent failures, slow MTTR. → alarms (Lambda errors/duration, DLQ depth, Dynamo throttle), deep health check, structured logs + correlation IDs.
- **H3 — Async operability.** Callback path has no circuit-breaker/backoff (a core blip → SQS-level retry storms); `INTERNAL_SERVICE_TOKEN` is hand-synced across functions (drift = silent 401s); no DLQ replay tooling. → client retry/circuit-breaker, token startup self-check, `dlq-replay` script.
- **H4 — Abuse prevention thin.** No rate limiting anywhere (no slowapi/limiter); community is publish-then-moderate with **no reports endpoint and no markdown sanitization** (XSS risk depends on FE escaping); no user blocking/muting. → rate limits on auth/search/write + unauth endpoints, server-side markdown sanitize, reports + in-review queue.
- **H5 — XP test/recap drift.** `xpRules.ts` adds `XP_TEST_BONUS=10` for `-test`/`-recap` lessons; `lingo-core/app/progress/xp.py` does not. Server is authoritative so it's an optimistic-estimate flicker, not corruption — but it's exactly the "change both mirrors" footgun. → add the bonus server-side (with `lesson_id`) or drop it client-side.
- **H6 — Grammar Track B is client-only.** `open-lingo-srs-grammar:v1` has no backend sync; lost on cache clear / new device. Vocab Track A syncs fine. → backend sync (reuse SRS repo under a grammar namespace) or clearly label as device-local.

## Medium / notable

- **Client-only unlock map** (`lingo:unlocked-atoms`) + lesson-completion cache: no server backup of *which atoms are unlocked* (only SRS state + progress rollups sync). Cache clear / device switch loses unlock ladder state.
- **localStorage quota unguarded** — writes swallow `QuotaExceededError` silently (~10k cards ≈ 15–20 MB); sync goes sporadic with no user signal.
- **Clock-skew lost reviews** — LWW by `lastReviewedAt` handles same-day reviews correctly, but a device clock hours-behind loses its newer review. No skew detection.
- **Secrets manual** — Stripe/AdSense/Auth0 keys set via console env, no Secrets Manager, no rotation. JWKS cache now has TTL + rate-limited kid-miss refresh (good).
- **No staging env, no canary/blue-green** — direct prod Lambda code updates; rollback is manual CLI / re-run.
- **Course "manifest tracking"** advertised in the core README is **not implemented** (no CourseLibraryRepository); curriculum is bundle-compiled with no server-side versioning/drift detection. Fine for 1–2 languages; revisit before multi-language.
- **`courseAtoms.ts`** (~928 atoms, one file) is a merge-conflict magnet; consider splitting by module range.

## What's genuinely strong (keep)

- **Event-driven pipeline done right**: discriminated-union contracts, partial-batch-failure, DLQ with redrive, kombu-envelope unwrap (post-incident hardened), atomic leaderboard increments, commutative-by-design handlers.
- **SRS**: FSRS-6 with recognition/production modality split, client and server schemas mirrored, correct LWW via top-level ISO `lastReviewedAt` (with a documented date-string fallback), adaptive new-card intake, concurrent-tab write fix.
- **Progress**: idempotent batch by `clientAttemptId`, server-authoritative XP, single user-row write per batch, async XP double-credit explicitly guarded (`_PRODUCER_ALREADY_CREDITED`), hybrid eager/lazy rollups for cost.
- **Auth/moderation**: dual-gate authz (env allow-list + DB role) enforced on every admin route, full append-only audit log (bans, role changes, content status, impersonation), safe header-driven impersonation, `DEBUG` hard-banned on Lambda.
- **Infra**: Terraform with least-privilege IAM, per-repo GitHub OIDC CI roles (no long-lived keys), per-domain cost-allocation tags + a finance pipeline, Function URLs (no API-GW fees), ARM64 where it fits, shared aioboto3 session for cold-start.

## Recommended sequencing

1. **Correctness now:** C1 idempotency keys on async callbacks; C2 wire concept recompute (unblocks the Journey/Vocab mastery features); confirm C3 Dynamo cut-over status.
2. **Operability:** H1 remote tfstate; H2 alarms + deep health + DLQ-depth alarm; H3 callback circuit-breaker + token self-check.
3. **Safety:** H4 rate limiting + markdown sanitization + reports/in-review; H5 XP mirror; H6 grammar sync.
4. **Durability/hardening:** server-backup unlock state, quota guard, Secrets Manager + rotation, staging env + Lambda-alias rollback.

---

_Confidence: topology and the headline corrections (FSRS-6 schema, enforced authz, real async pipeline, quests implemented, Dynamo progress/story repos) were verified directly against `origin/main`. C1/C2 align with quoted in-repo code/comments. C3 has conflicting agent evidence — verify before acting. Line-level details in the per-domain agent findings should be spot-checked before implementing any specific fix._
