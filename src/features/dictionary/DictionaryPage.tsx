import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FacetSidebar, type Facet } from "@/shared/components/ui/FacetSidebar";
import { SearchInput, EmptyState, Badge } from "@/shared/components/ui";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import {
  getDictionaryEntries,
  getDictionaryLanguageIds,
  searchDictionary,
  type DictionaryEntry,
  type DictionarySource,
  type PartOfSpeech,
} from "@/shared/dictionary";
import { DictionaryEntrySheet } from "./DictionaryEntrySheet";
import { posLabel, sourceLabel, unlockModuleOrder } from "./dictionaryLabels";

/** How many browse rows to render before "show more" is required. */
const PAGE_SIZE = 60;
/** Cap on ranked search results. */
const SEARCH_LIMIT = 60;

const SOURCE_ORDER: DictionarySource[] = ["course", "both", "frequency"];

const SOURCE_BADGE: Record<DictionarySource, "neutral" | "accent" | "success"> = {
  course: "success",
  frequency: "accent",
  both: "accent",
};

function isLangId(id: string): boolean {
  return (AVAILABLE_LEARNING_LANGUAGE_IDS as readonly string[]).includes(id);
}

/** One scannable dictionary row: surface, reading, meaning, source/freq badge. */
function EntryRow({
  entry,
  onOpen,
  sourceText,
}: {
  entry: DictionaryEntry;
  onOpen: () => void;
  sourceText: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 text-left transition hover:border-accent hover:shadow-card"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="truncate text-lg font-semibold text-text-primary">
            {entry.surface}
          </span>
          {entry.reading && entry.reading !== entry.surface && (
            <span className="truncate text-xs text-text-muted">{entry.reading}</span>
          )}
        </p>
        <p className="truncate text-sm text-text-secondary">{entry.meaningEn}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {entry.frequencyRank != null && (
          <span className="text-[11px] tabular-nums text-text-muted">
            #{entry.frequencyRank}
          </span>
        )}
        <Badge variant={SOURCE_BADGE[entry.source]} size="sm" pill>
          {sourceText}
        </Badge>
      </div>
    </button>
  );
}

export function DictionaryPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langPath = useLangPath();
  const [searchParams, setSearchParams] = useSearchParams();

  const dictLangs = useMemo(() => getDictionaryLanguageIds(), []);
  const routeLang = language?.id ?? AVAILABLE_LEARNING_LANGUAGE_IDS[0];
  const initialLang = dictLangs.includes(routeLang) ? routeLang : dictLangs[0] ?? routeLang;
  const [viewLang, setViewLang] = useState(initialLang);

  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({
    pos: [],
    source: [],
    module: [],
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  // Whole-language entry list (frequency-sorted) — drives facet counts.
  const allEntries = useMemo(() => getDictionaryEntries(viewLang), [viewLang]);

  // Reset transient view state when the language changes.
  useEffect(() => {
    setSelections({ pos: [], source: [], module: [] });
    setQuery("");
    setVisibleCount(PAGE_SIZE);
    setOpenId(null);
  }, [viewLang]);

  // Deep link: ?word=ja:inu opens that entry.
  useEffect(() => {
    const word = searchParams.get("word");
    if (word) setOpenId(word);
  }, [searchParams]);

  const facets: Facet[] = useMemo(() => {
    const count = (pred: (e: DictionaryEntry) => boolean) =>
      allEntries.filter(pred).length;

    const posValues = [...new Set(allEntries.map((e) => e.pos))];
    const modules = [...new Set(allEntries.map((e) => e.unlockModule).filter(Boolean))]
      .map((m) => m as string)
      .sort((a, b) => unlockModuleOrder(a) - unlockModuleOrder(b));

    return [
      {
        id: "source",
        label: t("dictionary.facet.source", "Source"),
        options: SOURCE_ORDER.map((s) => ({
          value: s,
          label: sourceLabel(t, s),
          count: count((e) => e.source === s),
        })).filter((o) => o.count > 0),
      },
      {
        id: "pos",
        label: t("dictionary.facet.pos", "Part of speech"),
        options: posValues
          .map((p) => ({
            value: p,
            label: posLabel(t, p),
            count: count((e) => e.pos === p),
          }))
          .filter((o) => o.count > 0)
          .sort((a, b) => b.count - a.count),
      },
      {
        id: "module",
        label: t("dictionary.facet.module", "Unlocks at"),
        options: modules.map((m) => ({
          value: m,
          label: m,
          count: count((e) => e.unlockModule === m),
        })),
      },
    ];
  }, [allEntries, t]);

  // Browse list: feed pos/source straight into the service, then filter by
  // module membership client-side (same pattern as VocabPage's module facet).
  const browseEntries = useMemo(() => {
    const pos = selections.pos as PartOfSpeech[];
    const source = selections.source as DictionarySource[];
    const base = getDictionaryEntries(viewLang, {
      sort: "frequency",
      ...(pos.length ? { pos } : {}),
      ...(source.length ? { source } : {}),
    });
    const modules = selections.module ?? [];
    if (modules.length === 0) return base;
    const allowed = new Set(modules);
    return base.filter((e) => e.unlockModule != null && allowed.has(e.unlockModule));
  }, [viewLang, selections]);

  const trimmed = query.trim();
  const searchResults = useMemo(
    () =>
      trimmed ? searchDictionary(viewLang, trimmed, { limit: SEARCH_LIMIT }) : [],
    [viewLang, trimmed],
  );

  const isSearching = trimmed.length > 0;
  const rows = isSearching ? searchResults : browseEntries;
  const visible = isSearching ? rows : rows.slice(0, visibleCount);

  const openEntry =
    allEntries.find((e) => e.id === openId) ??
    searchResults.find((e) => e.id === openId) ??
    null;

  const toggle = (facetId: string, value: string) =>
    setSelections((s) => {
      const cur = s[facetId] ?? [];
      setVisibleCount(PAGE_SIZE);
      return {
        ...s,
        [facetId]: cur.includes(value)
          ? cur.filter((v) => v !== value)
          : [...cur, value],
      };
    });

  const closeSheet = () => {
    setOpenId(null);
    if (searchParams.get("word")) {
      const next = new URLSearchParams(searchParams);
      next.delete("word");
      setSearchParams(next, { replace: true });
    }
  };

  const langOptions = dictLangs
    .filter(isLangId)
    .map((id) => ({ value: id, label: id.toUpperCase() }));

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("dictionary.title", "Dictionary")}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t(
              "dictionary.subtitle",
              "Look up any word — course vocabulary and the frequency list, with readings, meanings, and conjugations.",
            )}
          </p>
        </div>
        {langOptions.length > 1 && (
          <SegmentedControl
            value={viewLang}
            onChange={setViewLang}
            options={langOptions}
            size="sm"
            ariaLabel={t("dictionary.languageSwitch", "Dictionary language")}
          />
        )}
      </header>

      <div className="mb-4">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("dictionary.searchPlaceholder", "Search word, reading, or meaning…")}
          aria-label={t("dictionary.searchLabel", "Search the dictionary")}
        />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="lg:w-60 lg:shrink-0">
          <FacetSidebar
            facets={facets}
            selections={selections}
            onToggle={toggle}
            onClear={(facetId) =>
              setSelections((s) => ({ ...s, [facetId]: [] }))
            }
            onClearAll={() =>
              setSelections({ pos: [], source: [], module: [] })
            }
            onOnly={(facetId, value) =>
              setSelections((s) => ({ ...s, [facetId]: [value] }))
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-3 text-sm text-text-muted">
            {isSearching
              ? t("dictionary.searchCount", "{{count}} results for “{{query}}”", {
                  count: rows.length,
                  query: trimmed,
                })
              : t("dictionary.browseCount", "Showing {{count}} of {{total}} words", {
                  count: Math.min(visible.length, rows.length),
                  total: allEntries.length,
                })}
          </p>

          {rows.length === 0 ? (
            <EmptyState
              icon={<Icon name="search" size={28} />}
              title={t("dictionary.noMatches.title", "No words found")}
              description={t(
                "dictionary.noMatches.body",
                "Try a different search or clear a filter.",
              )}
            />
          ) : (
            <>
              <ul className="space-y-2">
                {visible.map((entry) => (
                  <li key={entry.id}>
                    <EntryRow
                      entry={entry}
                      onOpen={() => setOpenId(entry.id)}
                      sourceText={sourceLabel(t, entry.source)}
                    />
                  </li>
                ))}
              </ul>

              {!isSearching && visible.length < rows.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-accent hover:text-accent"
                  >
                    {t("dictionary.showMore", "Show more")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DictionaryEntrySheet
        open={openEntry !== null}
        onClose={closeSheet}
        entry={openEntry}
        conjugationTo={
          openEntry?.conjugation ? langPath("practice/grammar/conjugation") : undefined
        }
      />
    </div>
  );
}
