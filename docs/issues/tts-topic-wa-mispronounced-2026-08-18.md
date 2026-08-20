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

## 2026-08-20 — ROOT CAUSE FOUND: the deck's 。-stripping, not the voice

Spencer's listen came back strange: A, B, C, D all correct — including B,
the reported failure. The explanation is that the probe clips were generated
from the IR text VERBATIM, 。 included, while the deck strips trailing 。
before hashing and synthesis (`emit-tts-deck.mjs`, the "don't generate
separate audio for X and X。" dedup).

Whisper-verified (faster-whisper small, ja):

| input | runs | transcript |
|---|---|---|
| ははは せんせいに はなを あげる (no 。 — as shipped) | shipped + 3 fresh | ははは先生に花をあげる — WRONG, deterministic |
| ははは せんせいに はなを あげる。 (with 。) | 3 fresh | 母は先生に花をあげる — correct, deterministic |
| ちちは からだが おおきいけど ははは ちいさい (no 。) | 1 | 父は…母は… — correct: MID-sentence ははは parses fine |

So the failure needs BOTH: sentence-initial ははは AND the stripped 。.
Byte-level output is nondeterministic run to run (5 generations, 5 md5s,
same length), so byte diffs prove nothing — whisper or ears only.

Spencer also ruled on the candidate fixes: **E (kanji-fed) is correct and
sounds BETTER than the original — "probably a better generation, which will
also help with pitch accent teaching… might be a full tts pipeline regen
candidate." F (forced わ) "made it weird" — rejected.** That kills option #3
permanently: no わ ever, in IR or in speech text.

Supporting research: Azure's neural TTS front-end (Unified Neural Text
Analyzer) does word segmentation + polyphone/accent prediction from natural
orthography — spaced kana-only, punctuation-stripped text is exactly the
input it is worst at. Kanji-mixed input feeds the analyzer what it was
trained on.

Repair plan (pending Spencer's one remaining listen — probe clip A2, the
SHIPPED わたしは bytes, decides the scope):
1. `Job.text` keeps owning the hash (no manifest churn, dedup intact);
   new `Job.speech` carries what the synthesizer is fed.
2. Near fix: the 14 sentence-initial ははは sentences get hand-written
   kanji speech text (14 sentences, no auto-converter, no homophone risk),
   regenerate, ship via tts-publish. NOTE for Trevor: these overwrite
   EXISTING keys — CloudFront needs an invalidation for those paths, the
   one case the "only new clips" rule doesn't cover.
3. The full kanji-fed regen (Spencer's instinct) is a separate decided
   project: ~12.3k clips, ~4–5h local generation, ~600MB re-upload,
   full-corpus CDN invalidation or a v1→v2 path bump, and it needs a kanji
   rendering per sentence — the catalog only covers 113 learner-facing
   chars, and auto-conversion has homophone risk (こうえん→公園/講演), so
   the renderings need a generation+review pass of their own.


## 2026-08-20, later — REPAIRED. Measured 5, not 14; and a finding for the full-regen decision

Spencer's second listen: A2 (shipped ordinary topic は) CORRECT, B2 (shipped
ははは) incorrect — blast radius confirmed as the sentence-initial ははは
class only. Whisper-audited all 16 shipped ははは clips: **5 failed**
(0fc983c7, 19a20cdb, 35ec2c90, 4162f807, d4dc70ae — the worst transcribe as
ハッハッハ laughter), 11 fine, including some sentence-initial ones — the
normalizer rolls per-sentence dice.

Fix shipped: `pipeline/tts/generate.py` now splits `Job.text` (owns the hash
and manifest key) from `Job.speech` (what the voice is fed), driven by
`speech_overrides_ja.json`. All 16 ははは texts pinned. **Surprise with
direct bearing on the full-kanji regen decision: 母は + kana continuation
STILL read as laughter in 2 of 5** — only full-sentence kanji + 。 (probe E's
exact shape) fixed those. Partial kanji-feeding is not a safe middle; if the
full regen happens it should feed complete kanji sentences.

All 5 regens whisper-verified 母は and staged in `tts-publish/ja/`. They
overwrite live keys — Trevor must invalidate those five CloudFront paths
(noted in tts-publish/README.md).
