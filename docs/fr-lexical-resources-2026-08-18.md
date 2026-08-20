# French lexical resources — the licensing picture, corrected (2026-08-18)

**Status:** RESEARCH. Supersedes the French-licensing paragraph in
`multilang-authoring-wave-2026-08-18.md`, which was **wrong in one direction
and right in another**, and said so with more confidence than it had earned.

**Method note.** The earlier pass searched in English and found the
English-language write-ups of French resources. This pass went to the French
sources themselves — `openlexicon.fr` / `chrplr/openlexicon` (the directory
Christophe Pallier maintains for the French psycholinguistics community),
ATILF/ORTOLANG, Grammalecte, and CENTAL at UCLouvain. Every licence below was
read off the resource's own README or licence file, not off a summary.

---

## 0. What I got wrong

I told Spencer: *"no open commercially-licensed CEFR wordlist exists for French
or Spanish"*, and separately that French conjugation data was reachable only
through GPL (Verbiste).

Splitting that claim in two:

| Claim | Verdict |
|---|---|
| No open commercially-licensed **CEFR-graded** French list | **Still true.** FLELex is the only real candidate and it publishes no licence at all — see §3. |
| French **frequency and morphology** data is licence-blocked | **False.** Lexique 3.83 is CC BY-SA 4.0, Lexique-Infra is CC BY-SA 4.0, and Grammalecte's inflected-forms lexicon is **MPL-2.0** — file-level copyleft, not viral. |

The mistake was collapsing "graded by CEFR" into "usable frequency data". They
are different resources with different licences, and the second one was never
blocked.

---

## 1. The resources, with licences read at source

| Resource | What it is | Size | Licence | Verified |
|---|---|---|---|---|
| **Lexique 3.83** | The reference French lexical DB: orthography, phonemic form, lemma, syllabification, POS, gender, number, frequency in a **book** corpus and in a **film-subtitle** corpus | ~140,000 forms | **CC BY-SA 4.0** | `datasets-info/Lexique383/README-Lexique.md` |
| **Lexique-Infra 1.00** | Grapheme↔phoneme consistency; frequencies of letters, bigrams, trigrams, phonemes, syllables | ~140,000 forms | **CC BY-SA 4.0** | `datasets-info/Lexique-Infra/README-Lexique-Infra.md` |
| **Gougenheim 1.00** | The *français fondamental* core, from a **spoken** corpus: 275 recorded interviews, 163 texts, 312,135 words, 7,995 distinct lemmas. Frequency + dispersion. Cuts off below frequency 20 | 1,064 words | openlexicon default **CC BY-SA 4.0** | `datasets-info/Gougenheim100/README-Gougenheim.md` |
| **Dicollecte / Grammalecte** v6.4.1 | Full inflected-form lexicon, both pre- and post-1990-reform spellings. Corpus: Google 1-grams + Wikipédia + Wikisource + littérature, 147.4 billion words recognised | — | **MPL 2.0** | `README_lexique-dicollecte.txt` |
| **Morphalou 3.1** (ATILF) | Large-coverage inflectional lexicon, merged from Morphalou 2 + DELA + Dicollecte + LGLex/LGLexLefff + Lefff. Phonetic transcription for 93,695 lemmas | 159,271 lemmas · 976,570 forms | **LGPL-LR** (LGPL For Linguistic Resources) | `datasets-info/Morphalou/README-Morphalou.md` |
| **Manulex** (Lété et al. 2004) | Grade-level lexical DB from French **elementary-school readers** — frequency banded by school grade | — | **not stated** at openlexicon; upstream is `manulex.org` | see §3 |
| **Manulex-infra / SILEX** | SILEX unifies Manulex-infra (54 school textbooks) with Lexique 3.80 (218 adult novels); built for silent-letter and orthographic-ending work | 119,609 entries | not stated | `list-of-datasets.md` |
| **WorldLex** | Frequencies by register — blog, Twitter, newspaper — including French | — | not stated | `list-of-datasets.md` |
| **FLELex** (CENTAL, UCLouvain) | **The CEFR-graded one.** Normalised frequency per lemma at each of A1–A2–B1–B2–C1–C2, estimated from a corpus of FFL textbooks and simplified readers. Two taggings (FLELex-TT, FLELex-CRF); the Beacco version adds a derived-CEFR-level column | 8 columns, TSV/UTF-8 | **NONE PUBLISHED** — see §3 | `cental.uclouvain.be/flelex/` + its download page |

The repository-wide fallback, for anything without its own file:

> "Unless otherwise explained by a individual readme or license file in a
> directory, it distributed under a CC BY-SA 4.0 LICENSE."
> — `openlexicon.fr`

---

## 2. What each one is actually FOR, in our pipeline

Mapping to the work in `fr-authoring-invariants-pinned.md`:

- **Lexique 3.83 → the inventory.** `freqlemfilms2` (subtitle lemma frequency)
  is the right ordering signal for a *spoken*-first beginner course; the book
  frequencies over-rank literary vocabulary. It also carries `genre` and
  `nombre`, which is exactly what F6–F8 (gender) need, and `cgram`, which is
  what the frame's slot enums need. **This is the single file the French
  drafting frame would be built from.**
- **Gougenheim → the first 1,000 words, chosen by people who did this before
  us.** *L'élaboration du français fondamental* (Gougenheim, Rivenc, Michéa,
  Sauvageot) built its list from recorded conversation precisely because
  written frequency lists mis-rank the spoken core. That is the same argument
  our A1 spine makes. It is small enough to read in full, which makes it a
  sanity check on any automatically-derived list rather than a replacement.
- **Lexique-Infra → F1–F5.** Liaison, elision, h aspiré, accent minimal pairs
  and the `liaison_listen` step all need grapheme↔phoneme consistency data.
  This is that data, under a licence we can use.
- **Grammalecte (MPL-2.0) → conjugation.** This is the correction that matters
  most practically: French inflection is available under a permissive licence.
  Nothing forces us near Verbiste's GPL.
- **Morphalou → the fallback / cross-check.** LGPL-LR permits commercial use;
  its obligations bite on *modified* redistribution of the resource itself,
  which is not what we would be doing. Useful as a second opinion when
  Grammalecte and Lexique disagree on a form — the same role `verify-morph.mjs`
  plays for Spanish today.
- **Manulex / SILEX → the graded ladder, if the licence clears.** Grade-banded
  frequency from school readers is the closest open analogue to CEFR banding.

---

## 3. The one real gap, and it is narrow

**FLELex publishes no licence.** Its site asks for citation and nothing else:

> "If you are using FLELex, please, cite these articles"

Citation-request-without-licence is not permission. It is also not refusal —
it is an omission, and academic groups routinely grant clean terms when asked.
FLELex is the only resource in this table that carries the thing we cannot
derive ourselves: **an actual CEFR level per lemma, estimated from FFL teaching
materials.** Everything else is frequency, and frequency is not level.

Manulex's licence is likewise unstated at the mirror; the upstream site is the
place to resolve it.

**Highest-leverage single action, unchanged from the last pass but now for a
narrower reason:** email CENTAL (UCLouvain) asking for explicit commercial
terms on FLELex, and ATILF/Lété for Manulex. We are no longer blocked on
frequency data — only on grading.

---

## 4. The share-alike question, which is Spencer's to answer

CC BY-SA 4.0 permits commercial use. Its condition is that **adaptations of
the licensed material are shared under the same licence.** For us that means:

- A derived French word list — "Lexique lemmas filtered and ordered for our
  A1 spine" — is an adaptation. Publishing the course does not force us to
  open-source the app, but it does mean **that derived list** would need to be
  offered under CC BY-SA 4.0.
- The *sentences* our frame builds from those words are not adaptations of
  Lexique. A word list is not a novel; using a lexicon to decide vocabulary
  order is use, and the generated content is our own.
- The clean structural answer, and the one I would take: keep the derived list
  as **a separate committed data file with its own licence header**, exactly
  the way `esReviewPool.ts` is a separate generated snapshot today. The
  boundary is then obvious to anyone who asks, and nothing about it touches
  application code.

MPL-2.0 (Grammalecte) is easier still: its copyleft is per-file, so a data
file carrying its own MPL header sits in the tree without reaching anything.

**Decision needed:** are we willing to publish a CC BY-SA 4.0 derived wordlist
as the price of the best French frequency data? If not, the fallback is
Grammalecte (MPL) for forms plus our own frequency ordering — worse data,
zero share-alike.

---

## 5. What this changes about French effort

Nothing about the ~2,000-LOC engine estimate. What it changes is the *front* of
the pipeline: the French equivalent of `inventory-es.mjs` — the thing that
answers "which words may this frame draw on" — has a real source now, under a
usable licence, with the two frequency corpora (books and subtitles) split
apart so a spoken-first course can order on the right one.

Sequence, if French starts:

1. Ingest Lexique 3.83 → `fr-frequency.json`, ordered on `freqlemfilms2`,
   carrying `lemme`, `cgram`, `genre`, `nombre`. (`scripts/ingest-ko-frequency.mjs`
   is the shape to copy — this is a solved problem in-repo.)
2. Cross-check the first 1,000 against Gougenheim; the disagreements are the
   interesting part, and they are worth reading rather than resolving
   automatically.
3. `morph-fr.mjs` from Grammalecte, with a `verify-morph`-style cross-check
   against Morphalou.
4. Only then a spine, and only then frames.

Steps 1–3 are mechanical and local. Step 4 is judgment, and it is the same
judgment `frames-es-a2.mjs` encodes: **spend it on the inventory.**

---

## Sources

- [openlexicon.fr](http://openlexicon.fr/) — dataset directory and the CC BY-SA 4.0 default
- [chrplr/openlexicon](https://github.com/chrplr/openlexicon) — per-dataset READMEs and `LICENSE.txt`
- [FLELex, CENTAL — UCLouvain](https://cental.uclouvain.be/flelex/) — CEFR-graded FFL lexicon, no licence published
- [Grammalecte](https://grammalecte.net/) — Dicollecte lexicon, MPL 2.0
- [Morphalou 3.1, ORTOLANG](https://www.ortolang.fr/market/lexicons/morphalou/v3.1) — LGPL-LR
