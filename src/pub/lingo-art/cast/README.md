# The register cast — generated portraits

Four characters for `registerAudiences.ts`, in two poses each, served at
`/lingo-art/cast/<role>.png` and `/lingo-art/cast/<role>-bow.png`.
**44.6 KB for all eight** (185×256, alpha, 64-colour palette).

Spencer 2026-08-18: *"I think we DO want images we preload of who each person
is. generating some cartoon characters of grandma or teacher or other things,
with the local model, it should do a lot better. maybe it has instructions to
make a transparent background too."*

## Recipe (reproducible, ~25 s per image, fully local)

Generated with **mflux + Z-Image-Turbo**, already cached on this machine at
`~/.cache/huggingface/hub/models--Tongyi-MAI--Z-Image-Turbo`.

```sh
mflux-generate-z-image-turbo --steps 8 --seed 7 --width 512 --height 512 \
  --output <role>.png --prompt "<subject>, <STYLE>"
```

Two things that are not optional:

- **Use `mflux-generate-z-image-turbo`, not `mflux-generate --base-model
  z-image-turbo`.** The generic entry point resolves a weight definition with a
  `text_encoder_2` component that this model does not have, and dies on the
  cached snapshot. The per-model binary works first try.
- **Share the seed and keep the style clause byte-identical across subjects.**
  That is what makes four separate generations read as one cast instead of four
  unrelated drawings. Only the subject clause varies.

`STYLE` (verbatim):

> flat vector cartoon sticker, simple rounded shapes, thick dark navy outline,
> flat pastel colors, no gradients, no shading, standing upright facing forward,
> full body from head to feet visible with empty margin around the figure, plain
> solid white background, children's book illustration, centered

Subjects: a cheerful young Japanese teenager in a casual t-shirt and a baseball
cap · a friendly Japanese schoolteacher wearing round glasses, a neat shirt,
holding a book · a kind elderly Japanese grandmother with grey hair in a bun,
holding a walking cane · a polite Japanese shop clerk wearing an apron and a
name badge.

The model matched the house style (2.5px `#1e293b`-ish outline, flat fill, no
gradients) from the prompt alone — no LoRA, no post-hoc recolouring.

## Post-processing (`scripts/` is not involved; this was a one-shot)

1. **Background → alpha by FLOOD FILL from the four corners**, not by colour.
   A naive white→alpha cut deletes the teacher's white shirt and the clerk's
   white sleeves, because those whites are enclosed by the outline and are not
   background.
2. **One shared crop box across the whole cast** — the union of the four alpha
   bboxes. Cropping each figure to its own bbox would make the grandmother
   exactly as tall as the teenager and destroy the relative scale.
3. **Erode the alpha by 1px** (`ImageFilter.MinFilter(3)`). The anti-aliased
   edge pixels are already blended with the white backdrop, so without this
   every figure wears a light halo in dark mode.
4. Resize longest edge to 256, quantize to a 64-colour palette. Flat art loses
   nothing and the files drop from ~50 KB to ~6 KB each.

## The bowing pose — EDIT, don't re-generate

Politeness level 3 needs a real bow, because you cannot fake a pose with an
affine transform on a raster. Rotating the upright figure about its feet swings
the whole rectangle and reads as toppling; `skewX` pins the feet but shears the
head into a slanted oval and the character reads as melting. Both were shipped
to the QA page and both were wrong.

```sh
mflux-generate-qwen-edit --steps 12 --seed 7 \
  --image-paths <role>.png --output <role>-bow2.png \
  --prompt "Keep the exact same character, same art style, same colors, same
  thick dark navy outline, same proportions. Change ONLY the pose. They are
  bowing deeply at the waist in a formal Japanese bow, back angled forward about
  45 degrees, head lowered, arms straight at their sides. The character stands
  on the ground, feet together, plain solid white background, full body visible."
```

~50 s per image against the already-cached Qwen-Image-Edit-2509. **Editing is
what preserves identity** — re-generating with a pose clause produces a
different person in the same style.

Two things that did NOT work:

- **A "small polite nod" prompt.** It comes back as a three-quarter TURN, not a
  shallow bow, and the face drifts. There is deliberately no level-2 pose; that
  level uses the upright portrait with a ~7° lean, which is also the truer
  picture since です・ます is the polite default rather than a deferential act.
- **Cropping the poses independently.** The crop box must be the union across
  BOTH poses, or a bowing figure gets rescaled to the upright one's height and
  its feet leave the ground line. Raise the flood-fill tolerance to 42 for the
  bow renders — they pick up a light grey ground shadow that 30 leaves behind.

## Adding a character

Reuse the STYLE clause and seed 7 verbatim, then re-run steps 1–4 **with the
existing four included in the shared crop box** so the new figure lands at the
same scale.
