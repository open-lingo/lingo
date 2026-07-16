import { useState, useMemo, useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
import { FilterBar, DataTable, type DataTableColumn } from "@/shared/components/data";
import { Icon } from "@/shared/components/Icon";
import { useDeckManagerData, type ManagedDeck } from "./useDeckManagerData";
import { StudyOptionsEditor } from "./StudyOptionsEditor";
import { isLessonDeck, isMyVocabDeck } from "./deckScope";
import { getLanguageConfig } from "@/shared/domain/languageConfig";

type SortKey = "name" | "cards" | "newPerDay" | "order";

function DeckGroupSection({
  title,
  description,
  studyGroupHref,
  rows,
  columns,
  sortKey,
  sortDir,
  onSort,
  emptySection,
  t,
}: {
  title: string;
  description?: string;
  studyGroupHref?: string;
  rows: ManagedDeck[];
  columns: DataTableColumn<ManagedDeck>[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  emptySection?: ReactNode;
  t: TFunction;
}) {
  if (rows.length === 0) return emptySection ?? null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-text-muted">{description}</p>
          ) : null}
        </div>
        {studyGroupHref ? (
          <Link
            to={studyGroupHref}
            className="text-sm font-medium text-accent hover:underline"
          >
            {t("flashcards.deckManager.studyThisGroup", "Study this group")}
          </Link>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(d) => d.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        emptyMessage={t("flashcards.deckManager.noResults", "No decks match")}
      />
    </section>
  );
}

export function DeckManagerPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
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

  const vocabDecks = useMemo(
    () => filtered.filter((d) => isMyVocabDeck(d.id)),
    [filtered]
  );
  const lessonDecks = useMemo(
    () => filtered.filter((d) => isLessonDeck(d)),
    [filtered]
  );
  const otherDecks = useMemo(
    () =>
      filtered.filter((d) => !isMyVocabDeck(d.id) && !isLessonDeck(d)),
    [filtered]
  );

  const reviewBase = langPath("practice/flashcards/review");

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key as SortKey);
  };

  const startEditNewPerDay = useCallback((d: ManagedDeck) => {
    setEditingNewPerDay(d.id);
    setEditingNewPerDayValue(String(d.subscription?.newCardsPerDay ?? 5));
  }, []);

  const saveNewPerDay = useCallback(async () => {
    if (editingNewPerDay && editingNewPerDayValue) {
      const n = Math.max(1, Math.min(99, parseInt(editingNewPerDayValue, 10) || 5));
      await updateSubscription(editingNewPerDay, { newCardsPerDay: n });
      setEditingNewPerDay(null);
    }
  }, [editingNewPerDay, editingNewPerDayValue, updateSubscription]);

  const languageName = getLanguageConfig(languageId)?.name ?? languageId;

  const columns: DataTableColumn<ManagedDeck>[] = [
      {
        key: "study",
        label: t("flashcards.deckManager.colStudy", "Study"),
        sortable: false,
        render: (d: ManagedDeck) => (
          <Link
            to={`${reviewBase}?decks=${encodeURIComponent(d.id)}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            {t("flashcards.deckManager.studyDeck", "Study")}
          </Link>
        ),
      },
      {
        key: "name",
        label: t("flashcards.deckManager.colName", "Deck"),
        sortable: true,
        render: (d: ManagedDeck) => (
          <Link
            to={langPath("practice/flashcards")}
            className="font-medium text-text-primary hover:underline"
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
          <span className="text-text-muted">{d.cardCount}</span>
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
                className="w-16 rounded border border-border px-1.5 py-0.5 text-sm bg-surface text-text-primary"
              />
              <button
                type="button"
                onClick={saveNewPerDay}
                aria-label="Save new cards per day"
                className="text-success"
              >
                <Icon name="check" size={16} />
              </button>
              <button
                type="button"
                onClick={() => setEditingNewPerDay(null)}
                className="text-text-muted"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startEditNewPerDay(d)}
              className="text-left text-text-secondary hover:underline"
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
              className="rounded border border-border px-2 py-0.5 text-sm bg-surface text-text-primary"
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
              className="rounded border-border"
            />
          </label>
        ),
      },
    ];

  if (isLoading) {
    return (
      <div className="py-12 text-center text-text-muted">
        {t("flashcards.deckManager.loading", "Loading…")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-text-primary">
            {t("flashcards.deckManager.title", "Deck Manager")}
          </h1>
          <Link
            to={langPath("practice/flashcards")}
            className="text-sm text-text-muted hover:text-text-primary"
          >
            <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("flashcards.backToHub")}
          </Link>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
        >
          {t("flashcards.deckManager.refresh", "Refresh")}
        </button>
      </div>

      <p className="text-sm text-text-muted">
        {t("flashcards.deckManager.subtitle", "Manage subscription settings for {{language}} decks.", {
          language: languageName,
        })}
      </p>

      <StudyOptionsEditor decks={decks} />

      {decks.length === 0 ? (
        <div className="rounded-card border border-border bg-surface-muted p-8 text-center">
          <p className="text-text-muted">
            {t("flashcards.deckManager.noDecks", "No decks yet. Subscribe to a deck to manage settings.")}
          </p>
          {isCommunityEnabled(flags) ? (
            <Link
              to={langPath("community/explore")}
              className="mt-4 inline-block text-accent"
            >
              {t("flashcards.deckManager.browseDecks", "Browse community decks")}
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <FilterBar
            search={{
              label: t("flashcards.deckManager.search", "Search"),
              placeholder: t("flashcards.deckManager.searchPlaceholder", "Deck name…"),
              value: search,
              onChange: setSearch,
            }}
            filters={[]}
          />

          <p className="text-sm text-text-muted">
            {t("flashcards.deckManager.showing", "Showing {{count}} of {{total}} decks", {
              count: filtered.length,
              total: decks.length,
            })}
          </p>

          <DeckGroupSection
            title={t("flashcards.deckManager.sectionVocab", "My vocabulary")}
            description={t(
              "flashcards.deckManager.sectionVocabDesc",
              "Words you save (personal vocab deck)."
            )}
            studyGroupHref={`${reviewBase}?scope=vocab`}
            rows={vocabDecks}
            columns={columns}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            t={t}
          />

          <DeckGroupSection
            title={t("flashcards.deckManager.sectionLessons", "Lesson decks")}
            description={t(
              "flashcards.deckManager.sectionLessonsDesc",
              "Course-linked SRS — cards unlock as you complete lessons."
            )}
            studyGroupHref={`${reviewBase}?scope=lessons`}
            rows={lessonDecks}
            columns={columns}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            t={t}
          />

          <DeckGroupSection
            title={t("flashcards.deckManager.sectionOther", "Community & other")}
            description={t(
              "flashcards.deckManager.sectionOtherDesc",
              "Subscribed packs without course linkage."
            )}
            rows={otherDecks}
            columns={columns}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            t={t}
          />

          {filtered.length > 0 &&
            vocabDecks.length === 0 &&
            lessonDecks.length === 0 &&
            otherDecks.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t("flashcards.deckManager.noResults", "No decks match")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
