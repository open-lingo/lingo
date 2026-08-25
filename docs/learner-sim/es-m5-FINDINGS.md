# ES m5 — learner-sim findings (combined walk, 2026-08-25)

One Opus fresh-learner combined walk (confusion + retention) of the
Sonnet-dispatched, fable-reviewed m5. Praise: family arc coherent, the
tengo/tienes flip lands, Diego's wallet gag "still funny". Fix round
applied same session.

## Fixed
- **6 "dead" listening_builds** — the learner-view emitter read
  `step.target`/`step.promptEn` where the compiled type carries
  `targetSentence`/`prompt`, so every lb rendered `audio plays: ""` in
  the VIEW. App was always fine; emitter fields fixed, m4–m7 views
  re-emitted. (Second emitter defect in this lane — the type keys are
  now the checked reference, not memory.)
- **tiene positional shortcut** (subject-before-blank always meant
  tiene; sentence-initial blank never did) → lane got both breakers:
  «yo tengo un hermano» (subjectful TENGO) and «___ cinco años»
  glossed "she is five (your sister)" (initial-blank TIENE).
- **Builds always targeted tu-forms** → two flipped to mi:
  «mi familia está aquí», «mi abuela tiene una foto» (tu tiles demoted
  to distractors; 2 mi / 3 tu overall).
- **madre never produced from English** → cp recall «el gato» became
  «mi madre» (printed L2, license clean) + L7 match touch swapped in
  «mi madre»; padre production arrives via the (now-visible) L8
  listening build «mi padre tiene un perro».
- **Sofía's photo sim wore 👦** → 📷.
- **L2 ear duplicated L1's el-perro target/set** → target flipped to
  el gato.
- **3 byte-identical match_pairs sets (L5/L8/L10)** → varied; the
  gracias filler pair cut from two of them (¿cuántos?/años/el celular/
  la puerta/el agua/tienes now carry real m5 retrieval).
- **L10 filler textMcq on mi** → retargeted to ¿cuántos? (the item the
  walker predicted losing).
- **«¿tiene Diego un perro?» inversion** (unmodeled V-S order) →
  «¿Diego tiene un perro?», matching L6's subject-first question
  pattern.

## False alarms / kept
- "«¿cómo te llamas?» never taught" — it IS (m2 prints it; the walk
  prompt's persona summary omitted it — prompt defect, noted for the
  full-course QA config).
- L10 goodbye "two right answers" — alsoCorrectOptionIds already
  accepts adiós; acceptance is invisible in stripped views. Recurrent
  false-alarm class; never "fix".
- Bare «tengo ocho años» speaking cards — the required printed voicing;
  sims carry the age frame.
- hay-always-wrong in the tengo/hay lane — L1's discrimination teaches
  the contrast; noted for the course-wide QA to confirm hay stays live
  in m4's own lane.
