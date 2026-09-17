#!/usr/bin/env python3
"""
JA lexical sidecar: per-sentence morphological tokens (surface, lemma, POS,
reading) via fugashi + unidic-lite, for the procedural-QA runner's Q3
(one-content-word-per-chunk).

Install (project venv, exact command — record any drift here):
    cd scripts/lexical/ja
    uv venv .venv --python 3.11
    uv pip install --python .venv/bin/python fugashi unidic-lite

Both packages are permissively licensed (fugashi: MIT; unidic-lite: BSD +
UniDic's own BSD-style license) — see docs/procedural-qa-2026-09-17.md for
the citation. No JMdict/Sudachi dependency in this pass; POS tags alone
(function-word vs content-word) are what Q3 needs.

## The kana-only over-segmentation pitfall

Our IR is kana-first: `docs/tile-shrapnel-2026-09-17.md` measured that a
tagger fed pure kana over-segments (じゅぎょう -> じ|ゅぎょう). The mitigation
this file implements is INPUT-SIDE, not output-side: callers should pass the
KANJI-reconstructed surface when one is available (the Node wrapper,
`sidecar.mjs`, does this — it substitutes each course atom's kanji spelling
into the kana sentence before calling this script) and this script returns
character offsets INTO WHATEVER TEXT IT WAS GIVEN. Mapping those offsets
back onto the original kana span is the Node wrapper's job (it knows the
substitution table this script does not).

## Usage

    echo '[{"id":"a","text":"仕事をやめて、貯金を始めることにした。"}]' | .venv/bin/python sidecar.py

Reads a JSON array of {id, text} from stdin, writes a JSON array of
{id, tokens: [{surface, lemma, pos1, pos2, reading, start, end}]} to stdout.
`start`/`end` are character offsets into that item's own `text`. `reading`
is the katakana pronunciation UniDic reports (`kana` field), or null.
"""
import json
import sys

try:
    import fugashi
except ImportError as e:  # pragma: no cover - operational failure, not a test path
    sys.stderr.write(
        "fugashi is not installed. Run:\n"
        "  cd scripts/lexical/ja && uv venv .venv --python 3.11 && "
        "uv pip install --python .venv/bin/python fugashi unidic-lite\n"
    )
    raise


def tag_one(tagger, text):
    tokens = []
    cursor = 0
    for word in tagger(text):
        surface = word.surface
        # UniDic occasionally returns a surface that isn't a literal
        # substring at the expected cursor for punctuation-normalization
        # edge cases; fall back to a forward search so offsets never go
        # stale rather than silently misaligning every token after one bad
        # match.
        idx = text.find(surface, cursor)
        if idx == -1:
            idx = cursor
        start = idx
        end = idx + len(surface)
        cursor = end
        feat = word.feature
        tokens.append(
            {
                "surface": surface,
                "lemma": getattr(feat, "lemma", None) or surface,
                "pos1": getattr(feat, "pos1", None),
                "pos2": getattr(feat, "pos2", None),
                "reading": getattr(feat, "kana", None),
                "start": start,
                "end": end,
            }
        )
    return tokens


def main():
    raw = sys.stdin.read()
    items = json.loads(raw) if raw.strip() else []
    tagger = fugashi.Tagger()
    out = []
    for item in items:
        out.append({"id": item["id"], "tokens": tag_one(tagger, item["text"])})
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
