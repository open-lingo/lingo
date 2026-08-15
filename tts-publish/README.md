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
