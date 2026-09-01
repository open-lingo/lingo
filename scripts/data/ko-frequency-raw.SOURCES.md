# scripts/data/ko-frequency-raw/ — provenance (SOURCES)

The raw NIKL (국립국어원) inputs for `scripts/ingest-ko-frequency.mjs` live in
`scripts/data/ko-frequency-raw/`, which is **gitignored** (`.gitignore` "downloaded
raw gov corpus"). This committed note is the re-download recipe. Everything below
is **KOGL Type 1** (공공누리 제1유형: commercial use OK, modification OK, NO
share-alike, attribution required).

**Attribution line (KOGL Type 1 obligation, must appear in app credits):**
> 출처: 국립국어원 (National Institute of Korean Language)

Last re-downloaded: **2026-08-26** (all three fetched successfully; no login
needed — the `/common/download.do` links work with a plain GET; a `Referer`
header for the source page was sent, direct links may otherwise be flaky).

## 1. 한국어 학습용 어휘 목록 (2003) — the graded learner spine

- File: `learner-vocab-list.xls` (original, 652,288 bytes, .xls BIFF, sheet
  "한국어학습용어휘등급표", 5,965 data rows) and `learner-vocab-list.txt`
  (our conversion: TAB-delimited EUC-KR, columns 순위·단어·품사·풀이(Hanja)·등급,
  CRLF — the format the ingest reads).
- Source page: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=46&etc_seq=71
- Direct download (2026-08-26):
  `https://www.korean.go.kr/common/download.do?file_path=etcData&c_file_name=5a4a2f5c-66c9-425d-88fb-854289ea2521_0.xls&o_file_name=...`
- Mirror: 공유마당 https://gongu.copyright.or.kr (wrtSn=12822282).
- Conversion: `xlrd` (pip --user), floats→ints, TAB-join, encode EUC-KR.
- License: KOGL Type 1 (badge on the source page).

## 2. 현대 국어 사용 빈도 조사 (2002, 조남호) — corpus frequency counts

- Files: `freq-2002-original.zip` (2,238,303 bytes) extracted to `freq-2002/`
  — 8 files (단어/조사/어미/고유명사 × 가나다색인/빈도색인), TAB-delimited,
  CP949 (two bytes in 단어 files are invalid strict EUC-KR; decode as
  cp949/WHATWG euc-kr). ZIP member names are CP949 — extract with a
  cp437→cp949 filename re-decode (plain `unzip` mangles them).
  `단어_빈도색인.txt` = 58,437 word rows, columns
  차례·항목(homograph-digit-suffixed)·풀이·품사·빈도·개수·(9 register columns).
- Source page: https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=46&etc_seq=61
- Direct download (2026-08-26):
  `https://www.korean.go.kr/common/download.do?file_path=etcData&c_file_name=0907a2ca-3391-47e8-8216-8867c22add5a_0.zip&o_file_name=...`
- Report metadata: https://www.korean.go.kr/front/reportData/reportDataView.do?report_seq=303&mn_id=45
- License: KOGL Type 1 (+ AI-use badge; rely on Type 1 for the data bundle).
- Register caveat: overwhelmingly WRITTEN corpus — not a spoken-frequency signal.

## 3. 국제 통용 한국어 표준 교육과정 적용 연구 (2017, 4단계) — 등급별 어휘 목록

The fluency-level source (levels 1급–6급; the legally-clean FLELex analogue;
matches Sejong Institute / TOPIK level usage in practice).

- Files: `intl-standard-2017-graded-list.xlsx` (original, 701,945 bytes,
  sheets 어휘 10,635 rows + 문법 336 rows; official filename
  "2017년 국제 통용 한국어 표준 교육과정 적용 연구(4단계) 어휘, 문법 등급
  목록_20180227_20201117 수정.xlsx") and `intl-2017-vocab.tsv` (our
  conversion of the 어휘 sheet: UTF-8 TAB, columns
  전체번호·등급·어휘·품사·길잡이말 — the format the ingest reads).
- Source page: https://www.korean.go.kr/front/reportData/reportDataView.do?mn_id=45&report_seq=932
  (also on kcenter.korean.go.kr)
- Direct download (2026-08-26):
  `https://www.korean.go.kr/common/download.do?file_path=reportData&c_file_name=157339df-1904-443a-b1a9-d6d34578ba93.xlsx&o_file_name=...`
- License: KOGL Type 1 (badge on the source page).
- Join caveat: its homograph digits (가격02, 가구02) follow a DIFFERENT
  numbering than the 2003/2002 files (가격03, 가구03/04) — join on
  surface + POS, never on the digit key, across this list and the others.

## Consumers

- `scripts/ingest-ko-frequency.mjs` — registry (`src/.../ko/frequencyAtoms.ts`),
  gloss candidates, and `docs/data/ko-graded-vocab.json` (`--graded-vocab`).
- Gap audits: `docs/ko-gap-audit-2026-08-26.md`.
- Research/licensing background: `docs/ko-6k-vocab-sourcing-2026-07-24.md`,
  `docs/ko-freq-level-research-2026-08-26.md`.
