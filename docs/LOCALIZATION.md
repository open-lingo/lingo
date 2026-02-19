# Localization strategy

Where UI strings, course content, and practice data live, how they're localized, and the rules for community vs core content.

## 1. UI strings (locale files)

**Purpose:** Interface language — menus, buttons, page titles, empty states, section labels, practice type names.

**Location:** `src/shared/i18n/locales/{locale}.json` (e.g. `en.json`, `ko.json`). Keys are namespaced: `nav.*`, `practice.*`, `learn.*`, `stories.*`, etc.

**Rule:** All user-facing **app chrome** and **practice UI** strings use `t('key')` via react-i18next. The active locale is the **UI language** (from settings / i18n), independent of the learning language.

**Examples:**
- `practice.particlePractice` — nav label
- `practice.particles.sections.topic-subject` — section heading
- `learn.progressLabel`, `stories.title` — learn/story UI

One set of locale files per UI language. When the user switches UI language, these strings change. The learning language only controls *which* data (particles, alphabet, deck) is shown.

## 2. Core courses (official)

- Course **structure** (modules, lessons, ordering) is **language-agnostic** — the same skeleton works across all languages.
- Course **content** (lesson text, explanations, instructions) has **instruction-language variants** served via a version manifest (en, ko, ja, etc.). See CONTENT-DESIGN.md for manifest details.
- Lesson titles and course descriptions live in **course data** (API or static JSON), not in locale files.
- Progress is keyed by content ID (course/module/lesson), never by language.

## 3. Community content (addons, user-created courses)

- Community content is **language-specific**: each addon targets one learning language, chosen by the creator.
- **No cutover on language switch.** If a user adds a Korean community course and later switches their learning language to Japanese, that Korean course stays exactly as-is — in Korean. It is never migrated, translated, or deleted.
- When the user's active learning language differs from an addon's language, the addon may be hidden from the default view but remains in the user's library.
- Progress is keyed by content ID and persists regardless of language switches.

## 4. Practice content (particles, alphabets, kanji, components)

Practice content is core content and must be localized.

### Section headings and labels
Localized via locale keys derived from section IDs:
- `practice.particles.sections.<id>` (e.g. `practice.particles.sections.topic-subject`)
- `practice.alphabet.<id>` for alphabet section names

These live in `src/shared/i18n/locales/*.json` and follow the UI language.

### Particle meanings, usage notes, alphabet descriptions
These are explanatory content that should appear in the user's UI language. Two supported approaches:

- **Inline translations (preferred for small datasets):** Data includes a `translations` map per entry:
  ```json
  { "meaning": { "en": "Topic marker", "ko": "주제 표시" } }
  ```
  The app picks the value matching the current UI locale, falling back to `en`.

- **Per-locale data files (for larger datasets):** Separate files like `ko-en.json` (Korean particles explained in English) vs `ko-ko.json` (explained in Korean). The loader selects the file by UI locale.

Character romanization in `shared/domain/languageConfig.ts` is language-inherent (not localized) — romanization of ㄱ is always "g" regardless of UI language.

## 5. Summary

| What | Where | Localized by |
|------|-------|--------------|
| App UI (nav, titles, buttons, empty states) | `src/shared/i18n/locales/*.json` | UI language |
| Practice section labels | `src/shared/i18n/locales/*.json` under `practice.*` | UI language |
| Practice meanings/usage/descriptions | Data files with per-locale values or per-locale files | UI language |
| Core course lesson titles, instructions | Course data (API / static JSON) with instruction-language variants | Instruction language (manifest) |
| Community addon content | Addon data, language-specific | Fixed to addon's language (no cutover) |
| Character romanization | `shared/domain/languageConfig.ts` | Not localized (inherent to script) |

## 6. Rules for contributors

- All app chrome and practice flow strings: use `t()` — add keys to every locale file.
- Never hardcode English strings in components. If a string is user-visible, it belongs in a locale file or in localized data.
- Practice data that explains meaning/usage to the user must support at least `en`. Add other locales as translations become available.
- Community content creators choose one language. The app never auto-translates community content.
- Course content authors provide instruction-language variants via the manifest system.
