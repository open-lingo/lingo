/**
 * Runtime lookup stub for KO-source content strings (rung 1a — §3c of
 * `docs/reverse-teaching-readiness-2026-07-29.md`).
 *
 * This is NOT wired into any step view yet. Rung 1b's job is to call
 * `resolveContentString` from the step views listed at the bottom of this
 * file, once a translated `<moduleId>.<uiLocale>.json` sidecar actually
 * exists for at least one module (produced by the future MT wave — see
 * `docs/ko-source-rung1a-2026-09-10.md`). Today no translated catalogs
 * exist, so this always falls back to English; that is the correct,
 * intended behaviour, not a bug — it makes the stub safe to land ahead of
 * any translated content.
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
 * Rung 1b wiring plan (NOT done here — this file is deliberately unwired).
 *
 * Every one of these step views currently renders `en`/gloss/prose text
 * straight from `LessonContent` / `CourseAtom`. Rung 1b's job per view:
 * compute the step/atom's anchor (mirroring the extractor's own anchor
 * derivation in `scripts/i18n/extract-content-catalog.mjs`) and swap the
 * raw string for `resolveContentString(languageId, anchor, raw, uiLocale)`.
 *
 *   - `src/features/lesson/components/steps/MultipleChoiceStep.tsx` —
 *     `prompt`, each `option.text`.
 *   - `src/features/lesson/components/steps/GrammarRuleStep.tsx` —
 *     `title`, `rule`, `examples[].en`, `antiPattern.en`/`.why`,
 *     `cultureNote`.
 *   - `src/features/lesson/components/steps/InfoStep.tsx` — `title`, `body`.
 *   - `src/features/lesson/components/steps/MatchPairsStep.tsx` — meaning-
 *     grid `pair.target` (romaji-grid targets stay untranslated by design,
 *     same "romaji vs meaning" mode split `matchGridShape` already makes).
 *   - Any step view rendering `atom.meaningEn` / `atom.shortGloss` as a
 *     gloss (vocab intro cards, flashcard reviewer, atom tooltips) —
 *     anchor `m<N>/atom:<kana>/gloss` (or `/shortGloss`).
 *   - `src/features/lesson/components/steps/BuildSentenceStep.tsx`,
 *     `FillBlankStep.tsx`, `ParticleClozeStep.tsx`, and the other
 *     `prompt`-bearing step components — same `prompt` treatment as MCQ.
 *
 * A shared `useContentString(languageId, anchor, enText)` hook (reading
 * `uiLocale` from the existing i18next instance via `useTranslation()`)
 * would be the natural call-site wrapper so individual step components
 * don't each re-derive `uiLocale` — left for rung 1b to add alongside the
 * first real wiring, rather than speculatively here.
 */
