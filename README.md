# Open Lingo — Frontend

React SPA for the Open Lingo language learning platform.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.6 |
| Build tool | Vite 6 |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| Auth | Auth0 (`@auth0/auth0-react`) |
| Styling | Tailwind CSS 3 (dark mode via `class`) |
| i18n | i18next 25 + react-i18next |

## Setup

```bash
npm install
cp .env.example .env   # fill in Auth0 values (see below)
npm run dev            # http://localhost:5173
```

### Environment variables

```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_AUDIENCE=...            # optional
VITE_API_BASE_URL=http://localhost:8000   # default
```

The app will not start without `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server on port 5173 (strict) |
| `npm run build` | TypeScript compile + Vite production build → `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
├── main.tsx              # App bootstrap — Auth0, QueryClient, all context providers
├── App.tsx               # Route tree (createBrowserRouter)
├── routes/
│   ├── Layout.tsx        # Root shell: nav, theme, modals, toasts
│   └── LangLayout.tsx    # /:lang wrapper — injects language context
├── features/             # Vertical feature slices
│   ├── auth/             # LoginPage, LogoutPage
│   ├── home/             # HomePage, language picker
│   ├── learn/            # LearnPage, course map
│   ├── lesson/           # LessonPage + 8 step types (translate, fill-blank, multiple-choice, etc.)
│   ├── flashcards/       # Flashcard hub, SM-2 SRS engine, FlashcardTester,
│   │                     #   CardManager, DeckManager, sync engine
│   ├── practice/         # Particles, alphabet, kanji, components, videos
│   ├── stories/          # Story browser + reader
│   ├── vocab/            # Vocab browser
│   ├── grammar/          # Grammar reference
│   ├── community/        # Content browser, forum, contribute/deck editor, admin
│   ├── studio/           # Creator studio (deck editor)
│   ├── leaderboard/      # Leaderboard
│   ├── progress/         # Progress summary widget
│   └── settings/         # Settings page, profile editor
└── shared/
    ├── api/              # ApiClient + typed UsersApi, SrsApi, DecksApi
    ├── auth/             # Auth0 config, useAuth hook
    ├── components/       # Shared UI: DataTable, FilterBar, modals, progress bars, icons
    ├── contexts/         # ThemeContext, LanguageContext, ModalContext, ToastContext
    ├── domain/           # Language config, supported languages
    ├── hooks/            # useLangPath, usePathParams
    ├── i18n/             # i18n config + en.json / ko.json locale files
    └── storage/          # localStorage helpers
```

## Routes

All language-scoped routes sit under `/:lang` (e.g. `/ko`, `/ja`):

| Path | Page |
|---|---|
| `/` | Home |
| `/login` | Login |
| `/:lang/learn` | Learn / course map |
| `/:lang/learn/lessons/:lessonId` | Lesson |
| `/:lang/practice/flashcards` | Flashcard hub |
| `/:lang/practice/flashcards/review` | SRS review session |
| `/:lang/practice/flashcards/cards` | Card Manager |
| `/:lang/practice/flashcards/decks` | Deck Manager |
| `/:lang/practice/stories` | Stories browser |
| `/:lang/practice/stories/:storyId` | Story reader |
| `/:lang/practice/particles` | Particle practice |
| `/:lang/practice/alphabet/:alphabetId?` | Alphabet / Hangul practice |
| `/:lang/practice/kanji` | Kanji practice |
| `/:lang/practice/components` | Component breakdown practice |
| `/:lang/practice/videos` | Video player with transcript |
| `/:lang/vocab` | Vocab browser |
| `/:lang/grammar` | Grammar reference |
| `/:lang/community/explore` | Community content browser |
| `/:lang/community/contribute` | Contribute — my content |
| `/:lang/community/contribute/create` | Create deck |
| `/:lang/community/contribute/admin` | Admin — deck approval |
| `/:lang/community/discuss` | Forum |
| `/:lang/community/leaderboard` | Leaderboard |
| `/:lang/studio/decks/new` | Creator studio — new deck |
| `/:lang/studio/decks/:deckId` | Creator studio — edit deck |

## Authentication

Auth0 RS256 JWT. `main.tsx` wraps everything in `<Auth0Provider>`. `ApiProvider` calls `getAccessTokenSilently()` and passes the Bearer token to every API request.

## API integration

`ApiClient` (`src/shared/api/client.ts`) is a typed base class that attaches the Auth0 Bearer token to every request. Three domain clients sit on top:

- **`UsersApi`** — user profile, settings, subscriptions
- **`SrsApi`** — SRS state, due cards, sync, delete
- **`DecksApi`** — deck CRUD, batch-fetch, admin approval

All clients are available via `useApi()` from `ApiProvider`. Data fetching uses TanStack Query throughout.

## Flashcard SRS

The SM-2 algorithm lives in `src/features/flashcards/engine/`. Key modules:

| Module | Responsibility |
|---|---|
| `srs.ts` | SM-2 algorithm, `reviewCard`, `createInitialState` |
| `srsStorage.ts` | localStorage read/write (`SRSStore`) |
| `reviewQueue.ts` | Build session queue (due reviews + new cards/day cap) |
| `srsSync.ts` | Dirty-card detection, delta sync, server-state merge |

State is **local-first** (localStorage). Sync is triggered manually or at the end of a review session.

## i18n

- Locales: **English** (`en.json`) and **Korean** (`ko.json`)
- Detection order: `localStorage` → browser, cached under `i18nextLng`
- The **UI locale** (interface language) is independent of the **learning language** (content language)

## Supported learning languages

Korean (`ko`) and Japanese (`ja`) have full content. Spanish, German, French, Chinese, and English configs exist at stub level.
