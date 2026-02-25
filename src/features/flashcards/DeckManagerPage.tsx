import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { FilterBar, DataTable } from "@/shared/components/data";
import { Icon } from "@/shared/components/Icon";
import { useDeckManagerData, type ManagedDeck } from "./useDeckManagerData";
import { getLanguageConfig } from "@/shared/domain/languageConfig";

type SortKey = "name" | "cards" | "newPerDay" | "order";

export function DeckManagerPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const languageId = language?.id ?? "ko";

  const {
    decks,
    isLoading,
    refresh,
    updateSubscription,
  } = useDeckManagerData(languageId);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingNewPerDay, setEditingNewPerDay] = useState<string | null>(null);
  const [editingNewPerDayValue, setEditingNewPerDayValue] = useState("");

  const filtered = useMemo(() => {
    let list = decks;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "cards":
          cmp = a.cardCount - b.cardCount;
          break;
        case "newPerDay":
          cmp =
            (a.subscription?.newCardsPerDay ?? 5) -
            (b.subscription?.newCardsPerDay ?? 5);
          break;
        case "order":
          cmp = (a.subscription?.newCardOrder ?? "ordered").localeCompare(
            b.subscription?.newCardOrder ?? "ordered"
          );
          break;
        default:
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [decks, search, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key as SortKey);
  };

  const startEditNewPerDay = (d: ManagedDeck) => {
    setEditingNewPerDay(d.id);
    setEditingNewPerDayValue(
      String(d.subscription?.newCardsPerDay ?? 5)
    );
  };

  const saveNewPerDay = async () => {
    if (editingNewPerDay && editingNewPerDayValue) {
      const n = Math.max(1, Math.min(99, parseInt(editingNewPerDayValue, 10) || 5));
      await updateSubscription(editingNewPerDay, { newCardsPerDay: n });
      setEditingNewPerDay(null);
    }
  };

  const languageName = getLanguageConfig(languageId)?.name ?? languageId;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        {t("flashcards.deckManager.loading", "Loading…")}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("flashcards.deckManager.title", "Deck Manager")}
          </h1>
          <Link
            to={langPath("practice/flashcards")}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("flashcards.backToHub")}
          </Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-gray-600 dark:text-gray-400">
            {t("flashcards.deckManager.noDecks", "No decks yet. Subscribe to a deck to manage settings.")}
          </p>
          <Link
            to={langPath("community/explore")}
            className="mt-4 inline-block text-green-600 dark:text-green-400"
          >
            {t("flashcards.deckManager.browseDecks", "Browse community decks")}
          </Link>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: "name",
      label: t("flashcards.deckManager.colName", "Deck"),
      sortable: true,
      render: (d: ManagedDeck) => (
        <Link
          to={langPath("practice/flashcards")}
          className="font-medium text-gray-900 hover:underline dark:text-white"
        >
          {d.name}
        </Link>
      ),
    },
    {
      key: "cards",
      label: t("flashcards.deckManager.colCards", "Cards"),
      sortable: true,
      render: (d: ManagedDeck) => (
        <span className="text-gray-600 dark:text-gray-400">{d.cardCount}</span>
      ),
    },
    {
      key: "newPerDay",
      label: t("flashcards.deckManager.colNewPerDay", "New/day"),
      sortable: true,
      render: (d: ManagedDeck) =>
        editingNewPerDay === d.id ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={99}
              value={editingNewPerDayValue}
              onChange={(e) => setEditingNewPerDayValue(e.target.value)}
              className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={saveNewPerDay}
              className="text-green-600 dark:text-green-400"
            >
              <Icon name="check" size={16} />
            </button>
            <button
              type="button"
              onClick={() => setEditingNewPerDay(null)}
              className="text-gray-500"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startEditNewPerDay(d)}
            className="text-left text-gray-700 hover:underline dark:text-gray-300"
          >
            {d.subscription?.newCardsPerDay ?? 5}
          </button>
        ),
    },
    {
      key: "order",
      label: t("flashcards.deckManager.colOrder", "Order"),
      sortable: true,
      render: (d: ManagedDeck) => {
        const order = d.subscription?.newCardOrder ?? "ordered";
        return (
          <select
            value={order}
            onChange={(e) =>
              updateSubscription(d.id, {
                newCardOrder: e.target.value as "ordered" | "shuffled",
              })
            }
            className="rounded border border-gray-300 px-2 py-0.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="ordered">
              {t("flashcards.deckManager.orderOrdered", "Ordered")}
            </option>
            <option value="shuffled">
              {t("flashcards.deckManager.orderShuffled", "Shuffled")}
            </option>
          </select>
        );
      },
    },
    {
      key: "enabled",
      label: t("flashcards.deckManager.colEnabled", "Active"),
      sortable: false,
      render: (d: ManagedDeck) => (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={d.subscription?.enabled !== false}
            onChange={(e) =>
              updateSubscription(d.id, { enabled: e.target.checked })
            }
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </label>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("flashcards.deckManager.title", "Deck Manager")}
          </h1>
          <Link
            to={langPath("practice/flashcards")}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("flashcards.backToHub")}
          </Link>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("flashcards.deckManager.refresh", "Refresh")}
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("flashcards.deckManager.subtitle", "Manage subscription settings for {{language}} decks.", { language: languageName })}
      </p>

      <FilterBar
        search={{
          label: t("flashcards.deckManager.search", "Search"),
          placeholder: t("flashcards.deckManager.searchPlaceholder", "Deck name…"),
          value: search,
          onChange: setSearch,
        }}
        filters={[]}
      />

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("flashcards.deckManager.showing", "Showing {{count}} of {{total}} decks", { count: filtered.length, total: decks.length })}
      </p>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(d) => d.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        emptyMessage={t("flashcards.deckManager.noResults", "No decks match")}
      />
    </div>
  );
}
