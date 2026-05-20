# Community Contribution & Review Plan

Status: draft · Owner: TBD · Last updated: 2026-05-19

The community area today is half-built: authors can create decks and the explore
page can list `published` ones, but there is no review loop between the two —
the editor's "Submit" simply flips `status` to `published` with no moderator in
the middle. This doc lays out the canonical contribution flow, the schema and
endpoint changes needed to get there, and a phased shipping order.

The mock contributor/tag panels in `CommunityRightRail.tsx` are intentionally
parked behind real backend aggregation; see §6.

---

## 1. Current state (audit)

### Backend (`lingo-core`)

- **Deck CRUD** (`app/decks/router.py`): `POST /api/core/v1/decks`,
  `GET /api/core/v1/decks` (lists *my* decks), `GET /decks/{id}`,
  `PATCH /decks/{id}` (author-gated), `DELETE /decks/{id}`, plus
  `POST /decks/{id}/cards`. `GET /api/core/v1/decks/admin` lists all decks
  for moderation; `PATCH /api/core/v1/decks/admin/{id}/status` flips between
  `draft` and `published`.
- **Deck status enum** (`app/decks/schemas.py`):
  `DeckCreate.status: str = Field(default="draft", description="draft | published")`.
  Today there are only **two** server-side states.
- **Moderation stubs** (`app/moderation/schemas.py`): `ReportCreate`,
  `ReportResponse`, `EnforcementAction`, `ModerationActionLog` — Pydantic shells,
  no router, no storage.
- **Community router** (`app/community/router.py`): forum threads + votes
  backed by `MockCommunityRepository`. Not wired to decks.
- **Role check** (`app/auth/roles.py`):
  ```python
  def has_admin_access(role: str | None) -> bool:
      # TODO: Enable once OAuth scopes are set up. For now everyone is admin.
      return True
  ```
  **P0 launch blocker.** Every signed-in user is an admin. The admin deck list
  and approve/reject endpoint are world-readable / world-writable.

### Frontend (`lingo`)

- Editor's "Submit" (`features/community/contribute/DeckEditor.tsx`) sets
  `status: "published"` directly and navigates back — no pending review state.
- My Decks status pills include `submitted`, `review`, `changes_requested`,
  `rejected` (see `StudioHeader.STATUS_STYLES`) but the backend can't produce
  any of these — only `draft` / `published`. The UI is rendering ghosts.
- Explore (`ContentBrowserPage`) calls `listAdminDecks({ status: "published" })`
  — there is no "Pending review" admin queue page yet.
- Top contributors and trending tags in `CommunityRightRail.tsx` are **mock
  literals** by design — there's no aggregation endpoint and decks have no tags.

---

## 2. The contributor's journey

Target end-to-end happy path:

1. User clicks **+ New Deck** in the community header.
2. Wizard creates a `draft` deck → editor opens.
3. User adds cards, edits front/back, hits **Save draft** repeatedly.
4. When ready, user clicks **Submit for review** in the editor header.
   - Confirms in a modal: "Your deck will be reviewed by a moderator. You won't
     be able to edit it until the review completes."
   - Deck transitions `draft → pending_review`. `submitted_at` is stamped.
5. Author sees their deck in **My Decks** with a "Pending review" pill,
   read-only (no edit button — just preview + withdraw).
6. Moderator opens `/admin/decks?status=pending_review`, sees the new entry.
7. Moderator reviews cards inline, clicks **Approve** → status becomes
   `approved`, deck appears on Explore. Or clicks **Reject** → opens a reason
   modal; on submit, status becomes `rejected` with `rejected_reason`.
8. Rejected author sees a banner inside the editor: "Rejected — Reason: {…}".
   They can edit and re-submit (transitions `rejected → pending_review` again).

Edge cases worth calling out:

- **Withdraw**: author can pull a deck out of `pending_review` back to `draft`
  before a moderator picks it up.
- **Author edits an approved deck**: see §8 — currently undecided.
- **Per-user cap**: `MAX_DECKS_PER_USER = 10` non-approved decks (draft +
  pending) — rejected decks don't count (recommendation; see §8).

---

## 3. Schema changes

### Deck status enum (canonical)

Collapse the frontend ghost states down to four real ones:

| Backend state     | Frontend label    | Meaning                                       |
| ----------------- | ----------------- | --------------------------------------------- |
| `draft`           | Draft             | Author working on it. Not visible to public.  |
| `pending_review`  | Pending review    | Awaiting moderator. Read-only for author.     |
| `approved`        | Approved          | Public on Explore. Author can edit cosmetic.  |
| `rejected`        | Rejected          | Moderator declined. Author can edit + resubmit. |

`StudioHeader.STATUS_STYLES` should drop `submitted`, `review`,
`changes_requested` — fold them into `pending_review`. Rename `published` →
`approved` for terminology consistency (the term "published" leaked from the
file-format era; everywhere internal already says "approved" or "live").

### New deck fields

Add to `DeckResponse` and the storage manifest:

```python
status: Literal["draft", "pending_review", "approved", "rejected"] = "draft"
submitted_at: str | None = None       # ISO datetime when author hit submit
reviewed_at: str | None = None        # ISO datetime when moderator decided
reviewed_by: str | None = None        # User id of moderator
rejected_reason: str | None = None    # Set only when status == "rejected"
```

### Per-user cap

Add `MAX_DECKS_PER_USER = 10` constant (decks with status in
`{draft, pending_review}`). Enforce in `POST /decks` and `POST /decks/{id}/submit`.

### Migration

The Dynamo/SQLite manifests carry status as a free-form string. Migration is a
one-shot rename pass: any deck where `status == "published"` becomes
`approved`. No other state exists in prod yet, so this is cheap.

---

## 4. New endpoints

All under `/api/core/v1`. All admin endpoints require `Depends(require_admin)`,
which today returns true for everyone — that gate must be tightened first.

| Method | Path                                | Purpose                                                |
| ------ | ----------------------------------- | ------------------------------------------------------ |
| POST   | `/decks/{id}/submit`                | Author transitions `draft → pending_review`            |
| POST   | `/decks/{id}/withdraw`              | Author transitions `pending_review → draft`            |
| POST   | `/admin/decks/{id}/approve`        | Moderator transitions `pending_review → approved`      |
| POST   | `/admin/decks/{id}/reject`         | Body `{ reason: str }`. Transitions to `rejected`      |
| GET    | `/admin/decks?status=pending_review` | Moderation queue (already half-exists, scope filter)   |

Replace existing `PATCH /api/core/v1/decks/admin/{id}/status` with the explicit
verbs above — the patch is too permissive (any string in any direction).

Voting endpoints (`POST /decks/{id}/vote`) already in `PRODUCT_BACKLOG.md`;
keep them deferred to phase 3.

---

## 5. New UI surfaces

### Editor (DeckEditor)

- Replace today's "Submit" button with **Submit for review** (only enabled when
  status is `draft` or `rejected` and there's ≥ 1 valid card).
- Add a **Withdraw** button when status is `pending_review`.
- Read-only banner when status is `pending_review`: "Awaiting review — you'll
  be notified when a moderator responds."
- Rejected banner: "Rejected — Reason: {rejected_reason}. Edit your deck and
  re-submit."
- Save Draft remains for `draft` and `rejected` only.

### My Decks (`MyDecksPage`)

- Status pills already render in the dense list — wire them to the new enum
  (collapse stale states first).
- Filter chips at top: All · Drafts · Pending · Approved · Rejected.

### Admin moderation queue

- New tab/route under `/admin/decks` filtered to `status=pending_review`,
  reusing the existing admin deck table.
- Row actions: Preview · Approve · Reject (opens reason modal).
- Reject modal: textarea (required, min 10 chars), submit button, cancel.

### Submit confirmation modal

Small primitive on top of the future shared `<Modal>` (see
`/home/lichfiet/repositories/personal/open-lingo/lingo/CLAUDE.md` §"Missing
shared primitives"). Body: "Your deck will be reviewed by a moderator. You
won't be able to edit it until they respond. Continue?"

---

## 6. Real top contributors + trending tags

Both surfaces in `CommunityRightRail.tsx` are mock. Plan:

### Top contributors

- **Endpoint**: `GET /api/core/v1/community/contributors/top?limit=10`
- **Source**: aggregate over decks where `status=approved`, group by
  `authorId`, rank by `(approved_deck_count desc, total_subscribers desc,
  most_recent_approval desc)`.
- **Cadence**: nightly EventBridge → Lambda → write to a
  `community_top_contributors` cache item (single row). Frontend reads the
  cache. Avoids hot-pathing the aggregation on every right-rail render.
- **Defer until** there's enough approved authored content for the list to be
  non-empty (probably post-phase-1).

### Trending tags

- Decks have no tags today. Two paths:
  - **(a) Tagged decks (recommended)**: add `tags: list[str]` to
    `DeckCreate`/`DeckResponse`, require ≥ 1 and ≤ 5 tags on submit, taxonomy
    is free-form for v1 but moderator can normalize on approval. Aggregate:
    `tag → count_over_approved_decks_last_30d`.
  - **(b) Client-derived**: NLP-light on name + description. Cheap but noisy,
    and lacks any author intent. Reject.
- **Defer until** phase 1's submit flow lands. Adding tags is a UX change to
  the wizard and editor.

Until both backends exist, leave the right rail mock data in place behind a
short comment — UX consistency matters more than literal accuracy for a
marketplace browse experience.

---

## 7. Phased ship order

### Phase 1 — Author submit / review loop (P0 with admin RBAC fix)

Unlocks: anyone-can-publish risk is eliminated.

1. Tighten `has_admin_access()` to actually check `ADMIN_ROLES`. Backfill a
   real moderator role on a seed admin user.
2. Migrate `status` enum: `published → approved`. Add `submitted_at`,
   `reviewed_at`, `reviewed_by`, `rejected_reason`.
3. Implement 4 endpoints (`submit`, `withdraw`, admin approve, admin reject).
4. Editor wires up Submit-for-review, Withdraw, rejected banner.
5. Admin moderation queue tab + reject reason modal.
6. Drop ghost statuses from frontend (`submitted`, `review`,
   `changes_requested`). Add the canonical 4.

### Phase 2 — Real contributor / tag surfaces

Unlocks: the right rail stops being marketing fiction.

1. Add `tags: list[str]` to deck schema; wizard adds chip-input field.
2. Nightly aggregation job for top contributors + trending tags.
3. Replace mocks in `CommunityRightRail.tsx`.

### Phase 3 — Voting

Unlocks: trending sort actually means something.

1. `POST /decks/{id}/vote` (up/down toggle, idempotent per user).
2. Score field on `DeckResponse`. Trending sort uses
   `wilson_score(upvotes, downvotes)` not raw upvotes.
3. Author dashboard surfaces score & per-day delta.

### Phase 4 — Lingot rewards for contribution

Ties into the cosmetics economy from `PRODUCT_BACKLOG.md`.

- Reward: +N lingots on first approval, +M on every 100 net upvotes.
- Badge: visible chip on author profile + right-rail contributor row.

---

## 8. Open questions

- **Cosmetic-only edits to approved decks**: do they require re-review, or
  auto-publish if the same author owns it? Risk: an approved deck could be
  swapped to spam post-approval. Suggested: any edit that touches `cards` puts
  the deck back to `pending_review`; metadata-only edits (name, description,
  image) auto-publish.
- **Do rejected decks count toward the 10-deck cap?** Recommendation: no —
  only `draft` + `pending_review`. Rejected is a terminal state the author
  has to consciously clean up or resubmit.
- **Contributor visibility before approval**: should a deck author's other
  approved decks be visible on a profile page when one of their decks hits the
  moderation queue? Recommendation: yes — moderators benefit from author
  context.
- **Badges/chips for contributors**: bronze (1 approved), silver (5), gold
  (10)? Tie this to phase 4.
- **Withdraw vs delete during pending_review**: should withdrawing send a
  notification to any moderator already viewing the deck? Out of scope until
  multi-mod-presence becomes a thing.
