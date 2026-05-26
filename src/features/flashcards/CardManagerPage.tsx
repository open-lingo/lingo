import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useApi } from "@/shared/api";
import { FilterBar, DataTable } from "@/shared/components/data";
import { Icon } from "@/shared/components/Icon";
import { useCardManagerData, type ManagedCard } from "./useCardManagerData";
import {
  cardEarliestDueDate,
  cardLastReviewDate,
  cardMaxDifficulty,
} from "./engine";

const CARD_MANAGER_TAB = "tab";
const TAB_ALL = "all";
const TAB_MY_VOCAB = "vocab";

type StatusFilter = "all" | "due" | "new" | "learning" | "buried";
type SortKey = "dueDate" | "ease" | "deck" | "lastReview" | "front";

function isVocabDeck(deckId: string): boolean {
  return deckId.startsWith("vocab-");
}

export function CardManagerPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { decks: decksApi } = useApi();
  const languageId = language?.id ?? "ko";
  const [searchParams] = useSearchParams();
  const tab = searchParams.get(CARD_MANAGER_TAB) === TAB_MY_VOCAB ? TAB_MY_VOCAB : TAB_ALL;

  const {
    cards,
    decks,
    isLoading,
    updateDueDate,
    handleBury,
    handleUnbury,
    handleReset,
    refresh,
  } = useCardManagerData(languageId);

  const [deckFilter, setDeckFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingDue, setEditingDue] = useState<string | null>(null);
  const [editingDueValue, setEditingDueValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editVocabLoading, setEditVocabLoading] = useState(false);

  const vocabCards = useMemo(
    () => cards.filter((m) => isVocabDeck(m.deckId)),
    [cards]
  );

  const vocabDeckId = vocabCards[0]?.deckId;

  const handleEditMyVocab = async () => {
    if (vocabDeckId) {
      navigate(langPath(`community/decks/${vocabDeckId}`));
      return;
    }
    if (!decksApi) return;
    setEditVocabLoading(true);
    try {
      const deck = await decksApi.getMyVocabDeck(languageId);
      navigate(langPath(`community/decks/${deck.id}`));
    } finally {
      setEditVocabLoading(false);
    }
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
    let list = tab === TAB_MY_VOCAB ? vocabCards : cards;

    if (deckFilter !== "all") {
      list = list.filter((m) => m.deckId === deckFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((m) => m.status === statusFilter);
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
  }, [tab, cards, vocabCards, deckFilter, statusFilter, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key);
  };

  const startEditDue = (mc: ManagedCard) => {
    setEditingDue(mc.card.id);
    setEditingDueValue(
      mc.state ? cardEarliestDueDate(mc.state) : new Date().toISOString().slice(0, 10),
    );
  };

  const saveDueEdit = () => {
    if (editingDue && editingDueValue) {
      updateDueDate(editingDue, editingDueValue);
      setEditingDue(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-text-muted">
        {t("flashcards.cardManager.loading", "Loading…")}
      </div>
    );
  }

  const displayCards = tab === TAB_MY_VOCAB ? vocabCards : cards;
  const isEmpty = displayCards.length === 0;

  if (cards.length === 0) {
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
        <div className="rounded-xl border border-border bg-surface-muted p-12 text-center">
          <p className="text-text-secondary">
            {t("flashcards.cardManager.noCards", "No cards to manage. Subscribe to a deck to get started.")}
          </p>
          <Link
            to={langPath("community/explore")}
            className="mt-4 inline-block text-accent"
          >
            {t("flashcards.cardManager.browseDecks", "Browse community decks")}
          </Link>
        </div>
      </div>
    );
  }

  if (tab === TAB_MY_VOCAB && isEmpty) {
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
        <div className="flex gap-2">
          <Link
            to={langPath("practice/flashcards/cards")}
            className="rounded-lg px-3 py-2 text-sm font-medium transition bg-surface-muted text-text-primary hover:bg-surface-muted/80"
          >
            {t("flashcards.cardManager.tabAll", "All cards")}
          </Link>
          <Link
            to={`${langPath("practice/flashcards/cards")}?${CARD_MANAGER_TAB}=${TAB_MY_VOCAB}`}
            className="rounded-lg px-3 py-2 text-sm font-medium transition bg-accent text-white"
          >
            {t("flashcards.cardManager.tabMyVocab", "My Vocab")}
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface-muted p-12 text-center">
          <p className="text-text-secondary">
            {t("flashcards.cardManager.noVocabYet", "No vocab words yet. Add words from stories while reading.")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleEditMyVocab}
              disabled={editVocabLoading}
              className="inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted"
            >
              {editVocabLoading
                ? t("flashcards.cardManager.loading", "Loading…")
                : t("flashcards.cardManager.editMyVocab", "Edit My Vocab")}
            </button>
            <Link
              to={langPath("practice/stories")}
              className="inline-block text-accent"
            >
              {t("flashcards.cardManager.readStories", "Read stories")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <Link
            to={langPath("practice/flashcards/cards")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === TAB_ALL ? "bg-accent text-white" : "bg-surface-muted text-text-primary hover:bg-surface-muted/80"
            }`}
          >
            {t("flashcards.cardManager.tabAll", "All cards")}
          </Link>
          <Link
            to={`${langPath("practice/flashcards/cards")}?${CARD_MANAGER_TAB}=${TAB_MY_VOCAB}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === TAB_MY_VOCAB ? "bg-accent text-white" : "bg-surface-muted text-text-primary hover:bg-surface-muted/80"
            }`}
          >
            {t("flashcards.cardManager.tabMyVocab", "My Vocab")}
          </Link>
        </div>
        {(tab === TAB_MY_VOCAB || vocabCards.length > 0) && (
          <button
            type="button"
            onClick={handleEditMyVocab}
            disabled={editVocabLoading}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            {editVocabLoading
              ? t("flashcards.cardManager.loading", "Loading…")
              : t("flashcards.cardManager.editMyVocab", "Edit My Vocab")}
          </button>
        )}
      </div>

      <FilterBar
        filters={[
          {
            label: t("flashcards.cardManager.filterDeck", "Deck"),
            value: deckFilter,
            options: [
              { label: t("flashcards.cardManager.allDecks", "All decks"), value: "all" },
              ...(tab === TAB_MY_VOCAB ? decks.filter((d) => isVocabDeck(d.id)) : decks).map((d) => ({ label: d.name, value: d.id })),
            ],
            onChange: setDeckFilter,
          },
          {
            label: t("flashcards.cardManager.filterStatus", "Status"),
            value: statusFilter,
            options: [
              { label: t("flashcards.cardManager.allStatuses", "All"), value: "all" },
              { label: t("flashcards.cardManager.statusDue", "Due"), value: "due" },
              { label: t("flashcards.cardManager.statusNew", "New"), value: "new" },
              { label: t("flashcards.cardManager.statusLearning", "Learning"), value: "learning" },
              { label: t("flashcards.cardManager.statusBuried", "Buried"), value: "buried" },
            ],
            onChange: (v) => setStatusFilter(v as StatusFilter),
          },
        ]}
        search={{
          label: t("flashcards.cardManager.search", "Search"),
          placeholder: t("flashcards.cardManager.searchPlaceholder", "Front or back…"),
          value: search,
          onChange: setSearch,
          onRefresh: refresh,
        }}
      />

      <p className="text-sm text-text-muted">
        {t("flashcards.cardManager.showing", "Showing {{count}} of {{total}} cards", { count: filtered.length, total: displayCards.length })}
      </p>

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
            render: (mc) =>
              editingDue === mc.card.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={editingDueValue}
                    onChange={(e) => setEditingDueValue(e.target.value)}
                    className="w-32 rounded border border-border bg-surface px-1.5 py-0.5 text-sm text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={saveDueEdit}
                    className="text-success"
                  >
                    <Icon name="check" size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDue(null)}
                    className="text-text-muted"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEditDue(mc)}
                  className="text-left text-text-secondary hover:underline"
                >
                  {mc.state ? cardEarliestDueDate(mc.state) : "—"}
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
                  mc.status === "due"
                    ? "bg-warning/15 text-warning"
                    : mc.status === "buried"
                    ? "bg-surface-muted text-text-secondary"
                    : mc.status === "new"
                    ? "bg-info/15 text-info"
                    : "bg-success/15 text-success"
                }`}
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
                {isVocabDeck(mc.deckId) && (
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
        rows={filtered}
        getRowKey={(mc) => mc.card.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(k) => toggleSort(k as SortKey)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}
