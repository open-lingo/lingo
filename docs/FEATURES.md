# Feature ideas & backlog

Ideas and future work. **Epic list:** [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md). **Launch scope:** [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md). **Implemented today:** [PROJECT_STATE.md](./PROJECT_STATE.md).

---

## Shipped or wired (don’t re-build)

- SRS / flashcard review, deck manager, study options, API sync
- Learn + lessons (multi-step)
- Community deck explore + subscribe (contribute/forum/leaderboard **flagged off**)
- Landing, Auth0, legal pages, cookie consent, account delete
- Ad UI framework + funding meter (manual/estimated % via API)
- Practice hub index, particles, alphabet flows

---

## Learning & content (post-launch priority)

- **Anki import** — `.apkg` → community deck; optional SRS migration when export includes scheduling; server-side default for large decks. Later: export to Anki for mobile review. See [dataformats/flashcards/anki-import.md](dataformats/flashcards/anki-import.md), task [anki-import.md](archive/anki-import.md).
- **Content expansion** — 30+ cards, particles, sentences per language ([korean-content](tasks/korean-content.md), [japanese-content](archive/japanese-content.md))
- **Stories** — real text + exercises ([story-content](tasks/story-content.md))
- **Vocab lists** — themed browser ([vocab-page](tasks/vocab-page.md))
- **Grammar** — topic browser / drills ([grammar-page](tasks/grammar-page.md))
- **Videos** — unlock by course; community addons ([practice-hub](archive/practice-hub.md))
- **Grammar heatmap** — coverage visualization (idea only)

---

## Progress & sync

- **Progress API (content)** — lessons, courses, stories (plan in [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md); SRS separate and working)
- **Rewards / XP / streaks** — after content progress; then leaderboard
- **Settings on server** — cross-device theme/language ([backend-user-api](tasks/backend-user-api.md))
- **401 refresh / sessions** ([auth-session-strategy](tasks/auth-session-strategy.md))
- **Offline / sync layer** ([local-cache-server-state-research](tasks/local-cache-server-state-research.md))

---

## Social & community

- **Leaderboard** — real API; enable flag when ready
- **Forum / contribute** — moderation + flags on ([COMMUNITY_PLANNING.md](./COMMUNITY_PLANNING.md))
- **External content** — curated links ([community-resources](tasks/community-resources.md))

---

## Admin, moderation & safety

- **Admin console v2** — feature flags UI, users, finance knobs, deck/content stats
- **Staging decks / approvals** — draft → pending review → published
- **User management** — roles, search, suspend/ban
- **Blocking & reports** — user/content blocks, moderator queue

## Product & sustainability

- **MVP: ad-free, no billing** — ads (AdSense) are deferred to post-MVP; the trial runs at a loss by design
- **Funding meter (live)** — AdSense Management API; Stripe **post-MVP** ([ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md))
- **Ad placements** — [ADS_PLACEMENT.md](./ADS_PLACEMENT.md)
- **TTS** — [TTS_PLANNING.md](./TTS_PLANNING.md)

## Brand & launch polish

- **Home / landing polish**
- **Product name** — final branding decision
- **CI/CD** — full pipelines (staging + prod)

---

## UX & polish

- **SRS viewer redesign** — partial ([srs-viewer-redesign](tasks/srs-viewer-redesign.md))
- **Card markdown editor** ([card-markdown-editor](tasks/card-markdown-editor.md))
- **ja.json** UI locale
- **Community language warning** on switch ([CONTENT-DESIGN.md](./CONTENT-DESIGN.md))
- **Performance budgets** ([performance-budgeting](tasks/performance-budgeting.md))
- **Schema versioning** ([schema-versioning-migration](tasks/schema-versioning-migration.md))
