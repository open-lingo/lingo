# Settings persistence + scrub — worktree report

Branch: `ui/settings-persistence`

## Goal

Make all real user settings persist to the backend (cross-device), and scrub
every setting so each toggle/select/slider is real, coherent, and labeled
truthfully.

## Settings health verdict

**Healthy.** Every setting now either (a) persists to the account AND drives
real runtime behavior, or (b) was removed because it was dead. One known gap is
flagged honestly: the daily reminder persists but there is no server-side
delivery job yet (a backend/cron concern, not a frontend bug).

## Persistence layer changes (`src/shared/contexts/SettingsContext.tsx`)

The backend already stores an opaque settings blob (`extra: allow`) and
deep-merges nested objects (`lingo-core` `users/schemas.py` +
`db/sqlite/user.py::update_settings`). **No backend change was needed** — the
fix was entirely frontend: it was only sending `theme` + `uiLocale` (+ a thin
`learning` slice + raw `notifications`/`flashcards`).

- `toBackendPatch()` rewritten to send the **full** object for every real
  namespace: `appearance` (incl. `navLayout`), `accessibility`, `audio`,
  `notifications`, `learning`, `display`, `flashcards`. Legacy flat keys
  (`theme`, `learningLanguage`, `uiLocale`) are still mirrored for older
  consumers.
- `fromBackendResponse()` rewritten to hydrate **every** namespace, each
  layered over its `DEFAULT_SETTINGS` so a partial blob never drops sibling
  fields. Nested keys win; flat keys are the fallback. Removed the brittle
  `delete reducedMotion` / re-read dance and the appearance path that silently
  dropped `navLayout`.
- Both functions exported so they can be unit-tested directly.
- localStorage stays the instant-apply cache + offline fallback; server wins for
  signed-in users (unchanged behavior, now with the full object).

New test: `src/shared/contexts/settingsPersistence.test.ts` — proves
`navLayout` + accessibility/audio/notifications/learning round-trip through
`toBackendPatch` -> server echo -> `fromBackendResponse`, plus legacy flat-only
hydration and the default-theme fallback (6 cases).

## Per-setting audit

| Setting | Persists to backend? | Wired to real behavior? | Action |
|---|---|---|---|
| `learning.uiLocale` | Yes (now full + flat) | Yes — i18n `changeLanguage` | kept |
| `learning.learningLanguageId` | Yes | Yes — LanguageContext (set via header) | kept |
| `learning.onboardingCompleted` | Yes | Yes — gates first-launch picker | kept |
| `learning.showAlphabetRomanization` | Yes (now) | Yes — `CharacterCard` | kept |
| `learning.showRomaji` | Yes (now) | Yes — AnnotatedText / lesson steps | kept |
| `learning.showAlphabetFurigana` | was partial | **No consumer anywhere** | **removed** (type, defaults, UI toggle, en/es i18n) |
| `appearance.themeId` | Yes | Yes — ThemeContext | kept |
| `appearance.navLayout` | **No → now Yes** | Yes — `routes/Layout.tsx` | **persistence added** |
| `accessibility.reducedMotion` | **No → now Yes** | Yes — root `data-reduced-motion` | **persistence added** |
| `accessibility.dyslexiaFont` | **No → now Yes** | Yes — ThemeContext font swap | **persistence added** |
| `accessibility.fontSize` | **No → now Yes** | Yes — ThemeContext root font-size | **persistence added** |
| `audio.volume` | **No → now Yes** | Yes — `shared/audio/volume.ts` | **persistence added** |
| `audio.silentMode` | **No → now Yes** | Yes — TTS auto-play gate | **persistence added** |
| `audio.soundEnabled` | was sent raw | **No UI, no consumer** | **removed** (type, defaults) |
| `notifications.reminderEnabled` | Yes | No FE consumer; **no server delivery job** | kept persisting; flagged |
| `notifications.dailyReminderTime` | Yes | same as above | kept persisting; flagged |
| `display.dateLocale` / `timezoneOverride` | Yes (when set) | No UI yet | left as-is (future) |
| `flashcards.studyOptions` | Yes | Yes — flashcards editor | kept |

## Dead settings removed

- **`audio.soundEnabled`** — only appeared in the type, defaults, and README. No
  UI control, no runtime reader. Removed from `types.ts`.
- **`learning.showAlphabetFurigana`** — had a JA-panel toggle and persisted, but
  nothing read it (the alphabet trainer reads `showAlphabetRomanization`; the
  reading aid is `showRomaji`; `ReadingPracticePage` uses its own local furigana
  mode). The toggle promised behavior the app never delivered. Removed the
  toggle from `SettingsSectionPanel.tsx`, the field from `types.ts`, and the
  orphan `settings.showAlphabetFurigana` strings from `en.json` / `es.json`.

## Notifications caveat (not removed)

The daily reminder toggle + time picker persist correctly (and round-trip
cross-device), but no service (`lingo-core`, `lingo-async`, `lingo-infra`)
consumes them to actually send a reminder. Left in place as a stored intent —
this is a backend delivery gap, not a frontend dead toggle. Labeled accurately
in the README.

## Visual polish

The surface was just rebuilt on `SectionHeader` / `SettingsGroup` /
`SettingRow`. Verified General / Appearance / Accessibility / Japanese panels
via screenshots — hierarchy is intact and the persistence/scrub changes didn't
break it. Removing the dead furigana row tightens the JA panel to its two real
toggles. No layout changes were needed.

## Verification

- `npx tsc --noEmit` — clean
- `npm run build` — clean (pre-existing chunk-size warning only)
- `npx vitest run` — 114 files / 1034 tests pass (incl. the new persistence test)
- Backend untouched (no `lingo-core` change required — blob already accepts everything)
