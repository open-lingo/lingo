# Ad placement guide

Add Google AdSense units in the app. The **framework is wired**; which pages get units is still your call.

**Also read:** [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) (revenue APIs, funding meter — not an ad unit).

---

## Rules

| Rule | Detail |
|------|--------|
| Consent | Advertising cookies must be on (`useAdsEnabled()`). |
| Config | Without `VITE_ADSENSE_CLIENT` + slot ids, components render nothing. |
| Premium (future) | Pass `premiumActive={true}` to hide units for subscribers. |
| Study UX | No ads during active review (card flip, lesson steps, drills). Use hubs and lists. |
| Landing / legal | Global banner is **off** on `/landing`, `/privacy`, `/terms`, `/about`, `/login`. |

---

## Environment

Full list: [README → Environment variables](../README.md#environment-variables).

| Env | Maps to |
|-----|---------|
| `VITE_ADSENSE_CLIENT` | Publisher id (`ca-pub-…`) |
| `VITE_ADSENSE_SLOT_BANNER` | `slot="banner"` |
| `VITE_ADSENSE_SLOT_INLINE` | `slot="inline"` |
| `VITE_ADSENSE_ENABLED` | `false` disables all ad UI |

Create units in [AdSense → By ad unit](https://www.google.com/adsense/). Host **`ads.txt`** at site root before going live.

`Layout` loads `loadAdSenseScript()` on mount and on `open-lingo-cookie-consent`.

---

## Components

Import from `@/features/ads`.

| Export | Use |
|--------|-----|
| `AdSlot` | One unit on any page |
| `CollapsibleAdBanner` | Fixed bar above funding meter (already in `Layout`) |
| `useAdsEnabled(premiumActive?)` | Gate custom sponsored UI |
| `loadAdSenseScript` | App shell only (already in `Layout`) |

**`AdSlot` props:** `slot` (`banner` \| `inline`), `format` (`auto` \| `horizontal` \| `rectangle`), `className`, `premiumActive`.

Each `AdSlot` calls `pushAdSenseSlot()` once after mount — avoid stacking many units in one viewport.

**`CollapsibleAdBanner`:** sits at `bottom: var(--funding-meter-height)`; collapse stored in `sessionStorage` (`open-lingo-ad-banner-collapsed`); i18n `ads.*`.

---

## Add a placement

**Inline (typical):**

```tsx
import { AdSlot } from "@/features/ads";

<AdSlot slot="inline" format="rectangle" className="my-4 max-w-md mx-auto" />
```

**Sidebar:**

```tsx
import { AdSlot, useAdsEnabled } from "@/features/ads";

function Sidebar() {
  if (!useAdsEnabled(false)) return null;
  return (
    <aside className="hidden lg:block w-48 shrink-0">
      <AdSlot slot="inline" format="auto" />
    </aside>
  );
}
```

**New slot type:** create unit in AdSense → add env + entry in `src/features/ads/config.ts` (`AdSlotId`, `SLOT_ENV`) → use `<AdSlot slot="sidebar" />`.

---

## Placements

### Shipped

| Location | Component | Notes |
|----------|-----------|--------|
| Logged-in app shell (non-marketing) | `CollapsibleAdBanner` | Needs env + Google approval for real fills |

### Backlog (suggested)

| Area | Slot | Notes |
|------|------|--------|
| Community browse | `inline` | Below filters / between sections |
| Flashcards hub | `inline` | Not inside `FlashcardTester` |
| Learn hub | `inline` | Not during lesson steps |
| Story / content lists | `inline` | Watch layout shift; wrapper has `min-h-[50px]` |
| Lesson complete | `inline` | Natural break only |
| Landing | `banner` | After approval; adjust `isMarketingRoute` in `Layout` |
| Settings | `inline` | Optional; low priority |

**Avoid:** mid-quiz UI, modals over primary actions, multiple visible units per viewport without review.

When you ship a row, move it to **Shipped** and check the box below.

---

## Layout notes

- Funding meter: fixed bottom, `z-[100]`, `--funding-meter-height`.
- Collapsible banner: `z-[95]`, above meter.
- Prefer in-flow `AdSlot` over a second fixed strip unless you add bottom padding.

---

## Checklist (new placement)

- [ ] Hub/list/idle screen — not mid-study
- [ ] `AdSlot` / `useAdsEnabled` (no manual `adsbygoogle` script)
- [ ] Matching slot id in env
- [ ] Consent on / off tested; `VITE_ADSENSE_ENABLED=false` tested
- [ ] **Shipped** table updated in this file

---

## Files

```
src/features/ads/          config, adsense, useAdsEnabled, AdSlot, CollapsibleAdBanner
src/routes/Layout.tsx      script load + CollapsibleAdBanner
src/features/legal/        CookieConsent
src/shared/legal/          cookieConsent helpers
src/features/funding/      funding meter (not AdSense)
```
