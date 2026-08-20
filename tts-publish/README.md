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
