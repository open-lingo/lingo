# Test-outs ignored the romaji/furigana ladder

**Status:** FIXED. Shared provider component + regression test with a
reproducing instrument control.

Reported by Spencer 2026-08-18 on an m31 test-out — 「先生に 辞書を いただいた」
rendered with romaji over its kana (`ni`, `o`, `i ta da i ta`) — *"check the
furigana and romaji displays inside the test outs, doesnt seem they respect
it the same as normal lessons."*

## Cause

The script ladder is decided at RENDER time from two React contexts, and the
test-out page mounted neither:

| context | what it gates | absent behaviour |
|---|---|---|
| `LessonModuleContext` | the romaji ladder — hiragana retires at M7, katakana at M17 | falls back to the persisted `hiraganaRomajiAutoOff` flag, which only flips when an **M7+ lesson is completed** |
| symbol mastery (`LanguageSymbolMasteryProvider`) | the per-kana helper fade | `useSymbolMastery` returns a NOOP whose `isHelperHidden` is always false — every kana keeps romaji forever, and exposures stop counting toward mastery |

Both were mounted by `LessonPage` and by nothing else. `PlacementTestPage`
renders the module's OWN lesson steps (`deriveModuleTestOut` samples them
verbatim), so identical content rendered two different ways depending on
which page it was mounted under.

This is precisely the leak `LessonModuleProvider` was introduced for — its
own doc comment names "QA jump, deep link, isolated draft review" as the
cases where the one-shot flag is stale. A test-out is a fourth case nobody
wired up.

## Measured, on the real route (`/ja/learn/test-out/m31`)

| | romaji helper elements | kanji rendering |
|---|---|---|
| before | **33** on one step (`が`→ga, `を`→o, `もらいたい`→mo-ra-i-ta-i) | お金 → `ka ne` in **romaji** |
| after | **0** | 傘/お金/時計 → かさ/かね/とけい in **kana furigana** |

The before state also violated pinned invariant 2 — never romaji and kanji on
the same word — which is how far the drift had gone.

## Fix

`features/lesson/components/LessonStepEnvironment.tsx` mounts both contexts
as a unit, so a step-rendering surface opts into the whole ladder or none of
it rather than inheriting whichever providers its page happened to mount.
`LessonPage` and `PlacementTestPage` both use it.

Two details worth keeping:

- **The mastery provider is mounted only when one is not already above.**
  Nesting is not harmless: each instance keeps its own `useState` copy of the
  store and persists to the same localStorage key, so the inner one's writes
  clobber the outer one's. `LessonPage` mounts it around the whole page, not
  just the step, and that scope is unchanged — `useHasSymbolMastery()` (new,
  in `shared/symbolMastery`) distinguishes "no provider" from "provider with
  nothing mastered", which `useSymbolMastery`'s never-throw NOOP cannot.

- **The module index follows the QUESTION, not the page.** A test-out serves
  one module, but banded placement walks several, so `PlacementTestPage`
  tracks `currentModuleId` from the selected item and each question renders
  with its own module's ladder state.

## Guard

`features/placement/testOutScriptLadder.test.tsx` renders every derived m31
test-out step and asserts no `<rt>` contains Latin text — plus an
**instrument control that renders the same steps with no environment and
requires the leak to still reproduce**. Without that second test the first
would keep passing if `LessonStepEnvironment` became a no-op, or if m31's
content simply stopped containing annotatable kana.

## Not changed

`PreviewLessonPage` mounts the mastery provider but no module provider. That
is left alone deliberately: preview is the pre-signup first-taste surface
with its own content shape and no module identity, and romaji there is
wanted.
