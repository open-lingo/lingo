# P1 triage — internal-consistency check

Local-judge sweep, 2026-09-13. This is NOT a re-judgment of the language content — only a check of whether the judge's own `quote` actually appears in the lesson JSON it was given (substring match against the lesson, tried verbatim and against inner-quoted/after-colon fragments to allow for the judge's `field: "value"` shorthand). `plausible` = quote verified present, internally consistent claim. `suspect-hallucination` = the quoted string does not appear anywhere in the lesson (or the finding is otherwise internally incoherent — e.g. self-contradictory). `duplicate-of-<id>` = same step, same underlying issue as an earlier-listed P1.


## Korean (ko) — 40 P1s

| id | lesson | step | verdict | note |
|---|---|---|---|---|
| ko-p1-001 | ko-m16-3 | ko-m16-3-p-after | plausible | quote verified present in the lesson JSON — quote: `romaji: "go naseo"` |
| ko-p1-002 | ko-m16-3 | ko-m16-3-cloze-afterstudy | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "고 나서"` |
| ko-p1-003 | ko-m16-4 | ko-m16-4-p-like | plausible | quote verified present in the lesson JSON — quote: `romaji: joahaeyo` |
| ko-p1-004 | ko-m16-5 | ko-m16-5-p-dislike | plausible | quote verified present in the lesson JSON — quote: `sireohaeyo` |
| ko-p1-005 | ko-m16-7 | ko-m16-review-tail-match | plausible | quote verified present in the lesson JSON — quote: `짜다` |
| ko-p1-006 | ko-m16-8 | ko-m16-8-cloze-aftereating | plausible | quote verified present in the lesson JSON — quote: `자요` |
| ko-p1-007 | ko-m17-3 | ko-m17-3-p-ride | plausible | quote verified present in the lesson JSON — quote: `romaji: tayo` |
| ko-p1-008 | ko-m17-7 | ko-m17-7-q-takebus | plausible | quote verified present in the lesson JSON — quote: `Explanation: '타다 takes 을/를: 버스를 타세요'` |
| ko-p1-009 | ko-m17-8 | ko-m17-8-q-takebus | plausible | quote verified present in the lesson JSON — quote: `버스를 타요` |
| ko-p1-010 | ko-m18-1 | ko-m18-1-q-clear | plausible | quote verified present in the lesson JSON — quote: `options: ["날씨가 맑아요", "날씨가 맑어요", "날씨가 흐려요", "날씨를 맑아요"]` |
| ko-p1-011 | ko-m18-7 | ko-m18-review-tail-match | plausible | quote verified present in the lesson JSON — quote: `일` |
| ko-p1-012 | ko-m19-6 | ko-m19-6-q-broage | plausible | quote verified present in the lesson JSON — quote: `options[1]: "우리 오빠는 스물 살이에요"` |
| ko-p1-013 | ko-m20-7 | ko-m20-7-info | plausible | quote verified present in the lesson JSON — quote: `의사: 감기예요. 약을 먹으니까 괜찮을 거예요. (It's a cold. Since you'll take medicine, you'll be fine.)` |
| ko-p1-014 | ko-m20-7 | ko-m20-7-info | duplicate-of-ko-p1-013 | same step, overlapping quote/category as an earlier-listed P1 — quote: `의사: 감기예요. 약을 먹으니까 괜찮을 거예요. (It's a cold. Since you'll take medicine, you'll be fine.)` |
| ko-p1-015 | ko-m20-8 | ko-m20-8-cloze-eatso | plausible | quote verified present in the lesson JSON — quote: `밥을 먹으니까 병원에 가요` |
| ko-p1-016 | ko-m20-8 | ko-m20-8-speak-recap | plausible | quote verified present in the lesson JSON — quote: `My head hurts, so go home` |
| ko-p1-017 | ko-m21-7 | ko-m21-7-q-calledkimchi | plausible | quote verified present in the lesson JSON — quote: `이거는 김치이라고 해요` |
| ko-p1-018 | ko-m21-8 | ko-m21-8-cloze-twowater | plausible | quote verified present in the lesson JSON — quote: `물 두 잔 주세요` |
| ko-p1-019 | ko-m22-2 | ko-m22-2-cloze-lessexpensive | plausible | quote verified present in the lesson JSON — quote: `correctParticle` |
| ko-p1-020 | ko-m22-5 | ko-m22-5-p-eoneuge | plausible | quote verified present in the lesson JSON — quote: `romaji: "eoneu ge"` |
| ko-p1-021 | ko-m23-7 | ko-m23-7-info | plausible | quote verified present in the lesson JSON — quote: `You: 저는 운전할 수 없으니까 친구가 와 주세요.` |
| ko-p1-022 | ko-m23-7 | ko-m23-7-info | duplicate-of-ko-p1-021 | same step, overlapping quote/category as an earlier-listed P1 — quote: `You: 저는 운전할 수 없으니까 친구가 와 주세요.` |
| ko-p1-023 | ko-m24-3 | ko-m24-3-q-readorlisten | plausible | quote verified present in the lesson JSON — quote: `options[2]: "책을 읽거나 음악을 들어요보다"` |
| ko-p1-024 | ko-m24-3 | ko-m24-3-q-drawortakephoto | plausible | quote verified present in the lesson JSON — quote: `options[1]: "그림을 그리거나 사진을 찍어요보다"` |
| ko-p1-025 | ko-m24-5 | ko-m24-5-p-week | plausible | quote verified present in the lesson JSON — quote: `romaji: iljuil` |
| ko-p1-026 | ko-m24-6 | ko-m24-6-q-hobbyismusic | plausible | quote verified present in the lesson JSON — quote: `음악예요` |
| ko-p1-027 | ko-m24-7 | ko-m24-review-tail-match | plausible | quote verified present in the lesson JSON — quote: `나` |
| ko-p1-028 | ko-m25-3 | ko-m25-3-q-intendtravel | plausible | quote verified present in the lesson JSON — quote: `options: [{"id":"correct","text":"내년에 여행하려고 해요"}, {"id":"opt-1","text":"내년에 여행한 적이 있어요"},…` |
| ko-p1-029 | ko-m25-5 | ko-m25-5-p-have | plausible | quote verified present in the lesson JSON — quote: `romaji: "-n jeogi isseoyo"` |
| ko-p1-030 | ko-m25-5 | ko-m25-5-p-never | plausible | quote verified present in the lesson JSON — quote: `kana: "ㄴ 적이 없어요"` |
| ko-p1-031 | ko-m25-7 | ko-m25-7-info | plausible | quote verified present in the lesson JSON — quote: `You: 아니요. 온천에 가러 가고 싶어요. (No. I want to go to a hot spring.)` |
| ko-p1-032 | ko-m25-7 | ko-m25-7-info | plausible | quote verified present in the lesson JSON — quote: `You: 네, 일본에 가려고 해요.` |
| ko-p1-033 | ko-m26-4 | ko-m26-4-p-too | plausible | quote verified present in the lesson JSON — quote: `romaji: neomu` |
| ko-p1-034 | ko-m26-8 | ko-m26-8-cloze-but | plausible | quote verified present in the lesson JSON — quote: `correctParticle: '하지만'` |
| ko-p1-035 | ko-m27-4 | ko-m27-4-p-better | plausible | quote verified present in the lesson JSON — quote: `romaji: "-neun ge joayo"` |
| ko-p1-036 | ko-m27-5 | ko-m27-5-cloze-becomehealthy | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "해져요"` |
| ko-p1-037 | ko-m27-6 | ko-m27-6-p-becomenoun | plausible | quote verified present in the lesson JSON — quote: `romaji: "-i doeyo"` |
| ko-p1-038 | ko-m27-7 | ko-m27-7-build-musthospital | plausible | quote verified present in the lesson JSON — quote: `targetSentence: '병원에 가야 돼요?' \| tiles: ['병원에','가야','돼요?','가는']` |
| ko-p1-039 | ko-m27-8 | ko-m27-8-cloze-becomehealthy | plausible | quote verified present in the lesson JSON — quote: `correctParticle` |
| ko-p1-040 | ko-m27-8 | ko-m27-8-cloze-becomehealthy | plausible | quote verified present in the lesson JSON — quote: `options` |

## Japanese (ja) — 103 P1s

| id | lesson | step | verdict | note |
|---|---|---|---|---|
| ja-p1-001 | ja-m39-neo-2 | ja-m39-neo-2-kanji-6 | plausible | quote verified present in the lesson JSON — quote: `promptAnnotation: [{"surface":"汚い","reading":"汚い"}]` |
| ja-p1-002 | ja-m39-neo-3 | ja-m39-neo-3-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `audioText: "たかいても かう"` |
| ja-p1-003 | ja-m39-neo-5 | ja-m39-neo-5-rule-demo-concession | plausible | quote verified present in the lesson JSON — quote: `「あめでも いく。」 = Even if it's rain, I'll go.` |
| ja-p1-004 | ja-m39-neo-6 | ja-m39-neo-6-s-0 | plausible | quote verified present in the lesson JSON — quote: `Build: I'll eat anything. \| targetSentence: なんでも たべる \| tiles: ["なんで", "も", "たべる"]` |
| ja-p1-005 | ja-m39-neo-6 | ja-m39-neo-6-s-4 | plausible | quote verified present in the lesson JSON — quote: `Build: I'm not eating anything. \| targetSentence: なにも たべない \| tiles: ["なに", "も", "たべない"]` |
| ja-p1-006 | ja-m39-neo-6 | ja-m39-neo-6-s-0 | duplicate-of-ja-p1-004 | same step, overlapping quote/category as an earlier-listed P1 — quote: `Build: I'll eat anything. \| targetSentence: なんでも たべる \| tiles: ["なんで", "も", "たべる"]` |
| ja-p1-007 | ja-m39-neo-review-2 | ja-m39-neo-review-2-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `particle_cloze` |
| ja-p1-008 | ja-m39-neo-review-3 | ja-m39-neo-review-3-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `particle_cloze` |
| ja-p1-009 | ja-m40-neo-5 | ja-m40-neo-5-s-3 | plausible | quote verified present in the lesson JSON — quote: `Build: This machine was researched, and then invented.` |
| ja-p1-010 | ja-m40-neo-5 | ja-m40-neo-5-s-3 | plausible | quote verified present in the lesson JSON — quote: `tiles: ['この','きかい','は','けんきゅうされて','はつめいされた']` |
| ja-p1-011 | ja-m40-neo-9 | ja-m40-neo-9-sim-7 | plausible | quote verified present in the lesson JSON — quote: `tiles: ["どろぼうに", "さいふを", "ぬすまれた", "さいふが", "ぬすむ"]` |
| ja-p1-012 | ja-m40-neo-9 | ja-m40-neo-9-sim-7 | duplicate-of-ja-p1-011 | same step, overlapping quote/category as an earlier-listed P1 — quote: `tiles: ["けいさつに", "そうさされた", "けいさつを", "そうさした"]` |
| ja-p1-013 | ja-m40-neo-review-3 | ja-m40-neo-review-3-dlg-5 | plausible | quote verified present in the lesson JSON — quote: `ううん、どろぼうが そうさされたよ。` |
| ja-p1-014 | ja-m40-neo-challenge | ja-m40-neo-challenge-s-1 | plausible | quote verified present in the lesson JSON — quote: `きずも あった` |
| ja-p1-015 | ja-m41-neo-1 | ja-m41-neo-1-kanji-13 | plausible | quote verified present in the lesson JSON — quote: `gloss: spring` |
| ja-p1-016 | ja-m41-neo-2 | ja-m41-neo-2-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "あけてある"` |
| ja-p1-017 | ja-m41-neo-2 | ja-m41-neo-2-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `options: ["あける", "あく", "あけてある"]` |
| ja-p1-018 | ja-m41-neo-3 | ja-m41-neo-3-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "あいている"` |
| ja-p1-019 | ja-m41-neo-3 | ja-m41-neo-3-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `options: ["あいている", "あけてある", "あけている"]` |
| ja-p1-020 | ja-m41-neo-review-1 | ja-m41-neo-review-1-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "あけてある"` |
| ja-p1-021 | ja-m41-neo-5 | ja-m41-neo-5-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `correctParticle` |
| ja-p1-022 | ja-m41-neo-5 | ja-m41-neo-5-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-023 | ja-m41-neo-6 | ja-m41-neo-6-cloze-6 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "ならんでいる"` |
| ja-p1-024 | ja-m41-neo-7 | ja-m41-neo-7-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: かざってある` |
| ja-p1-025 | ja-m41-neo-review-2 | ja-m41-neo-review-2-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-026 | ja-m41-neo-review-2 | ja-m41-neo-review-2-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "ならべてある"` |
| ja-p1-027 | ja-m41-neo-9 | ja-m41-neo-9-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `particle_cloze` |
| ja-p1-028 | ja-m41-neo-10 | ja-m41-neo-10-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-029 | ja-m41-neo-10 | ja-m41-neo-10-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: はってある` |
| ja-p1-030 | ja-m41-neo-review-3 | ja-m41-neo-review-3-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-031 | ja-m41-neo-challenge | ja-m41-neo-challenge-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "あけてある"` |
| ja-p1-032 | ja-m41-neo-challenge | ja-m41-neo-challenge-kanji-3 | plausible | quote verified present in the lesson JSON — quote: `kanji: "ポスター", reading: "ポスター"` |
| ja-p1-033 | ja-m42-neo-1 | ja-m42-neo-1-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "じこ"` |
| ja-p1-034 | ja-m42-neo-3 | ja-m42-neo-3-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "しらない"` |
| ja-p1-035 | ja-m42-neo-3 | ja-m42-neo-3-challenge | plausible | quote verified present in the lesson JSON — quote: `tiles: [..., "わ", "かって", "いる"]` |
| ja-p1-036 | ja-m42-neo-review-1 | ja-m42-neo-review-1-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-037 | ja-m42-neo-4 | ja-m42-neo-4-cloze-6 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-038 | ja-m42-neo-4 | ja-m42-neo-4-cloze-6 | plausible | quote verified present in the lesson JSON — quote: `options: ["いっていた", "いう", "いっている"]` |
| ja-p1-039 | ja-m42-neo-5 | ja-m42-neo-5-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-040 | ja-m42-neo-review-2 | ja-m42-neo-review-2-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "いっていた"` |
| ja-p1-041 | ja-m42-neo-7 | ja-m42-neo-7-sim-5 | plausible | quote verified present in the lesson JSON — quote: `tiles: ["くるそうだ","けど","うわさで","こないって","くるらしい"]` |
| ja-p1-042 | ja-m42-neo-7 | ja-m42-neo-7-sim-5 | duplicate-of-ja-p1-041 | same step, overlapping quote/category as an earlier-listed P1 — quote: `tiles: ["くるそうだ","けど","うわさで","こないって","くるらしい"]` |
| ja-p1-043 | ja-m42-neo-7 | ja-m42-neo-7-sim-5 | duplicate-of-ja-p1-041 | same step, overlapping quote/category as an earlier-listed P1 — quote: `tiles: ["くるそうだ","けど","うわさで","こないって","くるらしい"]` |
| ja-p1-044 | ja-m42-neo-review-3 | ja-m42-neo-review-3-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-045 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-0 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-046 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-1 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-047 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-3 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-048 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-4 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-049 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-5 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-050 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-7 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-051 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-8 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-052 | ja-m42-neo-challenge | ja-m42-neo-challenge-fill-9 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-053 | ja-m42-neo-challenge | ja-m42-neo-challenge-kanji-3 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-054 | ja-m42-neo-challenge | ja-m42-neo-challenge-dlg-4 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-055 | ja-m43-neo-1 | ja-m43-neo-1-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "かならず"` |
| ja-p1-056 | ja-m43-neo-2 | ja-m43-neo-2-rule-kamoshirenai | plausible | quote verified present in the lesson JSON — quote: `もしかしたら、テストは むずかしいかもしれない。` |
| ja-p1-057 | ja-m43-neo-2 | ja-m43-neo-2-rule-kamoshirenai | duplicate-of-ja-p1-056 | same step, overlapping quote/category as an earlier-listed P1 — quote: `たなかさんは くるかもしれないが、ミカは ぜったい くる。` |
| ja-p1-058 | ja-m43-neo-3 | ja-m43-neo-3-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "むずかしい"` |
| ja-p1-059 | ja-m43-neo-4 | ja-m43-neo-4-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: がくせいのはずだ` |
| ja-p1-060 | ja-m43-neo-4 | ja-m43-neo-4-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `options: ["がくせいのはずだ", "がくせいはずだ", "がくせいだはずだ"]` |
| ja-p1-061 | ja-m43-neo-5 | ja-m43-neo-5-dlg-10 | plausible | quote verified present in the lesson JSON — quote: `もうちょっと まとう。` |
| ja-p1-062 | ja-m43-neo-6 | ja-m43-neo-6-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "しんぱい"` |
| ja-p1-063 | ja-m43-neo-6 | ja-m43-neo-6-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `options: ["あんしん", "しんぱい", "たいせつ"]` |
| ja-p1-064 | ja-m43-neo-review-2 | ja-m43-neo-review-2-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-065 | ja-m43-neo-7 | ja-m43-neo-7-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `correctParticle` |
| ja-p1-066 | ja-m43-neo-7 | ja-m43-neo-7-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `options` |
| ja-p1-067 | ja-m43-neo-8 | ja-m43-neo-8-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `particle_cloze` |
| ja-p1-068 | ja-m43-neo-review-3 | ja-m43-neo-review-3-cloze-3 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-069 | ja-m43-neo-challenge | ja-m43-neo-challenge-fill-0 | plausible | quote verified present in the lesson JSON — quote: `Pick the word for "health, vitality"` |
| ja-p1-070 | ja-m43-neo-challenge | ja-m43-neo-challenge-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: はずだ` |
| ja-p1-071 | ja-m43-neo-challenge | ja-m43-neo-challenge-kanji-3 | plausible | quote verified present in the lesson JSON — quote: `options: [{"id":"opt-0","text":"かなしい"}, {"id":"opt-1","text":"かない"}, {"id":"opt-2","text"…` |
| ja-p1-072 | ja-m44-neo-1 | ja-m44-neo-1-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "におい"` |
| ja-p1-073 | ja-m44-neo-3 | ja-m44-neo-3-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "げんきなようだ"` |
| ja-p1-074 | ja-m44-neo-review-1 | ja-m44-neo-review-1-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-075 | ja-m44-neo-5 | ja-m44-neo-5-challenge | plausible | quote verified present in the lesson JSON — quote: `Build: Since his face is red, it seems like he caught a cold, but even though he seems en…` |
| ja-p1-076 | ja-m44-neo-5 | ja-m44-neo-5-challenge | duplicate-of-ja-p1-075 | same step, overlapping quote/category as an earlier-listed P1 — quote: `Build: Since his face is red, it seems like he caught a cold, but even though he seems en…` |
| ja-p1-077 | ja-m44-neo-10 | ja-m44-neo-10-rule-evidential-family | plausible | quote verified present in the lesson JSON — quote: `のように needs a NOUN before it — a verb like ふっている never attaches this way.` |
| ja-p1-078 | ja-m44-neo-challenge | ja-m44-neo-challenge-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-079 | ja-m44-neo-challenge | ja-m44-neo-challenge-dlg-4 | plausible | quote verified present in the lesson JSON — quote: `kana: "しんじよう"` |
| ja-p1-080 | ja-m45-neo-1 | ja-m45-neo-1-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: 'せる'` |
| ja-p1-081 | ja-m45-neo-2 | ja-m45-neo-2-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "しかた"` |
| ja-p1-082 | ja-m45-neo-3 | ja-m45-neo-3-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `An ichidan verb drops る and adds させる whole — たべ+させる. An u-verb would instead bend to its …` |
| ja-p1-083 | ja-m45-neo-3 | ja-m45-neo-3-kanji-8 | plausible | quote verified present in the lesson JSON — quote: `reading: そうじする` |
| ja-p1-084 | ja-m45-neo-review-1 | ja-m45-neo-review-1-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `type: particle_cloze` |
| ja-p1-085 | ja-m45-neo-4 | ja-m45-neo-4-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: 'かせた'` |
| ja-p1-086 | ja-m45-neo-6 | ja-m45-neo-6-cloze-6 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: 'させる'` |
| ja-p1-087 | ja-m45-neo-review-2 | ja-m45-neo-review-2-dlg-6 | plausible | quote verified present in the lesson JSON — quote: `おやが むりやり いぬの せわを させるから。` |
| ja-p1-088 | ja-m45-neo-8 | ja-m45-neo-8-dlg-6 | plausible | quote verified present in the lesson JSON — quote: `せんせい、しゅくだいを させて いただく。` |
| ja-p1-089 | ja-m45-neo-challenge | ja-m45-neo-challenge-kanji-3 | plausible | quote verified present in the lesson JSON — quote: `規則` |
| ja-p1-090 | ja-m46-neo-1 | ja-m46-neo-1-dlg-9 | plausible | quote verified present in the lesson JSON — quote: `うん、テストの あいだ、れんしゅうしている。` |
| ja-p1-091 | ja-m46-neo-2 | ja-m46-neo-2-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `particle_cloze` |
| ja-p1-092 | ja-m46-neo-3 | ja-m46-neo-3-rule-uchi-ni-window | plausible | quote verified present in the lesson JSON — quote: `コーヒーが つめたい うちに、のむ。` |
| ja-p1-093 | ja-m46-neo-review-1 | ja-m46-neo-review-1-s-8 | plausible | quote verified present in the lesson JSON — quote: `Build: The whole time it's raining, (I) stay home.` |
| ja-p1-094 | ja-m46-neo-review-1 | ja-m46-neo-review-1-fill-4 | plausible | quote verified present in the lesson JSON — quote: `What does this sentence mean? ... 'あめが ふっている あいだ うちに いる'` |
| ja-p1-095 | ja-m46-neo-4 | ja-m46-neo-4-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "たべる"` |
| ja-p1-096 | ja-m46-neo-4 | ja-m46-neo-4-cloze-4 | plausible | quote verified present in the lesson JSON — quote: `options: ["たべている", "たべた", "たべる"]` |
| ja-p1-097 | ja-m46-neo-6 | ja-m46-neo-6-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "はじめ"` |
| ja-p1-098 | ja-m46-neo-6 | ja-m46-neo-6-cloze-5 | plausible | quote verified present in the lesson JSON — quote: `options: ["つづく", "とちゅう", "はじめ"]` |
| ja-p1-099 | ja-m46-neo-review-2 | ja-m46-neo-review-2-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "はじめ"` |
| ja-p1-100 | ja-m46-neo-review-2 | ja-m46-neo-review-2-cloze-2 | plausible | quote verified present in the lesson JSON — quote: `options: ["つづく", "ところ", "はじめ"]` |
| ja-p1-101 | ja-m46-neo-7 | ja-m46-neo-7-rule-ta-bakari-vs-ta-tokoro | plausible | quote verified present in the lesson JSON — quote: `たところ (ところだ's た-tense, from L4) reports WHERE you are in the action's timeline — one of th…` |
| ja-p1-102 | ja-m46-neo-7 | ja-m46-neo-7-rule-ta-bakari-vs-ta-tokoro | plausible | quote verified present in the lesson JSON — quote: `ところだ tracks sequence-position; ばかり foregrounds recency.` |
| ja-p1-103 | ja-m46-neo-8 | ja-m46-neo-8-cloze-6 | plausible | quote verified present in the lesson JSON — quote: `correctParticle: "おわる"` |

## Totals

plausible=135, suspect-hallucination=0, duplicate=8, total P1s triaged=143
