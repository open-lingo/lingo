#!/usr/bin/env python3
"""
postprocess.py <input.png> <output.png>

Turns a raw 512x512 mflux flat-vector-sticker render into a small, alpha-
matted PNG suitable for shipping as vocab card art — the same recipe
documented in src/pub/lingo-art/cast/README.md's "Post-processing" section,
adapted for single independent objects (soy sauce bottle, heater, pond, ...)
rather than a matched multi-pose cast:

  1. Flood-fill alpha from the four corners (not a naive white->alpha cut,
     which would delete any enclosed white area that's part of the subject,
     e.g. a white label on a bottle).
  2. Crop to that image's own alpha bbox. The cast recipe uses ONE shared
     bbox across all four cast members so their relative scale is preserved
     (grandma is not stretched to teenager height) — that constraint doesn't
     apply here since every emoji-refit art image is an unrelated standalone
     object with its own natural scale, so per-image cropping is correct.
  3. Erode the alpha by 1px (ImageFilter.MinFilter(3)) to remove the
     anti-aliased halo the flood-fill leaves at the edge.
  4. Resize longest edge to 256px, quantize to a 64-colour palette (RGBA
     via adaptive palette + alpha remerge) to hit the ~6 KB target the cast
     set achieved.
"""
import sys
from PIL import Image, ImageFilter

FLOOD_TOLERANCE = 30
TARGET_LONGEST_EDGE = 256
PALETTE_COLORS = 64


def flood_fill_alpha(img: Image.Image, tolerance: int = FLOOD_TOLERANCE) -> Image.Image:
    """Alpha-cut the background by flood-filling from the four corners
    against corner-color-similarity, not a global colour match — so an
    enclosed white area (e.g. inside the subject) survives."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = bytearray(w * h)
    stack = []

    def similar(c1, c2):
        return all(abs(a - b) <= tolerance for a, b in zip(c1, c2))

    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for cx, cy in corners:
        idx = cy * w + cx
        if not visited[idx]:
            stack.append((cx, cy))
            visited[idx] = 1

    while stack:
        x, y = stack.pop()
        idx = y * w + x
        r, g, b, a = px[x, y]
        # Reference colour is the pixel at (0,0); flood while every visited
        # pixel stays close to that background swatch.
        bg = px[0, 0]
        if not similar((r, g, b), bg[:3]):
            continue
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx]:
                    visited[nidx] = 1
                    stack.append((nx, ny))
    return img


def crop_to_alpha_bbox(img: Image.Image, pad: int = 4) -> Image.Image:
    bbox = img.getbbox()
    if bbox is None:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def erode_alpha(img: Image.Image) -> Image.Image:
    r, g, b, a = img.split()
    a = a.filter(ImageFilter.MinFilter(3))
    return Image.merge("RGBA", (r, g, b, a))


def resize_longest_edge(img: Image.Image, target: int = TARGET_LONGEST_EDGE) -> Image.Image:
    w, h = img.size
    longest = max(w, h)
    if longest <= target:
        return img
    scale = target / longest
    return img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def quantize(img: Image.Image, colors: int = PALETTE_COLORS) -> Image.Image:
    # Match the cast set's actual encoding (verified against
    # src/pub/lingo-art/cast/*.png): P-mode with ONE palette index reserved
    # as a binary transparency marker (PNG tRNS), not a full 8-bit alpha
    # channel. A continuous anti-aliased alpha edge is what inflates a
    # same-size RGBA PNG to 3-8x this — the cast set's edges are hard, not
    # soft, and that's what keeps them at ~5 KB instead of ~40 KB.
    threshold = 127
    alpha = img.split()[3].point(lambda a: 255 if a > threshold else 0)
    rgb = Image.new("RGB", img.size, (255, 255, 255))
    rgb.paste(img, mask=alpha)
    reserved = colors - 1
    quantized = rgb.quantize(colors=reserved, method=Image.FASTOCTREE, dither=Image.Dither.NONE)
    transparent_index = reserved
    palette = quantized.getpalette() or []
    while len(palette) < 256 * 3:
        palette.append(0)
    quantized.putpalette(palette)
    px = quantized.load()
    apx = alpha.load()
    w, h = quantized.size
    for y in range(h):
        for x in range(w):
            if apx[x, y] == 0:
                px[x, y] = transparent_index
    quantized.info["transparency"] = transparent_index
    return quantized


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: postprocess.py <input.png> <output.png>", file=sys.stderr)
        sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]
    img = Image.open(src).convert("RGBA")
    img = flood_fill_alpha(img)
    img = crop_to_alpha_bbox(img)
    img = erode_alpha(img)
    img = resize_longest_edge(img)
    img = quantize(img)
    img.save(dst, format="PNG", optimize=True)
    import os

    size = os.path.getsize(dst)
    print(f"{dst}: {img.size[0]}x{img.size[1]}, {size} bytes")


if __name__ == "__main__":
    main()
