import type { LessonContent } from "@/features/lesson/types";

type Props = {
  content: LessonContent;
  onChange: (next: LessonContent) => void;
};

export function LessonMetadataPanel({ content, onChange }: Props) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="border-b border-border bg-surface-muted px-3 py-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Lesson metadata
        </h3>
      </header>
      <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-3">
        <Field label="ID" mono>
          <input
            type="text"
            value={content.id}
            readOnly
            className="w-full cursor-not-allowed rounded border border-border bg-surface-muted px-2 py-1 font-mono text-xs text-text-muted"
            title="Lesson IDs are stable — rename via export TS then commit."
          />
        </Field>
        <Field label="Module">
          <input
            type="text"
            value={content.moduleId}
            onChange={(e) => onChange({ ...content, moduleId: e.target.value })}
            className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
          />
        </Field>
        <Field label="Course">
          <input
            type="text"
            value={content.courseId}
            onChange={(e) => onChange({ ...content, courseId: e.target.value })}
            className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
          />
        </Field>
        <Field label="Language">
          <input
            type="text"
            value={content.languageId}
            onChange={(e) =>
              onChange({ ...content, languageId: e.target.value })
            }
            className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
          />
        </Field>
        <Field label="Estimated minutes">
          <input
            type="number"
            min={0}
            value={content.estimatedMinutes ?? 0}
            onChange={(e) =>
              onChange({
                ...content,
                estimatedMinutes: Number(e.target.value) || undefined,
              })
            }
            className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
          />
        </Field>
        <Field label="XP reward">
          <input
            type="number"
            min={0}
            value={content.xpReward ?? 0}
            onChange={(e) =>
              onChange({
                ...content,
                xpReward: Number(e.target.value) || undefined,
              })
            }
            className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
          />
        </Field>
        <Field label="Title" wide>
          <input
            type="text"
            value={content.title}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
          />
        </Field>
        <Field label="Description" wide>
          <input
            type="text"
            value={content.description ?? ""}
            onChange={(e) =>
              onChange({
                ...content,
                description: e.target.value || undefined,
              })
            }
            className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
          />
        </Field>
        <Field label="Introduces vocab IDs (comma sep)" wide>
          <input
            type="text"
            value={(content.introducesVocabIds ?? []).join(", ")}
            onChange={(e) => {
              const arr = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              onChange({
                ...content,
                introducesVocabIds: arr.length ? arr : undefined,
              });
            }}
            className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
          />
        </Field>
        <Field label="Introduces card IDs (comma sep)" wide>
          <input
            type="text"
            value={(content.introducesCardIds ?? []).join(", ")}
            onChange={(e) => {
              const arr = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              onChange({
                ...content,
                introducesCardIds: arr.length ? arr : undefined,
              });
            }}
            className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary"
          />
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  wide,
  mono,
  children,
}: {
  label: string;
  wide?: boolean;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "col-span-2 lg:col-span-3" : ""}>
      <span
        className={`mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted ${
          mono ? "" : ""
        }`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
