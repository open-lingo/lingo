import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { StepRenderer } from "../components/StepRenderer";
import type { LessonStep } from "../types";

/**
 * Mount children only once scrolled near the viewport. Without this every
 * fixture mounts at page load and ~5 step views autoplay TTS on top of
 * each other — a cacophony that reads as "audio is broken".
 */
function LazyStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true);
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);
  return <div ref={ref}>{inView ? children : <div className="h-24" />}</div>;
}

type Fixture = {
  type: LessonStep["type"];
  title: string;
  whenToUse: string;
  step: LessonStep;
};

// Exported for the coverage test: every StepType must have a fixture or
// the QA page's "fixture" links become silent dead anchors.
export function fixtures(): Fixture[] {
  return [
    {
      type: "info",
      title: "info",
      whenToUse:
        "Bookend chrome only. Open-frame at lesson start, close-payoff at end. Never to extend a thin lesson — info should never carry exam load.",
      step: {
        id: "preview-info",
        type: "info",
        title: "Voiced sounds — dakuten",
        body: "Two strokes (゛) flip a voiceless sound to its voiced pair: か → が. Same shape, different breath.",
        variant: "grammar",
      },
    },
    {
      type: "multiple_choice",
      title: "multiple_choice",
      whenToUse:
        "Discrimination drill. M2 uses it for 'k → g' contrast (which voiced pair?). M3+ uses it for grammar discrimination. Hide romaji on test cards.",
      step: {
        id: "preview-mc",
        type: "multiple_choice",
        prompt: "Which one means 'student'?",
        options: [
          { id: "a", text: "せんせい" },
          { id: "b", text: "がくせい" },
          { id: "c", text: "なまえ" },
          { id: "d", text: "にほんじん" },
        ],
        correctOptionId: "b",
        explanation: "がくせい = student. せんせい = teacher (easy to confuse).",
      },
    },
    {
      type: "build_sentence",
      title: "build_sentence",
      whenToUse:
        "Tile-based production. Granularity 'word' for sentences (M3+). Granularity 'character' for words (M1/M2 — small kana glue automatically).",
      step: {
        id: "preview-build",
        type: "build_sentence",
        prompt: "Build: 'I am a student.'",
        targetSentence: "わたしは がくせいです",
        tiles: ["わたしは", "がくせいです", "せんせいです", "なまえは"],
        correctOrder: ["わたしは", "がくせいです"],
        granularity: "word",
      },
    },
    {
      type: "match_pairs",
      title: "match_pairs",
      whenToUse:
        "Cumulative recall. 4-6 pairs. Columns shuffle independently per step.id. Set playAudioOnSelect=true to play the source-side TTS on tap (M2 dakuten/yōon: romaji on right, kana on left with audio).",
      step: {
        id: "preview-match",
        type: "match_pairs",
        prompt: "Match the kana to their sounds",
        playAudioOnSelect: true,
        pairs: [
          { id: "p1", source: "が", target: "ga" },
          { id: "p2", source: "ぎ", target: "gi" },
          { id: "p3", source: "ぐ", target: "gu" },
          { id: "p4", source: "げ", target: "ge" },
        ],
      },
    },
    {
      type: "fill_blank",
      title: "fill_blank",
      whenToUse:
        "Cloze with word-bank tiles. Less surgical than particle_cloze (which is purpose-built for 1-char particles).",
      step: {
        id: "preview-fb",
        type: "fill_blank",
        sentence: "わたし___がくせいです。",
        blanks: [{ id: "b1", correctAnswer: "は" }],
        wordBank: ["は", "が", "を", "に"],
      },
    },
    {
      type: "translate",
      title: "translate",
      whenToUse:
        "Free-form production. Ships from M11 (negation) through M27. Live romaji→kana IME typing (wanakana) with submit-time grading; acceptedAnswers + rule-safe variant expansion (topic drop, pronoun swap, です drop, punctuation).",
      step: {
        id: "preview-translate",
        type: "translate",
        sourceText: "I am a teacher.",
        sourceLanguage: "native",
        acceptedAnswers: ["わたしはせんせいです", "わたしは せんせいです"],
      },
    },
    {
      type: "listening_comprehension",
      title: "listening_comprehension",
      whenToUse:
        "Hear → pick meaning (English options). Distinct from listening_build (hear → assemble tiles). One per row in M1 ka-2/3.",
      step: {
        id: "preview-lc",
        type: "listening_comprehension",
        audioKey: "がくせい",
        transcript: "がくせい",
        romaji: "gakusei",
        question: "What did you hear?",
        options: [
          { id: "a", text: "student" },
          { id: "b", text: "teacher" },
          { id: "c", text: "name" },
          { id: "d", text: "Japanese person" },
        ],
        correctOptionId: "a",
      },
    },
    {
      type: "listening_build",
      title: "listening_build",
      whenToUse:
        "Hear → assemble tiles. M1/M2 use character granularity (small kana glued); M3+ use word granularity.",
      step: {
        id: "preview-lb",
        type: "listening_build",
        audioKey: "じゅう",
        prompt: "Listen and build the word for ten",
        targetSentence: "じゅう",
        tiles: ["じゅ", "う", "じゃ", "じょ", "じ"],
        correctOrder: ["じゅ", "う"],
        granularity: "character",
      },
    },
    {
      type: "speaking",
      title: "speaking",
      whenToUse:
        "Whisper-small STT (English-suppressed, mora-based threshold). Add 1 per row's review sub-lesson (M1 ka-3 has 3). Stub=true keeps shape stable.",
      step: {
        id: "preview-speaking",
        type: "speaking",
        targetPhrase: "わたしは がくせいです",
        translation: "I am a student.",
        audioKey: "わたしはがくせいです",
        stubbed: true,
      },
    },
    {
      type: "symbol_intro",
      title: "symbol_intro",
      whenToUse:
        "First-encounter card for a kana. Use TWICE per new kana then move on. M2 currently skips this — Spencer flagged as a thinness gap.",
      step: {
        id: "preview-si",
        type: "symbol_intro",
        payload: {
          symbol: "が",
          romanization: "ga",
          ipa: "ɡa",
          hint: "か with two strokes — voiced (vibrating) k.",
          audioKey: "が",
          scriptId: "hiragana",
          hasStrokeOrder: true,
        },
      },
    },
    {
      type: "symbol_trace",
      title: "symbol_trace",
      whenToUse:
        "Hand-write the kana on canvas. minCorrectAttempts: 2 standard. M2 currently has ZERO trace steps for dakuten/yōon — biggest thinness gap.",
      step: {
        id: "preview-st",
        type: "symbol_trace",
        payload: {
          symbol: "が",
          romanization: "ga",
          ipa: "ɡa",
          hint: "Trace か, then add the two strokes top-right.",
          audioKey: "が",
          scriptId: "hiragana",
          hasStrokeOrder: true,
        },
        showGuide: true,
        minCorrectAttempts: 2,
      },
    },
    {
      type: "symbol_recognition",
      title: "symbol_recognition",
      whenToUse:
        "Hear sound → pick kana from grid. Easier direction (audio-to-shape). M2 leans heavily on this — fine, but pair with symbol_to_sound for the hard direction.",
      step: {
        id: "preview-sr",
        type: "symbol_recognition",
        payload: {
          symbol: "が",
          romanization: "ga",
          ipa: "ɡa",
          hint: "Voiced k.",
          audioKey: "が",
          scriptId: "hiragana",
        },
        options: [
          { id: "a", symbol: "が" },
          { id: "b", symbol: "か" },
          { id: "c", symbol: "ぎ" },
          { id: "d", symbol: "ご" },
        ],
        correctOptionId: "a",
      },
    },
    {
      type: "symbol_production",
      title: "symbol_production",
      whenToUse:
        "Sound only → write kana from memory (no guide). Sub-set of trace flow; reserve for review sub-lessons after the trace+recog cycle.",
      step: {
        id: "preview-sp",
        type: "symbol_production",
        payload: {
          symbol: "が",
          romanization: "ga",
          ipa: "ɡa",
          hint: "You heard 'ga' — write it.",
          audioKey: "が",
          scriptId: "hiragana",
          hasStrokeOrder: true,
        },
        minCorrectAttempts: 1,
      },
    },
    {
      type: "symbol_to_sound",
      title: "symbol_to_sound",
      whenToUse:
        "Hard direction (kana → pick romaji). Codified rule: this is the LAST step type in every M1 sub-lesson. M2 skips it entirely — major gap.",
      step: {
        id: "preview-s2s",
        type: "symbol_to_sound",
        payload: {
          symbol: "が",
          romanization: "ga",
          ipa: "ɡa",
          hint: "What sound is this?",
          audioKey: "が",
          scriptId: "hiragana",
        },
        options: [
          { id: "a", text: "ga", symbol: "が" },
          { id: "b", text: "ka", symbol: "か" },
          { id: "c", text: "gi", symbol: "ぎ" },
          { id: "d", text: "go", symbol: "ご" },
        ],
        correctOptionId: "a",
      },
    },
    {
      type: "word_image_mcq",
      title: "word_image_mcq",
      whenToUse:
        "First-encounter vocab via emoji semantic clue. 2×2 grid; tap each to preview audio. Emoji = primary cue, kana = the answer.",
      step: {
        id: "preview-wim",
        type: "word_image_mcq",
        meaningEn: "river",
        options: [
          { id: "a", word: "かわ", emoji: "🏞️" },
          { id: "b", word: "やま", emoji: "⛰️" },
          { id: "c", word: "き", emoji: "🌳" },
          { id: "d", word: "いけ", emoji: "💧" },
        ],
        correctOptionId: "a",
      },
    },
    {
      type: "phrase_card",
      title: "phrase_card",
      whenToUse:
        "Exposure-first phrase teaching (M3+). Meaning large, romaji medium, kana decoration, audio auto-plays. NO quiz — the learner reads, hears, continues. Use for survival phrases and grammar examples.",
      step: {
        id: "preview-phrase",
        type: "phrase_card",
        kana: "おはよう ございます",
        romaji: "ohayou gozaimasu",
        meaningEn: "Good morning",
        cultureNote: "Polite form — drop ございます with friends.",
      },
    },
    {
      type: "grammar_rule",
      title: "grammar_rule",
      whenToUse:
        "Tae Kim-style explicit teaching. Title + rule + 2 examples + optional anti-pattern. Pair with particle_cloze drill block after. M3+ only.",
      step: {
        id: "preview-grammar",
        type: "grammar_rule",
        title: "は — the topic marker",
        rule: "は marks the topic of the sentence — 'as for X'. It tells the listener what we're talking about, not who did what.",
        examples: [
          { ja: "わたしは がくせいです", romaji: "watashi wa gakusei desu", en: "As for me, I'm a student." },
          { ja: "これは ペンです", romaji: "kore wa pen desu", en: "As for this, it's a pen." },
        ],
        antiPattern: {
          ja: "わたしが がくせいです",
          romaji: "watashi ga gakusei desu",
          en: "*I'm the student. (Wrong nuance — implies 'I, specifically, am the student' as new info.)",
          why: "が introduces new info. Use は for topics already in mind.",
        },
        cultureNote: "Written as は but pronounced 'wa' when used as a particle.",
      },
    },
    {
      type: "particle_cloze",
      title: "particle_cloze",
      whenToUse:
        "Particle-only blank with 4 options. M3+ highest-leverage drill. Anti-pattern rules: max 2 consecutive same-answer; ≥3 distinct particles across a lesson; include 1 plausibly-right distractor.",
      step: {
        id: "preview-pc",
        type: "particle_cloze",
        prompt: { before: "これ", after: " ペンです。" },
        correctParticle: "は",
        options: ["は", "が", "を", "に"],
        meaningEn: "As for this, it's a pen.",
        audioText: "これはペンです",
        explanation: "は marks 'this' as the topic.",
      },
    },
    {
      type: "agreement_cloze",
      title: "agreement_cloze",
      whenToUse:
        "Multi-blank gender/number agreement (ES). Each blank is a small closed chip-set (o/a/os/as, el/la/los/las); the learner fills every blank and one Check grades the whole set — agreement is a sentence property, so no partial credit.",
      step: {
        id: "preview-ac",
        type: "agreement_cloze",
        segments: [
          {
            blank: {
              id: "b1",
              correctAnswer: "Las",
              options: ["El", "La", "Los", "Las"],
            },
          },
          { text: " cas" },
          {
            blank: {
              id: "b2",
              correctAnswer: "as",
              options: ["o", "a", "os", "as"],
            },
          },
          { text: " son blanc" },
          {
            blank: {
              id: "b3",
              correctAnswer: "as",
              options: ["o", "a", "os", "as"],
            },
          },
          { text: "." },
        ],
        meaningEn: "The houses are white.",
      },
    },
    {
      type: "self_explanation_mcq",
      title: "self_explanation_mcq",
      whenToUse:
        "Post-answer reflection: 'why was that right?'. Anchors on the fact just answered; options are typed rule/surface/distractor so wrong picks get differentiated feedback. Use sparingly after high-value grammar drills.",
      step: {
        id: "preview-sem",
        type: "self_explanation_mcq",
        anchor: {
          label: "You picked は in: わたし＿ がくせいです",
          audioText: "わたしは がくせいです",
        },
        question: "Why is は correct here?",
        options: [
          {
            id: "a",
            text: "It marks わたし as the topic — 'as for me'.",
            reasonType: "rule",
          },
          {
            id: "b",
            text: "It always comes after the first word.",
            reasonType: "surface",
          },
          {
            id: "c",
            text: "It makes the sentence past tense.",
            reasonType: "distractor",
          },
        ],
        correctOptionId: "a",
        ruleExplanation:
          "は marks the topic of the sentence — what we're talking about.",
      },
    },
    {
      type: "dialogue_listen",
      title: "dialogue_listen",
      whenToUse:
        "Audio-only multi-turn retrieval (M3+ dialogue closer). Plays 2-4 turns with gaps, then comprehension MCQs; transcript reveals after the first answer by default.",
      step: {
        id: "preview-dl",
        type: "dialogue_listen",
        lines: [
          { speaker: "Stranger", kana: "おげんきですか" },
          { speaker: "You", kana: "はい、げんきです" },
        ],
        questions: [
          {
            id: "q1",
            prompt: "What did the stranger ask?",
            options: [
              { id: "a", text: "How you are" },
              { id: "b", text: "Where you live" },
              { id: "c", text: "What your name is" },
            ],
            correctOptionId: "a",
          },
        ],
        transcriptRevealAfter: "first-answer",
      },
    },
    {
      type: "row_test",
      title: "row_test",
      whenToUse:
        "End-of-row test queue: mc / match / build items drawn from the full row. Missed items re-enter the queue (max 3 retries). 70% pass threshold. Owns the row-mastery dot.",
      step: {
        id: "preview-rt",
        type: "row_test",
        rowId: "preview-row",
        passThreshold: 0.7,
        maxRetries: 3,
        items: [
          {
            kind: "mc",
            payload: {
              id: "rt-mc-1",
              type: "multiple_choice",
              prompt: "Which kana is 'ga'?",
              options: [
                { id: "a", text: "が" },
                { id: "b", text: "か" },
                { id: "c", text: "ぎ" },
                { id: "d", text: "ご" },
              ],
              correctOptionId: "a",
            },
          },
          {
            kind: "match",
            payload: {
              id: "rt-match-1",
              type: "match_pairs",
              prompt: "Match",
              pairs: [
                { id: "rt-p1", source: "が", target: "ga" },
                { id: "rt-p2", source: "ぎ", target: "gi" },
                { id: "rt-p3", source: "ぐ", target: "gu" },
                { id: "rt-p4", source: "げ", target: "ge" },
              ],
            },
          },
        ],
      },
    },
  ];
}

export default function LessonStepPreviewPage() {
  const all = useMemo(fixtures, []);
  // Each fixture gets a render-key so "Reset" remounts the StepRenderer
  // (clears any post-Check state without contaminating siblings).
  const [keys, setKeys] = useState<Record<string, number>>({});

  // Scroll to `#step-<type>` ourselves: the page is a lazy route chunk, so
  // the browser's native anchor jump fires before the target exists. The
  // QA test-drive "fixture" links depend on this landing on the card.
  const { hash } = useLocation();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    if (!document.getElementById(id)) return;
    const scroll = () =>
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    scroll();
    // Lazy stages above the target mount + expand during the scroll and
    // shove it down — re-pin after layout settles.
    const t1 = setTimeout(scroll, 350);
    const t2 = setTimeout(scroll, 900);
    setHighlighted(id);
    const t3 = setTimeout(() => setHighlighted(null), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hash]);

  const bump = (id: string) =>
    setKeys((k) => ({ ...k, [id]: (k[id] ?? 0) + 1 }));

  return (
    // Same LangLayout gap as the QA page: dev routes get no app shell, so
    // paint the themed background here or dark themes are unreadable.
    <div className="min-h-screen bg-background text-text-primary">
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 border-b border-border pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
          DEV · Lesson step previewer
        </div>
        <h1 className="m-0 mt-1 text-2xl font-bold">All {all.length} lesson step types</h1>
        <p className="m-0 mt-2 text-sm text-text-secondary">
          One canonical example of every <code>LessonStep</code> type. Use this
          to hand-design new lessons by picking primitives. Each card renders
          via the same <code>StepRenderer</code> production lessons use, so
          what you see IS what M2/M3 will render.
        </p>
        <p className="m-0 mt-2 text-xs text-text-muted">
          Hit Reset on a card to clear post-Check state. <Link to="../learn" className="underline">Back to Learn</Link>
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
        <span className="font-semibold text-text-muted">Jump:</span>
        {all.map((f) => (
          <a
            key={f.type}
            href={`#step-${f.type}`}
            className="rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
          >
            {f.type}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {all.map((f) => (
          <section
            key={f.type}
            id={`step-${f.type}`}
            className={`rounded-xl border bg-surface p-4 shadow-sm scroll-mt-24 ${
              highlighted === `step-${f.type}`
                ? "border-accent ring-2 ring-accent/40"
                : "border-border"
            }`}
          >
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  {f.type}
                </div>
                <h2 className="m-0 text-lg font-semibold">{f.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => bump(f.type)}
                className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted"
              >
                Reset
              </button>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-text-secondary">
              {f.whenToUse}
            </p>
            <div
              key={keys[f.type] ?? 0}
              className="rounded-lg border border-dashed border-border/60 bg-background px-3 py-4"
            >
              <LazyStage>
                <StepRenderer
                  // Fresh id per Reset: audio autoplay + match shuffles
                  // dedupe on step id, so a fixed id makes Reset look
                  // like "audio broke" (once-per-session autoplay guard).
                  step={
                    {
                      ...f.step,
                      id: `${f.step.id}-r${keys[f.type] ?? 0}`,
                    } as LessonStep
                  }
                  onComplete={() => {}}
                  onContinue={() => bump(f.type)}
                />
              </LazyStage>
            </div>
          </section>
        ))}
      </div>
    </div>
    </div>
  );
}
