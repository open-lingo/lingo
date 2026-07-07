#!/usr/bin/env python3
"""
scrape_yt_transcripts.py — YouTube transcript extractor for Lingo pedagogy recon.

Given a channel or playlist URL, lists its videos and downloads subtitles as
CLEAN plain text (timestamps stripped, rolling-caption duplicates collapsed) into:

    research/<channel-slug>/<video-id>--<title-slug>.txt
    research/<channel-slug>/index.json      # [{id,title,url,duration,date}, ...]

Prefers MANUAL (human-written) subtitles over auto-generated captions, since
hand-written subs need almost no cleaning. Falls back to auto captions.

WHY THIS EXISTS
    We want the *teaching approach* of a couple of YouTube educators (Jouzu Juls,
    Cure Dolly) available as backing psychology for the Lingo course. Studying
    transcripts to distill principles is fair use; the raw .txt files are working
    material only and are NOT re-hosted or shipped in the app. See the recon doc:
    docs/jouzu-juls-cure-dolly-recon-2026-07-02.md

REQUIREMENTS
    yt-dlp on PATH  (pip install --user yt-dlp)  — this repo used 2026.06.09.

USAGE
    # Sample a few philosophy-dense videos (recommended first pass):
    python3 scripts/scrape_yt_transcripts.py \
        --url "https://www.youtube.com/channel/UCzovHrDif7q9QB4XY1dS98Q/videos" \
        --slug jouzu-juls --only i9yqJggtYzo,a5HHq0HZbkM,isnR2kGolgk

    # Full channel (owner's call — polite rate limit, resumable):
    python3 scripts/scrape_yt_transcripts.py \
        --url "https://www.youtube.com/channel/UCkdmU8hGK4Fg3LghTVtKltQ/videos" \
        --slug cure-dolly

    # Just list videos, don't download:
    python3 scripts/scrape_yt_transcripts.py --url <URL> --slug foo --list-only

OPTIONS
    --url URL          channel /videos or /playlist URL (required)
    --slug NAME        output folder name under research/ (required)
    --only IDS         comma-separated video ids to restrict to (sampling)
    --limit N          cap number of videos processed
    --lang CODE        subtitle language (default: en)
    --sleep SECONDS    delay between videos (default: 3.0 — be polite)
    --list-only        list + write index.json, download nothing
    --force            re-download even if the .txt already exists

Already-downloaded transcripts are skipped, so the script is resumable.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RESEARCH = REPO / "research"


def yt_dlp(*args, capture=True):
    cmd = ["yt-dlp", *args]
    return subprocess.run(cmd, capture_output=capture, text=True)


def slugify(text, maxlen=60):
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE).strip().lower()
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:maxlen].strip("-") or "untitled"


def list_videos(url):
    """Return [{id,title,duration,url,date}] via a flat playlist dump."""
    res = yt_dlp(
        "--flat-playlist",
        "--print", "%(id)s\t%(title)s\t%(duration)s\t%(upload_date)s",
        url,
    )
    if res.returncode != 0:
        sys.stderr.write(res.stderr)
        raise SystemExit("yt-dlp failed to list videos")
    vids = []
    for line in res.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) < 2 or not parts[0]:
            continue
        vid, title = parts[0], parts[1]
        duration = parts[2] if len(parts) > 2 and parts[2] != "NA" else ""
        date = parts[3] if len(parts) > 3 and parts[3] != "NA" else ""
        vids.append({
            "id": vid,
            "title": title,
            "duration": duration,
            "date": date,
            "url": f"https://www.youtube.com/watch?v={vid}",
        })
    return vids


TIMESTAMP_RE = re.compile(r"^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->")
TAG_RE = re.compile(r"<[^>]+>")            # <c>, <00:00:01.234>, <i> ...
CUE_SETTING_RE = re.compile(r"align:|position:|line:")


def clean_vtt(vtt_text):
    """VTT -> clean paragraph text. Strips timestamps/tags, collapses the
    rolling-caption duplication that auto-generated captions produce."""
    lines = []
    for raw in vtt_text.splitlines():
        line = raw.rstrip()
        if not line:
            continue
        if line == "WEBVTT" or line.startswith(("Kind:", "Language:", "NOTE")):
            continue
        if TIMESTAMP_RE.match(line) or CUE_SETTING_RE.search(line):
            continue
        if line.isdigit():                 # cue index
            continue
        line = TAG_RE.sub("", line)
        line = line.replace("&nbsp;", " ").strip()
        # decode a few common entities
        line = (line.replace("&amp;", "&").replace("&gt;", ">")
                    .replace("&lt;", "<").replace("&#39;", "'"))
        if line:
            lines.append(line)

    # Collapse consecutive duplicate lines and prefix-duplicates from roll-up.
    out = []
    for ln in lines:
        if out and ln == out[-1]:
            continue
        # roll-up: previous line is a prefix of this one (caption building up)
        if out and ln.startswith(out[-1]) and len(out[-1]) > 8:
            out[-1] = ln
            continue
        # roll-up: this line is a prefix of the previous (trailing fragment)
        if out and out[-1].startswith(ln) and len(ln) > 8:
            continue
        out.append(ln)

    text = " ".join(out)
    text = re.sub(r"\s+", " ", text).strip()
    # Light sentence wrapping for readability.
    text = re.sub(r"(?<=[.!?])\s+(?=[A-Z぀-ヿ一-鿿])", "\n", text)
    return text


def fetch_transcript(vid_id, lang):
    """Download subs for one video. Prefer manual, fall back to auto.
    Returns (text, source) or (None, None)."""
    url = f"https://www.youtube.com/watch?v={vid_id}"
    with tempfile.TemporaryDirectory() as tmp:
        out_tmpl = os.path.join(tmp, "%(id)s.%(ext)s")
        # Try manual subs first, then auto captions.
        for auto_flag, source in (("--write-subs", "manual"),
                                  ("--write-auto-subs", "auto")):
            yt_dlp(
                "--skip-download", auto_flag,
                "--sub-langs", f"{lang}.*,{lang}",
                "--sub-format", "vtt",
                "-o", out_tmpl, url,
                capture=True,
            )
            vtts = list(Path(tmp).glob(f"{vid_id}*.vtt"))
            if vtts:
                text = clean_vtt(vtts[0].read_text(encoding="utf-8", errors="replace"))
                if text.strip():
                    return text, source
                for v in vtts:
                    v.unlink(missing_ok=True)
    return None, None


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--only", default="")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--lang", default="en")
    ap.add_argument("--sleep", type=float, default=3.0)
    ap.add_argument("--list-only", action="store_true")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    outdir = RESEARCH / args.slug
    outdir.mkdir(parents=True, exist_ok=True)

    print(f"Listing videos from {args.url} ...", file=sys.stderr)
    videos = list_videos(args.url)
    print(f"  found {len(videos)} videos", file=sys.stderr)

    only = {v.strip() for v in args.only.split(",") if v.strip()}
    if only:
        videos = [v for v in videos if v["id"] in only]
    if args.limit:
        videos = videos[: args.limit]

    (outdir / "index.json").write_text(
        json.dumps(videos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  wrote index.json ({len(videos)} entries)", file=sys.stderr)

    if args.list_only:
        return

    ok = skipped = failed = 0
    for i, v in enumerate(videos, 1):
        fname = f"{v['id']}--{slugify(v['title'])}.txt"
        path = outdir / fname
        if path.exists() and not args.force:
            skipped += 1
            print(f"[{i}/{len(videos)}] skip {v['id']} (exists)", file=sys.stderr)
            continue
        print(f"[{i}/{len(videos)}] {v['id']} {v['title'][:60]!r}", file=sys.stderr)
        text, source = fetch_transcript(v["id"], args.lang)
        if not text:
            failed += 1
            print(f"    no {args.lang} subtitles", file=sys.stderr)
        else:
            header = (f"# {v['title']}\n# {v['url']}\n"
                      f"# subtitles: {source} | duration: {v['duration']}s | "
                      f"date: {v['date']}\n\n")
            path.write_text(header + text + "\n", encoding="utf-8")
            ok += 1
            words = len(text.split())
            print(f"    wrote {fname} ({source}, ~{words} words)", file=sys.stderr)
        if i < len(videos):
            time.sleep(args.sleep)

    print(f"\nDone. wrote={ok} skipped={skipped} failed={failed}", file=sys.stderr)


if __name__ == "__main__":
    main()
