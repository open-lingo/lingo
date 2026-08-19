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

---

## 2026-08-19 — scope measured, and a correction to the cost of #2/#3

### The hash key does NOT have to change

The table above says options #2 and #3 change the hash key. That is true only
of the pipeline's CURRENT single-field design, and it is the field that should
change, not the decision.

`pipeline/tts/generate.py` builds one `Job` per card and uses `job.text` for
BOTH things: `cache_key` (→ `hash16` → the CDN path) and the string handed to
`provider.synthesize`. Splitting them is a four-line change:

```python
@dataclass(frozen=True)
class Job:
    lang: str
    text: str            # the DISPLAYED string — keeps owning cache_key/hash16
    speech: str | None = None   # what the synthesizer is fed, when different
    ...
# collect_deck_jobs:
jobs.append(Job(lang=lang, text=front.strip(), speech=(card.get("speech") or None), ...))
# the synth call:
sec = provider.synthesize(job.speech or job.text, lang, v, job.out_path)
```

With that, `sha256("ja:ははは せんせいに はなを あげる。")[:16]` stays the key,
the manifest does not move, the app's `getTtsUrl()` derivation is untouched,
and NOTHING but the mp3 bytes changes. The emitter (`scripts/emit-tts-deck.mjs`,
this repo) then writes `speech:` on the affected cards. **Whichever of #2/#3
wins, the cost is regenerating the affected clips — never a manifest churn and
never an IR edit.** That also means the invariant holds structurally rather
than by discipline: わ can never reach the IR, because the alternate string
lives in the deck, which is generated.

`generate.py` lives in `../lingo-data` (Trevor's), so this is a note, not a
patch.

### Measured scope — 2,563 of 4,336 sentences

Swept every `ja:` / `audio:` / `answer:` string in `curriculum/ir/*.ir.yaml`,
deduped:

| set | sentences |
|---|---|
| distinct JA sentences in the IR corpus | 4,336 |
| contain ははは (unrecoverable by context) | 14 |
| contain は in particle position | 1,519 |
| contain へ in particle position | 25 |
| contain を (which is always the particle) | 1,231 |
| **contain at least one of the three** | **2,563** |

The 21 in the table above counted the ははは shape plus its neighbours across
three modules; 14 is the exact deduped ははは count over the whole course.

**Nothing here says all 2,563 are wrong.** Which set needs regenerating turns
entirely on whether the engine mishandles the particle GENERALLY or only where
the context is ambiguous. That is one listening test, not an investigation —
see below.

### The probe set

Six clips, one voice (`ja-JP-NanamiNeural`, the course voice), regenerated in
about six seconds. All six are distinct files (verified by md5 — E is not a
copy of B despite matching byte counts).

| clip | text | what it answers |
|---|---|---|
| A | わたしは がくせいです。 | ordinary topic は — if this is right, the bug is the ambiguous case only |
| B | ははは せんせいに はなを あげる。 | the reported failure |
| C | ほんを よみます。 | ordinary を |
| D | がっこうへ いきます。 | ordinary へ |
| E | 母は 先生に 花を あげる。 | option #2, kanji surface |
| F | ははわ せんせいに はなを あげる。 | option #3, forced わ |

If A, C and D are correct, the regeneration set is the 14 ははは sentences plus
whatever else is genuinely ambiguous — not 2,563. If A is wrong, the whole
corpus is in scope and the decision gets much more expensive.
