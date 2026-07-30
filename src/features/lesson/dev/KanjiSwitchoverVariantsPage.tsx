import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { StepRenderer } from "../components/StepRenderer";
import type { LessonStep } from "../types";

/**
 * DEV · Kana→kanji switchover beat — a PICK-ONE gallery. (B061 / B064)
 *
 * The case: the learner has known ともだち by sound and meaning for sixteen
 * modules. Only the written form 友達 is new. This is NOT kanji-from-scratch
 * and NOT a new word — every variant below is a different answer to "what,
 * if anything, marks that moment?"
 *
 * Measured scope (probe, 2026-07-28): 112 switchover events across the
 * course, median gap 11 modules between "word taught" and "kanji appears".
 * 90 of them are never graded by anything, and ZERO are graded inside the
 * unlock window. So today the answer is variant A — nothing.
 *
 * Each variant names the tool it is modelled on, because the research pass
 * found that NO surveyed product stages a discrete switchover beat: WaniKani
 * gates vocab behind kanji, jpdb subordinates kanji to vocab, Renshuu toggles
 * furigana, Genki states a rule. We are choosing among their near-misses.
 *
 * Graded steps render through the real `StepRenderer`, so what you tap IS
 * what would ship. The reveal cards are mockups — no step type hosts them
 * yet, and picking one is the point of this page.
 */

const STORAGE_KEY = "lingo:kanji-switchover-variants:v1";

type Verdict = "" | "pick" | "maybe" | "no";
type Note = { verdict: Verdict; text: string };
type Notes = Record<string, Note>;

const VERDICTS: { key: Exclude<Verdict, "">; label: string; cls: string }[] = [
  { key: "pick", label: "✓ ship this", cls: "border-green-500 bg-green-500/15" },
  { key: "maybe", label: "~ maybe", cls: "border-amber-500 bg-amber-500/15" },
  { key: "no", label: "✗ no", cls: "border-red-500 bg-red-500/15" },
];

function loadNotes(): Notes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Notes;
    const out: Notes = {};
    for (const [k, v] of Object.entries(parsed ?? {})) {
      out[k] = {
        verdict: (v?.verdict ?? "") as Verdict,
        text: typeof v?.text === "string" ? v.text : "",
      };
    }
    return out;
  } catch {
    return {};
  }
}

/** Defer mounting until scrolled near — six live steps is a lot of renderer. */
function LazyStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);
  return <div ref={ref}>{inView ? children : <div className="h-24" />}</div>;
}

// ---------------------------------------------------------------------------
// Two running examples, deliberately different shapes.
//
//   友達 — ATOM case. Neither 友 nor 達 has been seen before. Nothing to
//          infer from; a cold pretest here is pure guessing.
//   明日 — COMPOUND case. Both 明 and 日 are already taught, so the learner
//          CAN reason "bright + day → tomorrow". Pretest has something to
//          bite on.
//
// The hybrid (variant E) is exactly this distinction, decided mechanically
// from whether every component glyph unlocked in an earlier module.
// ---------------------------------------------------------------------------

/** Furigana-suppressed prompt: reading === surface has nothing to float. */
function bare(kanji: string) {
  return [{ surface: kanji, reading: kanji }];
}

function readingStep(
  id: string,
  kanji: string,
  reading: string,
  meaningEn: string,
  distractors: string[],
): LessonStep {
  const options = [reading, ...distractors].map((t, i) => ({
    id: `${id}-o${i}`,
    text: t,
  }));
  return {
    id,
    type: "kanji_reading",
    kanji,
    reading,
    meaningEn,
    promptAnnotation: bare(kanji),
    options,
    correctOptionId: options[0].id,
    audioText: reading,
  } as LessonStep;
}

/**
 * The graded steps the gallery renders, exported so their pedagogical
 * constraints can be pinned by a test rather than living only in prose:
 *  - `kanji_reading` options are pure kana (the no-kanji-production policy).
 *  - the 明日 pretest must not offer あす, which is ALSO a correct reading.
 *  - variant F's kanji form must be the CORRECT option, never a distractor.
 */
export const DEMO_STEPS = {
  /** D — bare recognition, no reveal in front of it. */
  bareRead: readingStep("ksv-d", "友達", "ともだち", "friend", [
    "かぞく",
    "せんせい",
    "がくせい",
  ]),
  /**
   * G step 1 — the cold graded attempt. NO `meaningEn`: the gloss is a
   * disambiguating cue for homographs, but on a first-contact attempt it
   * hands over the answer, since "friend" + four known words is solvable
   * without reading the kanji at all. Caught by looking at the rendered
   * page — the same defect the binge simulation found in the context MCQ.
   */
  coldAttempt: readingStep("ksv-g", "友達", "ともだち", "", [
    "かぞく",
    "せんせい",
    "がくせい",
  ]),
  /** E step 1 — cold pretest on a compound whose glyphs are both taught. */
  pretest: readingStep("ksv-e1", "明日", "あした", "", [
    "きょう",
    "きのう",
    "まいにち",
  ]),
  /** F — the kanji as one of four, inside an ordinary review MCQ. */
  oneOfFour: {
    id: "ksv-f",
    type: "multiple_choice",
    prompt: "Which one means “friend”?",
    options: [
      { id: "ksv-f-o0", text: "友達" },
      { id: "ksv-f-o1", text: "家族" },
      { id: "ksv-f-o2", text: "先生" },
      { id: "ksv-f-o3", text: "学生" },
    ],
    correctOptionId: "ksv-f-o0",
    optionsHideRomaji: true,
  } as LessonStep,
} as const;

/** Mockup of a reveal card — no step type hosts this yet. */
function RevealCard({
  kana,
  kanji,
  gloss,
  parts,
  ruleLine,
  goingForward,
}: {
  kana: string;
  kanji: string;
  gloss: string;
  parts?: { glyph: string; sense: string }[];
  ruleLine?: string;
  /** Sentence showing how the word will look from now on, furigana riding
   *  above. Kept separate from the pivot: printing the kana, an arrow, and
   *  then the SAME kana again as ruby is redundant — the pivot teaches the
   *  binding, this shows the going-forward behaviour the rule line promises. */
  goingForward?: { segments: { surface: string; reading: string }[]; en: string };
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-muted">
        You already know this word
      </p>
      <div className="mb-1 text-2xl text-text-secondary">{kana}</div>
      <div className="mb-1 text-3xl text-text-muted">↓</div>
      <div className="mb-2 text-5xl font-semibold leading-tight">{kanji}</div>
      <p className="mb-4 text-sm text-text-secondary">{gloss}</p>
      {parts && (
        <div className="mb-3 flex justify-center gap-3">
          {parts.map((p) => (
            <div
              key={p.glyph}
              className="rounded-lg border border-border/70 bg-background px-3 py-2"
            >
              <div className="text-2xl leading-none">{p.glyph}</div>
              <div className="mt-1 text-[11px] text-text-muted">{p.sense}</div>
            </div>
          ))}
        </div>
      )}
      {goingForward && (
        <div className="mb-3 rounded-lg border border-border/70 bg-background px-3 py-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">
            From now on you’ll see
          </p>
          <div className="text-2xl leading-relaxed">
            <AnnotatedJa segments={goingForward.segments} />
          </div>
          <p className="mt-1 text-xs text-text-secondary">{goingForward.en}</p>
        </div>
      )}
      {ruleLine && (
        <p className="mx-auto max-w-xs text-xs italic leading-relaxed text-text-muted">
          {ruleLine}
        </p>
      )}
    </div>
  );
}

/** Mockup of the silent baseline — the kanji simply appears mid-sentence. */
function SilentSwap() {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center">
      <p className="mb-3 text-xs text-text-muted">
        …the very next sentence the learner meets, with no comment:
      </p>
      <div className="text-3xl leading-relaxed">
        <AnnotatedJa
          segments={[
            { surface: "友達", reading: "ともだち", furiganaWindowOpen: true },
            { surface: "と", reading: "と", role: "particle" },
            { surface: "いきます", reading: "いきます" },
          ]}
        />
      </div>
      <p className="mt-3 text-sm text-text-secondary">I'll go with a friend.</p>
    </div>
  );
}

type Variant = {
  id: string;
  label: string;
  modelledOn: string;
  pitch: string;
  cost: string;
  risk: string;
  render: () => ReactNode;
};

function variants(rerenderKey: number, bump: () => void): Variant[] {
  const stage = (step: LessonStep) => (
    <LazyStage>
      <StepRenderer
        step={{ ...step, id: `${step.id}-r${rerenderKey}` } as LessonStep}
        onComplete={() => {}}
        onContinue={bump}
      />
    </LazyStage>
  );

  return [
    {
      id: "a-silent",
      label: "A · Nothing at all (what ships today)",
      modelledOn: "Duolingo — silent unlock by unit, no announcement",
      pitch:
        "The kanji just appears. Kept first as the baseline to judge the rest against — and it is genuinely defensible if you believe exposure alone does the work.",
      cost: "Already built. Zero.",
      risk:
        "This is the ONE approach with direct negative learner evidence: the Duolingo complaint is not that kanji is hard, it is that the swap is silent and inconsistent. And the literature says form-binding is a distinct lexical event, not a by-product of knowing the word.",
      render: () => <SilentSwap />,
    },
    {
      id: "b-grammar-rule",
      label: "B · Reveal card, hosted on `grammar_rule` (no new step type)",
      modelledOn: "Genki — state the rule, show examples",
      pitch:
        "The cheapest thing that is not nothing. `grammar_rule` already renders title + rule + examples through StepRenderer, so this ships with zero engine work — only authoring.",
      cost: "No new step type. Content-only.",
      risk:
        "It reads as a grammar lesson, not a word getting a face. The card is prose-heavy where the whole point is a single visual substitution, and `grammar_rule` has no slot for the kana→kanji pivot.",
      render: () =>
        stage({
          id: "ksv-b",
          type: "grammar_rule",
          title: "ともだち is written 友達",
          rule: "You have been saying this word since module 3. Here is how it is written — 友 is the character for friend.",
          examples: [
            { ja: "友達といきます", romaji: "tomodachi to ikimasu", en: "I'll go with a friend." },
            { ja: "友達がいます", romaji: "tomodachi ga imasu", en: "I have a friend." },
          ],
        } as LessonStep),
    },
    {
      id: "c-composition",
      label: "C · Composition reveal + immediate graded read",
      modelledOn: "WaniKani — components carry meaning, then the vocab item",
      pitch:
        "Break the word into glyphs that mean something, then grade it immediately. Teach → retrieve, which is the shape the literature supports (by extrapolation from Chinese, stated honestly).",
      cost: "New `kanji_reveal` step type + renderer. Component glosses must be authored per word (~112).",
      risk:
        "Component glosses are only honest for SOME words. 友 = friend is clean; 達 is a pluralising suffix with no useful standalone sense, and forcing a gloss on it teaches folk etymology.",
      render: () => (
        <div className="space-y-3">
          <RevealCard
            kana="ともだち"
            kanji="友達"
            gloss="friend"
            parts={[
              { glyph: "友", sense: "friend" },
              { glyph: "達", sense: "(plural)" },
            ]}
          />
          {stage(
            readingStep("ksv-c", "友達", "ともだち", "friend", [
              "かぞく",
              "せんせい",
              "がくせい",
            ]),
          )}
        </div>
      ),
    },
    {
      id: "d-bare-mcq",
      label: "D · No reveal — straight to a graded read",
      modelledOn: "jpdb / Anki Kaishi — kanji is subordinate to vocab, no ceremony",
      pitch:
        "Skip the card entirely. The word is known; show the form and ask which word it is. One step, no new step type, and it is the only variant here that any surveyed tool actually does.",
      cost: "Zero engine work — `kanji_reading` already exists and already renders.",
      risk:
        "At FIRST sight this is a cold guess with no teaching in front of it. Fine as a pretest (variant E uses it that way), but as the whole beat it grades something never taught.",
      render: () => stage(DEMO_STEPS.bareRead),
    },
    {
      id: "e-hybrid",
      label: "E · Pretest → reveal → graded  (the hybrid, compounds only)",
      modelledOn: "Errorful generation + WaniKani composition, on our own hybrid rule",
      pitch:
        "Guess FIRST, then reveal. Only used where every component glyph is already taught, so the learner can actually reason: 明 bright + 日 day → tomorrow. For atom words like 猫 it degrades to variant C's straight reveal.",
      cost: "New step type + the compound/atom split (mechanical — derived from component unlock modules, not authored).",
      risk:
        "Two steps per word on top of the reveal is the heaviest option. And a failed pretest right before the answer can read as a gotcha if the wording is not careful.",
      render: () => (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted">
            Step 1 — cold, before anything is shown:
          </p>
          {stage(DEMO_STEPS.pretest)}
          <p className="text-xs font-semibold text-text-muted">
            Step 2 — the reveal, whether they got it or not:
          </p>
          <RevealCard
            kana="あした"
            kanji="明日"
            gloss="tomorrow"
            parts={[
              { glyph: "明", sense: "bright" },
              { glyph: "日", sense: "day / sun" },
            ]}
            goingForward={{
              segments: [
                { surface: "明日", reading: "あした" },
                { surface: "いきます", reading: "いきます" },
              ],
              en: "I'll go tomorrow.",
            }}
            ruleLine="Furigana stays on this word until you have it down."
          />
        </div>
      ),
    },
    {
      id: "g-attempt-first",
      label: "G · Graded attempt FIRST, reveal as its feedback  ⭐ survives review",
      modelledOn:
        "Pretesting / errorful generation (Kornell 2009; Richland 2009) + both learner sims",
      pitch:
        "The only variant here that survived simulation and the literature together. The learner's first contact is a GRADED guess they cannot skip; the reveal is then the answer screen, read because they just committed and want to know if they were right. Two steps, not three.",
      cost: "New `kanji_reveal` step type, but as a FEEDBACK panel on kanji_reading rather than a standalone card. Fits capacity: 112×2 = 224 slots vs 294 hostable m8+ lessons.",
      risk:
        "The attempt is a cold guess by construction, so most learners get it wrong the first time — that is the mechanism, not a bug, but the copy has to make it feel like a reveal rather than a failure.",
      render: () => (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted">
            Step 1 — graded, cold, and no gloss (it would give the answer away):
          </p>
          {stage(DEMO_STEPS.coldAttempt)}
          <p className="text-xs font-semibold text-text-muted">
            Step 2 — the same screen’s feedback, not a separate card:
          </p>
          <RevealCard
            kana="ともだち"
            kanji="友達"
            gloss="friend"
            parts={[
              { glyph: "友", sense: "friend" },
              { glyph: "達", sense: "(plural)" },
            ]}
            goingForward={{
              segments: [
                { surface: "友達", reading: "ともだち" },
                { surface: "と", reading: "と" },
                { surface: "いきます", reading: "いきます" },
              ],
              en: "I'll go with a friend.",
            }}
            ruleLine="Furigana stays on this word until you have it down."
          />
        </div>
      ),
    },
    {
      id: "f-one-of-four",
      label: "F · No beat — the kanji is just one of the four options",
      modelledOn: "Renshuu — furigana/known-state is the only lever, folded into review",
      pitch:
        "Spencer's branch 2. No dedicated beat at all: the written form turns up as the CORRECT option inside an ordinary review-tail step, so exposure happens before the switch without spending a step on it.",
      cost: "Zero new step types. Slots into `buildReviewTailSteps`, which is already per-learner.",
      risk:
        "Hard constraint: 友達 must be the RIGHT answer here, never a distractor — offering it as a wrong option trains the learner that the kanji form is incorrect. Distractors must be other words' kanji.",
      render: () => stage(DEMO_STEPS.oneOfFour),
    },
  ];
}

export default function KanjiSwitchoverVariantsPage() {
  const [notes, setNotes] = useState<Notes>(() => loadNotes());
  const [keys, setKeys] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      /* private mode — verdicts just don't persist */
    }
  }, [notes]);

  const bump = (id: string) =>
    setKeys((k) => ({ ...k, [id]: (k[id] ?? 0) + 1 }));
  const set = (id: string, patch: Partial<Note>) =>
    setNotes((n) => {
      const prev: Note = n[id] ?? { verdict: "", text: "" };
      return { ...n, [id]: { ...prev, ...patch } };
    });

  const list = useMemo(() => variants(0, () => {}), []);

  const exportMd = () => {
    const lines = ["# Kanji switchover — verdicts", ""];
    for (const v of list) {
      const n = notes[v.id];
      if (!n?.verdict && !n?.text) continue;
      lines.push(`## ${v.label}`);
      lines.push(`- verdict: ${n?.verdict || "(none)"}`);
      if (n?.text) lines.push(`- note: ${n.text}`);
      lines.push("");
    }
    void navigator.clipboard?.writeText(lines.join("\n"));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link to="/ja/qa" className="text-xs text-text-muted hover:underline">
          ← back to QA test drive
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Kana → kanji switchover — pick one
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          The learner has known ともだち by sound and meaning for sixteen
          modules. Only the written form 友達 is new. Each card below is a
          different answer to “what marks that moment?”, and each names the tool
          it is modelled on — no surveyed product does this outright, so these
          are their near-misses adapted.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          Scope, measured: <strong>112 switchover events</strong> across the
          course, median gap <strong>11 modules</strong> between the word being
          taught and its kanji appearing. <strong>90 are never graded</strong> by
          anything and <strong>zero</strong> are graded in the unlock window — so
          today’s behaviour is variant A. Full write-up in{" "}
          <code>docs/kanji-switchover-design-2026-07-28.md</code>.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          Graded steps are the real <code>StepRenderer</code>. Reveal cards are
          mockups — no step type hosts them yet, which is what this page is for.
        </p>
        <p className="mt-3 rounded-lg border border-green-500/40 bg-green-500/5 px-3 py-2 text-xs leading-relaxed">
          <strong>Decided 2026-07-29 — variant C</strong>, restructured to two
          steps: one animated reveal, then a graded sentence question. Which
          animation is still open →{" "}
          <Link
            to="/ja/qa/kanji-reveal"
            className="font-semibold text-sky-500 hover:underline"
          >
            the animation bake-off
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={exportMd}
          className="mt-3 rounded border border-border bg-surface px-3 py-1 text-xs font-semibold hover:bg-surface-muted"
        >
          Copy verdicts as markdown
        </button>
      </div>

      <div className="space-y-8">
        {list.map((v) => {
          const n = notes[v.id] ?? { verdict: "" as Verdict, text: "" };
          // Rebuild only this variant, keyed on its own replay counter, so
          // one card's ↻ doesn't remount the other five.
          const live = variants(keys[v.id] ?? 0, () => bump(v.id)).find(
            (x) => x.id === v.id,
          )!;
          return (
            <section
              key={v.id}
              className="rounded-xl border border-border bg-surface-muted/40 p-4"
            >
              <h2 className="text-sm font-bold">{v.label}</h2>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                modelled on · {v.modelledOn}
              </p>
              <p className="mb-2 text-xs leading-relaxed text-text-secondary">
                {v.pitch}
              </p>
              <p className="mb-1 text-xs leading-relaxed text-text-muted">
                <span className="font-semibold">Cost:</span> {v.cost}
              </p>
              <p className="mb-3 text-xs leading-relaxed text-text-muted">
                <span className="font-semibold">Watch out:</span> {v.risk}
              </p>

              <div
                key={keys[v.id] ?? 0}
                className="rounded-lg border border-dashed border-border/60 bg-background px-3 py-4"
              >
                {live.render()}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {VERDICTS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() =>
                      set(v.id, {
                        verdict: n.verdict === d.key ? "" : d.key,
                      })
                    }
                    className={`rounded border px-3 py-1 text-xs font-semibold ${
                      n.verdict === d.key
                        ? d.cls
                        : "border-border bg-surface hover:bg-surface-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => bump(v.id)}
                  className="rounded border border-border bg-surface px-3 py-1 text-xs hover:bg-surface-muted"
                >
                  ↻ replay
                </button>
              </div>

              <textarea
                value={n.text}
                onChange={(e) => set(v.id, { text: e.target.value })}
                placeholder="What's wrong with it / what would fix it…"
                className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs"
                rows={2}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
