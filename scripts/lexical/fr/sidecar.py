#!/usr/bin/env python3
"""
FR lexical sidecar: per-tile/per-sentence tokens (surface, lemma, is_known)
via simplemma, for the procedural-QA runner's ES port
(`docs/procedural-qa-2026-09-17.md` §"Spanish/French").

Install (project venv, exact command — record any drift here):
    cd scripts/lexical/fr
    uv venv .venv --python 3.11
    uv pip install --python .venv/bin/python simplemma

Licence: simplemma is MIT (Adrien Barbaresi, 2021 — see
`.venv/lib/python3.11/site-packages/simplemma-*.dist-info/licenses/LICENSE`),
~19MB installed (lemmatization dictionaries bundled as package data — no
separate download step, unlike JMdict/Lexique).

simplemma has no morphological-analyzer POS tagger (unlike fugashi/Kiwi) —
it offers `lemmatize` (dictionary + rule-based lemma lookup) and
`is_known` (is this surface, or its lemma, in the dictionary at all). For
ES this sidecar is used as a LEMMA + DICTIONARY-MEMBERSHIP fact source,
not a POS source — a course-specific compositional word list (course
atoms, `authoring-invariants-pinned.md`-equivalent structural facts) is
still the primary check, this is the fallback the way fugashi is the JA
Q3 fallback.

## Usage

    echo '[{"id":"a","text":"Vamos al mercado"}]' | .venv/bin/python sidecar.py es

Reads a JSON array of {id, text} from stdin, a two-letter simplemma lang
code as argv[1] (es or fr — both this file and fr/sidecar.py are the same
source, kept as two literal copies per language like the JA sidecar
convention, not a shared import, so each language's venv is independently
recreatable), writes a JSON array of
{id, tokens: [{surface, lemma, isKnown}]} to stdout — one token per
`simple_tokenizer` piece (whitespace + punctuation split; ES/FR are
space-tokenized, so this is closer to a naive word split than fugashi's
morphological segmentation, which is the whole reason Q2/Q3 for ES/FR are
about MULTI-WORD TILES, not sub-word morphemes — see the doc's "chunk"
definition).
"""
import json
import sys

try:
    import simplemma
except ImportError as e:  # pragma: no cover - operational failure, not a test path
    sys.stderr.write(
        "simplemma is not installed. Run:\n"
        "  cd scripts/lexical/fr && uv venv .venv --python 3.11 && "
        "uv pip install --python .venv/bin/python simplemma\n"
    )
    raise


def tag_one(text, lang):
    tokens = []
    for surface in simplemma.simple_tokenizer(text):
        if not surface.strip():
            continue
        lemma = simplemma.lemmatize(surface, lang=lang)
        known = simplemma.is_known(surface, lang=lang) or simplemma.is_known(
            surface.lower(), lang=lang
        )
        tokens.append({"surface": surface, "lemma": lemma, "isKnown": bool(known)})
    return tokens


def main():
    lang = sys.argv[1] if len(sys.argv) > 1 else "es"
    raw = sys.stdin.read()
    items = json.loads(raw) if raw.strip() else []
    out = []
    for item in items:
        out.append({"id": item["id"], "tokens": tag_one(item["text"], lang)})
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
