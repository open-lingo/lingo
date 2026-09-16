---
name: release-lap
description: The push-to-prod and TestFlight build sequence for Open Lingo, and how to tell whether it actually worked. Read BEFORE staging a commit, pushing to main, watching CI, or archiving/uploading an iOS build. Covers one-push-per-lap, when preflight applies and when it doesn't, reading run CONCLUSIONS rather than pipes, verifying prod by chunk content, the WAF trap that looks like an outage, and the build/ASC gotchas that have cost laps.
---

# A release lap

A push to `main` is a prod deploy. Two deploys once failed and were reported
successful twice — once from `gh run watch --exit-status | tail` (the pipe
swallows the exit code) and once from a 200 response that was serving stale
content. This is the sequence that does not do that.

---

## 1. One push per lap

Spencer, 2026-09-15: **43 pushes in two days, most of them docs, each paying a
5-minute preflight.** Fold the ledger, triage doc and shots into the code commit
they describe. One push per lap, not three.

## 2. Stage explicit paths

Several sessions share this tree.

- **Never `git add -A` or `git commit -a`.** `git status` first, then stage the
  paths you own. For a shared file another session is also editing, use a scoped
  partial commit: `git commit -m "…" -- <your explicit paths>` (it commits only
  the working-tree content at those paths and leaves everything else staged and
  untouched). Don't `git reset` and don't switch branches.
- **Never bare `git stash` / `git stash pop`** — the stack is shared across all
  worktrees. Prefer a WIP commit; if you must stash, `git stash push -u -m
  "<tag>"`, capture the SHA from `git stash list --format='%H %gs'`, and restore
  with `git stash apply <sha>`.
- **Check every new import resolves at HEAD.** `9d782f42` staged
  `src/shared/tts/index.ts`, which imported an untracked `clipStore.ts` from a
  concurrent session. It compiled in the dirty tree and broke a fresh worktree
  build days later. A dirty tree cannot prove a commit self-contained — build
  once in a detached worktree if the commit matters.
- Verify you didn't steal another lane's staged files:
  `git diff --cached --name-only` should still show theirs intact, and
  `git show --stat HEAD | grep -c _archive` (or the other lane's prefix) should be 0.
- No AI attribution in commit messages unless the session's own instructions say
  otherwise.

## 3. Preflight — for code and content only

```bash
npm run preflight
# = npm run content:emit && tsc -b && vitest run && CI=true vite build
```

**Required** when the commit touches `src/`, `scripts/`, `curriculum/`,
`public/`, `index.html`, `package*.json`, `vite.config*`, `ios/` or `android/`.
**Docs-only commits** (`docs/`, `*.md`, shots) push straight through — CI still
runs on every push and the deploy workflow verifies the served bundle.

- **`CI=true` is load-bearing.** `vite-plugin-pwa` only hard-fails over-cap
  precache assets under CI; a plain local build silently drops them. That split
  shipped nothing on 2026-08-25 while looking green locally.
- **Under load, run it as three steps** (and use `npx` — bare `tsc`/`vite` are not
  on PATH and exit 127):
  ```bash
  npx vitest run --maxWorkers=6
  npx tsc -b
  CI=true npx vite build
  ```
- **Order-dependent tests need a single-worker repro before you push:**
  `npx vitest run --maxWorkers=1`. The FR article race is the known one.
- `vitest run` does **not** typecheck. Only preflight (via `tsc -b`) catches type
  errors and unused helpers.
- **Check for an open 🚨 red-main issue first.** A red `ci`/`deploy` on main opens
  one via `red-main.yml`; while it's open, fix forward or revert — don't stack
  unrelated pushes.
- Run `npm run sim:capture` on the touched step routes at 100 and 125 before
  any build that changes tile/step sizing (`mobile-ui-verify` §2).

## 4. After the push — conclusions, not pipes

```bash
gh run watch <id> --exit-status ; echo "exit=$?"
# or
gh run view <id> --json conclusion
```

**Never pipe it.** `| tail` swallows the exit code. If you must pipe, read
`${PIPESTATUS[0]}`, not `$?`.

Then verify prod serves the new build **by chunk content**, not by a 200:

- Fingerprint **`app.openlingoapp.com`** — the apex serves a different bundle.
- Compare the served `index.html`'s entry-chunk name against the one you built
  (chunk names differ local vs CI; the *split* does not — confirm by grepping
  local `dist/assets` after a build).
- Content lives in different chunks: **ES** in the entry `index-*.js`, **JA** in
  the lazy `mockLessons-*.js`, the **learn-map CSS** in the lazy
  `TransitLearnPage-*.css`. Grepping the wrong chunk returns 0 and reads as
  absence. `es-*.js` (~52 KB) is the language module only.
- **A 4,199-byte response for any `/assets/*` path is the SPA fallback** — the
  object isn't there.
- A deploy reaches service-worker-installed clients **one navigation late**;
  `sw.js` (generated, not in git) and `manifest.webmanifest` must stay
  `no-cache` in the deploy S3 sync.

### The WAF trap

The shared web ACL blocks an IP above **2,000 requests / 5 minutes**, and while
blocked **every path returns the SPA shell with `x-cache: Error from cloudfront`
— indistinguishable from a site-wide outage.** Two concurrent sweeps from this
machine once produced a reported outage and a bogus "4,693 missing clips".

- Space any CDN sweep at **≥300 ms** (≈1,000 per 5 min); one stream, not sixteen.
- **Before declaring an outage: wait 5 minutes with zero traffic, then re-test two
  known assets.**

## 5. iOS build, upload, TestFlight

There is **no committed archive/upload script** — the `release-bNN.sh` /
`asc-post19.sh` scripts referenced in handoff docs live in session scratchpads and
do not survive. The committed pieces are `scripts/asc/asc.mjs` (raw ASC API
client, signs a JWT from `~/.appstoreconnect/`) and
`scripts/asc/pull-feedback.mjs`.

```bash
npm run build:native     # tsc -b && vite build --mode native  (reads .env.native)
npx cap sync ios
# then archive / export / upload
```

- **Bump `CURRENT_PROJECT_VERSION` at BOTH pbxproj blocks**, and `cap sync` before
  archiving (so dev-only files like `probe.js` are dropped from the www).
- **The what's-new quote gotcha:** a single quote inside a single-quoted WN string
  broke the post script at line 15 with **exit 127**. Use double quotes inside
  what's-new text.
- If you built with `CAP_DEV_SERVER` pointed at a dev server, clean up afterwards:
  `npx cap sync ios` then `git checkout ios/App/CapApp-SPM/Package.swift`, so the
  server URL and SPM drift are not committed.
- CloudFront invalidation: the CLI rejects many inline `--paths` args — pass
  `--invalidation-batch file://batch.json`.
- Record the delivery UUID, whether beta review approved, and **which build
  number each fix landed in** — triage needs that (see `feedback-triage`).

## 6. Close the ledger in the same commit

**Update the feedback doc's status column in the same commit as the fix.** The
b13 table still reads "open" for 14 shipped items, so the next triage cannot tell
fixed from pending without reading git — which is how four items (#59, #60, #65,
#85) came back as phantom regressions.

Then run the `regression-classes` checks for C13 (deploy verified by conclusion
and chunk content) and C12 (ledger status updated), and paste the output.

## 7. Report the lap

State, as facts with values: the SHA pushed, the file count, the preflight result
(`N files / M tests`), the ci and deploy run ids **and their conclusions**, the
prod entry-chunk name you verified, the build number, and the ASC delivery
status. Anything you did not verify, say so in those words.
