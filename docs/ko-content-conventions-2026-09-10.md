# KO-source content conventions — 2026-09-10
Governs `src/shared/i18n/content/ja/*.ko.json`. Inferred from the project
goal + `pedagogy-principles-2026-07-05.md` (structure-true glosses) + the
KO course's own address register (`locales/ko.json`: task instructions use
해요체 — "고르세요"; system prose uses 합니다체/서술체).
## 1. Register — by what the string IS, not where it lives
- **Instruction/UI-directive** (Pick/Build/Match, markers): **해요체**
  imperative, matching `locales/ko.json` ("~을 고르세요").
- **Gloss of a JA sentence** (`gp:.../ex:`, `Build: <sentence>`, any
  meaning-of-sentence `en:`): **mirror the JA sentence's own register.**
  m6's JA is 100% plain non-past (0/136 です/ます hits, verified) →
  statements **-다** (있다/없다/이다) or **-는다/-ㄴ다** (동사: 먹는다, 간다,
  본다 — not citation `-다`); questions **-니?** (있니?/어디니?), not
  -어요?/-는가?/-ㅂ니까. A future です/ます module glosses 해요체 instead.
- **Vocab/atom gloss**: citation `-다` (가지 않다) — dictionary style, a
  third lane distinct from both above.
## 2. Step-prefix table (from m6.en.json)
- `Build: <s>` → `만들기: <plain gloss>` (never `빌드:` / bare `Build:`)
- `Build what you hear.` → `들리는 대로 만들어 보세요.`
- `Pick the word for "X"` → `"X"에 해당하는 단어를 고르세요`
- `Match each Japanese word to its meaning (review)` → `각 일본어 단어를 뜻과 연결하세요 (복습)`
- `(incorrect)` marker → `(틀림)`
- `Challenge —`/`mN review —` titles → translate (`도전 —`, `mN 복습 —`),
  never transliterate
## 3. Pro-drop
Mirror JA subject presence exactly: drop unless JA marks a real noun with
は/が (ミカは, わたしは). Never add 나는/저는/그는/당신 where JA has none —
the most common defect found (それを みない → 그것을 보지 않는다, not
나는 그것을 보지 않는다).
## 4. Particle mirroring
が→가/이, は→는/은 (topic, incl. ancillary nouns: きょうは→오늘은, never
dropped), を→을/를 (never topic-marked), に/で→에/에서, の→의, も→도.
そこ(near listener)→거기/그곳 ≠ あそこ(far)→저기 — a drafted confusion
between these was found and fixed.
## 5. Verbatim
JA kana, romaji, all IDs/anchors/hashes, grammar rule prose (out of scope
this pilot, rung 1b §3), `readAloudText`/`antiPattern.ja/.romaji`.
