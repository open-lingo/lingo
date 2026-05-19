---
name: screenshot
description: Take a Playwright screenshot of any Lingo route so Claude can see the rendered UI. Use whenever the user asks to "look at", "see", "view", "screenshot", or visually verify a page; or when iterating on layout/styling and you need eyes on the output instead of reading code.
---

# Screenshot a Lingo route

Claude drives the running dev server with Playwright (headless Chromium) and reads the PNG inline. The script is `scripts/shot.mjs`. Output always lands at `/tmp/shot.png`.

## Usage

```bash
node scripts/shot.mjs <path-or-url> [width] [height] [--full] [--lang=<id>] [--no-lang]
```

| Arg | Default | Notes |
|---|---|---|
| `<path-or-url>` | required | `/landing`, `/home`, `/en/community/explore`, or full URL |
| width | 1440 | viewport width px |
| height | 900 | viewport height px |
| `--full` | off | full-page screenshot (whole scroll height) instead of viewport-only |
| `--lang=<id>` | `ko` | learning language to seed in localStorage before nav (`en`, `ko`, `ja`, etc.) — bypasses the first-time `LanguagePickerModal` so authed pages render |
| `--no-lang` | off | keep `learningLanguageId` unset (use this when debugging the picker itself) |

Examples:
- `node scripts/shot.mjs /landing`
- `node scripts/shot.mjs /home --full`
- `node scripts/shot.mjs /en/community/explore 1920 1080`
- `node scripts/shot.mjs /home --lang=ja --full` — see home as a Japanese learner
- `node scripts/shot.mjs /home --no-lang` — capture the first-time picker modal

After the script prints the path, **Read `/tmp/shot.png`** to see the rendered page.

## Preflight checklist

1. **Dev server**: `curl -sf http://localhost:5173 > /dev/null && echo up || echo down`. If down, start it with `npm run dev` in the background.
2. **Playwright chromium installed**: first-time run will fail with a message telling you to run `npx playwright install chromium` — do it once.
3. **Auth state** (only needed for routes behind `RequireAuth`, i.e. `/:lang/*`, `/home`, `/admin/*`):
   - File `.auth/user.json` must exist and be non-empty (~3KB+ with real cookies + Auth0 localStorage).
   - To (re)create: ask the user to run `npm run test:e2e:auth` in their terminal — a headed browser pops up via WSLg, they log in, the file is written. Don't run it for them silently — they need to interact.
   - Verify: `wc -c .auth/user.json` (should be >1KB) and `jq '.cookies | length' .auth/user.json` (should be >0).

## Routes that need auth

Anything under `/:lang/*` (e.g. `/en/community/explore`, `/en/practice/flashcards`), `/home`, `/admin/*`. The `RootRoute` redirects unauthenticated users from `/` → `/landing`.

Public routes (no auth needed): `/landing`, `/privacy`, `/terms`, `/about`, `/login`, `/get-started`, `/try`.

## When things look wrong

- **Empty/blank page**: dev server probably not running, or the route required auth and `.auth/user.json` was empty (the 2.2s "passed" auth setup bug). Re-run the auth setup.
- **Modal in the way**: the script auto-injects `learningLanguageId=ko` to bypass the first-time `LanguagePickerModal`. If a modal is still blocking, it's a different one — look at the screenshot and adjust.
- **Wrong theme**: theme is stored in localStorage; the auth setup captures whatever theme was active when login happened. Re-run auth setup after switching themes if you want a different baseline.

## Don't

- Don't commit `/tmp/shot.png` or `.auth/user.json` — both are gitignored / outside the repo.
- Don't try to run `npm run test:e2e:auth` in the background — it's `--headed` and interactive; the user must drive the login. If you launch it for them, do it foreground or `run_in_background: true` and **tell them** the browser is opening.
- Don't bypass this script with raw `npx playwright` calls — the script handles storage-state loading, viewport sizing, and pathing in one place.
