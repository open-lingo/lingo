#!/usr/bin/env python3
"""
anki-export-known.py — Anki collection -> Lingo "known-items export v1" JSON.

Half 1 of the External-Knowledge Import feature (spec:
docs/anki-import-spec-2026-07-07.md). This is the OFFLINE EXTRACTOR: it reads an
Anki collection and emits normalized evidence of prior study (which words the
learner already knows, and how strongly) as language-agnostic JSON. The in-app
importer (Half 2, TypeScript) consumes this JSON to seed FSRS and optionally
unlock atoms. The schema below is a FROZEN interface contract shared with that
consumer — do not change field names or types.

OUTPUT SCHEMA — `known-items export v1`
    {
      "version": 1,
      "language": "ja",            // lingo language id
      "source": "anki",            // extractor id
      "exportedAt": "2026-07-07T18:00:00Z",
      "items": [{
        "expression": "見る",      // surface form as studied (required, non-empty)
        "reading": "みる",         // phonetic form (optional)
        "meaning": "see, look at", // gloss (optional)
        "evidence": {
          "class": "active",       // "active" | "suspended-reviewed"
          "intervalDays": 120,     // current SRS interval, 0 if unknown
          "reps": 8,               // lifetime reviews across the note's cards
          "lapses": 1,
          "lastReviewAt": "2026-04-18",    // ISO date (optional)
          "source": "Core 2000::Step 01"   // provenance (deck path etc.)
        }
      }]
    }
    Dedup key inside one export: (expression, reading) — the extractor keeps the
    strongest evidence (active beats suspended-reviewed; then max intervalDays).

WHAT COUNTS AS "KNOWN"
    A note is known if it has >=1 card in the review queue (queue=2) -> class
    "active"; else >=1 suspended card (queue=-1) with >=1 revlog entry -> class
    "suspended-reviewed"; otherwise it is excluded. New/learning-only cards are
    NOT evidence of retained knowledge.

NOTETYPE ADAPTERS (matched by notetype name, ordered, first hit wins) each yield
(expression, reading, meaning):
    1. iKnow! Vocabulary* / Japanese Vocab Dynamic — fields Expression / Meaning
       / Reading directly.
    2. iKnow! Sentences* — the <b>..</b> bolded segment of fields 0 / 2 is the
       studied word/reading; meaning = field 1 up to first <br>. No <b> -> skip
       (it duplicates a Vocabulary note).
    3. Youtube Video Vocab w/ Image — Word field is furigana format
       (風[ふう] 物[ぶつ] 詩[し] -> expression 風物詩, reading ふうぶつし).
    4. Migaku Japanese — Target Word field (also furigana format, may carry
       ;pos-tags inside the ruby and okurigana after it: 得意[とくい;n2,h] ->
       得意/とくい, 聞[き]ける -> 聞ける/きける); meaning = Definitions, 80 chars.
    5. Japanese-75658 — Core-2000-derived vocab: expression=field0, reading=
       field2, meaning=field3.
    6. Fallback (any other notetype): field0=expression, field2=reading if it
       looks kana-ish else "", field1=meaning. Count logged to stderr.

INPUT FORMATS
    - collection.anki2 (raw SQLite, any schema)
    - .apkg / .colpkg zip containing collection.anki2 or collection.anki21
    Both the modern schema (notetypes/fields/decks tables) and the legacy schema
    (col table with JSON models/decks) are supported. Newer .colpkg files store
    the collection as collection.anki21b (zstd-compressed); that is DETECTED and
    reported as an error (no zstd dependency here — export a legacy .apkg or use
    the raw collection.anki2 instead).

USAGE
    python3 scripts/anki-export-known.py COLLECTION [-o OUT.json]
    python3 scripts/anki-export-known.py deck.apkg --min-interval 21 -o known.json

OPTIONS
    COLLECTION          path to collection.anki2 or an .apkg/.colpkg zip (required)
    -o, --output PATH   write JSON here (default: stdout)
    --language CODE     lingo language id stamped into the export (default: ja)
    --min-interval N    drop items whose intervalDays < N (default: 0 = keep all)

Stdlib only (sqlite3, zipfile, json, re, html). No third-party deps.
"""
import argparse
import html
import json
import os
import re
import sqlite3
import sys
import tempfile
import zipfile
from datetime import datetime, timezone


# --- HTML / field cleaning ---------------------------------------------------

SOUND_RE = re.compile(r"\[sound:[^\]]*\]")
BLOCK_RE = re.compile(r"<\s*(?:svg|script|style)\b[^>]*>.*?</\s*(?:svg|script|style)\s*>",
                      re.IGNORECASE | re.DOTALL)
SPACER_RE = re.compile(r"<\s*/?\s*(?:br|p|div|hr|tr|li|ul|ol)\b[^>]*>", re.IGNORECASE)
COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")
TRAIL_PUNCT = "。.!?！？、，,・… \t\n\r"
# Hiragana, katakana, prolonged-sound mark, middle dot, iteration marks.
KANA_RE = re.compile(r"^[぀-ゟ゠-ヿー々〆・ー\s]+$")


def clean_html(s):
    """Strip Anki field HTML to plain text. Removes [sound:] refs, svg/pitch
    diagrams (whose <text> glyphs would otherwise pollute readings), comments
    (incl. Migaku <!-- accent_start -->), all tags; unescapes entities and
    collapses whitespace. Block tags become spaces so <p>a</p><p>b</p> -> 'a b'."""
    if not s:
        return ""
    s = SOUND_RE.sub(" ", s)
    s = BLOCK_RE.sub(" ", s)
    s = SPACER_RE.sub(" ", s)
    s = COMMENT_RE.sub(" ", s)
    s = TAG_RE.sub("", s)
    s = html.unescape(s)
    return WS_RE.sub(" ", s).strip()


def clean_surface(s):
    """Clean a Japanese surface form (expression/reading): HTML-strip, drop ALL
    whitespace (JA has no word spaces; iKnow readings are space-segmented), trim
    trailing/leading sentence punctuation."""
    s = clean_html(s)
    s = WS_RE.sub("", s)
    return s.strip(TRAIL_PUNCT)


def clean_gloss(s, maxlen=None):
    """Clean an English gloss: HTML-strip but keep internal spaces."""
    s = clean_html(s)
    if maxlen and len(s) > maxlen:
        s = s[:maxlen].rstrip()
    return s


def is_kana_ish(s):
    return bool(s) and bool(KANA_RE.match(s))


# --- Notetype adapters -------------------------------------------------------

BOLD_RE = re.compile(r"<b\b[^>]*>(.*?)</b>", re.IGNORECASE | re.DOTALL)
FURI_TOKEN_RE = re.compile(r"[^\s\[\]]+\[([^\]]*)\]")


def furigana_prep(s):
    """A furigana field can carry an HTML wrapper (<span>/<font>) and an example
    sentence after a <br>. Take the word before the first <br>, then strip tags
    BEFORE furigana parsing — parsing raw HTML corrupts the `base[ruby]` tokens
    (a color like rgb(255, 203, 255) becomes a bogus base for the next bracket)."""
    s = re.split(r"<br", s, maxsplit=1, flags=re.IGNORECASE)[0]
    return clean_html(s)  # brackets [] and token spaces survive; tags don't


def furigana_expression(s):
    """Furigana `base[ruby]okurigana` -> expression: drop rubies, join text."""
    return WS_RE.sub("", re.sub(r"\[[^\]]*\]", "", s))


def furigana_reading(s):
    """Furigana `base[ruby;tags]okurigana` -> reading: each ruby (before its
    first ';') plus any bare kana (okurigana), concatenated, spaces removed."""
    s = FURI_TOKEN_RE.sub(lambda m: m.group(1).split(";", 1)[0], s)
    return WS_RE.sub("", s)


def field(flds, i):
    return flds[i] if i < len(flds) else ""


def adapt(name, flds):
    """Return (expression, reading, meaning, adapter_id) or None to skip.
    adapter_id is used only for the stderr per-adapter tally."""
    # 1. iKnow! Vocabulary* and Japanese Vocab Dynamic: Expression/Meaning/Reading.
    if name.startswith("iKnow! Vocabulary") or name == "Japanese Vocab Dynamic":
        return (clean_surface(field(flds, 0)),
                clean_surface(field(flds, 2)),
                clean_gloss(field(flds, 1)), "vocab")
    # 2. iKnow! Sentences*: bolded word/reading; skip if no <b> in expression.
    if name.startswith("iKnow! Sentences"):
        mb = BOLD_RE.search(field(flds, 0))
        if not mb:
            return None  # duplicates a Vocabulary note
        rb = BOLD_RE.search(field(flds, 2))
        meaning = re.split(r"<br", field(flds, 1), maxsplit=1, flags=re.IGNORECASE)[0]
        return (clean_surface(mb.group(1)),
                clean_surface(rb.group(1)) if rb else "",
                clean_gloss(meaning), "sentence")
    # 3. Youtube Video Vocab w/ Image: furigana Word.
    if name == "Youtube Video Vocab w/ Image":
        word = furigana_prep(field(flds, 0))
        return (clean_surface(furigana_expression(word)),
                clean_surface(furigana_reading(word)),
                clean_gloss(field(flds, 1)), "youtube")
    # 4. Migaku Japanese: furigana Target Word (with ;tags + okurigana).
    if name == "Migaku Japanese":
        tw = furigana_prep(field(flds, 2))
        return (clean_surface(furigana_expression(tw)),
                clean_surface(furigana_reading(tw)),
                clean_gloss(field(flds, 3), maxlen=80), "migaku")
    # 5. Japanese-75658 (Core-2000-derived): expr=f0, reading=f2, meaning=f3.
    if name.startswith("Japanese-"):
        return (clean_surface(field(flds, 0)),
                clean_surface(field(flds, 2)),
                clean_gloss(field(flds, 3)), "japanese75658")
    # 6. Fallback.
    reading = clean_surface(field(flds, 2))
    if not is_kana_ish(reading):
        reading = ""
    return (clean_surface(field(flds, 0)), reading,
            clean_gloss(field(flds, 1)), "fallback")


# --- Collection loading (schema-agnostic) ------------------------------------

def open_collection(path):
    """Return (sqlite_connection, tempdir_to_cleanup_or_None). Accepts a raw
    collection.anki2 or an .apkg/.colpkg zip; extracts the inner collection to a
    temp file when given a zip."""
    if zipfile.is_zipfile(path):
        zf = zipfile.ZipFile(path)
        names = set(zf.namelist())
        member = None
        for cand in ("collection.anki21", "collection.anki2"):
            if cand in names:
                member = cand
                break
        if member is None:
            if "collection.anki21b" in names:
                raise SystemExit(
                    "error: this archive stores the collection as "
                    "collection.anki21b (zstd-compressed), which this extractor "
                    "cannot read without a zstd dependency. In Anki, export a "
                    "legacy .apkg (uncheck 'Support older Anki versions' off, or "
                    "use File > Export with the legacy format) or point this "
                    "script at the raw collection.anki2 in your profile folder.")
            raise SystemExit(
                "error: zip contains no collection.anki2/collection.anki21 "
                f"(members: {sorted(names)[:6]}...)")
        tmp = tempfile.mkdtemp(prefix="anki-export-")
        out = os.path.join(tmp, member)
        with open(out, "wb") as fh:
            fh.write(zf.read(member))
        zf.close()
        return connect(out), tmp
    return connect(path), None


def connect(dbpath):
    conn = sqlite3.connect(dbpath)
    # Anki defines custom collations (unicase) on some columns; register a
    # byte-wise stand-in so queries that touch them don't raise.
    for coll in ("unicase", "unicase_ci"):
        try:
            conn.create_collation(coll, lambda a, b: (a > b) - (a < b))
        except Exception:
            pass
    return conn


def load_metadata(conn):
    """Return (notetype_name{mid:str}, deck_name{did:str}). Handles both the
    modern schema (notetypes/decks tables) and the legacy col-JSON schema."""
    tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'")}
    if "notetypes" in tables:
        ntname = {mid: name for mid, name in conn.execute(
            "SELECT id, name FROM notetypes")}
        decks = {did: name.replace("\x1f", "::") for did, name in conn.execute(
            "SELECT id, name FROM decks")}
        return ntname, decks
    # Legacy: col.models / col.decks are JSON blobs keyed by string id.
    row = conn.execute("SELECT models, decks FROM col").fetchone()
    models = json.loads(row[0])
    decks_json = json.loads(row[1])
    ntname = {int(mid): m["name"] for mid, m in models.items()}
    decks = {int(did): d["name"].replace("\x1f", "::")
             for did, d in decks_json.items()}
    return ntname, decks


def ms_to_date(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


# --- Main --------------------------------------------------------------------

def build_items(conn, min_interval):
    ntname, deckname = load_metadata(conn)

    # Fetch everything up front (fetchall) BEFORE iterating — nesting a cursor
    # inside an open result cursor silently truncates the outer loop in sqlite3.
    cards_by_note = {}
    for cid, nid, did, queue, ivl, reps, lapses in conn.execute(
            "SELECT id, nid, did, queue, ivl, reps, lapses FROM cards").fetchall():
        cards_by_note.setdefault(nid, []).append(
            {"cid": cid, "did": did, "queue": queue,
             "ivl": ivl, "reps": reps, "lapses": lapses})

    # Max revlog timestamp per card (also tells us which cards were ever studied).
    last_rev = {cid: mx for cid, mx in conn.execute(
        "SELECT cid, MAX(id) FROM revlog GROUP BY cid").fetchall()}

    notes = conn.execute("SELECT id, mid, flds FROM notes").fetchall()

    stats = {"known_notes": 0, "active": 0, "suspended-reviewed": 0,
             "skip_no_bold": 0, "skip_empty_expr": 0, "skip_long_expr": 0,
             "skip_min_interval": 0, "fallback": 0, "adapters": {}}
    candidates = []

    for nid, mid, flds in notes:
        cards = cards_by_note.get(nid)
        if not cards:
            continue
        active = [c for c in cards if c["queue"] == 2]
        susp_rev = [c for c in cards if c["queue"] == -1 and c["cid"] in last_rev]
        if active:
            cls, qcards = "active", active
        elif susp_rev:
            cls, qcards = "suspended-reviewed", susp_rev
        else:
            continue
        stats["known_notes"] += 1
        stats[cls] += 1

        name = ntname.get(mid, "")
        res = adapt(name, flds.split("\x1f"))
        if res is None:
            stats["skip_no_bold"] += 1
            continue
        expr, reading, meaning, adapter_id = res
        stats["adapters"][adapter_id] = stats["adapters"].get(adapter_id, 0) + 1
        if adapter_id == "fallback":
            stats["fallback"] += 1
        if not expr:
            stats["skip_empty_expr"] += 1
            continue
        if len(expr) > 40:
            stats["skip_long_expr"] += 1
            continue

        interval = max((c["ivl"] if c["ivl"] > 0 else 0) for c in qcards)
        if interval < min_interval:
            stats["skip_min_interval"] += 1
            continue
        reps = sum(c["reps"] for c in qcards)
        lapses = max(c["lapses"] for c in qcards)
        rev_ids = [last_rev[c["cid"]] for c in cards if c["cid"] in last_rev]
        last_at = ms_to_date(max(rev_ids)) if rev_ids else None
        source = deckname.get(qcards[0]["did"], "")

        evidence = {"class": cls, "intervalDays": interval,
                    "reps": reps, "lapses": lapses}
        if last_at:
            evidence["lastReviewAt"] = last_at
        if source:
            evidence["source"] = source

        item = {"expression": expr}
        if reading:
            item["reading"] = reading
        if meaning:
            item["meaning"] = meaning
        item["evidence"] = evidence
        candidates.append(item)

    # Dedup by (expression, reading): keep strongest evidence.
    best = {}
    dup = 0
    for it in candidates:
        key = (it["expression"], it.get("reading", ""))
        prev = best.get(key)
        if prev is None:
            best[key] = it
            continue
        dup += 1
        if _strength(it) > _strength(prev):
            best[key] = it

    items = sorted(best.values(),
                   key=lambda it: (it["expression"], it.get("reading", "")))
    stats["deduped"] = dup
    stats["items"] = len(items)
    return items, stats


def _strength(it):
    ev = it["evidence"]
    return (1 if ev["class"] == "active" else 0, ev["intervalDays"])


def main():
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("collection",
                    help="collection.anki2 or an .apkg/.colpkg zip")
    ap.add_argument("-o", "--output", default=None,
                    help="write JSON here (default: stdout)")
    ap.add_argument("--language", default="ja",
                    help="lingo language id stamped into the export (default: ja)")
    ap.add_argument("--min-interval", type=int, default=0,
                    help="drop items whose intervalDays < N (default: 0)")
    args = ap.parse_args()

    if not os.path.exists(args.collection):
        raise SystemExit(f"error: no such file: {args.collection}")

    conn, tmp = open_collection(args.collection)
    try:
        items, stats = build_items(conn, args.min_interval)
    finally:
        conn.close()
        if tmp:
            import shutil
            shutil.rmtree(tmp, ignore_errors=True)

    export = {
        "version": 1,
        "language": args.language,
        "source": "anki",
        "exportedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "items": items,
    }
    payload = json.dumps(export, ensure_ascii=False, indent=2)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(payload + "\n")
    else:
        sys.stdout.write(payload + "\n")

    # Summary -> stderr.
    ad = stats["adapters"]
    print(
        "anki-export-known: "
        f"{stats['items']} items "
        f"(active={stats['active']} suspended-reviewed={stats['suspended-reviewed']}) "
        f"from {stats['known_notes']} known notes",
        file=sys.stderr)
    print(
        "  adapters: " + " ".join(f"{k}={v}" for k, v in sorted(ad.items()))
        + (f" [fallback={stats['fallback']}]" if stats["fallback"] else ""),
        file=sys.stderr)
    print(
        "  dropped: no-bold-sentence={} empty-expr={} long-expr={} "
        "below-min-interval={} deduped={}".format(
            stats["skip_no_bold"], stats["skip_empty_expr"],
            stats["skip_long_expr"], stats["skip_min_interval"],
            stats["deduped"]),
        file=sys.stderr)


if __name__ == "__main__":
    main()
