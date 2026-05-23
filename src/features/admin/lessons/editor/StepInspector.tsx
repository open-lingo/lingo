import { useEffect, useMemo, useState } from "react";
import type {
  LessonStep,
  MultipleChoiceStep,
  BuildSentenceStep,
  FillBlankStep,
  TranslateStep,
  PhraseCardStep,
  GrammarRuleStep,
  InfoStep,
  TeachStep,
  ParticleClozeStep,
  WordImageMcqStep,
} from "@/features/lesson/types";
import { Icon } from "@/shared/components/Icon";
import { checkPassiveCardFollowup } from "@/features/lesson/data/_stepAssertions";
import { stepHasSentenceContent } from "@/features/lesson/data/_stepPredicates";

type Props = {
  step: LessonStep;
  /** Full lesson draft step list — needed so the inspector can run the
   * passive-card followup lint against the surrounding window and surface
   * a warning banner on the current step when it fails. */
  allSteps?: ReadonlyArray<LessonStep>;
  onChange: (next: LessonStep) => void;
};

export function StepInspector({ step, allSteps, onChange }: Props) {
  const lintFailure = useMemo(() => {
    if (!allSteps) return null;
    const { failures } = checkPassiveCardFollowup(allSteps);
    return failures.find((f) => f.stepId === step.id) ?? null;
  }, [allSteps, step.id]);

  const [mode, setMode] = useState<"form" | "json">("form");

  const patch = <K extends keyof LessonStep>(
    field: K,
    value: LessonStep[K],
  ) => {
    onChange({ ...step, [field]: value });
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface-muted px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Inspector
          </span>
          <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-secondary">
            {step.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode("form")}
            className={`rounded px-2 py-0.5 text-xs ${
              mode === "form"
                ? "bg-accent text-on-accent"
                : "text-text-muted hover:bg-surface"
            }`}
          >
            Form
          </button>
          <button
            onClick={() => setMode("json")}
            className={`rounded px-2 py-0.5 text-xs ${
              mode === "json"
                ? "bg-accent text-on-accent"
                : "text-text-muted hover:bg-surface"
            }`}
          >
            JSON
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {lintFailure && (
          <div className="mb-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            <strong>Lint:</strong> {lintFailure.reason}
          </div>
        )}
        <div className="space-y-3">
          <Field label="Step ID" hint="Stable; renames may break saved progress.">
            <input
              type="text"
              value={step.id}
              onChange={(e) => patch("id", e.target.value)}
              className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
            />
          </Field>
          <Field label="Hint" hint="Optional inline hint shown on demand.">
            <input
              type="text"
              value={step.hint ?? ""}
              onChange={(e) =>
                patch("hint", (e.target.value || undefined) as LessonStep["hint"])
              }
              className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            />
          </Field>
          {stepHasSentenceContent(step) && (
            <Field
              label="Explanation (sentence-level)"
              hint="Why this answer is correct. Don't include the literal answer — the learner sees this on a ? button after a wrong submit or 15s of inactivity."
            >
              <textarea
                value={step.explanation ?? ""}
                onChange={(e) =>
                  patch(
                    "explanation",
                    (e.target.value || undefined) as LessonStep["explanation"],
                  )
                }
                className="h-20 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
              />
              {!step.explanation && (
                <span className="mt-1 block text-[11px] text-text-muted">
                  Consider adding an explanation. Players can tap a “?” button
                  to see it after a wrong answer or 15s of inactivity.
                </span>
              )}
            </Field>
          )}
        </div>

        <div className="my-4 border-t border-border" />

        {mode === "json" ? (
          <JsonEditor step={step} onChange={onChange} />
        ) : (
          <PerKindForm step={step} onChange={onChange} />
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-text-muted">{hint}</span>}
    </label>
  );
}

function PerKindForm({ step, onChange }: { step: LessonStep; onChange: (s: LessonStep) => void }) {
  switch (step.type) {
    case "info":
      return <InfoForm step={step} onChange={onChange} />;
    case "teach":
      return <TeachForm step={step} onChange={onChange} />;
    case "multiple_choice":
      return <McqForm step={step} onChange={onChange} />;
    case "build_sentence":
      return <BuildSentenceForm step={step} onChange={onChange} />;
    case "fill_blank":
      return <FillBlankForm step={step} onChange={onChange} />;
    case "translate":
      return <TranslateForm step={step} onChange={onChange} />;
    case "phrase_card":
      return <PhraseCardForm step={step} onChange={onChange} />;
    case "grammar_rule":
      return <GrammarRuleForm step={step} onChange={onChange} />;
    case "particle_cloze":
      return <ParticleClozeForm step={step} onChange={onChange} />;
    case "word_image_mcq":
      return <WordImageMcqForm step={step} onChange={onChange} />;
    default:
      return (
        <div className="space-y-3">
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/30 dark:text-amber-200">
            No structured form for <code>{step.type}</code> yet — use the JSON tab
            to edit this step. All other fields below are inherited from
            <code> LessonStep </code>.
          </div>
          <JsonEditor step={step} onChange={onChange} />
        </div>
      );
  }
}

function JsonEditor({ step, onChange }: { step: LessonStep; onChange: (s: LessonStep) => void }) {
  const [text, setText] = useState(() => JSON.stringify(step, null, 2));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(step, null, 2));
    setErr(null);
  }, [step]);

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-72 w-full resize-y rounded border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary"
        spellCheck={false}
      />
      {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            try {
              const parsed = JSON.parse(text) as LessonStep;
              if (!parsed?.type || !parsed?.id) {
                setErr("Step must have id and type.");
                return;
              }
              setErr(null);
              onChange(parsed);
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Invalid JSON");
            }
          }}
          className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-on-accent hover:opacity-90"
        >
          <Icon name="check" className="inline h-3 w-3" /> apply json
        </button>
      </div>
    </div>
  );
}

function InfoForm({ step, onChange }: { step: InfoStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title">
        <input
          type="text"
          value={step.title ?? ""}
          onChange={(e) => onChange({ ...step, title: e.target.value || undefined })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Body">
        <textarea
          value={step.body}
          onChange={(e) => onChange({ ...step, body: e.target.value })}
          className="h-32 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Variant">
        <select
          value={step.variant ?? "default"}
          onChange={(e) =>
            onChange({
              ...step,
              variant: (e.target.value || undefined) as InfoStep["variant"],
            })
          }
          className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        >
          {["default", "tip", "culture", "grammar", "win"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Image key">
        <input
          type="text"
          value={step.imageKey ?? ""}
          onChange={(e) =>
            onChange({ ...step, imageKey: e.target.value || undefined })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
        />
      </Field>
    </div>
  );
}

function TeachForm({ step, onChange }: { step: TeachStep; onChange: (s: LessonStep) => void }) {
  const c = step.content;
  return (
    <div className="space-y-3">
      <Field label="Body text">
        <textarea
          value={c.text}
          onChange={(e) =>
            onChange({ ...step, content: { ...c, text: e.target.value } })
          }
          className="h-24 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Vocab term">
        <input
          type="text"
          value={c.vocab?.term ?? ""}
          onChange={(e) =>
            onChange({
              ...step,
              content: {
                ...c,
                vocab: {
                  ...(c.vocab ?? { term: "", translation: "" }),
                  term: e.target.value,
                },
              },
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Vocab translation">
        <input
          type="text"
          value={c.vocab?.translation ?? ""}
          onChange={(e) =>
            onChange({
              ...step,
              content: {
                ...c,
                vocab: {
                  ...(c.vocab ?? { term: "", translation: "" }),
                  translation: e.target.value,
                },
              },
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Author note">
        <input
          type="text"
          value={c.note ?? ""}
          onChange={(e) =>
            onChange({
              ...step,
              content: { ...c, note: e.target.value || undefined },
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
    </div>
  );
}

function McqForm({ step, onChange }: { step: MultipleChoiceStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Prompt">
        <textarea
          value={step.prompt}
          onChange={(e) => onChange({ ...step, prompt: e.target.value })}
          className="h-20 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <div>
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Options
        </span>
        <ul className="space-y-1.5">
          {step.options.map((opt, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="radio"
                checked={step.correctOptionId === opt.id}
                onChange={() => onChange({ ...step, correctOptionId: opt.id })}
                className="h-3.5 w-3.5 accent-accent"
              />
              <input
                type="text"
                value={opt.id}
                onChange={(e) => {
                  const next = [...step.options];
                  next[i] = { ...opt, id: e.target.value };
                  const correctId =
                    step.correctOptionId === opt.id
                      ? e.target.value
                      : step.correctOptionId;
                  onChange({ ...step, options: next, correctOptionId: correctId });
                }}
                className="w-12 rounded border border-border bg-surface px-1.5 py-1 font-mono text-xs text-text-primary"
              />
              <input
                type="text"
                value={opt.text}
                onChange={(e) => {
                  const next = [...step.options];
                  next[i] = { ...opt, text: e.target.value };
                  onChange({ ...step, options: next });
                }}
                className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
              />
              <button
                onClick={() => {
                  const next = step.options.filter((_, j) => j !== i);
                  onChange({ ...step, options: next });
                }}
                className="rounded p-1 text-text-muted hover:text-rose-500"
              >
                <Icon name="trash" className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            const nextId = String.fromCharCode(
              97 + step.options.length,
            );
            onChange({
              ...step,
              options: [...step.options, { id: nextId, text: "" }],
            });
          }}
          className="mt-2 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary hover:bg-surface-muted"
        >
          <Icon name="plus" className="inline h-3 w-3" /> add option
        </button>
      </div>
    </div>
  );
}

function BuildSentenceForm({ step, onChange }: { step: BuildSentenceStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Prompt">
        <textarea
          value={step.prompt}
          onChange={(e) => onChange({ ...step, prompt: e.target.value })}
          className="h-20 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Target sentence">
        <input
          type="text"
          value={step.targetSentence}
          onChange={(e) =>
            onChange({ ...step, targetSentence: e.target.value })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Tiles (comma separated)">
        <input
          type="text"
          value={step.tiles.join(", ")}
          onChange={(e) =>
            onChange({
              ...step,
              tiles: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
        />
      </Field>
      <Field
        label="Correct order (tile IDs, comma sep)"
        hint="Tiles by string id, not index — match the values above."
      >
        <input
          type="text"
          value={step.correctOrder.join(", ")}
          onChange={(e) =>
            onChange({
              ...step,
              correctOrder: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
        />
      </Field>
      <Field label="Granularity">
        <select
          value={step.granularity}
          onChange={(e) =>
            onChange({
              ...step,
              granularity: e.target.value as "word" | "character",
            })
          }
          className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        >
          <option value="word">word</option>
          <option value="character">character</option>
        </select>
      </Field>
    </div>
  );
}

function FillBlankForm({ step, onChange }: { step: FillBlankStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field
        label="Sentence (use {{blank}} markers)"
        hint="Each {{blank}} corresponds to one entry in Blanks below."
      >
        <textarea
          value={step.sentence}
          onChange={(e) => onChange({ ...step, sentence: e.target.value })}
          className="h-20 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Word bank (comma separated, optional)">
        <input
          type="text"
          value={(step.wordBank ?? []).join(", ")}
          onChange={(e) => {
            const v = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            onChange({
              ...step,
              wordBank: v.length ? v : undefined,
            });
          }}
          className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
        />
      </Field>
      <div>
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Blanks
        </span>
        <ul className="space-y-1.5">
          {step.blanks.map((b, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                value={b.id}
                onChange={(e) => {
                  const next = [...step.blanks];
                  next[i] = { ...b, id: e.target.value };
                  onChange({ ...step, blanks: next });
                }}
                className="w-16 rounded border border-border bg-surface px-1.5 py-1 font-mono text-xs text-text-primary"
              />
              <input
                value={b.correctAnswer}
                onChange={(e) => {
                  const next = [...step.blanks];
                  next[i] = { ...b, correctAnswer: e.target.value };
                  onChange({ ...step, blanks: next });
                }}
                placeholder="correct answer"
                className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
              />
              <button
                onClick={() => {
                  const next = step.blanks.filter((_, j) => j !== i);
                  onChange({ ...step, blanks: next });
                }}
                className="rounded p-1 text-text-muted hover:text-rose-500"
              >
                <Icon name="trash" className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            const next = [
              ...step.blanks,
              { id: `b${step.blanks.length + 1}`, correctAnswer: "" },
            ];
            onChange({ ...step, blanks: next });
          }}
          className="mt-2 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary hover:bg-surface-muted"
        >
          <Icon name="plus" className="inline h-3 w-3" /> add blank
        </button>
      </div>
    </div>
  );
}

function TranslateForm({ step, onChange }: { step: TranslateStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Source text">
        <input
          type="text"
          value={step.sourceText}
          onChange={(e) => onChange({ ...step, sourceText: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Source language">
        <select
          value={step.sourceLanguage}
          onChange={(e) =>
            onChange({
              ...step,
              sourceLanguage: e.target.value as TranslateStep["sourceLanguage"],
            })
          }
          className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        >
          <option value="target">target (e.g. ja)</option>
          <option value="native">native (e.g. en)</option>
        </select>
      </Field>
      <Field label="Accepted answers (one per line)">
        <textarea
          value={step.acceptedAnswers.join("\n")}
          onChange={(e) =>
            onChange({
              ...step,
              acceptedAnswers: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="h-24 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
    </div>
  );
}

function PhraseCardForm({ step, onChange }: { step: PhraseCardStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Kana">
        <input
          type="text"
          value={step.kana}
          onChange={(e) => onChange({ ...step, kana: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Romaji">
        <input
          type="text"
          value={step.romaji}
          onChange={(e) => onChange({ ...step, romaji: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Meaning (EN)">
        <input
          type="text"
          value={step.meaningEn}
          onChange={(e) => onChange({ ...step, meaningEn: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Culture note">
        <textarea
          value={step.cultureNote ?? ""}
          onChange={(e) =>
            onChange({
              ...step,
              cultureNote: e.target.value || undefined,
            })
          }
          className="h-20 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field
        label="Emoji (optional)"
        hint="Overrides the kana→emoji lookup. Single glyph."
      >
        <input
          type="text"
          value={step.emoji ?? ""}
          maxLength={4}
          onChange={(e) =>
            onChange({ ...step, emoji: e.target.value || undefined })
          }
          className="w-24 rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field
        label="Atom ID (for followup lint)"
        hint="The course atom this card maps to. Required for the same-atom follow-up lint."
      >
        <input
          type="text"
          value={step.atomId ?? ""}
          onChange={(e) =>
            onChange({ ...step, atomId: e.target.value || undefined })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
        />
      </Field>
    </div>
  );
}

function GrammarRuleForm({ step, onChange }: { step: GrammarRuleStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title">
        <input
          type="text"
          value={step.title}
          onChange={(e) => onChange({ ...step, title: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Rule">
        <textarea
          value={step.rule}
          onChange={(e) => onChange({ ...step, rule: e.target.value })}
          className="h-20 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Culture note">
        <textarea
          value={step.cultureNote ?? ""}
          onChange={(e) =>
            onChange({
              ...step,
              cultureNote: e.target.value || undefined,
            })
          }
          className="h-16 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <div className="rounded border border-dashed border-border bg-surface-muted/50 p-2 text-xs text-text-muted">
        Examples and anti-patterns are best edited in the JSON tab — they have
        nested annotation arrays that a structured form can't preserve safely.
      </div>
    </div>
  );
}

function ParticleClozeForm({ step, onChange }: { step: ParticleClozeStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Before blank">
        <input
          type="text"
          value={step.prompt.before}
          onChange={(e) =>
            onChange({
              ...step,
              prompt: { ...step.prompt, before: e.target.value },
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="After blank">
        <input
          type="text"
          value={step.prompt.after}
          onChange={(e) =>
            onChange({
              ...step,
              prompt: { ...step.prompt, after: e.target.value },
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Correct particle">
        <input
          type="text"
          value={step.correctParticle}
          onChange={(e) =>
            onChange({ ...step, correctParticle: e.target.value })
          }
          className="w-32 rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <Field label="Particle options (comma separated)">
        <input
          type="text"
          value={step.options.join(", ")}
          onChange={(e) =>
            onChange({
              ...step,
              options: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-sm text-text-primary"
        />
      </Field>
      <Field label="Meaning (EN)">
        <input
          type="text"
          value={step.meaningEn}
          onChange={(e) => onChange({ ...step, meaningEn: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
    </div>
  );
}

function WordImageMcqForm({ step, onChange }: { step: WordImageMcqStep; onChange: (s: LessonStep) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Meaning (EN)">
        <input
          type="text"
          value={step.meaningEn}
          onChange={(e) => onChange({ ...step, meaningEn: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
        />
      </Field>
      <div>
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Options
        </span>
        <ul className="space-y-1.5">
          {step.options.map((opt, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="radio"
                checked={step.correctOptionId === opt.id}
                onChange={() => onChange({ ...step, correctOptionId: opt.id })}
                className="h-3.5 w-3.5 accent-accent"
              />
              <input
                value={opt.id}
                onChange={(e) => {
                  const next = [...step.options];
                  next[i] = { ...opt, id: e.target.value };
                  const correctId =
                    step.correctOptionId === opt.id
                      ? e.target.value
                      : step.correctOptionId;
                  onChange({ ...step, options: next, correctOptionId: correctId });
                }}
                className="w-14 rounded border border-border bg-surface px-1.5 py-1 font-mono text-xs text-text-primary"
              />
              <input
                value={opt.word}
                onChange={(e) => {
                  const next = [...step.options];
                  next[i] = { ...opt, word: e.target.value };
                  onChange({ ...step, options: next });
                }}
                placeholder="word"
                className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
              />
              <input
                value={opt.emoji}
                onChange={(e) => {
                  const next = [...step.options];
                  next[i] = { ...opt, emoji: e.target.value };
                  onChange({ ...step, options: next });
                }}
                placeholder="emoji"
                className="w-16 rounded border border-border bg-surface px-1.5 py-1 text-sm text-text-primary"
              />
              <button
                onClick={() => {
                  const next = step.options.filter((_, j) => j !== i);
                  onChange({ ...step, options: next });
                }}
                className="rounded p-1 text-text-muted hover:text-rose-500"
              >
                <Icon name="trash" className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            const next = String.fromCharCode(97 + step.options.length);
            onChange({
              ...step,
              options: [...step.options, { id: next, word: "", emoji: "" }],
            });
          }}
          className="mt-2 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary hover:bg-surface-muted"
        >
          <Icon name="plus" className="inline h-3 w-3" /> add option
        </button>
      </div>
    </div>
  );
}
