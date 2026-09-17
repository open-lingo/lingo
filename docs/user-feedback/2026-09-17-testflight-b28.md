# TestFlight feedback — build 28 (2026-09-17)

Verbatim from ASC (`scripts/asc/pull-feedback.mjs`), screenshots in `testflight-feedback/NNN.jpg` (untracked). Triage follows the QA-walk protocol: fix inline, ledger each, audit after. Lead root-cause notes are in §2; lanes append their findings per row.

## 1. Items

| # | Time (UTC) | Verbatim | Class (lead) | Status |
|---|---|---|---|---|
| 186 | 23:17 | This step still fails, insane issue we have never fixed this is importsnt, need to stop fuxking it up some how | kanji_reveal shows い over 家 (reading truncated) — render/segmentation | open |
| 187 | 23:17 | This one worked though, strange  | same step type, worked — control case | open |
| 188 | 23:19 | I think this failed similarity check but it was basically there  | speaking: kanji transcript rejected vs kana target | open |
| 189 | 23:20 | Why not accepting? | speaking: same | open |
| 190 | 23:20 | But it accepted this one, I don’t know if the previous one got my kanji wrong but I should have said it correctly  | speaking: same (accepted once → timing) | open |
| 191 | 23:22 | Nice here, the shrink lets this fit, but we still want to eliminate scroll bar  | cloze: post-answer scroll (explanation box) | open |
| 192 | 23:23 | Just the word endings are preferred on things like this, look how long they are, they all use sotsugyou anyways | cloze options share a stem — factor the common prefix | open |
| 193 | 23:23 | Forces scroll too | cloze: post-answer scroll | open |
| 194 | 23:26 | Holy shit same renshusuru failure here, you need INCREDIBLY good research here, this is a miserable failure how do we fuck it up every time  | れんしゅうする tile in kana while sibling verbs show kanji — dual-atom class (#104/#110/#163) | open |
| 195 | 23:27 | This doesn’t scroll, it shouldn’t, but you have 4 options seeded here. Another sloppy regression, why are we failing every time  | listening MCQ renders 4 options, 4th clipped (cap 3 gated on compact) | open |

## 2. Lead root-cause notes

(see lane sections below)
