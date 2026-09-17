#!/usr/bin/env python3
"""Crop a burst of raw simulator screenshots down to the lesson stage and
tile them into one horizontal contact sheet JPEG.

Part of `--simulate build`'s per-tap FRAME CAPTURE (2026-09-17, Spencer:
"the simulation needs FRAME CAPTURE ... not only settled geometry"). The
Node side (`scripts/ux-loop/sim-capture.mjs`) takes raw, FULL-SCREEN
`xcrun simctl io <udid> screenshot` shots as fast as it can around each tap
(measured ~380-395ms/shot on this machine — nowhere near the requested 50ms
cadence; see the report for the honest measured numbers) and hands this
script one JSON args file per tap describing where those shots landed and
what CSS-px stage rect to crop to.

No new Node/npm dependency needed for this: `magick`/`convert`/`montage`
(ImageMagick) are NOT installed in this environment (checked live,
2026-09-17: `which magick convert montage` all empty) and this repo has no
`canvas`/`sharp`/`jimp` — but the system `python3` (3.13, via
`/usr/bin/python3` or pyenv) DOES have Pillow (`python3 -c "import PIL"`
succeeded, version 11.3.0), so that's what this uses. If Pillow is ever
missing on a machine that runs this, the caller (sim-capture.mjs) catches
the failure and reports "no contact sheet" rather than crashing the whole
capture — the per-frame geometry trace (the numbers) is the deliverable
either way.

Usage:
    python3 contact_sheet.py <args.json>

args.json shape:
{
  "outputPath": "artifacts/ux-loop/sim-capture/capture-....frames-tap3.jpg",
  "dpr": 3,
  "stage": {"left": 0, "top": 84, "width": 430, "height": 640},
  "frames": [{"t": 0, "path": "/tmp/....f0.png"}, {"t": 391, "path": "/tmp/....f1.png"}]
}
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

TILE_HEIGHT = 360  # px, per-frame tile height in the output contact sheet
LABEL_HEIGHT = 20
GAP = 4


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: contact_sheet.py <args.json>", file=sys.stderr)
        return 2
    with open(sys.argv[1], "r", encoding="utf-8") as fh:
        args = json.load(fh)

    dpr = args.get("dpr") or 1
    stage = args["stage"]
    crop_box = (
        max(0, round(stage["left"] * dpr)),
        max(0, round(stage["top"] * dpr)),
        round((stage["left"] + stage["width"]) * dpr),
        round((stage["top"] + stage["height"]) * dpr),
    )

    tiles = []
    font = ImageFont.load_default()
    for frame in args.get("frames", []):
        try:
            im = Image.open(frame["path"])
            im.load()
        except Exception as exc:  # best-effort — a missing/corrupt shot is skipped, not fatal
            print(f"skip {frame.get('path')}: {exc}", file=sys.stderr)
            continue
        cropped = im.crop(crop_box)
        scale = TILE_HEIGHT / cropped.height if cropped.height > 0 else 1
        resized = cropped.resize((max(1, round(cropped.width * scale)), TILE_HEIGHT))
        labeled = Image.new("RGB", (resized.width, TILE_HEIGHT + LABEL_HEIGHT), "white")
        labeled.paste(resized, (0, 0))
        draw = ImageDraw.Draw(labeled)
        # 2026-09-17 (task D, ONE contact sheet per RUN instead of per tap):
        # an optional "tap" field on the frame labels which tap this shot
        # belongs to, so a multi-tap sheet still reads left-to-right as
        # tap 0..N. Absent (older per-tap callers) falls back to the
        # original bare "t=<ms>ms" label.
        label = f"tap{frame['tap']} t={frame['t']}ms" if "tap" in frame else f"t={frame['t']}ms"
        draw.text((4, TILE_HEIGHT + 2), label, fill="black", font=font)
        tiles.append(labeled)

    if not tiles:
        print("no frames to composite", file=sys.stderr)
        return 1

    total_w = sum(t.width for t in tiles) + GAP * (len(tiles) - 1)
    sheet = Image.new("RGB", (total_w, TILE_HEIGHT + LABEL_HEIGHT), "white")
    x = 0
    for t in tiles:
        sheet.paste(t, (x, 0))
        x += t.width + GAP

    sheet.save(args["outputPath"], "JPEG", quality=85)
    print(args["outputPath"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
