import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterBar, DataTable, type DataTableColumn } from "@/shared/components/data";
import { Icon } from "@/shared/components/Icon";
import { listAllLessons, type LessonRow } from "./lessonEnumeration";
import { deleteDraft, notifyDraftChange, subscribeDrafts } from "./lessonDraftStore";

type LangFilter = "all" | "ja" | "ko";
type ModuleFilter = string;
type DraftFilter = "all" | "drafts" | "untouched";

export function AdminLessonsListPage() {
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [lang, setLang] = useState<LangFilter>("all");
  const [mod, setMod] = useState<ModuleFilter>("all");
  const [draftFilter, setDraftFilter] = useState<DraftFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("ordinal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const refresh = () => setRows(listAllLessons());

  useEffect(() => {
    refresh();
    return subscribeDrafts(refresh);
  }, []);

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.moduleId);
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (lang !== "all" && r.languageId !== lang) return false;
      if (mod !== "all" && r.moduleId !== mod) return false;
      if (draftFilter === "drafts" && !r.hasDraft) return false;
      if (draftFilter === "untouched" && r.hasDraft) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)
      );
    });
    const sorted = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
    return sorted;
  }, [rows, lang, mod, draftFilter, search, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const columns: DataTableColumn<LessonRow>[] = [
    {
      key: "ordinal",
      label: "#",
      sortable: true,
      render: (r) => (
        <span className="font-mono text-[11px] tabular-nums text-text-muted">
          {Number.isFinite(r.ordinal) ? r.ordinal : "—"}
        </span>
      ),
      className: "w-12",
    },
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (r) => (
        <Link
          to={`/admin/content/lessons/${encodeURIComponent(r.id)}`}
          className="font-mono text-xs text-accent hover:underline"
        >
          {r.id}
        </Link>
      ),
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (r) => (
        <span className="text-text-primary">{r.title || <em>(untitled)</em>}</span>
      ),
    },
    {
      key: "languageId",
      label: "Lang",
      sortable: true,
      render: (r) => (
        <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs uppercase text-text-secondary">
          {r.languageId}
        </span>
      ),
    },
    {
      key: "moduleId",
      label: "Module",
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs text-text-secondary">{r.moduleId}</span>
      ),
    },
    {
      key: "stepCount",
      label: "Steps",
      sortable: true,
      render: (r) => (
        <span className="tabular-nums text-text-secondary">{r.stepCount}</span>
      ),
    },
    {
      key: "kind",
      label: "Kind",
      sortable: true,
      render: (r) => (
        <span className="text-xs text-text-muted">{r.kind ?? "lesson"}</span>
      ),
    },
    {
      key: "hasDraft",
      label: "State",
      sortable: true,
      render: (r) =>
        r.hasDraft ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            <Icon name="pencil" className="h-3 w-3" />
            draft
          </span>
        ) : (
          <span className="text-xs text-text-muted">source</span>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/admin/content/lessons/${encodeURIComponent(r.id)}`}
            className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-surface-muted"
          >
            Edit
          </Link>
          {r.hasDraft && (
            <button
              onClick={() => {
                if (confirm(`Discard local draft for ${r.id}?`)) {
                  deleteDraft(r.id);
                  notifyDraftChange();
                }
              }}
              className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-muted hover:bg-surface-muted"
              title="Discard local draft (source unchanged)"
            >
              Discard
            </button>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  const draftCount = rows.filter((r) => r.hasDraft).length;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-text-primary">
            Lessons
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Edit lesson content locally. Drafts live in your browser until
            exported. Source files are not touched.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span className="tabular-nums">
            <strong className="text-text-primary">{rows.length}</strong> total
          </span>
          <span className="tabular-nums">
            <strong className="text-warning">
              {draftCount}
            </strong>{" "}
            drafted
          </span>
        </div>
      </header>

      <FilterBar
        filters={[
          {
            label: "Language",
            value: lang,
            options: [
              { label: "All", value: "all" },
              { label: "Japanese", value: "ja" },
              { label: "Korean", value: "ko" },
            ],
            onChange: (v) => setLang(v as LangFilter),
          },
          {
            label: "Module",
            value: mod,
            options: moduleOptions.map((m) => ({
              label: m === "all" ? "All" : m,
              value: m,
            })),
            onChange: setMod,
          },
          {
            label: "State",
            value: draftFilter,
            options: [
              { label: "All", value: "all" },
              { label: "Drafts only", value: "drafts" },
              { label: "Untouched", value: "untouched" },
            ],
            onChange: (v) => setDraftFilter(v as DraftFilter),
          },
        ]}
        search={{
          label: "Search",
          placeholder: "id or title…",
          value: search,
          onChange: setSearch,
          onRefresh: refresh,
        }}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(r) => r.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        emptyMessage="No lessons match these filters."
      />
    </div>
  );
}
