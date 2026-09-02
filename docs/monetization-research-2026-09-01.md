# Monetization research — and the decision (2026-09-01)

**Decision (Spencer, 2026-09-01): stay free for now.** No ads at launch, no
external-purchase link-out, no energy/hearts system. Revisit with real
retention and conversion data.

## Where the code actually stands

Verified 2026-09-01, not assumed:

- **No IAP/StoreKit anywhere.** The iOS app cannot take money today at all.
- The **Shop** sells cosmetics and ad-free time for **lingots (earned
  currency)** — no real-money purchase, so no Guideline 3.1.1 obligation.
- Ads exist only as a **web AdSense** integration (`src/features/ads/`), and are
  now explicitly disabled on native (see "Ads guard" below).

## Why no ads

**The money isn't there at launch DAU.** Full stack, calibrated against
Duolingo's *reported* ad revenue (the raw model ran 2.2x hot; reality factor
0.46 applied):

| Scenario | $/DAU/mo | 1,000 DAU | 10,000 DAU | 50,000 DAU |
|---|---|---|---|---|
| Rewarded only | $0.032 | $32 | $321 | $1,605 |
| + Interstitial | $0.216 | $215 | $2,155 | $10,773 |
| + Banner | $0.264 | $264 | $2,644 | $13,218 |

Three consequences:
1. **Rewarded alone is not a business** — $321/mo at 10k DAU won't cover
   integration plus review risk.
2. **The interstitial is ~75% of all ad revenue.** So "should we run ads" is
   really "should we interrupt end-of-lesson" — the part that costs retention.
3. Scaling is purely linear. Rewarded video also has a hard ceiling: eCPM falls
   ~4–5% per consecutive ad; past the 6th–7th a fresh interstitial beats another
   rewarded view. You cannot volume your way out of low ATT opt-in.

**The category trend points the same way.** Duolingo advertising was $21.05M in
Q2 FY2026, **+2% YoY against +23% DAU growth — −17% per DAU**. Ads are ~7% of
their revenue; **subscription is worth 12.3x advertising per DAU and widening**.
Their virtual-goods IAP line (the gems analogue) fell **23% YoY**. Meanwhile
Education has among the best subscription economics of any category
([RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps-2026-education)):
**3.1% D35** iOS download-to-paid, second only to Health & Fitness, and the
highest annual price point at **$44.99**.

**The honest counter-argument.** At 5% of DAU subscribed the full ad stack adds
~166% of subscription revenue; at 20% subscribed it adds ~41%, and a 41%
conversion hit erases it. **The worse conversion turns out, the more ads are
worth.** So this is a decision to make *after* conversion data exists — and
instrument a holdout from day one, because no trustworthy public cannibalization
data exists.

## Why no energy/hearts system

Energy **gates the core value and monetizes failure**, which is backwards for a
product whose thesis is the teaching sequence plus FSRS — it punishes exactly
the mistakes spaced repetition exists to convert into learning. Duolingo absorbs
that friction at 58.7M DAU because habit lock-in already exists; at launch DAU
the same friction produces churn, not conversion.

**On "a free week with no energy":** that ships the punishment and then suspends
it. It teaches users the app is annoying, and the trial's *end* makes the app
feel worse than day 1 — churn spikes exactly when you ask for money. Loss
aversion works for you when what is lost is a **benefit**, not relief from a
punishment. **Trial the upside instead.**

## If monetizing later — gate depth and breadth, never attempts

| | Free | Premium |
|---|---|---|
| Languages | one | all |
| Course depth | first N modules | full course |
| **SRS review** | **full** | full |
| Extras | — | Conjugation Trainer, grammar deck, offline, placement tests |

**Never gate review** — a user who stops reviewing stops seeing value. Put the
wall at a **module boundary**, never mid-lesson. Annual-primary pricing with a
monthly decoy and a 7-day trial; target beating **3.1% D35**.

Build path: **RevenueCat's Capacitor SDK** over raw StoreKit — receipt
validation, entitlements, and the conversion analytics needed to revisit the ads
question. *Their free-tier revenue threshold is unverified — check before
committing.* Real scope: IAP + entitlement checks + paywall + server-side
entitlement in `lingo-core`. **Not a pre-TestFlight item** — internal TestFlight
needs none of it.

## App Review risks in this area

🔴 **Guideline 5.1.4(a) is broader than the Kids Category:** *"Apps intended
primarily for kids should not include third-party analytics or third-party
advertising."* That is an **editorial judgment by App Review**, not a checkbox.
A [Feb 2026 forum thread](https://developer.apple.com/forums/thread/816277)
documents an Education app — 4+ rating, "Made for Kids" never selected, never
intentionally in the Kids Category — stuck in a rejection loop under Guideline
1.3, with Apple asserting it "was previously approved for the Kids category."
Remedies offered were parental gates or a **new App ID forfeiting years of
ratings**. Guideline 1.3 makes the flag sticky *"even if you decide to deselect
the category."* Unresolved.

**Action before submission:** audit metadata and screenshots for anything that
reads as child-targeted, and confirm the Kids Category flag has never been set
on Apple ID `6805652204`.

Other guideline notes (correcting commonly-cited numbers): the operative ad
guideline is **2.5.18**, not 1.4.x/4.x. Rewarded-for-currency is explicitly
permitted under **3.2.2(x)**. **3.1.2(a)** affirmatively contemplates a
subscription that includes consumable gems — but never make a subscriber watch
an ad for a subscription benefit. Under **3.1.1**, gems *purchased via IAP* may
not expire; **earned** gems may — so if you pool them, track provenance or
expire nothing.

## If ads are ever added

**AdMob only.** AppLovin is disqualified twice: its
[publisher policy](https://legal.applovin.com/policies-publishers/) forbids
initializing the SDK for any user qualifying as a "child" (termination-grade
COPPA exposure for a language app), and there is no Capacitor plugin — only a
stale Cordova shim. Unity shut down ironSource direct demand
([8-K, 2026-03-26](https://www.sec.gov/Archives/edgar/data/1810806/000181080626000016/a2026-03x26exhibit991.htm)).
Path would be `@capacitor-community/admob`, then bidding-only mediation partners
after ~30 days of clean baseline.

Two gotchas that fail silently:
- **Guideline 2.5.18 requires an in-app "report inappropriate ad" mechanism that
  AdMob does not provide.** You must build and route it yourself.
- **SKAdNetwork IDs**: paste
  [Google's full list](https://developers.google.com/admob/ios/quick-start#update_your_infoplist)
  into Info.plist, lowercase. The Capacitor AdMob plugin ships only Google's own
  ID; undeclared networks are silently dropped — no visible failure, just lost
  demand.

**ATT reality check:** two different numbers get called "opt-in rate" and they
differ 4–7x. Prompt-level (saw prompt, consented) is 35–50% — *that is what
vendors quote*. **Total consented share of all iOS users is 9–17%, and that is
what sets ad revenue.** Plan on ~10–18% for a US education app; education is
structurally the worst vertical because it skews toward minors and
family-managed devices that land in Apple's Restricted bucket (~13% of iOS
users) and are never prompted.

## Ads guard shipped with this decision

`isAdsFeatureEnabled()` and `loadAdSenseScript()` now both return early when
`IS_NATIVE`. Previously the only thing keeping AdSense off iOS was `.env.native`
not setting `VITE_ADSENSE_CLIENT` — a configuration accident. AdSense is a
web-only programme (apps must use AdMob), so loading it in the WKWebView would
breach Google's policy. The guard sits at **both** the master switch and the
script-injection chokepoint, because `routes/Layout.tsx` and `RewardedAdSlot.tsx`
call `loadAdSenseScript()` directly and never consult the master switch.
Pinned by `config.native.test.ts` and `adsense.native.test.ts`.

## Confidence flags

Carry these — they are load-bearing caveats, not hedging:
- **Every eCPM figure in existence is gaming-derived.** There is no published
  Education-category benchmark. Widely-cited "2026" numbers trace back to 2024
  forecasts citing MoPub, which shut down in 2022.
- The ATT eCPM gap (+51% CPM for consented) rests on
  [Feb 2022 FTC data](https://www.ftc.gov/system/files/ftc_gov/pdf/3-Skiera-Economic-Impact-of-Opt-in-versus-Opt-out-Requirements-for-Personal-Data-Usage.pdf)
  with no 2026 replacement. Direction right, magnitude unknown.
- Rewarded views-per-DAU for non-gaming apps is unpublished.
- The Supercell link-out claim is single-sourced.
- No app was run first-hand in this research.
