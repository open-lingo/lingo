#!/usr/bin/env python3
"""
KO lexical sidecar: per-sentence morphological tokens (surface, lemma/tag,
POS, offsets) via Kiwi (kiwipiepy), for the procedural-QA runner's KO Q2/Q3
ports (`docs/procedural-qa-2026-09-17.md` §"Korean").

Install (project venv, exact command — record any drift here):
    cd scripts/lexical/ko
    uv venv .venv --python 3.11
    uv pip install --python .venv/bin/python kiwipiepy

Licence: Kiwi (the underlying C++ analyzer, bab2min/Kiwi) is LGPL v3;
kiwipiepy (the Python binding wrapping it) ships that same LGPL v3 licence
file (`kiwipiepy-<ver>.dist-info/LICENSE.txt`, `Copyright (c) 2017,
bab2min`). Used here exactly like Grammalecte elsewhere in this repo: as a
subprocess invoked by this QA-only sidecar, never imported into shipped
app code — no distribution/linking obligation is triggered. No KO
acceptability dataset exists to calibrate a precision bar against (the
research lane's own finding); this sidecar is the analyzer, not a judge.

Kiwi has no separate "common word" flag comparable to JMdict's — its tag
set (see https://github.com/bab2min/Kiwi/blob/main/docs/KiwiTagSet.md for
the reference) already separates content POS from function POS, which is
what Q2/Q3-style checks need most; a KO frequency source, if wanted later,
is a separate spike (see docs §"Korean").

## Usage

    echo '[{"id":"a","text":"저는 학생입니다"}]' | .venv/bin/python sidecar.py

Reads a JSON array of {id, text} from stdin, writes a JSON array of
{id, tokens: [{surface, tag, start, end}]} to stdout (`start`/`end` are
character offsets into that item's own `text`, 0-based, Kiwi reports these
natively — no forward-search fallback needed the way UniDic occasionally
does).
"""
import json
import sys

try:
    from kiwipiepy import Kiwi
except ImportError as e:  # pragma: no cover - operational failure, not a test path
    sys.stderr.write(
        "kiwipiepy is not installed. Run:\n"
        "  cd scripts/lexical/ko && uv venv .venv --python 3.11 && "
        "uv pip install --python .venv/bin/python kiwipiepy\n"
    )
    raise


def tag_one(kiwi, text):
    tokens = []
    for t in kiwi.tokenize(text):
        tokens.append(
            {
                "surface": t.form,
                "tag": t.tag,
                "start": t.start,
                "end": t.start + t.len,
            }
        )
    return tokens


def main():
    raw = sys.stdin.read()
    items = json.loads(raw) if raw.strip() else []
    kiwi = Kiwi()
    out = []
    for item in items:
        out.append({"id": item["id"], "tokens": tag_one(kiwi, item["text"])})
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
