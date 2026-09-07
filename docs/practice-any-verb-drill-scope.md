# Scope: "any verb I've learned" conjugation drill (TestFlight #41)

Spencer, build 8: "this screen is a little ugly on mobile, maybe we rework the
buttons a bit and then we should scope out adding more conjugations — they
should be able to see ANY verb they've learned here if they want to do 'up to
X module'."

## What exists

- `src/features/practice/conjugation/FreeDrillPage.tsx`: Mode (Verbs /
  い-adjectives), Level "Up to M{n}", a chip per form (ます, て, た, ない, たい,
  ない-past, たい-neg/past/neg-past, volitional, ば). The provider
  (`src/features/languages/ja/conjugation/provider.ts`) draws verbs from the
  taught pool up to the level and the checked forms, weighted; no SRS write.
- The pool is already "every verb taught up to M{n}" — the ask is not a new
  pool, it is (a) seeing the list and (b) more forms.

## Proposed shape

1. **Verb browser.** A "Verbs in this range (42)" disclosure under the Level
   picker: dictionary form + gloss + class chip, tap to pin one verb (drill only
   that verb across the checked forms). Pinning is what "see ANY verb" means
   in practice.
2. **More forms.** Forms the engine already conjugates but the drill does not
   expose: potential (られる/える), imperative, prohibitive (〜な), causative,
   passive, conditional たら, and the polite past/negative pairs. Gate each by
   the module that teaches it (same `unlockModule` idea as kanji) so "Up to
   M12" never offers a form from M30.
3. **Buttons.** Form chips → one two-column list of toggles with the form name
   and a one-word example (たべる → たべて). Drops the ragged three-per-row
   flow that reads as clutter on a 393px viewport.

## Cost

- Browser + pin: ~1 day (provider filter + list UI + tests).
- Forms: the engine side is done for potential/imperative/conditional
  (`src/shared/conjugation`); each form is a chip + a gate + distractor rules
  (`formationDistractors.ts`) ≈ 2–3 h each.
- Chips restyle: half a day, already partly done in the 2026-09-07 fit pass.
