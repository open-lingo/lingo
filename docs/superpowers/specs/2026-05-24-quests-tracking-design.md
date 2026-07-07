# Quests & daily XP tracking — design notes (2026-05-24)

**Status:** Planning / frontend mock partial  
**Related:** [backend-progress-api.md](../../tasks/backend-progress-api.md), [dataformats/progress/README.md](../../dataformats/progress/README.md), [handoff-2026-05-24-home-sync-ux.md](../../archive/handoff-2026-05-24-home-sync-ux.md)

---

## Problem

Home `QuestsCard` and account XP need server-backed state. Today:

- Weekly “finish N lessons” reads **local** completion counts (`useLocalProgressSummary`).
- Most daily quests and friend-quest ticks are **mock**.
- XP bar mixes `useUserStats` (server) with local `xpTotal` fallbacks.

We need a quest system that does not slow or break lesson batch sync.

---

## What not to do

**Avoid:** On every `POST /progress/lessons/batch`, load all quest definitions and scan full user history synchronously.

**Risks:**

- Latency and timeout on batch accept (retries duplicate work)
- Quest bugs block or corrupt lesson progress
- Hard to scale friend quests / league hooks

---

## Recommended model

### 1. Progress events (idempotent)

When a lesson batch is **accepted**, emit a small event (internal or queued):

```json
{
  "eventId": "<attemptId or uuid>",
  "userId": "...",
  "type": "lesson_completed",
  "at": "ISO-8601",
  "lessonId": "...",
  "xp": 15,
  "durationSec": 120
}
```

Same pattern later for `flashcard_session_completed`, `alphabet_practice_completed`, etc.

**Idempotency:** `eventId` / `attemptId` prevents double-count on client retry.

### 2. Quest state store

Per user, per quest period (e.g. `daily:2026-05-24`, `weekly:2026-W21`):

| Field | Example |
|--------|---------|
| `questId` | `daily_lesson` |
| `done` | 1 |
| `goal` | 1 |
| `completedAt` | optional |
| `xpAwarded` | 15 |

Definitions live in config (Dynamo item, JSON, or code table) — not recomputed from scratch each request.

### 3. Evaluation phases

| Phase | When | How |
|--------|------|-----|
| **MVP inline** | Same request as batch accept (or immediately after DB write) | Increment counters for **active** daily/weekly quests only (O(1) per event) |
| **Async worker** | SQS → Lambda / worker | Friend quests, notifications, league promotion, heavy anti-cheat |
| **Read path** | `GET /progress/me` or `GET /quests/active` | Return snapshot; UI does not scan history |

### 4. Daily XP / “XP for the day”

Maintain `user_daily_stats[userId][YYYY-MM-DD]`:

- `xpEarned`
- `lessonsCompleted`
- `practiceMinutes` (optional; until then estimate from lesson count)

Home account card and sparkline can read last 7 days from this table instead of recomputing from attempts.

---

## API sketch (future)

```
GET  /api/core/v1/quests/active     → { daily: QuestProgress[], weekly: QuestProgress[], friendQuest?: ... }
POST /api/core/v1/progress/lessons/batch  → existing; side effect: enqueue quest evaluation
GET  /api/core/v1/progress/me       → extend with dailyXp, weekMinutes[], quests snapshot (optional)
```

Frontend:

- Replace `mockHomeData` quest arrays with `useQuests()` (TanStack Query), same pattern as `useSocial()`.
- Keep optimistic UI optional; show server snapshot after sync.

---

## SQS — when it’s worth it

**Not required for MVP** if rules are “+1 lesson toward daily goal” and “+1 toward weekly lesson count.”

**Add queue when:**

- Friend/co-op quests need cross-user checks
- XP/lingot grants trigger emails or leaderboard recompute
- Evaluation exceeds ~50ms p95 on the hot path

Start with **async invoke interface** (even `asyncio.create_task` in dev) so swapping SQS is mechanical.

---

## UI contract

- Don’t imply instant friend-quest completion until worker runs (or keep friend quests inline if trivial).
- Quest progress on home should match `GET /quests/active` after sync, not only localStorage.
- Daily “complete a lesson” can stay client-hint until API ships; weekly lesson count already demonstrates the pattern.

---

## Frontend stub

`src/shared/api/social.ts` — pattern for future `social.ts` / `quests.ts` clients.  
`useSocial()` — reference implementation for centralizing mock → API migration.
