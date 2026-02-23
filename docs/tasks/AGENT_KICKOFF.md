# Agent Kickoff — Open Lingo

**Give this to an AI agent** along with the specific task context doc. The agent should read both before starting.

---

## 1. Project Setup

```bash
cd lingo
npm install
cp .env.example .env   # Auth0 required: VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID
npm run dev            # http://localhost:5173
```

**Backend (optional for some tasks):** `lingo-core` is a FastAPI backend. If the task needs API (decks, subscriptions, SRS sync), run it from `lingo-core/` with `uvicorn` or `fastapi dev`. See `lingo-core/README.md`.

**Build check:** `npm run build` must pass. Run before submitting.

---

## 2. Tech Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS** (dark mode: `dark:` variants)
- **react-i18next** — all user-visible strings via `t("key")`; add keys to `en.json` and `ko.json` in `src/shared/i18n/locales/`
- **Routes:** All learning content under `/:lang/` (e.g. `/ko/learn`, `/ko/practice/flashcards`). Use `useLangPath()` for links.

---

## 3. Tasks Ready to Build

Each has a dedicated agent context doc with full requirements.

| Task | Agent Context Doc | Summary |
|------|-------------------|---------|
| **Homepage UX** | [AGENT_CONTEXT_1_homepage-ux.md](./AGENT_CONTEXT_1_homepage-ux.md) | Logged-out experience, community deck pointers, streaks, XP placeholder |
| **SRS Viewer Redesign** | [AGENT_CONTEXT_2_srs-viewer-redesign.md](./AGENT_CONTEXT_2_srs-viewer-redesign.md) | New/Review/Again counts; fix fixed-card-count UX |
| **Card Markdown** | [AGENT_CONTEXT_3_card-markdown.md](./AGENT_CONTEXT_3_card-markdown.md) | Markdown for front/back/note/reasoning; editor hint; preview via CardPreview |
| **External Content** | [AGENT_CONTEXT_4_external-content.md](./AGENT_CONTEXT_4_external-content.md) | Community tab for external links; URL platform parsing; content type; level |

**To assign:** Give the agent this kickoff + the specific `AGENT_CONTEXT_*` file. Example: *"Read AGENT_KICKOFF.md and AGENT_CONTEXT_4_external-content.md, then implement the External Content feature."*

---

## 4. Conventions

- **i18n:** Use `t("key")` for all user-facing strings. Add keys to `en.json` and `ko.json`.
- **Styling:** Tailwind. Match existing patterns (e.g. `rounded-xl`, `border`, `dark:` variants).
- **Components:** Reuse from `shared/components/` and feature folders. Follow patterns in `StoriesPage`, `CommunityLayout`, `FlashcardTester`.
- **Data:** Mock data in `features/<name>/data/` or `mock*.ts`. No schema changes unless the task specifies.
- **Imports:** `@/` alias for `src/` (e.g. `@/shared/hooks/useLangPath`).

---

## 5. Key Paths

| Purpose | Path |
|---------|------|
| Home page | `src/features/home/HomePage.tsx` |
| Progress summary | `src/features/progress/ProgressSummary.tsx` |
| Flashcard tester | `src/features/flashcards/FlashcardTester.tsx` |
| Card preview | `src/features/flashcards/CardPreview.tsx` |
| Deck editor | `src/features/community/contribute/DeckEditor.tsx` |
| Locales | `src/shared/i18n/locales/en.json`, `ko.json` |
| Lang path hook | `src/shared/hooks/useLangPath.ts` |
| Auth | `src/shared/auth/useAuth.ts` |

---

## 6. Before Submitting

- [ ] `npm run build` passes
- [ ] All new strings use `t()`
- [ ] No breaking changes to existing routes/behavior unless the task requires it
