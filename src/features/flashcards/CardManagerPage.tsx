import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
import { DataTable } from "@/shared/components/data";
import { Icon } from "@/shared/components/Icon";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { FacetSidebar, type Facet } from "@/shared/components/ui/FacetSidebar";
import { Pagination } from "@/shared/components/ui/Pagination";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { useCardManagerData, type ManagedCard } from "./useCardManagerData";
import {
  cardEarliestDueDate,
  cardLastReviewDate,
  cardMaxDifficulty,
} from "./engine";

const CARD_MANAGER_TAB = "tab";
const TAB_ALL = "all";
const TAB_MY_VOCAB = "vocab";

const PAGE_SIZE = 25;

type StatusFilter = "all" | "due" | "new" | "learning" | "buried" | "leech";
const STATUS_VALUES: StatusFilter[] = ["due", "new", "learning", "buried", "leech"];
type SortKey = "dueDate" | "ease" | "deck" | "lastReview" | "front";

function isVocabDeck(deckId: string): boolean {
  return deckId.startsWith("vocab-");
}

export function CardManagerPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const communityOn = isCommunityEnabled(flags);
  const languageId = language?.id ?? "ko";
  const [searchParams] = useSearchParams();
  const tab = searchParams.get(CARD_MANAGER_TAB) === TAB_MY_VOCAB ? TAB_MY_VOCAB : TAB_ALL;

  const {
    cards,
    decks,
    isLoading,
    updateModalityDates,
    handleBury,
    handleUnbury,
    handleReset,
    refresh,
  } = useCardManagerData(languageId);

  // Faceted multi-select selections: facetId -> selected values.
  const [facetSelections, setFacetSelections] = useState<Record<string, string[]>>({
    deck: [],
    status: [],
  });
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [modalityEditCard, setModalityEditCard] = useState<ManagedCard | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const deckSel = facetSelections.deck ?? [];
  const statusSel = facetSelections.status ?? [];

  const toggleFacet = (facetId: string, value: string) => {
    setFacetSelections((prev) => {
      const cur = prev[facetId] ?? [];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...prev, [facetId]: next };
    });
    setPage(1);
  };
  const clearFacet = (facetId: string) => {
    setFacetSelections((prev) => ({ ...prev, [facetId]: [] }));
    setPage(1);
  };
  const clearAllFacets = () => {
    setFacetSelections({ deck: [], status: [] });
    setPage(1);
  };
  const onlyFacet = (facetId: string, value: string) => {
    setFacetSelections((prev) => ({ ...prev, [facetId]: [value] }));
    setPage(1);
  };

  const handleEditCard = (mc: ManagedCard) => {
    navigate(langPath(`community/decks/${mc.deckId}`), {
      state: { cardId: mc.card.id },
    });
  };

  const handleBatchBury = () => {
    selectedIds.forEach((id) => handleBury(id));
    setSelectedIds(new Set());
  };
  const handleBatchUnbury = () => {
    selectedIds.forEach((id) => handleUnbury(id));
    setSelectedIds(new Set());
  };
  const handleBatchReset = () => {
    selectedIds.forEach((id) => handleReset(id));
    setSelectedIds(new Set());
  };

  const filtered = useMemo(() => {
    let list = cards;

    if (deckSel.length > 0) {
      list = list.filter((m) => deckSel.includes(m.deckId));
    }
    if (statusSel.length > 0) {
      list = list.filter((m) => statusSel.includes(m.status));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.card.front.toLowerCase().includes(q) ||
          m.card.back.toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "dueDate":
          cmp = (a.state ? cardEarliestDueDate(a.state) : "9999-99-99").localeCompare(
            b.state ? cardEarliestDueDate(b.state) : "9999-99-99"
          );
          break;
        case "ease":
          // FSRS-6: sort by per-card difficulty (1-10, higher = harder).
          // With modality split we sort by the harder of the two directions
          // so a card surfaces while either side is still struggling.
          // The "ease" sort key is kept for UI back-compat.
          cmp = (a.state ? cardMaxDifficulty(a.state) : 0) -
                (b.state ? cardMaxDifficulty(b.state) : 0);
          break;
        case "deck":
          cmp = a.deckName.localeCompare(b.deckName);
          break;
        case "lastReview":
          cmp = (a.state ? cardLastReviewDate(a.state) : "").localeCompare(
            b.state ? cardLastReviewDate(b.state) : ""
          );
          break;
        case "front":
          cmp = a.card.front.localeCompare(b.card.front);
          break;
        default:
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [cards, deckSel, statusSel, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE),
    [filtered, clampedPage],
  );

  // Keep page in range if filters shrink the list.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-text-muted">
        {t("flashcards.cardManager.loading", "Loading…")}
      </div>
    );
  }

  if (cards.length === 0 && tab === TAB_ALL) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("flashcards.cardManager.title", "Card Manager")}
          </h1>
          <Link
            to={langPath("practice/flashcards")}
            className="mt-1 block text-sm text-text-secondary hover:text-text-primary"
          >
            <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("flashcards.backToHub")}
          </Link>
        </div>
        <div className="rounded-card border border-border bg-surface-muted p-12 text-center">
          <p className="text-text-secondary">
            {t("flashcards.cardManager.noCards", "No cards to manage. Subscribe to a deck to get started.")}
          </p>
          {communityOn ? (
            <Link
              to={langPath("community/explore")}
              className="mt-4 inline-block text-accent"
            >
              {t("flashcards.cardManager.browseDecks", "Browse community decks")}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  // Tab header — shared across All / My Vocab.
  const header = (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("flashcards.cardManager.title", "Card Manager")}
      </h1>
      <Link
        to={langPath("practice/flashcards")}
        className="mt-1 block text-sm text-text-muted hover:text-text-primary"
      >
        <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("flashcards.backToHub")}
      </Link>
    </div>
  );

  const tabSwitcher = (
    <SegmentedControl<typeof TAB_ALL | typeof TAB_MY_VOCAB>
      value={tab}
      ariaLabel={t("flashcards.cardManager.tabAll", "All cards")}
      onChange={(next) => {
        navigate(
          next === TAB_MY_VOCAB
            ? `${langPath("practice/flashcards/cards")}?${CARD_MANAGER_TAB}=${TAB_MY_VOCAB}`
            : langPath("practice/flashcards/cards"),
        );
      }}
      options={[
        { value: TAB_ALL, label: t("flashcards.cardManager.tabAll", "All cards") },
        { value: TAB_MY_VOCAB, label: t("flashcards.cardManager.tabMyVocab", "My Vocab") },
      ]}
    />
  );

  // My Vocab is a stub for now — coming soon empty state.
  if (tab === TAB_MY_VOCAB) {
    return (
      <div className="space-y-6">
        {header}
        {tabSwitcher}
        <EmptyState
          icon={<Icon name="sparkles" size={22} aria-hidden />}
          title={t("flashcards.cardManager.vocabComingTitle", "Not yet implemented")}
          description={t(
            "flashcards.cardManager.vocabComingDesc",
            "Personal vocabulary saved from stories will live here soon. For now, manage your subscribed and lesson decks under All cards.",
          )}
          action={
            <Link
              to={langPath("practice/flashcards/cards")}
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              {t("flashcards.cardManager.tabAll", "All cards")}
            </Link>
          }
        />
      </div>
    );
  }

  // Build facets for the sidebar (deck + status), with live counts.
  const deckCounts = new Map<string, number>();
  for (const m of cards) deckCounts.set(m.deckId, (deckCounts.get(m.deckId) ?? 0) + 1);
  const statusCounts = new Map<string, number>();
  for (const m of cards) statusCounts.set(m.status, (statusCounts.get(m.status) ?? 0) + 1);

  const facets: Facet[] = [
    {
      id: "deck",
      label: t("flashcards.cardManager.filterDeck", "Deck"),
      options: decks.map((d) => ({
        value: d.id,
        label: d.name,
        count: deckCounts.get(d.id) ?? 0,
      })),
    },
    {
      id: "status",
      label: t("flashcards.cardManager.filterStatus", "Status"),
      options: STATUS_VALUES.map((s) => ({
        value: s,
        label: t(
          `flashcards.cardManager.status${s.charAt(0).toUpperCase() + s.slice(1)}`,
          s,
        ),
        count: statusCounts.get(s) ?? 0,
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {header}
        {tabSwitcher}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <FacetSidebar
          className="lg:w-72"
          facets={facets}
          selections={facetSelections}
          onToggle={toggleFacet}
          onClear={clearFacet}
          onClearAll={clearAllFacets}
          onOnly={onlyFacet}
          search={search}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(1);
          }}
          searchPlaceholder={t("flashcards.cardManager.searchPlaceholder", "Front or back…")}
          clearAllLabel={t("flashcards.cardManager.clearSelection", "Clear")}
        />

        <div className="min-w-0 flex-1 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-muted">
          {t("flashcards.cardManager.showing", "Showing {{count}} of {{total}} cards", { count: filtered.length, total: cards.length })}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
        >
          <Icon name="refresh" size={14} aria-hidden />
          {t("flashcards.cardManager.refresh", "Refresh")}
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2">
          <span className="text-sm font-medium text-text-primary">
            {t("flashcards.cardManager.selectedCount", "{{count}} selected", { count: selectedIds.size })}
          </span>
          <button
            type="button"
            onClick={handleBatchBury}
            className="rounded px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-muted"
          >
            {t("flashcards.cardManager.bury", "Bury")}
          </button>
          <button
            type="button"
            onClick={handleBatchUnbury}
            className="rounded px-2 py-1 text-xs font-medium text-success hover:bg-success/10"
          >
            {t("flashcards.cardManager.unbury", "Unbury")}
          </button>
          <button
            type="button"
            onClick={handleBatchReset}
            className="rounded px-2 py-1 text-xs font-medium text-error hover:bg-error/10"
          >
            {t("flashcards.cardManager.reset", "Reset")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-muted"
          >
            {t("flashcards.cardManager.clearSelection", "Clear")}
          </button>
        </div>
      )}

      <DataTable
        columns={[
          {
            key: "front",
            label: t("flashcards.cardManager.colFront", "Front"),
            sortable: true,
            render: (mc) => (
              <span className="max-w-[200px] truncate text-text-primary">
                {mc.card.front}
              </span>
            ),
          },
          {
            key: "back",
            label: t("flashcards.cardManager.colBack", "Back"),
            sortable: false,
            render: (mc) => (
              <span className="max-w-[200px] truncate text-text-muted">
                {mc.card.back}
              </span>
            ),
          },
          {
            key: "deck",
            label: t("flashcards.cardManager.colDeck", "Deck"),
            sortable: true,
            render: (mc) => (
              <span className="text-text-muted">{mc.deckName}</span>
            ),
          },
          {
            key: "dueDate",
            label: t("flashcards.cardManager.colDue", "Due"),
            sortable: true,
            render: (mc) => (
              <button
                type="button"
                onClick={() => setModalityEditCard(mc)}
                className="text-left text-text-secondary hover:underline"
                aria-label={t("flashcards.cardManager.modalityEditTitle", "Adjust SRS dates")}
              >
                {mc.state ? formatDueHint(mc.state) : "—"}
              </button>
            ),
          },
          {
            key: "ease",
            label: t("flashcards.cardManager.colDifficulty", "Difficulty"),
            sortable: true,
            render: (mc) => {
              if (!mc.state) {
                return <span className="text-text-muted">—</span>;
              }
              const rec = mc.state.recognition.difficulty;
              const prod = mc.state.production.difficulty;
              return (
                <span
                  className="text-text-muted"
                  title={`Recognition ${rec.toFixed(1)} / Production ${prod.toFixed(1)}`}
                >
                  {Math.max(rec, prod).toFixed(1)}
                </span>
              );
            },
          },
          {
            key: "status",
            label: t("flashcards.cardManager.colStatus", "Status"),
            sortable: false,
            render: (mc) => (
              <span
                className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                  mc.status === "leech"
                    ? "bg-error/15 text-error"
                    : mc.status === "due"
                    ? "bg-warning/15 text-warning"
                    : mc.status === "buried"
                    ? "bg-surface-muted text-text-secondary"
                    : mc.status === "new"
                    ? "bg-info/15 text-info"
                    : "bg-success/15 text-success"
                }`}
                title={
                  mc.status === "leech"
                    ? t("flashcards.cardManager.leechHint", {
                        defaultValue:
                          "You've forgotten this many times — consider reformulating it (simpler, more context).",
                      })
                    : undefined
                }
              >
                {t(`flashcards.cardManager.status${mc.status.charAt(0).toUpperCase() + mc.status.slice(1)}`, mc.status)}
              </span>
            ),
          },
          {
            key: "actions",
            label: t("flashcards.cardManager.colActions", "Actions"),
            sortable: false,
            className: "text-right",
            render: (mc) => (
              <div className="flex justify-end gap-1">
                {/* Edit opens the community deck editor — dead route with the
                    community flag off, so the action hides with it. */}
                {communityOn && isVocabDeck(mc.deckId) && (
                  <button
                    type="button"
                    onClick={() => handleEditCard(mc)}
                    className="rounded px-2 py-1 text-xs font-medium text-link hover:bg-link/10"
                  >
                    {t("flashcards.cardManager.edit", "Edit")}
                  </button>
                )}
                {mc.status === "buried" ? (
                  <button
                    type="button"
                    onClick={() => handleUnbury(mc.card.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-success hover:bg-success/10"
                  >
                    {t("flashcards.cardManager.unbury", "Unbury")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBury(mc.card.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-muted"
                  >
                    {t("flashcards.cardManager.bury", "Bury")}
                  </button>
                )}
                {mc.state && (
                  <button
                    type="button"
                    onClick={() => handleReset(mc.card.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    {t("flashcards.cardManager.reset", "Reset")}
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={paged}
        getRowKey={(mc) => mc.card.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(k) => toggleSort(k as SortKey)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {filtered.length === 0 && (
        <EmptyState
          title={t("flashcards.cardManager.noMatchTitle", "No cards match")}
          description={t(
            "flashcards.cardManager.noMatchDesc",
            "Try clearing a filter or adjusting your search.",
          )}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            page={clampedPage}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel={t("flashcards.cardManager.pagination", "Card pages")}
          />
        </div>
      )}
        </div>
      </div>

      <ModalityDateModal
        card={modalityEditCard}
        onClose={() => setModalityEditCard(null)}
        onSave={(cardId, dates) => {
          updateModalityDates(cardId, dates);
          setModalityEditCard(null);
        }}
      />
    </div>
  );
}

/**
 * Compact label for the Due column: "YYYY-MM-DD (R)" or "(P)" indicating
 * which modality drives the earliest due date. When the two modality
 * dueDates are equal, just shows the date.
 */
function formatDueHint(state: {
  recognition: { dueDate: string };
  production: { dueDate: string };
}): string {
  const r = state.recognition.dueDate;
  const p = state.production.dueDate;
  if (r === p) return r;
  return r < p ? `${r} (R)` : `${p} (P)`;
}

type ModalityDates = {
  recognitionDue: string;
  recognitionLastReview: string;
  productionDue: string;
  productionLastReview: string;
};

type ModalityDateModalProps = {
  card: ManagedCard | null;
  onClose: () => void;
  onSave: (cardId: string, dates: Partial<ModalityDates>) => void;
};

function ModalityDateModal({ card, onClose, onSave }: ModalityDateModalProps) {
  const { t } = useTranslation();
  const open = card !== null;

  // Snapshot the initial values from the card the modal opens with.
  const initial = useMemo<ModalityDates>(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (!card?.state) {
      return {
        recognitionDue: today,
        recognitionLastReview: "",
        productionDue: today,
        productionLastReview: "",
      };
    }
    return {
      recognitionDue: card.state.recognition.dueDate,
      recognitionLastReview: card.state.recognition.lastReviewDate,
      productionDue: card.state.production.dueDate,
      productionLastReview: card.state.production.lastReviewDate,
    };
  }, [card]);

  const [values, setValues] = useState<ModalityDates>(initial);

  // Re-seed when the modal re-opens for a different card.
  useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);

  if (!card) return null;

  const handleSave = () => {
    const patch: Partial<ModalityDates> = {};
    if (values.recognitionDue !== initial.recognitionDue) {
      patch.recognitionDue = values.recognitionDue;
    }
    if (values.recognitionLastReview !== initial.recognitionLastReview) {
      patch.recognitionLastReview = values.recognitionLastReview;
    }
    if (values.productionDue !== initial.productionDue) {
      patch.productionDue = values.productionDue;
    }
    if (values.productionLastReview !== initial.productionLastReview) {
      patch.productionLastReview = values.productionLastReview;
    }
    onSave(card.card.id, patch);
  };

  const labelClass =
    "text-xs font-medium uppercase tracking-wide text-text-muted block mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t("flashcards.cardManager.modalityEditTitle", "Adjust SRS dates")}
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {t("flashcards.cardManager.cancel", "Cancel")}
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            {t("flashcards.cardManager.save", "Save")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <div className="text-base font-semibold text-text-primary">
            {card.card.front}
          </div>
          <div className="mt-0.5 text-sm text-text-muted">
            {card.card.back}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {t("flashcards.cardManager.recognition", "Recognition")}
            </h3>
            <div>
              <label className={labelClass} htmlFor="recognition-due">
                {t("flashcards.cardManager.nextDue", "Next due")}
              </label>
              <input
                id="recognition-due"
                type="date"
                value={values.recognitionDue}
                onChange={(e) =>
                  setValues((v) => ({ ...v, recognitionDue: e.target.value }))
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="recognition-last">
                {t("flashcards.cardManager.lastReviewed", "Last reviewed")}
              </label>
              <input
                id="recognition-last"
                type="date"
                value={values.recognitionLastReview}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    recognitionLastReview: e.target.value,
                  }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {t("flashcards.cardManager.production", "Production")}
            </h3>
            <div>
              <label className={labelClass} htmlFor="production-due">
                {t("flashcards.cardManager.nextDue", "Next due")}
              </label>
              <input
                id="production-due"
                type="date"
                value={values.productionDue}
                onChange={(e) =>
                  setValues((v) => ({ ...v, productionDue: e.target.value }))
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="production-last">
                {t("flashcards.cardManager.lastReviewed", "Last reviewed")}
              </label>
              <input
                id="production-last"
                type="date"
                value={values.productionLastReview}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    productionLastReview: e.target.value,
                  }))
                }
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
