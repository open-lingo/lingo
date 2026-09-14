# Spanish (es) v2 local-judge sweep — P1/P2 triage

Source: `es.md` (180 lessons, m21–m38, judge qwen3.8-27b think:true). Every P1 (30)
and P2 (4) row verified against the promoted lesson JSON
(`src/pub/content/v1/es/m<N>.<hash>.json`) and, where relevant, the atom registry
(`src/features/languages/es/curriculum/atoms.generated.json`). P3 rows (22,
mostly proper-noun capitalization + minor wording) were out of scope for this
pass per the triage brief.

**Summary: 32 TRUE / 2 FALSE / 0 UNSURE.** FALSE breakdown: 2 language-error (0
invented-rule, 0 distractor-or-design-misread, 0 hallucinated-quote). Every
quoted string existed verbatim in the lesson JSON — no hallucinated-quote cases.
This is a much higher hit rate than the KO (~0.50 precision) and JA (0/8 recall
on subtle defects) validation sets in the README; ES's P1/P2 pool skews toward
gross, self-contained explanation-text errors the judge reads correctly.

## Verdict table

| lesson | step | sev | verdict | kind | one-line reason |
|---|---|---|---|---|---|
| es-m21-4 | es-m21-4-l4-c-tuvimosayer | P1 | TRUE | — | «tuve» (I had, 1sg) mislabeled "just you"; 2sg is «tuviste» |
| es-m21-5 | es-m21-5-l5-c-vimosmuseo | P1 | TRUE | — | «vi» (I saw, 1sg) mislabeled "just you"; 2sg is «viste» |
| es-m21-6 | es-m21-6-l6-c-comimosfiesta | P1 | TRUE | — | «comí» (I ate, 1sg) mislabeled "just you"; 2sg is «comiste» |
| es-m21-6 | es-m21-6-l6-c-anacarmenvivieron | P1 | TRUE | — | Ana y Carmen both female; adverb must be «juntas», not «juntos» |
| es-m21-7 | es-m21-7-l7-c-anacarmenestudiaron | P1 | TRUE | — | «estudié» (I studied, 1sg) mislabeled "you"; 2sg is «estudiaste» |
| es-m21-7 | es-m21-7-l7-c-sofiaanaescribieron | P1 | TRUE | — | «escribí» (I wrote, 1sg) mislabeled "you"; 2sg is «escribiste» |
| es-m21-7 | es-m21-7-l7-sim-carmen-finde | P1 | TRUE | — | dialogue_sim t3, same «escribí»="you" bug, 4th instance in m21 |
| es-m22-1 | es-m22-1-l1-q-elhablaba | P1 | TRUE | — | «hablo» (I speak, 1sg) mislabeled "just you"; same bug class, carries into m22 |
| es-m22-8 | es-m22-8-l8-q-tuveias | P1 | **FALSE** | language-error | «veías» DOES carry a written accent (í); judge's premise is wrong |
| es-m23-4 | es-m23-4-l4-match | P2 | TRUE | — | match gloss "he/she/you came" conflates atom «vino» with separate atom «viniste» |
| es-m25-9 | es-m25-9-l9-q-leadswithresult | P1 | TRUE | — | correctOptionId picks «por eso» but the lesson's own doctrine + this step's own explanation say «porque» leads with the result |
| es-m26-5 | es-m26-5-l5-sim-ana-parque | P1 | TRUE | — | explanation falsely calls «salimos»/«salieron» unregistered forms of salir |
| es-m26-6 | es-m26-6-l6-sp-win | P1 | TRUE | — | translation flattens imperfect/preterite to "ate"/"ate"; sibling step in same lesson renders it correctly |
| es-m27-6 | es-m27-6-l6-info-nublado | P1 | TRUE | — | "nublado never changes" is false outside the subjectless weather idiom |
| es-m28-10 | es-m28-10-l10-agr-porquepor | P2 | TRUE | — | meaningEn drops "ir" — "I need the store" vs "I need to go to the store" |
| es-m30-9 | es-m30-9-l9-map-loveopuedoverlo | P1 | TRUE | — | revealNote falsely claims feminine objects never get a fused clitic ("verla" exists) |
| es-m30-9 | es-m30-9-l9-q-piernaver | P1 | TRUE | — | opt-1 "puedo verla" is a second grammatically correct answer (two-correct-options MCQ) |
| es-m30-9 | es-m30-9-l9-q-piernaver | P1 | TRUE | — | explanation repeats the false "no fused feminine form" claim |
| es-m30-9 | es-m30-9-l9-sim-ana-ver | P1 | TRUE | — | 3rd instance of the same false "la is never fused" claim in this lesson |
| es-m31-5 | es-m31-5-l5-q-nopuedo | P1 | TRUE | — | "«duelo» doesn't exist" is false — it's a common noun (duel/mourning) |
| es-m31-5 | es-m31-5-l5-sim-carmen-clinica | P1 | TRUE | — | same false "«duelo» is never a word" claim, 2nd instance in this lesson |
| es-m31-8 | es-m31-8-l8-sim-checkpoint | P1 | **FALSE** | language-error | judge claims "nosotros duelemos" is valid; doler is an o→ue boot verb, nosotros stays "dolemos" — "duelemos" really isn't a word, the course is right |
| es-m32-2 | es-m32-2-l2-ear-libro | P1 | TRUE | — | meaningEn = "libro" (Spanish) instead of "book" (English) |
| es-m32-9 | es-m32-9-l9-q-meduelenlospies | P2 | TRUE | — | prompt "about you" reads as 2nd person but answer is 1st person ("me duelen") |
| es-m33-6 | es-m33-6-l6-lc-tienequetrabajarpuedenadar | P1 | TRUE | — | ungendered Spanish audio; both "she" (correct) and "he" (opt-3) options are equally valid, single-answer MCQ |
| es-m33-8 | es-m33-8-l8-c-tienequecomprarchaquetanueva | P2 | TRUE | — | explanation cites a "named subject" that isn't in the prompt |
| es-m33-10 | es-m33-10-l10-q-pantalonchaquetanecesito | P1 | TRUE | — | prompt is 1st person ("I"); explanation says "it's about you" |
| es-m34-1 | es-m34-1-l1-ear-mercado | P1 | TRUE | — | meaningEn = "mercado" (Spanish) instead of "market"; same class as es-m32-2 |
| es-m36-2 | es-m36-2-l2-sim-diego-tren | P1 | TRUE | — | billed answer "no está lejos" = "it is NOT far", opposite of goal/gloss |
| es-m36-6 | es-m36-6-l6-sim-carmen-aoen | P1 | TRUE | — | billed answer "no tengo una bicicleta" negates possession, opposite of goal |
| es-m37-6 | es-m37-6-l6-lb-nohayqueirentaxieslejos | P1 | TRUE | — | "es lejos" should be "está lejos" (ser vs. estar for distance/location) |
| es-m38-6 | es-m38-6-l6-sim-rosa-limpiar | P1 | TRUE | — | "«limpio» is a different word entirely" is false — it's a conjugated form of the same verb |
| es-m38-7 | es-m38-7-l7-sim-dalia-casa | P1 | TRUE | — | "«me gusta» — YOU liking it" reverses the pronoun; it means "I like it" |
| es-m38-8 | es-m38-8-l8-sim-jorge-checkpoint | P1 | TRUE | — | "está cerca al lado del jardín" stacks two locatives with no comma/conjunction — unnatural |

## Real defects to fix, grouped by module

### m21 (`src/pub/content/v1/es/m21.<hash>.json`)
Recurring bug class: 1st-person-singular preterite distractor mislabeled "you"
in `particle_cloze`/`dialogue_sim` explanations (should be "just me"/"I").

- `es-m21-4-l4-c-tuvimosayer` — explanation: `"«tuve» would be just you."` → `"«tuve» would be just me (I had)."`
- `es-m21-5-l5-c-vimosmuseo` — explanation: `"«vi» would be just you."` → `"«vi» would be just me (I saw)."`
- `es-m21-6-l6-c-comimosfiesta` — explanation: `"«comí» would be just you."` → `"«comí» would be just me (I ate)."`
- `es-m21-6-l6-c-anacarmenvivieron` — `prompt.after`: `" juntos en México."` → `" juntas en México."` (also update `audioText`; `meaningEn` "together" is gender-neutral, no change needed)
- `es-m21-7-l7-c-anacarmenestudiaron` — explanation: `"«estudié» would be you."` → `"«estudié» would be I (first person)."`
- `es-m21-7-l7-c-sofiaanaescribieron` — explanation: `"«escribí» would be you."` → `"«escribí» would be I (first person)."`
- `es-m21-7-l7-sim-carmen-finde` turn t3 — explanation: `"«escribieron» would be more than one; «escribí» would be you."` → `"...; «escribí» would be I (first person)."`

### m22
- `es-m22-1-l1-q-elhablaba` — explanation: `"«hablo» is present, just you."` → `"«hablo» is present, just yo (I speak)."`
- `es-m22-8-l8-q-tuveias` — no fix needed on the FALSE finding, but the underlying explanation ("accented, the tú ending") is a weak discriminator since veía/veíamos/veían are also accented; consider rewording to the judge's own better suggestion: `"«veías» — the -as ending marks tú."` (optional, not from this sweep's verified defect list)

### m23
- `es-m23-4-l4-match` — pair target: `"he/she/you came"` → `"he/she came"` (match the atom registry gloss for `es:vino`; `es:viniste` already covers "you came")

### m25
- `es-m25-9-l9-q-leadswithresult` — `correctOptionId`: `"correct"` (→ "por eso") → point it at opt-1 ("porque"); explanation → `"«porque» leads with the result, then gives the reason. «por eso» flips it — reason first, result after."`

### m26
- `es-m26-5-l5-sim-ana-parque` turn t2 — explanation: `"«salimos»/«salieron» are not registered forms for salir."` → `"«sale» is present tense and singular; here we need the imperfect «salían»."`
- `es-m26-6-l6-sp-win` — translation: `"I always ate at home, but yesterday I ate at the restaurant"` → `"I always used to eat at home, but yesterday I ate at the restaurant."` (match sibling step `es-m26-6-l6-agr-comia-comi` in the same lesson)

### m27
- `es-m27-6-l6-info-nublado` — body: `"«nublado» never changes: no «nublada», no «nublados»."` → reword to scope the invariance to the subjectless idiom, e.g. `"In «está nublado» (no subject), the form is fixed — but «nublado» is a regular adjective and agrees when a subject is present: «la mañana está nublada», «los días están nublados»."`

### m28
- `es-m28-10-l10-agr-porquepor` — `meaningEn`: `"...that's why I need the store"` → `"...that's why I need to go to the store"`

### m30
Recurring bug class: false claim that feminine direct-object pronouns never
fuse onto an infinitive (repeated 3x across one lesson).

- `es-m30-9-l9-map-loveopuedoverlo` — revealNote: `"Feminine things (mano, pierna, boca, nariz) only ever get the first kind: «la veo», never a fused second form."` → `"Both «la veo» and «verla» are valid; this pair contrasts the pre-verbal and post-verbal placements, both grammatical for feminine objects too."`
- `es-m30-9-l9-q-piernaver` — options: replace `opt-1: "puedo verla"` (also correct) with a genuinely wrong distractor, e.g. `"puedo ver la"`; OR reframe the prompt to test placement specifically (`"Which word order is standard?"`)
- `es-m30-9-l9-q-piernaver` — explanation: `"There is no fused second form for feminine things — that would need a pointer that doesn't exist."` → `"Both «la puedo ver» and «puedo verla» are valid; «la puedo ver» is the more common pre-verbal order."`
- `es-m30-9-l9-sim-ana-ver` turn t2 — explanation: `"«pierna» is feminine — the pointer is «la», never fused onto the verb; it goes in front of «puedo ver», the same slot «lo» takes for masculine things."` → drop "never fused onto the verb"; state pre-verbal placement as the more common order without claiming the fused form is impossible

### m31
- `es-m31-5-l5-q-nopuedo` — explanation: `"Never «duelo»; that word doesn't exist."` → `"«duelo» is not a conjugation of «doler» here — the verb never takes a personal ending like that."`
- `es-m31-5-l5-sim-carmen-clinica` turn t1 — explanation: `"«duelo» is never a word; «duele» never conjugates to the person."` → same fix as above
- `es-m31-8-l8-sim-checkpoint` — **no fix**; judge's finding is FALSE (see FALSE breakdown below)

### m32
- `es-m32-2-l2-ear-libro` — `meaningEn`: `"libro"` → `"book"`
- `es-m32-9-l9-q-meduelenlospies` — prompt: `"Which one means 'hurt' for «los pies» (plural, about you)?"` → `"Which one means 'my feet hurt' (plural, first person)?"`; explanation: reword the "since it's about you" justification to "since the speaker is the one feeling the pain, use «me»"

### m33
- `es-m33-6-l6-lc-tienequetrabajarpuedenadar` — opt-3: `"He has to work, but he can swim tomorrow"` → replace with a genuinely wrong option (e.g. `"She has to work, but she wants to swim tomorrow"`), or add a gendered subject to the audio/transcript
- `es-m33-8-l8-c-tienequecomprarchaquetanueva` — explanation: `"A named subject takes «tiene», not «tienes» (tú)."` → `"The subject is 3rd person (she, implied), so use «tiene», not «tienes» (tú)."`
- `es-m33-10-l10-q-pantalonchaquetanecesito` — explanation: `"and «necesito», not «necesita» — it's about you."` → `"and «necesito», not «necesita» — the subject is «yo» (I)."`

### m34
- `es-m34-1-l1-ear-mercado` — `meaningEn`: `"mercado"` → `"market"`

### m36
Recurring bug class: `dialogue_sim` "no" answer negates the verb instead of
producing the discourse-level "No, <affirmative>" the goal/gloss ask for.

- `es-m36-2-l2-sim-diego-tren` turn t2 — `answer`: `"no está lejos"` → `"está lejos"` (drop the "no" — goal is affirming distance, not the earlier "no, going by train" pattern)
- `es-m36-6-l6-sim-carmen-aoen` turn t2 — `answer`: `"no tengo una bicicleta"` → `"no, tengo una bicicleta"` and add a comma tile so the tile bank can build the discourse-"no" + affirmative reading

### m37
- `es-m37-6-l6-lb-nohayqueirentaxieslejos` — `targetSentence`/`correctOrder`/tiles: `"es lejos"` → `"está lejos"` (ser→estar for distance)

### m38
- `es-m38-6-l6-sim-rosa-limpiar` turn t2 — explanation: `"never «limpio» here, that's a different word entirely"` → `"never «limpio» here — after «quiero» you use the bare infinitive, not the conjugated form."`
- `es-m38-7-l7-sim-dalia-casa` turn t1 — explanation: `"«me gusta» — YOU liking it, one thing (the house)."` → `"«me gusta» — I like it, one thing (the house). Not «te gusta» (that's Dalia liking it) and not «gustan» (more than one thing)."`
- `es-m38-8-l8-sim-jorge-checkpoint` turn t2 — `answer`: `"está cerca al lado del jardín"` → `"está al lado del jardín"` (matches goal "beside the garden") or `"está cerca del jardín"` (matches "close to the garden")

## Classes (FALSE findings, one example each)

- **language-error** (2/2 FALSE) — the judge itself asserted an incorrect
  Spanish-language fact while criticizing the course:
  - `es-m22-8-l8-q-tuveias`: judge said "«veías» has no written accent mark" —
    it does (the í). The underlying pedagogical weakness (accent doesn't
    uniquely mark tú, since veía/veíamos/veían are also accented) is real but
    that is not the claim the judge made, so it's scored FALSE against the
    literal finding.
  - `es-m31-8-l8-sim-checkpoint`: judge asserted "nosotros duelemos" is a
    valid conjugation of doler. It is not — doler is an o→ue boot verb and
    boot verbs never diphthongize in nosotros/vosotros (correct form:
    "dolemos"). The course's original explanation was right; the judge
    invented a conjugation that doesn't exist.

No **invented-rule**, **distractor-or-design-misread**, or
**hallucinated-quote** FALSE cases this pass — every quoted string existed
verbatim, and every P1/P2 defect the judge flagged as a course bug (other than
the two above) checked out as real when read against the actual lesson JSON,
sibling steps, and the atom registry. This is the opposite of JA's
`particle_cloze` invented-rule pattern (where a whole step-type convention got
mistaken for a bug): here the two false positives are narrow, self-contained
Spanish-conjugation slips by the judge itself, not a misunderstanding of a
course-wide authoring convention.
