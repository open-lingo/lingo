# Android → Google Play — scoping (2026-09-13)

Scope only. No builds run, no state changed. Base: the Capacitor Android
project committed at `d7169c80` (sideload-only today, per
`docs/android-port-2026-09-04.md`). Reuses whatever the iOS App Store lane
already shipped (`docs/app-store-launch-readiness-2026-08-20.md`,
`docs/handoff-2026-08-26-appstore-wave.md`) — this doc lists only the DELTA.

## Decisions Spencer must make

1. Package/application id: keep `com.linguiversal.app` or switch to an
   openlingo-branded id — **permanent once uploaded**, decide before step 4.
2. Play Console account type: personal (fast setup, triggers the
   12-tester/14-day gate) vs organization (needs D-U-N-S + business
   verification, but skips that gate).
3. Who are the 12+ closed-testing accounts (real Gmail addresses, opted in
   continuously for 14 days) — team, family, the existing TestFlight pool?
4. Confirm/publish the privacy-policy URL to use: reuse the live
   `openlingoapp.com/privacy`, or a new one.
5. Publish a **web** URL for account-deletion requests — Play requires this
   in addition to the in-app `DELETE /users/me` path, and I could not confirm
   from this repo whether `openlingoapp.com/privacy` already states one.
6. Keystore custody: who holds the upload keystore + passwords (Spencer, a
   password manager, Trevor's infra secrets store) — losing it blocks future
   updates unless Play App Signing's key-upgrade flow is used.
7. Support email/contact address to publish on the listing (shared gap —
   the iOS listing doesn't have one either yet, per the 08-26 handoff).
8. Store description/keyword copy: write once and reuse for both stores, or
   write Play-specific copy.
9. Enable ProGuard/R8 (`minifyEnabled true`) for the release build, or ship
   unminified like the current debug config.
10. Will the community/UGC surface (client code exists; server currently
    gated by `SURFACE_MODE=beta`) be reachable in the shipped Android build?
    Affects the content-rating questionnaire and Play's UGC policy scope.

## Checklist, today → production

Estimates are wall-clock, including Google's own wait states, not effort.
Several rows can run in parallel — see the total at the bottom.

1. **[Spencer]** Decide package id + account type (decisions 1–2 above).
   ~15 min.
2. **[Spencer]** Create/confirm the Play Console developer account, pay the
   $25 one-time fee, submit identity verification. **2–5 business days**
   processing (can run in parallel with steps 3–8).
3. **[code]** Add a release `signingConfig` to `android/app/build.gradle`
   reading path/passwords from env vars, and fix `android/.gitignore` so a
   keystore dropped in `android/` is actually excluded (see Code delta).
   ~1–2 h.
4. **[Spencer]** Generate the upload keystore (`keytool`), store it per the
   decision-6 custody plan, **outside the repo**. ~15 min + the custody
   decision itself.
5. **[code]** Derive `versionCode`/`versionName` from a single source of
   truth instead of the hardcoded `1`/`"1.0"` (see Code delta). ~1–2 h.
6. **[code]** Verify the Android Auth0 + CORS entries from the 2026-09-04
   sideload pass are still live (they are a live, non-Terraform edit and may
   have drifted). ~30 min.
7. **[code]** Build the signed release AAB
   (`./gradlew bundleRelease`, not run in this scoping pass) and smoke-test
   it on the existing `maddie` emulator/a real device. ~1 h once the above
   lands (gradle build itself is minutes).
8. **[Spencer/code]** Write/finalize store description, keywords, support
   email (decisions 7–8) and the feature graphic (new asset, see below).
   ~2–4 h.
9. **[console click-ops]** Create the app listing under the App content
   pages: title, descriptions, category, contact details, privacy-policy
   URL. ~1 h.
10. **[console click-ops]** Upload store graphics: reuse `src/pub/icon-512.png`
    (already 512×512; verify alpha channel, see Code delta), the new feature
    graphic, and the existing TestFlight phone screenshots (verify Android
    aspect-ratio acceptance, reshoot the 2+ that don't fit). ~1–2 h.
11. **[console click-ops]** Content-rating (IARC) questionnaire — answer
    honestly per decision 10 (UGC questions change the outcome). ~15–30 min.
12. **[console click-ops]** Data-safety form: declare Auth0-collected
    identifiers/email, on-device audio for speech recognition (not
    uploaded — same claim as the iOS Info.plist strings), and the
    account-deletion URL from decision 5. ~1 h.
13. **[console click-ops]** Enroll in Play App Signing (default on first
    upload) and create a closed-testing track; upload the signed AAB; add
    the 12+ testers from decision 3. ~30 min.
14. **[Spencer]** Run the closed test: **12 testers opted in continuously
    for 14 days** (personal accounts only — skip if organization account).
    **14 calendar days**, but it starts as soon as step 13 lands and runs
    in parallel with any leftover polish.
15. **[console click-ops]** Apply for production access once the bar is
    met. Minutes.
16. **[Google]** Production review. **3–7 days for a first-time/new
    developer account**; established accounts often clear in <24 h. This is
    a first submission, so budget the long end.
17. Live on Google Play.

**Total estimated calendar time to production: ~3–4 weeks (≈18–26 days)**,
dominated by the mandatory 14-day/12-tester closed-testing window (step 14)
plus up to 7 days of first-time production review (step 16) at the end. The
2–5 day identity check (step 2) and the ~1–2 days of engineering (steps
3, 5, 6) can run concurrently with each other, not serially with the rest.
Skipping personal-account testing by registering an organization account
removes the 14-day floor but adds D-U-N-S/business verification, which is
not obviously faster.

## Code delta

No edits performed. Exact changes, if/when authorized:

- **`android/app/build.gradle`**
  - Add a `signingConfigs { release { storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "release.keystore"); storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD"); keyAlias System.getenv("ANDROID_KEY_ALIAS"); keyPassword System.getenv("ANDROID_KEY_PASSWORD") } }` block
    and wire it into `buildTypes.release.signingConfig`. Today there is
    **no signing config at all** — `bundleRelease` would produce an
    unsigned artifact Play cannot accept as-is (Play App Signing still
    needs a signed upload artifact).
  - Replace hardcoded `versionCode 1` / `versionName "1.0"` with values read
    from an env var (CI) falling back to a derivation from `package.json`'s
    `version` field. Note `package.json` is currently `"0.0.1"` while iOS's
    `MARKETING_VERSION` is already `1.0` (`CURRENT_PROJECT_VERSION = 12`) —
    pick one source of truth across both platforms before wiring this, or
    the two stores will show different version numbers for the same build.
  - Optional: flip `minifyEnabled false` → `true` under `release` once
    `proguard-rules.pro` is verified not to strip anything the Capacitor
    WebView bridge or the speech-recognition plugin needs (decision 9).
- **`android/.gitignore`**: uncomment the `#*.jks` / `#*.keystore` lines.
  As shipped today those lines are commented out, i.e. **a keystore placed
  under `android/` would NOT be excluded** — a real accidental-commit risk
  the moment step 4 happens.
- **New, gitignored file** (e.g. `android/keystore.properties` or CI
  secrets only): keystore path + the three passwords referenced above.
  Never in the repo, never in this doc.
- **`capacitor.config.ts`**: no change identified. `android.backgroundColor`
  is already set; the Android webview origin is already pinned to
  `https://localhost` (the code comment there explains why, to keep the
  Auth0/CORS entries below from drifting).
- **Auth0 + CORS — already done, verify only (step 6).** Per
  `docs/android-port-2026-09-04.md`, these are live as of 2026-09-04:
  - Auth0 native client `bIKQzPiAKK6RVApeWjiV6tbseSX9Qqjc` ("Open Lingo
    Native"): `allowed_origins`/`web_origins` include `https://localhost`.
    Callback/logout URLs are the custom-scheme URL
    (`com.linguiversal.app://…/callback`), shared with iOS.
  - lingo-core Lambda `CORS_ORIGINS` includes `https://localhost`. This is a
    **live, non-Terraform edit** (Terraform ignores the variable), so it can
    silently drift — confirm before submission rather than assuming.
  - If decision 1 changes the package id, the custom-scheme callback URL
    changes too (scheme = `applicationId`) and needs a matching Auth0 entry;
    the `https://localhost` origin entries do **not** need to change.
- **`package.json`**: optional convenience scripts mirroring the existing
  `ios:sync`/`ios:open`, e.g. `"android:sync": "npm run build:native && npx cap sync android"`,
  `"android:bundle": "cd android && ./gradlew bundleRelease"`. Not required
  by Play, just parity with the iOS release scripts already in the file.
- **`src/pub/icon-512.png`**: already 512×512, already the right dimensions
  for the Play icon slot; confirmed via `file` that it's RGB, not RGBA —
  regenerate with an alpha channel via `scripts/generate-icons.mjs` if Play
  Console rejects it for missing alpha (32-bit PNG is the documented spec).
- **New asset, does not exist anywhere in the repo**: a 1024×500 feature
  graphic. This is Android-only — iOS has no equivalent slot.
- **`AndroidManifest.xml`**: no manual change identified.
  `android.permission.RECORD_AUDIO` merges in automatically from
  `@capacitor-community/speech-recognition`'s own manifest at build time
  (confirmed by reading the plugin's `AndroidManifest.xml` in
  `node_modules`); nothing to add by hand, just disclose it in the Data
  Safety form (step 12).

## Package-name trade-off (decision 1)

Keeping `com.linguiversal.app` avoids touching the Auth0 native client and
preserves the rebrand already shipped in commit `10100791`, but it ships a
package name that says "Linguiversal" while the app displays as "Open
Lingo" everywhere else — a public, permanent mismatch once it's on Play.
Switching to an openlingo-branded id (e.g. `com.openlingo.app`, matching the
`app.openlingoapp.com` domain already in production) fixes that optics gap
for the life of the app, but costs one Auth0 dashboard edit (new/updated
native-client callback URL) and must happen **before** the first upload —
Play's package name cannot be changed afterward, only retired and
re-published as a new listing.

## Facts checked (commands run against the repo, no state changed)

- `grep '"@capacitor/' package.json` + `cat node_modules/@capacitor/{core,android}/package.json`:
  installed **Capacitor 8.5.0/8.5.1** — not Capacitor 7. The original scoping
  brief assumed 7; correcting that here since it changes which Capacitor
  release notes are relevant (8.x already carries the newer AGP/Android 15
  plumbing).
- `cat android/app/build.gradle`: `versionCode 1`, `versionName "1.0"`
  hardcoded; **no `signingConfigs` block exists** for `release`;
  `minifyEnabled false`.
- `cat android/variables.gradle`: `compileSdkVersion = 36`,
  `targetSdkVersion = 36`, `minSdkVersion = 24`. This **already satisfies**
  both the new-app deadline (Android 16/API 36, effective 2026-08-31) and
  the existing-app floor (API 35+, same deadline) — no target-SDK work
  needed here, unlike most Capacitor projects scoping this today.
- `grep PRODUCT_BUNDLE_IDENTIFIER ios/App/App.xcodeproj/project.pbxproj`:
  `com.linguiversal.app` — **matches** the Android `applicationId`. Also
  found `CURRENT_PROJECT_VERSION = 12`, `MARKETING_VERSION = 1.0`,
  `DEVELOPMENT_TEAM = Y462YZGXCZ` (iOS is nine build numbers ahead of
  Android's hardcoded `1`).
- `cat android/.gitignore`: keystore-exclusion lines present but
  **commented out** — see Code delta.
- `find … node_modules/@capacitor-community/speech-recognition -iname
  AndroidManifest.xml`: confirms `RECORD_AUDIO` is contributed by the
  plugin, not hand-added.
- `file src/pub/icon-512.png`: 512×512 PNG, RGB (no alpha channel).
- No native `.so`/NDK code found under `android/app/src` or in the
  first-party dependency tree (`better-sqlite3`/`sqlite-vec` are devDeps,
  not bundled into the app) — the 16 KB page-size requirement is very
  likely a non-issue, but wasn't checked against every transitive plugin's
  `.aar`.
- `git log --oneline -5` / `git status --short`: `d7169c80` is the tip,
  tree clean — matches the prompt's premise.

## Costs

| Item | Cost | Notes |
|---|---|---|
| Play Console developer registration | $25 one-time | vs. Apple's $99/**year**; Play has no recurring developer fee |
| Identity verification | $0 | 2–5 business days, not cash |
| Upload keystore | $0 | self-generated with `keytool` |
| IARC content-rating questionnaire | $0 | |
| Closed testing (12+ testers) | $0 | assuming volunteer/team testers, no incentive budget |
| Feature graphic (new asset) | time only, ~1–2 h | no existing Android-sized banner in the repo |
| Store copy (description/keywords/support email) | time only, ~2–4 h | shared backlog item with the still-unfinished iOS listing |
| Engineering (signing config, version derivation, `.gitignore` fix, verify Auth0/CORS) | time only, ~4–6 h | see Checklist steps 3, 5, 6 |
| **OPEN LINGO trademark filing (Class 9, $350)** | flagged, not resolved here | raised 2026-08-06 in `docs/mobile-testing-setup-2026-08-06.md` as a pre-submission tripwire; the `com.linguiversal.app` rebrand may have been the chosen mitigation instead of filing — confirm before publishing a listing titled "Open Lingo" |
| **Total new cash cost** | **$25** (+ possible $350 if the trademark question above resolves toward filing) | |

## Sources

- Play Console Help — App testing requirements for new personal developer
  accounts:
  https://support.google.com/googleplay/android-developer/answer/14151465
  (fetched 2026-09-13)
- Google Play Developer Community — the 12-testers requirement explained:
  https://support.google.com/googleplay/android-developer/community-guide/255621488/everything-about-the-12-testers-requirement
  (fetched 2026-09-13)
- Play Console Help — Target API level requirements for Google Play apps:
  https://support.google.com/googleplay/android-developer/answer/11926878
  (fetched 2026-09-13)
- Android Developers Blog — 16 KB page size compatibility requirement:
  https://android-developers.googleblog.com/2025/05/prepare-play-apps-for-devices-with-16kb-page-size.html (2026-09-13)
- Android Developers — Sign your app (Play App Signing / upload key):
  https://developer.android.com/studio/publish/app-signing (2026-09-13)
- Play Console Help — Use Play App Signing:
  https://support.google.com/googleplay/android-developer/answer/9842756 (2026-09-13)
- Play Console Help — Account deletion requirements:
  https://support.google.com/googleplay/android-developer/answer/13327111 (2026-09-13)
- Android Developers — App Bundle FAQ (AAB required, new apps since Aug
  2021 / all updates since Nov 2021):
  https://developer.android.com/guide/app-bundle/faq (2026-09-13)
- Play Console Help — Add preview assets (icon/feature-graphic/screenshot
  sizes): https://support.google.com/googleplay/android-developer/answer/9866151 (2026-09-13)
- Play Console Help — Content ratings (IARC questionnaire):
  https://support.google.com/googleplay/android-developer/answer/9898843 (2026-09-13)
- Android Developers — Behavior changes on Android 15+ (edge-to-edge
  enforcement, WebView inset caveats):
  https://developer.android.com/about/versions/15/behavior-changes-15 (2026-09-13)
- IconikAI — Google Play Developer Fee 2026 ($25 one-time + identity
  verification): https://www.iconikai.com/blog/google-play-developer-account-fee-2026
  (2026-09-13; secondary source — cross-check the official Play Console
  billing page before treating the fee as final)
