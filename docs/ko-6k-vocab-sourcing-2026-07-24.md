# Korean 6k Vocabulary + Frequency Sourcing (licensing research)

**Date:** 2026-07-24
**Question:** Find a FREE, legally-reusable source for a Korean vocab **frequency list** (~6,000+ words, each with a frequency count or rank) that Open Lingo can bundle into a **paid, commercial** app. Must-have = word + frequency. Nice-to-have = reading/romanization, POS, English gloss. The blocker is **licensing** — most curated "top 6000" lists are copyrighted compilations.

**TL;DR:** The genuinely-open answer is the **National Institute of Korean Language (국립국어원)** open-government data. Two files, both under **KOGL Type 1** (공공누리 제1유형 — attribution required, **commercial use explicitly allowed**, modification allowed). Grab both and join them. Avoid the topikguide / Quizlet / AnkiWeb "6000" lists — they are copyrighted repackages with no reuse grant. The popular GitHub option (hermitdave/FrequencyWords) is usable but **CC-BY-SA share-alike**, which is a poison pill for a proprietary bundled dataset.

---

## Ranked recommendation

1. **국립국어원 한국어 학습용 어휘 목록 (2003) — the curated 5,965-word graded learner list.** *Why:* It is exactly the ~6k curated, learner-selected, lemmatized (dictionary-form) list that everyone else repackages — but straight from the source under an open government license (KOGL Type 1: commercial OK, attribution only). Ships with grade level (A/B/C), POS, and a Korean definition per word. Best fit for a learning app.
2. **국립국어원 현대 국어 사용 빈도 조사 (2002) — the raw frequency survey.** *Why:* This is the file that actually carries **frequency counts** (words + particles + endings + proper nouns, sorted alphabetically and by frequency). KOGL Type 1 **plus** an AI-use badge (no-attribution commercial use for AI training). Large (tens of thousands of forms). Use it to attach real frequency numbers to list #1.
3. **hermitdave/FrequencyWords `ko_50k.txt` (OpenSubtitles-derived).** *Why (fallback only):* Trivial to grab (one raw txt, word+count), 50k entries. But it is **CC-BY-SA-4.0**, raw surface forms with josa attached, colloquial, and noisy — and share-alike would force you to publish your derived dataset under CC-BY-SA. Only use if you accept that.

**The single clearest thing I'd grab:** Both korean.go.kr files. Use the **한국어 학습용 어휘 목록** Excel as the spine (curated, graded, lemmatized, POS + gloss) and join the **현대 국어 사용 빈도 조사** text zip to it to add real frequency counts. Add one attribution line ("출처: 국립국어원"). This keeps the bundled dataset unencumbered by share-alike.

---

## Quick comparison table

| Source | Has frequency? | Lemmatized? | License | Commercial-OK? | How to get |
|---|---|---|---|---|---|
| **국립국어원 학습용 어휘 목록 (2003)** | Rank (freq-derived), no raw count | Yes (dict forms) | KOGL Type 1 (공공누리 1유형) | **Yes** + attribution | Excel/txt/HWP direct download from korean.go.kr |
| **국립국어원 사용 빈도 조사 (2002)** | **Yes — raw counts** | Mostly (headwords) | KOGL Type 1 + AI-type | **Yes** + attribution | ZIP of tab-delimited txt from korean.go.kr |
| hermitdave/FrequencyWords `ko` | Yes — raw counts | No (surface forms) | CC-BY-SA-4.0 (content) | Yes, but **share-alike** | Raw txt on GitHub |
| rspeer/wordfreq (`ko`) | Yes (as library) | Partial | Apache (code) / CC-BY-SA (data) | Yes, but **share-alike**; CSV export disallowed | pip library |
| Wiktionary KO freq lists | Mostly no counts | Yes | CC-BY-SA | Yes, but **share-alike** | Wiki pages (scrape) |
| ko-nlp/Korpora | No (corpora, not freq) | n/a | CC-BY (pkg); per-corpus varies | Varies | pip / GitHub |
| topikguide "6000 most common" | Rank only | Yes | Copyrighted site, no grant | **No** | HTML (scrape) — don't |
| Quizlet "6000 most common" | Rank only | Yes | Quizlet ToS, others' copyright | **No** | — don't |
| AnkiWeb #587771166 "Topik6000" | Rank only | Yes | User-shared, no stated license | **Unclear → no** | .apkg — don't |
| kimchi-reader freq list | Yes (rank) | Yes | Proprietary, unpublished | **No (not available)** | Not downloadable |

---

## The user's candidate sources — verdicts

### 1. Reddit "Top 6000 TOPIK Korean vocabulary word list"
Reddit blocked direct fetch, but from the surrounding results this post points at the same lineage as the AnkiWeb "Topik6000" deck / topikguide list — i.e. a repackage of a curated 6000-word TOPIK study list. No independent license. **Not a usable source in itself; it's a pointer to copyrighted repackages.**

### 2. topikguide.com "6000 most common Korean words"
Format: rank + Hangul + English gloss (1,000 per page × 6 pages). **The page itself states the underlying list was compiled by the 국립국어원 (National Institute of Korean Language)**, with English translations added by ezcorean.com. The site is a copyrighted compilation and sells a paid study package; **no reuse/redistribution grant.** Verdict: **do not scrape/bundle** — but this confirms the real open source is 국립국어원 (go to the source, below). URL: https://www.topikguide.com/6000-most-common-korean-words-1/

### 3. Quizlet "6000 most common Korean words"
Quizlet ToS: submitters grant **Quizlet** a broad license, and users are **prohibited from copying others' set content** and from posting infringing content. Reusing a Quizlet set's content in a commercial app is not granted and likely violates both the ToS and the underlying list's copyright. Verdict: **not usable.** https://quizlet.com/tos

### 4. AnkiWeb shared deck #587771166 ("Topik6000 Korean Vocab")
"6000 most popular words," Google-TTS audio, English definitions. It is a **user-shared** deck with **no stated open license**, repackaging a copyrighted "most popular 6000" compilation (plus TTS audio with its own terms). AnkiWeb decks carry no license by default. Verdict: **licensing unclear → treat as not usable.** https://ankiweb.net/shared/info/587771166

### 5. kimchi-reader (https://kimchi-reader.app/explore/freq/words)
Its frequency ranking is derived from **350,000+ proprietary media items** (YouTube/Netflix/books) and is a product feature, **not published as a dataset**. The only open GitHub repo in the project is **kimchi-grammar** (github.com/Alaanor/kimchi-grammar) — grammar content, **not** the frequency list. HelgaKr/KWordList is a *script to build* lists from your own corpus, not data. Verdict: **the frequency data is not available/openly licensed.**

---

## The open, legally-clean options (this is where the answer is)

### A. 국립국어원 「한국어 학습용 어휘 목록」 (2003) — RECOMMENDED spine
- **Contents:** 5,965 words graded across 3 levels (A/B/C = level 1/2/3: 982 + 2,111 + 2,872). Columns: rank (frequency-derived), word, **part of speech** (명사/동사/형용사…), **Korean definition/gloss**, grade. Dictionary/lemma forms (not surface forms).
- **Frequency:** ranked/graded rather than raw counts — the ordering derives from the 2002 frequency survey. If you need actual counts, join to option B.
- **License:** **KOGL Type 1 (공공누리 제1유형)** — attribution required, **commercial use allowed**, modification/derivatives allowed. This is the least-restrictive KOGL tier.
- **How to get:** Excel (.xls), text, and HWP formats. Page: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=46&etc_seq=71 (direct .xls download link is present on that page).
- **Why it's the best fit:** it *is* the ~6k curated learner list, already leveled + POS + gloss + lemmatized. This is what topikguide/Quizlet/Anki all repackage — you can license it cleanly at the source.

### B. 국립국어원 「현대 국어 사용 빈도 조사」 (2002) — RECOMMENDED for real counts
- **Contents:** frequency survey by 조남호 (2002). Four categories — 단어(words), 조사(particles), 어미(endings), 고유명사(proper nouns) — each provided both alphabetically and by frequency rank (8 files total). Each entry has a **raw frequency count**. Large (the published survey covers tens of thousands of forms; commonly cited around ~58k word types — verify against the file). Mostly headword/dictionary forms.
- **License:** **KOGL Type 1** badge **plus an AI-type badge** (the AI badge permits commercial/non-commercial use and derivatives for AI training with no attribution). For a normal bundle, treat it as KOGL Type 1: commercial OK + attribution.
- **How to get:** ZIP of tab-delimited .txt files. Page: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=46&etc_seq=61 . Report metadata: https://www.korean.go.kr/front/reportData/reportDataView.do?report_seq=303&mn_id=45
- **Use:** join to option A on the headword to attach numeric frequency; or take the top ~6k words directly from the frequency-sorted 단어 file.

### C. hermitdave/FrequencyWords — `content/2018/ko/ko_50k.txt` (fallback)
- **Contents:** word + occurrence count, ~50k entries (also `ko_full.txt`). **Raw surface forms**, NOT lemmatized — particles attached (e.g. 내가 = 나+가, 난 = contraction), heavy colloquial/sentence-final particles (요/죠/어), and **noise** (Latin tokens like tv/fbi, digits like 1년/3년, punctuation 「 」 ·). Derived from **OpenSubtitles 2018** (drama/film dialogue).
- **License:** **repo README explicitly splits it: MIT for code, CC-BY-SA-4.0 for content.** So the frequency data is **CC-BY-SA-4.0** — commercial use allowed, **but share-alike**: any dataset you derive from it must also be released CC-BY-SA-4.0, plus attribution. Also inherits OpenSubtitles' own CC-BY attribution expectation.
- **How to get:** https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ko/ko_50k.txt (LICENSE: https://github.com/hermitdave/FrequencyWords/blob/master/LICENSE ; README license split at https://github.com/hermitdave/FrequencyWords ).
- **Verdict:** easiest to grab, worst license fit for a proprietary bundle (share-alike) and needs heavy lemmatization + denoising. Use only if share-alike is acceptable.

### D. rspeer/wordfreq (Python library)
- Korean frequency estimates from Wikipedia + OpenSubtitles-2018 + OSCAR + Reddit. Code = Apache 2.0; **data = CC-BY-SA-4.0**. The maintainer explicitly states you may **not** export a plain CSV of the frequencies because a CSV can't carry the CC-BY-SA attribution/license — so a bundled flat list would violate the license. Same share-alike caveat as C. Good for internal ranking, poor for a shippable dataset.

### E. Wiktionary Korean frequency lists (CC-BY-SA)
- Lists like "5800 Korean words" / "5897 from the Basic Korean Vocabulary List (한국어 학습용 어휘목록)" — the latter is literally a copy of option A. Mostly **no granular counts**, and **CC-BY-SA share-alike**. Prefer going to the 국립국어원 source (KOGL, no share-alike) instead.

### F. ko-nlp/Korpora (CC-BY package; per-corpus licenses vary)
- 20+ Korean corpora (Modu, NAVER movie reviews, Wikipedia, etc.) but **no ready-made frequency list** — you'd compute frequencies yourself, and each corpus has its own license to check. Only relevant if you want to build a bespoke frequency list from raw text. Not needed given A + B exist.

---

## Integration gotchas for Open Lingo

- **Lemma vs surface form:** Prefer A/B (dictionary/headword forms) over C/D/E (raw surface forms with josa). We want dictionary forms; the FrequencyWords/OpenSubtitles route would need lemmatization (mecab-ko / Khaiii / Kkma) + josa stripping + noise filtering before it's usable — meaningful work.
- **Romanization + POS:** A already carries POS. Romanization we can generate — we already ship a Korean Revised-Romanization reading aid + a generalized conjugation engine (per memory 2026-07-15/16), so we can derive readings and dictionary/conjugated forms ourselves.
- **Gloss:** A has Korean definitions (not English). English glosses would need adding (our own translation pass or a CC-licensed KO→EN dictionary). topikguide's English came from ezcorean and is not ours to take.
- **Frequency counts:** A is rank/grade only; join B for numeric counts. If the join key (headword) mismatches (spacing/POS homographs), fall back to B's frequency-sorted 단어 list and take the top N.
- **Attribution obligation:** KOGL Type 1 requires a visible source credit (e.g. an in-app "Data: 국립국어원" line in credits/licenses). Cheap to satisfy and, crucially, **no share-alike** — our derived dataset stays proprietary.
- **Decontextualized comprehensibility:** government frequency lists include function words (particles/endings) and homographs; for a learner surface we'd want to filter to content words and disambiguate homographs (we already handle kana-style collisions on the JA side, same pattern applies).

---

## Flags for a human/legal call

- **KOGL Type 1 attribution wording:** confirm the exact required attribution string and that in-app credits satisfy it (Type 1 needs only source attribution; no NoDerivs/NonCommercial restriction). Low risk, but worth a 5-minute confirm on the specific file's badge.
- **현대 국어 사용 빈도 조사 "AI-type" badge:** the AI badge (no-attribution commercial use for AI training) is a bonus but has technical-safeguard conditions; don't rely on it — rely on the Type 1 badge for a normal data bundle.
- **hermitdave / wordfreq share-alike:** if anyone proposes these, legal should confirm we're willing to license the derived frequency dataset under CC-BY-SA-4.0. Recommend we simply avoid them and use 국립국어원.
- **Do NOT** scrape topikguide / Quizlet / AnkiWeb — all are copyrighted or license-unclear repackages of the very 국립국어원 data we can get cleanly at the source.

---

## Sources
- https://www.topikguide.com/6000-most-common-korean-words-1/
- https://quizlet.com/tos
- https://ankiweb.net/shared/info/587771166
- https://kimchi-reader.app/explore/freq/words , https://github.com/Alaanor/kimchi-grammar
- https://github.com/hermitdave/FrequencyWords , https://github.com/hermitdave/FrequencyWords/blob/master/LICENSE , https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ko/ko_50k.txt
- https://github.com/rspeer/wordfreq
- https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Korean
- https://github.com/ko-nlp/Korpora
- 국립국어원 학습용 어휘 목록: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=46&etc_seq=71
- 국립국어원 사용 빈도 조사: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=46&etc_seq=61 , https://www.korean.go.kr/front/reportData/reportDataView.do?report_seq=303&mn_id=45
- Korea Open Government License (KOGL): https://en.wikipedia.org/wiki/Korea_Open_Government_License
