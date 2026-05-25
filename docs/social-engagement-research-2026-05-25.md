# Social Engagement & Virality — Research + Design (2026-05-25)

What makes social features hook users, get friends participating, and propagate via invitations — applied to Open Lingo. Read alongside [`superpowers/specs/2026-05-18-social-page-design.md`](./superpowers/specs/2026-05-18-social-page-design.md) (existing social spec), [`ECONOMICS.md`](./ECONOMICS.md) (lingot + Patron tiers), [`ADS_PLACEMENT.md`](./ADS_PLACEMENT.md) (how "ad-free time" plugs in).

---

## 1. The engagement loops that work

For each: short paragraph + citation + **Fit for Lingo** call.

### Streaks (Duolingo, Snapchat)
Daily-reset counters weaponize loss aversion — losing progress hurts more than gaining feels good. Snapchat streak users open the app 3.2× more per day than non-streak users; cue (flame) → action (send) → reward (counter ticks) becomes habit. Freeze items soften the cliff. See [Screenwise](https://screenwiseapp.com/guides/the-psychology-of-snapchat-streaks).
**Fit for Lingo: yes.** Streak already exists; add a buyable freeze before shame.

### Leagues / divisions (Duolingo)
Weekly 30-user cohort ranked by XP; ±5 promote/demote each Monday. Demotion drives re-engagement harder than promotion because more users sit in the demote zone than the promote zone at any time. Reversible (next week resets), no permanent stigma. Correlates with ~25% lift in lesson completion per [Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/leagues).
**Fit for Lingo: yes**, defer until backend cohort job exists. Mock UI in `LeaderboardsSection.tsx`.

### Public progress / activity feeds (Strava, GitHub graph)
Passive social presence — seeing friends' activity is engaging without requiring interaction. Strava logged 14B+ kudos in 2025 (+20% YoY); lightweight feeds compound. See [Strava strategy](https://www.latterly.org/strava-marketing-strategy/).
**Fit for Lingo: yes.** `ActivityFeedStrip.tsx` is the right shape; needs real data.

### Kudos / reactions (Strava, Instagram)
One-tap acknowledgment is the lowest-friction social contract. Recipient gets a dopamine ping, sender pays nothing. Strava's kudos remains its most-used primitive a decade in. ([source](https://www.marathons.com/en/featured-stories/strava-chasing-kudos-and-social-recognition/))
**Fit for Lingo: yes.** `KudosButton` already ships; add 1-2 more reaction emojis (👏, 🔥), don't go full Slack picker.

### Friend challenges / head-to-head (Duolingo Friends Quest)
Shared 1-1 or small-N goals ("50 lessons together this week") create reciprocal accountability — dropping out is visible. Per [Trophy.so](https://trophy.so/blog/duolingo-gamification-case-study).
**Fit for Lingo: maybe.** Needs challenge schema + notifications. Post-MVP.

### Parties / guilds / clans (Habitica)
Small-group accountability beats 1-1 because one drop-out doesn't kill the group. Habitica recommends ≥4 members; quests are party-locked. See [Habitica Wiki](https://habitica.fandom.com/wiki/Party).
**Fit for Lingo: no, not yet.** Group chat moderation is real cost — esp. if user base skews young (§4).

### Streak freezes / save mechanics
A single missed day shouldn't nuke a 90-day investment. Duolingo's freeze is a lingot-priced consumable that auto-applies — reduces rage-quit churn and gives the lingot economy a sink. (claim — widely cited in Duolingo product writeups; no measured citation)
**Fit for Lingo: yes, S.** Aligns with [`ECONOMICS.md`](./ECONOMICS.md) lingot economy.

### Variable rewards / mystery boxes
Variable schedules beat fixed ones (Skinner). Common in casual games; ethically dicey for kids — Snapchat-streak research flags problematic-use patterns ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2772503023000476)).
**Fit for Lingo: no.** If we ship daily-chest, narrow variance band, no spend-to-roll.

### Identity / customization (avatars, badges)
Personalization investment compounds — IKEA / sunk-cost effect makes invested users harder to churn. `UserAvatar` frame slot + `UsernameDisplay` cosmetic prop are already scaffolded; Patron-tier cosmetics ([`ECONOMICS.md`](./ECONOMICS.md)) provide the monetization on-ramp. (claim — IKEA-effect lit is established, no Lingo-specific data)
**Fit for Lingo: yes.** Ship cheap cosmetics first; save animated/rainbow for Patron.

### Public commitment (Twitter "100 days of X")
Publicly stated intent triggers consistency bias — people follow through on promises others heard. (claim — Cialdini *Influence*; needs a measured citation)
**Fit for Lingo: maybe.** Opt-in "share my milestone" card on unit completion is cheap. Don't make it boastful.

---

## 2. Viral / referral mechanics — what actually moves the needle

**Two-sided beats one-sided, decisively.** 2,000+ Shopify merchants → two-sided programs see 2.3× more shares + 1.8× higher conversion ([Voucherify](https://www.voucherify.io/blog/how-to-launch-a-double-sided-referral-program)). Friend reward bumps share rate from 5–8% to 12–18% ([Bloop](https://bloop.plus/blog/best-referral-incentives/)). 90%+ of programs in production are two-sided.

**Dropbox is the canonical case.** Both sides got 500MB; 3900% user growth in 15 months, 35% of daily signups via referrals at peak ([Referral Rock](https://referralrock.com/blog/dropbox-referral-program/)). Critical detail: the invitee saw their bonus *first*, framed as a gift — not "your friend wants their reward."

**Reward type:** utility (storage, ad-free time, lingots) > vanity (badges). Time-limited utility ("7 days ad-free") creates urgency without permanent inventory inflation. Cash converts highest but breaks the Lingo margin and invites farming.

**Friction:** native share-sheet > deep link > copy-paste. Pre-fill invite text in user's locale.

**Anti-abuse:** invitee must complete a meaningful action (first full lesson) before reward unlocks. Cap referrals per inviter per month.

### Concrete proposal for Lingo

| Side | Reward | Unlock condition |
|---|---|---|
| Inviter | 100 lingots + **24h ad-free** | Invitee completes their first lesson |
| Invitee | 50 lingots + **24h ad-free** ("welcome boost") | Instant on signup via invite link (feels like a gift) |

- **Cap:** 10 successful referrals/month/inviter. Beyond that, the invitee still gets their bonus; the inviter just stops accruing.
- **Deep-link:** `https://lingo.app/invite/{short-code}` — 8-char alphanumeric, owner-scoped.
- **Ad-free stacks** up to ~14 days outstanding; beyond that, additional time discards — keeps Patron tier meaningful.
- **Disclosure:** plain copy, no fake countdowns or "spots remaining."

Backend: invite-code table (8-char short codes, FK to inviter, status enum), reward-unlock on `lesson:first-completed`, `user.ads_disabled_until` timestamp.

---

## 3. What I'd add to Open Lingo, ranked

| # | Feature | Effort | Impact | Dependencies |
|---|---|---|---|---|
| 1 | **Two-sided referral system w/ lingots + ad-free time** (§2). Inviter 100 lingots + 24h ad-free on invitee's first lesson; invitee 50 lingots + 24h ad-free instant on signup. Cap 10/mo. | M | high | Invite-code backend; `lesson:first-completed` event; ad-free expiry timestamp on user record |
| 2 | **Friend leaderboard (weekly XP)** — already mocked in `LeaderboardsSection.tsx`. Real friends API + simple weekly aggregate. Tighter peer reference group than the global league. | M | high | Friends graph API, weekly XP aggregate |
| 3 | **Streak freeze item** in shop (S). Lingot-priced consumable, auto-applies when daily window closes without activity. Reduces churn from one bad day. | S | med-high | Lingot-spend hook; freeze-slot in user state |
| 4 | **League system w/ promotion + demotion** (Duolingo model: 30-user weekly cohort, ±5 promote/demote). Big lift but biggest single retention driver in category. | L | high | Backend cohort-assignment cron, weekly XP reset job |
| 5 | **Activity reactions beyond Kudos** — add 👏, 🔥, and 💪 alongside 👋. Pure frontend, ships now off existing `KudosButton`. | S | low-med | None |
| 6 | **Friend challenge: 7-day streak race** — head-to-head, "first to 7 consecutive days wins X lingots." Visible progress in both UIs. | M | med | Challenge model, push notif, lingot grant |
| 7 | **Public milestone share card** — opt-in, share unit-completion card to native share sheet (no in-app post). Cheap virality. | S | low-med | Image-gen for share card (canvas or pre-rendered SVG) |
| — | Group/club system | L | med | Defer post-MVP — moderation cost real for possibly-young users |

---

## 4. What to AVOID (and why)

- **Permanent shame.** Demotion is fine; a "fell out of Diamond" trophy that lives on the profile forever is not. Reversible loss only.
- **Forced-share gates.** "Invite a friend to unlock the next lesson" reads as extortion, breaks trust, and doesn't convert — users bounce. Always provide a non-invite path.
- **Dark patterns.** No pre-checked share toggles, no fake countdowns, no vague reward terms. The transparent "you fund N learners" voice from [`ECONOMICS.md`](./ECONOMICS.md) is the brand standard; referral copy must match.
- **Slot-machine variance for kids.** Snapchat-streak research ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2772503023000476)) shows problematic-use patterns in adolescents. Daily-chest variance, if shipped, must be narrow and have no spend-to-roll. Confirm age band first (§5).
- **Public failure broadcasts.** "Trevor lost their streak" in friends' feed = hard no. Only positive milestones broadcast.
- **Unbounded ad-free accrual** via referrals. Cap outstanding ad-free time to keep Patron meaningful.

---

## 5. Open questions for the user

1. **Target age band.** Does Lingo accept under-13 accounts? COPPA-relevant. Gates which variance / streak / push mechanics are on the table.
2. **Lingot inflation policy.** Proposed referral rate = up to 1,000 lingots/mo per power user. Within planned sinks (cosmetics, freezes, shop), or halve the inviter reward?
3. **Ad-free vs Patron cannibalization.** Free users could stack weeks of ad-free time via referrals. Desirable Patron trial, or value-prop erosion?
4. **League scope for MVP.** Friend-leaderboard only first, or pair with global league? Friend LB needs only the friends graph; global needs a cohort cron.
5. **Push notification surface.** Streak-save, "friend passed you," challenge pings are high-impact but need web-push (or future mobile). In scope for this pass?

---

## Sources (all fetched 2026-05-25)

- Dropbox referral case — https://referralrock.com/blog/dropbox-referral-program/
- Two-sided vs one-sided referral data — https://www.voucherify.io/blog/how-to-launch-a-double-sided-referral-program
- Referral incentive benchmarks — https://bloop.plus/blog/best-referral-incentives/
- Duolingo Leagues mechanics — https://duolingo.deconstructoroffun.com/mechanics/leagues
- Duolingo gamification — https://trophy.so/blog/duolingo-gamification-case-study
- Strava marketing & kudos — https://www.latterly.org/strava-marketing-strategy/ · https://www.marathons.com/en/featured-stories/strava-chasing-kudos-and-social-recognition/
- Snapchat streaks psychology — https://screenwiseapp.com/guides/the-psychology-of-snapchat-streaks
- Snapchat streaks & problematic use — https://www.sciencedirect.com/science/article/pii/S2772503023000476
- Habitica Party mechanics — https://habitica.fandom.com/wiki/Party
