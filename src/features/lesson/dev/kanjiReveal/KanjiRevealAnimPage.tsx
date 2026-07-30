import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { StepRenderer } from "../../components/StepRenderer";
import { REVEAL_CANDIDATES, SentenceSwapIntro } from "./revealAnimations";
import { BEAT_WORDS, kanjiClozeStep, sentenceStep } from "./revealWords";
import { hasShareGlyphOption } from "@/features/languages/ja/secondScript/kanjiDistractorPool";

/**
 * DEV · Kana→kanji reveal — animation bake-off for step 1 of the beat.
 * Route: `/:lang/qa/kanji-reveal`. (B061)
 *
 * Spencer, 2026-07-29, choosing among the variants on `/qa/kanji-switchover`:
 *
 *   "for kanji, I think we go with C, and then make it one step, kind of
 *    animated look into css js fun stuff there, and then we ask them a sentence
 *    example right after. It would come out to being 2 steps, get some good
 *    ideas there, test a few animations, see what can work based on how reviews
 *    seed"
 *
 * So the beat is settled at TWO steps — animated reveal, then a graded sentence
 * question — and what is open is which animation. This page is that comparison:
 * six candidates over three word shapes, each with the cost and the risk stated,
 * plus the beat played end to end so the reveal can be judged in the position it
 * will actually occupy.
 *
 * The step-2 question renders through the real `StepRenderer`. The reveals are
 * real too — `kanji.json` (147 KanjiVG glyphs) was built for this, so the
 * stroke-draw candidates are live data, not mockups. What is NOT built is a
 * `kanji_reveal` step type to host any of them; picking one is the point.
 *
 * Note on order: this is variant C (reveal, then retrieve), which is the
 * OPPOSITE of what the research pass recommended — see
 * `docs/kanji-switchover-distributed-spec-2026-07-28.md` §7a, where pretesting
 * evidence favoured a graded attempt first with the reveal as its feedback. That
 * disagreement is Spencer's call and is recorded here rather than silently
 * resolved; the §6c risk it inherits (learners tap past ungraded cards) is what
 * the `gates continue` column is about.
 */

const STORAGE_KEY = "lingo:kanji-reveal-anim:v1";

type Verdict = "" | "pick" | "maybe" | "no";
type Note = { verdict: Verdict; text: string };
type Notes = Record<string, Note>;

const VERDICTS: { key: Exclude<Verdict, "">; label: string; cls: string }[] = [
  { key: "pick", label: "✓ ship this", cls: "border-green-500 bg-green-500/15" },
  { key: "maybe", label: "~ maybe", cls: "border-amber-500 bg-amber-500/15" },
  { key: "no", label: "✗ no", cls: "border-red-500 bg-red-500/15" },
];

/**
 * Holds a candidate unmounted until it is actually on screen, then mounts it —
 * which starts its animation, because every candidate begins at phase 0 on
 * mount.
 *
 * Without this the page is useless: six candidates all fire during page load,
 * so by the time you have read the header and scrolled to them every animation
 * has finished and you are looking at six static end-frames. The only motion
 * happened off-screen. (Same fix as `LazyStage` on the switchover page, for the
 * same reason.)
 *
 * `rootMargin` is 0px on purpose, unlike LazyStage's 200px pre-mount: pre-loading
 * just outside the viewport is right for an expensive `StepRenderer` and wrong
 * for an animation, because it would replay the bug in miniature.
 */
function PlayWhenVisible({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setSeen(true);
      },
      { rootMargin: "0px", threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [seen]);
  return (
    <div ref={ref} style={{ minHeight: 210 }}>
      {seen ? children : null}
    </div>
  );
}

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

export default function KanjiRevealAnimPage() {
  const [wordIdx, setWordIdx] = useState(0);
  const [notes, setNotes] = useState<Notes>(() => loadNotes());
  const [replay, setReplay] = useState<Record<string, number>>({});
  const [furiganaOn, setFuriganaOn] = useState(false);
  // Step 2 shape: pick the English meaning, or fill the blank with the right
  // kanji tile. Spencer 2026-07-29 asked for the cloze; both are kept so the
  // MCQ stays available as the below-m9 fallback (see `kanjiClozeStep`).
  const [step2Mode, setStep2Mode] = useState<"mcq" | "cloze">("cloze");
  const [shareGlyph, setShareGlyph] = useState(false);

  // The end-to-end run: which candidate drives step 1, and whether its reveal
  // has finished (i.e. whether Continue is allowed to light up).
  const [beatCandidate, setBeatCandidate] = useState(REVEAL_CANDIDATES[0].id);
  const [beatStep, setBeatStep] = useState<1 | 2>(1);
  const [revealDone, setRevealDone] = useState(false);
  const [beatRun, setBeatRun] = useState(0);
  // Step 2 opens with the in-place sentence swap, then hands off to the real
  // graded step. `swapDone` is that handoff.
  const [swapDone, setSwapDone] = useState(false);
  // Off by default now that cloze is the default step-2 mode — see the mode
  // selector for why the two do not combine.
  const [swapIntro, setSwapIntro] = useState(false);

  const word = BEAT_WORDS[wordIdx];
  // Hard mode needs another shape-matched real word sharing one of the
  // answer's glyphs. 明日 has several (日 is productive); 友達 and 猫 have
  // none. Ask rather than request-and-silently-get-the-easy-bank.
  const hardAvailable = hasShareGlyphOption(word.kanji, word.kana);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      /* private mode — verdicts just don't persist */
    }
  }, [notes]);

  const bump = (id: string) =>
    setReplay((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));
  const set = (id: string, patch: Partial<Note>) =>
    setNotes((n) => ({ ...n, [id]: { ...(n[id] ?? { verdict: "", text: "" }), ...patch } }));

  const restartBeat = () => {
    setBeatStep(1);
    setRevealDone(false);
    setSwapDone(false);
    setBeatRun((r) => r + 1);
  };

  const exportMd = () => {
    const lines = ["# Kanji reveal animation — verdicts", ""];
    for (const c of REVEAL_CANDIDATES) {
      const n = notes[c.id];
      if (!n?.verdict && !n?.text) continue;
      lines.push(`## ${c.label}`);
      lines.push(`- verdict: ${n?.verdict || "(none)"}`);
      if (n?.text) lines.push(`- note: ${n.text}`);
      lines.push("");
    }
    void navigator.clipboard?.writeText(lines.join("\n"));
  };

  const Beat = REVEAL_CANDIDATES.find((c) => c.id === beatCandidate)!.Component;

  return (
    // Pinned to the module where THIS word's kanji unlocks. Without it the page
    // renders outside any lesson, `useLessonModuleIndex()` is null, and the
    // romaji ladder falls back to stored settings — which puts romaji ruby over
    // the kana sentences, a thing that cannot happen at m19 (romaji dies at m7).
    // This is the leak LessonModuleProvider was added for.
    <LessonModuleProvider moduleIndex={word.kanjiModule}>
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link to="/ja/qa/kanji-switchover" className="text-xs text-text-muted hover:underline">
          ← back to the switchover variants
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Kana → kanji reveal — animation bake-off
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Variant C is picked, at two steps: <strong>an animated reveal</strong>,
          then <strong>a graded sentence question</strong>. Six candidates for the
          reveal below. The rule they are judged by is whether the{" "}
          <em>motion itself</em> carries information — if the still end-frame
          would teach the same thing, the animation is decoration, and candidate
          5 is the control that proves it.
        </p>
      </div>

      {/* ── word switcher ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Word shape — a candidate that only works on one of these is not viable
        </p>
        <div className="flex flex-wrap gap-2">
          {BEAT_WORDS.map((w, i) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setWordIdx(i);
                restartBeat();
              }}
              className={`rounded border px-3 py-2 text-left text-xs ${
                i === wordIdx
                  ? "border-sky-500 bg-sky-500/15"
                  : "border-border bg-background hover:bg-surface-muted"
              }`}
            >
              <div className="text-base font-semibold">
                {w.kanji} <span className="text-text-muted">· {w.kana}</span>
              </div>
              <div className="text-text-muted">
                {w.gloss} — taught m{w.taughtModule}, kanji m{w.kanjiModule} (gap{" "}
                {w.kanjiModule - w.taughtModule})
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── the beat, end to end ──────────────────────────────────────── */}
      <div className="mb-8 rounded-xl border-2 border-sky-500/40 bg-surface p-4">
        <h2 className="text-sm font-bold">The beat, end to end</h2>
        <p className="mb-3 text-xs leading-relaxed text-text-secondary">
          Two steps, in the order they would ship. Continue on step 1 stays
          disabled until the reveal finishes — that is the cheapest available
          answer to the simulation finding that learners tap straight past an
          ungraded card, and it costs no extra step.
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={beatCandidate}
            onChange={(e) => {
              setBeatCandidate(e.target.value);
              restartBeat();
            }}
            className="max-w-full flex-shrink truncate rounded border border-border bg-background px-2 py-1 text-xs"
          >
            {REVEAL_CANDIDATES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={restartBeat}
            className="rounded border border-border bg-surface px-3 py-1 text-xs hover:bg-surface-muted"
          >
            ↻ run the beat
          </button>
          <select
            value={step2Mode}
            onChange={(e) => {
              const mode = e.target.value as "mcq" | "cloze";
              setStep2Mode(mode);
              // The swap intro ends on the sentence WITH 友達 in it. In MCQ mode
              // that only weakens the step; in cloze mode it prints the answer
              // and then immediately blanks it out and asks for it, which is
              // incoherent rather than merely easy. Default it off here — still
              // toggleable, because seeing the two together is instructive.
              if (mode === "cloze") setSwapIntro(false);
              restartBeat();
            }}
            className="max-w-full flex-shrink truncate rounded border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="cloze">step 2: kanji cloze (pick the tile)</option>
            <option value="mcq">step 2: English meaning MCQ</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={swapIntro}
              onChange={(e) => {
                setSwapIntro(e.target.checked);
                restartBeat();
              }}
            />
            step 2 opens with the in-place swap
            {step2Mode === "cloze" && (
              <span className="text-warning"> — shows the answer, then asks for it</span>
            )}
          </label>
          {step2Mode === "cloze" && (
            <label
              className={`flex items-center gap-1.5 text-xs ${hardAvailable ? "text-text-muted" : "text-text-muted/50"}`}
              title={
                hardAvailable
                  ? "Distractors share a glyph with the answer — forces reading the whole word"
                  : `No shape-matched word shares a glyph with ${word.kanji}, so hard mode is not available for it`
              }
            >
              <input
                type="checkbox"
                disabled={!hardAvailable}
                checked={shareGlyph && hardAvailable}
                onChange={(e) => {
                  setShareGlyph(e.target.checked);
                  restartBeat();
                }}
              />
              hard: distractors share a glyph
              {!hardAvailable && " — n/a for this word"}
            </label>
          )}
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={furiganaOn}
              onChange={(e) => {
                setFuriganaOn(e.target.checked);
                restartBeat();
              }}
            />
            step 2 keeps furigana on
            {step2Mode === "cloze" && " (MCQ mode only)"}
          </label>
        </div>

        <div className="rounded-lg border border-dashed border-border/60 bg-background p-4">
          {beatStep === 1 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Step 1 · reveal (ungraded)
              </p>
              <Beat
                key={`beat-${beatCandidate}-${word.id}-${beatRun}`}
                word={word}
                replayKey={beatRun}
                onDone={() => setRevealDone(true)}
              />
              <button
                type="button"
                disabled={!revealDone}
                onClick={() => setBeatStep(2)}
                className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold ${
                  revealDone
                    ? "bg-sky-500 text-white hover:bg-sky-600"
                    : "cursor-not-allowed bg-surface-muted text-text-muted"
                }`}
              >
                {revealDone ? "Continue" : "…"}
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Step 2 · the sentence question (graded){" "}
                {step2Mode === "cloze"
                  ? "· kanji cloze"
                  : furiganaOn
                    ? "· furigana ON"
                    : "· furigana OFF on the switched word"}
              </p>
              {swapIntro && !swapDone ? (
                <SentenceSwapIntro
                  key={`swap-${word.id}-${furiganaOn}-${beatRun}`}
                  word={word}
                  replayKey={beatRun}
                  furiganaOn={furiganaOn}
                  onDone={() => setSwapDone(true)}
                />
              ) : (
                <StepRenderer
                  key={`beat-s2-${step2Mode}-${word.id}-${furiganaOn}-${beatRun}`}
                  step={
                    step2Mode === "cloze"
                      ? kanjiClozeStep(word, { shareGlyph: shareGlyph && hardAvailable })
                      : sentenceStep(word, furiganaOn)
                  }
                  onComplete={() => {}}
                  onContinue={restartBeat}
                />
              )}
              {step2Mode === "cloze" ? (
                <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-text-muted">
                  <p>
                    Hosted on <code>fill_blank</code> — the step type CLAUDE.md
                    lists as unused with a standing “adopt or retire” decision.
                    The tiles have their reading helper suppressed
                    (<code>wordBankHideHelper</code>); left on, the bank reads
                    ともだち / かぞく / せんせい / がくせい and no kanji gets read.
                  </p>
                  <p>
                    The English cue is <strong>load-bearing, not decoration</strong>:
                    “___ といきます” is satisfied by friend, family, teacher{" "}
                    <em>and</em> student, so without it the step has no answer.
                  </p>
                  <p>
                    Distractors are <strong>shape-matched real words</strong> drawn
                    from the course registry — same glyph count, pure kanji, and
                    they MAY use kanji the learner has never met (166 two-glyph and
                    138 one-glyph candidates). Being unknown makes the step{" "}
                    <em>easier</em>, not harder: the learner wins by recognising the
                    one word they know rather than by discriminating. That is still
                    the switchover skill, just not a reading test.
                  </p>
                  <p>
                    <span className="font-semibold">{word.kanji}</span> is only ever
                    the CORRECT tile. Distractors are other words’ kanji — offering
                    a known word’s own kanji as wrong would teach that its written
                    form is incorrect.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
                  Every wrong option differs from the right one at{" "}
                  <strong>exactly the switched word</strong> — same verb, same
                  particle. That is deliberate: vary anything else and the step is
                  solvable by elimination without reading{" "}
                  <span className="font-semibold">{word.kanji}</span> at all, which
                  is the defect §6f of the spec found.
                </p>
              )}
              {swapIntro && (
              <p className="mt-2 rounded border border-amber-500/40 bg-amber-500/5 px-2 py-1.5 text-[11px] leading-relaxed text-text-secondary">
                <strong>The trade this makes:</strong> opening with the swap shows
                the kana sentence first, so the learner can read the answer before
                the kanji ever appears. That turns step 2 from a cold reading test
                into a “can you still parse it now that it looks like this?”
                check. Both are defensible — the swap is not. Toggle it off to feel
                the difference.
              </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold">The six candidates</h2>
        <button
          type="button"
          onClick={exportMd}
          className="rounded border border-border bg-surface px-3 py-1 text-xs font-semibold hover:bg-surface-muted"
        >
          Copy verdicts as markdown
        </button>
      </div>

      <div className="space-y-6">
        {REVEAL_CANDIDATES.map((c) => {
          const n = notes[c.id] ?? { verdict: "" as Verdict, text: "" };
          const Comp = c.Component;
          const rk = replay[c.id] ?? 0;
          return (
            <section
              key={c.id}
              className="rounded-xl border border-border bg-surface-muted/40 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-bold">{c.label}</h3>
                <span className="text-[11px] font-semibold text-text-muted">
                  ~{(c.approxMs / 1000).toFixed(1)}s
                </span>
              </div>
              <p className="mt-1 mb-2 text-xs leading-relaxed text-text-secondary">
                <span className="font-semibold">The motion carries:</span>{" "}
                {c.motionCarries}
              </p>
              <p className="mb-1 text-xs leading-relaxed text-text-muted">
                <span className="font-semibold">Cost:</span> {c.cost}
              </p>
              <p className="mb-3 text-xs leading-relaxed text-text-muted">
                <span className="font-semibold">Watch out:</span> {c.risk}
              </p>

              <div className="rounded-lg border border-dashed border-border/60 bg-background px-3 py-4">
                <PlayWhenVisible key={`${c.id}-${word.id}-${rk}`}>
                  <Comp word={word} replayKey={rk} />
                </PlayWhenVisible>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {VERDICTS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() =>
                      set(c.id, { verdict: n.verdict === d.key ? "" : d.key })
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
                  onClick={() => bump(c.id)}
                  className="rounded border border-border bg-surface px-3 py-1 text-xs hover:bg-surface-muted"
                >
                  ↻ replay
                </button>
              </div>

              <textarea
                value={n.text}
                onChange={(e) => set(c.id, { text: e.target.value })}
                placeholder="What's wrong with it / what would fix it…"
                className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs"
                rows={2}
              />
            </section>
          );
        })}
      </div>

      {/* ── the seeding question ──────────────────────────────────────── */}
      <div className="mt-10 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
        <h2 className="text-sm font-bold">
          “see what can work based on how reviews seed” — where the beat can live
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
          Measured, not assumed. The earlier plan was to lengthen review tails;
          that host <strong>does not exist where kanji does</strong> —{" "}
          <code>augmentWithReviewTail</code> gates on <code>ALL_ROWS</code>
          (kana rows only), so 0 of 294 m8+ lessons carry a tail. Two hosts
          remain, and they answer to different constraints:
        </p>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-text-secondary">
          <li>
            <strong>The 44 derived review lessons</strong> (
            <code>ja-mN-review-1/2</code>, built by{" "}
            <code>buildSrsReviewLesson</code>, 2 per module m8–m29). Already
            per-learner and already reads FSRS state, so a switchover trigger is
            a natural fit — it picks up to <code>MAX_ATOMS = 18</code> due/new
            atoms and composes steps from them. Two beat steps is roughly one
            atom's worth of slot. This is the only host that can react to “the
            learner actually knows this word now”.
          </li>
          <li>
            <strong>The 294 ordinary m8+ lessons</strong>, statically authored.
            112 words × 2 steps = 224 slots against 294 lessons ={" "}
            <strong>0.76 per lesson</strong>, which fits — but a static host
            cannot know the learner's SRS state, so the trigger degrades to “the
            module was reached”. Cheaper and duller.
          </li>
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
          One hard constraint on the dynamic route:{" "}
          <code>buildSrsReviewLesson</code> is <strong>pure</strong> — it must
          never write state at build time (that bug once seeded every unlocked
          atom due-today on any course-deck build). So the latch that marks a
          word switched has to be written on <em>completion</em>, in{" "}
          <code>LessonPage</code>, alongside the existing grade writes — not
          while the lesson is being constructed.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          Still open regardless of which animation wins, all three from §6d/§6f
          of the spec: the 14-day interval trigger reads as unfair when intervals
          oscillate; the latch is invisible and irreversible off one correct
          answer; and B064 — furigana comes off at unlock+2 on the basis of{" "}
          <code>isMastered()</code>, which measures the spoken word, so there is
          no orthography modality for the beat to grade into.
        </p>
      </div>
    </div>
    </LessonModuleProvider>
  );
}
