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

## Exception logged 2026-09-15 (batch 2): kanji-default synthesis wave, 37 more OVERWRITE existing keys

Fable to-do from the sweep above: "emit the kanji surface to TTS by default
... regen the は-initial class." `scripts/emit-tts-deck.mjs` now resolves a
per-word kanji default from `courseAtoms.ts` (particles excluded; homophone
groups disambiguated "no-hyphen id wins" — see that file's header doc and
`scripts/tts-kanji-default.mjs`) and writes it as each card's `speech`
field, **`front`/the hash key stays kana** — confirmed 2026-09-15 that the
app always hashes kana, never the kanji-substituted display surface
(`applyKanjiSurfaces` never touches `audioKey`/`audioText`/`targetPhrase`).
`scripts/tts-emit-speech-overrides.mjs` merged the resolved pairs into
`pipeline/tts/speech_overrides_ja.json` (660 word-level entries, uncommitted
there per the no-commit rule); regenerated via that file's existing
`Job.speech` mechanism (`EdgeTtsProvider`, `ja-JP-NanamiNeural`) — same path
the ははは/母 and 「Xは？」 fixes above already used.

Target class: every atom kana starting with は/へ that has a kanji, every
homophone-group winner (12 of the 16 groups noted in the 2026-09-11 ledger
needed disambiguation; 4 resolve unambiguously once particles are excluded),
plus わたし (explicitly flagged, #100 — regenerates from 私 even though the
はh→わ defect didn't reproduce for it, per "kanji sources should be the
default regardless"). 45 candidates generated; ASR-verified with the
mlx-whisper large-v3-turbo harness (hiragana-biased prompt, pykakasi
kanji→reading normalization) against the ORIGINAL kana reading — 40 passed
exactly, 5 held back (not staged, old kana-sourced clip still live/unchanged):
に/はち/はたち transcribed as Arabic numerals by Whisper (likely a
verification-harness artifact, not an audio defect — not confirmed either
way, needs a human listen before anyone re-attempts them) and は (歯) /
はつか (二十日) genuinely mispronounced (は→"mi", はつか→garbled
"はつかいません") — the single-mora/short-word edge-tts fragility this
pipeline's own docs already call out.

    64a98a80455fb613  あつい → 暑い          17c614408eb82378  あめ → 雨
    449220ba8f9fb21a  かぜ → 風邪           bfcd800c8024d483  きる → 着る
    46212b1e9d336e4c  しめる → 閉める        c83b26ed8eeb982e  と → 戸
    6543a1a125f1f0ab  とる → 取る           1d6f1b47b63d5913  はいざら → 灰皿
    4083d82b4836d062  はいる → 入る          72e2d3ea0a93882d  はがき → 葉書
    b67b0ae30a76a1cc  はこ → 箱             b2191b70fdf42190  はこぶ → 運ぶ
    f649994ba8c7e8b1  はしる → 走る          fb63eb9582900f4b  はじまる → 始まる
    97ab451126ed4cc2  はじめ → 初め          8e3489d89e126bbe  はじめて → 初めて
    44dcb42be9a6a089  はじめる → 始める       c7667a4c017a7287  はずかしい → 恥ずかしい
    ebe48aaa5c659325  はたらく → 働く         6fee87ed851f722e  はっぴょう → 発表
    9c168b1be94a108e  はつめい → 発明         06cf6df6b53c07a0  はな → 花
    0ede7f6066162354  はなし → 話            d6e3fb2509581ac3  はなす → 話す
    2be00470e35f3d2d  はは → 母             c60ae77675ffa250  はやい → 速い
    310911911e14eb8f  はる → 春             4b51cedf7ed788a9  はれ → 晴れ
    7b1d680925df3e51  はん → 半             c7d84f8f92e55e2b  はんぶん → 半分
    8a26a2b9d987284e  ひく → 引く           ce12c350e4c492b6  ふく → 吹く
    008df843576c5838  へた → 下手           8be715a6ae87582a  へや → 部屋
    a1a1feb91fac9482  へる → 減る           f8b3956d04b55539  へん → 辺
    3e5676b36e2edcaa  わたし → 私

(はなたば/はれる/はし from batch 1 above also regenerated + re-verified this
run — same bytes/hashes, already staged, not re-listed.)

**Trevor: after the sync, all 37 of these paths (+ the 3 from batch 1 above,
40 total) need a CloudFront invalidation** (`/tts/v1/ja/<hash>.mp3`) or the
edge keeps serving the old kana-sourced pronunciation until the cache ages
out. Upload + invalidation commands are in the session report (not run from
here — no S3/CloudFront access in this lane).
