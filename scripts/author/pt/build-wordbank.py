#!/usr/bin/env python3
"""PT word bank Fable picks m1-m4 words from (mechanical only, see
docs/pt-wordbank-2026-09-18.md). Run: scripts/lexical/pt/.venv/bin/python3
scripts/author/pt/build-wordbank.py (repo root). Input: data/pt_br_50k.txt
(hermitdave/FrequencyWords pt_BR, "word count" rows, rank=line no)."""
import json
import re
from collections import defaultdict
from pathlib import Path

import simplemma
import spacy
import wordfreq

HERE = Path(__file__).resolve().parent
RAW = HERE / "data" / "pt_br_50k.txt"
OUT = HERE / "data" / "pt-wordbank.json"
ATOMS_DIR = HERE.parents[2] / "src" / "features" / "languages" / "pt"
TOP_N = 2500

# PT letters+hyphen only (rejects digits/punct + raw-list OCR garbage like "vocãª"/"năo"/"nº"; isalpha() alone lets those through)
ALLOWED_CHARS = set("abcdefghijklmnopqrstuvwxyzáàâãéêíóôõúüç-")
SINGLE_LETTER_OK = {"a", "e", "o", "é"}
DROP_NOISE = {"oh", "ah", "hm", "uh", "hmm", "uhm", "ahn", "err", "erm", "ehh"}
COLLOQUIAL = {"né", "tá", "pra", "cê"}  # real BR speech, not noise
# Hand list, <=30, everyday curses/vulgarity only, no protected-group slurs.
PROFANE = {"merda", "porra", "caralho", "foder", "puta", "putaria", "cacete",
           "bosta", "cuzão", "cu", "bunda", "peido", "escroto", "arrombado",
           "babaca", "otário", "imbecil", "idiota", "desgraça", "piranha",
           "vagabunda", "corno", "cagar", "buceta"}
DROP_POS = {"PROPN", "PUNCT", "SYM", "X"}
ALLOWED_POS = {"NOUN", "VERB", "ADJ", "ADV", "ADP", "DET", "PRON", "CCONJ",
               "SCONJ", "NUM", "INTJ", "AUX"}
GENDER_MAP = {"Masc": "m", "Fem": "f"}
ATOM_RE = re.compile(r'surface:\s*"([^"]+)"')


def surface_ok(w):
    wl = w.lower()
    if not wl or not all(ch in ALLOWED_CHARS for ch in wl):
        return False
    if len(wl) == 1 and wl not in SINGLE_LETTER_OK:
        return False
    return wl not in DROP_NOISE

def tag(nlp, word):
    # Carrier "Eu vi <w> ontem." vs isolated "<w>"; carrier wins on disagreement (isolated tagging measured wrong for cansada/gosta).
    carrier = nlp(f"Eu vi {word} ontem.")
    idx = 2
    for i, t in enumerate(carrier):
        if i >= 2 and t.text.lower() == word.lower():
            idx = i
            break
    ctok = carrier[min(idx, len(carrier) - 1)]
    itok = nlp(word)[0]
    return ctok.pos_, ctok.lemma_, ctok.morph.get("Gender"), ctok.pos_ == itok.pos_

def row_flags(lemma, top_surface, sp_lemma, agree, zipf):
    checks = [
        ("pos-uncertain", not agree),
        ("lemma-disagree", sp_lemma.lower() != lemma.lower()),
        ("colloquial", lemma in COLLOQUIAL or top_surface in COLLOQUIAL),
        ("profane", lemma in PROFANE),
        ("foreign", zipf < 2 and wordfreq.zipf_frequency(lemma, "en") > zipf + 1),
    ]
    return [name for name, hit in checks if hit]

def main():
    nlp = spacy.load("pt_core_news_sm")
    rows = []
    for i, line in enumerate(RAW.read_text(encoding="utf-8").splitlines(), 1):
        w, c = line.rsplit(None, 1)
        if surface_ok(w):
            rows.append((w, i, int(c)))
    groups = defaultdict(list)
    for w, rank, count in rows:
        groups[simplemma.lemmatize(w, lang="pt")].append((w, rank, count))
    candidates = sorted(groups.items(), key=lambda kv: min(r for _, r, _ in kv[1]))

    sample_n = sample_agree = 0
    out = []
    for lemma, forms in candidates:
        if len(out) >= TOP_N:
            break
        top_surface, top_rank, _ = min(forms, key=lambda t: t[1])
        pos, sp_lemma, gender_feat, agree = tag(nlp, top_surface)
        if sample_n < 200:
            sample_n += 1
            sample_agree += int(agree)
        if pos in DROP_POS:
            continue
        pos = pos if pos in ALLOWED_POS else "OTHER"
        zipf = round(wordfreq.zipf_frequency(lemma, "pt"), 2)
        gender = GENDER_MAP.get(gender_feat[0]) if pos == "NOUN" and gender_feat else None
        forms6 = sorted(forms, key=lambda t: -t[2])[:6]
        out.append({
            "lemma": lemma, "pos": pos, "gender": gender, "brRank": top_rank,
            "brCount": sum(c for _, _, c in forms), "zipf": zipf,
            "forms": [{"form": s, "count": c} for s, _, c in forms6],
            "emoji": None, "taughtIn": None,
            "flags": row_flags(lemma, top_surface, sp_lemma, agree, zipf),
        })
    by_lemma = {r["lemma"]: r for r in out}
    atom_hits = []
    for path in sorted(ATOMS_DIR.glob("courseAtoms.m1-l*.ts")):
        lesson = path.stem.split(".", 1)[1]
        for surface in ATOM_RE.findall(path.read_text(encoding="utf-8")):
            if " " in surface:
                continue
            lemma = simplemma.lemmatize(surface, lang="pt")
            row = by_lemma.get(lemma)
            atom_hits.append((lesson, surface, lemma, row["brRank"] if row else None))
            if row and row["taughtIn"] is None:
                row["taughtIn"] = lesson
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    print(f"rows: {len(out)}")
    if sample_n:
        print(f"POS agreement (carrier vs isolated), n={sample_n}: "
              f"{100 * sample_agree / sample_n:.1f}% ({sample_agree}/{sample_n})")
    by_pos = defaultdict(list)
    for r in out:
        by_pos[r["pos"]].append(r)
    for pos, items in sorted(by_pos.items(), key=lambda kv: -len(kv[1])):
        print(f"  {pos}: {len(items)}")
    for pos in ("NOUN", "VERB", "ADJ"):
        print(f"top60 {pos}: " + ", ".join(
            r["lemma"] for r in sorted(by_pos.get(pos, []), key=lambda r: r["brRank"])[:60]))
    print(f"m1 atoms ({len(atom_hits)}):")
    for lesson, surface, lemma, rank in atom_hits:
        print(f"  {lesson}\t{surface}\t(lemma={lemma})\tbrRank={rank}")

if __name__ == "__main__":
    main()
