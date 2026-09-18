# Per-course lesson content out of the binary — phase 2 (2026-09-18)

Lane PACKS2. Companion: `docs/dictionary-lazy-load-2026-09-18.md` (phase 1 — same
Cache Storage store shape, same hash-verified-loader shape, same build-time-flag
shape, reused deliberately); `docs/project-review-2026-09-17-decisions-and-proposals.md`
§2 item 1 (lesson JSON is 13 MB uncompressed, `[content-as-JSON]` schema, not curriculum
code, so a schema gate is enough — no curriculum re-authoring risk). Flag
`content.packs` in `src/pub/feature-flags.json`, default **OFF** for build 32.

## Layout

- **Pack = one course.** `content:emit` (unchanged) still writes every module of
  every course to `src/pub/content/v1/`, which `vite build` still copies whole
  into `dist/content/v1/`. A NEW post-build script,
  `scripts/build/emit-content-packs.mjs`, runs after `vite build` and, only when
  `content.packs` is true (read via `readContentPacksFlag.mjs`, the exact
  `readDictLazyFlag.mjs` pattern), does two things per language: copies every
  module's JSON at 0-based index ≥ `BUNDLED_MODULE_COUNT` (3) into
  `<packOutputDir>/<contentVersion>/<lang>/` alongside a small pack manifest
  (`schemaVersion`, `contentVersion`, module list, per-file sha256+bytes), then
  **prunes those same files back out of `dist/content/v1/<lang>/`** — that
  prune is where the install-size reclaim happens. `contentVersion` is
  `manifest.version`, the SAME hash `content:emit` already computes across
  every module — the pack prefix is immutable and tied 1:1 to the exact
  build that wrote it. `dist/content/v1/manifest.json` gains one field per
  language, `packBundledThrough`, so the runtime loader knows which modules
  are guaranteed local without an extra round trip. `index.*.json`
  (course-map summaries), `_extra.*.json`, and `mined.*.json` are never
  touched — always bundled, every language, flag on or off.
- **Bundled slice**: modules 1–3 of EVERY course, plus placement/test-out
  data. Placement (banded) items are `ES_PLACEMENT_BANK`/`FR_PLACEMENT_BANK` —
  committed generated JSON compiled into the JS bundle, never routed through
  the content loader at all, so they're unaffected by packs either way. The
  course-map's per-module index/vocab summaries stay bundled for every
  module (not just 1–3), so the map always renders a complete course outline
  even before any pack lands.
- **`packOutputDir` differs by platform — this is the part that actually
  matters.** `capacitor.config.ts` sets `webDir: "dist"`, so `npx cap sync`
  copies the WHOLE `dist/` tree into the native project. On web
  (`emit-content-packs.mjs` with no flag), the pack tree is written INSIDE
  `dist/content/v2/...` because `deploy.yml`'s `aws s3 sync` of the whole
  `dist/` tree is what publishes it — no separate step. On native
  (`--native`, wired into `npm run build:native`), the pack tree is written
  OUTSIDE `dist/` entirely, at a sibling `dist-content-packs/` — writing it
  under `dist/content/v2` on a native build would have shipped every pruned
  byte straight back into the IPA/APK via `cap sync`, silently erasing the
  whole point of this lane. Caught by building both ways locally (see
  Numbers) rather than by inspection — worth flagging since it's the one
  place this design would have quietly failed its own goal.
- **Loader seam** (`src/features/lesson/data/contentLoader.ts`,
  `ensureModuleLoaded`/`ensureCourseLoaded`): (a) memory — `loadedFiles`
  memoization, unchanged; (b) bundled slice — the existing same-origin
  `fetch` against `dist/content/v1`, unchanged, succeeds for every module
  when the flag is off; (c)/(d) persistent cache then CDN network — reached
  ONLY when (b) fails (404, or the CDN's HTML-shell-with-200 pattern the
  existing `fetchJson` guard already catches) **and** the module's index is
  ≥ `entry.packBundledThrough`. A bundled-slice module (index < 3) is NEVER
  retried against a pack even if its local fetch somehow fails — there is
  structurally nothing at that pack URL (`emit-content-packs.mjs` never
  writes modules 1–3 under any `/content/v2/` prefix) — which is what makes
  "a pack can never override a bundled module" true by construction, not by
  a runtime version check.
- **New modules**: `contentPackCache.ts` (Cache Storage store,
  `openlingo-content-packs-v1` — same MECHANISM as `dictCache.ts`, a
  separate named cache rather than the literal same one: a dict blob and a
  lesson pack are different resource families with independent version
  lifetimes, and the dict cache's own name/versioning story shouldn't have
  to account for content schema bumps or vice versa) and
  `contentPackLoader.ts` (fetch pack manifest → schema-gate → cache-first,
  hash-verified fetch → parse JSON; no gunzip step, pack files are plain
  JSON, unlike the dict's pre-gzipped `.dat` files).
- **Not built on the SW alone**: the existing `runtimeCaching` rule in
  `vite.config.ts` (`urlPattern: /\/content\/v\d+\/.*\.[0-9a-f]{10}\.json$/`,
  `CacheFirst`) already matches `/content/v2/...` for free (it's version-
  agnostic) and opportunistically double-caches pack fetches on web. It is
  NOT sufficient alone because the SW is guarded off for the native wrapper
  (`main.tsx`) — `contentPackCache.ts`'s own Cache Storage store is the only
  persistent cache on native, exactly the justification `dictCache.ts` used.
- **Prefetch**: `triggerCoursePackPrefetch(lang)`, called from
  `CourseMapPage.tsx` on course open (mirrors `dictPrefetch.ts`). NOT
  Wi-Fi-gated — `@capacitor/network` is confirmed not a current dependency
  (checked `package.json` directly), same finding the dict lane made; left
  ungated given each course's remaining payload is fetched once and cached.
- **Inline states**: `useContentDownloadState(lang)` (`useLessonContent.ts`)
  drives a "Downloading course…" line on the course map (triggers the
  prefetch) and on `LessonPage`'s existing loading gate (observes only,
  `triggerPrefetch=false` — one lesson open shouldn't kick a whole-course
  fetch); `LessonPage`'s error state distinguishes "update the app"
  (schema refusal) from the generic retry-able failure.

## Schema gate

Pack manifests carry `schemaVersion` (`PACK_SCHEMA_VERSION` in
`emit-content-packs.mjs`, currently 1); the runtime (`SUPPORTED_PACK_SCHEMA`
in `contentPackLoader.ts`) refuses any pack whose `schemaVersion` is higher,
throwing `ContentPackSchemaError` — the loader surfaces `"unsupported"`
status, never partially trusts the pack, and the bundled slice (modules
1–3) is unaffected since it was never sourced from the pack in the first
place. An OLDER pack can never apply over a newer bundled module because
the two can't coexist: `contentVersion` is the exact hash of the build that
wrote both the bundle and its packs together, so a build only ever
addresses its own packs.

## Cut-over

A wording fix in an already-shipped module ≥ 4 = re-run
`content:emit` + `npm run build` (or `build:native` + the native upload
step below) + republish `dist/` (web) or the `dist-content-packs/` tree
(native) to the CDN — **no TestFlight build**, because the app fetches the
new `contentVersion`'s pack on next course open. A fix to a module 1–3 (or
any schema/loader change) still needs a TestFlight build, same as today.
Native upload (not run — AWS SSO expired, per brief):
`aws s3 cp dist-content-packs/ s3://<site bucket>/content/v2/ --recursive
--cache-control "public,max-age=31536000,immutable"` — bucket name per
`tts-publish/README.md`'s convention; no invalidation needed, new prefix.

## Numbers

| | value | source |
|---|---:|---|
| Lesson JSON, all 4 courses, uncompressed | 13.02 MB | measured, `dist/content/v1` before packing |
| `dist/` (web build), flag OFF | 75,996 KB | measured, this lane |
| `dist/` (web build), flag ON, local, not committed | 73,256 KB (content moves to `dist/content/v2`, still inside `dist/`, so this number is NOT the install-size win) | measured, this lane |
| `dist/` (**native** build, `webDir`, = what `cap sync` ships), flag OFF | 52,424 KB | measured, this lane |
| `dist/` (**native** build), flag ON, local, not committed | 37,232 KB | measured, this lane |
| **Native install-size delta (the real number)** | **−15,192 KB ≈ −14.8 MB, −29%** — applies to EVERY learner's install regardless of course studied (all 4 courses' bundled slices ship in one binary) | measured, this lane |
| Per-course pack size (bundled-through-3 tail) | ja 7,823.5 KB (43 modules) / es 2,769.4 KB (35) / fr 1,028.9 KB (23) / ko 537.5 KB (24) | measured, this lane |
| First-open download, JA (worst case), 4G (10 Mbit/s ≈ 1.25 MB/s, parallel fetch) | ≈ 6.1 s pipe-bound + per-request TLS/TTFB across 43 files, overlapped by `Promise.allSettled` | computed |
| CDN cost / 1,000 learners / month (first course-open only; cached repeats free), by course | ja ≈ $0.65 / es ≈ $0.24 / fr ≈ $0.09 / ko ≈ $0.05 (× 1,000 × pack size × $0.085/GB) | computed |
| Blast radius of a bad/corrupted pack file | Hash-checked before caching or use → rejected, degrades ONE module to the existing offline/error state; a bad pack manifest schema degrades the WHOLE course's beyond-bundled modules to "update the app", never modules 1–3; immutable `contentVersion` prefix means a bad pack can never be silently reused by a later build | design property, this lane |

## Known limitation — not fixed by this lane

`PlacementTestPage.tsx`'s test-out flow calls `useCourseReady(lang)` with no
`upToModuleId` — a pre-existing eager whole-course load, unrelated to this
lane. With packs ON, that call now also waits on every trailing module's
pack fetch before `courseReady` flips to `"ready"` (`ensureCourseLoaded`
keeps its existing strict `Promise.all` semantics on purpose — softening it
risks masking a real failure for `ensureLessonLoaded`'s own use of the same
function, which genuinely needs every module through the one being opened).
For a learner's first few modules this is invisible (their own module is
within the bundled slice and the trailing pack fetches are a few small
files), but a test-out attempt on a late module could visibly wait on a
slow/offline pack fetch it doesn't need. Flagged as a follow-up call-site
fix, not attempted here — out of this lane's mandate (loader seam, not
existing page data-fetching strategy) and changing test-out's fetch scope
risks behavior I don't have full context on.
