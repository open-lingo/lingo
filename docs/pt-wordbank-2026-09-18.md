# PT word bank (mechanical inventory, 2026-09-18)

Script: `scripts/author/pt/build-wordbank.py`. Output: `scripts/author/pt/data/pt-wordbank.json`, 2500 rows, one per lemma, sorted by `brRank`. No pedagogical filtering — Fable picks words from this for the m1-m4 spine.

## Sources & licences
- `data/pt_br_50k.txt` — hermitdave/FrequencyWords pt_BR list (code MIT; data derived from OPUS OpenSubtitles2018). hermitdave states no separate licence for the wordlists themselves beyond the repo's MIT code licence — treat as research-grade frequency statistics, not verbatim subtitle text.
- `wordfreq` (MIT, Robyn Speer) — cross-check Zipf frequency, pt and en.
- `simplemma` (MIT, Adrien Barbaresi) — lemma.
- `spaCy` + `pt_core_news_sm` (MIT model, UD-derived) — POS, gender.

## Counts per POS (2500 rows)
NOUN 1460, VERB 499, ADJ 199, ADV 181, ADP 59, PRON 32, DET 24, NUM 20, CCONJ 8, AUX 7, remainder SCONJ/INTJ. 0 rows fell to OTHER. 1460/1460 NOUN rows got a gender (spaCy always returned a Gender morph feature in this sample — see noise below).

## Filters applied
1. Character allowlist (PT letters + hyphen) drops digits, punctuation, and OpenSubtitles OCR garbage ("vocãª", "năo", "nº") that a bare `isalpha()` check would not catch.
2. Single letters dropped except a/e/o/é.
3. Hardcoded interjection-noise list dropped (oh, ah, hm, uh, ...); né/tá/pra/cê kept and flagged `colloquial` instead.
4. POS-dropped: PROPN, PUNCT, SYM, X (spaCy carrier-sentence tag).
5. `profane` flag (not drop), 24-word hand list, everyday curses/vulgarity only, no slurs against protected groups — 8 hits in the top 2500 (merda, idiota, porra, puta, bunda, caralho, foder, imbecil).
6. `foreign` flag: 1 hit (`chinar`, a simplemma mis-lemmatization of "china" — see below).

## POS tagging method + measured accuracy
Two spaCy runs per candidate word: carrier ("Eu vi \<w\> ontem.") and isolated ("\<w\>"). On disagreement the carrier run wins and the row gets `pos-uncertain` (isolated single-token tagging was measured wrong for words like cansada/gosta — carrier fixes that). Measured on the first 200 kept lemmas by BR rank: **92.0% agreement (184/200)**. 315/2500 rows carry `pos-uncertain`, 442/2500 carry `lemma-disagree` (simplemma vs spaCy lemma — simplemma kept per spec).

## Known noise (not fixed, flagged where the rule covers it)
- simplemma invents lemmas for irregular inflections: "uma" → `umar`, "china" → `chinar` (the latter trips the `foreign` flag as a false positive — zipf_pt is low because `chinar` isn't a real word).
- Function-word contractions collapse per simplemma but spaCy tags them as distinct forms: do/da/ao/no/na all lemma-disagree against "o"; harmless, both are article contractions.
- spaCy's carrier-sentence fix isn't perfect: "comigo" tags NOUN (should be PRON), "quer" tags CCONJ mid-sample; these carry `pos-uncertain` so Fable can spot-check.
- Gendered noun pairs collapse to one lemma (irmã/irmão → `irmão`), losing the feminine surface as its own headword; `forms` still lists both surfaces under the one row.
- 5/42 m1 atoms didn't map to a row: multi-word atom surfaces are skipped by design (no single lemma), and `Califórnia`/`França` are PROPN-dropped as expected (`Califórnia` coincidentally lemmatizes to the real word `califórnio`, a false taughtIn-match risk Fable should sanity-check by lemma text, not just brRank).
- `cê` (real BR speech) falls outside the top-2500 rank cutoff (brRank ~12,413) — present in the raw list and correctly classified, just doesn't survive the row cap.

Script is deterministic (two runs diffed identical) and runs end-to-end in ~8s.
