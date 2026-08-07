# Mobile / Offline / Open-Source + IP Scoping

**Date:** 2026-08-06
**Owner:** Spencer (decisions), scoping pass by session agent
**Status:** ACTIVE — decisions recorded inline. Supersedes nothing; extends
[`mobile-research-2026-07-20.md`](./mobile-research-2026-07-20.md) and
[`ECONOMICS.md`](./ECONOMICS.md).

Scoping for: what the mobile port actually needs, whether offline is reachable,
what any of it costs, and how to stay open source without giving away the things
that pay for the project. Every number here was measured this session unless
flagged otherwise.

---

## Two facts that frame everything

1. **The content is already fully public.** `github.com/open-lingo/lingo` is
   public and MIT, and the JA curriculum lives inside it — 196 tracked files
   including all 48 IR YAML sources, 9.3 MB. Content secrecy is not an available
   strategy; it shipped a long time ago.
2. **The Valve split already exists by instinct.** Five repos public, one
   private — and the private one (`lingo-ops`) is the revenue/finance machinery.
   That is the right cut line. It just wasn't written down.

| Repo | Visibility | License |
|---|---|---|
| `lingo` | public | MIT |
| `lingo-core` | public | MIT |
| `lingo-data` | public | CC-BY-4.0 (+ MIT for pipeline code) |
| `lingo-async` | public | MIT |
| `lingo-infra` | public | MIT |
| `lingo-ops` | **private** | — |

---

## T1 — Mobile port scope

`mobile-research-2026-07-20.md` remains the authoritative worklist and is still
~85% accurate. Status corrections measured 2026-08-06 below.

**The doc assumes React Native. Adding offline as a requirement changes that.**

| | PWA | React Native |
|---|---|---|
| Element rewrite | none | 1,987 `div` + 1,032 `span` + 851 `p` → `View`/`Text` |
| Router | none | 180 import sites |
| Storage | service worker + IndexedDB | 148 `localStorage` files |
| Styling | none | NativeWind keeps 6,538 classNames; 919 `hover:` die |
| Offline | **same work** | separate work |
| Store cut | 0% | 15–30% |
| Effort | weeks | quarters |

**Decision: PWA first.** It is the only path where the offline work and the
mobile work are the same work. Keep W2/W17 (seam interfaces) on the roadmap so
RN stays open; don't pay for RN now.

RN's real wins are App Store discovery and background sync. iOS 16.4+ supports
web push for installed PWAs, so that gap is narrower than the research doc
assumed.

### Corrections to `mobile-research-2026-07-20.md` (measured 2026-08-06)

| Item | Doc said | Now |
|---|---|---|
| **W1** tokens → RGB triples | not started | **SHIPPED** — `rgb(var(--color-x) / <alpha-value>)` in `tailwind.config.js`; the 533-usage transparent-tint bug is fixed |
| **W9** mobile render gate | not started | **SHIPPED** — `tests/mobile/` (overflow, tap-targets, cta-fold, render-errors) |
| **W11** safe-area | "zero safe-area handling, no `viewport-fit=cover`" | **SHIPPED** — `viewport-fit=cover` in `index.html`; full `pt-safe`/`bottom-safe-N` utility family in `tailwind.config.js` as `max(env(inset), fallback)` |
| **W14** CTA below fold | open | **SHIPPED** — see T2 |
| **W2** breakpoint source + `useViewport` adoption | 0 feature files | **STILL 0** — top remaining RN blocker |

---

## T2 — UI scaling retro (2026-08-05 fix)

Root cause: `PlacementTestPage` hand-rolled a shell that diverged from the
lesson's in four ways, while rendering the *same* `StepRenderer` step views.
Now unified behind `features/lesson/components/LessonShell.tsx`.

| Metric | Before | After |
|---|---|---|
| `cta-fold` gate failures | 6 | **0** |
| Test-out stage width @1080p | 1451px | **717px** (matches lesson exactly) |
| CTA gap from bottom edge | −349px … +26px | **+26 to +60px, never negative** |
| CTA stability (rect before/after submit) | — | **12/12** |

**The process finding matters more than the fix.** The gate was green while
covering nothing: its three lesson routes pointed at `ja-m4-1-1`, archived in
the 2026-07-26 IR wave, so they rendered "Lesson not found" → no CTA →
skip-with-annotation → green. Its largest viewport was 768×1024, which is why
1080p was never tested. Both fixed (desktop viewports added to the matrix).

**Still open:** 18 of 29 step views lack `data-testid="primary-cta"`, so gate
coverage is partial. Test-out's per-attempt random draw makes its coverage vary
run to run.

**Carry into the mobile pipeline:** a skip must not read as a pass, and route
ids in test matrices need a liveness assertion.

---

## T3 — Offline architecture

**The hard part is already done.** The SRS is local-first with dirty-card delta
sync, field-level LWW on `lastReviewedAt`, chunked payloads, serialized ops via
`enqueueSyncOp`, and a `manualResetAt` override
(`features/flashcards/engine/srsSync.ts`). That is Anki-class — arguably better,
since Anki forces a full download-or-upload choice on conflict and we merge
per-card.

Three real gaps:

1. **No PWA at all.** No service worker, no manifest, no icons. `public/`
   contains exactly one file (`feature-flags.json`). Verified against production
   2026-08-06: `https://app.openlingoapp.com/manifest.webmanifest` returns HTTP
   200 but `content-type: text/html` — that is the SPA fallback, not a manifest
   (a nonsense path 200s identically). **The app cannot boot offline today.**
2. **`localStorage` is the substrate across 148 files** — synchronous, capped
   ~5–10 MB/origin. That is the ceiling on offline state. Target is IndexedDB
   behind the `Storage` interface (W17), which is also the RN seam.
3. **Only SRS has an offline write path.** Lesson completion, XP, and quests go
   straight to the API and need the same outbox-queue treatment.

Sizing, measured from `dist/`:

| Layer | Size | Offline tier |
|---|---|---|
| JS (157 chunks, uncompressed) | 11 MB | required |
| Dictionary | 17 MB | opt-in |
| Noto emoji (403 SVG) | 2.7 MB | required |
| **TTS audio (14,944 mp3)** | **240 MB** | **per-module** |
| Total `dist/` | 295 MB | — |

Audio is 81% of the payload and the only layer needing a real strategy.
`ja.json` carries 11,051 clips over ~30 modules ≈ **368 clips ≈ 6 MB/module**.

---

## T4 — Offline cost

CloudFront egress at $0.085/GB (first 10 TB, NA/EU):

| Scenario | Per user | At 5,000 MAU |
|---|---|---|
| Current (stream on demand, ~5 MB/mo) | $0.0005 | $2.50/mo |
| One module pack (6 MB) | $0.0005 | $2.50 |
| **Full corpus prefetch (244 MB)** | **$0.0203** | **$101 one-time** |

A full-corpus download is **40× the entire current monthly bandwidth budget per
user** and ~3× total per-user AWS cost ($0.007).

**Decision: per-module packs, opt-in, fetched on module entry. Never a
full-corpus prefetch.** That keeps offline inside the existing $0.007/user
envelope.

**Adjacent finding:** the TTS CDN is unauthenticated, paths are deterministic
(`sha256("<lang>:<text>")[:16]`), and the manifest ships in the public repo. The
whole corpus is enumerable by anyone for $0.02 of our money. Not urgent; a WAF
rate-limit rule on `/tts/*` is a $0 fix.

---

## T5 — Content licensing (the real "stealability" lever)

**Highest-value finding in this pass.**

`lingo-data` got a deliberate dual license: CC-BY-4.0 for data, MIT for pipeline
code. Someone thought carefully about that.

The main `lingo` repo did **not** get that treatment, and it now holds 9.3 MB of
authored curriculum — the most expensive asset we own and the thing agents are
generating more of right now. Under a bare repo-root MIT license that curriculum
is **MIT by default**: anyone may take it, close it, sell it, and owe nothing but
a license file. At minimum it is legally ambiguous, and the ambiguity is itself
the problem.

**Proposed fix** (a licensing change, not a secrecy change):

- `src/**` code → stays **MIT**
- `src/features/languages/*/curriculum/**` → **CC-BY-SA-4.0**

Share-alike is the actual anti-freeload lever: a competitor forking the
curriculum must open their improvements. That is what content secrecy was
supposed to buy, and it costs nothing in openness.

**Caveats:** clean only while we hold all copyright (solo + Trevor +
AI-assisted is fine; outside contributions complicate it) — so **earlier is
cheaper**. Add a CLA or DCO now to keep ownership clean. CC-BY-NC would block
commercial use but is generally not considered open source and would break the
ethos.

---

## T6 — Open-source boundary

| Asset | Instrument | Open? |
|---|---|---|
| Code | MIT | yes |
| Curriculum | CC-BY-SA *(T5 fix pending)* | yes, share-alike |
| Data | CC-BY | yes |
| Ops/finance | private repo | no |
| **The name** | **trademark** | **no — and that's the moat** |

**Trademark is the one form of IP that stays proprietary while everything else
is open source.** We can MIT the code, CC-BY-SA the curriculum, publish all six
repos — and still forbid anyone from shipping a fork called "Open Lingo." That
is how Linux, Mozilla/Firefox, and Redis work. The name is the asset that
cannot be forked.

The moat under a Valve model is never the bits — it is that self-hosting is more
trouble than it is worth: hosted sync, the social graph, the TTS CDN, content
freshness, and the brand. None require secrecy.

**Residual risk, stated honestly:** a funded clone takes MIT curriculum + CC-BY
data and outspends us on acquisition. Share-alike on content is the mitigation.
Secrecy is not available.

---

## T7 — Store economics

Stripe's **$0.30 fixed fee** is what makes micro-transactions bad on web. App
store IAP is percentage-only, and we qualify for both small-business programs at
15%.

| Tier | Stripe net | IAP net (15%) | Winner |
|---|---|---|---|
| $1/mo Supporter | $0.67 | **$0.85** | IAP, +27% |
| $5/mo Patron | **$4.56** | $4.25 | Stripe |
| $50 lifetime | **$48.25** | $42.50 | Stripe |

**Crossover is $2.48.** Below it IAP nets more; above it Stripe does.

**Implication:** Supporter via IAP on mobile, Patron and Lifetime pushed to web.
This *inverts* the common assumption that app stores would wreck the $1 tier —
the $1 tier is the only one that gets **better** on mobile.

⚠️ Verify current Apple external-purchase-link rules before committing; the 2025
US injunction opened up linking out, and that landscape moves.

---

## T8 — Trademark and copyright

> Not legal advice. An attorney clearance search (~$300–800) is the actual gate
> before filing. This is the research to walk in with.

### The key find

**OPEN LINGUA** (serial 97123901, Open Education LLC) filed 2021-11-14 in
**exactly** classes 9, 41, 42 for language-learning software and instruction. It
cleared examination, published, drew **no opposition**, and received a Notice of
Allowance — then was **abandoned 2023-07-31** for failure to file a Statement of
Use.

Three consequences: the USPTO does **not** treat "OPEN + language-root" as
unregistrable for this exact goods/services set; **nobody opposed it, including
Duolingo**; and a dead mark blocks nothing, so the lane is empty.

### Candidates

| | Distinctiveness | Main risk | Filing basis available |
|---|---|---|---|
| **Open Lingo** | suggestive/descriptive | §2(e)(1) descriptiveness; crowded field | **§1(a) now** (in use) |
| **Linguiversal** | coined | ~none legally | §1(b) ITU only |
| **Hiraku** | arbitrary in EN | doctrine of foreign equivalents | §1(b) ITU only |

**The ITU trap:** a §1(b) application must convert to a Statement of Use within
6 months of the Notice of Allowance, extendable in 6-month increments
($125/class each) to a **36-month hard ceiling**. Miss it and everything is
lost — exactly how OPEN LINGUA died. **An ITU filing is not a defensive
placeholder; it is a commitment to rebrand within 36 months.**

**Hiraku** (開く, "to open") is conceptually perfect but legally weakest: the
doctrine of foreign equivalents means the USPTO translates common foreign words,
and for a *Japanese*-learning app an examiner is likely to — at which point
"open" becomes the same descriptiveness argument. It also only carries meaning
for JA, and we ship ES and KO.

### Domains (measured 2026-08-06)

| Domain | Status |
|---|---|
| `openlingo.com` / `.app` / `.org` | taken |
| `openlingoapp.com` | **ours** (Amazon Registrar) |
| `linguiversal.com` | **ours** (Amazon Registrar) |
| `hiraku.com` | taken — parked at Sav.com (resale marketplace; likely purchasable) |
| `hiraku.app` / `hiraku.io` | taken |
| `hirakuapp.com` | available |

Domain occupancy says nothing about registrability. `openlingo.com` being taken
does not block the **OPEN LINGO** wordmark.

### Costs

| Item | Cost |
|---|---|
| USPTO base fee | **$350 per class** (Jan-2025 restructure; TEAS tiers eliminated; file via Trademark Center) |
| Surcharge — insufficient info | +$100 |
| Surcharge — free-form description (not ID Manual) | +$200 |
| Surcharge — per extra 1,000 characters | +$200 |
| Classes 9 + 41 + 42 | $1,050 |
| **Class 9 only** (the app-store shield) | **$350** |
| Attorney clearance search | $300–800 |
| ITU extension (if ever needed) | $125/class per 6 months |

**Copyright:** attaches automatically at creation — we own the curriculum today
with no filing. Registration buys standing to sue in federal court and
eligibility for **statutory damages + attorney's fees**; without it, actual
damages for a free app round to zero, making an unregistered claim practically
unenforceable. Current fees $65 standard / $45 single application, but the
Copyright Office's 2026 fee study proposes **$85 standard and eliminating the
$45 Single Application** (sent to Congress July 2026, 120-day review). Group
registration is the efficient route for curriculum.

### DECISION (Spencer, 2026-08-06)

**Defer the filing.** Operate ~1 month in hobby communities for real feedback
first. Do all zero-cost measures now. **Tripwire: file Class 9 before any app
store submission** — see `ECONOMICS.md` § Tripwires.

Rationale: risk is visibility-triggered, and hobby communities are
pre-visibility. The tripwire is unfired, not violated.

**Free measures to run now:**

- `™` on the wordmark — legal today, accrues common-law rights
- `© 2026 Open Lingo` notice — defeats the innocent-infringement defense
- CC-BY-SA on curriculum (T5) — highest-value free move
- CLA or DCO on contributions — keeps ownership clean for later registration
- **Pin first-use-in-commerce date with evidence** — dated screenshots showing
  the mark on the product, plus a deliberate archive.org capture. A §1(a) filing
  requires two dates (first use anywhere, first use in commerce) and misstating
  them can invalidate a registration.
- **Never use `®` before registration.** Not criminal, but the consequences are
  real: forfeiture of infringement damages under 15 U.S.C. §1111, possible
  refusal of the application for fraud, §43(a) exposure, unclean hands in a
  later proceeding.

### Two things that do NOT help, despite intuition

- **More hobby testers do not strengthen the filing.** The standard is *bona
  fide use in the ordinary course of trade, not made merely to reserve a right*.
  TMEP guidance names "providing services for little or no money" and "selling
  only to friends and family" as examples of **token** use. Free distribution
  inside a small community sits closer to that line than a public launch, not
  further from it. What makes our use bona fide is AdSense, planned paid tiers,
  a public domain, and a real product — not headcount.
- **A month does nothing for descriptiveness.** Acquired distinctiveness under
  §2(f) is the cure for the §2(e)(1) risk, and the prima facie showing needs
  **five years** of continuous exclusive use (and is deemed insufficient
  outright for a *highly* descriptive mark). Do the month for product feedback,
  which is a good reason on its own.

### Unverified — confirm before relying on

- TTAB cancellation at $5,000–25,000 and 1–3 years (order-of-magnitude only).
- "Repeat IP complaints escalate to developer account termination" —
  consistent with developer agreements, not verified for trademark complaints.
- "Class 9 is the operative class for app store IP complaints" — inferred from
  what Class 9 covers, not verified against Apple/Google adjudication practice.
  This is the reasoning behind the $350 recommendation; ask the attorney.

---

## Next actions, by leverage

1. **Dual-license the curriculum (T5)** — hours of work, closes the one
   irreversible exposure, gets harder every week more content lands.
2. **PWA spike (T1/T3)** — manifest + icons + service worker + one module's
   audio pack. Proves offline, mobile, and the cost model at once. See
   `docs/mobile-testing-setup-2026-08-06.md`.
3. **`Storage` interface over 148 `localStorage` sites (W17)** — unblocks
   IndexedDB (offline ceiling) and RN with one change.
4. **`data-testid="primary-cta"` on the remaining 18 step views** — makes the
   gate mean what its name says.
5. **Evidence capture for first-use date (T8)** — ten minutes, benefits from
   starting now.

## Not yet in `docs/INDEX.md`

The index job has **no mobile or offline entries at all** (`grep -i
"mobile\|offline\|pwa" docs/INDEX.md` → nothing), so
`mobile-research-2026-07-20.md`, `mobile-handoff-2026-07-20.md`, and this doc
are invisible to it. Worth an index pass.
