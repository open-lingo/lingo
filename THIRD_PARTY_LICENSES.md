# Third-party data and assets

Open Lingo bundles or derives from the following third-party works. The
project's own code license is in `LICENSE`.

## KanjiVG

- Source: <https://github.com/KanjiVG/kanjivg>
- Project site: <http://kanjivg.tagaini.net>
- Author: Ulrich Apel and the KanjiVG contributors
- License: [Creative Commons Attribution-Share Alike 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

Files in `src/shared/glyphs/data/*.json` are derivative works of KanjiVG SVG
stroke data and are therefore distributed under the same CC BY-SA 3.0 license
as KanjiVG itself. The script `scripts/build-kanjivg-data.mjs` documents the
derivation.

Attribution in the running app: a one-line credit on the landing page
("Stroke order data: KanjiVG (CC BY-SA 3.0)").

## Noto Emoji

- Source: <https://github.com/googlefonts/noto-emoji>
- Author: Google LLC and the Noto Emoji contributors
- License: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

SVG files under `src/pub/noto-emoji/svg/` are unmodified copies of the
upstream `svg/` directory, vendored locally for the vocab-card art on
lesson `word_image_mcq` steps. Only the glyphs referenced by the current
curriculum are bundled (see `src/features/lesson/data/mock-ja-*.ts`).
Apache 2.0 requires no per-glyph attribution; the full license text and
NOTICE file from upstream are reproduced at the source URL above.

## region-flags

- Source: <https://github.com/googlefonts/noto-emoji/tree/main/third_party/region-flags>
  (upstream: <https://github.com/behdad/region-flags>)
- Author: Behdad Esfahbod and contributors
- License: Public Domain (see upstream `LICENSE` — flag SVGs are released
  into the public domain by their contributors)

SVG files under `src/pub/region-flags/svg/` are unmodified copies of the
upstream `svg/` directory, vendored locally for the language-picker
flag icons. Only the language ISO codes shipped by the app
(`JP, KR, US, GB, CN, ES, DE, FR`) are bundled.
