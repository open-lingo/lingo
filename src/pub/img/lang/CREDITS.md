# Language hero image credits

Both images are **CC0** (public-domain dedication): no attribution is legally
required and there is no share-alike clause. Credits are recorded here anyway,
because knowing an asset's provenance is what makes it safe to keep shipping.

**Only add CC0 or public-domain images here.** Anything requiring attribution
(CC BY, CC BY-SA) drags a licence obligation into the app binary, and CC BY-SA's
share-alike is actively hostile to a closed-source app. That is not theoretical:
the Korean hero was previously a hotlinked CC BY-SA 2.0 image used with no
attribution anywhere in the product.

| File | Source | Licence | Author |
|---|---|---|---|
| `ko-hero.jpg` | [Han River Seoul skyline (Pixabay 1214950)](https://commons.wikimedia.org/wiki/File:Han_River_Seoul_skyline_Pixabay_1214950.jpg) | CC0 | USAGI_POST |
| `ja-hero.jpg` | [Chureito pagoda and Mount Fuji](https://commons.wikimedia.org/wiki/File:12-Chureito-pagoda-and-Mount-Fuji-Japan_(29677439878).jpg) | CC0 | Dang Son |

## Why these are bundled rather than hotlinked

Both used to be fetched from `upload.wikimedia.org` on every home paint:
**0.3 MB (ko) and 1.6 MB (ja, the full-resolution original)**. That cost a
network round trip on every cold start, broke entirely offline, and hotlinked a
third party's bandwidth against Wikimedia's own guidance.

Bundled and resized to 1600px wide at JPEG q68 they are **212 KB and 345 KB** —
served from the app binary, instant, and available offline.

## Replacing one

Resize to 1600px wide (plenty for a 1290px-wide phone hero at 3x) and keep it
under ~350 KB:

```sh
sips --resampleWidth 1600 -s format jpeg -s formatOptions 68 \
  input.jpg --out src/pub/img/lang/<lang>-hero.jpg
```

Verify the licence with the Commons API before adding — `extmetadata.License`
must be `cc0` or `pd`, and check `AttributionRequired`:

```sh
curl -s -A "OpenLingo/1.0" \
  "https://commons.wikimedia.org/w/api.php?action=query&titles=File:NAME&prop=imageinfo&iiprop=extmetadata&format=json"
```
