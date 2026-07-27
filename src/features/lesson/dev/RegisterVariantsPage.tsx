import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { StepRenderer } from "../components/StepRenderer";
import type { LessonStep } from "../types";

/**
 * DEV · Politeness-register step variants — a PICK-ONE gallery.
 *
 * Spencer 2026-07-27: "having to word a question saying 'you are talking to
 * this person' is bad, we need less narration, something they can figure with
 * pictures … or we preface it before hand in the lesson."
 *
 * Every card below is a different answer to that, rendered live through the
 * same `StepRenderer` production uses — so what you tap IS what m10 would
 * ship. Variant A is the narrated version we have today, kept first as the
 * baseline to judge the rest against.
 *
 * Context worth having while judging:
 *  - The learner already OWNS all three yes-words by m10 (はい and ええ from
 *    m7, うん from m3). This module is contrast-and-choose, not introduction.
 *  - Our cast is already 100% register-consistent across m6-m10 dialogues
 *    (83 lines, zero exceptions), so naming a character is a real cue.
 *  - No major course does register as a CHOICE — Genki/MNN/Tobira all name
 *    the target register in the instruction ("Answer in informal speech")
 *    and drill production. Tobira's 2025 revision is the sole exception.
 */

const STORAGE_KEY = "lingo:register-variants:v1";

type Verdict = "" | "pick" | "maybe" | "no";
type Note = { verdict: Verdict; text: string };
type Notes = Record<string, Note>;

function loadNotes(): Notes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Notes;
    const out: Notes = {};
    for (const [k, v] of Object.entries(parsed ?? {}))
      out[k] = { verdict: v?.verdict ?? "", text: v?.text ?? "" };
    return out;
  } catch {
    return {};
  }
}

/** Mount on approach — five step views autoplaying TTS at once reads as
 *  "audio is broken" (same reason LessonStepPreviewPage does this). */
function LazyStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (e) => e.some((x) => x.isIntersecting) && setInView(true),
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);
  return <div ref={ref}>{inView ? children : <div className="h-24" />}</div>;
}

type Variant = {
  id: string;
  label: string;
  pitch: string;
  cost: string;
  risk: string;
  step: LessonStep;
};

const YES_TILES = ["うん", "はい", "ええ", "ううん"];

function variants(): Variant[] {
  return [
    {
      id: "a-narrated",
      label: "A · What we ship today (the baseline)",
      pitch:
        "Narrated audience, no picture. This is the pattern you called weak — the learner reads an English scenario before they can start, in the same verbal channel as the Japanese.",
      cost: "Already built.",
      risk:
        "Two right answers: はい AND ええ are both polite, so 'Say politely' is genuinely ambiguous. Also trains reading-comprehension-of-English, not register.",
      step: {
        id: "rv-a",
        type: "build_sentence",
        prompt: "Say politely: Yes",
        targetSentence: "ええ",
        tiles: YES_TILES,
        correctOrder: ["ええ"],
        granularity: "word",
      } as LessonStep,
    },
    {
      id: "b-emoji-hint",
      label: "B · Audience picture + politeness meter  ⭐ your idea",
      pitch:
        "The addressee is DRAWN (grandma), the prompt is two words, and the three dots are Tobira's 丁寧度 meter showing how polite this person needs. Nothing to read but 'Say yes.'",
      cost: "Built — new `audienceEmoji` + `politenessHint` fields, one renderer block.",
      risk:
        "👵 alone doesn't tell you WHICH polite word. The dots disambiguate はい (2) from ええ (3) — without them this has A's two-right-answers problem.",
      step: {
        id: "rv-b",
        type: "build_sentence",
        prompt: "Say yes.",
        targetSentence: "ええ",
        tiles: YES_TILES,
        correctOrder: ["ええ"],
        granularity: "word",
        audienceEmoji: "👵",
        audienceLabel: "an elderly stranger",
        politenessHint: 3,
      } as LessonStep,
    },
    {
      id: "c-emoji-faded",
      label: "C · Same, meter removed (the faded hint)",
      pitch:
        "What B becomes on review surfaces once the picture alone should carry it. This is the 'slowly giving hints' ladder — B on introduction, C two lessons later, C forever after.",
      cost: "Free — omit one field.",
      risk:
        "If the learner never internalised the person→register mapping, this is just A without the sentence. Tests whether the scaffold actually transferred.",
      step: {
        id: "rv-c",
        type: "build_sentence",
        prompt: "Say yes.",
        targetSentence: "うん",
        tiles: YES_TILES,
        correctOrder: ["うん"],
        granularity: "word",
        audienceEmoji: "👫",
        audienceLabel: "a friend",
      } as LessonStep,
    },
    {
      id: "d-transform",
      label: "D · Register transform (same thought, new audience)",
      pitch:
        "The casual sentence is on screen; the chip says who you're re-saying it to. Teaches register as a LAYER over one meaning rather than as separate vocabulary — the thing a picker can't show.",
      cost: "Renderer already ships (transform mode). Compiler needs a `mode: transform` beat, ~15 lines.",
      risk:
        "Only legible if source and target differ by politeness ALONE. Change the verb or add an object and the learner can't tell what the chip is asking for.",
      step: {
        id: "rv-d",
        type: "build_sentence",
        prompt: "Say it to your teacher.",
        sourceSentence: "うん、いく。",
        transformLabel: "→ 🧑‍🏫",
        targetSentence: "はい、いきます",
        tiles: ["はい", "いきます", "うん", "いく", "ええ", "ううん"],
        correctOrder: ["はい", "いきます"],
        granularity: "word",
      } as LessonStep,
    },
    {
      id: "e-mirror",
      label: "E · Mirror the question (zero narration at all)",
      pitch:
        "The asker used ます, so you answer ます. The register cue is the JAPANESE on screen — no English scenario, no picture needed. Transfers to any sentence, unlike a memorised うん↔friend table.",
      cost: "Free once D lands — same machinery.",
      risk:
        "Japanese doesn't always mirror (a teacher may speak plain to a student and still get ます back). Safe only for symmetric cases; the cast has to carry the asymmetric ones.",
      step: {
        id: "rv-e",
        type: "build_sentence",
        prompt: "Reply: yes, I will.",
        sourceSentence: "ちゃを のみますか。",
        transformLabel: "→ こたえる",
        targetSentence: "はい、のみます",
        tiles: ["はい", "のみます", "うん", "のむ", "ええ", "ううん"],
        correctOrder: ["はい", "のみます"],
        granularity: "word",
      } as LessonStep,
    },
    {
      id: "f-audience-id",
      label: "F · Who is this said to? (the missing direction)",
      pitch:
        "Inverts the failed prompt: instead of 'you're talking to X, pick the word', it's 'here's the word — who's X?'. m10 is 100% production today; register is largely a LISTENING skill.",
      cost: "Compiler only — the IR currently has no way to author a listening-comprehension beat at all (~20 lines).",
      risk:
        "The carrier must be register-neutral. If the audio contains ます the answer is derivable from ます alone and the yes-word is decorative — so bare 「うん。」 is the right stimulus.",
      step: {
        id: "rv-f",
        type: "listening_comprehension",
        audioKey: "うん",
        transcript: "うん",
        romaji: "un",
        question: "Who is this said to?",
        options: [
          { id: "a", text: "A close friend" },
          { id: "b", text: "Your teacher" },
          { id: "c", text: "A stranger" },
          { id: "d", text: "A shop customer" },
        ],
        correctOptionId: "a",
      } as LessonStep,
    },
    {
      id: "h-stage1-cheatsheet",
      label: "H · STAGE 1 · LEARN — cheat sheet above the options  ⭐ your call",
      pitch:
        "First go-around for each of the three. Exactly what conjugation_transform does at stage 1: pin the table, ask anyway. Note the table lists friend/teacher/stranger but the card asks about a GRANDMOTHER — the learner has to place her on the cline, not read the answer off (this is TransformRuleTable's `maskBase` rule).",
      cost: "Built — new `referenceTable` field + one renderer block.",
      risk:
        "If the table ever names the same audience the card asks about, the step becomes a lookup and teaches nothing. The masking is the whole design.",
      step: {
        id: "rv-h",
        type: "build_sentence",
        prompt: "Say yes.",
        targetSentence: "ええ",
        tiles: YES_TILES,
        correctOrder: ["ええ"],
        granularity: "word",
        audienceEmoji: "👵",
        audienceLabel: "an elderly stranger",
        referenceTable: {
          label: "how polite?",
          rows: [
            { cue: "👫 a friend", form: "うん" },
            { cue: "🧑‍🏫 your teacher", form: "はい" },
            { cue: "🙇 someone you just met", form: "ええ" },
          ],
        },
      } as LessonStep,
    },
    {
      id: "i-stage2-peek",
      label: "I · STAGE 2 · KNOW — sheet gone, same question",
      pitch:
        "The identical card one beat later with the scaffold withdrawn (conjugation puts it behind a half-credit 💡 peek here). Meter stays as the last remaining hint; C is what stage 3 looks like when even that goes.",
      cost: "Free — omit one field.",
      risk:
        "Without a peek affordance a learner who forgot is just stuck. If you want the 💡 half-credit peek, that's the one piece of conjugation's ladder we'd still need to port.",
      step: {
        id: "rv-i",
        type: "build_sentence",
        prompt: "Say yes.",
        targetSentence: "ええ",
        tiles: YES_TILES,
        correctOrder: ["ええ"],
        granularity: "word",
        audienceEmoji: "👵",
        audienceLabel: "an elderly stranger",
        politenessHint: 3,
      } as LessonStep,
    },
    {
      id: "g-framed",
      label: "G · STAGE 3 · OWN — vocative frame  ⭐ your PICK, inv-5 problem removed",
      pitch:
        "The shape you picked, rebuilt as a framed PICKER rather than a particle_cloze — so invariant 5 never applies and the whole ladder stays one step type. 「せんせい、___。」 names the addressee in Japanese: zero English narration, and the frame fills in as you pick.",
      cost: "Built — `frameBefore`/`frameAfter`, one renderer block. No new step type, no inv-5 carve-out.",
      risk:
        "AMBIGUITY FIXED: 「せんせい、___」 accepts both はい and ええ, so this uses your name being called — Genki notes はい answers a summons and ええ CANNOT replace it there. Exactly one right answer.",
      step: {
        id: "rv-g",
        type: "build_sentence",
        prompt: "Answer.",
        frameBefore: "たなかせんせい：「トムさん！」　",
        frameAfter: "",
        targetSentence: "はい",
        tiles: YES_TILES,
        correctOrder: ["はい"],
        granularity: "word",
      } as LessonStep,
    },
    {
      id: "j-role-dialogue",
      label: "J · Role-labelled cast + register question  ⭐ your idea",
      pitch:
        "The speaker chip carries the ROLE, not a name. Right now all 52 neo dialogues label たなか by name 26×, so the learner must REMEMBER he's a teacher; 「せんせい」 makes the register readable straight off the chip. Then the comprehension question asks about register instead of facts — this is the dialogue-MCQ gap-filler.",
      cost: "Zero new machinery — dialogue_listen already takes free-text speaker labels and questions. It's an authoring rule plus a cast decision.",
      risk:
        "Roles are only free where the relationship is fixed. It also exposes a real bug: students address the teacher as 「たなかさん」 27× and 「たなかせんせい」 0× — さん to your teacher is itself a register error, inside the register module.",
      step: {
        id: "rv-j",
        type: "dialogue_listen",
        lines: [
          { speaker: "せんせい", kana: "トムさん、きょう じゅぎょうに いきますか。" },
          { speaker: "トム", kana: "はい、いきます。" },
          { speaker: "ともだち", kana: "トム、じゅぎょう いく？" },
          { speaker: "トム", kana: "うん、いく。" },
        ],
        questions: [
          {
            id: "q1",
            prompt: "Tom answered the same thing twice. Why did it come out differently?",
            options: [
              { id: "a", text: "He was talking to his teacher, then to a friend" },
              { id: "b", text: "The second one is more certain" },
              { id: "c", text: "The first one was a question" },
              { id: "d", text: "He changed his mind" },
            ],
            correctOptionId: "a",
            explanation:
              "Same answer, two audiences: はい・いきます to せんせい, うん・いく to a friend.",
          },
        ],
        transcriptRevealAfter: "first-answer",
      } as LessonStep,
    },
  ];
}

export default function RegisterVariantsPage() {
  const all = useMemo(variants, []);
  const [keys, setKeys] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Notes>(loadNotes);
  const bump = (id: string) => setKeys((k) => ({ ...k, [id]: (k[id] ?? 0) + 1 }));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      /* private mode — notes just won't persist */
    }
  }, [notes]);

  const set = (id: string, patch: Partial<Note>) =>
    setNotes((n) => {
      const prev: Note = n[id] ?? { verdict: "", text: "" };
      return { ...n, [id]: { ...prev, ...patch } };
    });

  const exportMd = () => {
    const lines = ["# Register variant verdicts", ""];
    for (const v of all) {
      const n = notes[v.id];
      if (!n?.verdict && !n?.text) continue;
      lines.push(`## ${v.label}`, "");
      if (n.verdict) lines.push(`**${n.verdict.toUpperCase()}**`, "");
      if (n.text) lines.push(n.text, "");
    }
    void navigator.clipboard?.writeText(lines.join("\n"));
  };

  const VERDICTS: { key: Verdict; label: string; cls: string }[] = [
    { key: "pick", label: "Pick", cls: "bg-success/20 border-success" },
    { key: "maybe", label: "Maybe", cls: "bg-warning/20 border-warning" },
    { key: "no", label: "No", cls: "bg-error/20 border-error" },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · Politeness register — pick a mechanic
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            {all.length} ways to teach register without narration
          </h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            Every card renders through the real <code>StepRenderer</code>, so
            what you tap is what m10 would ship. <strong>A is the current
            version</strong> — judge the rest against it. Mark Pick/Maybe/No and
            leave a critique; verdicts persist locally and export as markdown.
          </p>
          <p className="m-0 mt-2 text-xs text-text-muted">
            By m10 the learner already owns うん・はい・ええ・いいえ, so none of
            these is a first exposure — this module is contrast-and-choose.{" "}
            <Link to="../learn" className="underline">
              Back to Learn
            </Link>
          </p>
          <button
            type="button"
            onClick={exportMd}
            className="mt-3 rounded border border-border px-3 py-1 text-xs hover:bg-surface-muted"
          >
            Copy verdicts as markdown
          </button>
        </header>

        <div className="space-y-10">
          {all.map((v) => {
            const n = notes[v.id] ?? { verdict: "", text: "" };
            return (
              <section
                key={v.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
                  <h2 className="m-0 text-lg font-semibold">{v.label}</h2>
                  <button
                    type="button"
                    onClick={() => bump(v.id)}
                    className="shrink-0 rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                  >
                    Reset
                  </button>
                </div>

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
                  <LazyStage>
                    <StepRenderer
                      step={
                        {
                          ...v.step,
                          id: `${v.step.id}-r${keys[v.id] ?? 0}`,
                        } as LessonStep
                      }
                      onComplete={() => {}}
                      onContinue={() => bump(v.id)}
                    />
                  </LazyStage>
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
                </div>
                <textarea
                  value={n.text}
                  onChange={(e) => set(v.id, { text: e.target.value })}
                  placeholder="What's wrong with it / what would make it work…"
                  className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-sm"
                  rows={2}
                />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
