# Audit B — Grammar band m8-m13 (て-form, past た, い-adjectives, な-adjectives, たい/ほしい)

Scope read in full: HOW-TO-READ.md, m8, m9, m10, m11, m12, m13. Verified absences
against m1-m7 with grep before filing "untaught" claims. Did not read m1-m7 or
m14-m29 in full; findings about "before m9/m12" are grep-verified, findings
about "will this be explained later" are scoped to what I could see.

---

### い-adjective attributive (adnominal) use is drilled — including a free `translate` — three lessons before any card teaches it
module/lesson/step: m9 L12 (ja-m9-neo-8) steps 8, 11, 16; m9 L14 step 6, 16; m9 L15 (challenge) steps 12, 16
severity: major
effort: S
confidence: verified
evidence: m9 L7's grammar_rule ("Cheap and expensive") only ever models い-adjectives as PREDICATES: "これは たかいです", "これは たかい". No card in m8 or m9 shows an い-adjective directly modifying a noun (adnominal use, e.g. やすい パン). Yet: m9 L12 step 8 build_sentence "I buy cheap bread" (tiles かう|やすい|パン|に|を|のむ|たべる) requires やすいパンを かう; L12 step 11 "I don't buy expensive books" requires たかい ほんは かわない; L14 step 6/16 drill listening/comprehension of たかい めがねは かいません; and critically L15 step 12 is a `translate` (free production, no tiles) for "I won't buy an expensive umbrella," which requires the learner to spontaneously generate an い-adjective+noun phrase. Grepped m1-m7: no adjective vocabulary or "adjective" rule text appears at all before m9 L7 (`grep -n 'い-adjective\|adjective' m1-m7.md` → 0 hits in the relevant sense). The actual rule ("put it straight in front of a noun and it needs no glue either: ちいさい ねこ") is not stated until m12 L1 (ja-m12-neo-1) — three modules later.
why it matters: a learner who has only ever seen たかい/やすい as sentence-final predicates has no taught basis for producing or parsing them stuck directly onto a noun with no copula; the free-translate step in m9 L15 asks them to invent an unmodeled structure, and the actual rule card that would have licensed it doesn't arrive until m12.

---

### m12's な-adjective card states a false absolute that its own module immediately contradicts
module/lesson/step: m12 L6 (ja-m12-neo-5), grammar_rule step 1
severity: major
effort: XS
confidence: verified
evidence: "That な is the whole reason for the name, and it is the only place the two classes look different: an い-adjective needs nothing there (おおきい いえ)." This is stated as an unqualified absolute. It is false even within m12 itself: L1 already established い-adjectives never take だ while L6's own text says な-adjectives DO ("it borrows the copula exactly like ねこだ: げんきだ") — a second difference visible in the very same card. Two lessons later L7 (じゃない vs くない) and L9 (だった vs かった) each show a further place the classes conjugate completely differently.
why it matters: the claim is presented as the definitive one-fact summary of "how the two classes differ," and it will be contradicted by the next two lessons the learner does in the same module — exactly the kind of tidy-but-wrong simplification that has to be unlearned within the hour, not months later.

---

### すき/きらい card teaches "the liked thing takes が" then demonstrates and drills は instead, unexplained
module/lesson/step: m13 L10 (ja-m13-neo-7), grammar_rule step 1 and step 10 (build_sentence)
severity: major
effort: S
confidence: verified
evidence: Card text: "...which is exactly why the thing you like takes が, the same が as ほしい." Four of five worked examples use が (ちいさい ねこが すきだ / あたらしい うたが すきだ / きゅうりが きらいだ / すきな いろは あかい — の-modified). The fifth, closing example switches markers with zero comment: "とりにくは すきじゃない。 — I don't like chicken." The very next exercise (step 10, "Build: I don't like chicken") supplies tiles は/を/で/じゃない but no が at all, forcing the は construction the card never explained.
why it matters: the card's own stated rule ("the thing you like takes が") is falsified by its own last example and the following drill, with no acknowledgment that negation commonly pulls the marked item to は (contrastive/topic は) — a learner checking the rule against the example will find them in conflict and have no way to resolve it from what's on the card.

---

### しる is introduced as a memorised whole-word set, silently re-triggering the "fake る-verb" trap m5 promised to revisit
module/lesson/step: m10 L11 (ja-m10-neo-7), grammar_rule step 1
severity: minor
effort: S
confidence: verified
evidence: しる is a textbook member of the -iru-that-conjugates-as-う-verb class (しります/しらない/しった, not the ichidan pattern the learner has drilled since m6 L1: たべる→たべない, みる→みない). m5 explicitly flagged this exact category with わかる: "わかる looks like a る-verb but bends like a う-verb — just a flag for later" (m5.md:387), and m6 L2 delivered on that flag by showing わかる→わからない alongside genuine う-verb sound changes. しる gets no such treatment: the m10 L11 card presents しります/しりません/しらない as fixed vocabulary ("Politeness lives in the tail, exactly as it does for every other verb") without ever contrasting it against the ichidan pattern or naming it as the same trap category as わかる. Grep confirms しる never appears anywhere in m1-m9, and never reappears in m11-m13 (so it is never actually put through a conjugation_transform task in this band — the risk is latent, not yet realised).
why it matters: because every exercise in m10 L11 hands the learner pre-conjugated しります/しらない/しりません as whole tiles, no wrong answer is currently possible — but the moment a later module asks the learner to conjugate しる themselves from scratch, the ichidan-by-analogy instinct built up since m6 (drop る, add ない/ます) will misfire, and the m5 "flag for later" was never actually redeemed for this verb.

---

### The て/た sound-change table's ぐ-row is stated but never exemplified or drilled anywhere in the band
module/lesson/step: m8 L3 (ja-m8-neo-2) grammar_rule step 1; m11 L6 (ja-m11-neo-4) grammar_rule step 1
severity: minor
effort: S
confidence: suspected
evidence: Both the て-form table (m8 L3: "ぐ → いで") and the た-form table (m11 L6: "ぐ → いだ") state the row as part of the five-way split, but neither card gives a worked example for it (all worked examples are む/ぶ/ぬ, う/つ/る, or く verbs), and no ぐ-ending verb (e.g. およぐ, いそぐ) appears anywhere as vocabulary in m8-m13 — confirmed by grep across all six files. The Stop 6 and Stop 11 trainer nodes only show "a sample of the 6," so it is possible the row is exercised off-page, hence "suspected" not "verified."
why it matters: a learner who meets their first ぐ-verb after this band has been told the rule but never seen or practised it, so the row is pure trivia rather than taught-and-tested material — a small completeness gap in an otherwise fully worked table.

---

### いく used to accept an invitation to "come" is never explained, and the course's own rule card teaches the opposite equivalence
module/lesson/step: m8 L4 (ja-m8-neo-3) step 12 (dialogue_listen)
severity: minor
effort: M
confidence: suspected
evidence: The L4 grammar_rule states plainly "する → して and くる → きて... The third is いく" with worked translations いく = "to go," くる = "to come" as a fixed opposed pair. The very next dialogue in the same lesson: Ken says "きょう いえに きて" (come to my house today); Mika replies "うん、いく" — and the question "Will Mika come?" expects "Yes." This is correct, natural Japanese (motion verbs in Japanese are anchored to the speaker's own reference point, not the addressee's, so accepting an invitation to the addressee's location uses いく, not くる) — but the card the learner just read teaches いく/くる as simple mirror-image translations of "go"/"come," with no mention that accepting an invitation flips which one an English speaker would reach for.
why it matters: a learner applying the card's stated equivalence literally would expect Mika to answer くる ("I'll come") and may read her いく as a non-answer or a change of subject, rather than as agreement — the comprehension question is still answerable from うん alone, which is likely why this hasn't surfaced as a hard failure, but the underlying mismatch between the taught translation and the natural usage is never addressed.

