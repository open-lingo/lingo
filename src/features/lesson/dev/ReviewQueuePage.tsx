import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import {
  REVIEW_ENTRIES,
  RESOLVED_ENTRIES,
  REVIEW_QUEUE_READ_ME,
  type ReviewEntry,
  type ReviewVerdict,
} from "./reviewQueue";

/**
 * DEV · Review queue (`/:lang/qa/review`).
 *
 * Plain-language decisions & findings waiting on Spencer, answerable in
 * place: verdict buttons + a note box per entry. Same persistence pattern
 * as the QA test-drive page — localStorage, mirrored to the dev server
 * (/__lingo-review-queue → /tmp/lingo-review-queue.json) so an agent can
 * watch answers land live, markdown export as the offline fallback.
 * Entries live in reviewQueue.ts; agents append them there.
 */

type EntryMark = { verdict: ReviewVerdict; note: string };
type QueueNotes = { general: string; items: Record<string, EntryMark> };

// One key, not per-language: the queue is repo-wide (entries carry their
// own language context), unlike the test-drive page's per-language rows.
const STORAGE_KEY = "lingo:review-queue:v1";

function loadNotes(): QueueNotes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QueueNotes;
      const items: QueueNotes["items"] = {};
      for (const [id, m] of Object.entries(parsed.items ?? {})) {
        items[id] = { verdict: m?.verdict ?? "", note: m?.note ?? "" };
      }
      return { general: parsed.general ?? "", items };
    }
  } catch {
    /* corrupt state falls through to fresh */
  }
  return { general: "", items: {} };
}

const VERDICT_META: {
  value: Exclude<ReviewVerdict, "">;
  label: string;
  active: string;
}[] = [
  { value: "yes", label: "✓ yes / go", active: "border-success text-success" },
  { value: "discuss", label: "⚠ discuss", active: "border-warning text-warning" },
  { value: "no", label: "✗ no / skip", active: "border-error text-error" },
];

export default function ReviewQueuePage() {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const [notes, setNotes] = useState<QueueNotes>(loadNotes);
  const [exportState, setExportState] = useState<"idle" | "copied" | "downloaded">(
    "idle",
  );
  // Gates the mirror POST — a session that never edited must not clobber
  // the shared mirror file with empties (same guard as the test-drive page).
  const dirtyRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      /* storage full/unavailable — notes stay in memory */
    }
  }, [notes]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const payload = () =>
      JSON.stringify({ savedAt: new Date().toISOString(), ...notes });
    const handle = setTimeout(() => {
      void fetch("/__lingo-review-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload(),
      }).catch(() => undefined);
    }, 1000);
    const flush = () => {
      try {
        navigator.sendBeacon?.(
          "/__lingo-review-queue",
          new Blob([payload()], { type: "application/json" }),
        );
      } catch {
        /* no beacon — debounced POST already covered most */
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(handle);
      window.removeEventListener("pagehide", flush);
    };
  }, [notes]);

  const decisions = useMemo(
    () => REVIEW_ENTRIES.filter((e) => e.kind === "decision" && !e.resolved),
    [],
  );
  const findings = useMemo(
    () => REVIEW_ENTRIES.filter((e) => e.kind === "finding" && !e.resolved),
    [],
  );
  const resolved = useMemo(
    () => [...RESOLVED_ENTRIES, ...REVIEW_ENTRIES.filter((e) => e.resolved)],
    [],
  );
  const open = useMemo(() => [...decisions, ...findings], [decisions, findings]);
  const answeredCount = open.filter(
    (e) => notes.items[e.id]?.verdict || (notes.items[e.id]?.note ?? "").trim(),
  ).length;

  const setMark = (id: string, patch: Partial<EntryMark>) => {
    dirtyRef.current = true;
    setNotes((n) => {
      const prev: EntryMark = n.items[id] ?? { verdict: "", note: "" };
      return { ...n, items: { ...n.items, [id]: { ...prev, ...patch } } };
    });
  };

  const exportMarkdown = () => {
    const lines: string[] = [
      "# Lingo review-queue answers",
      `_Exported ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · ${answeredCount}/${open.length} answered_`,
      "",
    ];
    if (notes.general.trim()) {
      lines.push("## General", notes.general.trim(), "");
    }
    for (const entry of open) {
      const mark = notes.items[entry.id];
      if (!mark?.verdict && !(mark?.note ?? "").trim()) continue;
      lines.push(
        `## ${entry.id} — ${entry.title}`,
        `Verdict: ${mark.verdict ? mark.verdict.toUpperCase() : "(none)"}`,
      );
      if ((mark.note ?? "").trim()) {
        lines.push("", mark.note.trim());
      }
      lines.push("");
    }
    const md = lines.join("\n");
    void navigator.clipboard?.writeText(md).then(
      () => {
        setExportState("copied");
        setTimeout(() => setExportState("idle"), 2000);
      },
      () => undefined,
    );
    if (!navigator.clipboard) {
      setExportState("downloaded");
      setTimeout(() => setExportState("idle"), 3000);
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `review-answers-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const renderEntry = (entry: ReviewEntry) => {
    const mark = notes.items[entry.id] ?? { verdict: "" as ReviewVerdict, note: "" };
    return (
      <div
        key={entry.id}
        id={`entry-${entry.id}`}
        className="scroll-mt-24 rounded-xl border border-border bg-surface p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-bold">
              <span className="mr-2 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                {entry.id}
              </span>
              {entry.title}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-text-muted">
              <span>added {entry.added}</span>
              {entry.blockedOn && (
                <span className="font-semibold text-warning">
                  blocked on {entry.blockedOn}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            {VERDICT_META.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() =>
                  setMark(entry.id, {
                    verdict: mark.verdict === v.value ? "" : v.value,
                  })
                }
                className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                  mark.verdict === v.value
                    ? v.active
                    : "border-border text-text-muted hover:bg-surface-muted"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 space-y-2 text-sm text-text-primary">
          {entry.body.map((para, i) => (
            <p key={i} className="m-0">
              {para}
            </p>
          ))}
        </div>
        <div className="mt-2 rounded-lg border border-accent/40 bg-background p-2 text-sm">
          <span className="font-semibold text-accent">Example: </span>
          {entry.example}
        </div>
        <div className="mt-2 text-sm">
          <span className="font-semibold">What we need from you: </span>
          {entry.ask}
        </div>
        {entry.details && (
          <div className="mt-2 font-mono text-[11px] text-text-muted">
            {entry.details}
          </div>
        )}
        {entry.links && entry.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.links.map((link) => (
              // Same shared play tab as the test-drive page — no tab pile-up.
              <a
                key={link.href + link.label}
                href={`/${langId}${link.href}`}
                target="lingo-qa-play"
                className="rounded border border-border bg-background px-2 py-0.5 text-xs text-accent underline-offset-2 hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        <textarea
          value={mark.note ?? ""}
          onChange={(e) => setMark(entry.id, { note: e.target.value })}
          rows={2}
          placeholder="Your answer — bullets, half-sentences, anything works…"
          className="mt-2 w-full rounded border border-border/60 bg-background px-2 py-1 text-sm"
        />
      </div>
    );
  };

  return (
    // Dev routes hang directly off LangLayout (no app shell) — paint our
    // own themed background, same as the test-drive page.
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · Review queue
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">Waiting on you</h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            Decisions and findings, in plain language. Mark a verdict and/or
            type an answer — notes save in this browser and mirror to the dev
            workshop ~1s after you pause, so an agent can pick them up live.
            “Export” is the offline fallback.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded border border-border bg-surface-muted px-2 py-1 text-xs font-semibold">
              {answeredCount}/{open.length} answered
            </span>
            <button
              type="button"
              onClick={exportMarkdown}
              className="rounded border border-accent px-2 py-1 text-xs font-semibold text-accent hover:bg-surface-muted"
            >
              {exportState === "copied"
                ? "Copied!"
                : exportState === "downloaded"
                  ? "Downloaded (no clipboard)"
                  : "Export answers (copy + download)"}
            </button>
            <Link
              to={`/${langId}/qa`}
              className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-surface-muted"
            >
              ← QA test drive
            </Link>
          </div>
          <details className="mt-3 rounded-lg border border-border bg-surface p-2 text-xs text-text-secondary">
            <summary className="cursor-pointer font-semibold">
              📖 Read me — how agents write entries here
            </summary>
            <div className="mt-2 space-y-2">
              {REVIEW_QUEUE_READ_ME.map((para, i) => (
                <p key={i} className="m-0">
                  {para}
                </p>
              ))}
            </div>
          </details>
        </header>

        <section className="mb-8 rounded-xl border border-border bg-surface p-4">
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            General notes
          </h2>
          <textarea
            value={notes.general}
            onChange={(e) => {
              dirtyRef.current = true;
              setNotes((n) => ({ ...n, general: e.target.value }));
            }}
            rows={2}
            placeholder="Anything cross-cutting…"
            className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
        </section>

        <div className="space-y-10">
          <section>
            <h2 className="m-0 text-lg font-bold">
              Decisions — {decisions.length} waiting
            </h2>
            <div className="mt-3 space-y-4">{decisions.map(renderEntry)}</div>
          </section>
          <section>
            <h2 className="m-0 text-lg font-bold">
              QA findings — react if you want
            </h2>
            <div className="mt-3 space-y-4">{findings.map(renderEntry)}</div>
          </section>
          {resolved.length > 0 && (
            <details className="rounded-xl border border-border bg-surface p-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                ✅ Resolved ({resolved.length})
              </summary>
              <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-text-secondary">
                {resolved.map((e) => (
                  <li key={e.id}>
                    <span className="font-mono text-xs">{e.id}</span> —{" "}
                    {e.title}
                    {e.resolved ? ` · ${e.resolved}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
