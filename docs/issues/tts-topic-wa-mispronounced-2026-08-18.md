# TTS reads topic は as /ha/, not /wa/

Reported by Spencer 2026-08-18 during the m31 walk, on the m31 L1 build step
「ははは せんせいに はなを あげる。」 — heard as **"haha ha"** where it must be
**"haha wa"**.

## What is wrong

は has two readings. As a syllable it is /ha/; as the TOPIC PARTICLE it is
/wa/. The clip is reading the particle as the syllable. Same class of bug
applies to へ (/he/ vs particle /e/) and を (/wo/ vs /o/) — worth checking
those in the same pass.

Worst case is a word ENDING in は followed by the particle, because the
listener gets three identical morae and no cue: はは + は. That is the exact
sentence Spencer hit.

## Blast radius — 21 sentences, 3 modules

Counted over `src/features/languages/ja/curriculum/ir/*.ir.yaml`, sentences
containing `ははは`:

| module | count |
|---|---|
| m17 | 8 |
| m21 | 3 |
| m31 | 4 (incl. the reported one) |
| other `はは`+`は` shapes | remainder of the 21 |

Reproduce: `grep -ho 'ja: "[^"]*"' src/features/languages/ja/curriculum/ir/*.ir.yaml | grep -c 'ははは'`

This is only the ははは case. The BROADER set — every sentence where は is a
topic particle anywhere — is far larger and is the real scope. The 21 are just
the ones where a listener cannot recover from the error by context.

## Not yet diagnosed

Unknown whether the fault is:
1. the TTS provider's own JA text normalisation (most likely — many engines
   need the particle disambiguated), or
2. our emitter sending raw kana with no reading hint, or
3. the specific voice/model in `scripts/emit-tts-deck.mjs`.

Check 2 first — if the emitter can send は as わ in the SSML/phoneme layer
while the DISPLAYED text stays は, that is a contained fix and needs no
re-authoring. Do NOT "fix" this by writing わ in the IR: the learner must see
は, and changing the surface would corrupt the curriculum to work around an
audio bug.

## Cost note

Any fix means REGENERATING the affected clips. m31's 45 new clips are already
staged in `tts-publish/ja/` un-uploaded (needs Trevor's AWS creds), so fixing
this before that upload costs one regeneration instead of two.

---

## TO-DO — BLOCKED ON SPENCER (opened 2026-08-18)

Spencer: *"link the ha clips and make them a to-do."* Three A/B clips of the
same m31 sentence were sent in-conversation on 2026-08-18. **The decision is
which one we ship.** Nothing downstream can proceed until it is made.

| # | what it is | trade |
|---|---|---|
| 1 | current — kana `ははは` as authored | wrong: reads "haha **ha**" |
| 2 | kanji surface `母は` fed to the synth | correct reading, but the hash key changes |
| 3 | forced `ははわ` fed to the synth | correct reading, hash key changes, and the LEARNER MUST STILL SEE は |

Clips are NOT committed — this repo does not carry audio (CLAUDE.md, §TTS).
Regenerate all three in ~5 s:

```sh
cd ../lingo-data && VIRTUAL_ENV=$PWD/.venv .venv/bin/python - <<'PY'
import asyncio, edge_tts
V = "ja-JP-NanamiNeural"
for name, text in [("1-current-kana", "ははは せんせいに はなを あげる。"),
                   ("2-kanji-surface", "母は 先生に 花を あげる。"),
                   ("3-forced-wa",     "ははわ せんせいに はなを あげる。")]:
    asyncio.run(edge_tts.Communicate(text, V).save(f"/tmp/{name}.mp3"))
PY
```

### What the answer unblocks

The real fix is **`speechText` separate from the hash key** — the emitter
synthesizes one string and the learner sees another, so 「ははは」 stays on
screen (invariant: never write わ into the IR to fix a synth bug) while the
synth receives whichever of #2/#3 wins.

Sequence matters for cost: **decide BEFORE Trevor's upload run.** Deciding
after means regenerating and re-uploading the affected clips a second time —
21 sentences across m17 (8), m21 (3) and m31 (4), plus the remaining
`はは`+`は` shapes.

Also unchecked, same bug class: **へ** (/he/ vs particle /e/) and **を**
(/wo/ vs /o/). Worth sweeping in the same pass.
