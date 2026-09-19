#!/usr/bin/env python3
"""
PT wordfreq smoke tool — vocabulary-selection tooling for the future PT
authoring lane (docs/pt-course-design-2026-09-18.md §3, "Frequency
source"), NOT part of the procedural-QA gate (no CI wiring for this file).

Given a word on argv[1], or one word per line on stdin if argv[1] is
omitted, prints `wordfreq.zipf_frequency(word, "pt")` — Zipf scale (roughly
1-8, higher = more frequent; wordfreq's own convention).

## Usage

    .venv/bin/python freq.py casa
    echo "casa" | .venv/bin/python freq.py
"""
import sys

try:
    from wordfreq import zipf_frequency
except ImportError:  # pragma: no cover - operational failure, not a test path
    sys.stderr.write(
        "wordfreq is not installed. Run:\n"
        "  cd scripts/lexical/pt && uv venv .venv --python 3.11 && "
        "uv pip install --python .venv/bin/python -r ../requirements-pt.txt\n"
    )
    raise


def main():
    if len(sys.argv) > 1:
        words = sys.argv[1:]
    else:
        words = [line.strip() for line in sys.stdin if line.strip()]
    for word in words:
        print(f"{word}\t{zipf_frequency(word, 'pt')}")


if __name__ == "__main__":
    main()
