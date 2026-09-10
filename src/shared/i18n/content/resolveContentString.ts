/**
 * Runtime lookup for KO-source content strings (rung 1a — §3c of
 * `docs/reverse-teaching-readiness-2026-07-29.md`).
 *
 * WIRED into the step views listed at the bottom of this file as of rung 1b
 * (`docs/ko-source-rung1b-2026-09-10.md`) via the shared
 * `useContentString`/`useContentStrings` hooks
 * (`src/features/lesson/hooks/useContentString.ts`) and the anchor-formula
 * helpers in `./anchors.ts`. Still falls back to English for every module
 * except `m6` (the rung 1b MT-wave pilot — `ja/m6.ko.json`), since no other
 * translated `<moduleId>.<uiLocale>.json` sidecar exists yet; that is the
 * correct, intended behaviour, not a bug — it makes this safe to call
 * everywhere ahead of the rest of the MT wave landing.
 *
 * ## Contract
 *
 * `resolveContentString(lang, anchor, enText, uiLocale)`:
 *   - `lang` — the course/target language (e.g. "ja"). NOT the instruction
 *     language; matches the extractor's `<lang>` argument and the first
 *     path segment under `src/shared/i18n/content/`.
 *   - `anchor` — the stable content anchor produced by
 *     `scripts/i18n/extract-content-catalog.mjs` (e.g.
 *     `"m6/atom:せんせい/gloss"`, `"m6/gp:te-form/rule"`,
 *     `"m6/ja-m6-neo-4/ja:かぎが ある"`, `"m6/ja-m6-neo-4/en:<hash>"`). The
 *     leading `m<N>/` segment names the module, which is how this function
 *     finds the right catalog without a separate moduleId argument.
 *   - `enText` — the CURRENT English string the caller would otherwise
 *     render. This is hashed and compared against the catalog entry's
 *     `enSourceHash` — if the English has been edited since the catalog
 *     (or the translated sidecar) was generated, the entry is STALE and
 *     this falls back to English rather than serving a translation that no
 *     longer matches the source. This is the same staleness signal
 *     `--check` reports.
 *   - `uiLocale` — the learner's instruction language (i18next locale,
 *     `src/shared/i18n/i18n.ts`'s `supportedLngs`: "en" | "ko" | "es").
 *     "en" always short-circuits to `enText` (no lookup — English IS the
 *     English).
 *
 * ## Why "pure"
 *
 * No network calls, no async, no mutation — same four inputs always
 * produce the same output. Internally it reads catalogs loaded once at
 * MODULE-IMPORT time via `import.meta.glob(..., { eager: true })` (the
 * same static-bundling pattern `courseAtoms.ts`/`placementBank.ts` use
 * for curriculum data) rather than doing file/network I/O per call — from
 * the caller's perspective this is indistinguishable from a pure lookup
 * table, and safe to call synchronously from render.
 *
 * ## Catalog file shape this reads
 *
 * English source catalogs (`<moduleId>.en.json`) — written by the
 * extractor; shape: `{ entries: [{ anchor, en, enSourceHash }] }`.
 *
 * Translated catalogs (`<moduleId>.<uiLocale>.json`, e.g. `m6.ko.json`) —
 * NOT yet produced by any tool in this rung (that's the MT wave, described
 * in `docs/ko-source-rung1a-2026-09-10.md`). Expected shape, for this
 * function to pick them up automatically once they exist:
 *   `{ entries: [{ anchor, text, enSourceHash }] }`
 * — `text` is the translated string, `enSourceHash` is the hash of the
 * English text it was translated FROM (same field name/semantics as the
 * `--check` sidecar shape in the extractor, generalized from `ko` to
 * `text` so this file shape isn't locale-specific).
 */
import { sha256Hex16 } from "@/shared/tts/sha256";

interface TranslatedCatalogEntry {
  anchor: string;
  text: string;
  enSourceHash: string;
}
interface TranslatedCatalog {
  moduleId: string;
  lang: string;
  entries: TranslatedCatalogEntry[];
}

// Eagerly bundled at build time — mirrors the courseAtoms.ts /
// placementBank.ts glob-collector pattern. Empty today (no *.ko.json /
// *.es.json sidecars exist yet); this is intentionally forward-compatible
// with zero code changes once the MT wave lands translated catalogs.
// Deliberately excludes `*.en.json` (the extractor's own output — English
// source, not a translation) so a stray future glob widening can't
// accidentally serve English back out of the "translated" lookup path.
const TRANSLATED_CATALOGS = import.meta.glob<TranslatedCatalog>(
  ["./*/*.json", "!./*/*.en.json"],
  { eager: true, import: "default" },
);

/** `"m6/atom:せんせい/gloss"` → `"m6"`. */
function moduleIdFromAnchor(anchor: string): string | null {
  const slash = anchor.indexOf("/");
  if (slash === -1) return null;
  return anchor.slice(0, slash);
}

/**
 * Core lookup, with the catalog map passed in explicitly rather than read
 * from the module-level glob — this is what
 * `resolveContentString.test.ts` exercises directly (constructing synthetic
 * catalogs in-memory), since the real catalog directory has no translated
 * sidecars yet for the glob-bound wrapper below to pick up. Exported so a
 * future caller with its own catalog source (e.g. a lazy-loaded chunk
 * instead of an eager glob) can reuse the same resolution rules.
 */
export function resolveContentStringFromCatalogs(
  catalogs: Record<string, TranslatedCatalog>,
  lang: string,
  anchor: string,
  enText: string,
  uiLocale: string,
): string {
  if (uiLocale === "en") return enText;

  const moduleId = moduleIdFromAnchor(anchor);
  if (!moduleId) return enText;

  const path = `./${lang}/${moduleId}.${uiLocale}.json`;
  const catalog = catalogs[path];
  if (!catalog) return enText; // no translated catalog for this module/locale yet

  const entry = catalog.entries.find((e) => e.anchor === anchor);
  if (!entry) return enText; // catalog exists, this anchor isn't in it yet

  const currentHash = sha256Hex16(enText);
  if (entry.enSourceHash !== currentHash) return enText; // stale — en drifted since translation

  return entry.text;
}

/**
 * Resolve the instruction-language string for a piece of learner-facing
 * content. Returns the translated string when a FRESH catalog entry exists
 * for `uiLocale`; otherwise falls back to `enText` unchanged.
 *
 * "Fresh" = the translated catalog carries an entry for this exact anchor
 * whose `enSourceHash` matches `sha256Hex16(enText)` — i.e. the English
 * hasn't been edited since that translation was produced.
 *
 * This is the production entry point, bound to the real
 * `import.meta.glob`-loaded catalogs. Always falls back to English today
 * because no `*.ko.json` / `*.es.json` sidecar exists in
 * `src/shared/i18n/content/` yet — that is expected, not a bug (see the
 * file header).
 */
export function resolveContentString(
  lang: string,
  anchor: string,
  enText: string,
  uiLocale: string,
): string {
  return resolveContentStringFromCatalogs(
    TRANSLATED_CATALOGS,
    lang,
    anchor,
    enText,
    uiLocale,
  );
}

/**
 * Rung 1b wiring map — landed (see `docs/ko-source-rung1b-2026-09-10.md` for
 * the full per-field table). Each view computes its anchor via a helper in
 * `./anchors.ts` (mirroring the extractor's own derivation in
 * `scripts/i18n/extract-content-catalog.mjs`) and calls
 * `useContentString`/`useContentStrings`
 * (`src/features/lesson/hooks/useContentString.ts`) in place of the raw
 * string:
 *
 *   - `InfoStepView.tsx` — `title`, `body`.
 *   - `MultipleChoiceStepView.tsx` — `prompt` (resolved BEFORE
 *     `formatPrompt()`), `hint`, `explanation`, each `option.text`.
 *   - `BuildSentenceStepView.tsx` — `prompt` (same formatPrompt ordering),
 *     `hint`, `explanation`.
 *   - `FillBlankStepView.tsx` — `explanation`, `hint`.
 *   - `ParticleClozeStepView.tsx` — `explanation` (both render sites).
 *   - `MatchPairsStepView.tsx` — `prompt`, each meaning-grid `pair.target`
 *     (romaji-grid targets are never extracted in the first place —
 *     `isGlossText` drops them at catalog-build time — so calling the
 *     lookup unconditionally on every pair is safe by construction).
 *   - `PhraseCardStepView.tsx` — `meaningEn`, resolved through the ATOM
 *     catalog (`atomGlossAnchor`, keyed by `step.kana`) rather than a
 *     step-shaped anchor, since the extractor's generic `extractStep()`
 *     never captures this field — only its atom-gloss loop does.
 *   - `GrammarRuleStepView.tsx` — `title`, `rule`, `examples[].en`,
 *     `antiPattern.en`/`.why`, `cultureNote`. `readAloudText` deliberately
 *     stays on raw English — `useSpeechReadAloud` hardcodes
 *     `utterance.lang = "en-US"`, so speaking a translated string through a
 *     pinned English voice would be doubly wrong.
 *
 * `story:ja-m<N>-*` lessons are OUT of scope for this wave — story content
 * is a separate `StoryProse`/`StoryBlocks`/`StoryQuiz` pipeline, not
 * `LessonContent`/step-shaped; see the rung 1b doc for the full reasoning.
 */
