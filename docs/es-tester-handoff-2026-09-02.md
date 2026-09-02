# Spanish tester handoff (2026-09-02)

**Status:** LIVE · for a first-time outside tester, not an author.

Spanish modules **m1–m10** are live and selectable. This page is what a tester
needs and nothing else: where to go, what we already know is imperfect (so it
doesn't get re-reported), and the ONE question the walk has to answer.

## Where to walk

| Surface | URL |
|---|---|
| The course as a learner sees it | `https://app.openlingoapp.com/es/learn` |
| Lesson picker / test-drive page | `https://app.openlingoapp.com/es/qa` |
| A specific step | `…/es/learn/lessons/es-mN-L?step=K&trace-gate=0` |

`?step=K` is **0-indexed**, and `&trace-gate=0` skips the gate that would
otherwise make you finish earlier steps first. The iOS TestFlight build carries
the same content if she'd rather test on a phone —
<https://testflight.apple.com/join/qAtpGA8E>.

## The one question that matters

**m10 teaches the `-ar` verb machine — does it actually teach it?**

Everything in m1–m9 builds fixed formulas (*tener* phrases, *quiero*, *me
gusta*). m10 is the first module where a learner has to CONJUGATE: take an
infinitive and produce the right ending. Our own note on it says the machine is
*"scaffolded, never tested"* — every practice item hands over a verb the lesson
already showed.

Measured rather than assumed: m10 ships **zero `conjugation_transform` steps**
— the step type whose whole job is "here is a form, produce another one." Its
closest lesson is titled *"Same machine, new verb"*, and the new verb is one
the lesson hands over first.

So the thing to watch for, specifically in **m10 L4 and the L10 finale**: after
finishing, could she take a Spanish `-ar` verb she has never seen — say
*cocinar* — and produce *cocino*? If the honest answer is no, m11 needs a
transfer-test step before it is written, and that is exactly the decision this
walk unblocks. **m11 is deliberately not authored until this walk happens.**

## Already known — please don't re-report

These are logged; a tester hitting them is confirmation, not news.

- **`match_pairs` shows up in nearly every lesson** and reads as repetitive.
- **Info cards run long on a phone.**
- **m4 leans on «llave» (key) as its example noun** far too often.
- **Speaking steps hide the answer**, so "Show answer" feels like a penalty.
- **Gender agreement is drilled hard in build steps.** That one is deliberate —
  Spanish gender is the thing English speakers skip — but it does feel heavy.
- **Build-sentence word order is strict.** A correct but differently-ordered
  Spanish sentence («ahora voy a la playa») can grade wrong. Real bug, known,
  mitigated for now by the English prompt pinning the expected order.
- **A stray tile can appear in a build bank** that isn't part of any right
  answer.

## Worth reporting

Anything that makes her feel **stupid rather than stretched**:

- a prompt where she cannot tell what is being asked
- an answer marked wrong that she can argue is right (paste the exact text)
- audio that doesn't play, or a voice that sounds wrong for the speaker
- a word the lesson expects her to know that it never taught
- anywhere she wanted to quit

Lesson id + step number + what she typed beats a description every time.
The ids are in the URL.

## What to do with findings

Same protocol as the JA walks (`docs/learner-sim/` holds those): **ledger every
failure, fix nothing mid-walk.** Stopping to fix breaks the flow that makes a
walk worth doing. One line per finding, then triage after.
