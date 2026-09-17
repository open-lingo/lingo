#!/usr/bin/env python3
"""
A5d calibration-set assembler.

Reads candidates-<lang>.json (real sentences extracted from emitted
content, scripts/naturalness/calibration/extract-sentences.mjs) and merges
in hand-authored Sonnet-5 (frontier) labels for every real row, plus a set
of PLANTED rows (real course sentences deliberately corrupted into an
unambiguous grammar/naturalness violation, "wrong by construction").

These are MODEL labels, not native-speaker labels. KO and JA rows are
marked low_confidence=true across the board per the brief -- the labeller
is a frontier LLM (Claude Sonnet 5) reading JA/KO as a strong non-native
reader, not a native speaker; ES/FR rows are high-confidence (fluent).
Any row with a specific noted defect still gets a reason either way.

Writes: scripts/naturalness/calibration/<lang>.json
  [{ sentence, label: "natural"|"unnatural", reason, source_lesson_id,
     kind: "real"|"planted", low_confidence: bool, stepType }]
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

def load_candidates(lang):
    with open(os.path.join(HERE, f"candidates-{lang}.json"), encoding="utf-8") as f:
        return json.load(f)

# ---------------------------------------------------------------------
# Default reason for a real row judged natural, when no specific defect
# was found on read-through (all languages): keep it short + honest.
DEFAULT_NATURAL_REASON = "Grammatical, natural word choice/order/register on read-through; no defect found."

# Per-language exceptions: index -> (label, reason, low_confidence override)
EXCEPTIONS = {
    "ja": {
        # All 40 JA real rows read as natural JA to a strong non-native
        # reader (see doc caveat) -- no exceptions.
    },
    "ko": {
        # All 40 KO real rows read as natural to a non-native intermediate
        # reader -- no exceptions (see doc caveat: lowest-confidence set).
    },
    "es": {
        15: ("unnatural",
             "'por eso hacían la tarea' uses imperfect (ongoing/habitual) for a single "
             "completed causal result; a native speaker would use preterite 'hicieron' "
             "for one specific consequence.", False),
        20: ("unnatural",
             "'se lavo' mismatches person: 'se' is 3rd-person reflexive but 'lavo' is "
             "1st-person present ('yo lavo'). Should be 'se lava' (3rd) or 'me lavo' (1st), "
             "or 'se lavó' (3rd preterite, accented) if past.", True),
        30: ("unnatural",
             "'soy siempre muy bueno' places the adverb after the verb; natural Spanish "
             "fronts it ('siempre soy muy bueno') or moves it to the end.", False),
    },
    "fr": {
        3: ("unnatural",
            "'je n'habite pas le chocolat' uses habiter ('to live [somewhere]') where the "
            "verb must be aimer ('to like'); wrong verb for the construction -- looks like "
            "a copy/templating slip (same lesson also has the correct 'je n'aime pas le "
            "chocolat').", False),
        7: ("unnatural",
            "'il est allée' -- masculine subject 'il' with feminine-agreed past participle "
            "'allée'; should be 'il est allé'. Classic être-auxiliary gender-agreement error.", False),
        18: ("unnatural",
             "'c'est ouverte' agrees the adjective with an implied feminine referent, but the "
             "paired negative answer in the SAME lesson ('non, c'est ouvert') uses the "
             "standard invariant masculine -- the pair is internally inconsistent, and "
             "'c'est + adjective' conventionally stays invariant masculine regardless of the "
             "referent's gender.", True),
        22: ("unnatural",
             "'oui tu aimes la ville' answers a yes/no question about the SPEAKER's own "
             "opinion by restating it in 2nd person ('you like the city') instead of "
             "'oui, j'aime la ville' -- a person/pronoun mismatch between question and answer.", False),
    },
}

# ---------------------------------------------------------------------
# Planted rows: (base_index into candidates, corrupted sentence, reason).
# All constructed by hand-corrupting a real course sentence into an
# unambiguous grammar/naturalness violation. label is always "unnatural",
# confidence is high (these are deliberately obvious).
PLANTED = {
    "ja": [
        (2, "トムは にほんを いくと おもう",
         "Wrong particle: 行く (destination motion) takes に, not を; 'にほんを いく' is ungrammatical here."),
        (15, "ねこだ これは",
         "Word order broken: topic-comment order reversed with no pragmatic marking; not a natural SOV utterance."),
        (34, "きゅうりを たべなく",
         "Incomplete/wrong negative form: 'たべなく' is not a finish predicate; should be たべない."),
        (9, "えんぴつを ふたつ かいます だ。",
         "Register mixing: -ます (polite) stem followed by plain copula だ in the same clause is ungrammatical."),
        (24, "ミカは うみで およぐいる",
         "Missing te-form connector: 'およぐいる' should be およいでいる (て-form + いる)."),
        (38, "あした じゅぎょうが あるだったので うちに いる",
         "Ungrammatical copula chain: あるだった mixes the plain-present verb ある with だった (past copula) with no connective sense."),
        (7, "ミカは あした くるを いっていた",
         "Wrong quotative particle: quoted clause + と いう requires と, not を."),
        (29, "てが いたいから きょうは かいしゃに いかないない",
         "Double negation suffix: いかないない is not a word; the negative form only takes ない once."),
    ],
    "ko": [
        (4, "우리 가족을 네 명이에요",
         "Wrong particle: topic '우리 가족은' marked with object particle 을 instead of topic 은 — ungrammatical."),
        (20, "밥을 먹고 싶어어요",
         "Double -어 ending: '싶어어요' is not a word; should be 싶어요."),
        (16, "가면인 안 돼요",
         "Nonsense particle insertion: 인 does not attach to the conditional -면 form; ungrammatical string."),
        (38, "겨울에 춥어요",
         "ㅂ-irregular conjugation error: 춥다 conjugates to 추워요 (ㅂ→우 irregular), not the regular 춥어요 — a textbook learner mistake."),
        (2, "운동이 싫어해요",
         "Particle mismatch: the verb 싫어하다 is transitive and takes 을/를 as its object marker, not 이/가 (that pattern belongs to the adjective 싫다)."),
        (9, "저는 커피가 더 좋아요는",
         "Trailing particle nonsense: 는 appended after a complete sentence-final -요 form is not grammatical Korean."),
        (27, "못 안 먹어요",
         "Stacked negation: 못 and 안 are both negators and are not natively combined this way; only one negation marker is used."),
        (37, "머리가 아파요. 그리고 열이 나와요",
         "Wrong collocation: a fever is described with the fixed collocation 열이 나다 ('a fever comes out/arises'); 나와요 (from 나오다) is not the idiom used for symptoms."),
    ],
    "es": [
        (19, "tengo nueve año",
         "Number agreement: 'años' (years) must be plural after 'nueve'; 'nueve año' is ungrammatical."),
        (36, "¿estudia tú español?",
         "Subject-verb agreement: 'estudia' is 3rd person but the subject is 'tú' (2nd person); should be 'estudias tú'."),
        (39, "me duele el mano",
         "Gender agreement: 'mano' is feminine despite its -o ending; the article must be 'la', not 'el'."),
        (24, "nosotros vivo aquí",
         "Subject-verb agreement: 'vivo' is 1st person singular but the subject is 'nosotros' (1st plural); should be 'vivimos'."),
        (31, "son caro",
         "Number/gender agreement: plural subject 'son' paired with a masculine-singular adjective; should be 'son caros/caras'."),
        (28, "yo no puedes nadar",
         "Subject-verb agreement: 'puedes' is the tú-form but the subject is 'yo'; should be 'puedo'."),
        (37, "la cocina es bonito",
         "Gender agreement: 'cocina' is feminine; the predicate adjective must agree — 'bonita', not 'bonito'."),
        (16, "tengo mi nariz pequeña",
         "Redundant possessive: Spanish normally uses the definite article for body parts ('tengo la nariz pequeña'); adding the possessive 'mi' here is a common non-native calque, not how a native speaker would say it."),
    ],
    "fr": [
        (4, "je aime le café",
         "Missing elision: 'je' must elide to j' before a vowel-initial verb ('j'aime'); 'je aime' is ungrammatical."),
        (12, "elle aiment la musique",
         "Subject-verb agreement: 'aiment' is 3rd person plural but the subject 'elle' is singular; should be 'aime'."),
        (2, "il n'y a pas un musée",
         "Partitive-after-negation rule: after a negation, 'un/une/des' collapse to 'de' — should be 'il n'y a pas de musée'."),
        (10, "elle n'a pas encore mangée ce matin",
         "Wrong past-participle agreement: with avoir and no preceding direct object, the participle stays invariant — should be 'mangé', not 'mangée'."),
        (36, "on va à cinéma à dix heures",
         "Missing contraction: à + le must contract to 'au'; 'à cinéma' is ungrammatical, should be 'au cinéma'."),
        (33, "tu es mangé une salade hier soir ?",
         "Wrong auxiliary: 'manger' takes avoir, not être, in the passé composé; should be 'tu as mangé'."),
        (37, "il n'est pas un étudiant",
         "Article misuse: French drops the indefinite article for professions/status after être ('il n'est pas étudiant'); adding 'un' is a common non-native calque from English."),
        (28, "ça coûte quatre-vingts-deux euros",
         "Number-agreement rule: 'vingt' does NOT take an 's' when followed by another number word ('quatre-vingt-deux'); the 's' here is a rule violation."),
    ],
}

def build(lang):
    candidates = load_candidates(lang)
    is_low_conf_lang = lang in ("ja", "ko")
    rows = []
    for i, c in enumerate(candidates):
        label, reason, low_conf_override = "natural", DEFAULT_NATURAL_REASON, None
        if i in EXCEPTIONS.get(lang, {}):
            label, reason, low_conf_override = EXCEPTIONS[lang][i]
        low_conf = is_low_conf_lang if low_conf_override is None else low_conf_override
        rows.append({
            "sentence": c["text"],
            "label": label,
            "reason": reason,
            "source_lesson_id": c["lessonId"],
            "step_type": c["stepType"],
            "kind": "real",
            "low_confidence": low_conf,
        })
    for base_idx, corrupted, reason in PLANTED.get(lang, []):
        base = candidates[base_idx]
        rows.append({
            "sentence": corrupted,
            "label": "unnatural",
            "reason": reason,
            "source_lesson_id": base["lessonId"] + " (planted, base sentence corrupted by hand)",
            "step_type": base["stepType"],
            "kind": "planted",
            "low_confidence": False,  # planted rows are unambiguous by construction
            "base_sentence": base["text"],
        })
    return rows

def main():
    for lang in ("ja", "ko", "es", "fr"):
        rows = build(lang)
        out_path = os.path.join(HERE, f"{lang}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
        n_real = sum(1 for r in rows if r["kind"] == "real")
        n_planted = sum(1 for r in rows if r["kind"] == "planted")
        n_unnat = sum(1 for r in rows if r["label"] == "unnatural")
        print(f"{lang}: {len(rows)} rows ({n_real} real + {n_planted} planted), {n_unnat} labelled unnatural -> {out_path}")

if __name__ == "__main__":
    main()
