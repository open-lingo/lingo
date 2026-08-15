# Load-time follow-ups — 2026-08-15

**Status: OPEN backlog.** What remains after the two shipped waves, with the
measurements that motivated each item. Shipped context: service-worker
precache + idle chunk prefetch + web refresh-token auth + lazy TTS manifests
(lingo `a6cec77f`), batched `GET /boot` + client boot cache (lingo `f2feb5ff`,
lingo-core `eba61b0`).

Where things landed (measured on prod, authed session, 2026-08-15):
- Repeat open: UI painted ~100 ms, ~4 KB network (was ~2–4 s / 1.9 MB).
- Boot data: ONE `/boot` call — 2.6 s on a cold Lambda, 0.9–1.5 s warm —
  replacing six parallel calls at 2.4–2.9 s *each* cold.

## 1. Apply the Lambda warmer (one `terraform apply`, ~$0.01/mo)

`lingo-infra/lingo_core_warmer.tf` (commit `6d17bc1`) is WRITTEN BUT NOT
APPLIED — agent machines have no AWS creds. Until applied, the day's first
`/boot` still pays one ~2.6 s cold start; with it, the common case is the
~1 s warm path. The handler short-circuit already shipped. This is the
single highest-value remaining action.

## 2. ~570 ms per-request floor on the warm path (needs CloudWatch)

`GET /health` — no auth, no DB, trivial middleware — measured ~570 ms TTFB
*on a reused TLS connection*. The access-log middleware prints server-side
ms to CloudWatch; if that shows single-digit ms, ~half a second per request
is burning in the function-URL/invoke path (WAF? Mangum? payload
buffering?) and is worth an infra conversation. Every API call pays this.

## 3. Post-hydrate duplicate refetches (client, cheap)

Each app open refetches `progress/me` (2×, was 4× pre-batching) and
`quests` (2×) within seconds of the boot batch — an invalidation firing on
mount. Harmless, but ~600 ms × 3 of warm Lambda work per open. Find the
mount-time `invalidateQueries` and make it respect `staleTime`.

## 4. `decks/batch` into `/boot`

Fires on every open (~600 ms warm) a beat after the boot wave. If it stays
on the hot path, add it to `BootResponse` (needs its request params folded
in — it takes a deck-id list, so either server-derive the course deck or
have the client pass ids via query on `/boot`).

## 5. Entry chunk diet, round 2 (~1.98 MB raw / 527 KB gz)

`mockCourse` (136 KB) + `courseAtoms` (244 KB) source data still ride the
eager entry. Moving them behind the existing `mockLessons` async boundary
(or a hashed-URL JSON fetch) roughly halves remaining mobile parse time.
First-visit-only win now that the SW covers repeats.

## 6. CDN policy for `index.html` (infra, blocked on finding the distro)

The shell is `no-cache` — `x-cache: Miss` on every request, ~0.5–0.7 s of
origin round trip for first-time/SW-less visitors. A short-TTL (60–300 s)
or stale-while-revalidate policy is safe since deploys already invalidate.
⚠️ The app's distribution (`app.openlingoapp.com`) is in NO lingo-infra
`.tf` file — `static_site.tf`'s apex claims are stale (apex = marketing
now). Resolve `LINGO_CLOUDFRONT_DIST_ID` first; do not edit the apex distro.

## 7. SW runtime cache can still pin a deleted hashed ASSET as HTML

The `/tts/*.mp3` rule now refuses non-`audio/mpeg` responses (the
distribution maps 403/404 → SPA shell with a 200). The `hashed-assets`
rule has no equivalent guard — legit content-types vary (js/css/woff2), so
header-equality can't express "anything but text/html" under `generateSW`.
Exposure: requesting a chunk hash deleted by a newer deploy caches the
shell as that chunk until the next SW update. Pre-SW behavior was a
lazyRetry reload; fix properly by switching to `injectManifest` with a
custom plugin when the SW next gets real work.

## 8. Per-language TTS manifest loading

`preloadTtsManifests()` fetches all four languages (~150 KB gz total) —
fine today, but the module's own header says to go per-language when the
6k-word frequency lists land (~650 KB bundled total at that point).

## 9. Smaller

- Self-host/preload fonts (~100–300 ms; render-blocking
  fonts.googleapis.com CSS, 423 KB response).
- Lambda 512 → 1024 MB: likely halves the ~2.6 s cold init for single-digit
  $/mo. Only matters until/unless the warmer makes colds rare.
- Preload the first lesson step's audio while the lesson chunk loads.
