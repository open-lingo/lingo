import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SPINE_UNITS,
  SPINE_VERSION,
  WAVE_LABELS,
  type ParityRef,
  type SpineUnit,
} from "./spinePlan";

/**
 * DEV · Dict-form-first rewrite — spine planner (/ja/spine-plan).
 *
 * The design doc as a page (Spencer 2026-07-19): the draft module ladder
 * as drag-sequenceable tiles, each with a hover card carrying what it
 * teaches, why it sits there, parity refs (Tae Kim §, Genki ch, …), and
 * what salvages from the old course. Per-tile verdict + note and a
 * general box persist to localStorage AND mirror to the dev server
 * (/__lingo-spine-plan → /tmp/lingo-spine-plan.json) so an agent can
 * watch decisions land live — same pattern as the QA page's notes mirror.
 */

type Verdict = "" | "keep" | "move" | "rework" | "question";
type TileMark = { verdict: Verdict; note: string };
type SpineState = {
  version: string;
  general: string;
  order: string[];
  items: Record<string, TileMark>;
};

const STORAGE_KEY = "lingo:spine-plan:v1";
const DEFAULT_ORDER = SPINE_UNITS.map((u) => u.id);

function loadState(): SpineState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SpineState;
      const items: SpineState["items"] = {};
      for (const [id, m] of Object.entries(parsed.items ?? {})) {
        items[id] = { verdict: m?.verdict ?? "", note: m?.note ?? "" };
      }
      // Order hardening: keep only known ids, append any new draft tiles.
      const known = (parsed.order ?? []).filter((id) =>
        DEFAULT_ORDER.includes(id),
      );
      const order = [...known, ...DEFAULT_ORDER.filter((id) => !known.includes(id))];
      return { version: SPINE_VERSION, general: parsed.general ?? "", order, items };
    }
  } catch {
    /* corrupt state falls through to fresh */
  }
  return { version: SPINE_VERSION, general: "", order: DEFAULT_ORDER, items: {} };
}

/** Mirror state to the dev server for the watching agent (fire-and-forget). */
function mirrorToServer(state: SpineState) {
  try {
    void fetch("/__lingo-spine-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...state, savedAt: new Date().toISOString() }),
    }).catch(() => {});
  } catch {
    /* prod build / server gone — localStorage still has it */
  }
}

const VERDICTS: { key: Verdict; label: string; active: string }[] = [
  { key: "keep", label: "keep", active: "bg-accent text-white border-accent" },
  { key: "move", label: "move", active: "bg-amber-500 text-white border-amber-500" },
  { key: "rework", label: "rework", active: "bg-error text-white border-error" },
  { key: "question", label: "?", active: "bg-sky-500 text-white border-sky-500" },
];

const SOURCE_BADGE: Record<ParityRef["source"], string> = {
  "Tae Kim": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Genki: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "Cure Dolly": "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "Manga Way": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "JF/Marugoto": "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  Research: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

function HoverCard({ unit }: { unit: SpineUnit }) {
  return (
    <div
      data-testid={`hover-card-${unit.id}`}
      className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-[min(560px,90vw)] rounded-2xl border border-border bg-surface p-4 shadow-xl group-hover:block"
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        Teaches
      </p>
      <ul className="mb-3 list-disc pl-5 text-sm text-text-primary">
        {unit.teaches.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        Why here
      </p>
      <p className="mb-3 text-sm leading-relaxed text-text-primary">{unit.why}</p>
      {unit.parity.length > 0 && (
        <>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            Parity
          </p>
          <ul className="mb-3 space-y-1 text-sm">
            {unit.parity.map((p, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-2">
                <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${SOURCE_BADGE[p.source]}`}>
                  {p.source} {p.ref}
                </span>
                {p.note && <span className="text-text-secondary">{p.note}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
        Salvage
      </p>
      <p className="text-sm leading-relaxed text-text-secondary">{unit.salvage}</p>
      {unit.risks && (
        <>
          <p className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Open questions
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">{unit.risks}</p>
        </>
      )}
    </div>
  );
}

function SortableTile({
  unit,
  index,
  mark,
  onMark,
}: {
  unit: SpineUnit;
  index: number;
  mark: TileMark;
  onMark: (id: string, mark: TileMark) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: unit.id, disabled: unit.locked });
  const [notesOpen, setNotesOpen] = useState(false);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid={`spine-tile-${unit.id}`}
      className={`group relative rounded-2xl border-[1.5px] bg-surface p-3 ${
        isDragging ? "z-40 border-accent shadow-lg" : "border-border"
      } ${unit.locked ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={unit.locked ? "locked" : `drag ${unit.title}`}
          disabled={unit.locked}
          {...attributes}
          {...listeners}
          className={`mt-0.5 shrink-0 rounded-lg border border-border px-2 py-1 text-sm text-text-muted ${
            unit.locked ? "cursor-not-allowed" : "cursor-grab touch-none hover:border-accent hover:text-accent"
          }`}
        >
          {unit.locked ? "🔒" : "⠿"}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg">{unit.emoji}</span>
            <span className="text-xs font-bold text-text-muted">#{index + 1}</span>
            <h3 className="font-semibold text-text-primary">{unit.title}</h3>
            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-text-muted">
              wave {unit.wave}
            </span>
            {unit.milestone && (
              <span className="rounded bg-accent-muted px-1.5 py-0.5 text-xs font-semibold text-accent">
                {unit.milestone}
              </span>
            )}
            {mark.verdict && (
              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-semibold text-text-secondary">
                {mark.verdict}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-text-secondary">
            {unit.teaches[0]}
            {unit.teaches.length > 1 ? ` · +${unit.teaches.length - 1} more` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {VERDICTS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() =>
                onMark(unit.id, {
                  ...mark,
                  verdict: mark.verdict === v.key ? "" : v.key,
                })
              }
              className={`rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
                mark.verdict === v.key
                  ? v.active
                  : "border-border text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {v.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setNotesOpen((o) => !o)}
            aria-expanded={notesOpen}
            className={`rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
              mark.note
                ? "border-accent text-accent"
                : "border-border text-text-muted hover:border-accent hover:text-accent"
            }`}
          >
            note{mark.note ? " ●" : ""}
          </button>
        </div>
      </div>
      {notesOpen && (
        <textarea
          value={mark.note}
          onChange={(e) => onMark(unit.id, { ...mark, note: e.target.value })}
          placeholder="Notes for this unit — ordering, content, anything…"
          rows={3}
          className="mt-3 w-full rounded-xl border border-border bg-surface-muted p-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      )}
      <HoverCard unit={unit} />
    </li>
  );
}

export default function SpinePlannerPage() {
  const [state, setState] = useState<SpineState>(() => loadState());
  const [savedFlash, setSavedFlash] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // Persist locally immediately; mirror to the dev server debounced so a
  // drag or keystroke burst lands as one file write for the watcher.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      mirrorToServer(state);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1200);
    }, 800);
    return () => {
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const unitsById = useMemo(
    () => new Map(SPINE_UNITS.map((u) => [u.id, u])),
    [],
  );
  const ordered = state.order
    .map((id) => unitsById.get(id))
    .filter((u): u is SpineUnit => !!u);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setState((s) => {
      const from = s.order.indexOf(String(active.id));
      const to = s.order.indexOf(String(over.id));
      if (from < 0 || to < 0) return s;
      return { ...s, order: arrayMove(s.order, from, to) };
    });
  }

  function handleMark(id: string, mark: TileMark) {
    setState((s) => ({ ...s, items: { ...s.items, [id]: mark } }));
  }

  function exportMarkdown() {
    const lines: string[] = [
      `# Spine plan review — ${SPINE_VERSION}`,
      "",
      state.general ? `**General:** ${state.general}\n` : "",
      ...ordered.map((u, i) => {
        const m = state.items[u.id];
        const bits = [`${i + 1}. **${u.title}**`];
        if (m?.verdict) bits.push(`[${m.verdict}]`);
        if (m?.note) bits.push(`— ${m.note}`);
        return bits.join(" ");
      }),
    ];
    void navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
  }

  function resetOrder() {
    setState((s) => ({ ...s, order: DEFAULT_ORDER }));
  }

  // Wave header before a tile whose wave differs from its predecessor —
  // headers follow the CURRENT order, so they stay honest after drags.
  function waveHeaderBefore(i: number): string | null {
    const w = ordered[i].wave;
    if (i === 0 || ordered[i - 1].wave !== w) return WAVE_LABELS[w] ?? null;
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-text-primary">
          Dict-form-first rewrite — spine planner
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {SPINE_VERSION} · drag to reorder · hover a tile for what/why/parity/salvage ·
          verdict + note per tile. Everything autosaves (local + dev server
          mirror{savedFlash ? " · saved ✓" : ""}).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportMarkdown}
            className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold text-text-primary hover:border-accent hover:text-accent"
          >
            Copy review as markdown
          </button>
          <button
            type="button"
            onClick={resetOrder}
            className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold text-text-muted hover:border-error hover:text-error"
          >
            Reset to draft order
          </button>
        </div>
        <textarea
          value={state.general}
          onChange={(e) => setState((s) => ({ ...s, general: e.target.value }))}
          placeholder="General direction notes — methodology, register policy, anything spine-wide…"
          rows={2}
          className="mt-3 w-full rounded-xl border border-border bg-surface-muted p-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={state.order} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {ordered.map((u, i) => (
              <div key={u.id}>
                {waveHeaderBefore(i) && (
                  <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                    {waveHeaderBefore(i)}
                  </p>
                )}
                <SortableTile
                  unit={u}
                  index={i}
                  mark={state.items[u.id] ?? { verdict: "", note: "" }}
                  onMark={handleMark}
                />
              </div>
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
