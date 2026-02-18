# Localization strategy

Where to put UI strings vs content, how courses fit in, and how to support multiple UI/content languages.

## 1. Locales (by UI language)

**Purpose:** Interface language — menus, buttons, page titles, empty states, section labels.

**Location:** `src/locales/{locale}.json` (e.g. `en.json`, `ko.json`). Keys are namespaced: `nav.*`, `practice.*`, `learn.*`, `stories.*`, etc.

**Rule:** All user-facing **app chrome** and **practice UI** strings that don’t come from course/content data should live here and use `t('key')` (or `t('key', { ... })` for interpolation). The active locale is the **UI language** (settings / i18n), not the learning language.

**Examples:**
- `practice.particlePractice` — nav label
- `practice.particles.title` — particle practice page title
- `practice.particles.sections.topic-subject` — section heading (localized by UI language)
- `learn.intro`, `stories.title` — learn/story UI

**Per language:** One set of locale files per **UI language** (en, ko, …). When the user switches UI language, these strings change. Learning language only controls *which* data (e.g. which particles, which alphabet) is shown.

## 2. Course-specific vs app-wide

- **App-wide:** Nav, settings, practice hub labels, empty states, generic section names (e.g. “Topic & subject”) → **locales** under `practice.*`, `nav.*`, `learn.*`, `stories.*`, etc.
- **Course-specific:** Lesson titles, course descriptions, story text, lesson instructions that belong to a specific course or module → keep in **course/content data** (or a dedicated namespace like `course.*` / `learn.courses.*` if we ever load course-specific locale bundles). Today, course content is in JSON or will come from an API; we don’t duplicate long copy in locale files.

So: **locales = app UI and short, reusable labels**. **Course content = course data or course-specific locale namespace** when we need translated lesson/story text per course.

## 3. Content (particles, alphabets, etc.)

**Current:** Meaning/usage and section names can live in **data** (e.g. `data/particles/ko.json`, `languageConfig.ts`) in one language (e.g. English). Section **labels** in the UI can be localized by using a **locale key** derived from section id (e.g. `practice.particles.sections.topic-subject`) so the same data works for any UI language.

**Optional — content localization:** If we want particle meanings/usage (or alphabet section names) to appear in the user’s UI language:
- **Option A:** In data, add a key for each locale, e.g. `meaning_en`, `meaning_ko`, or `translations: { en: "...", ko: "..." }`, and the app picks by current UI locale.
- **Option B:** Separate content files per “content language”, e.g. `particles/ko-en.json` vs `particles/ko-ko.json` (Korean particles explained in English vs in Korean), and choose file by UI language or a “content language” setting.

For now, **section headings** are localized via locales (section id → `practice.particles.sections.<id>`). **Particle meaning/usage** stay in data in a single language; we can add content-language support later using Option A or B.

## 4. Summary

| What | Where | Localized by |
|------|--------|--------------|
| App UI (nav, titles, buttons, empty states) | `src/locales/*.json` | UI language |
| Practice section labels (e.g. “Topic & subject”) | `src/locales/*.json` under `practice.particles.sections.*` | UI language |
| Course/lesson titles, story text | Course data or `course.*` / API | Content language or UI language (TBD) |
| Particle meaning/usage, alphabet descriptions | Data (particles JSON, languageConfig) | Single language today; optional per-locale later |

**Keep in locales:** Anything that’s part of the app shell or practice flow and should follow the user’s UI language. **Keep in data (or course bundles):** Long-form content and course-specific copy; add per-language support there when we need it.
