# "It looks different on my phone than in the simulator" — what that actually was

**Date:** 2026-08-08 · **Status:** answered; no code change needed from this investigation
**Devices:** phone `Trap Phone` iPhone 15 Pro Max, iOS 26.5.2, `3C96A488-215E-54CE-AD48-983D35EE033F` ·
simulator `OL-15ProMax` (iPhone 15 Pro Max, iOS 26.5), `942D8E54-C85D-425B-A7FC-E8BCB33EC323`

Two questions: *do I really have the updated app*, and *why does it look different from the
simulator*. Both are answerable without guessing, and the method matters more than the answer —
see "How to check this again" at the bottom.

## 1. The phone has the updated build

Three independent proofs, in descending order of strength:

1. **Audio plays.** That requires the corrected `VITE_ASSET_BASE_URL`
   (`https://app.openlingoapp.com`, not the marketing apex). It exists only in the build installed
   2026-08-07 20:02. Working audio is proof of the build, not just proof of audio.
2. The artifact installed on the device (`Debug-iphoneos/App.app`, 20:02:34, built from a detached
   worktree at `dbce1c5f`) contains `app.openlingoapp.com` in `assets/index-C4RUMvLI.js`.
3. Its `Assets.car` hashes differently from the simulator's — the phone got the real app icon; the
   simulator build (19:41) predates the icon regen (19:55) and still shows the stock Capacitor
   chevron.

`CFBundleVersion` is `1` on both and was useless for telling builds apart. **Bump the build number
per install** if you want this question to be answerable in one command next time.

## 2. The code is NOT the difference

The phone's bundle and the simulator's bundle are **byte-identical** except four PNGs:

```
diff -rq <device App.app>/public <simulator App.app>/public
→ apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png differ
→ every .js and .css file identical (same Vite content hashes: index-C4RUMvLI.js, index-CSZBfjPj.css)
```

So any visible difference is **environment or saved state**, never code drift. Establish this first;
it collapses most of the hypothesis space.

## 3. What the difference actually was

Pulled the phone's WKWebView `localStorage` off the device and compared it to the simulator's:

| | phone | simulator |
|---|---|---|
| `appearance.themeId` | `"auto"` + iOS in **dark** | `"auto"` (default) + sim in **light** |
| `learning.onboardingCompleted` | `true` | `false` |
| romaji auto-off flags | all `true` | all `false` |
| lesson progress | `ja-m1-l1-1`, `ja-m5-neo-1`, `ja-m30-1-2` + SRS data | near-fresh |
| settings schema | current | still carries legacy `showRomaji` / `showAlphabetFurigana` keys |

Dark mode was most of it — `themeId: "auto"` follows `prefers-color-scheme`, so the same build is
light in the simulator and dark on the phone. The rest is two installs at different points in the
course with different romaji settings, so they render different step types with different text.

**The simulator has been left in dark mode** to match the phone. Revert with
`xcrun simctl ui 942D8E54-C85D-425B-A7FC-E8BCB33EC323 appearance light`.

## 4. Ruled out — with the measurement, not an opinion

**iOS Dynamic Type does not reach this webview.** Same screen, system text size changed from
`accessibility-large` to `large` with no relaunch, two screenshots: **byte-identical PNGs.**

This is worth recording because `-webkit-text-size-adjust` is set **nowhere** in authored source
(`src/`, `index.html`, `tailwind.config.js`), which makes it the obvious suspect for "text is
bigger on my phone". It isn't. Don't spend time there.

## 5. ⚠️ A wrong call I made, recorded so it isn't repeated

I compared the two screenshots by eye and claimed the simulator applies `env(safe-area-inset-*)`
while the device does not, quoting a "~59pt gap that exactly matches the top inset". **That was
wrong, and the evidence to kill it was already in hand:** I had just measured the two bundles as
byte-identical, so a device-vs-simulator inset difference could not have been the cause.

What's true:

```
git show HEAD:src/features/lesson/components/LessonShell.tsx
  → className={`mx-auto flex ${SHELL_HEIGHT} w-full flex-col...`}    # no *-safe
grep "pb-safe pl-safe pr-safe pt-safe" ios/App/App/public/assets/index-C4RUMvLI.js
  → no match
```

**Neither build has the safe-area padding.** The phone's lesson header sits under the Dynamic Island
and the CTA sits on the home indicator because the shipped bundle lacks the fix — not because the
device behaves differently from the simulator.

Two lessons: pixel positions eyeballed across two screenshots whose scales were never confirmed are
not measurements; and a coincidence that "exactly matches" a number you already expected is a
warning sign, not a confirmation.

## 6. The safe-area fix already exists — in the other session's uncommitted work

`LessonShell.tsx` is `M` in the working tree and now carries `pb-safe pl-safe pr-safe pt-safe`,
with this in its comment:

> measured on an iPhone 15 Pro Max simulator 2026-08-07, `innerHeight` is the whole 932pt screen
> and the insets are 59pt top / 34pt bottom. The shell ran 12→920, so the exit ✕, the progress bar
> and the XP chip rendered UNDER the Dynamic Island and the clock, and the CTA's bottom edge sat
> 6pt inside the home indicator.

That is exactly the symptom on the phone, already measured properly. **Nothing to hand anyone — it
lands when that work is committed and the app is reinstalled.** The lesson player is the one surface
that renders without `Layout`'s chrome, so it cannot inherit `Layout`'s `pt-safe pl-safe pr-safe`.

⚠️ The mobile gate cannot catch this class: `*-safe` resolves to `max(env(...), 0px)`, which is
**0 in Playwright's Chromium** at every viewport. A green gate says nothing about safe areas.

## How to check this again

No cable needed — the phone is paired over the network. All of this ran over Wi-Fi.

```bash
DEV=3C96A488-215E-54CE-AD48-983D35EE033F        # Trap Phone
SIM=942D8E54-C85D-425B-A7FC-E8BCB33EC323        # OL-15ProMax

# is the phone reachable / awake / developer-mode on?
xcrun devicectl list devices
xcrun devicectl device info details --device $DEV | grep -E "developerModeStatus|bootState"

# what's installed
xcrun devicectl device info apps --device $DEV | grep openlingo

# pull the phone's webview localStorage (values are UTF-16 — decode, don't CAST AS TEXT)
H=ElcYfLFj4-0IX-8nwdBtAWgUwUjDmZo0gSLgQBKrnbs   # origin hash, stable per install
xcrun devicectl device copy from --device $DEV \
  --domain-type appDataContainer --domain-identifier com.openlingo.app \
  --source "Library/WebKit/WebsiteData/Default/$H/$H/LocalStorage/localstorage.sqlite3" \
  --destination ./localstorage.sqlite3
python3 -c "import sqlite3,json;c=sqlite3.connect('localstorage.sqlite3');\
print(json.dumps(json.loads(c.execute(\"SELECT value FROM ItemTable WHERE key='open-lingo-settings'\")\
.fetchone()[0].decode('utf-16-le')),indent=1))"

# simulator: state, screenshots, and A/B-ing system settings
xcrun simctl ui $SIM appearance          # light | dark
xcrun simctl ui $SIM content_size        # large = iOS default
xcrun simctl io $SIM screenshot shot.png
xcrun simctl get_app_container $SIM com.openlingo.app data   # its localStorage lives under here
```

`devicectl` can read the app's **data container** but not its bundle, so comparing shipped web
assets means comparing the local build products, not the installed app.

## Still open (unchanged by this)

- **Authed-route overflow worklist** for the UI pass: `/ja/shop` (6 viewports), `/settings` (4),
  `/ko/learn` (3), `/ja/learn/course` (3). Then drop `MOBILE_PUBLIC_ONLY=1` from `ci.yml`.
- **`chromium-public` e2e project** still tests the marketing site through this repo's runner —
  see `handoff-mobile-gate-was-blind-2026-08-06.md`.
- **Free provisioning expires ~2026-08-14.** The app will refuse to launch with a signing error;
  that is the free-tier limit, not a regression. Rebuild + reinstall (works over Wi-Fi).
