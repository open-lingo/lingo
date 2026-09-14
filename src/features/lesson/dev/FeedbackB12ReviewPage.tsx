import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import {
  FEEDBACK_B12_ITEMS,
  type FeedbackB12Item,
  type FeedbackLane,
} from "./feedbackB12Items";

/**
 * DEV · TestFlight build-12 feedback review (`/qa/feedback-b12`).
 *
 * One card per tester screenshot from
 * `docs/user-feedback/2026-09-14-testflight-b12.md` — Spencer's eyeball
 * pass on this wave's fixes. Each card carries a local three-state verdict
 * (👍 ship / 🔁 change / 💬 note) persisted to localStorage, exportable as
 * markdown lines to hand back to an agent. Screenshot thumbnails are served
 * dev-only via Vite's `/@fs/` passthrough — prod builds render a
 * placeholder instead (the shots don't ship with the app bundle).
 */

const SHOTS_DIR =
  "/Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/feedback-b12/docs/user-feedback/2026-09-05-testflight-shots";

function shotUrl(shot: string): string | null {
  if (!import.meta.env.DEV) return null;
  return `/@fs/${SHOTS_DIR}/${shot}.jpg`;
}

type Verdict = "" | "ship" | "change" | "note";
type VerdictState = { verdict: Verdict; note: string };
type VerdictMap = Record<number, VerdictState>;

const STORAGE_KEY = "lingo:qa-feedback-b12-verdicts:v1";

function loadVerdicts(): VerdictMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as VerdictMap;
    const out: VerdictMap = {};
    for (const [k, v] of Object.entries(parsed ?? {})) {
      out[Number(k)] = { verdict: v?.verdict ?? "", note: v?.note ?? "" };
    }
    return out;
  } catch {
    return {};
  }
}

const VERDICT_OPTIONS: { value: Verdict; label: string; active: string }[] = [
  { value: "ship", label: "👍 ship", active: "border-success text-success" },
  { value: "change", label: "🔁 change", active: "border-warning text-warning" },
  { value: "note", label: "💬 note", active: "border-accent text-accent" },
];

const LANES: FeedbackLane[] = ["A", "B", "C", "D", "E", "F", "G"];

const TODOS: string[] = [
  "Play Store package id + account type",
  "Play Console account ($25)",
  "12 closed-test testers for 14 days",
  "Upload keystore via keytool, kept outside the repo, custody decided",
  "Bump package.json version before first Play upload",
  "Store copy, support email, account-deletion URL, feature graphic, Data-safety form",
  "`aws sso login --sso-session lingo` for the live alarm/budget check",
  "Hand Trevor TREVOR-READ-ME-TERRAFORM.md",
  "`auth0 login` if a reviewer demo account is needed",
  "Cut TestFlight build 13 and re-check sign-up on it",
  'Display-name decision (Info.plist "Open Lingo" vs ASC "Linguiversal - Open Lingo"), MAC_OS version in ASC, iPad claim',
  "Device pass + Payton's KO walk",
  "#63 MCQ 3-option cap (built this wave, review)",
  "#80 FSRS seeding curve (built this wave, review)",
  "#74/#76 closest-gloss authoring policy (applied to m30 this wave, review)",
];

type Filter = { kind: "all" } | { kind: "needs-spencer" } | { kind: "lane"; lane: FeedbackLane } | { kind: "status"; status: string };

function filterMatches(item: FeedbackB12Item, filter: Filter): boolean {
  switch (filter.kind) {
    case "all":
      return true;
    case "needs-spencer":
      return item.needsSpencer;
    case "lane":
      return item.lane === filter.lane;
    case "status":
      return item.status === filter.status;
  }
}

function filterKey(filter: Filter): string {
  if (filter.kind === "lane") return `lane:${filter.lane}`;
  if (filter.kind === "status") return `status:${filter.status}`;
  return filter.kind;
}

export default function FeedbackB12ReviewPage() {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const [verdicts, setVerdicts] = useState<VerdictMap>(() => loadVerdicts());
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [todosOpen, setTodosOpen] = useState(false);
  const [exportedMd, setExportedMd] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const setVerdict = (n: number, patch: Partial<VerdictState>) => {
    setVerdicts((v) => {
      const prev: VerdictState = v[n] ?? { verdict: "", note: "" };
      const next: VerdictMap = { ...v, [n]: { ...prev, ...patch } };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage full/unavailable — verdicts stay in memory this session */
      }
      return next;
    });
  };

  const counts = useMemo(() => {
    const c = { built: 0, open: 0, fixed: 0, needsSpencer: 0 };
    for (const item of FEEDBACK_B12_ITEMS) {
      if (item.status === "built") c.built += 1;
      if (item.status === "open" || item.status === "discuss") c.open += 1;
      if (item.status === "fixed") c.fixed += 1;
      if (item.needsSpencer) c.needsSpencer += 1;
    }
    return c;
  }, []);

  const visible = useMemo(
    () => FEEDBACK_B12_ITEMS.filter((item) => filterMatches(item, filter)),
    [filter],
  );

  const filters: Filter[] = [
    { kind: "all" },
    { kind: "needs-spencer" },
    ...LANES.map((lane) => ({ kind: "lane" as const, lane })),
    { kind: "status", status: "open" },
    { kind: "status", status: "built" },
    { kind: "status", status: "fixed" },
    { kind: "status", status: "discuss" },
  ];

  const filterLabel = (f: Filter): string => {
    if (f.kind === "all") return "All";
    if (f.kind === "needs-spencer") return "Needs your eyes";
    if (f.kind === "lane") return `Lane ${f.lane}`;
    return f.status[0].toUpperCase() + f.status.slice(1);
  };

  const exportVerdicts = () => {
    const lines: string[] = [];
    for (const item of FEEDBACK_B12_ITEMS) {
      const v = verdicts[item.n];
      if (!v || (!v.verdict && !v.note.trim())) continue;
      const verdictWord = v.verdict || "(no verdict)";
      const note = v.note.trim();
      lines.push(`#${item.n} ${verdictWord}${note ? ` ${note}` : ""}`);
    }
    const md = lines.join("\n");
    setExportedMd(md);
    void navigator.clipboard?.writeText(md).then(
      () => {
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2000);
      },
      () => undefined,
    );
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · QA feedback review
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            TestFlight b12 feedback — review
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded border border-border bg-surface-muted px-2 py-1 font-semibold">
              {counts.built} built
            </span>
            <span className="rounded border border-border bg-surface-muted px-2 py-1 font-semibold">
              {counts.open} open
            </span>
            <span className="rounded border border-border bg-surface-muted px-2 py-1 font-semibold">
              {counts.fixed} fixed
            </span>
            <span className="rounded border border-accent bg-surface-muted px-2 py-1 font-semibold text-accent">
              {counts.needsSpencer} need your eyes
            </span>
          </div>

          <div className="mt-4 rounded border border-border">
            <button
              type="button"
              onClick={() => setTodosOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold"
            >
              <span>Spencer's open TO-DOs ({TODOS.length})</span>
              <span className="text-text-muted">{todosOpen ? "▲" : "▼"}</span>
            </button>
            {todosOpen && (
              <ol className="list-decimal space-y-1 px-8 pb-3 text-xs text-text-secondary">
                {TODOS.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {filters.map((f) => {
              const active = filterKey(f) === filterKey(filter);
              return (
                <button
                  key={filterKey(f)}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded border px-2 py-1 text-xs font-semibold ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-secondary hover:bg-surface-muted"
                  }`}
                >
                  {filterLabel(f)}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={exportVerdicts}
              className="rounded border border-accent px-2 py-1 text-xs font-semibold text-accent hover:bg-surface-muted"
            >
              {copyState === "copied" ? "Copied!" : "Export verdicts as markdown"}
            </button>
          </div>
          {exportedMd !== null && (
            <textarea
              readOnly
              value={exportedMd || "(no verdicts marked yet)"}
              rows={Math.min(12, Math.max(3, exportedMd.split("\n").length + 1))}
              className="mt-2 w-full rounded border border-border bg-surface-muted p-2 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
          )}
        </header>

        <div className="space-y-4">
          {visible.map((item) => (
            <FeedbackCard
              key={item.n}
              item={item}
              langId={langId}
              verdict={verdicts[item.n] ?? { verdict: "", note: "" }}
              onVerdict={(patch) => setVerdict(item.n, patch)}
            />
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-text-muted">No items match this filter.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({
  item,
  langId,
  verdict,
  onVerdict,
}: {
  item: FeedbackB12Item;
  langId: string;
  verdict: VerdictState;
  onVerdict: (patch: Partial<VerdictState>) => void;
}) {
  const url = shotUrl(item.shot);
  return (
    <div
      id={`row-${item.n}`}
      className="rounded border border-border bg-surface p-3"
    >
      <div className="flex gap-3">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
            <img
              src={url}
              alt={`Shot ${item.shot}`}
              className="h-20 w-20 rounded border border-border object-cover"
            />
          </a>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-dashed border-border text-[10px] text-text-muted">
            shot {item.shot}
            <br />
            (dev only)
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-text-secondary">
            #{item.n} · build {item.build} · {item.tester} · {item.cls} · lane {item.lane}
          </div>
          <div className="mt-0.5 text-xs text-text-muted">{item.screen}</div>
        </div>
      </div>

      <blockquote className="mt-2 border-l-2 border-border pl-2 text-sm italic text-text-primary">
        “{item.verbatim}”
      </blockquote>

      <div className="mt-2 text-sm">
        <span className="font-semibold text-text-secondary">What we did: </span>
        <span className="text-text-primary">{item.decision}</span>
      </div>

      {item.eyeball && (
        <div className="mt-1 text-sm">
          <span className="font-semibold text-text-secondary">What to eyeball: </span>
          <span className="text-text-primary">{item.eyeball}</span>
        </div>
      )}

      {item.link && (
        <Link
          to={item.link}
          className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
        >
          Open in app →
        </Link>
      )}
      {!item.link && (
        <span className="mt-2 block text-xs text-text-muted">
          No app link wired yet (lang: {langId}).
        </span>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {VERDICT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onVerdict({ verdict: verdict.verdict === opt.value ? "" : opt.value })
            }
            className={`rounded border px-2 py-1 text-xs font-semibold ${
              verdict.verdict === opt.value
                ? opt.active
                : "border-border text-text-secondary hover:bg-surface-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {verdict.verdict === "note" && (
        <textarea
          value={verdict.note}
          onChange={(e) => onVerdict({ note: e.target.value })}
          placeholder="Note…"
          rows={2}
          className="mt-2 w-full rounded border border-border bg-background p-1.5 text-xs"
        />
      )}
    </div>
  );
}
