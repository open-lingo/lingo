# Android tester onboarding

No Play internal track yet (sideload-only, `docs/android-port-2026-09-04.md`)
and no TestFlight screenshots — this is the whole loop for a new tester.

## Install
1. Get `app-debug.apk` from Spencer (AirDrop/Drive/email).
2. Settings → Apps → Special app access → Install unknown apps → allow it
   for whichever app opened the file (Files / Chrome / Drive).
3. Open `app-debug.apk`, tap **Install**. A debug build can't update a
   Play-installed copy or vice versa — uninstall the other one first.

## Report a problem
Same sheet, same 6-char code, three places: the flag icon next to the ✕ in a
lesson header; "Something off? Report" under a wrong answer; or Home →
account menu → Sync & diagnostics → **Report a problem**.

Type what happened (optional), tap **Send**. It shows a code like
**`K7P4QX`** — that code is what you tell Spencer, not a bug description.
