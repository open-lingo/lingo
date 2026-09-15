# `tts-publish/` — incremental audio publish staging

Clips in here are uploaded to `s3://<site bucket>/tts/v1/` by the deploy
workflow (see the "publish staged TTS audio" step in
`.github/workflows/deploy.yml`), preserving the directory layout
(`ja/<hash16>.mp3` → `tts/v1/ja/<hash16>.mp3`).

## Why this exists

The designed pipeline is `lingo-data`'s `pipeline.tts.upload`, which needs
AWS credentials that agent machines don't have. The 2026-08-15 M31 wave
shipped its manifest update with the mp3s still sitting in
`lingo-data/out/tts` — every new hash resolved to the SPA-shell HTML
fallback in prod (a manifest hash without an uploaded object fails
*halfway*: controls render, playback breaks). This directory lets a content
wave carry its own audio through the same OIDC-authenticated deploy that
ships the manifest, so the two can never land separately.

## Rules

- **Only NEW clips.** Filenames are content hashes; bytes for an existing
  key never change. Don't re-stage the corpus.
- The upload step must **never use `--delete`** — the live corpus (~14.7k
  objects) is not in this directory, and a delete-sync wipes it (that
  exact incident: 2026-07-29).
- Safe to empty the directory once the clips are confirmed live (curl a
  sample; expect `content-type: audio/mpeg`). Keeping them costs ~4 MB of
  repo weight per wave; the repo carried the full corpus pre-CDN, so this
  is not precious.
- After authoring: verify your wave landed with
  `npm run module-gate -- mN` (stage 2 hashes every deck card against the
  manifest) AND a prod curl of one new hash.

## Live snapshot + the commit-time coverage gate

`tts-publish/live/<lang>.txt` (sorted, one hash per line) records which
manifest hashes were confirmed live on the CDN as of a sweep with
`node scripts/tts-live-snapshot.mjs <lang> [<lang> ...]` (omit langs to sweep
every manifest). It exists because a hash can be genuinely published — by an
older `lingo-data` upload, not staged here — and `manifestCoverage.test.ts`
has no other way to know that without HEADing the CDN on every test run.
Regenerate it: after a deploy that publishes new clips from this directory
(so the old snapshot doesn't go stale-optimistic), and before emptying a
language's staged directory (the emptied hashes must show up live first, or
the gate below fails). `src/shared/tts/manifestCoverage.test.ts` fails a
manifest whose hashes are neither in `tts-publish/<lang>/` nor in this
snapshot — the 2026-09-13 class of bug (589 unpublished ES hashes) that
`verify-tts-cdn.mjs`'s 25-sample check missed.

## Known consequence: visual-QA capture goes red between wave and deploy

Once a wave's manifest lands but before its mp3s are uploaded, every new hash
resolves to the SPA shell (`content-type: text/html`, HTTP 200 — it is a
CloudFront SPA fallback, not a 404). The app treats the clip as present, issues
the request, and the audio element never settles, so `visual-qa:capture` hangs
on any listening/cloze step and times out.

Measured on the m33 wave (2026-08-19), same lesson `ja-m33-neo-5`, same tree:

| manifest | capture result |
|---|---|
| pre-m33 | passes (1.3m) |
| m33 (312 new hashes staged, none uploaded) | times out on `cloze-6` |

So the gate's stage-4 red in that window is **expected**, not a content defect.
Capture the module BEFORE copying the new manifest in (that run is the visual
evidence), or re-run stage 4 after the deploy has published `tts-publish/ja/`.
Do not "fix" it by reverting the manifest — manifest and mp3s must ship in the
same commit, which is the entire reason this directory exists.

## Exception logged 2026-08-20: five repaired clips OVERWRITE existing keys

The は/wa repair (issue doc `tts-topic-wa-mispronounced-2026-08-18.md`)
re-recorded five clips whose keys already exist in the live corpus:

    0fc983c7ad8d207c  19a20cdbe0fe120e  35ec2c9066e4bef8
    4162f807838d3542  d4dc70aea90c6f02

This is the one sanctioned violation of "bytes for an existing key never
change" — the old bytes are mispronunciations (whisper-audited, 5/16 of the
ははは class). **Trevor: after the sync, these five paths need a CloudFront
invalidation** (`/tts/v1/ja/<hash>.mp3`) or the edge keeps serving laughter
until the cache ages out.

## Exception logged 2026-09-15: three repaired clips OVERWRITE existing keys

TestFlight b13 #93/#106 (Spencer) + an ASR sweep of all 1,986 JA word clips
(mlx-whisper large-v3-turbo, hiragana-biased prompt; report in the session
ledger `docs/handoff-2026-09-11-mobile-qa.md`). The Edge voice reads a
word-initial は as the particle "wa" deterministically for three bare-kana
inputs (3/3 fresh regenerations each), and `emit-tts-deck.mjs` only ever
sends `kana:`, so the fix is to synthesize from the kanji surface:

    8530adec0baac792  はなたば → was "wanataba", now from 花束
    7a73690384245d2c  はれる   → was "wareru",   now from 晴れる
    7d9d47d68906587d  はし     → was "washi",    now from 箸 (chopsticks;
                                the 橋 atom shares this kana-keyed clip —
                                Spencer's call: "pick one kanji and use it")

Same rule as the 2026-08-20 entry: after the sync these three paths need a
CloudFront invalidation (`/tts/v1/ja/<hash>.mp3`). わたし (#100) did NOT
reproduce (live clip + 5 regenerations all read わたし) — left as is.
