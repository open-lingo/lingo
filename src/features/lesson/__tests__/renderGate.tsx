/**
 * DOM-render gate — registration-style guard mirroring
 * `moduleBarGuards.registerModuleBarGuards` (content bar) but for RENDER
 * correctness: every step of a module actually mounts, shows what its
 * Gate 10 visual-QA contract (`visualQaContracts.buildLessonContracts`)
 * says it must, never floats a kana reading over identical kana, and never
 * mis-segments a sentence into a phantom lexicon word.
 *
 * Complements, doesn't replace, the other two gates:
 *  - Gate 9 (`renderSmoke.test.tsx`) hand-picks a few steps to prove the
 *    script-ladder POLICY (romaji-by-module, kanji-by-window) end to end.
 *  - Gate 10 capture+judge (`visualQaContracts.ts` + Playwright) sees
 *    real pixels but costs a vision model and a browser.
 *  This gate is the cheap, EXHAUSTIVE middle layer: no judge, no browser,
 *  but every single step of a new module renders and is checked against
 *  its own machine-generated contract — so a bad content edit or a
 *  regressed renderer fails `vitest run`, not a human QA pass.
 *
 * Harness: identical mocking to `renderSmoke.test.tsx` (same contexts spin
 * up cleanly in happy-dom; StepRenderer, AnnotatedText, the kanji
 * post-pass, and the JA annotator all run for REAL). Content comes from
 * `getMockLessonContent(id)` — the same post-substitution pipeline the app
 * renders and `buildLessonContracts` derives its expectations from — so
 * contract and render are indexed against the exact same step list.
 *
 * mustShow matching reconstructs "what a learner actually READS" by
 * dropping every `<rt>` (romaji/furigana helper) before comparing —
 * `container.textContent` alone interleaves each fragment's reading
 * between it and the next fragment's base text (`ねこ` + `neko` + `は` +
 * `ha` + …), which breaks contiguous substring matching for any mustShow
 * string spanning more than one annotated fragment (most sentence-level
 * prompts/targets). Base-text reconstruction is the correct fix, not a
 * weakened assertion: it matches what a human visually reads on the main
 * line, exactly what the contract's `mustShow` text describes.
 *
 * `visualQaContracts.ts` has no per-mustShow-entry "hidden pre-interaction"
 * flag (checked 2026-07-20) — it only ever OMITS text from `mustShow` (or
 * routes it to `mustNotShow`, e.g. the audio-only-prompt case) when it
 * wouldn't render pre-interaction. Every string that DOES land in
 * `mustShow` is therefore expected to be on screen at mount, with nothing
 * left to special-case here.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => "tts-url"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/sfx", () => ({
  playSfx: vi.fn(),
}));
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p.replace(/^\//, "")}`,
  useLang: () => "ja",
}));
const defaultLearning = () => ({
  showRomaji: true,
  showRomanization: true,
  hiraganaRomajiAutoOff: false,
  katakanaRomajiAutoOff: false,
  hideBuildTileRomaji: false,
  buildTileRomajiAutoFlipped: false,
});
const settingsRef: {
  learning: Record<string, unknown>;
  audio: Record<string, unknown>;
  accessibility: Record<string, unknown>;
} = {
  learning: defaultLearning(),
  audio: { silentMode: false },
  // DialogueListenStepView's useReducedMotion() reads this directly —
  // absent from renderSmoke.test.tsx's stub because that suite never
  // renders dialogue_listen. m3/m4 lean heavily on it (mini-dialogues).
  accessibility: { reducedMotion: false },
};
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: settingsRef, updateSetting: vi.fn() }),
}));
const getCardStateMock = vi.fn();
vi.mock("@/features/flashcards/engine", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getCardState: (id: string) => getCardStateMock(id),
}));
// TranslateStepView calls useLanguage() unguarded (unlike AnnotatedText's
// try/catch fallback) — renderSmoke.test.tsx never exercised `translate`
// steps so never needed this. Mirrors AnnotatedText.neverMix.test.tsx's stub.
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { parseModuleIndex } from "@/shared/settings/romajiAutoFlip";
import {
  buildLessonContracts,
  type StepContract,
} from "@/features/lesson/dev/visualQaContracts";
import { annotateJapaneseText } from "@/features/languages/ja/romajiLexicon";

// ── DOM helpers ─────────────────────────────────────────────────────────

const SPACES_RE = /[ 　]+/g;
// Two display-time transforms sit between authored/contract text and what
// mounts, both narrow and cosmetic (never content-altering), so mustShow
// matching normalizes them away rather than special-casing every step view
// that uses them:
//  - `formatPrompt` sentence-cases the FIRST character of English prompts
//    at render time (BuildSentenceStepView, MultipleChoiceStepView, etc.) —
//    absorbed by case-insensitive comparison.
//  - `PromptWithEmphasis`/`splitQuotedEmphasis` (ListeningBuildStepView)
//    strips the outer '…' quote marks around an emphasized span and bolds
//    it instead — absorbed by stripping quote/apostrophe characters.
const QUOTES_RE = /['’"“”]/g;
function normalizeText(s: string): string {
  return s.replace(SPACES_RE, "").replace(QUOTES_RE, "").toLowerCase();
}

/** Reconstructs what a learner actually reads: every text node EXCEPT the
 *  contents of <rt> (romaji/furigana helper) elements, so a multi-fragment
 *  sentence's base text stays contiguous regardless of any interleaved
 *  reading helpers (visible or hidden — see file header). */
function baseTextContent(node: Node): string {
  if (node.nodeName.toLowerCase() === "rt") return "";
  if (node.nodeType === 3 /* TEXT_NODE */) return node.textContent ?? "";
  let out = "";
  for (const child of Array.from(node.childNodes)) out += baseTextContent(child);
  return out;
}

/** A ruby's own base text (its non-<rt> children only) — same convention
 *  as `renderSmoke.test.tsx`'s `rubyBase`, reused here for the identical
 *  kana-over-identical-kana check. */
function rubyBase(ruby: Element): string {
  let out = "";
  for (const node of Array.from(ruby.childNodes)) {
    if (node.nodeName.toLowerCase() === "rt") continue;
    out += node.textContent ?? "";
  }
  return out;
}

// ── romaji segmentation helpers (pure, no DOM) ─────────────────────────

/** Field priority the house content code already uses to name a step's
 *  "primary sentence surface" (mirrors moduleBarGuards.ts's inline sentence-
 *  repeat check) — collected here rather than first-match-wins, since a
 *  step could in principle carry more than one of these keys. */
const JA_SURFACE_KEYS = [
  "audioText",
  "target",
  "targetSentence",
  "targetPhrase",
  "correctKana",
] as const;
const HAS_JA = /[぀-ヿ㐀-鿿]/;

function primaryJaSurfaces(step: LessonStep): string[] {
  const s = step as unknown as Record<string, unknown>;
  const out: string[] = [];
  for (const key of JA_SURFACE_KEYS) {
    const v = s[key];
    if (typeof v === "string" && HAS_JA.test(v) && !out.includes(v)) {
      out.push(v);
    }
  }
  return out;
}

// ── the gate ────────────────────────────────────────────────────────────

export function registerRenderGate(opts: {
  moduleLabel: string;
  lessons: LessonContent[];
}): void {
  const { moduleLabel, lessons } = opts;

  describe(`${moduleLabel} render gate (DOM mount + Gate 10 contract + ruby/romaji sanity)`, () => {
    afterEach(() => cleanup());
    beforeEach(() => {
      settingsRef.learning = defaultLearning();
      settingsRef.audio = { silentMode: false };
      getCardStateMock.mockReset();
      getCardStateMock.mockReturnValue(undefined);
    });

    for (const lessonStub of lessons) {
      const id = lessonStub.id;
      const rendered = getMockLessonContent(id);
      if (!rendered) {
        it(`${id}: resolves via getMockLessonContent`, () => {
          expect(rendered, `${id} must resolve`).not.toBeNull();
        });
        continue;
      }
      const moduleIndex = parseModuleIndex(rendered.moduleId);
      const contracts = buildLessonContracts(id);

      describe(id, () => {
        rendered.steps.forEach((step, i) => {
          const contract: StepContract | undefined = contracts.steps[i];

          it(`step ${i} (${step.id} / ${step.type}): mounts, shows its mustShow contract, and never floats kana over identical kana`, () => {
            let container: HTMLElement;
            expect(() => {
              ({ container } = render(
                <LessonModuleProvider moduleIndex={moduleIndex}>
                  <StepRenderer
                    step={step}
                    onComplete={() => {}}
                    onContinue={() => {}}
                  />
                </LessonModuleProvider>,
              ));
            }, `${id} step ${i} (${step.id}, ${step.type}) threw on mount`).not.toThrow();

            // b. every contract mustShow string is on screen (base text,
            // reading helpers excluded — see file header).
            if (contract) {
              expect(contract.stepId, `${id} step ${i} contract/step id mismatch`).toBe(
                step.id,
              );
              const haystack = normalizeText(baseTextContent(container!));
              for (const want of contract.mustShow) {
                expect(
                  haystack.includes(normalizeText(want)),
                  `${id}/${step.id} (${step.type}): mustShow "${want}" not found in rendered text ("${haystack}")`,
                ).toBe(true);
              }
            }

            // c. ruby sanity: no <rt> whose (trimmed) text equals its
            // ruby's own base text — the kana-floating-over-identical-kana
            // ban (f67479f-class regression).
            for (const rt of Array.from(container!.querySelectorAll("rt"))) {
              const ruby = rt.parentElement;
              if (!ruby) continue;
              const rtText = (rt.textContent ?? "").trim();
              const base = rubyBase(ruby).trim();
              if (!rtText || !base) continue;
              expect(
                rtText === base,
                `${id}/${step.id} (${step.type}): <rt> "${rtText}" floats above identical base "${base}"`,
              ).toBe(false);
            }
          });

          // d. romaji segmentation sanity — pure function, no render.
          it(`step ${i} (${step.id} / ${step.type}): JA surfaces segment into real lexicon words (くるまだ-class regression)`, () => {
            for (const surface of primaryJaSurfaces(step)) {
              const fragments = annotateJapaneseText(surface, true);
              for (const frag of fragments) {
                if (!frag.reading || frag.text.length < 2) continue;
                // Never spans a space in the authored surface — a fragment's
                // text is a literal substring of `surface`, so containing a
                // space char directly proves it crossed a word boundary.
                expect(
                  /[ 　]/.test(frag.text),
                  `${id}/${step.id}: fragment "${frag.text}" (reading "${frag.reading}") spans a space in "${surface}"`,
                ).toBe(false);
                // Re-annotating the fragment's own text in isolation must
                // NOT decompose it further — a multi-char "word" fragment
                // the DP only produced by seeing more context than the word
                // itself is exactly the shape of the くる+まだ mis-split.
                const re = annotateJapaneseText(frag.text, true);
                expect(
                  re.length,
                  `${id}/${step.id}: fragment "${frag.text}" from "${surface}" decomposes into ${re.length} fragments in isolation (${JSON.stringify(re.map((f) => f.text))}) — not a real lexicon word`,
                ).toBe(1);
                expect(re[0].text).toBe(frag.text);
              }
            }
          });
        });
      });
    }
  });
}
