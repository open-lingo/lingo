# FR speech grading — venir de + infinitif recent-past (2026-09-10)

Verification for `docs/fr-m20-brief-2026-09-10.md`'s §6/§7 required item.
Test: `src/features/languages/fr/__tests__/frSpeechRecentPast.test.ts` (real
`scoreAlternativesGeneric`; `loose-match.ts` unchanged — 338/338 speech tests green,
incl. elision + negation + near-future).

## Does the matcher grade the recent-past frame correctly?

**Colloquial reduction/elision generalizes cleanly** (same leniency already
verified for elision/negation/near-future): "j'viens de manger"/"t'viens de
parler" (0.933), s-dropped "je vien de manger" (0.933), over-elided "je
viens d'manger" (0.933). No fix needed. **`de`-vs-`d'` before a vowel-onset
infinitive is fine both directions** ("il vient d'arriver" vs un-elided
hearing 0.938; "d'habiter Paris" 0.952) — confirms `habiter`'s exclusion was
an authoring-correctness call (an unelided "vient de habiter" is wrong
French), not a grading gap. **Infinitive/participle homophony does NOT get
rejected, as required** ("manger"/"mangé", "parler"/"parlé", "visiter"/
"visité" — 0.867–0.905, all perfect).

**Five false-positive risks, none fixed** (matcher-wide edit-distance work,
not a targeted fold):
- **vient/viens vs bien**: bare word either direction 0.6 (close) — **"je
  bien de manger" is NOT rejected**; embedded sentence 0.867–0.905, worse.
- **il vient de / elle vient de**: WORSE than m19's aller precedent — bare
  phrase already passes (0.727 vs m19's bare fail at 0.5); embedded 0.87.
- **je viens de / tu viens de**: NEW risk — "viens" is identical
  spelling+sound for je/tu; swap fully absorbed (0.867).
- **je viens de / je vais** (m19): bare 0.714; sentence 0.733 — both close.
- **je viens de Paris** (m2-ish origin) vs **je viens de manger** (recent
  past): 0.733 — shared 3-word chunk, same class as m18's jamais/rien find.

**True negatives hold**: truncated "je viens" fails (0.467); L6's own bridge
pair "elle a mangé" vs "elle vient de manger" fails (0.471); unrelated
sentences fail (0.429).

## Constraints for the m20 dispatch (paste verbatim)

1. Colloquial reductions/elision/participle-homophone spellings grade safely — author freely.
2. Never let a `speaking` target discriminate subject — all four chunks
   cross-substitute as passes, even bare-phrase `il`/`elle`. Use build/cloze/MCQ
   for cast discrimination (L2 je/tu, L4–L5 gender).
3. `vient`/`viens` vs `bien` is NOT rejected at any length — never gate a `speaking` step's pass/fail on that distinction.
4. Recent-past vs `je vais` (m19) and vs origin-sense `je viens de` both
   false-positive — put those contrasts in the L1/L6 bridge CARDS, not
   speaking, per the brief's own §4 design.
5. **Lift "written-only" only for L6's passé-composé bridge** (correctly
   fails, safe to speak); keep L1/L2/L4/L5 written-only until promoted — the
   module's whole point (subject/sense) is what grading can't verify. Spencer's
   ear/device check is still final.
