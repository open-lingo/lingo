import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { StepRenderer } from "../components/StepRenderer";
import type { WordMapStep } from "../types";
import {
  GENDER_STYLE,
  type GrammaticalGender,
} from "@/shared/language/genderColor";
import { DevStageFrame } from "./DevStageFrame";

/**
 * DEV · Gender color-coding — the visual layer, staged.
 * Route: `/:lang/qa/gender-color`.
 *
 * Spencer, 2026-08-20: "is there any gendering indicator we can do by
 * visual coloring? … for ANY gendered language … we need to account for
 * neuter words … blue, pink and some grey color maybe? just some ideas,
 * where can we apply that."
 *
 * This page is the answer in three layers:
 *   1. the PALETTE — one system, three genders, any gendered course
 *      (es/fr use m/f today; n is ready for German);
 *   2. STATIC mockups of the surfaces it can dress (image-MCQ cards,
 *      dictionary rows, gender_sort buckets);
 *   3. a LIVE word_map where the agreement chain lights up in the noun's
 *      color as you solve — the "good teacher" version of the idea.
 *
 * Design contract (see `shared/language/genderColor.ts`): color is never
 * the only carrier (always paired with the article or an m/f/n marker);
 * graded steps tint the SOLVED/reveal state only; invariant words stay
 * untinted — the contrast is the lesson; scaffolding to be weaned via a
 * learner setting when this ships to course surfaces.
 */

const GENDERS: GrammaticalGender[] = ["m", "f", "n"];

/** «su casa es muy bonita» — the feminine chain: casa + bonita. */
const CASA_STEP: WordMapStep = {
  id: "gender-map-casa",
  type: "word_map",
  tokens: ["su", "casa", "es", "muy", "bonita"],
  pairs: [
    { en: "her", tokenIndex: 0 },
    { en: "house", tokenIndex: 1 },
    { en: "is", tokenIndex: 2 },
    { en: "very", tokenIndex: 3 },
    { en: "pretty", tokenIndex: 4 },
  ],
  tokenGenders: { 1: "f", 4: "f" },
  audioText: "su casa es muy bonita",
  revealNote:
    "«casa» and «bonita» lit up the same pink: the adjective agrees with its noun. «su», «es», «muy» stay neutral — they never change.",
};

/** «el carro de mi abuelo es azul» — masculine chain; azul is invariant. */
const CARRO_STEP: WordMapStep = {
  id: "gender-map-carro",
  type: "word_map",
  tokens: ["el", "carro", "de", "mi", "abuelo", "es", "azul"],
  pairs: [
    { en: "the", tokenIndex: 0 },
    { en: "car", tokenIndex: 1 },
    { en: "of", tokenIndex: 2 },
    { en: "my", tokenIndex: 3 },
    { en: "grandfather", tokenIndex: 4 },
    { en: "is", tokenIndex: 5 },
    { en: "blue", tokenIndex: 6 },
  ],
  tokenGenders: { 0: "m", 1: "m", 4: "m" },
  audioText: "el carro de mi abuelo es azul",
  revealNote:
    "«el», «carro», «abuelo» share the blue. «azul» stayed neutral on purpose — some adjectives don't change for gender, and the missing tint is how you'll spot them.",
};

const LIVE_EXAMPLES = [
  {
    key: "casa",
    label: "feminine chain",
    cue: "Solve it and watch «casa» and «bonita» light the same pink — agreement you can see.",
    step: CASA_STEP,
  },
  {
    key: "carro",
    label: "masculine chain",
    cue: "«el / carro / abuelo» go blue; invariant «azul» stays neutral — the contrast is the lesson.",
    step: CARRO_STEP,
  },
] as const;

/** Mock vocab cards — the image-MCQ / flashcard treatment. */
const MOCK_CARDS: {
  gender: GrammaticalGender;
  article: string;
  word: string;
  emoji: string;
  lang: string;
}[] = [
  { gender: "f", article: "la", word: "madre", emoji: "👩", lang: "es" },
  { gender: "m", article: "el", word: "padre", emoji: "👨", lang: "es" },
  { gender: "f", article: "la", word: "lune", emoji: "🌙", lang: "fr" },
  { gender: "n", article: "das", word: "Auto", emoji: "🚗", lang: "de" },
];

export default function GenderColorPage() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState("—");
  const example = LIVE_EXAMPLES[exampleIdx];

  const step: WordMapStep = useMemo(
    () => ({ ...example.step, id: `${example.step.id}-r${resetKey}` }),
    [example, resetKey],
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · Gender color-coding (prototype)
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            🎨 One palette for every gendered language
          </h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            Three hues, fixed across courses: masculine sky, feminine pink,
            neuter grey. The registry already stores gender on es/fr noun
            atoms — this layer makes it visible. The teaching move is the
            AGREEMENT CHAIN: article, noun and agreeing adjective glow the
            noun&apos;s color while invariant words stay neutral, so
            agreement reads at a glance.
          </p>
          <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-xs text-text-secondary">
            <li>
              <b>Color is never alone:</b> every tint pairs with the
              language&apos;s own article or an m/f/n marker — and sky vs
              pink vs grey avoids red-green confusability.
            </li>
            <li>
              <b>Reveal, not hint:</b> graded steps tint the solved state
              only. Pre-answer color would leak answers (it IS the answer in
              gender_sort) and train color-reading over word-reading.
            </li>
            <li>
              <b>Scaffolding:</b> when this ships to course surfaces it
              rides a per-language setting like romaji — on for A1, weaned
              later.
            </li>
          </ul>
          <p className="m-0 mt-3 text-xs text-text-muted">
            <Link to="../qa/word-map" className="underline">
              word-map QA
            </Link>
            {" · "}
            <Link to="../qa/tap-word" className="underline">
              tap-the-word QA
            </Link>
            {" · "}
            <Link to="../qa" className="underline">
              QA test-drive
            </Link>
          </p>
        </header>

        {/* 1 · the palette */}
        <section className="mb-6">
          <h2 className="m-0 mb-2 text-sm font-bold uppercase tracking-wider text-text-muted">
            The palette
          </h2>
          <div className="flex flex-wrap gap-3">
            {GENDERS.map((g) => {
              const s = GENDER_STYLE[g];
              return (
                <div
                  key={g}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
                >
                  <span className={`h-3 w-3 rounded-full ${s.dot}`} />
                  <span className="text-sm font-semibold capitalize">{s.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.badge}`}
                  >
                    {g === "m" ? "el · le · der" : g === "f" ? "la · la · die" : "das"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2 · surfaces it can dress */}
        <section className="mb-6">
          <h2 className="m-0 mb-2 text-sm font-bold uppercase tracking-wider text-text-muted">
            Where it applies — vocab cards, rows, buckets
          </h2>
          <div className="mb-3 flex flex-wrap gap-3">
            {MOCK_CARDS.map((c) => {
              const s = GENDER_STYLE[c.gender];
              return (
                <div
                  key={c.word}
                  className={`flex w-28 flex-col items-center gap-1 rounded-2xl border-2 p-3 ${s.chip}`}
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-base font-bold">
                    {c.article} {c.word}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    {c.lang}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3">
            {MOCK_CARDS.slice(0, 3).map((c) => {
              const s = GENDER_STYLE[c.gender];
              return (
                <div key={c.word} className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  <span className="font-semibold">{c.word}</span>
                  <span className={`rounded px-1.5 text-xs font-bold ${s.badge}`}>
                    {c.article}
                  </span>
                  <span className="text-text-muted">
                    {c.word === "madre"
                      ? "mother"
                      : c.word === "padre"
                        ? "father"
                        : "moon"}
                  </span>
                </div>
              );
            })}
            <p className="m-0 mt-1 text-[11px] text-text-muted">
              dictionary / flashcard rows — dot + article badge, gloss stays
              neutral
            </p>
          </div>
        </section>

        {/* 3 · the live demo */}
        <section>
          <h2 className="m-0 mb-2 text-sm font-bold uppercase tracking-wider text-text-muted">
            Live — agreement chains in word_map
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
            <span className="font-semibold text-text-muted">Example:</span>
            {LIVE_EXAMPLES.map((ex, i) => (
              <button
                key={ex.key}
                type="button"
                onClick={() => {
                  setExampleIdx(i);
                  setResetKey((k) => k + 1);
                  setLastResult("—");
                }}
                className={`rounded border px-2 py-0.5 ${
                  exampleIdx === i
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border bg-surface"
                }`}
              >
                {ex.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setResetKey((k) => k + 1);
                setLastResult("—");
              }}
              className="ml-auto rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
            >
              Reset
            </button>
          </div>
          <p className="m-0 mb-3 text-xs italic text-text-muted">{example.cue}</p>
          <DevStageFrame height={596}>
            <LessonModuleProvider moduleIndex={null}>
              <StepRenderer
                key={step.id}
                step={step}
                onComplete={(id, correct) =>
                  setLastResult(`onComplete("${id}", ${correct})`)
                }
                onContinue={() =>
                  setLastResult("onContinue() — lesson would advance")
                }
              />
            </LessonModuleProvider>
          </DevStageFrame>
          <div className="mt-2 text-xs text-text-muted">
            last callback: {lastResult}
          </div>
        </section>
      </div>
    </div>
  );
}
